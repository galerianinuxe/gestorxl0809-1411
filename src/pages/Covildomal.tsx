import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  AlertCircle, 
  Activity,
  Server,
  Database,
  Shield,
  Percent,
  Settings,
  DollarSign,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { SubscriptionManagement } from '@/components/admin/SubscriptionManagement';
import { SystemManagement } from '@/components/admin/SystemManagement';
import { AdminSidebar, ActiveTab } from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import LandingManagement from '@/components/admin/LandingManagement';
import { ActiveUsersList } from '@/components/admin/ActiveUsersList';
import { useOnlineUsersFromDB } from '@/hooks/useOnlineUsersFromDB';
import { useUserPresence } from '@/hooks/useUserPresence';
import ErrorReportsModal from '@/components/admin/ErrorReportsModal';
import { BroadcastNotificationModal } from '@/components/admin/BroadcastNotificationModal';
import { supabase } from '@/integrations/supabase/client';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { FeatureFlagsPanel } from '@/components/admin/FeatureFlagsPanel';
import { FinancialDashboard } from '@/components/admin/FinancialDashboard';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { MaintenanceDashboard } from '@/components/admin/MaintenanceDashboard';
import { PlansManagement } from '@/components/admin/PlansManagement';

const Covildomal = () => {
  const navigate = useNavigate();
  const { stats, systemStatus, loading, error, refetch } = useAdminDashboard();
  const { count: onlineUsersCount } = useOnlineUsersFromDB();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showErrorReports, setShowErrorReports] = useState(false);
  const [unreadErrorReports, setUnreadErrorReports] = useState(0);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  
  // Ativar rastreamento de presença para o usuário atual
  useUserPresence();

  // Fetch unread error reports count
  const fetchUnreadErrorReports = async () => {
    try {
      const { data, error } = await supabase
        .from('error_reports')
        .select('id')
        .eq('is_read', false);

      if (error) throw error;
      setUnreadErrorReports(data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar relatórios não lidos:', error);
    }
  };

  useEffect(() => {
    fetchUnreadErrorReports();
    
    // Set up real-time subscriptions
    const errorReportsChannel = supabase
      .channel('error-reports-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'error_reports'
      }, () => {
        fetchUnreadErrorReports();
      })
      .subscribe();
    
    // Real-time para orders (transações)
    const ordersChannel = supabase
      .channel('admin-orders-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(errorReportsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value).replace(',00', '');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    await fetchUnreadErrorReports();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <UserManagement />;
      case 'financeiro':
        return <FinancialDashboard />;
      case 'planos':
        return <PlansManagement />;
      case 'conteudo':
        return (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">CMS / Blog</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Em desenvolvimento - Gerenciamento de conteúdo e blog</p>
            </CardContent>
          </Card>
        );
      case 'landing':
        return <LandingManagement />;
      case 'seguranca':
        return <SecurityDashboard />;
      case 'sistema':
        return <SystemManagement />;
      case 'feature-flags':
        return <FeatureFlagsPanel />;
      case 'manutencao':
        return <MaintenanceDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'online':
        return <ActiveUsersList />;
      default:
        return null;
    }
  };

  if (loading && !stats.totalUsers) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">Erro ao carregar dados: {error}</p>
          <button 
            onClick={handleRefresh} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-900">
        <AdminSidebar
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onlineUsers={onlineUsersCount}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          systemVersion={systemStatus.systemVersion}
          onBroadcastNotification={() => setShowBroadcastModal(true)}
          unreadErrorReports={unreadErrorReports}
        />
        
        <SidebarInset className="flex-1 bg-gray-800">
          <main className="p-6 overflow-auto bg-gray-800 min-h-screen">
            {activeTab === 'dashboard' ? (
              <>
                {/* Error Reports Alert */}
                {unreadErrorReports > 0 && (
                  <Card className="bg-red-900/20 border-red-700/50 mb-6">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                          <div>
                            <h3 className="text-white font-semibold">Novos Relatórios de Erro</h3>
                            <p className="text-red-300 text-sm">
                              Você tem {unreadErrorReports} relatório{unreadErrorReports !== 1 ? 's' : ''} não lido{unreadErrorReports !== 1 ? 's' : ''} de usuários
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setShowErrorReports(true)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Ver Relatórios
                          <Badge variant="secondary" className="ml-2">
                            {unreadErrorReports}
                          </Badge>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Users className="h-6 w-6 text-blue-400" />
                        <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
                          Total: {stats.totalUsers}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Registrados</span>
                          <span className="text-lg font-bold text-white">{stats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Logins (30d)</span>
                          <span className="text-sm text-purple-400">{stats.recentLogins}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <CreditCard className="h-6 w-6 text-green-400" />
                        <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                          Ativas: {stats.activeSubscriptions}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Pagas</span>
                          <span className="text-lg font-bold text-green-400">{stats.activeSubscriptions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Em teste</span>
                          <span className="text-sm text-blue-400">{stats.trialUsers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <DollarSign className="h-6 w-6 text-green-400" />
                        <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                          Mensal
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Receita</span>
                          <span className="text-lg font-bold text-green-400">{formatCurrency(stats.monthlyRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Valor médio</span>
                          <span className="text-sm text-gray-200">
                            {formatCurrency(stats.activeSubscriptions > 0 ? stats.monthlyRevenue / stats.activeSubscriptions : 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <AlertCircle className="h-6 w-6 text-yellow-400" />
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400">
                          Alertas
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Expirados</span>
                          <span className="text-lg font-bold text-yellow-400">{stats.expiredTests}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Inativos</span>
                          <span className="text-sm text-red-400">{stats.inactiveUsers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-red-400" />
                      Resumo do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Status do Sistema</h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Server className="h-3 w-3" />
                              Servidor
                            </span>
                            <Badge variant="default" className="bg-green-600 text-xs">Online</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Database className="h-3 w-3" />
                              Database
                            </span>
                            <Badge variant="default" className="bg-green-600 text-xs">Conectado</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Segurança
                            </span>
                            <Badge variant="default" className="bg-green-600 text-xs">RBAC Ativo</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Métricas</h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Percent className="h-3 w-3" />
                              Conversão
                            </span>
                            <span className="text-sm text-gray-200">{systemStatus.conversionRate}</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <BarChart3 className="h-3 w-3" />
                              Transações
                            </span>
                            <span className="text-sm text-gray-200">{systemStatus.totalTransactions}</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              Ativos/Mês
                            </span>
                            <span className="text-sm text-gray-200">{systemStatus.monthlyActiveUsers}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Sistema</h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Settings className="h-3 w-3" />
                              Versão
                            </span>
                            <span className="text-sm text-gray-200">{systemStatus.systemVersion}</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Backup
                            </span>
                            <Badge variant="default" className="bg-green-600 text-xs">Ativo</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                              <Activity className="h-3 w-3" />
                              Última Atualização
                            </span>
                            <span className="text-sm text-gray-200">{systemStatus.lastUpdate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              renderTabContent()
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Error Reports Modal */}
      <ErrorReportsModal 
        open={showErrorReports} 
        onClose={() => setShowErrorReports(false)}
        unreadCount={unreadErrorReports}
        onCountUpdate={setUnreadErrorReports}
      />

      {/* Broadcast Notification Modal */}
      <BroadcastNotificationModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />
    </SidebarProvider>
  );
};

export default Covildomal;
