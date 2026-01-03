import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const baseUrl = 'https://xlata.site'
  const now = new Date().toISOString().split('T')[0]

  // Static pages with priority
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/landing', priority: '1.0', changefreq: 'daily' },
    { loc: '/login', priority: '0.7', changefreq: 'monthly' },
    { loc: '/register', priority: '0.8', changefreq: 'monthly' },
    { loc: '/planos', priority: '0.9', changefreq: 'weekly' },
    { loc: '/termos', priority: '0.5', changefreq: 'monthly' },
    { loc: '/blog', priority: '0.9', changefreq: 'daily' },
    { loc: '/ajuda', priority: '0.9', changefreq: 'weekly' },
    { loc: '/solucoes', priority: '0.9', changefreq: 'weekly' },
    { loc: '/glossario', priority: '0.8', changefreq: 'weekly' },
  ]

  // Fetch dynamic content in parallel
  const [blogPosts, helpArticles, pillarPages, glossaryTerms] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published'),
    supabase
      .from('help_articles')
      .select('slug, updated_at')
      .eq('status', 'published'),
    supabase
      .from('pillar_pages')
      .select('slug, updated_at')
      .eq('status', 'published'),
    supabase
      .from('glossary_terms')
      .select('slug, updated_at')
      .eq('status', 'published')
  ])

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
  }

  // Blog posts
  for (const post of blogPosts.data || []) {
    xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
  }

  // Help articles
  for (const article of helpArticles.data || []) {
    xml += `  <url>
    <loc>${baseUrl}/ajuda/artigo/${article.slug}</loc>
    <lastmod>${article.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`
  }

  // Pillar/Solution pages
  for (const page of pillarPages.data || []) {
    xml += `  <url>
    <loc>${baseUrl}/solucoes/${page.slug}</loc>
    <lastmod>${page.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`
  }

  // Glossary terms
  for (const term of glossaryTerms.data || []) {
    xml += `  <url>
    <loc>${baseUrl}/glossario/${term.slug}</loc>
    <lastmod>${term.updated_at?.split('T')[0] || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`
  }

  xml += `</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
})
