
import React, { useState, useEffect } from 'react';
import { Material } from '@/types/pdv';
import MaterialConfigModal, { MaterialDisplayConfig } from './MaterialConfigModal';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

interface MaterialGridProps {
  materials: Material[];
  onMaterialSelect: (material: Material) => void;
  onManualInsert: () => void;
  isSaleMode?: boolean;
  hasActiveOrder?: boolean;
  onNewOrderRequest?: () => void;
}

const MaterialGrid = React.memo(({ 
  materials, 
  onMaterialSelect, 
  isSaleMode = false, 
  hasActiveOrder = false,
  onNewOrderRequest 
}: MaterialGridProps) => {
  // Handler memoizado para cliques
  const handleClick = React.useCallback((material: Material) => {
    onMaterialSelect(material);
  }, [onMaterialSelect]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState<MaterialDisplayConfig>({
    fontSize: 'medium',
    showPricePerKg: true
  });

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    // Load configuration from localStorage
    const savedConfig = localStorage.getItem('material_display_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);


  const formatPrice = (material: Material) => {
    if (!config.showPricePerKg) return '';
    
    // Use sale price in sale mode, purchase price in purchase mode
    const price = isSaleMode ? material.salePrice : material.price;
    return `R$ ${price.toFixed(2)}/kg`;
  };

  const getFontSizeClass = () => {
    if (isMobile) {
      switch (config.fontSize) {
        case 'small':
          return 'text-[10px]';
        case 'large':
          return 'text-xs';
        default:
          return 'text-[11px]';
      }
    }
    
    switch (config.fontSize) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getNameFontSizeClass = () => {
    if (isMobile) {
      switch (config.fontSize) {
        case 'small':
          return 'text-[10px]';
        case 'large':
          return 'text-sm';
        default:
          return 'text-xs';
      }
    }
    
    switch (config.fontSize) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  const getMaterialButtonClass = () => {
    return isSaleMode ? 'material-btn-sale-mode' : 'material-btn';
  };

  // Determinar o número de colunas baseado no dispositivo
  const getGridCols = () => {
    if (isMobile) return 'grid-cols-4';
    if (isTablet) return 'grid-cols-4';
    return 'grid-cols-8';
  };

  // Determinar o número total de slots para preencher
  const getTotalSlots = () => {
    if (isMobile) return 16; // 4x4 grid
    if (isTablet) return 16; // 6x4(24) grid
    return 32; // 8x4 grid (desktop)
  };

  // Altura mínima aumentada em 30% apenas para mobile e tablet
  const getMinHeight = () => {
    if (isMobile || isTablet) {
      return 'min-h-[80vh]'; // Aumenta 30% da altura mínima original
    }
    return 'h-full'; // Mantém desktop como está
  };

  const totalSlots = getTotalSlots();

  return (
    <>
      <div className={`grid ${getGridCols()} gap-[2px] ${getMinHeight()} bg-slate-800 relative p-[2px]`}>
        {materials.map((material) => (
          <button
            key={material.id}
            onClick={() => handleClick(material)}
            className={`${getMaterialButtonClass()} ${isMobile ? 'p-1' : 'p-2'} gpu-accelerated fast-transition`}
          >
            <span className={`${getNameFontSizeClass()} font-bold text-center leading-tight block text-white`}>
              {material.name}
            </span>
            {config.showPricePerKg && (
              <span className={`${getFontSizeClass()} block mt-1 ${isSaleMode ? 'text-amber-200' : 'text-emerald-300'}`}>
                {formatPrice(material)}
              </span>
            )}
          </button>
        ))}
        
        {/* Preencher espaços vazios */}
        {Array.from({ length: Math.max(0, totalSlots - materials.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-slate-900 border border-slate-700"></div>
        ))}
      </div>

      <MaterialConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Comparação otimizada - só re-renderiza se necessário
  return (
    prevProps.materials.length === nextProps.materials.length &&
    prevProps.isSaleMode === nextProps.isSaleMode &&
    prevProps.hasActiveOrder === nextProps.hasActiveOrder
  );
});

MaterialGrid.displayName = 'MaterialGrid';

export default MaterialGrid;
