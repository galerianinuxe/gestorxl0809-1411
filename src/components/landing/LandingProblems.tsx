import { Clock, Calculator, UserX, FileX, XCircle, AlertTriangle } from 'lucide-react';
import { LandingProblem } from '@/hooks/useLandingData';

interface LandingProblemsProps {
  items: LandingProblem[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Calculator,
  UserX,
  FileX,
  XCircle,
  AlertTriangle,
};

export function LandingProblems({ items }: LandingProblemsProps) {
  if (!items.length) return null;

  const totalLoss = items.reduce((sum, item) => {
    const value = parseFloat(item.loss_value.replace(/[^\d]/g, ''));
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-red-950/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">Atenção: Isso está custando dinheiro</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Onde Você <span className="text-red-400">Perde Dinheiro</span> Hoje
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Problemas comuns que parecem pequenos, mas somam no final do mês
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon] || XCircle;
            
            return (
              <div 
                key={item.id}
                className="bg-slate-800/50 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                  <IconComponent className="w-7 h-7 text-red-400" />
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                
                {/* Loss Value */}
                <div className="text-2xl font-bold text-red-400 mb-3">
                  -{item.loss_value}
                </div>
                
                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Total Loss */}
        {totalLoss > 0 && (
          <div className="text-center">
            <div className="inline-block bg-red-500/10 border border-red-500/30 rounded-2xl px-8 py-6">
              <p className="text-slate-400 mb-2">Perda estimada por mês:</p>
              <p className="text-4xl font-bold text-red-400">
                -R$ {totalLoss.toLocaleString('pt-BR')}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                São R$ {(totalLoss * 12).toLocaleString('pt-BR')} por ano escorrendo pelo ralo
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
