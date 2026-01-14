import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import { useLandingData } from '@/hooks/useLandingData';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import MercadoPagoCheckout from '@/components/MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';
import { LazySection } from '@/components/landing/LazySection';
import { ProgressIndicator } from '@/components/landing/ProgressIndicator';
import ActionChoiceModal from '@/components/landing/ActionChoiceModal';

// New modular components
import {
  LandingHero,
  LandingHowItWorks,
  LandingRequirements,
  LandingProblems,
  LandingKPIs,
  LandingVideos,
  LandingTestimonials,
  LandingPlans,
  LandingFAQ,
  LandingCTAFinal,
} from '@/components/landing';

interface LandingContentSettings {
  id?: string;
  user_id?: string;
  hero_badge_text?: string;
  hero_main_title?: string;
  hero_subtitle?: string;
  hero_description?: string;
  hero_button_text?: string;
  logo_url?: string;
  background_image_url?: string;
  company_name?: string;
  company_phone?: string;
  footer_text?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;
  og_title?: string;
  og_description?: string;
  twitter_card?: string;
  canonical_url?: string;
  robots_directive?: string;
  favicon_url?: string;
  author?: string;
  json_ld_data?: string;
  video_url?: string;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { updateMetaTags } = useSEO();
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Fetch all landing data from new tables
  const { 
    sections,
    howItWorks, 
    requirements, 
    problems, 
    kpis, 
    videos, 
    testimonials, 
    faq, 
    ctaFinal,
    isSectionVisible 
  } = useLandingData();

  const [contentSettings, setContentSettings] = useState<LandingContentSettings>({
    hero_badge_text: '✨ 7 dias grátis • Sem cartão',
    hero_main_title: 'Pese, Calcule e Imprima em',
    hero_subtitle: 'Sem erro. Sem fila. Sem discussão.',
    hero_description: 'Sistema completo para depósitos de sucata que querem parar de perder dinheiro com conta errada e cliente desconfiado.',
    hero_button_text: 'Começar Teste Grátis',
    logo_url: '/lovable-uploads/xlata.site_logotipo.png',
    background_image_url: '/lovable-uploads/capa_xlata.jpg',
    company_name: 'XLata.site',
    company_phone: '(11) 96351-2105',
    footer_text: '© 2025 XLata. Todos os direitos reservados.',
    seo_title: 'Sistema para Depósito de Reciclagem e Ferro Velho | XLata.site',
    seo_description: 'O XLata.site é o sistema que para de perder dinheiro no seu depósito. Pesagem rápida, cálculo certo, fornecedor confiando. Teste grátis 7 dias.',
    seo_keywords: 'sistema para depósito de reciclagem, pdv para ferro velho, controle de caixa sucata, software reciclagem',
  });

  const [plans, setPlans] = useState<any[]>([]);

  const loadPlansData = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedPlans = data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.is_promotional && plan.promotional_price 
          ? plan.promotional_price 
          : plan.price,
        period_days: plan.period_days || 30,
        description: plan.description,
        is_popular: plan.is_popular,
        is_active: plan.is_active,
        plan_type: plan.plan_type || plan.plan_id
      })).filter(plan => plan.id !== 'trienal').slice(0, 3) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  useEffect(() => {
    loadContentSettings();
    loadPlansData();

    const handleConfigUpdate = () => {
      loadContentSettings();
      loadPlansData();
    };

    window.addEventListener('landingConfigUpdated', handleConfigUpdate);
    return () => window.removeEventListener('landingConfigUpdated', handleConfigUpdate);
  }, []);

  useEffect(() => {
    if (contentSettings.seo_title) {
      updateMetaTags({
        title: contentSettings.seo_title,
        description: contentSettings.seo_description,
        keywords: contentSettings.seo_keywords,
        author: contentSettings.author || 'XLata.site',
        ogTitle: contentSettings.og_title || contentSettings.seo_title,
        ogDescription: contentSettings.og_description || contentSettings.seo_description,
        ogImage: contentSettings.og_image || contentSettings.logo_url,
        twitterCard: contentSettings.twitter_card || 'summary_large_image',
        robots: contentSettings.robots_directive || 'index, follow',
        canonical: contentSettings.canonical_url || 'https://xlata.site',
        favicon: contentSettings.favicon_url,
        jsonLd: contentSettings.json_ld_data
      });
      document.title = contentSettings.seo_title;
    }
  }, [contentSettings, updateMetaTags]);

  const loadContentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return;
      if (data) {
        setContentSettings(prev => ({ ...prev, ...data }));
      }
    } catch {
      // Keep defaults
    }
  };

  const handleCTAClick = () => {
    setIsActionModalOpen(true);
  };

  const handleWatchVideo = () => {
    const videosSection = document.getElementById('videos');
    if (videosSection) {
      videosSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const planData: PlanData = {
      id: plan.id,
      name: plan.name,
      price: `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
      amount: plan.price,
      plan_type: plan.plan_type || plan.id
    };
    setSelectedPlan(planData);
    setIsCheckoutOpen(true);
  };

  // Sort sections by display_order
  const sortedSections = [...sections].sort((a, b) => a.display_order - b.display_order);

  const renderSection = (sectionKey: string) => {
    if (!isSectionVisible(sectionKey)) return null;

    switch (sectionKey) {
      case 'hero':
        return (
          <LandingHero
            key="hero"
            settings={contentSettings}
            onStartTrial={handleCTAClick}
            onWatchVideo={handleWatchVideo}
          />
        );
      case 'how_it_works':
        return (
          <LazySection key="how_it_works" animation="fade-up">
            <LandingHowItWorks items={howItWorks} />
          </LazySection>
        );
      case 'requirements':
        return (
          <LazySection key="requirements" animation="fade-up">
            <LandingRequirements items={requirements} />
          </LazySection>
        );
      case 'problems':
        return (
          <LazySection key="problems" animation="fade-up">
            <LandingProblems items={problems} />
          </LazySection>
        );
      case 'kpis':
        return (
          <LazySection key="kpis" animation="fade-up">
            <LandingKPIs items={kpis} />
          </LazySection>
        );
      case 'videos':
        return (
          <LazySection key="videos" animation="fade-up">
            <div id="videos">
              <LandingVideos items={videos} />
            </div>
          </LazySection>
        );
      case 'testimonials':
        return (
          <LazySection key="testimonials" animation="fade-up">
            <LandingTestimonials items={testimonials} />
          </LazySection>
        );
      case 'plans':
        return (
          <LazySection key="plans" animation="fade-up">
            <LandingPlans plans={plans} onSelectPlan={handleSelectPlan} />
          </LazySection>
        );
      case 'faq':
        return (
          <LazySection key="faq" animation="fade-up">
            <LandingFAQ items={faq} />
          </LazySection>
        );
      case 'cta_final':
        return (
          <LazySection key="cta_final" animation="scale-in">
            <LandingCTAFinal data={ctaFinal} onStartTrial={handleCTAClick} />
          </LazySection>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      <ResponsiveNavigation 
        logoUrl={contentSettings.logo_url} 
        companyName={contentSettings.company_name} 
        companyPhone={contentSettings.company_phone} 
      />
      
      {/* Progress Indicator */}
      <ProgressIndicator />

      <main role="main">
        {/* Render sections in order from database */}
        {sortedSections.length > 0 
          ? sortedSections.map(section => renderSection(section.section_key))
          : (
            // Fallback: render all sections in default order if no sections loaded yet
            <>
              <LandingHero
                settings={contentSettings}
                onStartTrial={handleCTAClick}
                onWatchVideo={handleWatchVideo}
              />
              <LazySection animation="fade-up">
                <LandingHowItWorks items={howItWorks} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingRequirements items={requirements} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingProblems items={problems} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingKPIs items={kpis} />
              </LazySection>
              <LazySection animation="fade-up">
                <div id="videos">
                  <LandingVideos items={videos} />
                </div>
              </LazySection>
              <LazySection animation="fade-up">
                <LandingTestimonials items={testimonials} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingPlans plans={plans} onSelectPlan={handleSelectPlan} />
              </LazySection>
              <LazySection animation="fade-up">
                <LandingFAQ items={faq} />
              </LazySection>
              <LazySection animation="scale-in">
                <LandingCTAFinal data={ctaFinal} onStartTrial={handleCTAClick} />
              </LazySection>
            </>
          )
        }
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 lg:py-10 px-4 border-t border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-2 lg:gap-6 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/termos-de-uso')} className="text-slate-500 hover:text-white text-xs sm:text-sm">
              Termos de Uso
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/guia-completo')} className="text-slate-500 hover:text-white text-xs sm:text-sm">
              Guia Completo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/planos')} className="text-slate-500 hover:text-white text-xs sm:text-sm">
              Planos
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-slate-500 hover:text-white text-xs sm:text-sm">
              Área do Cliente
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-slate-600 text-xs sm:text-sm">
              {contentSettings.footer_text || `© ${new Date().getFullYear()} XLata.site • Sistema para Depósitos de Reciclagem`}
            </p>
          </div>
        </div>
      </footer>

      {/* MercadoPago Checkout Modal */}
      {selectedPlan && (
        <MercadoPagoCheckout 
          isOpen={isCheckoutOpen} 
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedPlan(null);
          }} 
          selectedPlan={selectedPlan} 
        />
      )}

      {/* Action Choice Modal */}
      <ActionChoiceModal 
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        whatsappNumber="5511963512105"
      />
    </div>
  );
};

export default Landing;
