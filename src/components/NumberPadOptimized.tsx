import React, { useState, useEffect, useCallback, useRef } from 'react';

interface NumberPadOptimizedProps {
  onSubmit: (value: number) => void;
  onClear: () => void;
  value?: string | number;
  disableAutoFocus?: boolean;
}

const NumberPadOptimized: React.FC<NumberPadOptimizedProps> = ({ 
  onSubmit, 
  onClear, 
  value, 
  disableAutoFocus = false 
}) => {
  const [internalValue, setInternalValue] = useState(0);
  const displayRef = useRef<HTMLDivElement>(null);
  const submitTimeoutRef = useRef<number>();
  const lastSubmittedRef = useRef<number>(0);

  // Sync external value - otimizado
  useEffect(() => {
    if (value !== undefined && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const newValue = isNaN(numValue) ? 0 : numValue;
      if (newValue !== internalValue) {
        setInternalValue(newValue);
      }
    } else if (internalValue !== 0) {
      setInternalValue(0);
    }
  }, [value]);

  // Auto-focus apenas no mount inicial
  useEffect(() => {
    if (!disableAutoFocus && displayRef.current) {
      displayRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Formatação do visor otimizada
  const formatDisplay = useCallback((num: number): string => {
    const formatted = num.toFixed(3);
    const [integerPart, decimalPart] = formatted.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInteger},${decimalPart}`;
  }, []);

  // Submit otimizado - debounce de 100ms
  useEffect(() => {
    // Evita submits duplicados
    if (internalValue === lastSubmittedRef.current) return;

    if (submitTimeoutRef.current) {
      cancelAnimationFrame(submitTimeoutRef.current);
    }

    submitTimeoutRef.current = requestAnimationFrame(() => {
      setTimeout(() => {
        if (internalValue !== lastSubmittedRef.current) {
          lastSubmittedRef.current = internalValue;
          onSubmit(internalValue);
        }
      }, 100);
    });

    return () => {
      if (submitTimeoutRef.current) {
        cancelAnimationFrame(submitTimeoutRef.current);
      }
    };
  }, [internalValue, onSubmit]);

  // Handler para clique nos números - otimizado
  const handleDigitClick = useCallback((digit: string) => {
    setInternalValue(prevValue => {
      const currentStr = prevValue.toFixed(3).replace('.', '');
      const newStr = (currentStr + digit).slice(-9);
      return parseInt(newStr) / 1000;
    });
  }, []);

  // Handler para clear - otimizado
  const handleClear = useCallback(() => {
    setInternalValue(prevValue => {
      const currentStr = prevValue.toFixed(3).replace('.', '');
      const newStr = ('0' + currentStr.slice(0, -1)).slice(-9);
      return parseInt(newStr) / 1000;
    });
  }, []);

  // Handler para zerar balança
  const handleZeroScale = useCallback(() => {
    setInternalValue(0);
    lastSubmittedRef.current = 0;
    onClear();
  }, [onClear]);

  // Handler para entrada via teclado - otimizado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    
    if (e.key >= '0' && e.key <= '9') {
      handleDigitClick(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleClear();
    } else if (e.key === 'Escape') {
      handleZeroScale();
    }
  }, [handleDigitClick, handleClear, handleZeroScale]);

  // Handler de blur - não tenta recuperar foco (o listener global cuida da entrada)
  const handleBlur = useCallback(() => {
    // Não faz nada - o listener global de teclado cuida da entrada
  }, []);

  return (
    <div className="flex flex-col h-full w-full p-[2%] pb-1 bg-slate-900 overflow-hidden">
      {/* Display - altura responsiva */}
      <div 
        ref={displayRef}
        className="h-24 sm:h-28 md:h-32 flex-shrink-0 bg-slate-950 flex items-center justify-center p-4 outline-none cursor-text border border-slate-700 rounded-sm gpu-accelerated"
        tabIndex={disableAutoFocus ? -1 : 0}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{ userSelect: 'none' }}
      >
        <span className="text-5xl sm:text-6xl font-sans font-bold text-emerald-400">
          {formatDisplay(internalValue)}
        </span>
      </div>

      {/* Teclado numérico - permite shrink */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-[2px] p-[2px] bg-slate-800 mt-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button 
            key={digit}
            className="numpad-btn-optimized" 
            onClick={() => handleDigitClick(digit)}
          >
            {digit}
          </button>
        ))}
        
        <button 
          className="numpad-btn-optimized col-span-2" 
          onClick={() => handleDigitClick('0')}
        >
          0
        </button>
        <button 
          className="numpad-btn-optimized clear-btn" 
          onClick={handleClear}
        >
          C
        </button>
      </div>

      {/* Botão Zerar Balança - altura fixa garantida */}
      <div className="flex-shrink-0 grid grid-cols-1 gap-[2px] p-[2px] bg-slate-800 mt-1">
        <button 
          className="numpad-btn-optimized zero-scale-btn text-zerar-scale text-lg sm:text-xl h-12 sm:h-14" 
          onClick={handleZeroScale}
        >
          ZERAR BALANÇA
        </button>
      </div>
    </div>
  );
};

export default React.memo(NumberPadOptimized);
