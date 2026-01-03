import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import sharp from "npm:sharp@0.33.5";

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
      blog: 'Create a professional blog header illustration',
      help: 'Create a clean tutorial illustration',
      pillar: 'Create an impactful hero banner illustration',
      glossary: 'Create a conceptual educational illustration'
    };

    const basePrompt = typePrompts[articleType] || typePrompts.blog;
    
    // Extract key themes from content
    const contentSummary = content?.substring(0, 300) || '';
    const keywordsList = keywords || '';

    const optimizedPrompt = `${basePrompt} for XLATA, a recycling management software.

Theme: "${title}"
${contentSummary ? `Context: ${contentSummary}` : ''}
${keywordsList ? `Related: ${keywordsList}` : ''}

CRITICAL RULES - ABSOLUTELY MUST FOLLOW:
1. NO TEXT whatsoever - absolutely NO words, NO letters, NO numbers, NO typography of any kind
2. NO logos, NO watermarks, NO brand marks
3. Pure visual illustration ONLY - no written content at all

Visual Style:
- Modern flat illustration with subtle gradients and depth
- Professional, clean, tech-inspired design
- Primary colors: emerald green (#10B981), dark tones (#1F2937, #111827)
- Industrial recycling elements: metal, gears, scales, trucks, recycling symbols
- 16:9 aspect ratio, ultra high resolution
- Leave bottom-right corner clean (space reserved for branding)
- Suitable for website hero section

This is an ILLUSTRATION, not a poster or banner with text. Generate pure visual artwork.`;

    console.log('Generating base image with prompt (no text)...');

    // Call Lovable AI to generate base image (without logo/text)
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

    console.log('Base image generated successfully');

    // ============ PROGRAMMATIC LOGO OVERLAY WITH SHARP ============
    console.log('Downloading XLATA logo for overlay...');
    
    // Download the XLATA logo
    const logoResponse = await fetch(XLATA_LOGO_URL);
    if (!logoResponse.ok) {
      console.error('Failed to download logo:', logoResponse.status);
      throw new Error('Failed to download XLATA logo');
    }
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoBuffer = Buffer.from(logoArrayBuffer);
    console.log('Logo downloaded, size:', logoBuffer.length, 'bytes');

    // Convert base64 image to buffer
    const base64Data = baseImageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log('Base image buffer size:', imageBuffer.length, 'bytes');

    // Get base image dimensions
    const baseMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = baseMetadata.width || 1024;
    const imageHeight = baseMetadata.height || 576;
    console.log('Base image dimensions:', imageWidth, 'x', imageHeight);

    // Calculate logo size (12% of image width)
    const logoTargetWidth = Math.floor(imageWidth * 0.12);
    console.log('Resizing logo to width:', logoTargetWidth);

    // Resize logo maintaining aspect ratio
    const resizedLogoBuffer = await sharp(logoBuffer)
      .resize(logoTargetWidth)
      .png()
      .toBuffer();
    
    // Get resized logo dimensions for positioning
    const logoMetadata = await sharp(resizedLogoBuffer).metadata();
    const logoWidth = logoMetadata.width || logoTargetWidth;
    const logoHeight = logoMetadata.height || logoTargetWidth;
    console.log('Resized logo dimensions:', logoWidth, 'x', logoHeight);

    // Calculate position (bottom-right with 20px padding)
    const padding = 20;
    const leftPosition = imageWidth - logoWidth - padding;
    const topPosition = imageHeight - logoHeight - padding;
    console.log('Logo position: left=', leftPosition, 'top=', topPosition);

    // Composite logo onto base image
    const finalImageBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: resizedLogoBuffer,
          left: leftPosition,
          top: topPosition,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();

    console.log('Logo overlay complete! Final image size:', finalImageBuffer.length, 'bytes');

    // ============ UPLOAD TO SUPABASE STORAGE ============
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const timestamp = Date.now();
    const slug = title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const fileName = `${articleType}/${slug}-${timestamp}.png`;

    console.log('Uploading final image to storage:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, finalImageBuffer, {
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

    console.log('Image uploaded successfully with XLATA logo:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        fileName: fileName,
        prompt: optimizedPrompt,
        logoApplied: true
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
