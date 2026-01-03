import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, HelpCircle, BookOpen, ArrowRight, Wallet, ShoppingCart, Package, BarChart3, Receipt, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useHelpCategories, useHelpArticles, useContentSearch } from '@/hooks/useContentPortal';

const moduleIcons: Record<string, any> = {
  caixa: Wallet,
  despesas: Receipt,
  compra: ShoppingCart,
  venda: Package,
  estoque: Package,
  relatorios: BarChart3,
  transacoes: Receipt,
  assinatura: Settings,
  geral: HelpCircle,
};

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { categories, loading: categoriesLoading } = useHelpCategories();
  const { articles, loading: articlesLoading } = useHelpArticles();
  const { results: searchResults } = useContentSearch(searchQuery);

  // Group articles by module
  const articlesByModule = articles.reduce((acc, article) => {
    const module = article.module || 'geral';
    if (!acc[module]) acc[module] = [];
    acc[module].push(article);
    return acc;
  }, {} as Record<string, typeof articles>);

  // Get "getting started" articles
  const gettingStartedArticles = articles.filter(
    a => a.category?.slug === 'comece-por-aqui' || a.module === 'geral'
  ).slice(0, 4);

  return (
    <PortalLayout>
      <SEOHead
        title="Central de Ajuda - XLata"
        description="Encontre respostas para suas dúvidas sobre o XLata. Tutoriais, guias passo a passo e soluções para problemas comuns."
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs items={[{ label: 'Ajuda' }]} />

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Central de Ajuda XLata
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Encontre respostas rápidas, tutoriais passo a passo e soluções para suas dúvidas.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar artigos de ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
            {searchQuery && searchResults.articles.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 p-2">
                {searchResults.articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/ajuda/artigo/${article.slug}`}
                    className="block p-2 hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <p className="font-medium text-sm text-white">{article.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{article.excerpt}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Getting Started */}
        {gettingStartedArticles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                Comece por Aqui
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gettingStartedArticles.map((article) => (
                <Link key={article.id} to={`/ajuda/artigo/${article.slug}`}>
                  <Card className="h-full bg-gray-800 border-gray-700 hover:shadow-md transition-shadow hover:border-emerald-500/50">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2 line-clamp-2 text-white">{article.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {article.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories by Module */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-white">Categorias por Módulo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(articlesByModule).map(([module, moduleArticles]) => {
              const IconComponent = moduleIcons[module] || HelpCircle;
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
                <Card key={module} className="bg-gray-800 border-gray-700 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-3 text-lg text-white">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <IconComponent className="h-5 w-5 text-emerald-400" />
                      </div>
                      {moduleNames[module] || module}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {moduleArticles.slice(0, 4).map((article) => (
                        <li key={article.id}>
                          <Link
                            to={`/ajuda/artigo/${article.slug}`}
                            className="text-sm text-gray-400 hover:text-emerald-400 transition-colors line-clamp-1"
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {moduleArticles.length > 4 && (
                      <Link
                        to={`/ajuda?module=${module}`}
                        className="inline-flex items-center text-sm text-emerald-400 mt-3 hover:underline"
                      >
                        Ver todos ({moduleArticles.length})
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* All Articles */}
        {!articlesLoading && articles.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-6 text-white">Todos os Artigos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <Link key={article.id} to={`/ajuda/artigo/${article.slug}`}>
                  <Card className="h-full bg-gray-800 border-gray-700 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2 line-clamp-2 text-white">{article.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {article.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!articlesLoading && articles.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">Nenhum artigo de ajuda publicado ainda.</p>
              <p className="text-sm text-gray-500 mt-2">
                Volte em breve para novos conteúdos!
              </p>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="mt-12 bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2 text-white">
              Travou em alguma coisa?
            </h3>
            <p className="text-gray-400 mb-4">
              O suporte do XLata resolve no WhatsApp. Manda um zap agora!
            </p>
            <a
              href="https://wa.me/5511963512105"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Preciso de ajuda agora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default HelpCenter;
