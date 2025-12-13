import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, ArrowRight, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-6 lg:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
            <Rocket className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 lg:mb-6 max-w-4xl mx-auto leading-tight">
          Pronto para parar de perder dinheiro no seu depósito?
        </h2>
        
        {/* Description */}
        <p className="text-base sm:text-lg lg:text-xl text-emerald-100 mb-8 lg:mb-10 max-w-3xl mx-auto leading-relaxed">
          Teste o XLata.site por 7 dias, sem cartão, e veja seu depósito de reciclagem se transformar em uma{' '}
          <span className="text-yellow-300 font-bold">operação organizada e lucrativa</span>.
        </p>
        
        {/* CTA Button */}
        <div className="mb-8 lg:mb-10">
          <Button
            size="lg"
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-gray-100 text-base sm:text-lg lg:text-xl px-8 sm:px-12 py-6 sm:py-7 font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl border-2 border-yellow-400/50"
          >
            <Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            COMEÇAR TESTE GRÁTIS AGORA
            <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
        
        {/* Trust badges */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 max-w-2xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-emerald-100 text-xs sm:text-sm lg:text-base font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
              7 dias grátis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
              Sem cartão
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
              Suporte 24h
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
              Sem instalar
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;