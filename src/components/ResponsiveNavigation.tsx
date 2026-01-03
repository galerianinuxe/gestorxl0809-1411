import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu,
  X,
  LogIn,
  CreditCard,
  Zap,
  Home,
  FileText,
  HelpCircle,
  Phone,
  Star,
  Users,
  Shield,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SystemLogo from './SystemLogo';
import { useSystemLogo } from '@/hooks/useSystemLogo';

interface ResponsiveNavigationProps {
  logoUrl?: string;
  companyName?: string;
  companyPhone: string;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  logoUrl,
  companyName,
  companyPhone
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { getCompanyName } = useSystemLogo();

  // Use system settings or fallback to props
  const displayCompanyName = companyName || getCompanyName();

  const navigationItems = [
    {
      title: "Início",
      href: "/",
      icon: Home,
      description: "Página inicial"
    },
    {
      title: "Planos",
      href: "/planos",
      icon: CreditCard,
      description: "Veja nossos planos e preços"
    },
    {
      title: "Guia Completo",
      href: "/guia-completo",
      icon: HelpCircle,
      description: "Tutorial completo do sistema"
    },
    {
      title: "Termos de Uso",
      href: "/termos-de-uso",
      icon: FileText,
      description: "Termos e condições"
    }
  ];

  const features = [
    {
      title: "+130 Depósitos",
      icon: Users,
      description: "Já pararam de perder dinheiro"
    },
    {
      title: "Suporte no Zap",
      icon: Phone,
      description: "Travou? A gente resolve"
    },
    {
      title: "100% Seguro",
      icon: Shield,
      description: "Seus dados protegidos"
    },
    {
      title: "5 Estrelas",
      icon: Star,
      description: "Nota dos clientes"
    }
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Gostaria de saber mais sobre o Sistema XLata.site. Podem me ajudar?`);
    window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
  };

  return (
    <header className="bg-black/90 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between py-4">
          {/* Logo */}
          <SystemLogo size="md" showCompanyName={true} />

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-gray-800 data-[state=open]:bg-gray-800">
                  Navegação
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[500px] grid-cols-2">
                    {navigationItems.map((item) => (
                      <NavigationMenuLink
                        key={item.title}
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                        onClick={() => handleNavigation(item.href)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <item.icon className="h-4 w-4" />
                          <div className="text-sm font-medium leading-none">{item.title}</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-gray-800 data-[state=open]:bg-gray-800">
                  Por Que Escolher
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px] grid-cols-2">
                    {features.map((feature) => (
                      <div key={feature.title} className="flex flex-col items-center text-center gap-3 p-2 rounded-md hover:bg-gray-100">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{feature.title}</div>
                          <div className="text-xs text-gray-600">{feature.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsApp}
              className="text-white hover:bg-gray-800 hover:text-white"
            >
              <Phone className="mr-2 h-4 w-4" />
              Contato
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="bg-transparent border border-white text-white hover:bg-white/10 hover:text-white hover:border-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Entrar
            </Button>
            <Button
              onClick={() => navigate('/register')}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Zap className="mr-2 h-4 w-4" />
              Parar de Perder
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between py-3">
          {/* Mobile Logo - Centralizado */}
          <div className="flex-1 flex justify-center">
            <SystemLogo size="sm" />
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 p-2 absolute right-4">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 bg-gray-900 border-gray-700 p-0">
              <div className="h-full overflow-y-auto">
                {/* Mobile Header with Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <SystemLogo size="sm" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <div className="p-4 space-y-6">
                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleNavigation('/register')}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-xl"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Começar a Lucrar
                    </Button>
                    <Button
                      onClick={() => handleNavigation('/login')}
                      variant="outline"
                      className="w-full bg-transparent border border-white text-white hover:bg-white/10 hover:text-white hover:border-white"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Já tenho conta
                    </Button>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-2">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Menu</h3>
                    {navigationItems.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => handleNavigation(item.href)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-white hover:bg-gray-800 transition-colors text-left"
                      >
                        <item.icon className="h-5 w-5 text-green-400" />
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-400">{item.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wide">Vantagens</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {features.map((feature) => (
                        <div key={feature.title} className="flex flex-col items-center text-center gap-3 p-2 rounded-lg">
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <feature.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{feature.title}</div>
                            <div className="text-gray-400 text-xs">{feature.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Contact */}
                  <div className="pt-4">
                    <Button
                      onClick={handleWhatsApp}
                      variant="outline"
                      className="w-full bg-transparent border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Falar no WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default ResponsiveNavigation;
