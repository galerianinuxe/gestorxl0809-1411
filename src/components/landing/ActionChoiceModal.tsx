import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, MessageCircle, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ActionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

const ActionChoiceModal: React.FC<ActionChoiceModalProps> = ({
  isOpen,
  onClose,
  whatsappNumber = '5511963512105',
}) => {
  const navigate = useNavigate();

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      'Olá! Vi o site do XLata e quero saber mais sobre o sistema para meu depósito.'
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-md p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-white text-center text-xl font-bold">
            Como prefere começar?
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Escolha a opção que faz mais sentido para você
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Opção 1 - Cadastrar sozinho */}
          <button
            onClick={handleRegister}
            className="w-full p-5 bg-green-600 hover:bg-green-700 rounded-xl flex items-center gap-4 transition-all group"
          >
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-semibold text-lg">
                Quero testar sozinho
              </h3>
              <p className="text-green-100/70 text-sm">
                Cadastre-se em 2 minutos e teste grátis
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* Opção 2 - Falar com atendente */}
          <button
            onClick={handleWhatsApp}
            className="w-full p-5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex items-center gap-4 transition-all group"
          >
            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-7 w-7 text-green-400" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-semibold text-lg">
                Falar com atendente
              </h3>
              <p className="text-gray-400 text-sm">
                Te explicamos tudo pelo WhatsApp
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>
        </div>

        <p className="text-gray-500 text-xs text-center pt-2">
          Sem compromisso — você escolhe como quer começar
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ActionChoiceModal;
