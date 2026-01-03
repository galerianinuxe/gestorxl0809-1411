import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface PortalLayoutProps {
  children: ReactNode;
}

export const PortalLayout = ({ children }: PortalLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Blog', href: '/blog' },
    { label: 'Ajuda', href: '/ajuda' },
    { label: 'Soluções', href: '/solucoes' },
    { label: 'Glossário', href: '/glossario' },
    { label: 'Planos', href: '/planos' },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/landing" className="flex items-center gap-2 group">
              <img
                src="/lovable-uploads/XLATALOGO.png"
                alt="XLata"
                className="h-8 w-auto group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                XLata
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-gray-300 hover:text-emerald-400 hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-emerald-400 hover:bg-gray-800">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/30 gap-1">
                  Teste Grátis 7 Dias
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-gray-300" /> : <Menu className="h-6 w-6 text-gray-300" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-800 animate-fade-in">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-800">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
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
      <footer className="border-t border-gray-800 bg-gray-900">
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
                <span className="font-bold text-xl bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                  XLata
                </span>
              </Link>
              <p className="text-sm text-gray-400">
                Sistema completo para gestão de depósitos de reciclagem. Controle de caixa, compra, venda por kg e muito mais.
              </p>
            </div>

            {/* Portal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Portal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
                <li><Link to="/ajuda" className="hover:text-emerald-400 transition-colors">Central de Ajuda</Link></li>
                <li><Link to="/solucoes" className="hover:text-emerald-400 transition-colors">Soluções</Link></li>
                <li><Link to="/glossario" className="hover:text-emerald-400 transition-colors">Glossário</Link></li>
              </ul>
            </div>

            {/* Produto */}
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/planos" className="hover:text-emerald-400 transition-colors">Planos e Preços</Link></li>
                <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Criar Conta</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Fazer Login</Link></li>
                <li><Link to="/termos-de-uso" className="hover:text-emerald-400 transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">📱</span>
                  (11) 96351-2105
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✉️</span>
                  contato@xlata.site
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} XLata - AIRK Soluções Digitais. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Mobile Fixed CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-40">
        <Link to="/register">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg" size="lg">
            Teste Grátis 7 Dias
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
