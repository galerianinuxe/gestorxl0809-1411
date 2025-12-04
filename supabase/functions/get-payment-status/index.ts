import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id } = await req.json()

    if (!payment_id) {
      throw new Error('Payment ID is required')
    }

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
      console.error('Database error:', error)
      throw error
    }

    if (!data) {
      throw new Error('Payment not found')
    }

    // If status is still pending, check with Mercado Pago API
    if (data.status === 'pending') {
      console.log(`[FALLBACK] Payment ${payment_id} is pending, checking with Mercado Pago API...`)
      
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      if (!accessToken) {
        console.error('[FALLBACK] MERCADOPAGO_ACCESS_TOKEN not configured')
        // Return current status from DB even if can't check API
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

        console.log(`[FALLBACK] Mercado Pago API response - Status: ${newStatus}, Detail: ${newStatusDetail}`)

        // Update payment status in database
        await supabase
          .from('mercado_pago_payments')
          .update({
            status: newStatus,
            status_detail: newStatusDetail,
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', payment_id)

        console.log(`[FALLBACK] Database updated with new status: ${newStatus}`)

        // If approved, activate subscription
        if (newStatus === 'approved') {
          await activateSubscription(supabase, data, payment_id)
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
        console.error(`Mercado Pago API error: ${mpResponse.status}`)
      }
    }

    // If payment is already approved but subscription might not be activated, try to activate
    if (data.status === 'approved') {
      console.log(`Payment ${payment_id} is approved, checking if subscription needs activation...`)
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
    console.error('Error getting payment status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function activateSubscription(supabase: any, data: any, payment_id: string) {
  console.log(`Payment ${payment_id} approved! Activating subscription...`)

  // Parse external_reference to extract plan_id
  // Format: user_{userId}_plan_{planId}
  const externalRef = data.external_reference
  if (!externalRef) {
    console.error('No external_reference found in payment')
    return
  }

  console.log(`External reference: ${externalRef}`)

  // Extract plan_id from external_reference
  const planIdMatch = externalRef.match(/_plan_(.+)$/)
  const planId = planIdMatch ? planIdMatch[1] : null

  if (!planId) {
    console.error('Could not extract plan_id from external_reference:', externalRef)
    return
  }

  console.log(`Extracted plan_id: ${planId}`)

  // Get plan details using plan_id column
  const { data: planData, error: planError } = await supabase
    .from('subscription_plans')
    .select('period, plan_type, plan_id')
    .eq('plan_id', planId)
    .single()

  if (planError || !planData) {
    console.error('Plan not found with plan_id:', planId, planError)
    return
  }

  // Determine period days
  let periodDays = 30
  const planType = planData.plan_type || 'monthly'

  // Parse period from plan data
  const period = planData.period || ''
  if (period.includes('7 dias')) {
    periodDays = 7
  } else if (period.includes('30 dias')) {
    periodDays = 30
  } else if (period.includes('3 meses')) {
    periodDays = 90
  } else if (period.includes('6 meses')) {
    periodDays = 180
  } else if (period.includes('1 ano')) {
    periodDays = 365
  } else if (period.includes('3 anos') || period.includes('5 anos')) {
    periodDays = 1095
  }

  console.log(`Plan details - Type: ${planType}, Days: ${periodDays}, Period: ${period}`)

  // Find user by email
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('Error listing users:', usersError)
    return
  }

  const user = users.find((u: any) => u.email === data.payer_email)
  
  if (!user) {
    console.error(`User not found with email: ${data.payer_email}`)
    return
  }

  console.log(`User found: ${user.id} (${user.email})`)

  // Check if subscription already exists with this payment
  const { data: existingPaymentSub } = await supabase
    .from('user_subscriptions')
    .select('id, payment_reference')
    .eq('payment_reference', payment_id)
    .single()

  if (existingPaymentSub) {
    console.log(`Subscription already activated for this payment: ${payment_id}`)
    return
  }

  // Check for existing active subscription
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('id, expires_at, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  let expiresAt: Date
  const now = new Date()

  if (existingSubscription && new Date(existingSubscription.expires_at) > now) {
    // Extend existing subscription
    expiresAt = new Date(existingSubscription.expires_at)
    expiresAt.setDate(expiresAt.getDate() + periodDays)
    console.log(`Extending existing subscription to ${expiresAt.toISOString()}`)
    
    // Update existing subscription
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        plan_type: planType,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        payment_reference: payment_id,
        payment_method: 'mercadopago_pix'
      })
      .eq('id', existingSubscription.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
    } else {
      console.log('✅ Subscription extended successfully!')
    }
  } else {
    // Create new subscription from today
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + periodDays)
    console.log(`Creating new subscription until ${expiresAt.toISOString()}`)

    // Insert new subscription
    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_type: planType,
        is_active: true,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_reference: payment_id,
        payment_method: 'mercadopago_pix'
      })

    if (insertError) {
      console.error('Error inserting subscription:', insertError)
    } else {
      console.log('✅ Subscription activated successfully!')
    }
  }
}
