import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Calendar, CreditCard, ArrowLeft, RefreshCw, User, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CheckoutPage from '@/components/checkout/CheckoutPage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SelectedPlan {
  id: string;
  name: string;
  price: string;
  amount: number;
  plan_type: string;
  period?: string;
  description?: string;
  period_days?: number;
}

const Planos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [accountAge, setAccountAge] = useState<string>('');
  const [renewalsHistory, setRenewalsHistory] = useState<any[]>([]);

  useEffect(() => {
    // Carregar planos e dados do usuário em paralelo
    const loadData = async () => {
      // Timeout de segurança para evitar loading infinito
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);

      try {
        if (user) {
          // Carregar tudo em paralelo
          await Promise.all([loadPlans(), loadSubscriptionData()]);
        } else {
          await loadPlans();
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price, period, description, is_popular, is_promotional, promotional_price, promotional_period, promotional_description, savings, plan_type')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedPlans =
        data?.map((plan) => ({
          id: plan.id,
          name: plan.name,
          price:
            plan.is_promotional && plan.promotional_price
              ? `R$ ${plan.promotional_price.toFixed(2).replace('.', ',')}`
              : `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
          period:
            plan.is_promotional && plan.promotional_period
              ? plan.promotional_period
              : plan.period,
          description: plan.description,
          icon: plan.is_promotional ? (
            <Badge className="h-6 w-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
              🔥
            </Badge>
          ) : plan.is_popular ? (
            <Crown className="h-6 w-6" />
          ) : (
            <Calendar className="h-6 w-6" />
          ),
          popular: plan.is_popular,
          savings:
            plan.is_promotional && plan.promotional_description
              ? plan.promotional_description
              : plan.savings,
          amount:
            plan.is_promotional && plan.promotional_price
              ? plan.promotional_price
              : plan.price,
          plan_type: plan.plan_type,
        })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadSubscriptionData = async () => {
    if (!user) return;
    
    try {
      // Buscar assinatura ativa, histórico e perfil em paralelo
      const [subscriptionResult, renewalsResult, profileResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('id, plan_type, is_active, expires_at, activated_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('expires_at', { ascending: false })
          .limit(1),
        supabase
          .from('user_subscriptions')
          .select('id, plan_type, is_active, expires_at, activated_at')
          .eq('user_id', user.id)
          .order('activated_at', { ascending: false })
          .limit(10),
        supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .single()
      ]);

      setCurrentSubscription(subscriptionResult.data?.[0] || null);
      setRenewalsHistory(renewalsResult.data || []);

      if (profileResult.data?.created_at) {
        const created = new Date(profileResult.data.created_at);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays < 30) {
          setAccountAge(`${diffDays} dias`);
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30);
          setAccountAge(`${months} ${months === 1 ? 'mês' : 'meses'}`);
        } else {
          const years = Math.floor(diffDays / 365);
          const months = Math.floor((diffDays % 365) / 30);
          setAccountAge(
            `${years} ${years === 1 ? 'ano' : 'anos'}${
              months > 0 ? ` e ${months} ${months === 1 ? 'mês' : 'meses'}` : ''
            }`
          );
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const getDaysRemaining = () => {
    if (!currentSubscription) return 0;
    const diff =
      new Date(currentSubscription.expires_at).getTime() -
      new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getPlanName = (planType: string) => {
    const names: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      biannual: 'Semestral',
      annual: 'Anual',
      triennial: 'Trienal',
      trial: 'Período de teste',
    };
    return names[planType] || planType;
  };

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para assinar.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      amount: plan.amount,
      plan_type: plan.plan_type,
    });

    setCheckoutOpen(true);
  };

  const handleRenewCurrentPlan = async () => {
    if (!currentSubscription) return;

    const { data: currentPlanData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', currentSubscription.plan_type)
      .eq('is_active', true)
      .maybeSingle();

    if (currentPlanData) {
      setSelectedPlan({
        id: currentPlanData.id,
        name: currentPlanData.name,
        price: `R$ ${currentPlanData.price.toFixed(2).replace('.', ',')}`,
        amount: currentPlanData.price,
        plan_type: currentPlanData.plan_type,
      });
      setCheckoutOpen(true);
    }
  };

  const benefits = [
    'Cadastro ilimitado de materiais',
    'Gerenciamento completo de estoque',
    'Controle de compras e vendas',
    'Relatórios e análises detalhadas',
    'Sistema de caixa integrado',
    'Suporte técnico prioritário',
    'Atualizações automáticas',
    'Acesso ao guia completo em vídeo',
  ];

  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>

        {/* PLANS SECTION - NOW AT TOP */}
        <div className="text-center mb-10">
          <Badge className="bg-green-600 text-white px-4 py-2 mb-4">
            🔥 ESCOLHA SEU PLANO
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Planos e Preços
          </h1>
          <p className="text-xl text-gray-300">
            Escolha o plano ideal para o seu negócio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-gray-800/50 border-2 backdrop-blur-sm hover:scale-105 transition-all ${
                plan.popular ? 'border-green-500' : 'border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-600">Mais Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4 text-green-400">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl text-white">
                  {plan.name}
                </CardTitle>
                <div className="text-4xl font-bold text-white">
                  {plan.price}
                </div>
                <p className="text-gray-400 text-sm">{plan.period}</p>
                {plan.savings && (
                  <p className="text-green-400 text-sm mt-2 font-semibold">
                    {plan.savings}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-center min-h-[3rem]">
                  {plan.description}
                </p>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={
                    plan.popular
                      ? 'w-full bg-green-600 hover:bg-green-700'
                      : 'w-full bg-gray-700 hover:bg-gray-600'
                  }
                >
                  Assinar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Card */}
        <Card className="bg-gray-800/50 border-gray-700 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">
              Todos os planos incluem:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{b}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* USER SUBSCRIPTION DETAILS - NOW AT BOTTOM */}
        {user && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">
              Minha Assinatura
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Subscription */}
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5 text-green-400" />
                      Assinatura Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentSubscription ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide">Plano</p>
                            <p className="text-white font-semibold">
                              {getPlanName(currentSubscription.plan_type)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide">Status</p>
                            <Badge
                              className={
                                daysRemaining > 7
                                  ? 'bg-green-600'
                                  : daysRemaining > 0
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }
                            >
                              {daysRemaining > 0 ? 'Ativo' : 'Expirado'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide">
                              Dias Restantes
                            </p>
                            <p
                              className={`font-bold text-xl ${
                                daysRemaining > 7
                                  ? 'text-green-400'
                                  : daysRemaining > 0
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {daysRemaining} dias
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide">Expira em</p>
                            <p className="text-white">
                              {new Date(
                                currentSubscription.expires_at
                              ).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleRenewCurrentPlan}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" /> Renovar Assinatura
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-400">
                          Você não possui uma assinatura ativa
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Escolha um plano acima para começar
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Info */}
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-blue-400" />
                      Informações da Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">Membro desde</p>
                        <p className="text-white font-semibold">
                          {accountAge || 'Carregando...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Total de Renovações
                        </p>
                        <p className="text-white font-semibold">
                          {renewalsHistory.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Renewals History */}
                {renewalsHistory.length > 0 && (
                  <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2 text-lg">
                        <History className="h-5 w-5 text-purple-400" />
                        Histórico de Renovações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {renewalsHistory.map((renewal) => (
                          <div
                            key={renewal.id}
                            className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {getPlanName(renewal.plan_type)}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {new Date(renewal.activated_at).toLocaleDateString('pt-BR')} - {new Date(renewal.expires_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <Badge
                              className={
                                renewal.payment_method === 'mercadopago_pix' &&
                                new Date(renewal.expires_at) > new Date()
                                  ? 'bg-green-600 ml-2'
                                  : renewal.payment_method === 'mercadopago_pix'
                                  ? 'bg-gray-600 ml-2'
                                  : 'bg-blue-600 ml-2'
                              }
                            >
                              {renewal.payment_method === 'mercadopago_pix' &&
                              new Date(renewal.expires_at) > new Date()
                                ? 'Ativo'
                                : renewal.payment_method === 'mercadopago_pix'
                                ? 'Expirado'
                                : 'Manual'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPlan && checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <CheckoutPage
            selectedPlan={selectedPlan}
            onClose={() => {
              setCheckoutOpen(false);
              setSelectedPlan(null);
              if (user) loadSubscriptionData();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Planos;
