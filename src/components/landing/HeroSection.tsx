import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  badgeText: string;
  mainTitle: string;
  subtitle: string;
  description: string;
  buttonText: string;
  backgroundImageUrl: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  badgeText,
  mainTitle,
  subtitle,
  description,
  buttonText,
  backgroundImageUrl
}) => {
  const navigate = useNavigate();

  // Split title for styled rendering
  const titleParts = mainTitle.split(',');
  const firstPart = titleParts[0] || '';
  const secondPart = titleParts.slice(1).join(',').trim() || 'conta de cabeça!';

  return (
    <section 
      className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.85)), url('${backgroundImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-black/60" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-6 lg:mb-8 animate-fade-in">
            <Badge className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold text-xs sm:text-sm lg:text-base px-4 sm:px-6 py-2 sm:py-3 shadow-xl border-0 rounded-full">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{badgeText}</span>
            </Badge>
          </div>
          
          {/* Main Title - H1 único para SEO */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 lg:mb-8 leading-[1.1] tracking-tight">
            <span className="block text-white drop-shadow-lg">
              {firstPart}{firstPart && ','}
            </span>
            <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent mt-2">
              {secondPart}
            </span>
          </h1>
          
          {/* Subtitle */}
          <div className="max-w-3xl mx-auto mb-8 lg:mb-10 space-y-3">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 font-medium leading-relaxed">
              {subtitle}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-400">
              {description}
            </p>
          </div>
          
          {/* CTA Button */}
          <div className="mb-8 lg:mb-12">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-base sm:text-lg lg:text-xl px-8 sm:px-12 py-6 sm:py-7 font-bold shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-all duration-300 rounded-xl border-2 border-emerald-400/30"
            >
              <Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
          
          {/* Trust badges */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-emerald-500/20 max-w-2xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-emerald-200 text-xs sm:text-sm lg:text-base font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                7 dias grátis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                Sem cartão
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                Suporte WhatsApp
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                100% online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;