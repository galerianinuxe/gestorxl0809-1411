import { Scale, Calculator, Printer, Play } from 'lucide-react';
import { LandingHowItWorks as HowItWorksType } from '@/hooks/useLandingData';
import { Button } from '@/components/ui/button';

interface LandingHowItWorksProps {
  items: HowItWorksType[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  Calculator,
  Printer,
};

export function LandingHowItWorks({ items }: LandingHowItWorksProps) {
  if (!items.length) return null;

  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Como Funciona <span className="text-emerald-400">na Prática</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Simples assim. Sem complicação. Feito para quem trabalha no pátio.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {items.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Scale;
            
            return (
              <div 
                key={item.id}
                className="relative group"
              >
                {/* Connection Line (not on last item) */}
                {index < items.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                )}
                
                {/* Card */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {item.step_number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/20 transition-colors">
                    <IconComponent className="w-10 h-10 text-emerald-400" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Video Button (if has video) */}
                  {item.video_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Ver vídeo
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
