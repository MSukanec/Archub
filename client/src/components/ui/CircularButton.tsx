import React, { useState } from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface CircularButtonProps {
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
  onPlusClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function CircularButton({ 
  icon: Icon, 
  isActive = false, 
  onClick, 
  onPlusClick,
  className = '',
  size = 'md',
  label = ''
}: CircularButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
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

  return (
    <div className="relative z-50 w-11 h-11">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        className={`
          absolute left-0 top-0
          flex items-center
          transition-all duration-500 ease-out
          h-11
          rounded-full 
          hover:shadow-xl
          cursor-pointer
          ${isActive 
            ? 'bg-black' 
            : 'bg-[#e1e1e1]'
          }
          ${className}
          z-50
          overflow-visible
          transform-gpu
        `}
        style={{
          width: isHovered && label && onPlusClick ? '180px' : '44px'
        }}
      >
        {/* Botón principal - siempre visible */}
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full 
            flex items-center justify-center 
            transition-all duration-200 
            flex-shrink-0
            z-50
            cursor-pointer
          `}
        >
          <Icon 
            className={`${iconSizes[size]} ${isActive ? 'text-white' : 'text-[#919191]'}`}
          />
        </div>
        
        {/* Texto y botón "+" - aparecen en hover con animación */}
        <div className={`
          flex items-center
          transition-all duration-500 ease-out
          ${isHovered && label && onPlusClick ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
          overflow-hidden
        `}>
          <span className={`text-sm font-medium px-3 whitespace-nowrap ${
            isActive ? 'text-white' : 'text-foreground'
          }`}>
            {label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onPlusClick) onPlusClick();
            }}
            className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 flex-shrink-0 mr-1 z-50"
          >
            <Plus className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}