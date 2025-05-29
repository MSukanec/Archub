import React, { useState } from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface CircularButtonProps {
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function CircularButton({ 
  icon: Icon, 
  isActive = false, 
  onClick, 
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
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${sizeClasses[size]}
          rounded-full 
          flex items-center justify-center 
          transition-all duration-200 
          hover:scale-110 
          hover:shadow-lg
          ${isActive 
            ? 'bg-black' 
            : 'bg-[#e1e1e1]'
          }
          ${className}
        `}
      >
        <Icon 
          className={`${iconSizes[size]} ${isActive ? 'text-white' : 'text-[#919191]'}`}
        />
        
        {/* Botón "+" anidado en hover */}
        {isHovered && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
      </button>
      
      {/* Texto en hover */}
      {isHovered && label && (
        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-black text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg z-10">
          {label}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-black rotate-45"></div>
        </div>
      )}
    </div>
  );
}