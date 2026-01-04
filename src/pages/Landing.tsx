import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, Calculator, Shield, TrendingUp, Users, Star, ArrowRight, Zap, DollarSign, Award, Rocket, AlertTriangle, XCircle, Calendar, Crown, Check, Scale, Printer, HelpCircle, Smartphone, MessageCircle, RefreshCcw, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import MercadoPagoCheckout from '@/components/MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';
import { LazySection } from '@/components/landing/LazySection';
import { ScrollCTA } from '@/components/landing/ScrollCTA';
import { ProgressIndicator } from '@/components/landing/ProgressIndicator';

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
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { updateMetaTags } = useSEO();
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [contentSettings, setContentSettings] = useState<LandingContentSettings>({
    user_id: '',
    hero_badge_text: '130+ depósitos • 4.9★ • Suporte WhatsApp',
    hero_main_title: 'Seu depósito está perdendo dinheiro.',
    hero_subtitle: 'Sistema de pesagem e controle que organiza seu pátio em minutos.',
    hero_description: '',
    hero_button_text: 'TESTAR GRÁTIS 7 DIAS',
    logo_url: '/lovable-uploads/xlata.site_logotipo.png',
    background_image_url: '/lovable-uploads/capa_xlata.jpg',
    company_name: 'XLata.site',
    company_phone: '(11) 96351-2105',
    footer_text: '© 2025 XLata. Todos os direitos reservados.',
    seo_title: 'Sistema para Depósito de Reciclagem e Ferro Velho | XLata.site',
    seo_description: 'O XLata.site é o sistema que para de perder dinheiro no seu depósito. Pesagem rápida, cálculo certo, fornecedor confiando. Teste grátis 7 dias.',
    seo_keywords: 'sistema para depósito de reciclagem, pdv para ferro velho, controle de caixa sucata, software reciclagem',
    testimonials: []
  });
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);

  const defaultTestimonials: TestimonialData[] = [
    {
      name: "Gabriel Celestino",
      company: "JMT Sucata",
      location: "São Bernardo do Campo - SP",
      rating: 5,
      text: "Saí de 20 cargas por dia pra 65. O sistema se pagou na primeira semana.",
      icon: "Rocket",
      revenue: "+R$ 8.000/mês",
      profileImage: "/lovable-uploads/clien01-xlata.png"
    },
    {
      name: "Hélio Machado",
      company: "HJM Recicla",
      location: "Três Corações - MG",
      rating: 5,
      text: "Descobri que tava perdendo R$ 800 por mês em erro de conta. Agora é tudo certo!",
      icon: "TrendingUp",
      revenue: "+R$ 15.000/mês",
      profileImage: "/lovable-uploads/clien03-xlata.png"
    },
    {
      name: "Marcos Pereira",
      company: "Recicla Sul",
      location: "Curitiba - PR",
      rating: 5,
      text: "Fornecedor agora confia no peso e volta toda semana. Antes ia pro concorrente!",
      icon: "Award",
      revenue: "+R$ 9.200/mês",
      profileImage: "/lovable-uploads/clien05-xlata.jpg"
    }
  ];

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
        id: plan.plan_id,
        name: plan.name,
        price: plan.is_promotional && plan.promotional_price 
          ? `R$ ${plan.promotional_price.toFixed(2).replace('.', ',')}` 
          : `R$ ${plan.price.toFixed(2).replace('.', ',')}`,
        period: plan.is_promotional && plan.promotional_period 
          ? plan.promotional_period 
          : plan.period,
        description: plan.description,
        popular: plan.is_popular,
        promotional: plan.is_promotional,
        savings: plan.is_promotional && plan.promotional_description 
          ? plan.promotional_description 
          : plan.savings,
        amount: plan.is_promotional && plan.promotional_price 
          ? plan.promotional_price 
          : plan.amount,
        plan_type: plan.plan_type || plan.plan_id
      })).filter(plan => plan.id !== 'trienal').slice(0, 3) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setPlans([
        {
          id: 'promocional',
          name: 'Promocional',
          price: 'R$ 97,90',
          period: '/mês',
          description: '3 primeiros meses',
          popular: false,
          promotional: true,
          savings: 'Depois R$ 147,90/mês',
          amount: 97.90
        },
        {
          id: 'mensal',
          name: 'Mensal',
          price: 'R$ 147,90',
          period: '/mês',
          description: 'Sem fidelidade',
          popular: false,
          savings: null,
          amount: 147.90
        },
        {
          id: 'trimestral',
          name: 'Trimestral',
          price: 'R$ 387,90',
          period: '/3 meses',
          description: 'Melhor custo-benefício',
          popular: true,
          savings: 'Economize R$ 56,80',
          amount: 387.90
        }
      ]);
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

  const loadContentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setTestimonials(defaultTestimonials);
        return;
      }

      if (data) {
        setContentSettings(prev => ({ ...prev, ...data }));
        
        let parsedTestimonials: TestimonialData[] = [];
        if (data.testimonials) {
          try {
            parsedTestimonials = typeof data.testimonials === 'string' 
              ? JSON.parse(data.testimonials) 
              : data.testimonials;
            parsedTestimonials = parsedTestimonials.slice(0, 3);
          } catch {
            parsedTestimonials = defaultTestimonials;
          }
        } else {
          parsedTestimonials = defaultTestimonials;
        }
        setTestimonials(parsedTestimonials.length > 0 ? parsedTestimonials : defaultTestimonials);
      } else {
        setTestimonials(defaultTestimonials);
      }
    } catch {
      setTestimonials(defaultTestimonials);
    }
  };

  const handleSelectPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const planData: PlanData = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      amount: plan.amount,
      plan_type: plan.plan_type || plan.id
    };
    setSelectedPlan(planData);
    setIsCheckoutOpen(true);
  };

  // 3 Benefits only
  const benefits = [
    {
      icon: Clock,
      title: "3x mais caminhões/dia",
      description: "Pese, calcule e imprima comprovante em 3 minutos. Fila acabou.",
      impact: "+300% produtividade"
    },
    {
      icon: Calculator,
      title: "Zero erros de cálculo",
      description: "Sistema calcula peso, preço e tara automaticamente. Cada centavo certo.",
      impact: "0 erro garantido"
    },
    {
      icon: Shield,
      title: "Fornecedor volta sempre",
      description: "Comprovante profissional, peso transparente. Confiança que fideliza.",
      impact: "+40% fidelização"
    }
  ];

  // 3 Problems only (reduced from 6)
  const problems = [
    {
      title: "Fila na balança",
      loss: "R$ 3.500",
      description: "Caminhões cansam de esperar e vão pro concorrente.",
      icon: Clock
    },
    {
      title: "Erros de conta",
      loss: "R$ 2.800",
      description: "Peso errado, preço trocado. Cada erro é prejuízo.",
      icon: XCircle
    },
    {
      title: "Fornecedor desconfia",
      loss: "R$ 4.200",
      description: "Sem comprovante claro, ele vende pro vizinho.",
      icon: AlertTriangle
    }
  ];

  // How it works - 3 steps
  const howItWorks = [
    {
      step: "1",
      icon: Scale,
      title: "Pese",
      description: "Insira o peso no sistema"
    },
    {
      step: "2",
      icon: Calculator,
      title: "Calcule",
      description: "Preço, tara, total automático"
    },
    {
      step: "3",
      icon: Printer,
      title: "Pague",
      description: "Comprovante profissional impresso"
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "Precisa instalar algo?",
      answer: "Não! O XLata funciona 100% online. Acesse de qualquer navegador, no celular ou computador."
    },
    {
      question: "Funciona no celular?",
      answer: "Sim! O sistema é responsivo e funciona perfeitamente em celulares, tablets e computadores."
    },
    {
      question: "Como é o suporte?",
      answer: "Suporte humanizado via WhatsApp. Travou? Manda um zap e resolvemos na hora."
    },
    {
      question: "E se eu não gostar?",
      answer: "Teste 7 dias grátis, sem cartão. Não gostou? Cancela sem explicar nada."
    }
  ];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Rocket': return Rocket;
      case 'Award': return Award;
      case 'TrendingUp': return TrendingUp;
      default: return Star;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      <ResponsiveNavigation 
        logoUrl={contentSettings.logo_url} 
        companyName={contentSettings.company_name} 
        companyPhone={contentSettings.company_phone} 
      />
      
      {/* Progress Indicator */}
      <ProgressIndicator />

      <main role="main">
      {/* Hero Section - Loads immediately */}
      <section 
        id="hero"
        className="pt-16 pb-10 lg:pt-24 lg:pb-16 px-4 relative min-h-[60vh] lg:min-h-[75vh] flex items-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(3, 7, 18, 0.85), rgba(3, 7, 18, 0.95)), url('${contentSettings.background_image_url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto text-center relative z-10 max-w-3xl">
          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-5 leading-tight tracking-tight">
            <span className="text-white">Seu depósito está </span>
            <span className="text-red-400">perdendo dinheiro.</span>
            <br className="hidden sm:block" />
            <span className="text-green-400"> O XLata resolve.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-400 text-base sm:text-lg lg:text-xl mb-8 lg:mb-10 max-w-xl mx-auto leading-relaxed">
            Sistema de pesagem e controle que organiza seu pátio em minutos.
          </p>
          
          {/* CTA Button */}
          <Button 
            size="lg" 
            onClick={() => navigate('/register')} 
            className="bg-green-600 hover:bg-green-700 text-white text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 font-semibold shadow-lg shadow-green-600/20 rounded-xl mb-8"
          >
            <Zap className="mr-2 h-5 w-5" />
            TESTAR GRÁTIS 7 DIAS
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Social Proof Pills */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-8">
            <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full border border-gray-700/50">
              <Users className="h-3.5 w-3.5 text-green-400" />
              <span className="text-gray-300">130+ depósitos</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full border border-gray-700/50">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-gray-300">4.9 estrelas</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-800/60 px-3 py-1.5 rounded-full border border-gray-700/50">
              <MessageCircle className="h-3.5 w-3.5 text-green-400" />
              <span className="text-gray-300">Suporte WhatsApp</span>
            </div>
          </div>
          
          {/* Scroll CTA */}
          <ScrollCTA 
            text="Veja como funciona" 
            targetSection="como-funciona" 
            variant="subtle"
          />
        </div>
      </section>

      {/* How it Works - 3 Steps */}
      <LazySection id="como-funciona" animation="fade-up">
        <section className="py-12 lg:py-20 px-4 bg-gray-900/50">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-10 lg:mb-14 text-white">
              Como funciona
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 lg:gap-12">
              {howItWorks.map((item, index) => (
                <div key={index} className="text-center flex flex-col items-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-600/20">
                    <item.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <span className="inline-block text-green-400 font-semibold text-xs mb-2 bg-green-400/10 px-3 py-1 rounded-full">{item.step}</span>
                  <h3 className="text-white font-semibold text-base sm:text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">{item.description}</p>
                </div>
              ))}
            </div>
            
            <ScrollCTA 
              text="Descubra quanto você perde" 
              targetSection="problemas" 
              variant="subtle"
              className="mt-10"
            />
          </div>
        </section>
      </LazySection>

      {/* Problems Section - Clean */}
      <LazySection id="problemas" animation="fade-up" delay={100}>
        <section className="py-12 lg:py-20 px-4 bg-gray-950">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10 lg:mb-14">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
                Onde você está perdendo dinheiro
              </h2>
              <p className="text-gray-400 text-sm lg:text-base">
                A maioria dos depósitos nem sabe quanto perde por mês.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-8 lg:mb-10">
              {problems.map((problem, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <problem.icon className="h-4 w-4 text-red-400" />
                      </div>
                      <CardTitle className="text-white text-sm sm:text-base font-medium">{problem.title}</CardTitle>
                    </div>
                    <p className="text-red-400 font-bold text-xl sm:text-2xl">{problem.loss}<span className="text-gray-500 text-sm font-normal">/mês</span></p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-400 text-sm leading-relaxed">{problem.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-300 mb-5 text-sm lg:text-base">
                Total: até <span className="text-red-400 font-semibold">R$ 10.500/mês</span> perdidos
              </p>
              
              {/* Identificação + CTA Direto */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 max-w-md mx-auto mb-6">
                <p className="text-gray-300 text-sm mb-4">
                  Se identificou com algum desses problemas?
                </p>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 font-medium"
                >
                  Quero resolver agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-gray-500 text-xs mt-3">
                  ou continue lendo para ver como funciona
                </p>
              </div>
              
              <ScrollCTA 
                text="Veja a solução" 
                targetSection="beneficios" 
                variant="subtle"
              />
            </div>
          </div>
        </section>
      </LazySection>

      {/* Benefits Section - Clean */}
      <LazySection id="beneficios" animation="fade-up">
        <section className="py-12 lg:py-20 px-4 bg-gray-900/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10 lg:mb-14">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
                O XLata coloca dinheiro de volta no seu bolso
              </h2>
              <p className="text-gray-400 text-sm lg:text-base">
                Resultados reais de quem já usa o sistema.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 bg-green-600/15 rounded-xl flex items-center justify-center mb-4">
                      <benefit.icon className="h-5 w-5 text-green-400" />
                    </div>
                    <CardTitle className="text-white text-base sm:text-lg font-semibold mb-2">{benefit.title}</CardTitle>
                    <Badge className="bg-green-600/15 text-green-400 border-0 text-xs w-fit">
                      {benefit.impact}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <ScrollCTA 
              text="Veja o retorno" 
              targetSection="roi" 
              variant="subtle"
              className="mt-10"
            />
          </div>
        </section>
      </LazySection>

      {/* ROI Section */}
      <LazySection id="roi" animation="scale-in">
        <section className="py-12 lg:py-20 px-4 bg-gray-900">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8 lg:mb-12 text-white">
              Investimento que se paga no primeiro dia
            </h2>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-6 lg:mb-10">
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
                <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-green-400 mb-0.5 sm:mb-1">+300%</p>
                <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm">produtividade</p>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
                <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-green-400 mb-0.5 sm:mb-1">3 min</p>
                <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm">por descarga</p>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
                <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-green-400 mb-0.5 sm:mb-1">0</p>
                <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm">erros de conta</p>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-xs sm:text-sm lg:text-base mb-8">
              <span className="text-red-400">Você perde: R$ 10.500/mês</span>
              <span className="text-gray-700 hidden sm:inline">•</span>
              <span className="text-green-400">XLata custa: {plans.find(p => p.id === 'mensal')?.price || 'R$ 137,90'}/mês</span>
              <span className="text-gray-700 hidden sm:inline">•</span>
              <span className="text-white font-semibold">Retorno: {plans.find(p => p.id === 'mensal')?.amount ? Math.round(10500 / plans.find(p => p.id === 'mensal')!.amount) : 76}x</span>
            </div>
            
            <ScrollCTA 
              text="Quem já usa, aprova" 
              targetSection="depoimentos" 
              variant="subtle"
            />
          </div>
        </section>
      </LazySection>

      {/* Testimonials Section */}
      <LazySection id="depoimentos" animation="fade-up">
        <section className="py-12 lg:py-20 px-4 bg-gray-950">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10 lg:mb-14">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
                Quem usa, aprova
              </h2>
              <p className="text-gray-400 text-sm lg:text-base">
                Resultados reais de donos de depósito.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              {testimonials.map((testimonial, index) => {
                const IconComponent = getIconComponent(testimonial.icon);
                return (
                  <Card key={index} className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-0.5 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                      {testimonial.profileImage ? (
                          <img 
                            src={testimonial.profileImage} 
                            alt={testimonial.name}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-700" 
                          />
                        ) : (
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white text-sm">{testimonial.name}</p>
                          <p className="text-xs text-gray-500">{testimonial.location}</p>
                        </div>
                      </div>
                      
                      <Badge className="bg-green-600/15 text-green-400 border-0 text-xs w-fit mb-3">
                        {testimonial.revenue}
                      </Badge>
                      
                      <p className="text-gray-300 text-sm leading-relaxed">"{testimonial.text}"</p>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
            
            <ScrollCTA 
              text="Escolha seu plano" 
              targetSection="planos" 
              variant="primary"
              className="mt-10"
            />
          </div>
        </section>
      </LazySection>

      {/* Plans Section */}
      <LazySection id="planos" animation="fade-up">
        <section className="py-12 lg:py-20 px-4 bg-gray-900/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10 lg:mb-14">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
                Escolha seu plano
              </h2>
              <p className="text-gray-400 text-sm lg:text-base">
                Todos incluem acesso completo. <span className="text-green-400">Sem fidelidade - cancele quando quiser.</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all ${
                    plan.promotional 
                      ? 'bg-gray-900 border-2 border-green-600 shadow-lg shadow-green-600/10' 
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {plan.promotional && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1">
                      RECOMENDADO
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-3 pt-6">
                    <CardTitle className="text-white text-lg font-semibold">{plan.name}</CardTitle>
                    <p className="text-gray-500 text-xs">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-2xl sm:text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <Badge variant="outline" className="mt-3 text-xs text-green-400 border-green-600/30 bg-green-600/10">
                        {plan.savings}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-3">
                    <div className="space-y-2.5 mb-5 text-sm">
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>PDV completo</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>Controle de estoque</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>Relatórios</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>Suporte WhatsApp</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full h-11 font-medium ${
                        plan.promotional 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                      }`}
                    >
                      Começar agora
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <ScrollCTA 
              text="Ainda tem dúvidas?" 
              targetSection="faq" 
              variant="subtle"
              className="mt-10"
            />
          </div>
        </section>
      </LazySection>

      {/* FAQ Section */}
      <LazySection id="faq" animation="fade-up">
        <section className="py-12 lg:py-20 px-4 bg-gray-950">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
                Perguntas frequentes
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4"
                >
                  <AccordionTrigger className="text-white text-sm sm:text-base hover:no-underline py-4">
                    <span className="flex items-center gap-2.5 text-left">
                      <HelpCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 text-sm pb-4 leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm mb-3">Ainda tem dúvida?</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://wa.me/5511963512105', '_blank')}
                className="border-gray-700 text-gray-300 hover:bg-green-600 hover:text-white hover:border-green-600 bg-transparent"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chamar no WhatsApp
              </Button>
            </div>
          </div>
        </section>
      </LazySection>

      {/* Final CTA Section */}
      <LazySection animation="scale-in">
        <section className="py-14 lg:py-24 px-4 bg-gradient-to-br from-green-700 via-green-600 to-emerald-600">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-white leading-tight">
              Cada dia sem sistema é dinheiro jogado fora.
            </h2>
            <p className="text-green-100/80 mb-8 text-sm sm:text-base lg:text-lg">
              Comece agora em 2 minutos. Teste grátis por 7 dias.
            </p>
            
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="bg-white text-green-700 hover:bg-gray-100 text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 font-semibold shadow-lg rounded-xl"
            >
              <Zap className="mr-2 h-5 w-5" />
              PARAR DE PERDER AGORA
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 text-sm text-green-100/80 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                7 dias grátis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Sem cartão
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Cancela quando quiser
              </span>
            </div>
          </div>
        </section>
      </LazySection>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 py-8 lg:py-10 px-4 border-t border-gray-900">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-2 lg:gap-6 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/termos-de-uso')} className="text-gray-500 hover:text-white text-xs sm:text-sm">
              Termos de Uso
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/guia-completo')} className="text-gray-500 hover:text-white text-xs sm:text-sm">
              Guia Completo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/planos')} className="text-gray-500 hover:text-white text-xs sm:text-sm">
              Planos
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-gray-500 hover:text-white text-xs sm:text-sm">
              Área do Cliente
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              © {new Date().getFullYear()} XLata.site • Sistema para Depósitos de Reciclagem
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
    </div>
  );
};

export default Landing;
