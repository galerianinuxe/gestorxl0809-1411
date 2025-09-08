import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  User, 
  Settings, 
  BarChart3, 
  Archive, 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  BookOpen,
  LogOut,
  Shield,
  Plus,
  Wallet,
  ClipboardList,
  Users,
  PhoneCall,
  AlertCircle,
  Crown,
  Zap
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { getActiveCashRegister } from '@/utils/supabaseStorage';
import SystemLogo from './SystemLogo';

interface AppSidebarProps {
  isAdmin?: boolean;
  subscription?: any;
  onOpenCashRegister?: () => void;
}

export function AppSidebar({ 
  isAdmin = false, 
  subscription, 
  onOpenCashRegister
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleCashRegisterAction = async () => {
    try {
      const activeCashRegister = await getActiveCashRegister();
      
      if (activeCashRegister && activeCashRegister.status === 'open') {
        // Se o caixa está aberto, navegar para o PDV
        console.log('✅ Caixa aberto, redirecionando para PDV');
        navigate('/');
      } else {
        // Se o caixa está fechado, chamar a função de abertura
        console.log('❌ Caixa fechado, abrindo modal de abertura');
        if (onOpenCashRegister) {
          onOpenCashRegister();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do caixa:', error);
      // Em caso de erro, tentar abrir o modal de abertura
      if (onOpenCashRegister) {
        onOpenCashRegister();
      }
    }
  };

  const quickAccessItems = [
    { 
      title: "Abrir Caixa", 
      icon: Plus, 
      action: handleCashRegisterAction,
      color: "bg-green-600 hover:bg-green-700 text-white",
      show: true
    },
    { 
      title: "Dashboard", 
      icon: BarChart3, 
      href: "/dashboard",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      show: true
    },
    { 
      title: "Estoque", 
      icon: Archive, 
      href: "/current-stock",
      color: "bg-orange-600 hover:bg-orange-700 text-white",
      show: true
    },
    { 
      title: "Materiais", 
      icon: ClipboardList, 
      href: "/materiais",
      color: "bg-purple-600 hover:bg-purple-700 text-white",
      show: true
    },
    { 
      title: "Configurações", 
      icon: Settings, 
      href: "/configuracoes",
      color: "bg-gray-600 hover:bg-gray-700 text-white",
      show: true
    },
  ];

  const navigationItems = [
    { title: "Ordens de Compra", icon: ShoppingCart, href: "/purchase-orders" },
    { title: "Ordens de Venda", icon: TrendingUp, href: "/sales-orders" },
    { title: "Transações", icon: FileText, href: "/transactions" },
    { title: "Despesas", icon: DollarSign, href: "/expenses" },
    { title: "Adições de Caixa", icon: Wallet, href: "/cash-additions" },
    { title: "Fluxo Diário", icon: Calendar, href: "/daily-flow" },
  ];

  const systemItems = [
    { title: "Guia Completo", icon: BookOpen, href: "/guia-completo" },
    { title: "Planos", icon: Crown, href: "/planos" },
    { title: "Sistema de Indicações", icon: Users, href: "/sistema-indicacoes" },
    { title: "Relatar Erro", icon: AlertCircle, href: "/relatar-erro" },
  ];

  const adminItems = [
    { title: "Painel Admin", icon: Shield, href: "/covildomal" },
  ];

  const handleAction = (action?: () => void) => {
    if (action) action();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const renderMenuItem = (item: any, isQuickAccess = false) => {
    const baseClass = isQuickAccess 
      ? `${item.color} mb-2 rounded-lg p-3 w-full text-left transition-all duration-200 hover:scale-105`
      : "text-gray-300 hover:text-white hover:bg-gray-800 p-3 w-full text-left rounded-lg transition-colors";

    if (item.href) {
      return (
        <NavLink
          key={item.title}
          to={item.href}
          className={({ isActive }) => 
            `${baseClass} block no-underline ${isActive && !isQuickAccess ? 'bg-gray-800 text-white' : ''}`
          }
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className={isQuickAccess ? "font-medium" : ""}>{item.title}</span>}
          </div>
        </NavLink>
      );
    } else {
      return (
        <button
          key={item.title}
          onClick={() => handleAction(item.action)}
          className={baseClass}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className={isQuickAccess ? "font-medium" : ""}>{item.title}</span>}
          </div>
        </button>
      );
    }
  };

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-64'} bg-gray-900 border-r border-gray-700`}>
      <SidebarContent className="bg-gray-900">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <SystemLogo size="sm" />
            {!collapsed && (
              <span className="text-white font-bold text-lg">Sistema PDV</span>
            )}
          </div>
        </div>

        {/* Acesso Rápido */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">
            {!collapsed && "Acesso Rápido"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickAccessItems.filter(item => item.show).map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item, true)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navegação Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">
            {!collapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sistema */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">
            {!collapsed && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400">
              {!collapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Subscription Status */}
        {subscription && !collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-3 bg-gray-800 rounded-lg mx-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {subscription.plan_type === 'trial' ? 'Teste' : 'Ativo'}
                  </Badge>
                  <Zap className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-xs text-gray-400">
                  Expira em: {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Logout */}
        <div className="mt-auto p-3 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}