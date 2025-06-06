import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { cn } from '../../lib/utils';
import { contactTypesService, ContactType } from '../lib/contactTypesService';

interface MultiSelectContactTypesProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
}

export function MultiSelectContactTypes({
  value = [],
  onChange,
  onBlur,
  disabled,
  error
}: MultiSelectContactTypesProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(value);

  const { data: contactTypes = [], isLoading } = useQuery({
    queryKey: ['/api/contact-types'],
    queryFn: () => {
      console.log('Fetching contact types...');
      return contactTypesService.getContactTypes();
    },
  });

  console.log('Contact types loaded:', contactTypes);

  useEffect(() => {
    setSelectedIds(value);
  }, [value]);

  const handleSelectionChange = (typeId: string, checked: boolean) => {
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...selectedIds, typeId];
    } else {
      newSelection = selectedIds.filter(id => id !== typeId);
    }
    
    setSelectedIds(newSelection);
    onChange?.(newSelection);
  };

  const getSelectedNames = () => {
    if (selectedIds.length === 0) return 'Seleccionar tipos';
    if (selectedIds.length === 1) {
      const type = contactTypes.find(t => t.id === selectedIds[0]);
      return type?.name || '';
    }
    return `${selectedIds.length} tipos seleccionados`;
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn(
          "w-full justify-between bg-surface-primary border-input rounded-lg h-10",
          "text-left font-normal"
        )}
      >
        Cargando tipos...
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      console.log('Popover state changing from', open, 'to', newOpen);
      setOpen(newOpen);
    }} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-surface-primary border-input rounded-lg h-10",
            "text-left font-normal hover:bg-[#c8c8c8]",
            error && "border-destructive",
            selectedIds.length === 0 && "text-muted-foreground"
          )}
          onBlur={onBlur}
          onClick={() => {
            console.log('Button clicked, current open state:', open);
          }}
        >
          <span className="truncate">{getSelectedNames()}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 z-[99999]" 
        align="start" 
        side="bottom"
        sideOffset={5}
        avoidCollisions={true}
      >
        <div className="max-h-60 overflow-auto">
          {contactTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center space-x-2 p-3 hover:bg-muted cursor-pointer"
              onClick={() => handleSelectionChange(type.id, !selectedIds.includes(type.id))}
            >
              <Checkbox
                id={type.id}
                checked={selectedIds.includes(type.id)}
                onCheckedChange={(checked) => handleSelectionChange(type.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={type.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                {type.name}
              </label>
              {selectedIds.includes(type.id) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          ))}
        </div>
        {contactTypes.length === 0 && (
          <div className="p-3 text-sm text-muted-foreground text-center">
            No hay tipos de contacto disponibles
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}