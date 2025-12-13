import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileStickyCTA: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      const shouldShow = window.scrollY > 500;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/30 p-3 safe-area-pb">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/register')}
            className="flex-1 bg-white text-emerald-700 hover:bg-gray-100 font-bold py-4 text-sm"
          >
            <Zap className="mr-2 h-4 w-4" />
            Testar Grátis 7 Dias
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-white/70 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileStickyCTA;