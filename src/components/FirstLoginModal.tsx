import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, CheckCircle } from 'lucide-react';

interface FirstLoginModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  open,
  onClose,
  userName
}) => {
  const navigate = useNavigate();
  
  const handleGoToGuide = () => {
    navigate('/guia-completo');
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-600">
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
              Sua conta foi ativada com sucesso! 🚀
            </h2>
            <p className="text-gray-300 text-lg">
              Você agora tem acesso ao <strong>teste grátis de 7 dias</strong> com todos os recursos do sistema.
            </p>
          </div>
          
          {/* Card de instruções */}
          <Card className="bg-gray-700/50 border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">
                    Não sabe por onde começar?
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Criamos um <strong>Guia Completo em Vídeo</strong> para você aprender a usar 
                    todas as funcionalidades do sistema de forma rápida e fácil.
                  </p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Tutoriais passo a passo em vídeo
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Aprenda no seu ritmo
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Acesso vitalício ao guia completo
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botões de ação */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleGoToGuide}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold text-lg py-6"
            >
              <Play className="h-5 w-5 mr-2" />
              COMO USAR O SISTEMA
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Explorar Sozinho
            </Button>
          </div>
          
          <p className="text-center text-gray-400 text-sm">
            Você pode acessar o guia completo a qualquer momento através do menu
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
