import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { user, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Só mostra prompt para usuários logados
    if (loading || !user) {
      setShowPrompt(false);
      return;
    }

    // Verifica se já está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Já está instalado, não mostra nada
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
  }, [user, loading]);

  // Se não estiver logado, não renderiza nada
  if (!user) {
    return null;
  }

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
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-2 right-2 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      {isIOS ? (
        // iOS: Texto informativo pequeno
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg max-w-xs">
          <Download className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-gray-300">
            <strong className="text-white">Compartilhar</strong> → <strong className="text-white">Adicionar à Tela</strong>
          </span>
          <button 
            onClick={handleDismiss} 
            className="ml-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        // Android/Desktop: Botão discreto
        <div className="flex items-center gap-1">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 h-auto shadow-lg"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Instalar App
          </Button>
          <button 
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-white bg-gray-800/80 rounded-md transition-colors"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Hook para usar em outros componentes
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Verifica se já está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setCanInstall(false);
      return;
    }

    // Detecta se é mobile ou tablet
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 1024;

    if (!isMobileOrTablet) {
      setCanInstall(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener para detectar quando app é instalado
    const handleAppInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
      }
      return outcome === 'accepted';
    }
    return false;
  };

  return { canInstall, promptInstall };
}
