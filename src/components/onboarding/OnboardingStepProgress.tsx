import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubStep {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingStepProgressProps {
  stepName: string;
  subSteps: SubStep[];
  className?: string;
}

export function OnboardingStepProgress({ 
  stepName, 
  subSteps,
  className 
}: OnboardingStepProgressProps) {
  if (!subSteps || subSteps.length === 0) return null;
  
  const completedCount = subSteps.filter(s => s.completed).length;
  const totalSteps = subSteps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div className={cn("bg-gray-800/50 rounded-lg p-3 border border-gray-700", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{stepName}</span>
        <span className="text-xs font-medium text-green-400">
          {completedCount}/{totalSteps}
        </span>
      </div>
      
      <Progress value={progressPercent} className="h-1.5 mb-3" />
      
      <div className="space-y-1.5">
        {subSteps.map((subStep) => (
          <div 
            key={subStep.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              subStep.completed ? "text-green-400" : "text-gray-500"
            )}
          >
            <CheckCircle2 
              className={cn(
                "w-3.5 h-3.5 flex-shrink-0",
                subStep.completed ? "text-green-500" : "text-gray-600"
              )} 
            />
            <span className={cn(
              subStep.completed && "line-through"
            )}>
              {subStep.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
