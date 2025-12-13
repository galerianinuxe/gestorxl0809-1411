import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calculator, Shield, Rocket, User2, BarChart, MessageSquare, Users } from 'lucide-react';

const BenefitsSection: React.FC = () => {
  const mainBenefits = [
    {
      icon: Clock,
      title: "Acabe com a fila na balança",
      description: "Atenda muito mais caminhões e carroceiros por dia. O sistema calcula tudo sozinho e libera a balança em poucos minutos.",
      impact: "Até 300% mais produtividade",
      color: "emerald"
    },
    {
      icon: Calculator,
      title: "Zero erros de pesagem e preço",
      description: "Nada de peso errado, material trocado ou conta na pressa. O sistema soma tudo com precisão de centavos.",
      impact: "100% de precisão",
      color: "blue"
    },
    {
      icon: Shield,
      title: "Fornecedor confia e volta",
      description: "Comprovante profissional, pesagem transparente e histórico de cada carga. Quem vende pra você se sente seguro.",
      impact: "Maior fidelização",
      color: "purple"
    }
  ];

  const features = [
    {
      icon: User2,
      title: "Controle de clientes e fornecedores",
      description: "Histórico completo de quem vende e compra. Veja quanto cada cliente já trouxe.",
      badge: "Gestão inteligente"
    },
    {
      icon: BarChart,
      title: "Lucro na palma da mão",
      description: "Dashboard mostra quanto entrou hoje, ontem, na semana e no mês.",
      badge: "Controle financeiro"
    },
    {
      icon: Users,
      title: "130+ depósitos e ferros velhos",
      description: "Do Norte ao Sul do Brasil, empresas de reciclagem usam o XLata.site.",
      badge: "Confiança nacional"
    },
    {
      icon: MessageSquare,
      title: "Suporte WhatsApp 24/7",
      description: "Travou ou ficou com dúvida? Chama no WhatsApp que resolvemos na hora.",
      badge: "Suporte 24h"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string, border: string, text: string, badge: string }> = {
      emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-600 text-white'
      },
      blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        badge: 'bg-blue-600 text-white'
      },
      purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        badge: 'bg-purple-600 text-white'
      }
    };
    return colors[color] || colors.emerald;
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-950 to-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge className="mb-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium">
            <Rocket className="h-4 w-4 mr-2" />
            A SOLUÇÃO COMPLETA
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
            Transforme seu depósito em uma máquina de lucro
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto">
            XLata.site é o sistema que depósitos de reciclagem e ferros velhos usam para{' '}
            <span className="text-emerald-400 font-semibold">acabar com o caos e dominar os números</span>.
          </p>
        </div>
        
        {/* Main Benefits - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 lg:mb-16">
          {mainBenefits.map((benefit, index) => {
            const colors = getColorClasses(benefit.color);
            return (
              <Card key={index} className="bg-gray-900/60 border-gray-800 hover:border-gray-700 transition-all duration-300">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4`}>
                    <benefit.icon className={`h-7 w-7 ${colors.text}`} />
                  </div>
                  <Badge className={`w-fit mb-3 ${colors.badge}`}>
                    {benefit.impact}
                  </Badge>
                  <CardTitle className="text-white text-lg sm:text-xl font-bold">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Features - 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gray-900/40 border-gray-800 hover:border-emerald-500/30 transition-all duration-300 text-center">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <Badge variant="outline" className="w-fit mx-auto text-xs text-gray-400 border-gray-700 mb-2">
                  {feature.badge}
                </Badge>
                <CardTitle className="text-white text-base font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-500 text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;