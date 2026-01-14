import React, { useRef, useEffect, memo } from 'react';
import { MaterialCategory } from '@/types/pdv';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryBarProps {
  categories: MaterialCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  materialCountByCategory?: Record<string, number>;
}

// Cores pré-definidas para categorias (fallback)
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
  purple: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-400' },
  orange: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-400' },
  red: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400' },
  yellow: { bg: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-400' },
  pink: { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-400' },
  gray: { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-400' },
  brown: { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-500' },
  black: { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-600' },
  sky: { bg: 'bg-sky-400', text: 'text-white', border: 'border-sky-300' },
  green: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-400' },
  beige: { bg: 'bg-amber-100', text: 'text-black', border: 'border-amber-200' },
};

export const CATEGORY_COLOR_OPTIONS = [
  { value: 'blue', label: 'Azul' },
  { value: 'purple', label: 'Roxo' },
  { value: 'orange', label: 'Laranja' },
  { value: 'red', label: 'Vermelho' },
  { value: 'yellow', label: 'Amarelo' },
  { value: 'pink', label: 'Rosa' },
  { value: 'gray', label: 'Cinza' },
  { value: 'brown', label: 'Marrom' },
  { value: 'black', label: 'Preto' },
  { value: 'sky', label: 'Azul Claro' },
  { value: 'green', label: 'Verde' },
];

// Helper to determine if a hex color is light
const isLightColor = (hex: string): boolean => {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Helper to darken a hex color for border
const darkenHex = (hex: string, percent: number = 20): string => {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * percent / 100));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  materialCountByCategory = {}
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  // Filter only active categories
  const activeCategories = categories.filter(c => c.is_active !== false);

  // Auto-scroll para manter o botão selecionado visível
  useEffect(() => {
    if (selectedButtonRef.current && scrollContainerRef.current) {
      selectedButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedCategoryId]);

  const getCategoryStyle = (category: MaterialCategory, isSelected: boolean) => {
    // Use hex_color if available
    if (category.hex_color) {
      const textColor = isLightColor(category.hex_color) ? '#000000' : '#FFFFFF';
      
      return {
        style: {
          backgroundColor: category.hex_color,
          color: textColor,
        },
        textColor
      };
    }
    
    // Fallback to predefined colors
    const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
    return {
      className: `${colors.bg} ${colors.text}`,
      style: {},
      textColor: '#FFFFFF'
    };
  };

  // Tamanhos dos botões (mesmo estilo dos materiais)
  const buttonSize = isMobile 
    ? 'min-w-[80px] min-h-[55px]' 
    : 'min-w-[100px] min-h-[70px]';

  return (
    <div className="bg-slate-800 p-[2px]">
      <div
        ref={scrollContainerRef}
        className="flex gap-[2px] overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Botão "Todos" */}
        <button
          ref={selectedCategoryId === null ? selectedButtonRef : undefined}
          onClick={() => onSelectCategory(null)}
          className={cn(
            'flex-shrink-0 flex flex-col items-center justify-center relative',
            buttonSize,
            'rounded-none text-sm font-bold transition-all duration-200',
            selectedCategoryId === null
              ? 'bg-slate-600'
              : 'bg-slate-700 hover:bg-slate-600'
          )}
        >
          <span className="text-white font-bold text-sm">Todos</span>
          {selectedCategoryId === null && (
            <>
              <div className="absolute inset-0 border-[3px] border-white pointer-events-none" />
              <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-md">
                <Check className="h-3 w-3 text-slate-900" />
              </div>
            </>
          )}
        </button>

        {/* Botões de categorias */}
        {activeCategories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const { className, style, textColor } = getCategoryStyle(category, isSelected);
          const count = materialCountByCategory[category.id] || 0;

          return (
            <button
              key={category.id}
              ref={isSelected ? selectedButtonRef : undefined}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center relative',
                buttonSize,
                'rounded-none text-sm font-bold transition-all duration-200',
                className
              )}
              style={style}
            >
              <span className="font-bold text-sm">{category.name}</span>
              {count > 0 && (
                <span 
                  className="text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: textColor === '#000000' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' 
                  }}
                >
                  {count}
                </span>
              )}
              {isSelected && (
                <>
                  <div className="absolute inset-0 border-[3px] border-white pointer-events-none" />
                  <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-md">
                    <Check className="h-3 w-3 text-slate-900" />
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CategoryBar);