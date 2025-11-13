
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  Activity,
  Users,
  CreditCard,
  Server,
  Database,
  AlertCircle,
  Settings,
  Wifi,
  RefreshCw,
  Send,
  Merge,
  DollarSign
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'usuarios' | 'assinaturas' | 'conteudo' | 'landing' | 'logs' | 'sistema' | 'online' | 'materials' | 'pix-payments';

interface AdminSidebarProps {
  activeTab: ActiveTab;
  onTabClick: (tab: ActiveTab) => void;
  onlineUsers: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  systemVersion: string;
  onBroadcastNotification?: () => void;
}

const menuItems = [
  {
    id: 'dashboard' as ActiveTab,
    title: 'Dashboard',
    icon: Activity,
  },
  {
    id: 'usuarios' as ActiveTab,
    title: 'Usuários',
    icon: Users,
  },
  {
    id: 'assinaturas' as ActiveTab,
    title: 'Assinaturas',
    icon: CreditCard,
  },
  {
    id: 'pix-payments' as ActiveTab,
    title: 'Pagamentos PIX',
    icon: DollarSign,
  },
  {
    id: 'materials' as ActiveTab,
    title: 'Materiais',
    icon: Merge,
  },
  {
    id: 'conteudo' as ActiveTab,
    title: 'Conteúdo',
    icon: Server,
  },
  {
    id: 'landing' as ActiveTab,
    title: 'Landing',
    icon: Database,
  },
  {
    id: 'logs' as ActiveTab,
    title: 'Logs',
    icon: AlertCircle,
  },
  {
    id: 'sistema' as ActiveTab,
    title: 'Sistema',
    icon: Settings,
  },
  {
    id: 'online' as ActiveTab,
    title: 'Online',
    icon: Wifi,
  },
];

export const AdminSidebar = ({ 
  activeTab, 
  onTabClick, 
  onlineUsers, 
  isRefreshing, 
  onRefresh,
  systemVersion,
  onBroadcastNotification
}: AdminSidebarProps) => {
  return (
    <Sidebar className="bg-gray-900 border-r border-gray-700">
      <SidebarHeader className="p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/" className="flex items-center gap-2 hover:text-gray-300 transition-colors text-white">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Voltar</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white font-bold">X</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-red-400">XLata.site</h1>
            <p className="text-xs text-gray-400">Painel de Controle Total</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-green-600/20 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <Wifi className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-green-300 text-xs font-semibold">
              {onlineUsers} usuários online
            </span>
          </div>

          <Button
            onClick={onRefresh}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            className="w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>

          {onBroadcastNotification && (
            <Button
              onClick={onBroadcastNotification}
              variant="ghost"
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-500"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação
            </Button>
          )}

          <Badge variant="destructive" className="w-full justify-center bg-red-600 hover:bg-red-700">
            Administrador Master
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gray-900">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabClick(item.id)}
                    isActive={activeTab === item.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      activeTab === item.id
                        ? "bg-red-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="text-xs text-gray-400 text-center">
          <p>Sistema {systemVersion}</p>
          <p>© 2024 XLata.site</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
