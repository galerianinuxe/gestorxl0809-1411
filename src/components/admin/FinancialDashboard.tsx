import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, CreditCard, TrendingUp, Users, TestTube, AlertTriangle,
  CheckCircle, XCircle, Clock, RefreshCw, Trash2, Gift, Calendar,
  Settings, Wallet, ArrowUpRight, ArrowDownRight, Search, Filter,
  BarChart3, PieChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlansManagement } from './PlansManagement';
import { useAuditLog } from '@/hooks/useAuditLog';

interface SubscriptionData {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
  activated_at: string;
  created_at: string;
  referral_info?: {
    indicador_name: string | null;
    indicador_email: string | null;
  };
}

interface PixPayment {
  id: string;
  payment_id: string;
  payer_email: string;
  transaction_amount: number;
  status: string;
  status_detail: string | null;
  created_at: string;
  updated_at: string;
  external_reference: string | null;
}

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  activeSubscriptions: number;
  trialUsers: number;
  paidUsers: number;
  expiredSubscriptions: number;
  conversionRate: number;
  avgTicket: number;
  revenueGrowth: number;
}

export const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [pixPayments, setPixPayments] = useState<PixPayment[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    paidUsers: 0,
    expiredSubscriptions: 0,
    conversionRate: 0,
    avgTicket: 0,
    revenueGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subscriptions with user data
      const { data: subscriptionsData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name, indicador_id');

      // Fetch PIX payments
      const { data: payments } = await supabase
        .from('mercado_pago_payments')
        .select('*')
        .order('created_at', { ascending: false });

      // Map subscriptions with user info
      const mappedSubscriptions = subscriptionsData?.map(sub => {
        const user = profiles?.find(p => p.id === sub.user_id);
        const indicador = user?.indicador_id ? profiles?.find(p => p.id === user.indicador_id) : null;

        return {
          id: sub.id,
          user_id: sub.user_id,
          user_email: user?.email || 'N/A',
          user_name: user?.name,
          plan_type: sub.plan_type,
          is_active: sub.is_active,
          expires_at: sub.expires_at,
          activated_at: sub.activated_at,
          created_at: sub.created_at,
          referral_info: indicador ? {
            indicador_name: indicador.name,
            indicador_email: indicador.email
          } : undefined
        };
      }) || [];

      setSubscriptions(mappedSubscriptions);
      setPixPayments(payments || []);

      // Calculate stats
      const now = new Date();
      const activeSubscriptions = mappedSubscriptions.filter(s => s.is_active && new Date(s.expires_at) > now);
      const trialUsers = activeSubscriptions.filter(s => s.plan_type === 'trial').length;
      const paidUsers = activeSubscriptions.filter(s => s.plan_type !== 'trial').length;
      const expiredSubscriptions = mappedSubscriptions.filter(s => !s.is_active || new Date(s.expires_at) <= now).length;
      
      const approvedPayments = payments?.filter(p => p.status === 'approved') || [];
      const totalRevenue = approvedPayments.reduce((sum, p) => sum + (p.transaction_amount || 0), 0);
      
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthlyPayments = approvedPayments.filter(p => {
        const date = new Date(p.created_at);
        return date >= monthStart && date <= monthEnd;
      });
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.transaction_amount || 0), 0);

      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
      const conversionRate = (trialUsers + paidUsers) > 0 ? (paidUsers / (trialUsers + paidUsers)) * 100 : 0;
      const avgTicket = approvedPayments.length > 0 ? totalRevenue / approvedPayments.length : 0;

      // Calculate revenue growth (compare with last month)
      const lastMonthStart = startOfMonth(subDays(now, 30));
      const lastMonthEnd = endOfMonth(subDays(now, 30));
      const lastMonthPayments = approvedPayments.filter(p => {
        const date = new Date(p.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });
      const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.transaction_amount || 0), 0);
      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        activeSubscriptions: activeSubscriptions.length,
        trialUsers,
        paidUsers,
        expiredSubscriptions,
        conversionRate,
        avgTicket,
        revenueGrowth
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpiredSubscriptions = async () => {
    try {
      const now = new Date().toISOString();
      const { data: expiredSubs } = await supabase
        .from('user_subscriptions')
        .select('id')
        .or(`is_active.eq.false,expires_at.lte.${now}`);

      if (!expiredSubs || expiredSubs.length === 0) {
        toast({
          title: "Nenhuma assinatura expirada",
          description: "Não foram encontradas assinaturas expiradas para excluir."
        });
        return;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .in('id', expiredSubs.map(sub => sub.id));

      if (error) throw error;

      await logAction({
        actionType: 'delete_expired_subscriptions',
        targetTable: 'user_subscriptions',
        description: `Excluídas ${expiredSubs.length} assinaturas expiradas`
      });

      toast({
        title: "Assinaturas excluídas",
        description: `${expiredSubs.length} assinaturas expiradas foram excluídas.`
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting expired subscriptions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir as assinaturas expiradas.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPlanBadge = (planType: string, isActive: boolean, expiresAt: string) => {
    const isExpired = new Date(expiresAt) <= new Date();
    if (!isActive || isExpired) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    switch (planType) {
      case 'trial': return <Badge className="bg-cyan-500 text-white">Teste</Badge>;
      case 'monthly': return <Badge className="bg-green-600 text-white">Mensal</Badge>;
      case 'quarterly': return <Badge className="bg-purple-600 text-white">Trimestral</Badge>;
      case 'annual': return <Badge className="bg-amber-600 text-white">Anual</Badge>;
      default: return <Badge variant="outline">{planType}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-600 text-white">Aprovado</Badge>;
      case 'pending': return <Badge className="bg-blue-600 text-white">Pendente</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeitado</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && sub.is_active && new Date(sub.expires_at) > new Date();
    if (filterStatus === 'expired') return matchesSearch && (!sub.is_active || new Date(sub.expires_at) <= new Date());
    if (filterStatus === 'trial') return matchesSearch && sub.plan_type === 'trial';
    if (filterStatus === 'paid') return matchesSearch && sub.plan_type !== 'trial';
    return matchesSearch;
  });

  const filteredPayments = pixPayments.filter(payment => {
    const matchesSearch = payment.payer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_id.includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && payment.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Receita Total</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Receita Mensal</p>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(stats.monthlyRevenue)}</p>
                {stats.revenueGrowth !== 0 && (
                  <div className={`flex items-center text-xs ${stats.revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.revenueGrowth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(stats.revenueGrowth).toFixed(1)}%
                  </div>
                )}
              </div>
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Assinaturas Ativas</p>
                <p className="text-xl font-bold text-white">{stats.activeSubscriptions}</p>
              </div>
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Em Teste</p>
                <p className="text-xl font-bold text-cyan-400">{stats.trialUsers}</p>
              </div>
              <TestTube className="h-6 w-6 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Conversão</p>
                <p className="text-xl font-bold text-purple-400">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Ticket Médio</p>
                <p className="text-xl font-bold text-yellow-400">{formatCurrency(stats.avgTicket)}</p>
              </div>
              <Wallet className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border border-gray-700">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Assinaturas</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Pagamentos PIX</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2 data-[state=active]:bg-gray-700">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Planos</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  Resumo de Assinaturas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ativas (Pagas)</span>
                  <Badge className="bg-green-600">{stats.paidUsers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Em Teste</span>
                  <Badge className="bg-cyan-500">{stats.trialUsers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Expiradas</span>
                  <Badge variant="destructive">{stats.expiredSubscriptions}</Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="font-medium text-white">Total</span>
                  <span className="font-bold text-white">{subscriptions.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  Resumo de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Aprovados</span>
                  <Badge className="bg-green-600">{pixPayments.filter(p => p.status === 'approved').length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pendentes</span>
                  <Badge className="bg-blue-600">{stats.pendingPayments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Rejeitados</span>
                  <Badge variant="destructive">{pixPayments.filter(p => p.status === 'rejected' || p.status === 'cancelled').length}</Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="font-medium text-white">Total</span>
                  <span className="font-bold text-white">{pixPayments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-white">
                <Clock className="h-4 w-4 text-purple-400" />
                Últimas Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {[...subscriptions.slice(0, 5), ...pixPayments.slice(0, 5)]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                        {'payment_id' in item ? (
                          <>
                            <div className="flex items-center gap-3">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <div>
                                <p className="text-sm font-medium text-white">Pagamento PIX</p>
                                <p className="text-xs text-gray-400">{item.payer_email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-400">{formatCurrency(item.transaction_amount)}</p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-blue-400" />
                              <div>
                                <p className="text-sm font-medium text-white">Nova Assinatura</p>
                                <p className="text-xs text-gray-400">{(item as SubscriptionData).user_email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {getPlanBadge((item as SubscriptionData).plan_type, (item as SubscriptionData).is_active, (item as SubscriptionData).expires_at)}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Assinaturas ({filteredSubscriptions.length})
                </CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="expired">Expiradas</SelectItem>
                      <SelectItem value="trial">Teste</SelectItem>
                      <SelectItem value="paid">Pagas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="sm" onClick={handleDeleteExpiredSubscriptions}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Expiradas
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Ativação</TableHead>
                      <TableHead>Expiração</TableHead>
                      <TableHead>Indicação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.user_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{sub.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{sub.plan_type}</TableCell>
                        <TableCell>
                          {format(new Date(sub.activated_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sub.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {sub.referral_info ? (
                            <div className="flex items-center gap-1">
                              <Gift className="h-3 w-3 text-purple-500" />
                              <span className="text-xs">{sub.referral_info.indicador_name || sub.referral_info.indicador_email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getPlanBadge(sub.plan_type, sub.is_active, sub.expires_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Pagamentos PIX ({filteredPayments.length})
                </CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="rejected">Rejeitados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pagamento</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.payment_id}</TableCell>
                        <TableCell>{payment.payer_email}</TableCell>
                        <TableCell className="font-medium text-green-500">
                          {formatCurrency(payment.transaction_amount)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <PlansManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
