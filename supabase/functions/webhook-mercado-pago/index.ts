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
    const webhookData = await req.json()
    console.log('Webhook received:', webhookData)

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
      console.log(`Payment ${paymentId} approved! Activating subscription...`)
      
      // Extract plan info from external_reference (format: plan_<id>_<timestamp>)
      const externalRef = paymentData.external_reference
      if (externalRef?.startsWith('plan_')) {
        const planId = externalRef.split('_')[1]
        
        // Get payment record to find user email
        const { data: paymentRecord } = await supabase
          .from('mercado_pago_payments')
          .select('payer_email')
          .eq('payment_id', paymentId)
          .single()
        
        if (paymentRecord?.payer_email) {
          // Find user by email
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', paymentRecord.payer_email)
            .single()
          
          if (profile?.id) {
            // Determine subscription period based on plan
            let periodDays = 30 // default monthly
            let planType = 'monthly'
            
            if (planId === 'quarterly') {
              periodDays = 90
              planType = 'quarterly'
            } else if (planId === 'annual') {
              periodDays = 365
              planType = 'annual'
            }
            
            // Create or update user subscription
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + periodDays)
            
            const { error: subError } = await supabase
              .from('user_subscriptions')
              .upsert({
                user_id: profile.id,
                plan_type: planType,
                is_active: true,
                expires_at: expiresAt.toISOString(),
                payment_reference: paymentId
              })
            
            if (subError) {
              console.error('Error activating subscription:', subError)
            } else {
              console.log(`Subscription activated for user ${profile.id}`)
            }
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