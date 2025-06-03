import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { contactTypesService, ContactType } from '@/lib/contactTypesService';

interface SimpleMultiSelectContactTypesProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
}

export function SimpleMultiSelectContactTypes({
  value = [],
  onChange,
  onBlur,
  disabled,
  error
}: SimpleMultiSelectContactTypesProps) {
  const [open, setOpen] = useState(false);

  const { data: contactTypes = [], isLoading } = useQuery({
    queryKey: ['/api/contact-types'],
    queryFn: () => contactTypesService.getContactTypes(),
  });

  const handleSelectionChange = (typeId: string, checked: boolean) => {
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...value, typeId];
    } else {
      newSelection = value.filter(id => id !== typeId);
    }
    
    onChange?.(newSelection);
  };

  const getSelectedNames = () => {
    if (value.length === 0) return 'Seleccionar tipos';
    if (value.length === 1) {
      const type = contactTypes.find(t => t.id === value[0]);
      return type?.name || '';
    }
    return `${value.length} tipos seleccionados`;
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn(
          "w-full justify-between bg-[#d2d2d2] border-input rounded-lg h-10",
          "text-left font-normal"
        )}
      >
        Cargando tipos...
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={cn(
          "w-full justify-between bg-[#d2d2d2] border-input rounded-lg h-10",
          "text-left font-normal hover:bg-[#c8c8c8]",
          error && "border-destructive",
          value.length === 0 && "text-muted-foreground"
        )}
        onBlur={onBlur}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{getSelectedNames()}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#d2d2d2] border border-input rounded-lg shadow-lg z-50 max-h-[300px] overflow-auto">
          {contactTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center space-x-2 p-3 hover:bg-[#c8c8c8] cursor-pointer"
              onClick={() => handleSelectionChange(type.id, !value.includes(type.id))}
            >
              <Checkbox
                id={type.id}
                checked={value.includes(type.id)}
                onCheckedChange={(checked) => handleSelectionChange(type.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={type.id}
                className="text-sm font-medium leading-none cursor-pointer flex-1"
              >
                {type.name}
              </label>
            </div>
          ))}
          {contactTypes.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              No hay tipos de contacto disponibles
            </div>
          )}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}