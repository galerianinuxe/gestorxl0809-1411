import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Clock, Calculator, Shield, TrendingUp, Users, Star, ArrowRight, Zap, DollarSign, Award, Rocket, AlertTriangle, XCircle, Calendar, Crown, Check, Scale, Printer, HelpCircle, Smartphone, MessageCircle, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import MercadoPagoCheckout from '@/components/MercadoPagoCheckout';
import { PlanData } from '@/types/mercadopago';

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

      {/* Hero Section - Simplified */}
      <section 
        className="pt-20 pb-12 lg:pt-28 lg:pb-20 px-4 relative min-h-[70vh] lg:min-h-[80vh] flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('${contentSettings.background_image_url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 lg:mb-6 leading-tight">
            <span className="text-white">Seu depósito está </span>
            <span className="text-red-400">perdendo dinheiro.</span>
            <br />
            <span className="text-green-400">O XLata resolve.</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 lg:mb-8 max-w-2xl mx-auto">
            Sistema de pesagem e controle que organiza seu pátio em minutos.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => navigate('/register')} 
            className="bg-green-500 hover:bg-green-600 text-white text-base sm:text-lg lg:text-xl px-8 sm:px-12 py-5 sm:py-6 font-bold shadow-xl w-full sm:w-auto mb-6"
          >
            <Zap className="mr-2 h-5 w-5" />
            TESTAR GRÁTIS 7 DIAS
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Micro social proof */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4 text-green-400" />
              130+ depósitos
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              4.9 estrelas
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-green-400" />
              Suporte WhatsApp
            </span>
          </div>
        </div>
      </section>

      {/* How it Works - 3 Steps */}
      <section className="py-10 lg:py-16 px-4 bg-gray-800">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-8 lg:mb-12 text-white">
            Como funciona
          </h2>
          
          <div className="grid grid-cols-3 gap-3 lg:gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 shadow-lg">
                  <item.icon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                </div>
                <p className="text-green-400 font-bold text-lg sm:text-xl lg:text-2xl mb-1">{item.step}</p>
                <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1">{item.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm lg:text-base">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems Section - Reduced & Softened */}
      <section className="py-10 lg:py-16 px-4 bg-gray-900">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
              Onde você está perdendo dinheiro
            </h2>
            <p className="text-gray-400 text-sm lg:text-base">
              A maioria dos depósitos nem sabe quanto perde por mês.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {problems.map((problem, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <problem.icon className="h-5 w-5 text-red-400" />
                    <CardTitle className="text-white text-sm sm:text-base font-semibold">{problem.title}</CardTitle>
                  </div>
                  <p className="text-red-400 font-bold text-lg sm:text-xl">{problem.loss}<span className="text-gray-500 text-sm font-normal">/mês</span></p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-xs sm:text-sm">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-300 mb-4 text-sm lg:text-base">
              Total: até <span className="text-red-400 font-bold">R$ 10.500/mês</span> perdidos
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/register')}
              className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
            >
              QUERO RESOLVER ISSO
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section - 3 Cards Only */}
      <section className="py-10 lg:py-16 px-4 bg-gray-800">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
              O XLata coloca dinheiro de volta no seu bolso
            </h2>
            <p className="text-gray-400 text-sm lg:text-base">
              Resultados reais de quem já usa o sistema.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700 hover:border-green-500/50 transition-all">
                <CardHeader>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
                    <benefit.icon className="h-5 w-5 lg:h-6 lg:w-6 text-green-400" />
                  </div>
                  <CardTitle className="text-white text-base sm:text-lg font-bold mb-2">{benefit.title}</CardTitle>
                  <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                    {benefit.impact}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section - Compact */}
      <section className="py-10 lg:py-16 px-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-white">
            Investimento que se paga no primeiro dia
          </h2>
          
          <div className="grid grid-cols-3 gap-4 lg:gap-8 mb-6 lg:mb-8">
            <div className="bg-gray-800/50 rounded-xl p-4 lg:p-6">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-green-400 mb-1">+300%</p>
              <p className="text-gray-300 text-xs sm:text-sm">produtividade</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 lg:p-6">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-green-400 mb-1">3 min</p>
              <p className="text-gray-300 text-xs sm:text-sm">por descarga</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 lg:p-6">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-green-400 mb-1">0</p>
              <p className="text-gray-300 text-xs sm:text-sm">erros de conta</p>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-xl p-4 lg:p-6 inline-block">
            <p className="text-gray-400 text-sm lg:text-base">
              <span className="text-red-400">Você perde: R$ 10.500/mês</span>
              {" • "}
              <span className="text-green-400">XLata custa: R$ 97/mês</span>
              {" • "}
              <span className="text-white font-bold">Retorno: 108x</span>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section - 3 Cards Only */}
      <section className="py-10 lg:py-16 px-4 bg-gray-900">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
              Quem usa, aprova
            </h2>
            <p className="text-gray-400 text-sm lg:text-base">
              Resultados reais de donos de depósito.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {testimonials.map((testimonial, index) => {
              const IconComponent = getIconComponent(testimonial.icon);
              return (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      {testimonial.profileImage ? (
                        <img 
                          src={testimonial.profileImage} 
                          alt={testimonial.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-green-500" 
                        />
                      ) : (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                        <p className="text-xs text-gray-400">{testimonial.location}</p>
                      </div>
                    </div>
                    
                    <Badge className="bg-green-500/20 text-green-400 border-0 text-xs mb-3">
                      {testimonial.revenue}
                    </Badge>
                    
                    <p className="text-gray-300 text-sm italic">"{testimonial.text}"</p>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plans Section - 1 Highlighted */}
      <section className="py-10 lg:py-16 px-4 bg-gray-800">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
              Escolha seu plano
            </h2>
            <p className="text-gray-400 text-sm lg:text-base">
              Todos incluem acesso completo. Sem módulo extra.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative transition-all ${
                  plan.promotional 
                    ? 'bg-gradient-to-b from-green-900/50 to-gray-800 border-2 border-green-500 shadow-lg shadow-green-500/20 scale-105' 
                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                }`}
              >
                {plan.promotional && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3">
                    🔥 RECOMENDADO
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-white text-lg">{plan.name}</CardTitle>
                  <p className="text-gray-400 text-xs">{plan.description}</p>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <Badge variant="outline" className="mt-2 text-xs text-green-400 border-green-400/50">
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="pt-2">
                  <div className="space-y-2 mb-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span>PDV completo</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span>Controle de estoque</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span>Relatórios</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span>Suporte WhatsApp</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${
                      plan.promotional 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    Começar agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - New */}
      <section className="py-10 lg:py-16 px-4 bg-gray-900">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-white">
              Perguntas frequentes
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4"
              >
                <AccordionTrigger className="text-white text-sm sm:text-base hover:no-underline">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-green-400" />
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 text-sm">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm mb-2">Ainda tem dúvida?</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://wa.me/5511963512105', '_blank')}
              className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chamar no WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 lg:py-20 px-4 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-black mb-4 text-white">
            Cada dia sem sistema é dinheiro jogado fora.
          </h2>
          <p className="text-green-100 mb-6 lg:mb-8 text-sm sm:text-base lg:text-lg">
            Comece agora em 2 minutos. Teste grátis por 7 dias.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => navigate('/register')}
            className="bg-white text-green-700 hover:bg-gray-100 text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 font-bold shadow-xl w-full sm:w-auto"
          >
            <Zap className="mr-2 h-5 w-5" />
            PARAR DE PERDER AGORA
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-green-100 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              7 dias grátis
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Sem cartão
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Cancela quando quiser
            </span>
          </div>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="bg-gray-900 py-6 lg:py-8 px-4 border-t border-gray-800">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-4 lg:gap-8 mb-4 text-sm">
            <Button variant="ghost" size="sm" onClick={() => navigate('/termos-de-uso')} className="text-gray-400 hover:text-white">
              Termos de Uso
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/guia-completo')} className="text-gray-400 hover:text-white">
              Guia Completo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/planos')} className="text-gray-400 hover:text-white">
              Planos
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-gray-400 hover:text-white">
              Área do Cliente
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-gray-500 text-sm">
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
