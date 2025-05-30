import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { unitsService } from '@/lib/unitsService';

const unitFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
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
      description: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      return unitsService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/units'] });
      toast({
        title: "Unidad creada",
        description: "La unidad se ha creado exitosamente.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear la unidad: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      return unitsService.update(unit.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/units'] });
      toast({
        title: "Unidad actualizada",
        description: "La unidad se ha actualizada exitosamente.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar la unidad: ${error.message}`,
        variant: "destructive",
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

  useEffect(() => {
    if (isOpen) {
      if (isEditing && unit) {
        form.reset({
          name: unit.name || '',
          description: unit.description || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
        });
      }
    }
  }, [isOpen, isEditing, unit, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#e0e0e0] border-0 rounded-2xl shadow-2xl p-0 gap-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="bg-[#e0e0e0] p-6 border-b border-[#cccccc]">
          <DialogTitle className="text-[#333333] text-xl font-semibold">
            {isEditing ? 'Editar Unidad' : 'Nueva Unidad'}
          </DialogTitle>
          <DialogDescription className="text-[#666666] text-sm">
            {isEditing 
              ? 'Modifica los datos de la unidad de medida'
              : 'Crea una nueva unidad de medida en el sistema'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#333333]">Nombre de la Unidad</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Metro, Kilogramo, Litro"
                        className="bg-[#d2d2d2] border-[#cccccc] text-[#333333] placeholder:text-[#666666]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#333333]">Descripción</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descripción de la unidad de medida"
                        className="bg-[#d2d2d2] border-[#cccccc] text-[#333333] placeholder:text-[#666666]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="bg-[#e0e0e0] p-6 border-t border-[#cccccc] gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="bg-[#d2d2d2] border-[#cccccc] text-[#666666] hover:bg-[#cccccc] hover:text-[#333333]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#8fc700] hover:bg-[#7eb600] text-white"
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Guardando...' 
                  : isEditing ? 'Actualizar' : 'Crear'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}