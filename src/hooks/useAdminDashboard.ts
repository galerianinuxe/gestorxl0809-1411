
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  expiredTests: number;
  inactiveUsers: number;
  recentLogins: number;
  monthlyRevenue: number;
}

interface SystemStatus {
  serverStatus: 'online' | 'offline';
  backupStatus: 'active' | 'inactive';
  databaseStatus: 'connected' | 'disconnected';
  conversionRate: string;
  lastUpdate: string;
  systemVersion: string;
  monthlyActiveUsers: number;
  totalTransactions: number;
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    expiredTests: 0,
    inactiveUsers: 0,
    recentLogins: 0,
    monthlyRevenue: 0,
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    serverStatus: 'online',
    backupStatus: 'active',
    databaseStatus: 'connected',
    conversionRate: '0%',
    lastUpdate: new Date().toLocaleString('pt-BR'),
    systemVersion: 'v2.1.319',
    monthlyActiveUsers: 0,
    totalTransactions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar total de usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at');

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;

      // Buscar assinaturas ativas
      const { data: activeSubscriptions, error: activeError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (activeError) throw activeError;

      // Separar assinaturas por tipo
      const trialUsers = activeSubscriptions?.filter(sub => sub.plan_type === 'trial').length || 0;
      const paidSubscriptions = activeSubscriptions?.filter(sub => sub.plan_type !== 'trial').length || 0;

      // Calcular receita mensal baseada em assinaturas pagas ativas
      const monthlyRevenue = calculateMonthlyRevenue(activeSubscriptions || []);

      // Buscar assinaturas expiradas que eram trial
      const { data: expiredTrials, error: expiredError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('plan_type', 'trial')
        .lt('expires_at', new Date().toISOString());

      if (expiredError) throw expiredError;

      const expiredTests = expiredTrials?.length || 0;

      // Calcular usuários inativos (sem assinatura ativa)
      const usersWithActiveSubscriptions = new Set(activeSubscriptions?.map(sub => sub.user_id) || []);
      const inactiveUsers = totalUsers - usersWithActiveSubscriptions.size;

      // Buscar logins recentes (últimos 30 dias) - usando profiles updated_at como proxy
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentProfiles, error: recentError } = await supabase
        .from('profiles')
        .select('id')
        .gte('updated_at', thirtyDaysAgo.toISOString());

      if (recentError) throw recentError;

      const recentLogins = recentProfiles?.length || 0;

      // Calcular taxa de conversão
      const totalTrialUsers = trialUsers + expiredTests;
      const conversionRate = totalTrialUsers > 0 
        ? ((paidSubscriptions / totalTrialUsers) * 100).toFixed(1) 
        : '0';

      // Buscar dados do sistema
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      const totalTransactions = orders?.length || 0;

      // Usuários ativos mensais (que fizeram login/atividade nos últimos 30 dias)
      const monthlyActiveUsers = recentLogins;

      // Atualizar stats
      setStats({
        totalUsers,
        activeSubscriptions: paidSubscriptions,
        trialUsers,
        expiredTests,
        inactiveUsers,
        recentLogins,
        monthlyRevenue,
      });

      // Atualizar status do sistema com dados reais
      setSystemStatus({
        serverStatus: 'online',
        backupStatus: 'active',
        databaseStatus: 'connected',
        conversionRate: `${conversionRate}%`,
        lastUpdate: new Date().toLocaleString('pt-BR'),
        systemVersion: 'v2.1.319',
        monthlyActiveUsers,
        totalTransactions,
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRevenue = (subscriptions: any[]) => {
    // Valores corretos dos planos conforme definidos na página de planos
    const paidPlans: { [key: string]: number } = {
      'monthly': 147.90,     // R$ 147,90/mês
      'quarterly': 387.90,   // R$ 387,90/3 meses
      'annual': 1647.90      // R$ 1.647,90/ano
    };

    let monthlyRevenue = 0;

    subscriptions.forEach(sub => {
      if (sub.plan_type !== 'trial' && sub.is_active) {
        const planPrice = paidPlans[sub.plan_type] || 0;
        
        // Para planos trimestrais e anuais, calcular o valor mensal
        if (sub.plan_type === 'quarterly') {
          monthlyRevenue += planPrice / 3; // Dividir por 3 meses
        } else if (sub.plan_type === 'annual') {
          monthlyRevenue += planPrice / 12; // Dividir por 12 meses
        } else {
          monthlyRevenue += planPrice; // Mensal direto
        }
      }
    });

    return Math.round(monthlyRevenue * 100) / 100; // Arredondar para 2 casas decimais
  };

  const refetch = async () => {
    await fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    systemStatus,
    loading,
    error,
    refetch,
  };
};
