import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface PortalLayoutProps {
  children: ReactNode;
}

export const PortalLayout = ({ children }: PortalLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Blog', href: '/blog' },
    { label: 'Ajuda', href: '/ajuda' },
    { label: 'Soluções', href: '/solucoes' },
    { label: 'Glossário', href: '/glossario' },
    { label: 'Planos', href: '/planos' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/landing" className="flex items-center gap-2">
              <img
                src="/lovable-uploads/XLATALOGO.png"
                alt="XLata"
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl text-primary">XLata</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="gap-1">
                  Teste Grátis 7 Dias
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-4 px-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">
                      Teste Grátis 7 Dias
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/landing" className="flex items-center gap-2">
                <img
                  src="/lovable-uploads/XLATALOGO.png"
                  alt="XLata"
                  className="h-8 w-auto"
                />
                <span className="font-bold text-xl text-primary">XLata</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Sistema completo para gestão de depósitos de reciclagem. Controle de caixa, compra, venda por kg e muito mais.
              </p>
            </div>

            {/* Portal */}
            <div>
              <h4 className="font-semibold mb-4">Portal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/ajuda" className="hover:text-primary transition-colors">Central de Ajuda</Link></li>
                <li><Link to="/solucoes" className="hover:text-primary transition-colors">Soluções</Link></li>
                <li><Link to="/glossario" className="hover:text-primary transition-colors">Glossário</Link></li>
              </ul>
            </div>

            {/* Produto */}
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/planos" className="hover:text-primary transition-colors">Planos e Preços</Link></li>
                <li><Link to="/register" className="hover:text-primary transition-colors">Criar Conta</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Fazer Login</Link></li>
                <li><Link to="/termos-de-uso" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>WhatsApp: (11) 96351-2105</li>
                <li>contato@xlata.site</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} XLata - AIRK Soluções Digitais. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Mobile Fixed CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-40">
        <Link to="/register">
          <Button className="w-full" size="lg">
            Teste Grátis 7 Dias
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
