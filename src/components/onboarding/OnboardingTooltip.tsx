import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  isVisible?: boolean;
}

export function OnboardingTooltip({
  targetRef,
  title,
  description,
  step,
  totalSteps,
  position = 'bottom',
  onNext,
  onPrev,
  onSkip,
  isVisible = true
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!targetRef.current || !tooltipRef.current || !isVisible) return;

    const updatePosition = () => {
      const targetRect = targetRef.current!.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      
      let top = 0;
      let left = 0;

      // Em mobile, sempre centralizar horizontalmente
      if (isMobile) {
        left = 16;
        // Decidir se fica acima ou abaixo do target
        const spaceBelow = window.innerHeight - targetRect.bottom;
        const spaceAbove = targetRect.top;
        
        if (spaceBelow > tooltipRect.height + 20 || spaceBelow > spaceAbove) {
          top = targetRect.bottom + 12;
        } else {
          top = targetRect.top - tooltipRect.height - 12;
        }
      } else {
        switch (position) {
          case 'top':
            top = targetRect.top - tooltipRect.height - 12;
            left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'bottom':
            top = targetRect.bottom + 12;
            left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case 'left':
            top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.left - tooltipRect.width - 12;
            break;
          case 'right':
            top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.right + 12;
            break;
        }
      }

      // Manter dentro da viewport
      const padding = isMobile ? 16 : 16;
      const maxWidth = isMobile ? window.innerWidth - 32 : tooltipRect.width;
      left = Math.max(padding, Math.min(left, window.innerWidth - maxWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetRef, position, isVisible]);

  if (!isVisible) return null;

  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
  };

  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-gray-800 border border-gray-700 rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      style={{ 
        top: coords.top, 
        left: isMobileView ? 16 : coords.left 
      }}
    >
      {/* Arrow */}
      <div className={cn(
        "absolute w-0 h-0 border-[6px]",
        arrowClasses[position]
      )} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            {step}/{totalSteps}
          </span>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {onSkip && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-300 text-sm">{description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/50">
        <div>
          {onPrev && step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-300"
            >
              Pular
            </Button>
          )}
          {onNext && (
            <Button
              size="sm"
              onClick={onNext}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {step === totalSteps ? 'Concluir' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
