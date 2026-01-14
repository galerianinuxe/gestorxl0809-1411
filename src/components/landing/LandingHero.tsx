import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Star, Users, Shield } from 'lucide-react';

interface LandingHeroProps {
  settings: {
    hero_main_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    hero_button_text?: string;
    hero_badge_text?: string;
    hero_highlight_text?: string;
    hero_secondary_button_text?: string;
    hero_social_proof_users?: string;
    hero_social_proof_users_label?: string;
    hero_social_proof_rating?: string;
    hero_social_proof_rating_label?: string;
    hero_security_label?: string;
    background_image_url?: string;
    video_url?: string;
  } | null;
  onStartTrial: () => void;
  onWatchVideo: () => void;
}

export function LandingHero({ settings, onStartTrial, onWatchVideo }: LandingHeroProps) {
  const title = settings?.hero_main_title || 'Pese, Calcule e Imprima em';
  const highlight = settings?.hero_highlight_text || '3 Minutos';
  const subtitle = settings?.hero_subtitle || 'Sem erro. Sem fila. Sem discussão.';
  const description = settings?.hero_description || 'Sistema completo para depósitos de sucata que querem parar de perder dinheiro com conta errada e cliente desconfiado.';
  const buttonText = settings?.hero_button_text || 'Começar Teste Grátis';
  const secondaryButtonText = settings?.hero_secondary_button_text || 'Ver Como Funciona';
  const badgeText = settings?.hero_badge_text || '✨ 7 dias grátis • Sem cartão';
  
  // Social proof - all editable
  const socialProofUsers = settings?.hero_social_proof_users || '130+';
  const socialProofUsersLabel = settings?.hero_social_proof_users_label || 'depósitos ativos';
  const socialProofRating = settings?.hero_social_proof_rating || '4.9';
  const socialProofRatingLabel = settings?.hero_social_proof_rating_label || 'de satisfação';
  const securityLabel = settings?.hero_security_label || 'Dados 100% seguros';

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge 
            variant="outline" 
            className="mb-6 px-4 py-2 text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-fade-in"
          >
            {badgeText}
          </Badge>
          
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in">
            {title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              {highlight}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-emerald-400 font-medium mb-4 animate-fade-in">
            {subtitle}
          </p>
          
          {/* Description */}
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto animate-fade-in">
            {description}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
            <Button 
              size="lg" 
              onClick={onStartTrial}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
            >
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onWatchVideo}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              {secondaryButtonText}
            </Button>
          </div>
          
          {/* Social Proof - All editable */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 animate-fade-in">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              <span><strong className="text-white">{socialProofUsers}</strong> {socialProofUsersLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span><strong className="text-white">{socialProofRating}</strong> {socialProofRatingLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span dangerouslySetInnerHTML={{ __html: securityLabel.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  );
}
