import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionExpiredModalProps {
  open: boolean;
  onClose: () => void;
  expirationDate?: string;
}

export const SubscriptionExpiredModal: React.FC<SubscriptionExpiredModalProps> = ({
  open,
  onClose,
  expirationDate
}) => {
  const navigate = useNavigate();
  
  const handleRenew = () => {
    onClose();
    navigate('/planos');
  };
  
  const handleContinue = () => {
    onClose();
    navigate('/');
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Assinatura Expirada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 space-y-2">
            <p>
              Sua assinatura expirou{expirationDate ? ` em ${expirationDate}` : ''}.
            </p>
            <p>
              Para continuar acessando todas as funcionalidades do sistema,
              renove sua assinatura ou ative um novo plano.
            </p>
            <p className="text-xs text-slate-500">
              Você ainda pode usar o PDV para operações básicas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction
            className="bg-slate-700 hover:bg-slate-600 text-white"
            onClick={handleContinue}
          >
            Continuar no PDV
          </AlertDialogAction>
          <AlertDialogAction
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            onClick={handleRenew}
          >
            <Crown className="w-4 h-4" />
            Renovar Assinatura
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
