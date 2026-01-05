import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Settings, Package, DollarSign } from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS, STEP_SUB_STEPS } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OnboardingStepProgress } from './OnboardingStepProgress';

const stepIcons = {
  1: Settings,
  2: Package,
  3: DollarSign
};

const stepRoutes = {
  1: '/configuracoes',
  2: '/materiais',
  3: '/'
};

export function OnboardingChecklist() {
  const { 
    progress, 
    isOnboardingActive, 
    isStepCompleted, 
    skipOnboarding,
    getSubStepProgress,
    isSubStepCompleted 
  } = useOnboarding();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOnboardingActive) return null;

  const completedCount = progress.completedSteps.length;
  const totalSteps = ONBOARDING_STEPS.length - 1; // Excluir step 0
  const progressPercent = (completedCount / totalSteps) * 100;

  const handleStepClick = (stepId: number) => {
    const route = stepRoutes[stepId as keyof typeof stepRoutes];
    if (route) {
      navigate(route);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
        >
          <span className="font-semibold">{Math.round(progressPercent)}%</span>
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-[4.5rem] right-4 z-50 w-72 bg-gray-900 border-gray-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Configuração Inicial</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Progresso</span>
          <span>{completedCount}/{totalSteps} completos</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Steps */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {ONBOARDING_STEPS.slice(1).map((step) => {
            const Icon = stepIcons[step.id as keyof typeof stepIcons];
            const completed = isStepCompleted(step.id);
            const isCurrent = progress.currentStep === step.id;
            const subStepProgress = getSubStepProgress(step.id);
            const subSteps = STEP_SUB_STEPS[step.id] || [];

            return (
              <div key={step.id}>
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                    completed ? "bg-green-500/10" : isCurrent ? "bg-gray-800 ring-1 ring-green-500/50" : "bg-gray-800/50 hover:bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    completed ? "bg-green-500" : isCurrent ? "bg-green-600" : "bg-gray-700"
                  )}>
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : Icon ? (
                      <Icon className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      completed ? "text-green-400" : "text-white"
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{step.description}</p>
                  </div>
                  {isCurrent && !completed && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                      {subStepProgress.completed}/{subStepProgress.total}
                    </span>
                  )}
                </button>

                {/* Sub-step progress for current step */}
                {isCurrent && !completed && subSteps && subSteps.length > 0 && (
                  <OnboardingStepProgress
                    stepName={step.name}
                    subSteps={subSteps.map(s => ({
                      id: s.id,
                      label: s.label,
                      completed: isSubStepCompleted(step.id, s.id)
                    }))}
                    className="mt-2 ml-11"
                  />
                )}
              </div>
            );
          })}

          {/* Skip button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="w-full text-gray-500 hover:text-gray-300 text-xs mt-2"
          >
            Pular configuração
          </Button>
        </div>
      )}
    </Card>
  );
}
