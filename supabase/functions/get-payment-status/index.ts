import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id } = await req.json()

    if (!payment_id) {
      throw new Error('Payment ID is required')
    }

    console.log(`🔍 Checking payment status for: ${payment_id}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get payment status from database
    const { data, error } = await supabase
      .from('mercado_pago_payments')
      .select('payment_id, status, status_detail, payer_email, external_reference, transaction_amount')
      .eq('payment_id', payment_id)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    if (!data) {
      throw new Error('Payment not found')
    }

    console.log(`📋 Local payment status: ${data.status}, external_reference: ${data.external_reference}`)

    // If status is still pending, check with Mercado Pago API
    if (data.status === 'pending') {
      console.log(`🔄 Payment ${payment_id} is pending, checking with Mercado Pago API...`)
      
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      if (!accessToken) {
        console.error('❌ MERCADOPAGO_ACCESS_TOKEN not configured')
        return new Response(
          JSON.stringify({
            id: data.payment_id,
            status: data.status,
            status_detail: data.status_detail
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Check payment status with Mercado Pago API
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (mpResponse.ok) {
        const paymentData = await mpResponse.json()
        const newStatus = paymentData.status
        const newStatusDetail = paymentData.status_detail

        console.log(`📡 Mercado Pago API response - Status: ${newStatus}, Detail: ${newStatusDetail}`)

        // Update payment status in database
        await supabase
          .from('mercado_pago_payments')
          .update({
            status: newStatus,
            status_detail: newStatusDetail,
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', payment_id)

        console.log(`✅ Database updated with new status: ${newStatus}`)

        // If approved, activate subscription
        if (newStatus === 'approved') {
          await activateSubscription(supabase, { ...data, status: newStatus }, payment_id)
        }

        return new Response(
          JSON.stringify({
            id: payment_id,
            status: newStatus,
            status_detail: newStatusDetail
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else {
        console.error(`⚠️ Mercado Pago API error: ${mpResponse.status}`)
      }
    }

    // If payment is already approved but subscription might not be activated, try to activate
    if (data.status === 'approved') {
      console.log(`✅ Payment ${payment_id} is approved, checking if subscription needs activation...`)
      await activateSubscription(supabase, data, payment_id)
    }

    // Return current status from database
    return new Response(
      JSON.stringify({
        id: data.payment_id,
        status: data.status,
        status_detail: data.status_detail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error getting payment status:', error)
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function activateSubscription(supabase: any, data: any, payment_id: string) {
  console.log(`🔑 Processing subscription activation for payment ${payment_id}`)

  // Parse external_reference to extract user_id and plan_type
  // Format: user_{userId}_plan_{planType}
  const externalRef = data.external_reference
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
  const planTypeFromRef = parts.slice(3).join('_') // Handle plan types like "semi_annual"

  console.log(`👤 User ID: ${userId}, Plan Type from ref: ${planTypeFromRef}`)

  // Check idempotency - subscription already exists for this payment?
  const { data: existingPaymentSub } = await supabase
    .from('user_subscriptions')
    .select('id, payment_reference')
    .eq('payment_reference', payment_id)
    .maybeSingle()

  if (existingPaymentSub) {
    console.log(`ℹ️ Subscription already activated for payment ${payment_id}, skipping...`)
    return
  }

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

  // Get plan details - USE period_days column as source of truth
  let planData = null
  let periodDays = 30 // Default fallback

  // Strategy 1: Search by plan_type + is_active (most common case)
  console.log(`🔍 Strategy 1: Looking for plan with plan_type='${planTypeFromRef}' and is_active=true`)
  const { data: planByType, error: planByTypeError } = await supabase
    .from('subscription_plans')
    .select('*, period_days')
    .eq('plan_type', planTypeFromRef)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (planByType && !planByTypeError) {
    planData = planByType
    console.log(`✅ Found plan by plan_type: ${planData.name}, period: ${planData.period}, period_days: ${planData.period_days}`)
  } else {
    // Strategy 2: Search by plan_id
    console.log(`🔍 Strategy 2: Looking for plan with plan_id='${planTypeFromRef}'`)
    const { data: planById, error: planByIdError } = await supabase
      .from('subscription_plans')
      .select('*, period_days')
      .eq('plan_id', planTypeFromRef)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (planById && !planByIdError) {
      planData = planById
      console.log(`✅ Found plan by plan_id: ${planData.name}, period: ${planData.period}, period_days: ${planData.period_days}`)
    }
  }

  // Get period days - PRIORITIZE period_days column
  if (planData) {
    // Use period_days column if available (source of truth)
    if (planData.period_days && planData.period_days > 0) {
      periodDays = planData.period_days
      console.log(`📅 Using period_days column: ${periodDays} days`)
    } else {
      // Fallback to parsing period string or plan_type
      periodDays = calculatePeriodDays(planData.period, planData.plan_type)
      console.log(`📅 Calculated period days from string: ${periodDays} days`)
    }
    console.log(`📅 Plan details - Name: ${planData.name}, Period: ${planData.period}, Final Days: ${periodDays}`)
  } else {
    // No plan found - use fallback based on plan_type from external_reference
    periodDays = getPeriodDaysByType(planTypeFromRef)
    console.log(`⚠️ No plan found in DB, using fallback: ${periodDays} days for type: ${planTypeFromRef}`)
  }

  // Check for existing active subscription
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('id, expires_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let expiresAt: Date
  const now = new Date()

  if (existingSubscription && new Date(existingSubscription.expires_at) > now) {
    // Extend existing subscription
    expiresAt = new Date(existingSubscription.expires_at)
    expiresAt.setDate(expiresAt.getDate() + periodDays)
    console.log(`📅 Extending existing subscription: ${existingSubscription.expires_at} + ${periodDays} days = ${expiresAt.toISOString()}`)
    
    // Deactivate old subscription
    await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('id', existingSubscription.id)
  } else {
    // Create new subscription from today
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + periodDays)
    console.log(`📅 Creating new subscription: ${now.toISOString()} + ${periodDays} days = ${expiresAt.toISOString()}`)
  }

  // Insert new subscription
  const { data: newSub, error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_type: planData?.plan_type || planTypeFromRef,
      is_active: true,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_reference: payment_id,
      payment_method: 'mercadopago_pix'
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error inserting subscription:', insertError)
  } else {
    console.log(`✅ Subscription activated successfully! ID: ${newSub.id}, Expires: ${expiresAt.toISOString()}, Period: ${periodDays} days`)
  }
}

// Fallback function to parse period string
function calculatePeriodDays(period: string, planType: string): number {
  const periodLower = period?.toLowerCase() || ''

  if (periodLower.includes('7 dias') || periodLower.includes('semanal') || periodLower.includes('semana')) {
    return 7
  }
  if (periodLower.includes('30 dias') || periodLower.includes('mensal') || periodLower.includes('mês') || periodLower.includes('mes') || periodLower.includes('/30')) {
    return 30
  }
  if (periodLower.includes('90 dias') || periodLower.includes('trimestral') || periodLower.includes('3 meses') || periodLower.includes('/3')) {
    return 90
  }
  if (periodLower.includes('180 dias') || periodLower.includes('semestral') || periodLower.includes('6 meses') || periodLower.includes('/6')) {
    return 180
  }
  if (periodLower.includes('365 dias') || periodLower.includes('anual') || periodLower.includes('12 meses') || periodLower.includes('1 ano') || periodLower.includes('/1 ano') || periodLower.includes('/12')) {
    return 365
  }
  if (periodLower.includes('1095 dias') || periodLower.includes('trienal') || periodLower.includes('3 anos')) {
    return 1095
  }

  // Fallback by plan_type
  return getPeriodDaysByType(planType)
}

// Fallback function based on plan_type string
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

  // Default: monthly
  console.warn(`⚠️ Unknown plan type '${planType}', defaulting to 30 days`)
  return 30
}
