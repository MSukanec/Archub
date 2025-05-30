import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { materialCategoriesService, type MaterialCategory, type CreateMaterialCategoryData } from '@/lib/materialCategoriesService';

const materialCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});

interface AdminMaterialCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: MaterialCategory | null;
}

export default function AdminMaterialCategoriesModal({ isOpen, onClose, category }: AdminMaterialCategoriesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateMaterialCategoryData>({
    resolver: zodResolver(materialCategorySchema),
    defaultValues: {
      name: '',
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [category, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialCategoryData) => materialCategoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-categories'] });
      toast({ title: 'Categoría creada exitosamente' });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error al crear categoría',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateMaterialCategoryData) => materialCategoriesService.update(category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-categories'] });
      toast({ title: 'Categoría actualizada exitosamente' });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar categoría',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: CreateMaterialCategoryData) => {
    setIsSubmitting(true);
    
    if (category) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogOverlay className="fixed inset-0 z-50 modal-backdrop" />
      <DialogContent className="fixed right-0 top-0 h-screen w-[400px] max-w-none rounded-none border-l border-border bg-[#e0e0e0] p-6 shadow-2xl data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right z-50 flex flex-col">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {category ? 'Editar Categoría' : 'Crear Nueva Categoría'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Nombre de la Categoría</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Estructurales, Acabados, etc." 
                        className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="border-t border-[#919191]/20 pt-6 mt-6">
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="bg-transparent border-[#919191] text-[#919191] hover:bg-[#919191]/10 rounded-lg"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}