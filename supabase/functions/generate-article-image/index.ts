import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Logo XLATA oficial para overlay
const XLATA_LOGO_URL = 'https://xlata.site/lovable-uploads/XLATALOGO.png';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, articleType, keywords } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build optimized prompt based on article type
    const typePrompts: Record<string, string> = {
      blog: 'Create a professional blog header image',
      help: 'Create a clean and helpful tutorial illustration',
      pillar: 'Create an impactful hero banner image',
      glossary: 'Create a conceptual educational illustration'
    };

    const basePrompt = typePrompts[articleType] || typePrompts.blog;
    
    // Extract key themes from content
    const contentSummary = content?.substring(0, 500) || '';
    const keywordsList = keywords || '';

    const optimizedPrompt = `${basePrompt} for a recycling industry software company called XLATA.

Title/Theme: "${title}"
${contentSummary ? `Context: ${contentSummary}` : ''}
${keywordsList ? `Keywords: ${keywordsList}` : ''}

XLATA is a management system for recycling centers (ferro velho, depósito de reciclagem) in Brazil.

Style Requirements:
- Professional, modern, and tech-inspired design
- Clean composition with industrial recycling elements
- Primary colors: emerald green (#10B981), dark tones (#1F2937, #111827)
- Include subtle elements like: recycling symbols, metal materials, scales, trucks, software interfaces
- Ultra high resolution, 16:9 aspect ratio
- Leave the bottom-right corner relatively clean for logo overlay
- DO NOT include any text, logos, or watermarks in the image
- Modern flat illustration style with depth and subtle gradients
- Professional quality suitable for website hero section`;

    console.log('Generating image with prompt:', optimizedPrompt.substring(0, 200) + '...');

    // Call Lovable AI to generate image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: optimizedPrompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes para geração de imagem.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    // Extract base image from response
    const baseImageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!baseImageData) {
      console.error('No image in AI response:', JSON.stringify(aiData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Base image generated, adding XLATA logo overlay...');

    // Second call: Add XLATA logo overlay to the generated image
    const logoOverlayResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Add the XLATA logo (from the second image) to the bottom-right corner of the first image.
                
Requirements:
- Position the logo in the bottom-right corner with approximately 20-30px padding from edges
- Make the logo approximately 12-15% of the image width
- Maintain the logo's original colors and any transparency
- Integrate the logo smoothly without covering important content
- Keep the rest of the image EXACTLY as it is - do not modify anything else
- The logo should look professional and subtle, not overwhelming`
              },
              {
                type: 'image_url',
                image_url: { url: baseImageData }
              },
              {
                type: 'image_url',
                image_url: { url: XLATA_LOGO_URL }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    let finalImageData = baseImageData; // Fallback to base image if overlay fails

    if (logoOverlayResponse.ok) {
      const logoOverlayData = await logoOverlayResponse.json();
      const overlayedImage = logoOverlayData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (overlayedImage) {
        finalImageData = overlayedImage;
        console.log('Logo overlay applied successfully');
      } else {
        console.warn('Logo overlay response did not contain image, using base image');
      }
    } else {
      console.warn('Logo overlay request failed, using base image without logo:', logoOverlayResponse.status);
    }

    // Upload final image to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract base64 data from final image (with logo)
    const base64Data = finalImageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate unique filename
    const timestamp = Date.now();
    const slug = title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const fileName = `${articleType}/${slug}-${timestamp}.png`;

    console.log('Uploading image to storage:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload image', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        fileName: fileName,
        prompt: optimizedPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-article-image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
