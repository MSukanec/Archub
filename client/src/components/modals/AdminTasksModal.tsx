import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { tasksService, Task, CreateTaskData } from '@/lib/tasksService';
import { insertTaskSchema } from '@shared/schema';
import { supabase } from '@/lib/supabase';
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

interface TaskCategory {
  id: number;
  name: string;
  parent_id: number | null;
  position: number;
}

export default function AdminTasksModal({ isOpen, onClose, task }: AdminTasksModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');

  // Fetch task categories from Supabase
  const { data: allCategories = [] } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('position');
      
      if (error) throw error;
      return data as TaskCategory[];
    },
    enabled: isOpen,
  });

  // Filter categories by hierarchy
  const parentCategories = allCategories.filter(cat => cat.parent_id === null);
  const getSubcategories = (parentId: string) => 
    allCategories.filter(cat => cat.parent_id === parseInt(parentId));
  const getElementCategories = (subcategoryId: string) => 
    allCategories.filter(cat => cat.parent_id === parseInt(subcategoryId));

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: '',
      unit_labor_price: '',
      unit_material_price: '',
      category_id: null,
      subcategory_id: null,
      element_category_id: null,
    },
  });

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        const categoryId = task.category_id?.toString() || '';
        const subcategoryId = task.subcategory_id?.toString() || '';
        
        setSelectedCategoryId(categoryId);
        setSelectedSubcategoryId(subcategoryId);
        
        form.reset({
          name: task.name || '',
          unit_labor_price: task.unit_labor_price?.toString() || '',
          unit_material_price: task.unit_material_price?.toString() || '',
          category_id: task.category_id,
          subcategory_id: task.subcategory_id,
          element_category_id: task.element_category_id,
        });
      } else {
        setSelectedCategoryId('');
        setSelectedSubcategoryId('');
        form.reset({
          name: '',
          unit_labor_price: '',
          unit_material_price: '',
          category_id: null,
          subcategory_id: null,
          element_category_id: null,
        });
      }
    }
  }, [isOpen, task, form]);

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setSelectedSubcategoryId('');
    form.setValue('category_id', value === 'none' ? null : parseInt(value));
    form.setValue('subcategory_id', null);
    form.setValue('element_category_id', null);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategoryId(value);
    form.setValue('subcategory_id', value === 'none' ? null : parseInt(value));
    form.setValue('element_category_id', null);
  };

  // Handle element category change
  const handleElementCategoryChange = (value: string) => {
    form.setValue('element_category_id', value === 'none' ? null : parseInt(value));
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskData) => tasksService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Éxito",
        description: "Tarea creada correctamente",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la tarea",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<CreateTaskData> }) => 
      tasksService.updateTask(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Éxito",
        description: "Tarea actualizada correctamente",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const taskData = {
      name: data.name,
      unit_labor_price: parseFloat(data.unit_labor_price),
      unit_material_price: parseFloat(data.unit_material_price),
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      element_category_id: data.element_category_id,
    };

    if (task) {
      updateMutation.mutate({ id: task.id, updates: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const subcategories = selectedCategoryId ? getSubcategories(selectedCategoryId) : [];
  const elementCategories = selectedSubcategoryId ? getElementCategories(selectedSubcategoryId) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Categories */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400">Categorización</h3>
                
                {/* Category */}
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rubro</FormLabel>
                      <Select
                        value={selectedCategoryId || "none"}
                        onValueChange={handleCategoryChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rubro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin rubro</SelectItem>
                          {parentCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subcategory */}
                <FormField
                  control={form.control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subrubro</FormLabel>
                      <Select
                        value={selectedSubcategoryId || "none"}
                        onValueChange={handleSubcategoryChange}
                        disabled={!selectedCategoryId || selectedCategoryId === 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar subrubro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin subrubro</SelectItem>
                          {subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Element Category */}
                <FormField
                  control={form.control}
                  name="element_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Elemento</FormLabel>
                      <Select
                        onValueChange={handleElementCategoryChange}
                        disabled={!selectedSubcategoryId || selectedSubcategoryId === 'none'}
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar elemento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin elemento</SelectItem>
                          {elementCategories.map((element) => (
                            <SelectItem key={element.id} value={element.id.toString()}>
                              {element.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column - Task Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400">Detalles de la Tarea</h3>
                
                {/* Task Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Tarea</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ingresa el nombre de la tarea" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Labor Price */}
                <FormField
                  control={form.control}
                  name="unit_labor_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Mano de Obra</FormLabel>
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

                {/* Material Price */}
                <FormField
                  control={form.control}
                  name="unit_material_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Material</FormLabel>
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
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : task
                  ? 'Actualizar'
                  : 'Crear Tarea'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}