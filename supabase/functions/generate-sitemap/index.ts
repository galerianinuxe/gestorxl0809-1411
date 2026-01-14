import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://xlata.site',
  'https://www.xlata.site',
  'http://localhost:8080',
  'http://localhost:5173',
  '.lovableproject.com',
  '.lovable.app',
]

// User agents de crawlers conhecidos
const ALLOWED_CRAWLERS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp', // Yahoo
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'applebot',
]

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const referer = req.headers.get('referer') || ''
  const userAgent = (req.headers.get('user-agent') || '').toLowerCase()
  
  // Verificar se é um crawler autorizado
  const isCrawler = ALLOWED_CRAWLERS.some(crawler => userAgent.includes(crawler))
  
  // Verificar se a origem é permitida
  const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed) || referer.startsWith(allowed) ||
    origin.includes(allowed) || referer.includes(allowed)
  )
  
  // Verificar se tem header secreto (para uso interno)
  const internalKey = req.headers.get('x-sitemap-key')
  const isInternalRequest = internalKey === Deno.env.get('SUPABASE_ANON_KEY')
  
  // Bloquear acesso direto não autorizado
  if (!isCrawler && !isAllowedOrigin && !isInternalRequest) {
    console.log(`[generate-sitemap] Blocked request - Origin: ${origin}, Referer: ${referer}, UA: ${userAgent.substring(0, 50)}`)
    return new Response(
      JSON.stringify({ error: 'Forbidden - Access denied' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const baseUrl = 'https://xlata.site'
  const now = new Date().toISOString().split('T')[0]

  // Fetch all data in parallel - only indexable and published content
  const [staticPagesRes, blogPosts, helpArticles, pillarPages, glossaryTerms] = await Promise.all([
    // Static pages from the new table - only those marked for sitemap
    supabase
      .from('static_pages_seo')
      .select('path, sitemap_priority, sitemap_changefreq, updated_at, canonical_url')
      .eq('include_in_sitemap', true)
      .eq('allow_indexing', true),
    // Blog posts - only published AND indexable
    supabase
      .from('blog_posts')
      .select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published')
      .eq('allow_indexing', true),
    // Help articles - only published AND indexable
    supabase
      .from('help_articles')
      .select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published')
      .eq('allow_indexing', true),
    // Pillar pages - only published AND indexable
    supabase
      .from('pillar_pages')
      .select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published')
      .eq('allow_indexing', true),
    // Glossary terms - only published AND indexable
    supabase
      .from('glossary_terms')
      .select('slug, updated_at, canonical_url, sitemap_priority, sitemap_changefreq')
      .eq('status', 'published')
      .eq('allow_indexing', true)
  ])

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  // Static pages from database
  for (const page of staticPagesRes.data || []) {
    const loc = page.canonical_url || `${baseUrl}${page.path}`
    const priority = page.sitemap_priority?.toString() || '0.5'
    const changefreq = page.sitemap_changefreq || 'monthly'
    const lastmod = page.updated_at?.split('T')[0] || now
    
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`
  }

  // Blog posts
  for (const post of blogPosts.data || []) {
    const loc = post.canonical_url || `${baseUrl}/blog/${post.slug}`
    const priority = post.sitemap_priority?.toString() || '0.7'
    const changefreq = post.sitemap_changefreq || 'weekly'
    
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${post.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`
  }

  // Help articles
  for (const article of helpArticles.data || []) {
    const loc = article.canonical_url || `${baseUrl}/ajuda/artigo/${article.slug}`
    const priority = article.sitemap_priority?.toString() || '0.6'
    const changefreq = article.sitemap_changefreq || 'monthly'
    
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${article.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`
  }

  // Pillar/Solution pages
  for (const page of pillarPages.data || []) {
    const loc = page.canonical_url || `${baseUrl}/solucoes/${page.slug}`
    const priority = page.sitemap_priority?.toString() || '0.8'
    const changefreq = page.sitemap_changefreq || 'weekly'
    
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${page.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`
  }

  // Glossary terms
  for (const term of glossaryTerms.data || []) {
    const loc = term.canonical_url || `${baseUrl}/glossario/${term.slug}`
    const priority = term.sitemap_priority?.toString() || '0.5'
    const changefreq = term.sitemap_changefreq || 'monthly'
    
    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${term.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`
  }

  xml += `</urlset>`

  // Log stats
  const stats = {
    static: staticPagesRes.data?.length || 0,
    blog: blogPosts.data?.length || 0,
    help: helpArticles.data?.length || 0,
    pillar: pillarPages.data?.length || 0,
    glossary: glossaryTerms.data?.length || 0
  }
  console.log(`[generate-sitemap] Generated sitemap with ${Object.values(stats).reduce((a, b) => a + b, 0)} URLs:`, stats)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
      'Access-Control-Allow-Origin': '*'
    }
  })
})