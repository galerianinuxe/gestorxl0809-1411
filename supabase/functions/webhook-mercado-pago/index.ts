import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://xlata.site',
  'https://www.xlata.site',
  'https://oxawvjcckmbevjztyfgp.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000'
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

// Sanitize webhook data for logging
const sanitizeForLog = (data: any): any => {
  if (!data) return data;
  const sanitized = { ...data };
  
  if (sanitized.payer_email) {
    sanitized.payer_email = `${sanitized.payer_email.substring(0, 3)}***`;
  }
  
  return sanitized;
};

// Validate webhook signature using HMAC-SHA256
const validateWebhookSignature = async (
  xSignature: string,
  xRequestId: string,
  dataId: string
): Promise<boolean> => {
  try {
    const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
    if (!secret) {
      console.warn('⚠️ MERCADOPAGO_WEBHOOK_SECRET not configured - webhook validation skipped');
      // In development, allow without secret
      return Deno.env.get('ENVIRONMENT') !== 'production';
    }

    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.substring(3);
    const hash = parts.find(p => p.startsWith('v1='))?.substring(3);
    
    if (!ts || !hash) {
      console.error('❌ Invalid signature format - missing ts or hash');
      return false;
    }

    // Validate timestamp (reject webhooks older than 5 minutes)
    const timestampMs = parseInt(ts) * 1000;
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.error('❌ Webhook timestamp too old or in future:', { 
        webhook_ts: new Date(timestampMs).toISOString(), 
        now: new Date(now).toISOString() 
      });
      return false;
    }

    // Create manifest string according to Mercado Pago docs
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Generate HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(manifest);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const computedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const isValid = computedHash === hash;
    
    if (!isValid) {
      console.error('❌ Webhook signature mismatch:', { 
        computed: computedHash.substring(0, 10) + '...', 
        received: hash.substring(0, 10) + '...' 
      });
    } else {
      console.log('✅ Webhook signature validated successfully');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error validating webhook signature:', error);
    return false;
  }
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate webhook signature
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    const webhookData = await req.json()
    
    if (xSignature && xRequestId && webhookData.data?.id) {
      const isValid = await validateWebhookSignature(xSignature, xRequestId, webhookData.data.id);
      if (!isValid) {
        console.error('❌ Invalid webhook signature - rejecting request');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (Deno.env.get('ENVIRONMENT') === 'production') {
      // In production, require signature headers
      console.error('❌ Missing signature headers in production');
      return new Response(
        JSON.stringify({ error: 'Missing signature headers' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📥 Webhook received (sanitized):', sanitizeForLog(webhookData))

    // Only process payment notifications
    if (webhookData.type !== 'payment') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const paymentId = webhookData.data.id
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    // Get payment details from Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch payment: ${response.status}`)
    }

    const paymentData = await response.json()
    
    // Update payment status in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase
      .from('mercado_pago_payments')
      .update({
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId)

    if (error) {
      console.error('Error updating payment status:', error)
      throw error
    }

    // If payment is approved, activate user subscription
    if (paymentData.status === 'approved') {
      console.log(`✅ Payment approved!`, {
        payment_id: paymentId,
        external_reference: paymentData.external_reference,
        amount: paymentData.transaction_amount,
        payer: sanitizeForLog({ email: paymentData.payer.email })
      })
      
      // Extract plan info from external_reference
      // Format can be: user_<userId>_plan_<planType> OR plan_<id>_<timestamp>
      const externalRef = paymentData.external_reference
      let planType = 'monthly'
      let periodDays = 30
      
      // Check for new format: user_xxx_plan_monthly
      const planTypeMatch = externalRef?.match(/_plan_(.+)$/)
      // Check for old format: plan_xxx_timestamp
      const oldFormatMatch = externalRef?.match(/^plan_([^_]+)_/)
      
      if (planTypeMatch || oldFormatMatch) {
        const extractedPlanId = planTypeMatch ? planTypeMatch[1] : oldFormatMatch?.[1]
        console.log(`📦 Processing plan activation:`, { external_ref: externalRef, extracted_plan: extractedPlanId })
        
        // Get payment record to find user email
        const { data: paymentRecord, error: paymentError } = await supabase
          .from('mercado_pago_payments')
          .select('payer_email')
          .eq('payment_id', paymentId)
          .single()
        
        if (paymentError) {
          console.error(`❌ Failed to fetch payment record:`, paymentError)
          throw paymentError
        }
        
        if (paymentRecord?.payer_email) {
          console.log(`👤 Looking for user:`, { email: sanitizeForLog({ email: paymentRecord.payer_email }) })
          
          // Find user by email via auth.users (using Service Role)
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
          
          if (authError) {
            console.error(`❌ Failed to list auth users:`, authError)
            throw authError
          }
          
          const user = authUsers?.users.find(u => u.email === paymentRecord.payer_email)
          
          if (!user?.id) {
            console.error(`❌ User not found for email:`, sanitizeForLog({ email: paymentRecord.payer_email }))
            throw new Error('User not found')
          }
          
          console.log(`✅ User found:`, { user_id: user.id })
          
          // Fetch plan data from subscription_plans - try by plan_type first, then by plan_id
          let planData = null
          
          // Try by plan_type (monthly, quarterly, annual)
          const { data: planByType, error: planByTypeError } = await supabase
            .from('subscription_plans')
            .select('period, plan_id, plan_type')
            .eq('plan_type', extractedPlanId)
            .single()
          
          if (planByType && !planByTypeError) {
            planData = planByType
          } else {
            // Fallback: try by plan_id (mensal, trimestral, anual)
            const { data: planById, error: planByIdError } = await supabase
              .from('subscription_plans')
              .select('period, plan_id, plan_type')
              .eq('plan_id', extractedPlanId)
              .single()
            
            if (planById && !planByIdError) {
              planData = planById
            }
          }
          
          if (planData) {
            planType = planData.plan_type || 'monthly'
            // Extract days from period field ('/30 dias', '/3 meses', '/1 ano')
            if (planData.period?.includes('7 dias')) {
              periodDays = 7
            } else if (planData.period?.includes('30 dias')) {
              periodDays = 30
            } else if (planData.period?.includes('3 meses')) {
              periodDays = 90
            } else if (planData.period?.includes('6 meses')) {
              periodDays = 180
            } else if (planData.period?.includes('1 ano')) {
              periodDays = 365
            } else if (planData.period?.includes('3 anos') || planData.period?.includes('5 anos')) {
              periodDays = 1095
            }
            console.log(`📅 Plan details:`, { plan_id: planData.plan_id, plan_type: planType, period: planData.period, period_days: periodDays })
          } else {
            console.warn(`⚠️ Plan not found in database, using defaults:`, { extracted_plan: extractedPlanId, period_days: periodDays })
          }
          
          // Check for existing active subscription
          const { data: existingSub } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single()
          
          let expiresAt = new Date()
          let activatedAt = new Date()
          
          if (existingSub && new Date(existingSub.expires_at) > new Date()) {
            // JÁ TEM ASSINATURA ATIVA - SOMAR DIAS
            expiresAt = new Date(existingSub.expires_at)
            expiresAt.setDate(expiresAt.getDate() + periodDays)
            activatedAt = new Date(existingSub.activated_at)
            
            console.log(`➕ Extending existing subscription from ${existingSub.expires_at} to ${expiresAt.toISOString()}`)
          } else {
            // NOVA ASSINATURA - CONTAR A PARTIR DE HOJE
            expiresAt.setDate(expiresAt.getDate() + periodDays)
            
            console.log(`🆕 Creating new subscription until ${expiresAt.toISOString()}`)
          }
          
          // Create or update user subscription
          const { error: subError } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: user.id,
              plan_type: planType,
              is_active: true,
              activated_at: activatedAt.toISOString(),
              expires_at: expiresAt.toISOString(),
              payment_reference: paymentId.toString(),
              payment_method: 'mercadopago_pix'
            }, {
              onConflict: 'user_id'
            })
          
          if (subError) {
            console.error(`❌ Failed to activate subscription:`, {
              error: subError,
              user_id: user.id,
              plan_type: planType,
              expires_at: expiresAt.toISOString()
            })
            throw subError
          } else {
            console.log(`🎉 Subscription activated successfully!`, {
              user_id: user.id,
              plan_type: planType,
              period_days: periodDays,
              expires_at: expiresAt.toISOString(),
              payment_ref: paymentId
            })
          }
        }
      }
    }

    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
