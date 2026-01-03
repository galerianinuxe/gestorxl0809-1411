import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
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
  Wallet,
  ClipboardList,
  Users,
  AlertCircle,
  Crown,
  ChevronRight
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

  // Seção Principal - Acesso rápido
  const principalItems = [
    { 
      title: "PDV / Caixa", 
      icon: ShoppingCart, 
      action: handleCashRegisterAction,
      isAction: true
    },
    { 
      title: "Dashboard", 
      icon: BarChart3, 
      href: "/dashboard"
    },
    { 
      title: "Estoque", 
      icon: Archive, 
      href: "/current-stock"
    },
  ];

  // Seção Operações - Gestão do dia a dia
  const operacoesItems = [
    { title: "Compras", icon: ShoppingCart, href: "/purchase-orders" },
    { title: "Vendas", icon: TrendingUp, href: "/sales-orders" },
    { title: "Transações", icon: FileText, href: "/transactions" },
    { title: "Despesas", icon: DollarSign, href: "/expenses" },
    { title: "Adições de Caixa", icon: Wallet, href: "/cash-additions" },
    { title: "Fluxo de Caixa", icon: Calendar, href: "/daily-flow" },
  ];

  // Seção Configurações - Sistema
  const configuracoesItems = [
    { title: "Materiais", icon: ClipboardList, href: "/materiais" },
    { title: "Configurações", icon: Settings, href: "/configuracoes" },
    { title: "Ajuda & Guia", icon: BookOpen, href: "/guia-completo" },
    { title: "Planos", icon: Crown, href: "/planos" },
  ];

  // Items extras
  const extraItems = [
    { title: "Indicações", icon: Users, href: "/sistema-indicacoes" },
    { title: "Relatar Erro", icon: AlertCircle, href: "/relatar-erro" },
  ];

  // Admin
  const adminItems = [
    { title: "Painel Admin", icon: Shield, href: "/covildomal" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const renderMenuItem = (item: any) => {
    const baseClass = "flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-md transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/60";
    const activeClass = "bg-gray-800 text-white border-l-2 border-emerald-500 rounded-l-none";

    if (item.isAction) {
      return (
        <button
          key={item.title}
          onClick={item.action}
          className={baseClass}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{item.title}</span>}
        </button>
      );
    }

    return (
      <NavLink
        key={item.title}
        to={item.href}
        className={({ isActive }) => 
          `${baseClass} ${isActive ? activeClass : ''}`
        }
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="text-sm">{item.title}</span>}
      </NavLink>
    );
  };

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-60'} bg-gray-950 border-r border-gray-800`}>
      <SidebarContent className="bg-gray-950 flex flex-col h-full">
        {/* Logo Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <SystemLogo size="sm" />
            {!collapsed && (
              <div>
                <span className="text-white font-semibold text-sm">XLATA</span>
                <span className="text-gray-500 text-xs block">Gestor PDV</span>
              </div>
            )}
          </div>
        </div>

        {/* Principal */}
        <SidebarGroup className="py-4">
          <SidebarGroupLabel className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {!collapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {principalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operações */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {!collapsed && "Operações"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {operacoesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {!collapsed && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {configuracoesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Extras - Collapsible */}
        {!collapsed && (
          <SidebarGroup className="py-2">
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-1">
                {extraItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin */}
        {isAdmin && (
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="px-4 text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
              {!collapsed && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-1">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 w-full rounded-md transition-all duration-200 ${
                          isActive 
                            ? 'bg-emerald-900/30 text-emerald-400 border-l-2 border-emerald-500 rounded-l-none' 
                            : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-900/20'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Status da Assinatura - Minimalista */}
        {subscription && !collapsed && (
          <div className="px-4 py-3 mt-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Plano</span>
              <span className="text-emerald-500 font-medium">
                {subscription.plan_type === 'trial' ? 'Teste' : 'Ativo'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-500">Expira</span>
              <span className="text-gray-400">
                {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="mt-auto p-3 border-t border-gray-800">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 justify-start h-10"
          >
            <LogOut className="h-4 w-4 mr-3" />
            {!collapsed && <span className="text-sm">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
