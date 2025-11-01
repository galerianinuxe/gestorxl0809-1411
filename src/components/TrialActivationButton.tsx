import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface TrialActivationButtonProps {
  onTrialActivated?: () => void;
}

const TrialActivationButton: React.FC<TrialActivationButtonProps> = () => {
  return (
    <Card className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-600">
      <CardContent className="p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          Teste Grátis Ativado Automaticamente!
        </h3>
        <p className="text-gray-300">
          Seu teste grátis de 7 dias foi ativado automaticamente após a confirmação do email.
          Aproveite todos os recursos do sistema XLata!
        </p>
      </CardContent>
    </Card>
  );
};

export default TrialActivationButton;