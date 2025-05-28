import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: "orange" | "green" | "red" | "blue";
  className?: string;
}

const iconColorMap = {
  orange: "text-orange-500",
  green: "text-green-500", 
  red: "text-red-500",
  blue: "text-blue-500"
};

export function MetricCard({ 
  title, 
  value, 
  icon, 
  iconColor = "orange",
  className 
}: MetricCardProps) {
  return (
    <div className={cn(
      "bg-muted/30 shadow-md rounded-2xl p-4 transition-all duration-300 hover:shadow-lg",
      className
    )}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        
        <div className="bg-muted/70 p-3 rounded-xl">
          <div className={cn("w-6 h-6", iconColorMap[iconColor])}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}