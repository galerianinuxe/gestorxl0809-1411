import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ResponsiveNavigation from '../ResponsiveNavigation';

interface PortalLayoutProps {
  children: ReactNode;
}

export const PortalLayout = ({ children }: PortalLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - usando ResponsiveNavigation */}
      <ResponsiveNavigation companyPhone="(11) 96351-2105" />

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
