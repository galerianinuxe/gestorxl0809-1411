import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Já está instalado, não mostra nada
    }

    // Verifica se já foi dispensado anteriormente
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      return;
    }

    // Detecta iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Detecta se é mobile ou tablet
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 1024;

    if (!isMobileOrTablet) {
      return; // Só mostra em mobile/tablet
    }

    // Para Android - captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS - mostra instruções após delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android - usa o prompt nativo
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white p-1"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
          <Download className="h-6 w-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">
            Instale o XLata no celular!
          </h3>
          <p className="text-white/80 text-xs mt-0.5">
            {isIOS 
              ? 'Toque em "Compartilhar" e depois "Adicionar à Tela Inicial"'
              : 'Acesso rápido, sem navegador, tela cheia!'
            }
          </p>
        </div>
        
        {!isIOS && deferredPrompt && (
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-shrink-0 bg-white text-emerald-600 hover:bg-white/90 font-semibold"
          >
            Instalar
          </Button>
        )}
      </div>
    </div>
  );
}
