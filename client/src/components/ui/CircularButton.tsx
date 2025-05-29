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
  section?: string;
}

export default function CircularButton({ 
  icon: Icon, 
  isActive = false, 
  onClick, 
  className = '',
  size = 'md',
  section
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
    <div
      data-section={section}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
  );
}