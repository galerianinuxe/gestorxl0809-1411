
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, CheckCircle } from 'lucide-react';

interface EmailConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({ 
  open, 
  onClose, 
  email 
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-green-400 text-center">
            Cadastro Realizado com Sucesso!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 space-y-3">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Mail className="h-5 w-5 text-blue-400" />
              <span className="font-semibold">Confirme seu e-mail</span>
            </div>
            <p>
              Enviamos um e-mail de confirmação para:
            </p>
            <p className="font-semibold text-green-400 bg-gray-900/50 p-2 rounded text-center text-lg">
              {email}
            </p>
            <p>
              Para acessar sua conta no <strong>XLATA.SITE</strong>, você precisa confirmar seu e-mail 
              clicando no link que enviamos.
            </p>
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 mt-4">
              <p className="text-yellow-300 text-sm">
                <strong>⚠️ Importante:</strong> Verifique também sua caixa de spam ou lixo eletrônico 
                caso não encontre o e-mail em sua caixa de entrada.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          >
            Entendi, vou confirmar meu e-mail
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmailConfirmationModal;
