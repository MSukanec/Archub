import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CircularButtonProps {
  icon: LucideIcon;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CircularButton({ 
  icon: Icon, 
  isActive = false, 
  onClick, 
  className = '',
  size = 'md'
}: CircularButtonProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        rounded-full 
        flex items-center justify-center 
        transition-all duration-200 
        hover:scale-110 
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
    </button>
  );
}