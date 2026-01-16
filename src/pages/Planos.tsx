import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Calendar, CreditCard, RefreshCw, User, History, Clock, Zap } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { useNavigate } from 'react-router-dom';
import CheckoutPage from '@/components/checkout/CheckoutPage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/PublicLayout';

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

// Hierarquia dos planos (do menor para o maior)
const PLAN_HIERARCHY: Record<string, number> = {
  trial: 0,
  monthly: 1,
  quarterly: 2,
  biannual: 3,
  annual: 4,
  triennial: 5,
};

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
    const loadData = async () => {
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);

      try {
        if (user) {
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
            <Zap className="h-5 w-5" />
          ) : plan.is_popular ? (
            <Crown className="h-5 w-5" />
          ) : (
            <Calendar className="h-5 w-5" />
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
          .select('id, plan_type, is_active, expires_at, activated_at, payment_method')
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

  // Filtrar planos - mostrar apenas superiores ao atual
  const getAvailablePlans = () => {
    if (!currentSubscription) return plans;
    
    const currentPlanLevel = PLAN_HIERARCHY[currentSubscription.plan_type] ?? -1;
    
    // Mostrar planos superiores OU o mesmo plano para renovação
    return plans.filter((plan) => {
      const planLevel = PLAN_HIERARCHY[plan.plan_type] ?? 0;
      return planLevel >= currentPlanLevel;
    });
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
    'Gerenciamento de estoque',
    'Controle de compras e vendas',
    'Relatórios detalhados',
    'Sistema de caixa integrado',
    'Suporte técnico',
  ];

  const daysRemaining = getDaysRemaining();
  const availablePlans = getAvailablePlans();

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Título da Página */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            <h1 className="text-lg font-bold text-white">Planos e Preços</h1>
          </div>
          <ContextualHelpButton module="assinatura" />
        </div>
        
        {/* Seção: Minha Assinatura (primeiro se logado) */}
        {user && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                Minha Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
                </div>
              ) : currentSubscription ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Plano</p>
                    <p className="text-white font-semibold">
                      {getPlanName(currentSubscription.plan_type)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Status</p>
                    <Badge
                      className={
                        daysRemaining > 7
                          ? 'bg-emerald-600'
                          : daysRemaining > 0
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }
                    >
                      {daysRemaining > 0 ? 'Ativo' : 'Expirado'}
                    </Badge>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Dias Restantes</p>
                    <p className={`font-bold text-lg ${
                      daysRemaining > 7 ? 'text-emerald-400' : daysRemaining > 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {daysRemaining}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Expira em</p>
                    <p className="text-white text-sm">
                      {new Date(currentSubscription.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400">Nenhuma assinatura ativa</p>
                  <p className="text-slate-500 text-sm">Escolha um plano abaixo</p>
                </div>
              )}

              {/* Info da conta e botão de renovar */}
              {currentSubscription && (
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-400">Membro há:</span>
                      <span className="text-white">{accountAge || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-400">Renovações:</span>
                      <span className="text-white">{renewalsHistory.length}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleRenewCurrentPlan}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Renovar Plano
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Histórico de Renovações (compacto) */}
        {user && renewalsHistory.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-purple-400" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {renewalsHistory.slice(0, 6).map((renewal) => (
                  <div
                    key={renewal.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full text-sm"
                  >
                    <span className="text-white">{getPlanName(renewal.plan_type)}</span>
                    <span className="text-slate-400 text-xs">
                      {new Date(renewal.activated_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        new Date(renewal.expires_at) > new Date()
                          ? 'bg-emerald-600/20 text-emerald-400'
                          : 'bg-slate-600/50 text-slate-400'
                      }`}
                    >
                      {new Date(renewal.expires_at) > new Date() ? 'Ativo' : 'Exp.'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefícios (compacto) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-300 text-sm font-medium mb-3">Todos os planos incluem:</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-400">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Planos Disponíveis */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {currentSubscription ? 'Upgrade de Plano' : 'Escolha seu Plano'}
            </h2>
            {currentSubscription && (
              <Badge variant="outline" className="text-slate-400 border-slate-600">
                Mostrando planos superiores
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlans.map((plan) => {
              const isCurrentPlan = currentSubscription?.plan_type === plan.plan_type;
              
              return (
                <Card
                  key={plan.id}
                  className={`relative bg-slate-800 border-2 transition-all hover:border-emerald-500/50 ${
                    plan.popular ? 'border-emerald-500' : isCurrentPlan ? 'border-blue-500' : 'border-slate-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-xs">Mais Popular</Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-blue-600 text-xs">Seu Plano</Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-emerald-400">{plan.icon}</span>
                          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                        </div>
                        <p className="text-slate-400 text-sm">{plan.period}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{plan.price}</p>
                        {plan.savings && (
                          <p className="text-emerald-400 text-xs">{plan.savings}</p>
                        )}
                      </div>
                    </div>
                    
                    {plan.description && (
                      <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                    )}
                    
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : isCurrentPlan
                          ? 'bg-blue-600 hover:bg-blue-500'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {isCurrentPlan ? 'Renovar' : 'Assinar'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {availablePlans.length === 0 && (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Você já possui o plano mais completo!</p>
              <p className="text-slate-400 text-sm">Não há planos superiores disponíveis</p>
            </div>
          )}
        </div>
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
    </PublicLayout>
  );
};

export default Planos;
