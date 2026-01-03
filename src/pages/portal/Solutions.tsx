import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { usePillarPages } from '@/hooks/useContentPortal';

const Solutions = () => {
  const { pages, loading } = usePillarPages();

  const solutionIcons: Record<string, any> = {
    'sistema-para-deposito-de-reciclagem': Zap,
    'controle-de-caixa-para-deposito': BarChart3,
    'controle-de-despesas-e-categorias': Shield,
  };

  return (
    <PortalLayout>
      <SEOHead
        title="Soluções para Depósitos de Reciclagem - XLata"
        description="Conheça as soluções do XLata para gestão completa do seu depósito de reciclagem: controle de caixa, compra, venda por kg, relatórios e muito mais."
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs items={[{ label: 'Soluções' }]} />

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Pare de Perder Dinheiro no Seu Depósito
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            O XLata.site tem todas as ferramentas para você organizar o pátio, controlar o caixa e saber exatamente quanto está lucrando.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Quero organizar meu depósito
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Fácil de Usar</h3>
              <p className="text-sm text-muted-foreground">
                Interface simples e intuitiva, perfeita para o dia a dia do depósito.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Rápido</h3>
              <p className="text-sm text-muted-foreground">
                Registre compras e vendas em segundos, sem complicação.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Relatórios Claros</h3>
              <p className="text-sm text-muted-foreground">
                Veja exatamente quanto entrou, saiu e seu lucro em tempo real.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Solutions List */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Conheça Nossas Soluções</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pages.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Solutions when no pages exist */}
              {[
                {
                  slug: 'sistema-para-deposito-de-reciclagem',
                  headline: 'Sistema Completo para Depósito de Reciclagem',
                  subheadline: 'Gerencie todo o seu depósito em um só lugar: caixa, compras, vendas, estoque e relatórios.',
                },
                {
                  slug: 'controle-de-caixa-para-deposito',
                  headline: 'Controle de Caixa',
                  subheadline: 'Tenha controle total sobre entradas, saídas e saldo do seu caixa.',
                },
                {
                  slug: 'pdv-de-compra-de-materiais',
                  headline: 'PDV de Compra de Materiais',
                  subheadline: 'Registre compras de materiais de forma rápida e organizada.',
                },
                {
                  slug: 'venda-por-kg-e-calculo',
                  headline: 'Venda por KG',
                  subheadline: 'Calcule e registre vendas por peso com precisão.',
                },
                {
                  slug: 'projecao-de-lucro-por-estoque',
                  headline: 'Projeção de Lucro',
                  subheadline: 'Veja quanto você pode lucrar com base no seu estoque atual.',
                },
                {
                  slug: 'relatorios-de-compra-e-venda',
                  headline: 'Relatórios Completos',
                  subheadline: 'Acompanhe compras, vendas e resultados com relatórios claros.',
                },
              ].map((solution) => (
                <Link key={solution.slug} to={`/solucoes/${solution.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-xl">{solution.headline}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{solution.subheadline}</p>
                      <span className="text-primary font-medium inline-flex items-center gap-1">
                        Saiba mais
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pages.map((page) => (
                <Link key={page.id} to={`/solucoes/${page.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow hover:border-primary/50">
                    <CardHeader>
                      {page.hero_image && (
                        <img
                          src={page.hero_image}
                          alt={page.headline}
                          className="w-full h-40 object-cover rounded-md mb-4"
                        />
                      )}
                      <CardTitle className="text-xl">{page.headline}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{page.subheadline}</p>
                      <span className="text-primary font-medium inline-flex items-center gap-1">
                        Saiba mais
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Quanto você perdeu essa semana sem perceber?
              </h2>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Cada dia sem sistema é dinheiro jogado fora. Comece agora e pare de perder.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Parar de perder dinheiro agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/planos">
                  <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                    Ver Planos e Preços
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PortalLayout>
  );
};

export default Solutions;
