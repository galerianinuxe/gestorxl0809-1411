import React, { useState, useEffect } from 'react';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { OnboardingSpotlight } from '../OnboardingSpotlight';
import { toast } from 'sonner';
import { useTutorialMobile } from '@/hooks/useTutorialMobile';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao PDV!',
    description: 'Este é o coração do sistema - o Ponto de Venda. Aqui você registra todas as compras e vendas de materiais.',
    targetSelector: '[data-tutorial="pdv-main"]',
    position: 'bottom'
  },
  {
    id: 'open-register',
    title: 'Abrir Caixa',
    description: 'Primeiro, você precisa ABRIR O CAIXA. Clique neste botão e informe o valor inicial em dinheiro.',
    targetSelector: '[data-tutorial="open-register-button"]',
    position: 'bottom'
  }
];

const AFTER_OPEN_STEPS: TutorialStep[] = [
  {
    id: 'weight',
    title: 'Informar o Peso',
    description: 'Digite o peso do material usando o teclado numérico. O peso pode ser em kg ou unidades.',
    targetSelector: '[data-tutorial="number-pad"]',
    position: 'left'
  },
  {
    id: 'material',
    title: 'Selecionar Material',
    description: 'Depois, clique no material correspondente. O sistema calcula o valor automaticamente.',
    targetSelector: '[data-tutorial="material-grid"]',
    position: 'left'
  },
  {
    id: 'order',
    title: 'Itens do Pedido',
    description: 'Os itens adicionados aparecem aqui. Você pode revisar antes de finalizar.',
    targetSelector: '[data-tutorial="order-details"]',
    position: 'left'
  },
  {
    id: 'complete',
    title: 'Finalizar Pedido',
    description: 'Para concluir, clique em FINALIZAR. Você poderá escolher a forma de pagamento e imprimir o comprovante.',
    targetSelector: '[data-tutorial="complete-button"]',
    position: 'top'
  }
];

interface PDVTutorialProps {
  isActive: boolean;
  isCashRegisterOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function PDVTutorial({ isActive, isCashRegisterOpen, onComplete, onSkip }: PDVTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRef, setTargetRef] = useState<React.RefObject<HTMLElement>>({ current: null });
  const [showAfterOpenSteps, setShowAfterOpenSteps] = useState(false);
  const { getResponsivePosition, getResponsivePadding } = useTutorialMobile();

  // Determinar quais steps usar
  const steps = showAfterOpenSteps ? AFTER_OPEN_STEPS : TUTORIAL_STEPS;

  // Quando o caixa abrir, mudar para os steps seguintes
  useEffect(() => {
    if (isCashRegisterOpen && !showAfterOpenSteps) {
      setShowAfterOpenSteps(true);
      setCurrentStep(0);
      toast.success('Caixa aberto com sucesso!', {
        description: 'Agora vamos aprender a registrar operações.'
      });
    }
  }, [isCashRegisterOpen, showAfterOpenSteps]);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    if (!step) return;

    const timer = setTimeout(() => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setTargetRef({ current: element });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  if (!isActive) return null;

  const step = steps[currentStep];

  return (
    <>
      {targetRef.current && (
        <>
          <OnboardingSpotlight
            targetRef={targetRef}
            isActive={true}
            padding={getResponsivePadding(16)}
          />
          <OnboardingTooltip
            targetRef={targetRef}
            title={step.title}
            description={step.description}
            step={currentStep + 1}
            totalSteps={steps.length}
            position={getResponsivePosition(step.position)}
            onNext={handleNext}
            onPrev={currentStep > 0 ? handlePrev : undefined}
            onSkip={onSkip}
          />
        </>
      )}
    </>
  );
}
