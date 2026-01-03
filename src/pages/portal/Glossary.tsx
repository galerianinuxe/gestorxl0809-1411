import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { SEOHead } from '@/components/portal/SEOHead';
import { Breadcrumbs } from '@/components/portal/Breadcrumbs';
import { useGlossaryTerms, useContentSearch } from '@/hooks/useContentPortal';

const Glossary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { terms, loading } = useGlossaryTerms();
  const { results: searchResults } = useContentSearch(searchQuery);

  // Group terms by first letter
  const groupedTerms = terms.reduce((acc, term) => {
    const firstLetter = term.term[0].toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(term);
    return acc;
  }, {} as Record<string, typeof terms>);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const availableLetters = Object.keys(groupedTerms);

  return (
    <PortalLayout>
      <SEOHead
        title="Glossário de Reciclagem - Termos e Definições | XLata"
        description="Glossário completo de termos usados em depósitos de reciclagem. Aprenda o significado de palavras como tara, sucata, material misto e muito mais."
      />

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs items={[{ label: 'Glossário' }]} />

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Glossário de Reciclagem
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Termos e definições usados no dia a dia de depósitos de reciclagem. Aprenda o significado de cada palavra.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar termos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && searchResults.terms.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-10 p-2">
                {searchResults.terms.map((term) => (
                  <Link
                    key={term.id}
                    to={`/glossario/${term.slug}`}
                    className="block p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <p className="font-medium text-sm">{term.term}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{term.short_definition}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alphabet Navigation */}
        <nav className="mb-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max justify-center">
            {alphabet.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                  availableLetters.includes(letter)
                    ? 'hover:bg-primary hover:text-primary-foreground'
                    : 'text-muted-foreground/50 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!availableLetters.includes(letter)) {
                    e.preventDefault();
                  }
                }}
              >
                {letter}
              </a>
            ))}
          </div>
        </nav>

        {/* Terms List */}
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-muted rounded w-12 mb-4"></div>
                <div className="grid gap-4">
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : terms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum termo publicado ainda.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Volte em breve para novos conteúdos!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {alphabet.map((letter) => {
              const letterTerms = groupedTerms[letter];
              if (!letterTerms || letterTerms.length === 0) return null;

              return (
                <section key={letter} id={`letter-${letter}`}>
                  <h2 className="text-3xl font-bold text-primary mb-6 border-b pb-2">
                    {letter}
                  </h2>
                  <div className="grid gap-4">
                    {letterTerms.map((term) => (
                      <Link key={term.id} to={`/glossario/${term.slug}`}>
                        <Card className="hover:shadow-md transition-shadow hover:border-primary/50">
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-1">{term.term}</h3>
                            <p className="text-muted-foreground line-clamp-2">
                              {term.short_definition}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">
              Quer usar esses termos na prática?
            </h3>
            <p className="text-muted-foreground mb-4">
              O XLata.site organiza tara, pesagem, preço por kg e tudo mais automaticamente.
            </p>
            <Link to="/register">
              <Button>
                Ver sistema funcionando
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Glossary;
