import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Shield, DollarSign, Users, Calendar } from 'lucide-react';

const ROISection: React.FC = () => {
  const stats = [
    {
      icon: TrendingUp,
      value: "+300%",
      label: "Aumento na produtividade",
      detail: "Atenda muito mais cargas por dia",
      color: "emerald"
    },
    {
      icon: Clock,
      value: "-80%",
      label: "Tempo de pesagem",
      detail: "De 15 para cerca de 3 minutos",
      color: "blue"
    },
    {
      icon: Shield,
      value: "100%",
      label: "Precisão nos cálculos",
      detail: "Zero erros de conta e cobrança",
      color: "purple"
    }
  ];

  const results = [
    { value: "R$ 12.000", label: "Faturamento médio extra", icon: DollarSign },
    { value: "28 dias", label: "Para recuperar investimento", icon: Calendar },
    { value: "130+", label: "Depósitos de ferro velho", icon: Users }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-900 via-emerald-950/30 to-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge className="mb-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium">
            <DollarSign className="h-4 w-4 mr-2" />
            RETORNO GARANTIDO EM 30 DIAS
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
            Recupere o investimento em menos de 1 mês
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Veja os resultados reais de quem já usa o Sistema PDV XLata.site no dia a dia do depósito
          </p>
        </div>
        
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 lg:mb-16">
          {stats.map((stat, index) => {
            const colorMap: Record<string, string> = {
              emerald: 'border-emerald-500/40 hover:border-emerald-500',
              blue: 'border-blue-500/40 hover:border-blue-500',
              purple: 'border-purple-500/40 hover:border-purple-500'
            };
            const bgMap: Record<string, string> = {
              emerald: 'from-emerald-500 to-emerald-600',
              blue: 'from-blue-500 to-blue-600',
              purple: 'from-purple-500 to-purple-600'
            };
            
            return (
              <Card key={index} className={`bg-gray-900/60 ${colorMap[stat.color]} border-2 text-center transition-all duration-300 hover:scale-105`}>
                <CardHeader className="pt-8 pb-6">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${bgMap[stat.color]} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                    <stat.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 mb-2">
                    {stat.value}
                  </CardTitle>
                  <p className="text-white font-semibold text-base sm:text-lg mb-1">{stat.label}</p>
                  <p className="text-gray-400 text-sm">{stat.detail}</p>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Results Banner */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-green-900/60 rounded-2xl p-6 sm:p-8 border border-emerald-500/30 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 text-xs font-medium mb-3">
              ✨ RESULTADO MÉDIO DOS NOSSOS CLIENTES
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {results.map((result, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                  <result.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{result.value}</p>
                <p className="text-gray-400 text-sm">{result.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROISection;