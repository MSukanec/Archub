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
import { elementsService } from '@/lib/elementsService';

const elementFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
});

type ElementFormData = z.infer<typeof elementFormSchema>;

interface AdminElementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  element?: any; // Para edición
}

export default function AdminElementsModal({ 
  isOpen, 
  onClose, 
  element 
}: AdminElementsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!element;

  const form = useForm<ElementFormData>({
    resolver: zodResolver(elementFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ElementFormData) => {
      return elementsService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/elements'] });
      toast({
        title: "Elemento creado",
        description: "El elemento se ha creado exitosamente.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear el elemento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ElementFormData) => {
      if (!element?.id) throw new Error('ID de elemento no válido');
      return elementsService.update(element.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/elements'] });
      toast({
        title: "Elemento actualizado",
        description: "El elemento se ha actualizado exitosamente.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar el elemento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ElementFormData) => {
    console.log('Form submitted with data:', data);
    console.log('isEditing:', isEditing);
    console.log('element:', element);
    
    if (isEditing && element?.id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditing && element) {
        form.reset({
          name: element.name || '',
        });
      } else {
        form.reset({
          name: '',
        });
      }
    }
  }, [isOpen, isEditing, element, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#282828] border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar Elemento' : 'Nuevo Elemento'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditing 
              ? 'Modifica los datos del elemento'
              : 'Crea un nuevo elemento en el sistema'
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
                  <FormLabel className="text-white">Nombre del Elemento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Muros, Pisos, Carpetas de Nivelación"
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