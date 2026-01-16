import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu,
  X,
  LogIn,
  Zap,
  ChevronRight,
  Home,
  CreditCard,
  PlayCircle,
  Newspaper,
  Phone,
  HelpCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SystemLogo from './SystemLogo';

interface ResponsiveNavigationProps {
  logoUrl?: string;
  companyName?: string;
  companyPhone: string;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  companyPhone
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

const navigationItems = [
    { title: "Início", href: "/landing", icon: Home },
    { title: "Planos", href: "/planos", icon: CreditCard },
    { title: "Como Funciona", href: "/landing#videos", icon: PlayCircle },
    { title: "Blog", href: "/blog", icon: Newspaper },
    { title: "Contato", href: "#contato", icon: Phone, isWhatsApp: true },
    { title: "Ajuda", href: "/ajuda", icon: HelpCircle },
  ];

  const handleNavigation = (item: typeof navigationItems[0]) => {
    if (item.isWhatsApp) {
      const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre o Sistema XLata.site.`);
      window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
      setIsOpen(false);
      return;
    }
    
    if (item.href.includes('#')) {
      const [path, hash] = item.href.split('#');
      if (location.pathname === path || (path === '/landing' && location.pathname === '/')) {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(item.href);
      }
    } else {
      navigate(item.href);
    }
    setIsOpen(false);
  };

  const isActive = (href: string) => {
    // Links com âncoras (#) e WhatsApp nunca ficam ativos
    if (href.includes('#')) {
      return false;
    }
    
    // Início - apenas /landing ou /
    if (href === '/landing') {
      return location.pathname === '/' || location.pathname === '/landing';
    }
    
    // Match exato ou sub-rotas
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header className="bg-gray-950/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-between h-16">
          {/* Logo */}
          <SystemLogo size="md" showCompanyName={true} />

          {/* Center Navigation Links */}
          <div className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => handleNavigation(item)}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group flex items-center gap-1.5 ${
                    isActive(item.href) 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                  <span 
                    className={`absolute bottom-0 left-0 h-0.5 bg-green-500 transition-all duration-300 ${
                      isActive(item.href) 
                        ? 'w-full' 
                        : 'w-0 group-hover:w-full'
                    }`} 
                  />
                </button>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </Button>
            <Button
              onClick={() => navigate('/register')}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5"
            >
              <Zap className="mr-2 h-4 w-4" />
              Teste Grátis
            </Button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="lg:hidden flex items-center justify-between h-14">
          {/* Logo */}
          <SystemLogo size="sm" />

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-gray-950 border-gray-800 p-0">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <SystemLogo size="sm" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex flex-col h-[calc(100%-65px)]">
                {/* Primary CTA */}
                <div className="p-4 border-b border-gray-800">
                  <Button
                    onClick={() => navigate('/register')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Teste Grátis 7 Dias
                  </Button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 py-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        onClick={() => handleNavigation(item)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 group ${
                          isActive(item.href)
                            ? 'bg-gray-800/50 text-white'
                            : 'text-gray-200 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                          <span className="font-medium group-hover:text-white transition-colors">{item.title}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-all duration-200 ${
                          isActive(item.href)
                            ? 'text-green-400'
                            : 'text-gray-500 group-hover:text-green-400 group-hover:translate-x-1'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-800 mt-auto">
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    className="w-full bg-transparent border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white h-11"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Já tenho conta
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
};

export default ResponsiveNavigation;
