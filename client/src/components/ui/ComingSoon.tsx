import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComingSoonProps {
  children: React.ReactNode;
}

export default function ComingSoon({ children }: ComingSoonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="center">
        <div className="text-center">
          <h4 className="font-medium text-sm mb-2">Función en Desarrollo</h4>
          <p className="text-xs text-muted-foreground">
            Esta funcionalidad estará disponible próximamente.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}