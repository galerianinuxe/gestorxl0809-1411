
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Calendar, CreditCard, ArrowLeft, MessageSquare, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MercadoPagoCheckout from '@/components/MercadoPagoCheckout';
import SubscriptionManagementModal from '@/components/SubscriptionManagementModal';
import { PlanData } from '@/types/mercadopago';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Planos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [managementModalOpen, setManagementModalOpen] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedPlans = data?.map(plan => ({
        id: plan.plan_id,
        name: plan.name,
        price: plan.is_promotional && plan.promotional_price 
          ? `R$ ${plan.promotional_price.toFixed(2).replace('.', ',')}`
          : `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
        period: plan.is_promotional && plan.promotional_period 
          ? plan.promotional_period 
          : plan.period,
        description: plan.description,
        icon: plan.is_promotional 
          ? <Badge className="h-6 w-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">🔥</Badge>
          : plan.is_popular 
            ? <Crown className="h-6 w-6" />
            : <Calendar className="h-6 w-6" />,
        popular: plan.is_popular,
        promotional: plan.is_promotional,
        savings: plan.is_promotional && plan.promotional_description 
          ? plan.promotional_description 
          : plan.savings,
        amount: plan.is_promotional && plan.promotional_price 
          ? plan.promotional_price 
          : plan.amount
      })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Planos fallback caso falhe
      setPlans([
        {
          id: 'promocional',
          name: 'Plano Promocional',
          price: 'R$ 97,90',
          period: '/mês nos 3 primeiros meses',
          description: 'Oferta especial limitada',
          icon: <Badge className="h-6 w-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">🔥</Badge>,
          popular: false,
          promotional: true,
          savings: 'Depois R$ 147,90/mês',
          amount: 97.90
        },
        {
          id: 'mensal',
          name: 'Plano Mensal',
          price: 'R$ 147,90',
          period: '/mês',
          description: 'Ideal para começar',
          icon: <Calendar className="h-6 w-6" />,
          popular: false,
          savings: null,
          amount: 147.90
        },
        {
          id: 'trimestral',
          name: 'Plano Trimestral',
          price: 'R$ 387,90',
          period: '/3 meses',
          description: 'Melhor custo-benefício',
          icon: <Crown className="h-6 w-6" />,
          popular: true,
          savings: 'Economize R$ 56,80',
          amount: 387.90
        },
        {
          id: 'trienal',
          name: 'Plano Trienal',
          price: 'R$ 4.497,90',
          period: '/3 anos',
          description: 'Máxima economia',
          icon: <CreditCard className="h-6 w-6" />,
          popular: false,
          savings: 'Economize R$ 844,50',
          amount: 4497.90
        }
      ]);
    }
  };

  const benefits = [
    'Acesso total ao sistema PDV',
    'Controle completo de estoque',
    'Relatórios detalhados',
    'Dashboard com métricas',
    'Gestão de caixa avançada',
    'Backup automático na nuvem',
    'Suporte técnico prioritário',
    'Atualizações automáticas'
  ];

  const handleSelectPlan = (planId: string) => {
    // Verificar se o usuário está logado
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para assinar um plano. Redirecionando...",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const planData: PlanData = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      amount: plan.amount
    };

    setSelectedPlan(planData);
    setCheckoutOpen(true);
  };

  return (
    <div
      className="min-h-screen bg-pdv-dark"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%), url('/lovable-uploads/9cb14a9f-019f-4ecf-8d1d-28f3edcb5faa.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-white">Planos de Assinatura</h1>
          </div>
          {user && (
            <Button
              onClick={() => setManagementModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Plano
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Escolha o Plano Ideal para Seu Negócio
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Todos os planos incluem acesso completo ao sistema PDV com todos os recursos e benefícios.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`bg-gray-800/90 border-gray-700 backdrop-blur-sm relative ${
                plan.promotional ? 'ring-2 ring-green-400 shadow-green-400/20 shadow-lg' : 
                plan.popular ? 'ring-2 ring-pdv-green' : ''
              }`}
            >
              {plan.promotional && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white animate-pulse">
                  🔥 OFERTA ESPECIAL
                </Badge>
              )}
              {plan.popular && !plan.promotional && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pdv-green text-white">
                  Mais Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4 text-pdv-green">
                  {plan.icon}
                </div>
                <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                <p className="text-gray-400">{plan.description}</p>
                <div className="text-center mt-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>
                {plan.savings && (
                  <Badge variant="outline" className="text-green-400 border-green-400 mt-2">
                    {plan.savings}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full ${
                    plan.promotional
                      ? 'bg-green-600 hover:bg-green-700 animate-pulse'
                      : plan.popular 
                        ? 'bg-pdv-green hover:bg-green-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                  } flex items-center gap-2`}
                >
                  <Crown className="h-4 w-4" />
                  Assinar Plano
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">
              Todos os Planos Incluem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-pdv-green flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Dúvidas Frequentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <h4 className="text-white font-semibold mb-2">Posso cancelar a qualquer momento?</h4>
                <p className="text-gray-300">Sim, você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento.</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <h4 className="text-white font-semibold mb-2">Os dados ficam seguros?</h4>
                <p className="text-gray-300">Todos os seus dados são armazenados com segurança na nuvem e fazemos backup automático.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {selectedPlan && (
        <MercadoPagoCheckout
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          selectedPlan={selectedPlan}
        />
      )}

      {/* Subscription Management Modal */}
      <SubscriptionManagementModal
        open={managementModalOpen}
        onClose={() => setManagementModalOpen(false)}
      />
    </div>
  );
};

export default Planos;
