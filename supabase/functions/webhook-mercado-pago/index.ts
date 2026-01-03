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
      console.error('❌ MERCADOPAGO_WEBHOOK_SECRET not configured - rejecting webhook');
      return false;
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // IDEMPOTENCY CHECK FIRST - Check if subscription already exists for this payment
    const { data: existingPaymentSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('payment_reference', paymentId.toString())
      .maybeSingle()

    if (existingPaymentSub) {
      console.log(`ℹ️ Subscription already exists for payment ${paymentId} - webhook idempotent return`)
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

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
    
    console.log(`📋 Payment from MP: status=${paymentData.status}, external_reference=${paymentData.external_reference}`)

    // Update payment status in database
    const { error } = await supabase
      .from('mercado_pago_payments')
      .update({
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId)

    if (error) {
      console.error('❌ Error updating payment status:', error)
      throw error
    }

    console.log(`✅ Payment status updated to: ${paymentData.status}`)

    // If payment is approved, activate user subscription
    if (paymentData.status === 'approved') {
      console.log(`✅ Payment APPROVED! Activating subscription...`)
      
      await activateSubscription(supabase, {
        payment_id: paymentId.toString(),
        external_reference: paymentData.external_reference,
        payer_email: paymentData.payer?.email,
        transaction_amount: paymentData.transaction_amount
      })
    }

    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  } catch (error) {
    console.error('❌ Webhook error:', error)
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

async function activateSubscription(supabase: any, payment: any) {
  console.log(`🔑 Processing subscription activation for payment ${payment.payment_id}`)

  // CRITICAL: Check idempotency FIRST before any other operations
  const { data: existingPaymentSub } = await supabase
    .from('user_subscriptions')
    .select('id, payment_reference')
    .eq('payment_reference', payment.payment_id)
    .maybeSingle()

  if (existingPaymentSub) {
    console.log(`ℹ️ Subscription already activated for payment ${payment.payment_id}, skipping...`)
    return
  }

  const externalRef = payment.external_reference
  if (!externalRef) {
    console.error('❌ No external_reference found in payment')
    return
  }

  console.log(`📋 External reference: ${externalRef}`)

  // Parse external_reference: "user_UUID_plan_PLANTYPE"
  const parts = externalRef.split('_')
  if (parts.length < 4 || parts[0] !== 'user' || parts[2] !== 'plan') {
    console.error(`❌ Invalid external_reference format: ${externalRef}`)
    return
  }

  const userId = parts[1]
  const planTypeFromRef = parts.slice(3).join('_')

  console.log(`👤 User ID: ${userId}, Plan Type from ref: ${planTypeFromRef}`)

  // Verify user exists
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('id', userId)
    .single()

  if (userError || !userProfile) {
    console.error(`❌ User not found with ID: ${userId}`, userError)
    return
  }

  console.log(`👤 Found user: ${userProfile.name || userProfile.email}`)

  // Get plan details
  let planData = null
  let periodDays = 30

  const { data: planByType } = await supabase
    .from('subscription_plans')
    .select('*, period_days')
    .eq('plan_type', planTypeFromRef)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (planByType) {
    planData = planByType
    console.log(`✅ Found plan: ${planData.name}, period_days: ${planData.period_days}`)
  } else {
    const { data: planById } = await supabase
      .from('subscription_plans')
      .select('*, period_days')
      .eq('plan_id', planTypeFromRef)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (planById) {
      planData = planById
      console.log(`✅ Found plan by plan_id: ${planData.name}, period_days: ${planData.period_days}`)
    }
  }

  // Get period days
  if (planData?.period_days && planData.period_days > 0) {
    periodDays = planData.period_days
  } else {
    periodDays = getPeriodDaysByType(planTypeFromRef)
  }

  console.log(`📅 Final period days: ${periodDays}`)

  // Get existing active subscription to calculate remaining days BEFORE any changes
  const { data: existingActiveSub } = await supabase
    .from('user_subscriptions')
    .select('id, expires_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Calculate base date for new subscription
  const now = new Date()
  let baseDate = now

  // If user has an active subscription with future expiration, accumulate from that date
  if (existingActiveSub?.expires_at) {
    const existingExpires = new Date(existingActiveSub.expires_at)
    if (existingExpires > now) {
      baseDate = existingExpires
      console.log(`📅 User has ${Math.ceil((existingExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining, accumulating from: ${existingExpires.toISOString()}`)
    }
  }

  // Calculate expiration date first
  const expiresAt = new Date(baseDate)
  expiresAt.setDate(expiresAt.getDate() + periodDays)

  console.log(`📅 Creating subscription: ${baseDate.toISOString()} + ${periodDays} days = ${expiresAt.toISOString()}`)

  // Insert new subscription - this will be the active one
  const { data: newSub, error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_type: planData?.plan_type || planTypeFromRef,
      is_active: true,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_reference: payment.payment_id,
      payment_method: 'mercadopago_pix'
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      console.log(`ℹ️ Subscription already inserted by another process for payment ${payment.payment_id}`)
      return
    }
    console.error('❌ Error inserting subscription:', insertError)
    return
  }

  console.log(`✅ Subscription created! ID: ${newSub.id}, Expires: ${expiresAt.toISOString()}, Days: ${periodDays}`)

  // NOW deactivate all OTHER active subscriptions (after successful insert)
  const { error: deactivateError } = await supabase
    .from('user_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('id', newSub.id) // Don't deactivate the one we just created!

  if (deactivateError) {
    console.error('⚠️ Error deactivating old subscriptions:', deactivateError)
  } else {
    console.log(`🔄 Deactivated other active subscriptions for user ${userId}`)
  }
}

function getPeriodDaysByType(planType: string): number {
  const typeLower = planType?.toLowerCase() || ''

  if (typeLower.includes('trial') || typeLower.includes('weekly') || typeLower.includes('semanal')) {
    return 7
  }
  if (typeLower.includes('monthly') || typeLower.includes('mensal')) {
    return 30
  }
  if (typeLower.includes('quarterly') || typeLower.includes('trimestral')) {
    return 90
  }
  if (typeLower.includes('biannual') || typeLower.includes('semi') || typeLower.includes('semestral')) {
    return 180
  }
  if (typeLower.includes('annual') || typeLower.includes('anual') || typeLower.includes('yearly')) {
    return 365
  }
  if (typeLower.includes('triennial') || typeLower.includes('trienal')) {
    return 1095
  }

  console.warn(`⚠️ Unknown plan type '${planType}', defaulting to 30 days`)
  return 30
}
