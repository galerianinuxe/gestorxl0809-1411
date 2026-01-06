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
  ChevronRight,
  UserCog
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
import { useEmployee } from '@/contexts/EmployeeContext';

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
  const { isEmployee, ownerSubscription } = useEmployee();

  // Funcionários usam assinatura do dono
  const effectiveSubscription = isEmployee ? ownerSubscription : subscription;
  const handleCashRegisterAction = async () => {
    try {
      const activeCashRegister = await getActiveCashRegister();
      
      if (activeCashRegister && activeCashRegister.status === 'open') {
        console.log('✅ Caixa aberto, redirecionando para PDV');
        navigate('/');
      } else {
        console.log('❌ Caixa fechado, redirecionando para PDV para abrir caixa');
        // Sempre navegar para o PDV - lá o modal de abertura será exibido automaticamente
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao verificar status do caixa:', error);
      // Em caso de erro, navegar para o PDV
      navigate('/');
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
  const allConfiguracoesItems = [
    { title: "Materiais", icon: ClipboardList, href: "/materiais" },
    { title: "Clientes", icon: Users, href: "/clientes" },
    { title: "Funcionários", icon: UserCog, href: "/funcionarios" },
    { title: "Configurações", icon: Settings, href: "/configuracoes" },
    { title: "Ajuda & Guia", icon: BookOpen, href: "/guia-completo" },
    { title: "Planos", icon: Crown, href: "/planos" },
  ];

  // Funcionários não veem "Planos" e "Funcionários"
  const configuracoesItems = isEmployee 
    ? allConfiguracoesItems.filter(item => item.href !== '/planos' && item.href !== '/funcionarios')
    : allConfiguracoesItems;

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
    const baseClass = "flex items-center gap-2 px-2 py-1.5 w-full text-left rounded-sm transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-700/60";
    const activeClass = "bg-slate-800 text-white border-l-2 border-emerald-500 rounded-l-none";

    if (item.isAction) {
      return (
        <button
          key={item.title}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.action();
          }}
          className={`${baseClass} relative z-10 cursor-pointer`}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs">{item.title}</span>}
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
        {!collapsed && <span className="text-xs">{item.title}</span>}
      </NavLink>
    );
  };

  return (
    <Sidebar className="bg-slate-900 border-r border-slate-700">
      <SidebarContent className="bg-slate-900 flex flex-col h-full">
        {/* Logo Header */}
        <div className="p-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <SystemLogo size="sm" />
            {!collapsed && (
              <div>
                <span className="text-white font-semibold text-xs">XLATA</span>
                <span className="text-slate-500 text-[10px] block">Gestor PDV</span>
              </div>
            )}
          </div>
        </div>

        {/* Principal */}
        <SidebarGroup className="pt-2 pb-1">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            {!collapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-0.5">
              {principalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operações */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            {!collapsed && "Operações"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-0.5">
              {operacoesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            {!collapsed && "Sistema"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-0.5">
              {configuracoesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Extras */}
        {!collapsed && (
          <SidebarGroup className="py-1">
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-0.5">
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
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
              {!collapsed && "Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu className="space-y-0.5">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => 
                        `flex items-center gap-2 px-2 py-1.5 w-full rounded-sm transition-all duration-200 ${
                          isActive 
                            ? 'bg-emerald-900/30 text-emerald-400 border-l-2 border-emerald-500 rounded-l-none' 
                            : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-900/20'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-xs">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Status da Assinatura - Minimalista */}
        {effectiveSubscription && !collapsed && (
          <div className="px-2 py-1.5 mt-auto">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Plano</span>
              <span className="text-emerald-500 font-medium">
                {isEmployee ? 'Funcionário' : (effectiveSubscription.plan_type === 'trial' ? 'Teste' : 'Ativo')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-0.5">
              <span className="text-slate-500">{isEmployee ? 'Dono' : 'Expira'}</span>
              <span className="text-slate-400">
                {isEmployee ? 'Assinatura do dono' : new Date(effectiveSubscription.expires_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="mt-auto p-1.5 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 justify-start h-7 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
