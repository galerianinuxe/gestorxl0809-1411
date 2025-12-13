import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Crown, ArrowRight, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PlanData } from '@/types/mercadopago';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
  promotional?: boolean;
  savings?: string;
  amount: number;
  plan_type?: string;
}

interface PlansSectionProps {
  plans: Plan[];
  onSelectPlan: (planId: string) => void;
}

const PlansSection: React.FC<PlansSectionProps> = ({ plans, onSelectPlan }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const benefits = [
    "Sistema PDV completo",
    "Controle de estoque e materiais",
    "Relatórios detalhados para gestão e fiscalização",
    "Suporte WhatsApp 24/7"
  ];

  // Show only first 3 plans on landing
  const displayPlans = plans.slice(0, 3);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge className="mb-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium">
            <CreditCard className="h-4 w-4 mr-2" />
            ESCOLHA SEU PLANO
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
            Invista no futuro do seu depósito
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Todos os planos incluem acesso completo ao sistema com{' '}
            <span className="text-emerald-400 font-semibold">todos os recursos para depósitos e ferros velhos</span>
          </p>
        </div>
        
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 max-w-5xl mx-auto">
          {displayPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative bg-gray-900/80 border-2 transition-all duration-300 hover:scale-[1.02] ${
                plan.promotional 
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                  : plan.popular 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Badge */}
              {(plan.promotional || plan.popular) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className={`${plan.promotional ? 'bg-emerald-600 animate-pulse' : 'bg-blue-600'} text-white font-bold px-3 py-1`}>
                    {plan.promotional ? '🔥 OFERTA ESPECIAL' : 'Mais Popular'}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-8 pb-4">
                <div className="flex justify-center mb-3 text-emerald-400">
                  {plan.promotional ? (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl">
                      🔥
                    </div>
                  ) : plan.popular ? (
                    <Crown className="h-10 w-10" />
                  ) : (
                    <Calendar className="h-10 w-10" />
                  )}
                </div>
                <CardTitle className="text-white text-lg sm:text-xl font-bold">{plan.name}</CardTitle>
                <p className="text-gray-500 text-sm">{plan.description}</p>
                
                <div className="mt-4">
                  <span className="text-3xl sm:text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{plan.period}</span>
                </div>
                
                {plan.savings && (
                  <Badge variant="outline" className={`mt-3 ${plan.promotional ? 'text-yellow-400 border-yellow-400/50' : 'text-emerald-400 border-emerald-400/50'}`}>
                    {plan.savings}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  className={`w-full font-bold py-5 ${
                    plan.promotional
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Assinar Plano
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Plans */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/planos')}
            variant="outline"
            className="border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 px-6 py-5"
          >
            Ver Todos os Detalhes dos Planos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;