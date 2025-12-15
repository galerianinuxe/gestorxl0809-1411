import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useHelpArticle, useHelpArticles } from '@/hooks/useContentPortal';

const HelpArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { article, loading } = useHelpArticle(slug || '');
  const { articles: relatedArticles } = useHelpArticles({ module: article?.module });
  const [htmlContent, setHtmlContent] = useState('');
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    if (article?.content_md) {
      const html = marked(article.content_md) as string;
      setHtmlContent(DOMPurify.sanitize(html));
    } else if (article?.content_html) {
      setHtmlContent(DOMPurify.sanitize(article.content_html));
    }
  }, [article]);

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

  if (!article) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O artigo que você procura não existe ou foi removido.
          </p>
          <Link to="/ajuda">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Central de Ajuda
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const moduleNames: Record<string, string> = {
    caixa: 'Controle de Caixa',
    despesas: 'Despesas',
    compra: 'PDV de Compra',
    venda: 'Venda por KG',
    estoque: 'Estoque e Projeção',
    relatorios: 'Relatórios',
    transacoes: 'Transações',
    assinatura: 'Conta e Assinatura',
    geral: 'Geral',
  };

  return (
    <PortalLayout>
      <SEOHead
        title={article.seo_title || `${article.title} - Ajuda XLata`}
        description={article.seo_description || article.excerpt || ''}
        ogImage={article.og_image || undefined}
      />

      <article className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Ajuda', href: '/ajuda' },
            ...(article.category ? [{ label: article.category.name, href: `/ajuda/categoria/${article.category.slug}` }] : []),
            { label: article.title },
          ]}
        />

        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.module && (
                <Badge variant="outline">
                  {moduleNames[article.module] || article.module}
                </Badge>
              )}
              {article.category && (
                <Badge variant="secondary">
                  {article.category.name}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.reading_time_minutes} min de leitura
              </span>
              <span>
                Atualizado em {new Date(article.updated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </header>

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Feedback */}
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <p className="font-medium mb-4">Este artigo foi útil?</p>
              <div className="flex justify-center gap-4">
                <Button
                  variant={feedback === 'yes' ? 'default' : 'outline'}
                  onClick={() => setFeedback('yes')}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Sim
                </Button>
                <Button
                  variant={feedback === 'no' ? 'default' : 'outline'}
                  onClick={() => setFeedback('no')}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Não
                </Button>
              </div>
              {feedback && (
                <p className="text-sm text-muted-foreground mt-4">
                  Obrigado pelo feedback!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Related Articles */}
          {relatedArticles.length > 1 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Artigos Relacionados</h2>
              <div className="grid gap-4">
                {relatedArticles
                  .filter((a) => a.id !== article.id)
                  .slice(0, 3)
                  .map((relatedArticle) => (
                    <Link key={relatedArticle.id} to={`/ajuda/artigo/${relatedArticle.slug}`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h3 className="font-medium">{relatedArticle.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {relatedArticle.excerpt}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">
                Precisa de ajuda personalizada?
              </h3>
              <p className="text-muted-foreground mb-4">
                Entre em contato conosco pelo WhatsApp para suporte direto.
              </p>
              <a
                href="https://wa.me/5511963512105"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  Falar no WhatsApp
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-8 border-t">
            <Link to="/ajuda">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Central de Ajuda
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </PortalLayout>
  );
};

export default HelpArticle;
