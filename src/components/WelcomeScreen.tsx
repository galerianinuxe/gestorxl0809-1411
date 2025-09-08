
import React, { memo, useCallback } from 'react';
import { HomeLayout } from './HomeLayout';

interface WelcomeScreenProps {
  onOpenCashRegister: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = memo(({ onOpenCashRegister }) => {
  // Otimizar callback para evitar re-renders desnecessários
  const handleOpenCashRegister = useCallback(() => {
    // Usar requestAnimationFrame para garantir transição suave
    requestAnimationFrame(() => {
      onOpenCashRegister();
    });
  }, [onOpenCashRegister]);

  return <HomeLayout onOpenCashRegister={handleOpenCashRegister} />;
});

WelcomeScreen.displayName = 'WelcomeScreen';

export default WelcomeScreen;
