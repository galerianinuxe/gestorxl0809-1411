import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Calendar, CreditCard, ArrowLeft, RefreshCw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MercadoPagoCheckout from '@/components/MercadoPagoCheckout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// === AJUSTES AQUI ===
// Corrigindo o tipo do plano selecionado
interface SelectedPlan {
  id: string;
  name: string;
  price: string;
  amount: number;
  plan_type: string; // 👈 NECESSÁRIO para o external_reference
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
    loadPlans();
    if (user) {
      loadSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // === AJUSTES AQUI ===
      // Simplifica structure pro TS não pirar
      const formattedPlans = data?.map((plan) => ({
        id: plan.id,
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
        amount: plan.is_promotional && plan.promotional_price
          ? plan.promotional_price
          : plan.price,
        plan_type: plan.plan_type, // 👈 IMPORTANTE PARA O PROCESSO
      })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para assinar.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // === AJUSTES AQUI ===
    // Agora está levando o plan_type pro backend!
    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      amount: plan.amount,
      plan_type: plan.plan_type, // 👈 SENDO PASSADO PRO CHECKOUT
    });

    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* ... todo o resto do seu layout e renderização */}
      {selectedPlan && (
        <MercadoPagoCheckout
          isOpen={checkoutOpen}
          selectedPlan={selectedPlan} // 👈 Agora com plan_type disponível
          onClose={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
            if (user) loadSubscriptionData();
          }}
        />
      )}
    </div>
  );
};

export default Planos;
