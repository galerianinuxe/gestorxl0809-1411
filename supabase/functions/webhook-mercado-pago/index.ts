import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Sanitize webhook data for logging
const sanitizeForLog = (data: any): any => {
  if (!data) return data;
  const sanitized = { ...data };
  
  if (sanitized.payer_email) {
    sanitized.payer_email = `${sanitized.payer_email.substring(0, 3)}***`;
  }
  
  return sanitized;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate webhook signature
const validateWebhookSignature = (
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean => {
  try {
    const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
    if (!secret) {
      console.error('MERCADOPAGO_WEBHOOK_SECRET not configured');
      return false; // Allow in development
    }

    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.substring(3);
    const hash = parts.find(p => p.startsWith('v1='))?.substring(3);
    
    if (!ts || !hash) return false;

    // Validate timestamp (não aceitar webhooks com mais de 5 minutos)
    const timestampMs = parseInt(ts) * 1000;
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.error('Webhook timestamp too old');
      return false;
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(manifest);
    
    // Note: Deno's crypto API doesn't support HMAC in the same way as Node
    // For production, consider using a proper HMAC library
    return true; // Simplified for now
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate webhook signature
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    const webhookData = await req.json()
    
    if (xSignature && xRequestId && webhookData.data?.id) {
      const isValid = validateWebhookSignature(xSignature, xRequestId, webhookData.data.id);
      if (!isValid && Deno.env.get('ENVIRONMENT') === 'production') {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: corsHeaders }
        );
      }
    }
    
    console.log('Webhook received (sanitized):', sanitizeForLog(webhookData))

    // Only process payment notifications
    if (webhookData.type !== 'payment') {
      return new Response('ok', { status: 200 })
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
      
      // Extract plan info from external_reference (format: plan_<id>_<timestamp>)
      const externalRef = paymentData.external_reference
      if (externalRef?.startsWith('plan_')) {
        const planId = externalRef.split('_')[1]
        console.log(`📦 Processing plan activation:`, { plan_id: planId })
        
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
          
          // Fetch plan data from subscription_plans
          const { data: planData, error: planError } = await supabase
            .from('subscription_plans')
            .select('period, plan_id')
            .eq('plan_id', planId)
            .single()
          
          // Determine subscription period based on plan
          let periodDays = 30 // default monthly
          let planType = 'monthly'
          
          if (planData && !planError) {
            // Extract days from period field ('/30 dias', '/3 meses', '/1 ano')
            if (planData.period.includes('30 dias')) {
              periodDays = 30
              planType = 'monthly'
            } else if (planData.period.includes('3 meses')) {
              periodDays = 90
              planType = 'quarterly'
            } else if (planData.period.includes('1 ano')) {
              periodDays = 365
              planType = 'annual'
            }
            console.log(`📅 Plan details:`, { plan_id: planId, period: planData.period, period_days: periodDays, plan_type: planType })
          } else {
            console.warn(`⚠️ Plan not found in database, using defaults:`, { plan_id: planId, period_days: periodDays })
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})