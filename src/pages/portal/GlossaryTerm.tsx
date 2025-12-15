import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useGlossaryTerm, useGlossaryTerms } from '@/hooks/useContentPortal';

const GlossaryTerm = () => {
  const { slug } = useParams<{ slug: string }>();
  const { term, loading } = useGlossaryTerm(slug || '');
  const { terms: allTerms } = useGlossaryTerms();

  if (loading) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-10 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-6 bg-muted rounded w-full mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!term) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Termo não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O termo que você procura não existe ou foi removido.
          </p>
          <Link to="/glossario">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Glossário
            </Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  // Get related terms
  const relatedTerms = term.related_terms?.length
    ? allTerms.filter((t) => term.related_terms.includes(t.slug))
    : allTerms.filter((t) => t.id !== term.id).slice(0, 4);

  return (
    <PortalLayout>
      <SEOHead
        title={term.seo_title || `${term.term} - Glossário XLata`}
        description={term.seo_description || term.short_definition}
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Glossário', href: '/glossario' },
            { label: term.term },
          ]}
        />

        <article className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {term.term}
            </h1>
            <p className="text-xl text-muted-foreground">
              {term.short_definition}
            </p>
          </header>

          {/* Long Definition */}
          {term.long_definition && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Definição Completa</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p>{term.long_definition}</p>
              </div>
            </section>
          )}

          {/* Examples */}
          {term.examples && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Exemplos Práticos</h2>
              <Card className="bg-accent/50">
                <CardContent className="p-6">
                  <p className="whitespace-pre-line">{term.examples}</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Related Links */}
          {term.related_links && term.related_links.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Links Relacionados</h2>
              <div className="flex flex-wrap gap-2">
                {term.related_links.map((link: any, index: number) => (
                  <Link key={index} to={link.url}>
                    <Badge variant="outline" className="px-3 py-1 hover:bg-accent cursor-pointer">
                      {link.label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Terms */}
          {relatedTerms.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Termos Relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedTerms.slice(0, 4).map((relatedTerm) => (
                  <Link key={relatedTerm.id} to={`/glossario/${relatedTerm.slug}`}>
                    <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/50">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1">{relatedTerm.term}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedTerm.short_definition}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <Card className="bg-primary/5 border-primary/20 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">
                Aplique esse conhecimento no seu depósito
              </h3>
              <p className="text-muted-foreground mb-4">
                O XLata ajuda você a organizar compras, vendas e controle de caixa usando os termos corretos do setor.
              </p>
              <Link to="/register">
                <Button>
                  Começar Teste Grátis de 7 Dias
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t">
            <Link to="/glossario">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Glossário
              </Button>
            </Link>
          </div>
        </article>
      </div>
    </PortalLayout>
  );
};

export default GlossaryTerm;
