import { Check, Smartphone, Wifi, Scale, Printer } from 'lucide-react';
import { LandingRequirement } from '@/hooks/useLandingData';

interface LandingRequirementsProps {
  items: LandingRequirement[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Check,
  Smartphone,
  Wifi,
  Scale,
  Printer,
};

export function LandingRequirements({ items }: LandingRequirementsProps) {
  if (!items.length) return null;

  return (
    <section className="py-16 bg-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              O que Você <span className="text-emerald-400">Precisa</span> para Usar
            </h2>
            <p className="text-slate-400">
              Provavelmente você já tem tudo isso no seu depósito
            </p>
          </div>

          {/* Requirements Checklist */}
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item) => {
              const IconComponent = iconMap[item.icon] || Check;
              
              return (
                <div 
                  key={item.id}
                  className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-white font-medium">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Extra Note */}
          <p className="text-center text-slate-500 text-sm mt-8">
            💡 Não precisa trocar nada. Funciona com o que você já tem.
          </p>
        </div>
      </div>
    </section>
  );
}
