import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tasksService, Task, CreateTaskData } from '@/lib/tasksService';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const createTaskSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  unit_labor_price: z.string().optional(),
  unit_material_price: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  element_category_id: z.string().optional(),
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

  // Fetch categories for the select dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/task-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskData) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Tarea creada",
        description: "La tarea ha sido creada exitosamente.",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la tarea.",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTaskData> }) =>
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada exitosamente.",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la tarea.",
      });
    }
  });

  useEffect(() => {
    if (task && isOpen) {
      form.reset({
        name: task.name || '',
        unit_labor_price: task.unit_labor_price?.toString() || '',
        unit_material_price: task.unit_material_price?.toString() || '',
        category_id: task.category_id?.toString() || '',
        subcategory_id: task.subcategory_id?.toString() || '',
        element_category_id: task.element_category_id?.toString() || '',
      });
    } else if (!task && isOpen) {
      form.reset({
        name: '',
        unit_labor_price: '',
        unit_material_price: '',
        category_id: '',
        subcategory_id: '',
        element_category_id: '',
      });
    }
  }, [task, isOpen, form]);

  const onSubmit = (data: FormData) => {
    const taskData: CreateTaskData = {
      name: data.name,
      unit_labor_price: data.unit_labor_price ? parseFloat(data.unit_labor_price) : undefined,
      unit_material_price: data.unit_material_price ? parseFloat(data.unit_material_price) : undefined,
      category_id: data.category_id ? parseInt(data.category_id) : undefined,
      subcategory_id: data.subcategory_id ? parseInt(data.subcategory_id) : undefined,
      element_category_id: data.element_category_id ? parseInt(data.element_category_id) : undefined,
    };

    if (task) {
      updateMutation.mutate({ id: task.id, data: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Modifica los datos de la tarea.' : 'Crea una nueva tarea en el sistema.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre de la Tarea *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Excavación de zanjas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin categoría</SelectItem>
                        {categories.map((category) => (
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

              <FormField
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar subcategoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin subcategoría</SelectItem>
                        {categories.map((category) => (
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

              <FormField
                control={form.control}
                name="element_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elemento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar elemento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin elemento</SelectItem>
                        {categories.map((category) => (
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
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Actualizar' : 'Crear'} Tarea
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}