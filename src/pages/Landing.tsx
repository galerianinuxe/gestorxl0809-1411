import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Star, Users, Clock, Calculator, Shield, TrendingUp, BarChart3, Phone, Mail, ChevronRight, Play, Crown, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
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
  profileImage?: string;
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { updateMetaTags } = useSEO();
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);

  const defaultTestimonials: TestimonialData[] = [
    {
      name: "Gabriel Celestino",
      company: "JMT Sucata",
      location: "São Bernardo do Campo - SP",
      rating: 5,
      text: "Triplicou minha produtividade! O que levava 15 minutos agora levo 5.",
      revenue: "+R$ 8.000/mês",
      profileImage: "/lovable-uploads/clien01-xlata.png"
    },
    {
      name: "Felipe Nunes",
      company: "BH Sucatas",
      location: "Guarulhos - SP", 
      rating: 5,
      text: "Acabaram os erros de conta e as brigas com cliente. Sistema perfeito!",
      revenue: "+R$ 12.000/mês",
      profileImage: "/lovable-uploads/clien02-xlata.png"
    },
    {
      name: "Hélio Machado",
      company: "HJM Recicla",
      location: "Três Corações - MG",
      rating: 5,
      text: "Paguei o sistema em 1 mês só com o que parei de perder.",
      revenue: "+R$ 15.000/mês",
      profileImage: "/lovable-uploads/clien03-xlata.png"
    }
  ];

  useEffect(() => {
    loadPlansData();
    loadTestimonials();
    
    // SEO
    updateMetaTags({
      title: 'XLata.site - Sistema para Depósito de Reciclagem',
      description: 'Sistema online para depósito de reciclagem, sucata e ferro velho. Controle de pesagem, estoque, clientes e lucros. Teste grátis 7 dias.',
      keywords: 'sistema reciclagem, software sucata, controle ferro velho, sistema balança, pdv reciclagem',
      author: 'XLata',
      ogTitle: 'XLata.site - Sistema para Depósito de Reciclagem',
      ogDescription: 'Controle total do seu depósito de reciclagem',
      ogImage: '/lovable-uploads/xlata.site_logotipo.png',
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      canonical: 'https://xlata.site'
    });
  }, []);

  const loadPlansData = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        const formattedPlans = data.map(plan => ({
          id: plan.plan_id,
          name: plan.name,
          price: plan.is_promotional && plan.promotional_price 
            ? plan.promotional_price 
            : plan.price,
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
        }));
        setPlans(formattedPlans);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadTestimonials = async () => {
    try {
      const { data } = await supabase
        .from('landing_page_settings')
        .select('testimonials')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.testimonials) {
        const parsed = typeof data.testimonials === 'string' 
          ? JSON.parse(data.testimonials) 
          : data.testimonials;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTestimonials(parsed);
          return;
        }
      }
      setTestimonials(defaultTestimonials);
    } catch {
      setTestimonials(defaultTestimonials);
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
      amount: plan.amount,
      plan_type: plan.plan_type || plan.id
    };
    setSelectedPlan(planData);
    setIsCheckoutOpen(true);
  };

  const features = [
    { icon: Clock, title: "Pesagem Rápida", description: "Atenda 3x mais clientes por dia" },
    { icon: Calculator, title: "Cálculos Precisos", description: "Zero erros de conta ou material" },
    { icon: Shield, title: "Confiança Total", description: "Comprovantes profissionais" },
    { icon: BarChart3, title: "Dashboard Completo", description: "Lucro em tempo real" },
    { icon: Users, title: "Gestão de Clientes", description: "Histórico completo de cada fornecedor" },
    { icon: TrendingUp, title: "Mais Lucro", description: "Pare de perder dinheiro com erros" }
  ];

  const stats = [
    { value: "130+", label: "Depósitos ativos" },
    { value: "300%", label: "Mais produtividade" },
    { value: "24/7", label: "Suporte WhatsApp" },
    { value: "7 dias", label: "Teste grátis" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <img 
              src="/lovable-uploads/xlata.site_logotipo.png" 
              alt="XLata" 
              className="h-10 lg:h-12 w-auto"
            />
            <nav className="hidden md:flex items-center gap-8">
              <a href="#beneficios" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                Benefícios
              </a>
              <a href="#depoimentos" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                Depoimentos
              </a>
              <a href="#planos" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium">
                Planos
              </a>
              <a href="tel:11963512105" className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium flex items-center gap-1">
                <Phone className="h-4 w-4" />
                (11) 96351-2105
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-green-600 font-medium"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
              >
                Teste Grátis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-16 lg:pb-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-green-100 text-green-700 hover:bg-green-100 px-4 py-1.5 text-sm font-medium">
              Sistema #1 para Depósitos de Reciclagem
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Chega de papel, caneta e 
              <span className="text-green-600"> conta de cabeça</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Sistema online feito para depósitos de reciclagem, sucatas e ferros velhos que querem organização de verdade e mais lucro no final do mês.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-6 shadow-lg shadow-green-600/25"
              >
                <Zap className="mr-2 h-5 w-5" />
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => window.open('https://wa.me/5511963512105', '_blank')}
                className="border-gray-300 text-gray-700 font-semibold text-lg px-8 py-6"
              >
                <Play className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                7 dias grátis
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Suporte WhatsApp
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-green-600">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="beneficios" className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tudo que seu depósito precisa
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Funcionalidades pensadas para resolver os problemas reais do dia a dia do seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-4">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-1.5">
              + de 130 depósitos confiam no XLata
            </Badge>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-12">
            Resultados reais de quem usa
          </h2>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto" id="depoimentos">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.profileImage && (
                      <img 
                        src={testimonial.profileImage} 
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-green-600 font-bold">{testimonial.revenue}</span>
                    <span className="text-gray-500 text-sm"> de aumento no lucro</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-lg text-gray-600">
              Escolha o plano ideal para o seu depósito
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <Card 
                key={i} 
                className={`relative overflow-hidden transition-all ${
                  plan.popular 
                    ? 'border-2 border-green-500 shadow-lg scale-105' 
                    : 'border border-gray-200 hover:border-green-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1">
                    POPULAR
                  </div>
                )}
                {plan.promotional && (
                  <div className="absolute top-0 left-0 bg-orange-500 text-white text-xs font-bold px-3 py-1">
                    PROMOÇÃO
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-4">
                    {plan.popular ? (
                      <Crown className="h-8 w-8 text-green-600" />
                    ) : (
                      <Calendar className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  
                  {plan.savings && (
                    <Badge className="mb-4 bg-green-100 text-green-700 hover:bg-green-100">
                      {plan.savings}
                    </Badge>
                  )}

                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Escolher Plano
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>

                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Acesso completo ao sistema
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Suporte WhatsApp 24/7
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Atualizações gratuitas
                    </li>
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-green-600">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Pronto para organizar seu depósito?
          </h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Comece agora com 7 dias grátis. Sem compromisso, sem cartão de crédito.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-white text-green-600 hover:bg-gray-100 font-bold text-lg px-10 py-6"
          >
            <Zap className="mr-2 h-5 w-5" />
            Começar Teste Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/xlata.site_logotipo.png" 
                alt="XLata" 
                className="h-8 brightness-0 invert"
              />
              <span className="text-sm">© 2025 XLata. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="tel:11963512105" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                (11) 96351-2105
              </a>
              <a href="mailto:contato@xlata.site" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                contato@xlata.site
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      {selectedPlan && (
        <MercadoPagoCheckout
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          selectedPlan={selectedPlan}
        />
      )}
    </div>
  );
};

export default Landing;
