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
      <DialogContent className="sm:max-w-[425px] bg-[#282828] border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar Unidad' : 'Nueva Unidad'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditing 
              ? 'Modifica los datos de la unidad de medida'
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
                  <FormLabel className="text-white">Nombre de la Unidad</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Metro, Kilogramo, Litro"
                      className="bg-[#1e1e1e] border-gray-600 text-white placeholder:text-gray-500"
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
                  <FormLabel className="text-white">Descripción</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Descripción de la unidad de medida"
                      className="bg-[#1e1e1e] border-gray-600 text-white placeholder:text-gray-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#4f9eff] hover:bg-[#3d8ce6] text-white"
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