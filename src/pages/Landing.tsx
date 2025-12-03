import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Calculator, Shield, TrendingUp, Users, Star, ArrowRight, Zap, DollarSign, BarChart3, Target, Award, Sparkles, Rocket, TrendingDown, AlertTriangle, XCircle, PhoneCall, MessageSquare, Calendar, LogIn, User2, BarChart, CreditCard, Crown, Check } from 'lucide-react';
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
    testimonials: []
  });
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);

  // Default testimonials (fallback)
  const defaultTestimonials: TestimonialData[] = [
    {
      name: "Gabriel Celestino",
      company: "JMT Sucata",
      location: "São Bernardo do Campo - SP",
      rating: 5,
      text: "Cara, triplicou minha produtividade! O que levava 15 minutos agora levo 5. Fila acabou!",
      icon: "Rocket",
      revenue: "+R$ 8.000/mês",
      profileImage: "/lovable-uploads/clien01-xlata.png"
    },
    {
      name: "Felipe Nunes",
      company: "BH Sucatas",
      location: "Guarulhos - SP", 
      rating: 5,
      text: "Acabaram os erros de conta e as brigas com cliente. Sistema perfeito, recomendo!",
      icon: "Award",
      revenue: "+R$ 12.000/mês",
      profileImage: "/lovable-uploads/clien02-xlata.png"
    },
    {
      name: "Hélio Machado",
      company: "HJM Recicla",
      location: "Três Corações - MG",
      rating: 5,
      text: "Paguei o sistema em 1 mês só com o que parei de perder. Melhor investimento da vida!",
      icon: "TrendingUp",
      revenue: "+R$ 15.000/mês",
      profileImage: "/lovable-uploads/clien03-xlata.png"
    },
    {
      name: "Roberto Fernandes",
      company: "Ferro & Aço Nordeste",
      location: "Fortaleza - CE",
      rating: 5,
      text: "Sistema revolucionou meu negócio! Agora controlo tudo pelo celular e o lucro aumentou muito.",
      icon: "Star",
      revenue: "+R$ 10.500/mês",
      profileImage: "/lovable-uploads/clien04-xlata.png"
    },
    {
      name: "Marcos Pereira",
      company: "Recicla Sul",
      location: "Curitiba - PR",
      rating: 5,
      text: "Antes perdia muito tempo com papelada. Hoje em dia é só pesar, apertar botão e pronto! Fantástico!",
      icon: "Award",
      revenue: "+R$ 9.200/mês",
      profileImage: "/lovable-uploads/clien05-xlata.jpg"
    },
    {
      name: "Eduardo Costa",
      company: "Metais do Centro-Oeste",
      location: "Campo Grande - MS",
      rating: 5,
      text: "Meus clientes adoraram a agilidade no atendimento. Recomendo demais, vale cada centavo!",
      icon: "TrendingUp",
      revenue: "+R$ 13.800/mês",
      profileImage: "/lovable-uploads/clien06-xlata.jpeg"
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
        icon: plan.is_promotional 
          ? <Badge className="h-6 w-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">🔥</Badge>
          : plan.is_popular 
            ? <Crown className="h-6 w-6" />
            : <Calendar className="h-6 w-6" />,
        popular: plan.is_popular,
        promotional: plan.is_promotional,
        savings: plan.is_promotional && plan.promotional_description 
          ? plan.promotional_description 
          : plan.savings,
        amount: plan.is_promotional && plan.promotional_price 
          ? plan.promotional_price 
          : plan.amount,
        plan_type: plan.plan_type || plan.plan_id
      })) || [];

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Planos fallback caso falhe
      setPlans([
        {
          id: 'promocional',
          name: 'Plano Promocional',
          price: 'R$ 97,90',
          period: '/mês nos 3 primeiros meses',
          description: 'Oferta especial limitada',
          icon: <Badge className="h-6 w-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">🔥</Badge>,
          popular: false,
          promotional: true,
          savings: 'Depois R$ 147,90/mês',
          amount: 97.90
        },
        {
          id: 'mensal',
          name: 'Plano Mensal',
          price: 'R$ 147,90',
          period: '/mês',
          description: 'Ideal para começar',
          icon: <Calendar className="h-6 w-6" />,
          popular: false,
          savings: null,
          amount: 147.90
        },
        {
          id: 'trimestral',
          name: 'Plano Trimestral',
          price: 'R$ 387,90',
          period: '/3 meses',
          description: 'Melhor custo-benefício',
          icon: <Crown className="h-6 w-6" />,
          popular: true,
          savings: 'Economize R$ 56,80',
          amount: 387.90
        },
        {
          id: 'trienal',
          name: 'Plano Trienal',
          price: 'R$ 4.497,90',
          period: '/3 anos',
          description: 'Máxima economia',
          icon: <Star className="h-6 w-6" />,
          popular: false,
          savings: 'Economize R$ 884,50',
          amount: 4497.90
        }
      ]);
    }
  };

  useEffect(() => {
    loadContentSettings();
    loadPlansData();
    
    // Listen for landing page configuration updates
    const handleConfigUpdate = (event: CustomEvent) => {
      console.log('Configuração de landing atualizada, recarregando...');
      loadContentSettings();
      loadPlansData();
    };

    window.addEventListener('landingConfigUpdated', handleConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('landingConfigUpdated', handleConfigUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    // Aplicar SEO sempre que as configurações mudarem
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
        canonical: 'https://xlata.lovable.app'
      });
      
      // Atualizar title da página diretamente
      document.title = contentSettings.seo_title;
      
      // Atualizar meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', contentSettings.seo_description);
      } else {
        const newMetaDescription = document.createElement('meta');
        newMetaDescription.name = 'description';
        newMetaDescription.content = contentSettings.seo_description;
        document.head.appendChild(newMetaDescription);
      }
      
      // Atualizar meta keywords
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', contentSettings.seo_keywords);
      } else {
        const newMetaKeywords = document.createElement('meta');
        newMetaKeywords.name = 'keywords';
        newMetaKeywords.content = contentSettings.seo_keywords;
        document.head.appendChild(newMetaKeywords);
      }
    }
  }, [contentSettings, updateMetaTags]);

  const loadContentSettings = async () => {
    try {
      console.log('Carregando configurações globais da landing page...');
      
      // Carregar configurações globais (não específicas do usuário)
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        setTestimonials(defaultTestimonials);
        return;
      }

      if (data) {
        console.log('Configurações globais carregadas:', data);
        
        const settingsData: LandingContentSettings = {
          ...data,
          testimonials: data.testimonials || '[]'
        };
        
        setContentSettings(settingsData);
        
        // Parse and load testimonials
        let parsedTestimonials: TestimonialData[] = [];
        
        if (data.testimonials) {
          try {
            parsedTestimonials = typeof data.testimonials === 'string' 
              ? JSON.parse(data.testimonials) 
              : data.testimonials;
              
            console.log('Depoimentos globais carregados:', parsedTestimonials);
            
            // Ensure testimonials have the correct structure
            parsedTestimonials = parsedTestimonials.map(testimonial => ({
              ...testimonial,
              profileImage: testimonial.profileImage || ''
            }));
            
          } catch (parseError) {
            console.error('Erro ao fazer parse dos depoimentos:', parseError);
            parsedTestimonials = defaultTestimonials;
          }
        } else {
          console.log('Nenhum depoimento personalizado encontrado, usando padrões');
          parsedTestimonials = defaultTestimonials;
        }
        
        // Use parsed testimonials or default ones
        if (Array.isArray(parsedTestimonials) && parsedTestimonials.length > 0) {
          setTestimonials(parsedTestimonials);
        } else {
          setTestimonials(defaultTestimonials);
        }
        
      } else {
        console.log('Nenhuma configuração encontrada, usando configurações padrão');
        setTestimonials(defaultTestimonials);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da landing:', error);
      setTestimonials(defaultTestimonials);
    }
  };

  const handleSelectPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // Verificar se o usuário está logado
    if (!user) {
      navigate('/login');
      return;
    }

    // Mapear para o formato PlanData esperado pelo checkout
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

  const benefits = [
    {
      icon: Clock,
      title: "Acabe com a fila na balança",
      description: "Atenda muito mais caminhões e carroceiros por dia. O sistema calcula tudo sozinho e libera a balança em poucos minutos.",
      gradient: "from-blue-600 to-cyan-600",
      impact: "Até 300% mais produtividade"
    },
    {
      icon: Calculator,
      title: "Zero erros de pesagem e de preço",
      description: "Nada de peso anotado errado, tipo de material trocado ou conta feita na pressa. O sistema soma tudo com precisão de centavos.",
      gradient: "from-purple-600 to-pink-600",
      impact: "100% de precisão nos cálculos"
    },
    {
      icon: Shield,
      title: "Fornecedor confia e volta sempre",
      description: "Comprovante profissional, pesagem transparente e histórico de cada carga. Quem vende pra você se sente seguro e volta com mais material.",
      gradient: "from-emerald-600 to-teal-600",
      impact: "Muito mais fidelização"
    }
  ];

  const problems = [
    { 
      title: "Fila na balança = caminhão indo embora", 
      loss: "R$ 3.500/mês", 
      description: "Caminhões e carroceiros cansam de esperar, desistem da descarga e vão vender no depósito do concorrente.",
      icon: Clock,
      color: "from-red-600 to-red-800",
      urgency: "CRÍTICO"
    },
    { 
      title: "Erro de cálculo e material = prejuízo direto", 
      loss: "R$ 2.800/mês", 
      description: "Peso anotado errado, tipo de material trocado, preço por kg confundido – cada erro é dinheiro saindo do seu caixa.",
      icon: XCircle,
      color: "from-orange-600 to-red-700",
      urgency: "ALTO"
    },
    { 
      title: "Fornecedor desconfiado não volta", 
      loss: "R$ 4.200/mês", 
      description: "Papel rabiscado, conta confusa, sem comprovante claro – o fornecedor acha que perdeu dinheiro e procura outro depósito.",
      icon: AlertTriangle,
      color: "from-red-700 to-red-900",
      urgency: "CRÍTICO"
    },
    { 
      title: "Papelada bagunçada = não sabe se lucrou", 
      loss: "R$ 2.100/mês", 
      description: "Planilha perdida, caderninho rasgado, notas misturadas. Você não sabe quanto tem de cobre, alumínio, ferro ou plástico… nem quanto realmente ganhou.",
      icon: TrendingDown,
      color: "from-red-500 to-orange-700",
      urgency: "ALTO"
    },
    { 
      title: "Fiscalização = multa e dor de cabeça", 
      loss: "R$ 5.000/mês", 
      description: "Quando Receita ou fiscalização batem na porta, cadê relatório, cadastro, histórico e organização? Sem sistema, a chance de multa é enorme.",
      icon: BarChart3,
      color: "from-red-800 to-red-950",
      urgency: "CRÍTICO"
    },
    { 
      title: "Concorrência organizada te ultrapassando", 
      loss: "R$ 6.800/mês", 
      description: "Depósito do lado já modernizou, gera comprovante, paga certinho e sabe quanto pode oferecer. Seus melhores fornecedores começam a migrar.",
      icon: Target,
      color: "from-red-600 to-red-900",
      urgency: "EMERGÊNCIA"
    }
  ];

  const features = [
    {
      title: "Controle total de clientes e fornecedores",
      description: "Histórico completo de quem vende e de quem compra. Veja quanto cada cliente já trouxe, o que trouxe, quando trouxe e quanto você pagou.",
      icon: User2,
      color: "from-purple-600 to-violet-600",
      badge: "Gestão inteligente"
    },
    {
      title: "Lucro do depósito na palma da mão",
      description: "Dashboard mostra quanto entrou hoje, ontem, na semana e no mês. Veja se o depósito está dando lucro ou só girando dinheiro.",
      icon: BarChart,
      color: "from-orange-600 to-amber-600",
      badge: "Controle financeiro"
    },
    {
      title: "Mais de 130 depósitos e ferros velhos",
      description: "Do Norte ao Sul do Brasil, empresas de reciclagem usam o XLata.site para organizar o pátio e aumentar o faturamento.",
      icon: Users,
      color: "from-green-600 to-emerald-600",
      badge: "130+ clientes"
    },
    {
      title: "Suporte WhatsApp 24/7",
      description: "Travou, ficou com dúvida ou precisa ajustar algo? Chama no WhatsApp e nosso time te ajuda a resolver na hora.",
      icon: MessageSquare,
      color: "from-blue-600 to-cyan-600",
      badge: "Suporte 24h"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
      {/* New Responsive Header */}
      <ResponsiveNavigation 
        logoUrl={contentSettings.logo_url}
        companyName={contentSettings.company_name}
        companyPhone={contentSettings.company_phone}
      />

      {/* Hero Section */}
      <section 
        className="py-2 lg:py-12 px-3 lg:px-4 relative min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.85)), url('${contentSettings.background_image_url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-blue-500/20"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="flex justify-center mb-4 lg:mb-8">
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs sm:text-sm lg:text-lg px-3 sm:px-6 lg:px-8 py-2 lg:py-3 shadow-2xl border-2 border-green-400/50">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
              {contentSettings.hero_badge_text}
            </Badge>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-8xl xl:text-9xl font-black mb-4 lg:mb-8 leading-tight px-2">
            <span className="bg-gradient-to-r from-white via-green-200 to-green-400 bg-clip-text text-transparent drop-shadow-2xl">
              {contentSettings.hero_main_title.split(',')[0]},
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
              {contentSettings.hero_main_title.split(',')[1] || 'conta de cabeça'}!
            </span>
          </h1>
          
          <div className="max-w-5xl mx-auto mb-6 lg:mb-12 px-2">
            <p className="text-sm sm:text-lg md:text-xl lg:text-3xl text-gray-200 mb-3 lg:mb-6 leading-relaxed font-semibold">
              {contentSettings.hero_subtitle}
            </p>
            <p className="text-base sm:text-xl md:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {contentSettings.hero_description}
            </p>
          </div>
          
          <div className="flex flex-col gap-4 lg:gap-6 justify-center mb-8 lg:mb-16 px-2">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-base sm:text-lg lg:text-2xl px-6 sm:px-10 lg:px-16 py-4 sm:py-6 lg:py-8 font-black shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-green-400/30 w-full lg:w-auto"
            >
              <Zap className="mr-2 lg:mr-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              {contentSettings.hero_button_text}
              <ArrowRight className="ml-2 lg:ml-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </Button>
          </div>

          <div className="bg-gradient-to-r from-green-900/80 to-emerald-800/80 rounded-2xl p-4 lg:p-8 border-2 border-green-500/50 backdrop-blur-sm max-w-4xl mx-auto">
            <p className="text-xs sm:text-sm lg:text-lg text-green-200 flex items-center justify-center gap-2 sm:gap-4 lg:gap-6 flex-wrap">
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />7 dias grátis</span>
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />Sem cartão</span>
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />Suporte WhatsApp</span>
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />Sem instalar</span>
            </p>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-8 lg:py-20 px-3 lg:px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-red-900/40 to-red-800/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-8 lg:mb-20">
            <div className="flex justify-center mb-4 lg:mb-8">
              <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-xs sm:text-base lg:text-xl font-black shadow-2xl border-4 border-red-400/50">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 lg:mr-4" />
                🚨 SEU DEPÓSITO DE RECICLAGEM ESTÁ PERDENDO DINHEIRO!
              </Badge>
            </div>
            
            <div className="max-w-5xl mx-auto bg-gradient-to-r from-red-900/80 to-red-800/80 rounded-2xl p-4 lg:p-8 border-4 border-red-500/50 backdrop-blur-sm">
              <p className="text-base sm:text-lg lg:text-2xl text-red-100 font-black mb-2 lg:mb-4 text-center">
                <span className="text-red-400 text-lg sm:text-xl lg:text-3xl block mb-2">SEU DINHEIRO ESTÁ VAZANDO NO PÁTIO</span>
                <span className="block text-sm lg:text-lg font-bold">
                  Veja os 6 LADRÕES que roubam seu lucro todos os dias:
                </span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 mb-8 lg:mb-20">
            {problems.map((problem, index) => (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-gray-900/95 to-black/95 border-4 border-red-500/40 transition-all duration-500 transform shadow-2xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${problem.color} opacity-15 transition-opacity duration-500`}></div>
                
                <CardHeader className="relative z-10 pb-2 lg:pb-4">
                  <div className="flex items-center gap-2 lg:gap-4 mb-3 lg:mb-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br ${problem.color} rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-300`}>
                      <problem.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="flex-1">
                      <Badge className={`bg-gradient-to-r ${problem.color} text-white font-black text-xs lg:text-sm px-2 lg:px-3 py-1 mb-1 lg:mb-2`}>
                        {problem.urgency}
                      </Badge>
                      <CardTitle className="text-red-400 text-sm sm:text-base lg:text-xl font-black transition-colors duration-300 leading-tight">{problem.title}</CardTitle>
                    </div>
                  </div>
                  
                  <div className="text-center mb-2 lg:mb-4">
                    <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-base sm:text-lg lg:text-2xl px-2 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-3 shadow-xl">
                      -{problem.loss}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10 pt-0">
                  <p className="text-gray-300 text-xs sm:text-sm lg:text-lg leading-relaxed">{problem.description}</p>
                  
                  <div className="mt-3 lg:mt-6 bg-red-900/60 rounded-full h-2 lg:h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{width: `${80 + (index * 3)}%`}}></div>
                  </div>
                  <p className="text-xs text-red-400 mt-1 lg:mt-2 font-bold text-center">⚠️ NÍVEL DE URGÊNCIA: {problem.urgency}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-red-900/90 to-red-800/90 rounded-3xl p-4 sm:p-8 lg:p-12 border-4 border-red-500/50 backdrop-blur-sm max-w-6xl mx-auto">
              <h3 className="text-xl sm:text-2xl lg:text-4xl font-black text-red-400 mb-3 lg:mb-6">
                💸 TOTAL DE PERDAS ANUAIS: <span className="text-2xl sm:text-3xl lg:text-6xl text-red-300">R$ 292.800</span>
              </h3>
              <p className="text-base sm:text-lg lg:text-2xl text-gray-200 mb-4 lg:mb-8 font-bold">
                Quase <span className="text-red-400 font-black text-lg sm:text-xl lg:text-3xl">TREZENTOS MIL REAIS</span> que poderiam virar lucro no seu depósito de reciclagem.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-base sm:text-lg lg:text-2xl px-6 sm:px-10 lg:px-16 py-4 sm:py-6 lg:py-8 font-black shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-green-400/30 w-full lg:w-auto"
              >
                <Zap className="mr-2 lg:mr-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                PARAR DE PERDER AGORA!
                <ArrowRight className="ml-2 lg:ml-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-8 lg:py-20 px-3 lg:px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/40 via-emerald-900/30 to-green-800/20"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-8 lg:mb-20">
            <Badge className="mb-3 lg:mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs sm:text-sm lg:text-lg px-3 sm:px-6 lg:px-8 py-2 lg:py-3">
              <Rocket className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
              A SOLUÇÃO QUE ORGANIZA SEU DEPÓSITO
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 lg:mb-8 text-green-400 drop-shadow-xl px-2">
              Transforme o seu depósito em uma máquina de lucro previsível
            </h2>
            <p className="text-base sm:text-lg lg:text-2xl text-gray-300 max-w-4xl mx-auto font-semibold px-2">
              XLata.site é o sistema que depósitos de reciclagem e ferros velhos usam para <span className="text-green-400 font-bold">acabar com o caos e dominar os números</span>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 mb-6 lg:mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gradient-to-br from-gray-800/60 to-gray-900/80 border-2 border-gray-600/50 transition-all duration-500 shadow-2xl backdrop-blur-sm">
                <CardHeader className="relative z-10">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r ${benefit.gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white drop-shadow-lg" />
                  </div>
                  <CardTitle className="text-white text-base sm:text-lg lg:text-2xl font-bold mb-2 lg:mb-4">{benefit.title}</CardTitle>
                  <Badge className="bg-green-600 text-white font-bold mb-2 lg:mb-4 text-xs lg:text-sm">
                    {benefit.impact}
                  </Badge>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-gray-300 text-xs sm:text-sm lg:text-lg leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-gray-800/60 to-gray-900/80 border-2 border-gray-600/50 transition-all duration-500 shadow-2xl backdrop-blur-sm text-center">
                <CardHeader className="relative z-10">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-4 shadow-xl`}>
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white drop-shadow-lg" />
                  </div>
                  <Badge className="bg-green-600 text-white font-bold mb-2 lg:mb-4 text-xs lg:text-sm">
                    {feature.badge}
                  </Badge>
                  <CardTitle className="text-white text-base sm:text-lg lg:text-xl font-bold mb-1 lg:mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-gray-300 text-sm lg:text-base">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-8 lg:py-20 px-3 lg:px-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-6 lg:mb-16">
            <Badge className="mb-3 lg:mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-xs sm:text-sm lg:text-lg px-3 sm:px-6 lg:px-8 py-2 lg:py-3">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
              RETORNO GARANTIDO EM 30 DIAS
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 lg:mb-8 text-green-400 drop-shadow-xl px-2">
              Depósitos de reciclagem recuperam o investimento em menos de 1 mês
            </h2>
            <p className="text-base sm:text-lg lg:text-2xl text-gray-300 max-w-4xl mx-auto font-semibold px-2">
              Veja os resultados REAIS de quem já usa o Sistema PDV XLata.site no dia a dia do depósito.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 mb-6 lg:mb-16">
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-2 border-green-500/50 text-center hover:border-green-400 transition-all duration-300 transform hover:scale-110 shadow-2xl">
              <CardHeader>
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-6 shadow-xl">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl lg:text-5xl font-black text-green-400 mb-1 lg:mb-2">+300%</CardTitle>
                <p className="text-gray-300 font-bold text-base sm:text-lg lg:text-xl">Aumento na produtividade</p>
                <p className="text-green-400 font-semibold text-sm lg:text-base">Atenda muito mais cargas por dia</p>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-2 border-blue-500/50 text-center hover:border-blue-400 transition-all duration-300 transform hover:scale-110 shadow-2xl">
              <CardHeader>
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-6 shadow-xl">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl lg:text-5xl font-black text-green-400 mb-1 lg:mb-2">-80%</CardTitle>
                <p className="text-gray-300 font-bold text-base sm:text-lg lg:text-xl">Redução no tempo de pesagem</p>
                <p className="text-blue-400 font-semibold text-sm lg:text-base">De 15 para cerca de 3 minutos</p>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-2 border-purple-500/50 text-center hover:border-purple-400 transition-all duration-300 transform hover:scale-110 shadow-2xl">
              <CardHeader>
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-6 shadow-xl">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl lg:text-5xl font-black text-green-400 mb-1 lg:mb-2">100%</CardTitle>
                <p className="text-gray-300 font-bold text-base sm:text-lg lg:text-xl">Eliminação de erros de conta</p>
                <p className="text-purple-400 font-semibold text-sm lg:text-base">Zero prejuízo por cálculo errado</p>
              </CardHeader>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-green-900/80 to-emerald-800/80 rounded-3xl p-4 sm:p-8 lg:p-12 border-4 border-green-500/50 backdrop-blur-sm text-center">
            <h3 className="text-xl sm:text-2xl lg:text-4xl font-black text-green-400 mb-3 lg:mb-6">
              🎯 RESULTADO MÉDIO DOS NOSSOS CLIENTES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 text-center">
              <div>
                <p className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-1 lg:mb-2">R$ 12.000</p>
                <p className="text-base sm:text-lg lg:text-xl text-green-300 font-semibold">Lucro adicional / mês</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-1 lg:mb-2">28 dias</p>
                <p className="text-base sm:text-lg lg:text-xl text-green-300 font-semibold">Para recuperar o investimento</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-1 lg:mb-2">130+</p>
                <p className="text-base sm:text-lg lg:text-xl text-green-300 font-semibold">Depósitos e ferros velhos confiam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 lg:py-20 px-3 lg:px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-950/30 via-orange-900/20 to-red-900/30"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-6 lg:mb-16">
            <Badge className="mb-3 lg:mb-6 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold text-xs sm:text-sm lg:text-lg px-3 sm:px-6 lg:px-8 py-2 lg:py-3">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
              DEPOIMENTOS DE QUEM JÁ ORGANIZOU O DEPÓSITO
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 lg:mb-8 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent px-2">
              Mais de 130 donos de depósito e ferro velho aprovam
            </h2>
            <p className="text-base sm:text-lg lg:text-2xl text-gray-300 max-w-4xl mx-auto font-semibold px-2">
              Veja o que nossos clientes falam sobre os <span className="text-yellow-400 font-bold">RESULTADOS REAIS</span> do XLata.site.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
            {testimonials.map((testimonial, index) => {
              // Mapear nomes de ícones para componentes
              const getIconComponent = (iconName: string) => {
                switch (iconName) {
                  case 'Rocket': return Rocket;
                  case 'Award': return Award;
                  case 'TrendingUp': return TrendingUp;
                  case 'Target': return Target;
                  case 'User': return User2;
                  case 'Star': return Star;
                  default: return Star;
                }
              };
              
              const IconComponent = getIconComponent(testimonial.icon);
              
              return (
                <Card key={testimonial.id || index} className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-2 border-yellow-500/50 hover:border-yellow-400 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-1 lg:gap-2 mb-2 lg:mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 lg:gap-4 mb-3 lg:mb-6">
                      {/* Foto de perfil ou ícone */}
                      {testimonial.profileImage ? (
                        <img 
                          src={testimonial.profileImage} 
                          alt={`Foto de ${testimonial.name}`}
                          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-yellow-500 shadow-xl"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-sm lg:text-lg">{testimonial.name}</p>
                        <p className="text-xs lg:text-sm text-gray-400 font-semibold">{testimonial.company}</p>
                        <p className="text-xs text-yellow-400 font-semibold">{testimonial.location}</p>
                      </div>
                    </div>
                    
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold mb-2 lg:mb-4 text-xs lg:text-sm">
                      {testimonial.revenue}
                    </Badge>
                    
                    <blockquote className="text-gray-300 italic text-sm lg:text-lg leading-relaxed">
                      "{testimonial.text}"
                    </blockquote>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-8 lg:py-20 px-3 lg:px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pdv/10 via-transparent to-pdv-green/10"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-6 lg:mb-16">
            <Badge className="mb-3 lg:mb-6 bg-gradient-to-r from-pdv-green to-green-600 text-white font-bold text-xs sm:text-sm lg:text-lg px-3 sm:px-6 lg:px-8 py-2 lg:py-3">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
              ESCOLHA SEU PLANO
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 lg:mb-8 text-white drop-shadow-xl px-2">
              Invista no futuro do seu depósito de reciclagem
            </h2>
            <p className="text-base sm:text-lg lg:text-2xl text-gray-300 max-w-4xl mx-auto font-semibold px-2">
              Todos os planos incluem acesso completo ao sistema PDV com <span className="text-pdv-green font-bold">todos os recursos para depósitos e ferros velhos</span>.
            </p>
          </div>
          
          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 mb-6 lg:mb-16">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`bg-gray-800/90 border-gray-700 backdrop-blur-sm relative transform hover:scale-105 transition-all duration-300 ${
                  plan.promotional ? 'ring-2 ring-green-400 border-green-400 shadow-green-400/20 shadow-lg' : 
                  plan.popular ? 'ring-2 ring-pdv-green border-pdv-green' : ''
                }`}
              >
                {plan.promotional && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white animate-pulse">
                    🔥 OFERTA ESPECIAL
                  </Badge>
                )}
                {plan.popular && !plan.promotional && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pdv-green text-white">
                    Mais Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4 text-pdv-green">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-white text-xl lg:text-2xl">{plan.name}</CardTitle>
                  <p className="text-gray-400">{plan.description}</p>
                  <div className="text-center mt-4">
                    <span className="text-3xl lg:text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-1">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <Badge variant="outline" className={`mt-2 ${
                      plan.promotional ? 'text-yellow-400 border-yellow-400' : 'text-green-400 border-green-400'
                    }`}>
                      {plan.savings}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-pdv-green" />
                      <span className="text-gray-300 text-sm">Sistema PDV completo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-pdv-green" />
                      <span className="text-gray-300 text-sm">Controle de estoque e materiais</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-pdv-green" />
                      <span className="text-gray-300 text-sm">Relatórios detalhados para gestão e fiscalização</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-pdv-green" />
                      <span className="text-gray-300 text-sm">Suporte WhatsApp</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${
                      plan.promotional
                        ? 'bg-green-600 hover:bg-green-700 animate-pulse'
                        : plan.popular 
                          ? 'bg-pdv-green hover:bg-green-600' 
                          : 'bg-gray-700 hover:bg-gray-600'
                    } flex items-center gap-2`}
                  >
                    <Crown className="h-4 w-4" />
                    Assinar Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={() => navigate('/planos')}
              variant="outline"
              className="border-2 border-pdv-green text-pdv-green hover:bg-pdv-green hover:text-white transition-all duration-300"
            >
              Ver Todos os Detalhes dos Planos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 lg:py-20 px-3 lg:px-4 bg-gradient-to-r from-green-900 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-emerald-500/20"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="flex justify-center mb-4 lg:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Rocket className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 lg:mb-8 text-white drop-shadow-2xl px-2">
            Pronto para parar de perder dinheiro no seu depósito?
          </h2>
          <p className="text-base sm:text-lg lg:text-2xl mb-6 lg:mb-12 max-w-4xl mx-auto text-green-100 font-semibold px-2">
            Teste o XLata.site por 7 dias, sem cartão, e veja seu depósito de reciclagem se transformar em uma 
            <span className="text-yellow-300 font-black"> operação organizada e lucrativa.</span>
          </p>
          
          <div className="flex flex-col gap-4 lg:gap-6 justify-center mb-6 lg:mb-12 px-2">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-white text-green-700 hover:bg-gray-100 text-base sm:text-lg lg:text-2xl px-6 sm:px-10 lg:px-16 py-4 sm:py-6 lg:py-8 font-black shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-yellow-400/50 w-full lg:w-auto"
            >
              <Zap className="mr-2 lg:mr-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              COMEÇAR TESTE GRÁTIS AGORA
              <ArrowRight className="ml-2 lg:ml-3 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </Button>
          </div>
          
          <div className="bg-white/10 rounded-2xl p-4 lg:p-8 backdrop-blur-sm max-w-4xl mx-auto">
            <p className="text-xs sm:text-sm lg:text-lg text-green-200 flex items-center justify-center gap-2 sm:gap-4 lg:gap-6 flex-wrap font-semibold">
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />7 dias grátis</span>
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />Sem cartão</span>
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />Suporte 24h</span>
              <span className="flex items-center text-xs lg:text-base"><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 text-green-400" />Sem instalar</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-4 sm:py-8 lg:py-12 px-3 lg:px-4 border-t border-gray-800 relative">
        <div className="container mx-auto">
          <div className="text-center mb-4 lg:mb-8">
            {/*<img
              src={contentSettings.logo_url}
              alt={`${contentSettings.company_name} - Sistema PDV para Ferro Velho`}
              className="h-6 sm:h-8 lg:h-12 w-auto mx-auto mb-2 lg:mb-4"
            />*/}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2 lg:gap-8 text-center">
            <div>
              <h4 className="text-white font-bold mb-2 lg:mb-4 text-sm lg:text-base">Contato</h4>
              <p className="text-gray-400 text-xs lg:text-base">Suporte WhatsApp 24/7</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2 lg:mb-4 text-sm lg:text-base">Empresa</h4>
              <p className="text-gray-400 text-xs lg:text-base">Mais de 130 clientes</p>
              <p className="text-gray-400 text-xs lg:text-base">Em todo o Brasil</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2 lg:mb-4 text-sm lg:text-base">Segurança</h4>
              <p className="text-gray-400 text-xs lg:text-base">Dados protegidos</p>
              <p className="text-gray-400 text-xs lg:text-base">Backup automático</p>
            </div>
          </div>

          {/* Legal Links */}
          <div className="border-t border-gray-800 pt-4 lg:pt-6">
            <div className="flex flex-wrap justify-center items-center gap-4 lg:gap-8 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/termos-de-uso')}
                className="text-gray-400 hover:text-white text-xs lg:text-sm"
              >
                Termos de Uso
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/guia-completo')}
                className="text-gray-400 hover:text-white text-xs lg:text-sm"
              >
                Guia Completo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/planos')}
                className="text-gray-400 hover:text-white text-xs lg:text-sm"
              >
                Planos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-gray-400 hover:text-white text-xs lg:text-sm"
              >
                Área do Cliente
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-gray-400 text-sm lg:text-lg font-semibold mt-4">
                © {new Date().getFullYear()} XLata.site. Todos os direitos reservados.
              </p>
              <p className="text-gray-500 text-xs lg:text-base mt-1 lg:mt-2">
                Sistema XLata para Depósitos de Reciclagem e Ferros Velhos – Tecnologia que Gera Lucro
              </p>
            </div>
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
