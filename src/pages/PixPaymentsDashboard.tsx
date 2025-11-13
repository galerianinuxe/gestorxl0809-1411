import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PixPayment {
  payment_id: string;
  payer_email: string;
  transaction_amount: number;
  status: string;
  status_detail: string;
  created_at: string;
  updated_at: string;
  external_reference: string;
}

interface UserSubscription {
  user_id: string;
  payment_reference: string;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
}

const PixPaymentsDashboard = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar pagamentos PIX
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('mercado_pago_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Carregar assinaturas
      const { data: subsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('user_id, payment_reference, plan_type, is_active, expires_at')
        .not('payment_reference', 'is', null);

      if (subsError) throw subsError;

      setPayments(paymentsData || []);
      setSubscriptions(subsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de pagamentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Atualizado",
      description: "Dados atualizados com sucesso!",
    });
  };

  const getPaymentStatus = (payment: PixPayment) => {
    const subscription = subscriptions.find(s => s.payment_reference === payment.payment_id);
    
    if (payment.status === 'approved' && subscription && subscription.is_active) {
      return { label: 'Pago e Ativado', color: 'bg-green-600', icon: CheckCircle };
    } else if (payment.status === 'approved' && !subscription) {
      return { label: 'Pago sem Ativação', color: 'bg-yellow-600', icon: AlertTriangle };
    } else if (payment.status === 'pending') {
      return { label: 'Pendente', color: 'bg-blue-600', icon: Clock };
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      return { label: 'Não Pago', color: 'bg-red-600', icon: XCircle };
    }
    
    return { label: payment.status, color: 'bg-gray-600', icon: Clock };
  };

  const stats = {
    total: payments.length,
    approved: payments.filter(p => p.status === 'approved').length,
    pending: payments.filter(p => p.status === 'pending').length,
    activated: payments.filter(p => {
      const sub = subscriptions.find(s => s.payment_reference === p.payment_id);
      return p.status === 'approved' && sub && sub.is_active;
    }).length,
    notActivated: payments.filter(p => {
      const sub = subscriptions.find(s => s.payment_reference === p.payment_id);
      return p.status === 'approved' && !sub;
    }).length,
    totalRevenue: payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + (p.transaction_amount || 0), 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard de Pagamentos PIX</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-green-600 hover:bg-green-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">Total de Pagamentos</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">Aprovados</div>
              <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">Pendentes</div>
              <div className="text-2xl font-bold text-blue-400">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">Ativados</div>
              <div className="text-2xl font-bold text-green-400">{stats.activated}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">Não Ativados</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.notActivated}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-sm">Receita Total</div>
              <div className="text-lg font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Lista de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Nenhum pagamento encontrado
                </div>
              ) : (
                payments.map((payment) => {
                  const status = getPaymentStatus(payment);
                  const StatusIcon = status.icon;
                  const subscription = subscriptions.find(s => s.payment_reference === payment.payment_id);

                  return (
                    <div
                      key={payment.payment_id}
                      className="bg-gray-900 p-4 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusIcon className="h-5 w-5 text-white" />
                            <div>
                              <p className="text-white font-semibold">ID: {payment.payment_id}</p>
                              <p className="text-gray-400 text-sm flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {payment.payer_email || 'Email não disponível'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-gray-400 text-xs">Valor</p>
                              <p className="text-green-400 font-bold">{formatCurrency(payment.transaction_amount || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Criado em</p>
                              <p className="text-white text-sm">{formatDate(payment.created_at)}</p>
                            </div>
                            {subscription && (
                              <>
                                <div>
                                  <p className="text-gray-400 text-xs">Plano</p>
                                  <p className="text-white text-sm capitalize">{subscription.plan_type}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-xs">Expira em</p>
                                  <p className="text-white text-sm">
                                    {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <Badge className={`${status.color} text-white ml-4`}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default PixPaymentsDashboard;
