import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useTrialActivation } from '@/utils/trialActivation';
import { toast } from '@/hooks/use-toast';

interface FirstLoginModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onTrialActivated?: () => void;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  open,
  onClose,
  userName,
  onTrialActivated
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const [trialActivated, setTrialActivated] = useState(false);
  const { activateUserTrial } = useTrialActivation();
  
  const handleActivateTrial = async () => {
    setIsActivating(true);
    
    try {
      const result = await activateUserTrial();
      
      if (result.success) {
        setTrialActivated(true);
        toast({
          title: "✅ Teste Grátis Ativado!",
          description: result.message,
        });
        
        // Aguardar 1.5s para usuário ver o sucesso, então abrir onboarding
        setTimeout(() => {
          onClose();
          onTrialActivated?.();
        }, 1500);
      } else {
        toast({
          title: "❌ Erro na Ativação",
          description: result.message,
          variant: "destructive",
        });
        setIsActivating(false);
      }
    } catch (error) {
      toast({
        title: "❌ Erro Inesperado",
        description: "Ocorreu um erro ao ativar o teste. Tente novamente.",
        variant: "destructive",
      });
      setIsActivating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-600 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-white text-3xl font-bold mb-4">
            🎉 Bem-vindo(a) ao XLata, {userName}!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/lovable-uploads/xlata.site_logotipo.png"
              alt="Logo XLata"
              className="h-24 w-auto drop-shadow-2xl"
            />
          </div>
          
          {/* Mensagem de boas-vindas */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-green-400">
              Sua conta foi criada com sucesso! 🚀
            </h2>
            <p className="text-gray-300 text-lg">
              Ative agora seu <strong>teste grátis de 7 dias</strong> com todos os recursos do sistema.
            </p>
          </div>
          
          {/* Card de benefícios do teste */}
          <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-600">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">
                    O que você ganha com o teste grátis?
                  </h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      7 dias com acesso total ao sistema
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Guias completos em vídeo para aprender
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Todos os recursos disponíveis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Sem necessidade de cartão de crédito
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botão de ativação */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleActivateTrial}
              disabled={isActivating || trialActivated}
              className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold text-lg py-6 disabled:opacity-70"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ATIVANDO...
                </>
              ) : trialActivated ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  ATIVADO! REDIRECIONANDO...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  ATIVAR TESTE GRÁTIS DE 7 DIAS
                </>
              )}
            </Button>
          </div>
          
          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3 mt-2">
            <p className="text-center text-purple-300 text-sm flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              Após ativar, você será guiado passo a passo na configuração do sistema
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
