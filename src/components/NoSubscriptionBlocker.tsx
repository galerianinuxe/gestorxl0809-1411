import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, BookOpen, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TrialActivationButton from './TrialActivationButton';
import SystemLogo from './SystemLogo';

interface NoSubscriptionBlockerProps {
  userName?: string;
  onTrialActivated?: () => void;
}

const NoSubscriptionBlocker: React.FC<NoSubscriptionBlockerProps> = ({ 
  userName, 
  onTrialActivated 
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SystemLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo ao Sistema PDV, {userName || 'usuário'}!
          </h1>
          <p className="text-gray-300 text-lg">
            Para acessar todas as funcionalidades, você precisa ativar um plano.
          </p>
        </div>

        {/* Card Principal */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl text-white">Acesso Restrito</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Você precisa de uma assinatura ativa para acessar o sistema completo.
              <br />
              Comece com nosso teste gratuito de 7 dias!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* Botão de Ativação do Teste */}
            <div className="py-4">
              <TrialActivationButton onTrialActivated={onTrialActivated} />
            </div>
            
            <div className="text-sm text-gray-400">
              <p>✅ Acesso completo por 7 dias</p>
              <p>✅ Todas as funcionalidades liberadas</p>
              <p>✅ Sem compromisso</p>
            </div>
          </CardContent>
        </Card>

        {/* Ações Permitidas */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/30 border-gray-600 hover:bg-gray-800/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="text-white font-semibold">Guia Completo</h3>
                    <p className="text-gray-400 text-sm">Aprenda a usar o sistema</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/guia-completo')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/30 border-gray-600 hover:bg-gray-800/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h3 className="text-white font-semibold">Ver Planos</h3>
                    <p className="text-gray-400 text-sm">Conheça nossas opções</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/planos')}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Dúvidas? Entre em contato conosco através do suporte.</p>
        </div>
      </div>
    </div>
  );
};

export default NoSubscriptionBlocker;