import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { tasksService, Task, CreateTaskData } from '@/lib/tasksService';
import { insertTaskSchema } from '@shared/schema';
import { z } from 'zod';

const createTaskSchema = insertTaskSchema.extend({
  unit_labor_price: z.string().min(1, 'El precio de mano de obra es requerido'),
  unit_material_price: z.string().min(1, 'El precio de material es requerido'),
});

type FormData = z.infer<typeof createTaskSchema>;

interface AdminTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

export default function AdminTasksModal({ isOpen, onClose, task }: AdminTasksModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: '',
      unit_labor_price: '',
      unit_material_price: '',
      category_id: '',
      subcategory_id: '',
      element_category_id: '',
    },
  });

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        form.reset({
          name: task.name || '',
          unit_labor_price: task.unit_labor_price?.toString() || '',
          unit_material_price: task.unit_material_price?.toString() || '',
          category_id: task.category_id?.toString() || '',
          subcategory_id: task.subcategory_id?.toString() || '',
          element_category_id: task.element_category_id?.toString() || '',
        });
      } else {
        form.reset({
          name: '',
          unit_labor_price: '',
          unit_material_price: '',
          category_id: '',
          subcategory_id: '',
          element_category_id: '',
        });
      }
    }
  }, [task, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskData) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Tarea creada exitosamente' });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error al crear tarea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateTaskData }) =>
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Tarea actualizada exitosamente' });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar tarea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const taskData: CreateTaskData = {
      name: data.name,
      unit_labor_price: parseFloat(data.unit_labor_price),
      unit_material_price: parseFloat(data.unit_material_price),
      category_id: data.category_id ? parseInt(data.category_id) : null,
      subcategory_id: data.subcategory_id ? parseInt(data.subcategory_id) : null,
      element_category_id: data.element_category_id ? parseInt(data.element_category_id) : null,
    };

    if (task) {
      updateMutation.mutate({ id: task.id, data: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Excavación manual" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit_labor_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Mano de Obra *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_material_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Material *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {/* Add category options here when categories are available */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoría</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin subcategoría</SelectItem>
                          {/* Add subcategory options here when subcategories are available */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="element_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Elemento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin elemento</SelectItem>
                          {/* Add element options here when elements are available */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : task ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}