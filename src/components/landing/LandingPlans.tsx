import { Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  name: string;
  price: number;
  period_days: number;
  description: string | null;
  is_popular: boolean;
  is_active: boolean;
  features?: string[];
}

interface LandingPlansProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
}

export function LandingPlans({ plans, onSelectPlan }: LandingPlansProps) {
  if (!plans.length) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPeriod = (days: number) => {
    if (days === 30) return '/mês';
    if (days === 90) return '/trimestre';
    if (days === 180) return '/semestre';
    if (days === 365) return '/ano';
    return `/${days} dias`;
  };

  // Sort: popular first, then by price
  const sortedPlans = [...plans]
    .filter(p => p.is_active)
    .sort((a, b) => {
      if (a.is_popular && !b.is_popular) return -1;
      if (!a.is_popular && b.is_popular) return 1;
      return a.price - b.price;
    });

  return (
    <section className="py-20 bg-slate-800/50" id="planos">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Escolha Seu <span className="text-emerald-400">Plano</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Todos os planos incluem 7 dias grátis. Sem compromisso. Cancela quando quiser.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {sortedPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-slate-800 border rounded-2xl p-8 transition-all duration-300 hover:shadow-lg ${
                plan.is_popular 
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105' 
                  : 'border-slate-700 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
              }`}
            >
              {/* Popular Badge */}
              {plan.is_popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Mais Popular
                </Badge>
              )}
              
              {/* Plan Name */}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              
              {/* Description */}
              {plan.description && (
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
              )}
              
              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{formatPrice(plan.price)}</span>
                <span className="text-slate-400">{formatPeriod(plan.period_days)}</span>
              </div>
              
              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Pesagens ilimitadas</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Relatórios completos</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Impressão de comprovantes</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>Suporte via WhatsApp</span>
                </li>
                {plan.period_days >= 90 && (
                  <li className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>Desconto especial</span>
                  </li>
                )}
              </ul>
              
              {/* CTA Button */}
              <Button 
                onClick={() => onSelectPlan(plan)}
                className={`w-full py-6 text-lg font-semibold transition-all ${
                  plan.is_popular 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Extra Note */}
        <p className="text-center text-slate-500 text-sm mt-12">
          💳 Pagamento seguro via PIX ou cartão de crédito. Sem taxa de adesão.
        </p>
      </div>
    </section>
  );
}
