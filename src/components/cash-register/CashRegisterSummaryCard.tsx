import React from 'react';

interface CashRegisterSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
  isMobileOrTablet?: boolean;
}

const CashRegisterSummaryCard: React.FC<CashRegisterSummaryCardProps> = ({
  title,
  value,
  subtitle,
  className = "",
  isMobileOrTablet = false
}) => {
  if (isMobileOrTablet) {
    // Mobile/Tablet layout: title left, value right
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth > 768 && window.innerWidth <= 1024;
    
    return (
      <div className={`bg-gray-800 p-4 rounded-sm ${className}`}>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className={`text-gray-300 ${
              isTablet ? 'text-[13px]' : 'text-[11px]' // Tablet: +30%, Mobile: +10%
            }`}>
              {title}
            </div>
            {subtitle && (
              <div className={`text-blue-400 mt-1 ${
                isTablet ? 'text-[10px]' : 'text-[9px]' // Tablet: +30%, Mobile: +10%
              }`}>
                {subtitle}
              </div>
            )}
          </div>
          <div className={`text-[#10b981] font-bold ${
            isTablet ? 'text-2xl' : 'text-xl' // Tablet: +30%, Mobile: +10%
          }`}>
            {value}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout: keep original centered layout
  return (
    <div className={`bg-gray-800 p-4 rounded-sm text-center ${className}`}>
      <div className={`text-gray-300 mb-2 ${
        isMobileOrTablet ? 'text-[10px]' : 'text-xs'
      }`}>
        {title}
        {subtitle && (
          <div className={`text-blue-400 ${
            isMobileOrTablet ? 'text-[8px]' : 'text-[10px]'
          }`}>
            {subtitle}
          </div>
        )}
      </div>
      <div className={`text-[#10b981] font-bold ${
        isMobileOrTablet ? 'text-lg' : 'text-3xl'
      }`}>{value}</div>
    </div>
  );
};

export default CashRegisterSummaryCard;
