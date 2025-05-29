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
    md: 'w-4.5 h-4.5', 
    lg: 'w-6 h-6'
  };

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          flex items-center
          transition-all duration-300 ease-in-out
          ${isHovered ? 'w-auto pr-2' : sizeClasses[size]}
          h-11
          rounded-full 
          hover:shadow-lg
          ${isActive 
            ? 'bg-black' 
            : 'bg-[#e1e1e1]'
          }
          ${className}
        `}
      >
        {/* Botón principal - siempre visible */}
        <button
          onClick={onClick}
          className={`
            ${sizeClasses[size]}
            rounded-full 
            flex items-center justify-center 
            transition-all duration-200 
            flex-shrink-0
          `}
        >
          <Icon 
            className={`${iconSizes[size]} ${isActive ? 'text-white' : 'text-[#919191]'}`}
          />
        </button>
        
        {/* Texto y botón "+" - aparecen en hover */}
        {isHovered && label && onPlusClick && (
          <>
            <span className="text-sm font-medium text-foreground px-2 whitespace-nowrap">
              {label}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlusClick();
              }}
              className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform flex-shrink-0"
            >
              <Plus className="w-3 h-3 text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}