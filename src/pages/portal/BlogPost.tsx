import { useParams, Link } from 'react-router-dom';
import { Clock, Calendar, ArrowLeft, ArrowRight, Share2, Copy, Check, Eye, Tag, Facebook, Twitter, Linkedin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { sanitizeJsonLd } from '@/utils/sanitization';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { TableOfContents } from '@/components/portal/TableOfContents';
import { useBlogPost, useBlogPosts } from '@/hooks/useContentPortal';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading } = useBlogPost(slug || '');
  const { posts: relatedPosts } = useBlogPosts({ limit: 6 });
  const [copied, setCopied] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (post?.content_md) {
      const html = marked(post.content_md) as string;
      setHtmlContent(DOMPurify.sanitize(html));
    } else if (post?.content_html) {
      setHtmlContent(DOMPurify.sanitize(post.content_html));
    }
  }, [post]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || '');
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-32 mb-6"></div>
            <div className="h-10 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-5 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="h-80 bg-gray-700 rounded-2xl mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!post) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeft className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-white">Artigo não encontrado</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            O artigo que você procura não existe ou foi removido.
          </p>
          <Link to="/blog">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const filteredRelated = relatedPosts
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.seo_description,
    image: post.og_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: 'XLata',
    },
    publisher: {
      '@type': 'Organization',
      name: 'XLata',
      logo: {
        '@type': 'ImageObject',
        url: 'https://xlata.site/lovable-uploads/XLATALOGO.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://xlata.site/blog/${post.slug}`,
    },
  };

  return (
    <PortalLayout>
      <SEOHead
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt || ''}
        ogImage={post.og_image || undefined}
        ogType="article"
        publishedTime={post.published_at || undefined}
        modifiedTime={post.updated_at}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(schemaData) }}
      />

      <article>
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="container mx-auto px-4 py-8">
            <Breadcrumbs
              items={[
                { label: 'Blog', href: '/blog' },
                ...(post.category ? [{ label: post.category.name, href: `/blog/categoria/${post.category.slug}` }] : []),
                { label: post.title },
              ]}
            />

            <div className="max-w-4xl mx-auto text-center pt-8 pb-12">
              {post.category && (
                <Link to={`/blog/categoria/${post.category.slug}`}>
                  <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-4 py-1.5 text-sm border-0">
                    {post.category.name}
                  </Badge>
                </Link>
              )}
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white leading-tight animate-fade-in">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  {post.reading_time_minutes} min de leitura
                </span>
                {post.published_at && (
                  <span className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    {new Date(post.published_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  {post.view_count || 0} views
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.og_image && (
          <div className="container mx-auto px-4 -mt-4">
            <div className="max-w-5xl mx-auto">
              <img
                src={post.og_image}
                alt={post.title}
                className="w-full h-64 md:h-96 lg:h-[28rem] object-cover rounded-2xl shadow-2xl shadow-gray-900/50"
              />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Share Bar - Mobile */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-8 pb-8 border-b border-gray-700">
                <span className="text-sm text-gray-400 mr-2">Compartilhar:</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => shareOnSocial('facebook')}
                  className="h-9 w-9 rounded-full border-gray-700 bg-gray-800 hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => shareOnSocial('twitter')}
                  className="h-9 w-9 rounded-full border-gray-700 bg-gray-800 hover:bg-sky-900/50 hover:text-sky-400 hover:border-sky-500/50"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => shareOnSocial('linkedin')}
                  className="h-9 w-9 rounded-full border-gray-700 bg-gray-800 hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50"
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="h-9 w-9 rounded-full border-gray-700 bg-gray-800 hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-500/50"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Content */}
              <div
                className="prose prose-lg prose-invert max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-700 prose-h2:pb-2
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white
                  prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-gray-800 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-emerald-400 prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-gray-950 prose-pre:rounded-xl
                  prose-img:rounded-xl prose-img:shadow-lg
                  prose-ul:text-gray-300 prose-ol:text-gray-300
                  prose-li:marker:text-emerald-500
                  mb-12"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-10 pb-10 border-b border-gray-700">
                  <Tag className="h-4 w-4 text-gray-500" />
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-gray-700 text-gray-400 hover:bg-gray-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTA Box */}
              <Card className="bg-gradient-to-br from-emerald-600 to-emerald-500 border-0 shadow-xl shadow-emerald-900/30 mb-12 overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full" />
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/5 rounded-full" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-2xl mb-3 text-white">
                      Quer automatizar isso no seu depósito?
                    </h3>
                    <p className="text-emerald-100 mb-6 text-lg">
                      O XLata organiza tudo isso para você: caixa, compras, vendas por kg, relatórios e muito mais.
                    </p>
                    <Link to="/register">
                      <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold shadow-lg">
                        Começar Teste Grátis de 7 Dias
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Related Posts */}
              {filteredRelated.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6 text-white">Artigos Relacionados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredRelated.map((relatedPost) => (
                      <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                        <Card className="h-full group hover:shadow-lg transition-all duration-300 bg-gray-800 border-gray-700 hover:border-emerald-500/50 overflow-hidden">
                          {relatedPost.og_image && (
                            <div className="h-36 overflow-hidden">
                              <img
                                src={relatedPost.og_image}
                                alt={relatedPost.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            {relatedPost.category && (
                              <Badge className="mb-2 bg-emerald-500/20 text-emerald-400 text-xs border-0">
                                {relatedPost.category.name}
                              </Badge>
                            )}
                            <h3 className="font-semibold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                              {relatedPost.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                              <Clock className="h-3 w-3" />
                              {relatedPost.reading_time_minutes} min
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Share Card - Desktop */}
              <Card className="hidden lg:block bg-gray-800 border-gray-700 sticky top-24">
                <CardContent className="p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-emerald-400" />
                    Compartilhar
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => shareOnSocial('facebook')}
                      className="flex-1 h-10 rounded-lg border-gray-700 bg-gray-900 hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50"
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => shareOnSocial('twitter')}
                      className="flex-1 h-10 rounded-lg border-gray-700 bg-gray-900 hover:bg-sky-900/50 hover:text-sky-400 hover:border-sky-500/50"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => shareOnSocial('linkedin')}
                      className="flex-1 h-10 rounded-lg border-gray-700 bg-gray-900 hover:bg-blue-900/50 hover:text-blue-400 hover:border-blue-500/50"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      className="flex-1 h-10 rounded-lg border-gray-700 bg-gray-900 hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-500/50"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Table of Contents */}
              <div className="hidden lg:block">
                <TableOfContents content={htmlContent} />
              </div>
            </aside>
          </div>
        </div>
      </article>
    </PortalLayout>
  );
};

export default BlogPost;
