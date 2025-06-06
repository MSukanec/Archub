import React from 'react';
import { Lock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

interface ComingSoonProps {
  children: React.ReactNode;
  feature?: string;
  isField?: boolean;
}

export default function ComingSoon({ children, feature = "función", isField = false }: ComingSoonProps) {
  if (isField) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative cursor-not-allowed">
            {children}
            <div className="absolute inset-0 bg-muted/30 rounded-md flex items-center justify-center pointer-events-none">
              <div className="bg-muted text-muted-foreground p-1.5 rounded-full">
                <Lock className="w-3 h-3" />
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 bg-[#141414] border-border"
          side="top"
          align="center"
        >
          <div className="space-y-2">
            <h4 className="font-medium leading-none text-white text-sm">Campo en desarrollo</h4>
            <p className="text-xs text-gray-400">
              Este campo estará disponible próximamente.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative cursor-not-allowed">
          {children}
          <div className="absolute inset-0 bg-muted/50 rounded-md flex items-center justify-center">
            <div className="bg-muted text-muted-foreground p-1.5 rounded-full">
              <Lock className="w-3 h-3" />
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 bg-[#141414] border-border"
        side="top"
        align="center"
      >
        <div className="space-y-2">
          <h4 className="font-medium leading-none text-white text-sm">Función en desarrollo</h4>
          <p className="text-xs text-gray-400">
            Esta {feature} estará disponible próximamente.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}