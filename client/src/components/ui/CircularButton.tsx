import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface CircularButtonProps {
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
  onPlusClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  section?: string;
  tooltipDirection?: 'left' | 'right';
}

export default function CircularButton({ 
  icon: Icon, 
  isActive = false, 
  onClick, 
  className = '',
  size = 'md',
  section,
  label,
  description,
  tooltipDirection = 'right'
}: CircularButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-[20px] h-[20px]', 
    lg: 'w-6 h-6'
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (label) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 250);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        data-section={section}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          rounded-full 
          flex items-center justify-center 
          transition-all duration-300
          shadow-lg
          hover:shadow-xl
          cursor-pointer
          ${isActive 
            ? 'bg-black' 
            : 'bg-[#e1e1e1]'
          }
          ${className}
          ${isHovered ? 'pressed' : ''}
        `}
      >
        <Icon 
          className={`${iconSizes[size]} ${isActive ? 'text-white' : 'text-[#919191]'}`}
        />
      </div>
      
      {/* Enhanced Popover Tooltip */}
      {showTooltip && label && (
        <div className={`
          absolute top-1/2 transform -translate-y-1/2
          ${tooltipDirection === 'right' ? 'left-full ml-3' : 'right-full mr-3'}
          bg-gray-700 text-white rounded-lg shadow-xl z-50 pointer-events-none
          min-w-[200px] max-w-[250px]
        `}>
          <div className="p-3">
            {/* Title in black (or white since bg is dark) */}
            <div className="font-semibold text-sm text-white mb-1">
              {label}
            </div>
            {/* Description in secondary color */}
            {description && (
              <div className="text-xs text-gray-300 leading-relaxed">
                {description}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className={`
            absolute top-1/2 transform -translate-y-1/2
            w-0 h-0 border-t-[6px] border-b-[6px] border-transparent
            ${tooltipDirection === 'right' 
              ? 'right-full border-r-[6px] border-r-gray-700'
              : 'left-full border-l-[6px] border-l-gray-700'
            }
          `} />
        </div>
      )}
    </div>
  );
}