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
    id: 'intro',
    title: 'Página de Materiais',
    description: 'Aqui você cadastra todos os materiais que compra e vende. Cada material tem preço de compra e venda separados.',
    targetSelector: '[data-tutorial="materials-header"]',
    position: 'bottom'
  },
  {
    id: 'default-materials',
    title: 'Materiais Padrão',
    description: 'Dica: Clique aqui para adicionar uma lista de materiais comuns automaticamente. Você pode editar depois!',
    targetSelector: '[data-tutorial="default-materials-button"]',
    position: 'bottom'
  },
  {
    id: 'add-material',
    title: 'Adicionar Material',
    description: 'Ou clique aqui para adicionar um material manualmente com nome e preços personalizados.',
    targetSelector: '[data-tutorial="add-material-button"]',
    position: 'bottom'
  },
  {
    id: 'material-card',
    title: 'Editar Materiais',
    description: 'Para editar um material existente, basta clicar no card dele. Você pode alterar nome, preço de compra e venda.',
    targetSelector: '[data-tutorial="material-card"]',
    position: 'right'
  }
];

interface MaterialsTutorialProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function MaterialsTutorial({ isActive, onComplete, onSkip }: MaterialsTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRef, setTargetRef] = useState<React.RefObject<HTMLElement>>({ current: null });
  const { getResponsivePosition, getResponsivePadding } = useTutorialMobile();

  useEffect(() => {
    if (!isActive) return;

    const step = TUTORIAL_STEPS[currentStep];
    if (!step) return;

    const timer = setTimeout(() => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setTargetRef({ current: element });
      } else {
        // Se não encontrar o elemento específico, tenta o próximo step
        if (currentStep < TUTORIAL_STEPS.length - 1) {
          setCurrentStep(prev => prev + 1);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
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
    toast.success('Materiais configurados! Agora vamos operar.', {
      description: 'Dashboard e Estoque desbloqueados!'
    });
    onComplete();
  };

  if (!isActive) return null;

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <>
      {targetRef.current && (
        <>
          <OnboardingSpotlight
            targetRef={targetRef}
            isActive={true}
            padding={getResponsivePadding(12)}
          />
          <OnboardingTooltip
            targetRef={targetRef}
            title={step.title}
            description={step.description}
            step={currentStep + 1}
            totalSteps={TUTORIAL_STEPS.length}
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
