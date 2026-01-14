import { TrendingUp, CheckCircle, Heart, Clock, Zap } from 'lucide-react';
import { LandingKPI } from '@/hooks/useLandingData';

interface LandingKPIsProps {
  items: LandingKPI[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  CheckCircle,
  Heart,
  Clock,
  Zap,
};

export function LandingKPIs({ items }: LandingKPIsProps) {
  if (!items.length) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-slate-800 to-emerald-950/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O XLata <span className="text-emerald-400">Resolve</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Resultados reais de depósitos que usam o sistema
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon || 'Zap'] || Zap;
            
            return (
              <div 
                key={item.id}
                className="bg-slate-800/50 border border-emerald-500/20 rounded-2xl p-8 text-center hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-8 h-8 text-emerald-400" />
                </div>
                
                {/* Value */}
                <div className="text-4xl font-bold text-emerald-400 mb-2">
                  {item.value}
                </div>
                
                {/* Label */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.label}
                </h3>
                
                {/* Description */}
                {item.description && (
                  <p className="text-slate-400 text-sm">
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
