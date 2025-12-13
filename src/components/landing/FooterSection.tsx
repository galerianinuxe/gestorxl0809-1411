import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface FooterSectionProps {
  companyName: string;
  footerText: string;
}

const FooterSection: React.FC<FooterSectionProps> = ({ companyName, footerText }) => {
  const navigate = useNavigate();

  return (
    <footer className="bg-black py-10 lg:py-16 px-4 sm:px-6 border-t border-gray-800">
      <div className="container mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8 lg:mb-12 text-center sm:text-left">
          <div>
            <h4 className="text-white font-bold mb-3 text-sm lg:text-base">Contato</h4>
            <p className="text-gray-400 text-sm">Suporte WhatsApp 24/7</p>
            <p className="text-gray-500 text-xs mt-1">Resposta rápida garantida</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-sm lg:text-base">Empresa</h4>
            <p className="text-gray-400 text-sm">Mais de 130 clientes</p>
            <p className="text-gray-500 text-xs mt-1">Em todo o Brasil</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-sm lg:text-base">Segurança</h4>
            <p className="text-gray-400 text-sm">Dados protegidos</p>
            <p className="text-gray-500 text-xs mt-1">Backup automático</p>
          </div>
        </div>

        {/* Links */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/termos-de-uso')}
              className="text-gray-400 hover:text-white text-xs sm:text-sm h-auto py-2"
            >
              Termos de Uso
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/guia-completo')}
              className="text-gray-400 hover:text-white text-xs sm:text-sm h-auto py-2"
            >
              Guia Completo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/planos')}
              className="text-gray-400 hover:text-white text-xs sm:text-sm h-auto py-2"
            >
              Planos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-gray-400 hover:text-white text-xs sm:text-sm h-auto py-2"
            >
              Área do Cliente
            </Button>
          </div>
          
          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-400 text-sm lg:text-base font-medium">
              © {new Date().getFullYear()} XLata.site. Todos os direitos reservados.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Sistema XLata para Depósitos de Reciclagem e Ferros Velhos – Tecnologia que Gera Lucro
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;