import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import MercadoPagoCheckout from '@/components/MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';
import { Calendar, Crown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Landing page sections
import HeroSection from '@/components/landing/HeroSection';
import VideoSection from '@/components/landing/VideoSection';
import ProblemsSection from '@/components/landing/ProblemsSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import ROISection from '@/components/landing/ROISection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PlansSection from '@/components/landing/PlansSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import FooterSection from '@/components/landing/FooterSection';
import MobileStickyCTA from '@/components/landing/MobileStickyCTA';

interface TestimonialData {
  id?: string;
  name: string;
  company: string;
  location: string;
  rating: number;
  text: string;
  revenue: string;
  icon: string;
  profileImage?: string;
}

interface LandingContentSettings {
  id?: string;
  user_id: string;
  hero_badge_text: string;
  hero_main_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_button_text: string;
  logo_url: string;
  background_image_url: string;
  company_name: string;
  company_phone: string;
  footer_text: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  testimonials?: string | TestimonialData[];
  video_enabled?: boolean;
  video_title?: string;
  video_subtitle?: string;
  video_url?: string;
  video_poster_url?: string;
  video_bullets?: string;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { updateMetaTags } = useSEO();
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [contentSettings, setContentSettings] = useState<LandingContentSettings>({
    user_id: '',
    hero_badge_text: 'EVOLUÇÃO NO SEU DEPÓSITO DE RECICLAGEM',
    hero_main_title: 'Chega de papel, caneta e conta de cabeça',
    hero_subtitle: 'Sistema online feito para depósitos de reciclagem, sucatas e ferros velhos que querem organização de verdade.',
    hero_description: 'Ganhe velocidade na balança, controle total dos materiais e veja seu lucro em tempo real.',
    hero_button_text: 'TESTAR GRÁTIS AGORA',
    logo_url: '/lovable-uploads/xlata.site_logotipo.png',
    background_image_url: '/lovable-uploads/capa_xlata.jpg',
    company_name: 'XLata.site Gestor Completo',
    company_phone: '(11) 96351-2105',
    footer_text: '© 2025 XLata. Todos os direitos reservados.',
    seo_title: 'Sistema para Depósito de Reciclagem e Ferro Velho | XLata.site – Balança, Estoque e Lucro',
    seo_description: 'Sistema online para depósito de reciclagem, sucata e ferro velho. Controle de pesagem, estoque, clientes, notas e lucros em um só lugar. Teste grátis 7 dias, sem cartão.',
    seo_keywords: 'sistema para depósito de reciclagem, sistema para reciclagem, programa para ferro velho, software para sucata, controle de balança, controle de materiais recicláveis, sistema PDV reciclagem, xlata, sistema sucata',
    testimonials: [],
    video_enabled: false,
    video_title: 'Veja como funciona em 60 segundos',
    video_subtitle: 'Assista a uma demonstração rápida do sistema XLata.site',
    video_url: '',
    video_poster_url: '',
    video_bullets: '["Pesagem automática e precisa", "Controle total de materiais e estoque", "Relatórios financeiros em tempo real"]'
  });
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const defaultTestimonials: TestimonialData[] = [
    { name: "Gabriel Celestino", company: "JMT Sucata", location: "São Bernardo do Campo - SP", rating: 5, text: "Cara, triplicou minha produtividade! O que levava 15 minutos agora levo 5. Fila acabou!", icon: "Rocket", revenue: "+R$ 8.000/mês", profileImage: "/lovable-uploads/clien01-xlata.png" },
    { name: "Felipe Nunes", company: "BH Sucatas", location: "Guarulhos - SP", rating: 5, text: "Acabaram os erros de conta e as brigas com cliente. Sistema perfeito, recomendo!", icon: "Award", revenue: "+R$ 12.000/mês", profileImage: "/lovable-uploads/clien02-xlata.png" },
    { name: "Hélio Machado", company: "HJM Recicla", location: "Três Corações - MG", rating: 5, text: "Paguei o sistema em 1 mês só com o que parei de perder. Melhor investimento da vida!", icon: "TrendingUp", revenue: "+R$ 15.000/mês", profileImage: "/lovable-uploads/clien03-xlata.png" },
    { name: "Roberto Fernandes", company: "Ferro & Aço Nordeste", location: "Fortaleza - CE", rating: 5, text: "Sistema revolucionou meu negócio! Agora controlo tudo pelo celular e o lucro aumentou muito.", icon: "Star", revenue: "+R$ 10.500/mês", profileImage: "/lovable-uploads/clien04-xlata.png" },
    { name: "Marcos Pereira", company: "Recicla Sul", location: "Curitiba - PR", rating: 5, text: "Antes perdia muito tempo com papelada. Hoje em dia é só pesar, apertar botão e pronto! Fantástico!", icon: "Award", revenue: "+R$ 9.200/mês", profileImage: "/lovable-uploads/clien05-xlata.jpg" },
    { name: "Eduardo Costa", company: "Metais do Centro-Oeste", location: "Campo Grande - MS", rating: 5, text: "Meus clientes adoraram a agilidade no atendimento. Recomendo demais, vale cada centavo!", icon: "TrendingUp", revenue: "+R$ 13.800/mês", profileImage: "/lovable-uploads/clien06-xlata.jpeg" }
  ];

  const loadPlansData = async () => {
    try {
      const { data, error } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('display_order', { ascending: true });
      if (error) throw error;
      const formattedPlans = data?.map(plan => ({
        id: plan.plan_id,
        name: plan.name,
        price: plan.is_promotional && plan.promotional_price ? `R$ ${plan.promotional_price.toFixed(2).replace('.', ',')}` : `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
        period: plan.is_promotional && plan.promotional_period ? plan.promotional_period : plan.period,
        description: plan.description,
        icon: plan.is_promotional ? <Badge className="h-6 w-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">🔥</Badge> : plan.is_popular ? <Crown className="h-6 w-6" /> : <Calendar className="h-6 w-6" />,
        popular: plan.is_popular,
        promotional: plan.is_promotional,
        savings: plan.is_promotional && plan.promotional_description ? plan.promotional_description : plan.savings,
        amount: plan.is_promotional && plan.promotional_price ? plan.promotional_price : plan.amount,
        plan_type: plan.plan_type || plan.plan_id
      })) || [];
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadContentSettings = async () => {
    try {
      const { data, error } = await supabase.from('landing_page_settings').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) { setTestimonials(defaultTestimonials); return; }
      if (data) {
        setContentSettings({ ...data, testimonials: data.testimonials || '[]' });
        let parsedTestimonials: TestimonialData[] = [];
        if (data.testimonials) {
          try {
            parsedTestimonials = typeof data.testimonials === 'string' ? JSON.parse(data.testimonials) : data.testimonials;
          } catch { parsedTestimonials = defaultTestimonials; }
        } else { parsedTestimonials = defaultTestimonials; }
        setTestimonials(parsedTestimonials.length > 0 ? parsedTestimonials : defaultTestimonials);
      } else { setTestimonials(defaultTestimonials); }
    } catch { setTestimonials(defaultTestimonials); }
  };

  useEffect(() => {
    loadContentSettings();
    loadPlansData();
    const handleConfigUpdate = () => { loadContentSettings(); loadPlansData(); };
    window.addEventListener('landingConfigUpdated', handleConfigUpdate);
    return () => window.removeEventListener('landingConfigUpdated', handleConfigUpdate);
  }, []);

  useEffect(() => {
    if (contentSettings.seo_title) {
      updateMetaTags({
        title: contentSettings.seo_title,
        description: contentSettings.seo_description,
        keywords: contentSettings.seo_keywords,
        author: 'Rick Costa',
        ogTitle: contentSettings.seo_title,
        ogDescription: contentSettings.seo_description,
        ogImage: contentSettings.logo_url,
        twitterCard: 'summary_large_image',
        robots: 'index, follow',
        canonical: 'https://xlata.site'
      });
      document.title = contentSettings.seo_title;
    }
  }, [contentSettings, updateMetaTags]);

  const handleSelectPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    if (!user) { navigate('/login'); return; }
    setSelectedPlan({ id: plan.id, name: plan.name, price: plan.price, amount: plan.amount, plan_type: plan.plan_type || plan.id });
    setIsCheckoutOpen(true);
  };

  const videoBullets = contentSettings.video_bullets ? (typeof contentSettings.video_bullets === 'string' ? JSON.parse(contentSettings.video_bullets) : contentSettings.video_bullets) : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <ResponsiveNavigation logoUrl={contentSettings.logo_url} companyName={contentSettings.company_name} companyPhone={contentSettings.company_phone} />
      
      <main>
        <HeroSection
          badgeText={contentSettings.hero_badge_text}
          mainTitle={contentSettings.hero_main_title}
          subtitle={contentSettings.hero_subtitle}
          description={contentSettings.hero_description}
          buttonText={contentSettings.hero_button_text}
          backgroundImageUrl={contentSettings.background_image_url}
        />
        
        <VideoSection
          enabled={contentSettings.video_enabled || false}
          title={contentSettings.video_title || 'Veja como funciona em 60 segundos'}
          subtitle={contentSettings.video_subtitle || ''}
          videoUrl={contentSettings.video_url || ''}
          posterUrl={contentSettings.video_poster_url}
          bullets={videoBullets}
        />
        
        <ProblemsSection />
        <BenefitsSection />
        <ROISection />
        <TestimonialsSection testimonials={testimonials} />
        <PlansSection plans={plans} onSelectPlan={handleSelectPlan} />
        <FAQSection />
        <CTASection />
        <FooterSection companyName={contentSettings.company_name} footerText={contentSettings.footer_text} />
      </main>
      
      <MobileStickyCTA />
      
      {selectedPlan && (
        <MercadoPagoCheckout
          isOpen={isCheckoutOpen}
          onClose={() => { setIsCheckoutOpen(false); setSelectedPlan(null); }}
          selectedPlan={selectedPlan}
        />
      )}
    </div>
  );
};

export default Landing;