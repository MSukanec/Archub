import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { materialCategoriesService, type MaterialCategory, type CreateMaterialCategoryData } from '@/lib/materialCategoriesService';
import { FolderOpen } from 'lucide-react';

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

  // Set form values when editing or reset when creating new
  useEffect(() => {
    if (isOpen) {
      if (category) {
        form.reset({
          name: category.name,
        });
      } else {
        form.reset({
          name: '',
        });
      }
    }
  }, [category, form, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialCategoryData) => materialCategoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-categories'] });
      toast({ title: 'Categoría creada exitosamente' });
      onClose();
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

  const footer = (
    <div className="flex gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isSubmitting}
        className="w-1/4 bg-transparent border-input text-foreground hover:bg-surface-secondary rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="category-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (category ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={category ? 'Editar Categoría' : 'Crear Nueva Categoría'}
      subtitle="Organiza los materiales en categorías del sistema"
      icon={FolderOpen}
      footer={footer}
    >
      <Form {...form}>
        <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Nombre de la Categoría</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Estructurales, Acabados, etc." 
                    className="bg-[#d2d2d2] border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ModernModal>
  );
}