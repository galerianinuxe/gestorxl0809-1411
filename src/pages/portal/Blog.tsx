import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ArrowRight, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useBlogPosts, useBlogCategories, useContentSearch } from '@/hooks/useContentPortal';

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { posts, loading: postsLoading } = useBlogPosts();
  const { posts: featuredPosts } = useBlogPosts({ featured: true, limit: 3 });
  const { categories, loading: categoriesLoading } = useBlogCategories();
  const { results: searchResults, loading: searchLoading } = useContentSearch(searchQuery);

  const popularPosts = [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 5);

  return (
    <PortalLayout>
      <SEOHead
        title="Blog - Dicas e Guias para Depósitos de Reciclagem"
        description="Aprenda como organizar seu depósito de reciclagem, controlar caixa, compras, vendas por kg e muito mais. Dicas práticas e guias completos."
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs items={[{ label: 'Blog' }]} />

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Blog XLata
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Dicas práticas, guias completos e templates prontos para você organizar seu depósito de reciclagem e aumentar seus lucros.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar artigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && searchResults.posts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-10 p-2">
                {searchResults.posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="block p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <p className="font-medium text-sm">{post.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        {!categoriesLoading && categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Categorias</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link key={category.id} to={`/blog/categoria/${category.slug}`}>
                  <Badge variant="outline" className="px-4 py-2 hover:bg-accent cursor-pointer">
                    {category.icon && <span className="mr-2">{category.icon}</span>}
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Em Destaque
                </h2>
                <div className="grid gap-4">
                  {featuredPosts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {post.category && (
                                <Badge variant="secondary" className="mb-2">
                                  {post.category.name}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {post.reading_time_minutes} min de leitura
                                </span>
                              </div>
                            </div>
                            {post.og_image && (
                              <img
                                src={post.og_image}
                                alt={post.title}
                                className="w-32 h-24 object-cover rounded-md hidden sm:block"
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* All Posts */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Todos os Artigos</h2>
              {postsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Volte em breve para novos conteúdos!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {post.category && (
                                <Badge variant="secondary" className="mb-2">
                                  {post.category.name}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {post.reading_time_minutes} min de leitura
                                </span>
                                {post.published_at && (
                                  <span>
                                    {new Date(post.published_at).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {post.og_image && (
                              <img
                                src={post.og_image}
                                alt={post.title}
                                className="w-32 h-24 object-cover rounded-md hidden sm:block"
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* CTA Card */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Quer automatizar tudo isso?
                </h3>
                <p className="text-sm opacity-90 mb-4">
                  Use o XLata para organizar seu depósito de reciclagem em minutos.
                </p>
                <Link to="/register">
                  <Button variant="secondary" className="w-full">
                    Teste Grátis 7 Dias
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mais Lidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {popularPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <span className="text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {post.view_count} visualizações
                        </p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Blog;
