import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Loader2 } from 'lucide-react';
import { useTrialActivation } from '@/utils/trialActivation';
import { toast } from '@/hooks/use-toast';

interface TrialActivationButtonProps {
  onTrialActivated?: () => void;
}

const TrialActivationButton: React.FC<TrialActivationButtonProps> = ({ onTrialActivated }) => {
  const [isActivating, setIsActivating] = useState(false);
  const { activateUserTrial } = useTrialActivation();

  const handleActivateTrial = async () => {
    setIsActivating(true);
    
    try {
      const result = await activateUserTrial();
      
      if (result.success) {
        toast({
          title: "🎉 Teste Ativado!",
          description: result.message,
        });
        
        // Faster data propagation wait
        await new Promise(resolve => setTimeout(resolve, 300));
        onTrialActivated?.();
      } else {
        toast({
          title: "Erro ao ativar teste",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns momentos.",
        variant: "destructive"
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Button
      onClick={handleActivateTrial}
      disabled={isActivating}
      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold"
      size="lg"
    >
      {isActivating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Ativando...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-5 w-5" />
          Ativar Teste de 7 Dias GRÁTIS
        </>
      )}
    </Button>
  );
};

export default TrialActivationButton;