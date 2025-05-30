import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { FolderOpen } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  parent_id: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface AdminCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any | null;
}

export default function AdminCategoriesModal({ 
  isOpen, 
  onClose, 
  category 
}: AdminCategoriesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      code: '',
      parent_id: '',
    },
  });

  // Get all categories for parent selection
  const { data: allCategories = [] } = useQuery({
    queryKey: ['/api/admin/task-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Reset form when category changes or modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: category?.name || '',
        code: category?.code || '',
        parent_id: category?.parent_id || '',
      });
    }
  }, [category, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const insertData = {
        ...data,
        parent_id: data.parent_id === "none" ? null : data.parent_id || null,
      };
      
      const { error } = await supabase
        .from('task_categories')
        .insert([insertData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/task-categories'] });
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada correctamente.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const updateData = {
        ...data,
        parent_id: data.parent_id === "none" ? null : data.parent_id || null,
      };
      
      const { error } = await supabase
        .from('task_categories')
        .update(updateData)
        .eq('id', category!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/task-categories'] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada correctamente.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: CategoryFormData) => {
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
        className="w-1/4 bg-transparent border-[#919191]/30 text-foreground hover:bg-[#d0d0d0] rounded-lg"
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
      title={category ? 'Editar Categoría' : 'Nueva Categoría'}
      subtitle="Gestiona las categorías de tareas del sistema"
      icon={FolderOpen}
      footer={footer}
    >
      <Form {...form}>
        <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Nombre</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Estructura"
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Código</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: EST"
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Categoría Padre (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                      <SelectValue placeholder="Seleccionar categoría padre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                    <SelectItem value="none">Sin categoría padre</SelectItem>
                    {allCategories
                      .filter(cat => cat.id !== category?.id) // No mostrar la categoría actual
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({cat.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ModernModal>
  );
}