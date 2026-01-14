import React, { useRef, useEffect, memo } from 'react';
import { MaterialCategory } from '@/types/pdv';
import { cn } from '@/lib/utils';

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
      const borderColor = darkenHex(category.hex_color, 15);
      
      return {
        style: {
          backgroundColor: isSelected ? category.hex_color : `${category.hex_color}CC`,
          color: textColor,
          borderColor: isSelected ? borderColor : 'transparent',
        },
        className: isSelected ? 'ring-2 ring-white/30' : ''
      };
    }
    
    // Fallback to predefined colors
    const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
    return {
      className: cn(
        isSelected
          ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-white/30`
          : `${colors.bg}/80 ${colors.text} border-transparent hover:${colors.bg}`
      ),
      style: {}
    };
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 py-2 px-2">
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Botão "Todos" */}
        <button
          ref={selectedCategoryId === null ? selectedButtonRef : undefined}
          onClick={() => onSelectCategory(null)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border-2',
            selectedCategoryId === null
              ? 'bg-slate-600 text-white border-slate-400 ring-2 ring-slate-400/50'
              : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
          )}
        >
          Todos
        </button>

        {/* Botões de categorias */}
        {activeCategories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const { className, style } = getCategoryStyle(category, isSelected);
          const count = materialCountByCategory[category.id] || 0;

          return (
            <button
              key={category.id}
              ref={isSelected ? selectedButtonRef : undefined}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border-2 flex items-center gap-1.5',
                className
              )}
              style={style}
            >
              <span>{category.name}</span>
              {count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isSelected ? 'bg-white/20' : 'bg-black/20'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CategoryBar);