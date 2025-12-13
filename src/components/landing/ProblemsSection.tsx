import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, XCircle, AlertTriangle, TrendingDown, BarChart3, Target, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProblemsSection: React.FC = () => {
  const navigate = useNavigate();

  const problems = [
    { 
      title: "Fila na balança", 
      subtitle: "Caminhão indo embora",
      loss: "R$ 3.500/mês", 
      description: "Caminhões e carroceiros cansam de esperar e vão vender no concorrente.",
      icon: Clock,
      urgency: "CRÍTICO"
    },
    { 
      title: "Erro de cálculo", 
      subtitle: "Prejuízo direto",
      loss: "R$ 2.800/mês", 
      description: "Peso errado, material trocado, preço confundido – cada erro é dinheiro perdido.",
      icon: XCircle,
      urgency: "ALTO"
    },
    { 
      title: "Fornecedor desconfiado", 
      subtitle: "Cliente perdido",
      loss: "R$ 4.200/mês", 
      description: "Papel rabiscado, conta confusa – o fornecedor não volta mais.",
      icon: AlertTriangle,
      urgency: "CRÍTICO"
    },
    { 
      title: "Papelada bagunçada", 
      subtitle: "Sem controle",
      loss: "R$ 2.100/mês", 
      description: "Planilha perdida, caderno rasgado – você não sabe se lucrou ou não.",
      icon: TrendingDown,
      urgency: "ALTO"
    },
    { 
      title: "Fiscalização", 
      subtitle: "Multa garantida",
      loss: "R$ 5.000/mês", 
      description: "Sem relatório, cadastro ou histórico, a multa é quase certa.",
      icon: BarChart3,
      urgency: "CRÍTICO"
    },
    { 
      title: "Concorrência", 
      subtitle: "Te ultrapassando",
      loss: "R$ 6.800/mês", 
      description: "O depósito vizinho já modernizou e seus fornecedores estão migrando.",
      icon: Target,
      urgency: "ALTO"
    }
  ];

  const totalLoss = problems.reduce((acc, p) => {
    const value = parseFloat(p.loss.replace(/[^\d]/g, ''));
    return acc + value;
  }, 0);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge className="mb-4 bg-red-600/20 text-red-400 border border-red-500/30 px-4 py-1.5 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 mr-2" />
            SEU DINHEIRO ESTÁ VAZANDO
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
            Os 6 ladrões que roubam seu lucro
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Veja os problemas que depósitos de reciclagem enfrentam todo dia e quanto você pode estar perdendo
          </p>
        </div>
        
        {/* Problems Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 lg:mb-16">
          {problems.map((problem, index) => (
            <Card key={index} className="bg-gray-900/80 border-gray-800 hover:border-red-500/40 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <problem.icon className="h-6 w-6 text-red-400" />
                  </div>
                  <Badge className={`text-xs font-bold ${problem.urgency === 'CRÍTICO' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}`}>
                    {problem.urgency}
                  </Badge>
                </div>
                <CardTitle className="text-white text-base sm:text-lg font-bold leading-tight">
                  {problem.title}
                  <span className="block text-sm text-red-400 font-medium mt-0.5">{problem.subtitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{problem.description}</p>
                <div className="bg-red-950/50 rounded-lg p-3 border border-red-500/20">
                  <p className="text-red-400 text-xs font-medium mb-1">Perda estimada:</p>
                  <p className="text-red-300 text-xl font-bold">-{problem.loss}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Loss CTA */}
        <div className="bg-gradient-to-r from-red-950/80 to-red-900/60 rounded-2xl p-6 sm:p-8 lg:p-10 border border-red-500/30 max-w-4xl mx-auto text-center">
          <p className="text-gray-300 text-lg sm:text-xl font-medium mb-2">Total de perdas anuais:</p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-red-400 mb-4">
            R$ {(totalLoss * 12).toLocaleString('pt-BR')}
          </p>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Quase <strong className="text-white">trezentos mil reais</strong> que poderiam virar lucro no seu depósito.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-6 text-base sm:text-lg shadow-xl"
          >
            <Zap className="mr-2 h-5 w-5" />
            Parar de Perder Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;