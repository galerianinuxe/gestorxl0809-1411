import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
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
        console.log('✅ Caixa aberto, redirecionando para PDV');
        navigate('/');
      } else {
        console.log('❌ Caixa fechado, abrindo modal de abertura');
        if (onOpenCashRegister) {
          onOpenCashRegister();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do caixa:', error);
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
      color: "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400",
      show: true
    },
    { 
      title: "Dashboard", 
      icon: BarChart3, 
      href: "/dashboard",
      color: "bg-blue-500/15 hover:bg-blue-500/25 text-blue-400",
      show: true
    },
    { 
      title: "Estoque", 
      icon: Archive, 
      href: "/current-stock",
      color: "bg-orange-500/15 hover:bg-orange-500/25 text-orange-400",
      show: true
    },
    { 
      title: "Materiais", 
      icon: ClipboardList, 
      href: "/materiais",
      color: "bg-purple-500/15 hover:bg-purple-500/25 text-purple-400",
      show: true
    },
    { 
      title: "Configurações", 
      icon: Settings, 
      href: "/configuracoes",
      color: "bg-slate-500/15 hover:bg-slate-500/25 text-slate-400",
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
      ? `${item.color} mb-1.5 rounded-lg p-3 w-full text-left transition-all duration-200`
      : "text-slate-400 hover:text-slate-100 hover:bg-[hsl(220,16%,22%)] p-3 w-full text-left rounded-lg transition-colors";

    if (item.href) {
      return (
        <NavLink
          key={item.title}
          to={item.href}
          className={({ isActive }) => 
            `${baseClass} block no-underline ${isActive && !isQuickAccess ? 'bg-[hsl(220,16%,22%)] text-slate-100' : ''}`
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
    <Sidebar className={`${collapsed ? 'w-16' : 'w-64'} bg-[hsl(220,16%,16%)] border-r border-[hsl(220,13%,22%)]`}>
      <SidebarContent className="bg-[hsl(220,16%,16%)]">
        {/* Logo */}
        <div className="p-4 border-b border-[hsl(220,13%,22%)]">
          <div className="flex items-center gap-2">
            <SystemLogo size="sm" />
            {!collapsed && (
              <span className="text-slate-100 font-semibold text-lg">Sistema PDV</span>
            )}
          </div>
        </div>

        {/* Acesso Rápido */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider px-4 py-2">
            {!collapsed && "Acesso Rápido"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
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
          <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider px-4 py-2">
            {!collapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
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
          <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider px-4 py-2">
            {!collapsed && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
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
            <SidebarGroupLabel className="text-slate-500 text-xs uppercase tracking-wider px-4 py-2">
              {!collapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
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
            <SidebarGroupContent className="px-2">
              <div className="p-3 bg-[hsl(220,16%,20%)] rounded-xl mx-2 mb-3 border border-[hsl(220,13%,26%)]">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                    {subscription.plan_type === 'trial' ? 'Teste' : 'Ativo'}
                  </Badge>
                  <Zap className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400">
                  Expira: {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Logout */}
        <div className="mt-auto p-3 border-t border-[hsl(220,13%,22%)]">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start rounded-lg"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
