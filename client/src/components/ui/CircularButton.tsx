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
            : 'bg-surface-primary'
          }
          ${className}
          ${isHovered ? 'pressed' : ''}
        `}
      >
        <Icon 
          className={`${iconSizes[size]} ${isActive ? 'text-white' : 'text-muted-foreground'}`}
        />
      </div>
      
      {/* Enhanced Popover Tooltip */}
      {showTooltip && label && (
        <div className={`
          absolute top-1/2 transform -translate-y-1/2
          ${tooltipDirection === 'right' ? 'left-full ml-3' : 'right-full mr-3'}
          bg-surface-secondary rounded-2xl shadow-lg z-50 pointer-events-none
          max-w-[280px] ${description ? 'min-w-[200px]' : 'whitespace-nowrap'}
        `}>
          <div className={description ? "p-4" : "px-4 py-2"}>
            {/* Title in black */}
            <div className={`font-semibold text-sm text-foreground ${description ? "mb-2" : ""}`}>
              {label}
            </div>
            {/* Description in sidebar icon color */}
            {description && (
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-normal">
                {description}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className={`
            absolute top-1/2 transform -translate-y-1/2
            w-0 h-0 border-t-[8px] border-b-[8px] border-transparent
            ${tooltipDirection === 'right' 
              ? 'right-full border-r-[8px] border-r-[#e1e1e1]'
              : 'left-full border-l-[8px] border-l-[#e1e1e1]'
            }
          `} />
        </div>
      )}
    </div>
  );
}