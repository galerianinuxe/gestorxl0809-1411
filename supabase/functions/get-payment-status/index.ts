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
      .select('payment_id, status, status_detail, payer_email, external_reference')
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
          console.log(`Payment ${payment_id} approved! Activating subscription...`)

          // Extract plan ID from external_reference
          const planId = data.external_reference
          if (!planId) {
            console.error('No external_reference (planId) found in payment')
          } else {
            // Get plan details
            const { data: planData, error: planError } = await supabase
              .from('subscription_plans')
              .select('period')
              .eq('id', planId)
              .single()

            if (planError || !planData) {
              console.error('Plan not found:', planError)
            } else {
              // Determine period days and plan type
              let periodDays = 30
              let planType = 'monthly'

              if (planData.period === '30 dias') {
                periodDays = 30
                planType = 'monthly'
              } else if (planData.period === '3 meses') {
                periodDays = 90
                planType = 'quarterly'
              } else if (planData.period === '1 ano') {
                periodDays = 365
                planType = 'annual'
              }

              console.log(`Plan details - Type: ${planType}, Days: ${periodDays}`)

              // Find user by email
              const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
              
              if (usersError) {
                console.error('Error listing users:', usersError)
              } else {
                const user = users.find(u => u.email === data.payer_email)
                
                if (!user) {
                  console.error(`User not found with email: ${data.payer_email}`)
                } else {
                  console.log(`User found: ${user.id} (${user.email})`)

                  // Check for existing active subscription
                  const { data: existingSubscription } = await supabase
                    .from('user_subscriptions')
                    .select('expires_at, is_active')
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
                  } else {
                    // Create new subscription from today
                    expiresAt = new Date()
                    expiresAt.setDate(expiresAt.getDate() + periodDays)
                    console.log(`Creating new subscription until ${expiresAt.toISOString()}`)
                  }

                  // Activate/update subscription
                  const { error: subError } = await supabase
                    .from('user_subscriptions')
                    .upsert({
                      user_id: user.id,
                      plan_type: planType,
                      is_active: true,
                      activated_at: new Date().toISOString(),
                      expires_at: expiresAt.toISOString(),
                      payment_reference: payment_id,
                      payment_method: 'mercadopago_pix'
                    }, {
                      onConflict: 'user_id'
                    })

                  if (subError) {
                    console.error('Error activating subscription:', subError)
                  } else {
                    console.log('✅ Subscription activated successfully!')
                  }
                }
              }
            }
          }
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