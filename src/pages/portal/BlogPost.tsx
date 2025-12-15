import { useParams, Link } from 'react-router-dom';
import { Clock, Calendar, ArrowLeft, ArrowRight, Share2, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
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
  const { posts: relatedPosts } = useBlogPosts({ limit: 3 });
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

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!post) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O artigo que você procura não existe ou foi removido.
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <article className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Blog', href: '/blog' },
            ...(post.category ? [{ label: post.category.name, href: `/blog/categoria/${post.category.slug}` }] : []),
            { label: post.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <header className="mb-8">
              {post.category && (
                <Link to={`/blog/categoria/${post.category.slug}`}>
                  <Badge variant="secondary" className="mb-4">
                    {post.category.name}
                  </Badge>
                </Link>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.reading_time_minutes} min de leitura
                </span>
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.published_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  className="ml-auto"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-1" />
                  )}
                  {copied ? 'Copiado!' : 'Compartilhar'}
                </Button>
              </div>
            </header>

            {/* Featured Image */}
            {post.og_image && (
              <img
                src={post.og_image}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
              />
            )}

            {/* Content */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* CTA Box */}
            <Card className="bg-primary/5 border-primary/20 mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Quer automatizar isso no seu depósito?
                </h3>
                <p className="text-muted-foreground mb-4">
                  O XLata organiza tudo isso para você: caixa, compras, vendas por kg, relatórios e muito mais.
                </p>
                <Link to="/register">
                  <Button>
                    Começar Teste Grátis de 7 Dias
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Artigos Relacionados</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts
                    .filter((p) => p.id !== post.id)
                    .slice(0, 3)
                    .map((relatedPost) => (
                      <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                        <Card className="h-full hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <h3 className="font-medium line-clamp-2 mb-2">
                              {relatedPost.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {relatedPost.excerpt}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - TOC */}
          <aside className="hidden lg:block">
            <TableOfContents content={htmlContent} />
          </aside>
        </div>
      </article>
    </PortalLayout>
  );
};

export default BlogPost;
