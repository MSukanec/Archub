import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { unitsService } from '@/lib/unitsService';

const unitFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  symbol: z.string().min(1, 'El símbolo es requerido'),
  type: z.string().min(1, 'El tipo es requerido'),
  is_active: z.boolean().default(true),
});

type UnitFormData = z.infer<typeof unitFormSchema>;

interface AdminUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit?: any; // Para edición
}

export default function AdminUnitsModal({ 
  isOpen, 
  onClose, 
  unit 
}: AdminUnitsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!unit;

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: '',
      symbol: '',
      type: '',
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      return unitsService.create({
        name: data.name,
        symbol: data.symbol,
        type: data.type,
        is_active: data.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      toast({
        title: 'Unidad creada',
        description: 'La unidad se ha creado exitosamente.',
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating unit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la unidad. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      return unitsService.update(unit.id, {
        name: data.name,
        symbol: data.symbol,
        type: data.type,
        is_active: data.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      toast({
        title: 'Unidad actualizada',
        description: 'La unidad se ha actualizado exitosamente.',
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating unit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la unidad. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UnitFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Update form when unit prop changes
  useEffect(() => {
    if (unit) {
      form.reset({
        name: unit.name || '',
        symbol: unit.symbol || '',
        type: unit.type || '',
        is_active: unit.is_active ?? true,
      });
    } else {
      form.reset({
        name: '',
        symbol: '',
        type: '',
        is_active: true,
      });
    }
  }, [unit, form]);

  const unitTypes = [
    { value: 'length', label: 'Longitud' },
    { value: 'area', label: 'Área' },
    { value: 'volume', label: 'Volumen' },
    { value: 'weight', label: 'Peso' },
    { value: 'quantity', label: 'Cantidad' },
    { value: 'time', label: 'Tiempo' },
    { value: 'other', label: 'Otro' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Unidad' : 'Nueva Unidad'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la unidad'
              : 'Crea una nueva unidad de medida en el sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Unidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Metro, Kilogramo, Litro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Símbolo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: m, kg, L"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#4f9eff] hover:bg-[#3a8bef]"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : (isEditing ? 'Actualizar' : 'Crear')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}