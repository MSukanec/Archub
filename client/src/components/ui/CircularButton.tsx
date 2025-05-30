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
      
      {/* Tooltip */}
      {showTooltip && label && (
        <div className={`
          absolute top-1/2 transform -translate-y-1/2
          px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
          shadow-lg z-50 pointer-events-none
          ${tooltipDirection === 'right' ? 'left-full ml-2' : 'right-full mr-2'}
          ${isActive 
            ? 'bg-black text-white' 
            : 'bg-[#e1e1e1] text-[#919191]'
          }
        `}>
          {label}
          {/* Arrow */}
          <div className={`
            absolute top-1/2 transform -translate-y-1/2
            w-0 h-0 border-t-4 border-b-4 border-transparent
            ${tooltipDirection === 'right' 
              ? `right-full border-r-4 ${isActive ? 'border-r-black' : 'border-r-[#e1e1e1]'}`
              : `left-full border-l-4 ${isActive ? 'border-l-black' : 'border-l-[#e1e1e1]'}`
            }
          `} />
        </div>
      )}
    </div>
  );
}