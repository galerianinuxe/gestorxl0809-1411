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

// Sanitize data for logging (remove sensitive information)
const sanitizeForLog = (data: any): any => {
  if (!data) return data;
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['access_token', 'authorization', 'token', 'password', 'secret', 'api_key'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Sanitize nested payer info
  if (sanitized.payer) {
    sanitized.payer = {
      ...sanitized.payer,
      email: sanitized.payer.email ? `${sanitized.payer.email.substring(0, 3)}***` : undefined,
      identification: sanitized.payer.identification ? { type: sanitized.payer.identification.type, number: '***' } : undefined
    };
  }
  
  return sanitized;
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth header for user identification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header provided')
    }

    const { payer, transaction_amount, description, external_reference, payment_method_id } = await req.json()

    // Validate required fields
    if (!payer || !transaction_amount || !description || !external_reference) {
      throw new Error('Missing required fields: payer, transaction_amount, description, external_reference')
    }

    if (!payer.name || !payer.email || !payer.phone || !payer.identification) {
      throw new Error('Missing required payer fields: name, email, phone, identification')
    }

    // Validate transaction amount (prevent negative or zero values)
    const amount = parseFloat(transaction_amount);
    if (isNaN(amount) || amount <= 0 || amount > 100000) {
      throw new Error('Invalid transaction amount: must be between 0.01 and 100000')
    }

    // Get Mercado Pago Access Token from Supabase secrets  
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error('Mercado Pago Access Token not configured')
    }

    console.log('Creating PIX payment:', {
      amount: transaction_amount,
      payer_email: payer.email ? `${payer.email.substring(0, 3)}***` : 'unknown',
      external_reference
    })

    // Clean and format phone number
    const cleanPhone = payer.phone.replace(/\D/g, '');
    const areaCode = cleanPhone.substring(0, 2);
    const phoneNumber = cleanPhone.substring(2);

    // Split full name into first and last name
    const fullName = payer.name.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Nome';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Sobrenome';

    // Create payment on Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description,
      payment_method_id,
      external_reference,
      payer: {
        first_name: firstName,
        last_name: lastName,
        email: payer.email.trim().toLowerCase(),
        phone: {
          area_code: areaCode,
          number: phoneNumber
        },
        identification: {
          type: payer.identification.type,
          number: payer.identification.number
        }
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-mercado-pago`
    }

    console.log('Payment data prepared (sanitized):', sanitizeForLog(paymentData))

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': external_reference
      },
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Mercado Pago API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      
      let errorMessage = 'Erro na API do Mercado Pago'
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.cause && errorData.cause.length > 0) {
        errorMessage = errorData.cause[0].description || errorMessage
      }
      
      throw new Error(`${errorMessage} (Status: ${response.status})`)
    }

    const paymentResult = await response.json()

    // Save payment info to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('mercado_pago_payments')
      .insert({
        payment_id: paymentResult.id,
        external_reference,
        status: paymentResult.status,
        transaction_amount: paymentResult.transaction_amount,
        payer_email: payer.email,
        payment_method_id: paymentResult.payment_method_id,
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
    }

    return new Response(
      JSON.stringify({
        id: paymentResult.id,
        status: paymentResult.status,
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating PIX payment:', error)
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
