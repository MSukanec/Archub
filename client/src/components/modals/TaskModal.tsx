import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';

const taskSchema = z.object({
  task_id: z.string().min(1, 'Debes seleccionar una tarea'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  unit_price: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0').optional(),
  notes: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

interface TaskModalProps {
  budgetId: number | null;
  task?: any; // Para edición
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ budgetId, task, isOpen, onClose }: TaskModalProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!task;

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      task_id: '',
      quantity: 1,
      unit_price: 0,
      notes: '',
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task && isEditing) {
      form.reset({
        task_id: task.task_id || '',
        quantity: task.quantity || 1,
        unit_price: task.unit_price || 0,
        notes: task.notes || '',
      });
    } else {
      form.reset({
        task_id: '',
        quantity: 1,
        unit_price: 0,
        notes: '',
      });
    }
  }, [task, isEditing, form]);

  // Fetch available tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      console.log('Fetching tasks for organization:', organizationId);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      console.log('Tasks fetched:', data);
      return data;
    },
    enabled: !!organizationId && isOpen,
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (data: TaskForm) => {
      if (!budgetId) throw new Error('No hay presupuesto seleccionado');
      
      const taskData = {
        budget_id: budgetId,
        task_id: data.task_id,
        quantity: data.quantity,
        unit_price: data.unit_price || 0,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && task?.id) {
        // Actualizar tarea existente
        const { data: updatedTask, error } = await supabase
          .from('budget_tasks')
          .update(taskData)
          .eq('id', task.id)
          .select()
          .single();

        if (error) throw error;
        return updatedTask;
      } else {
        // Crear nueva tarea
        const createData = {
          ...taskData,
          created_at: new Date().toISOString(),
        };

        const { data: newTask, error } = await supabase
          .from('budget_tasks')
          .insert(createData)
          .select()
          .single();

        if (error) throw error;
        return newTask;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget-tasks', budgetId] });
      toast({
        title: isEditing ? "Tarea actualizada" : "Tarea agregada",
        description: isEditing 
          ? "La tarea se ha actualizado correctamente." 
          : "La tarea se ha agregado al presupuesto correctamente.",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      console.error('Error al guardar tarea:', error);
      toast({
        title: "Error",
        description: `No se pudo ${isEditing ? 'actualizar' : 'agregar'} la tarea. Intenta nuevamente.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskForm) => {
    console.log('Form data being submitted:', data);
    saveTaskMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="fixed inset-0 z-[9999] bg-[#e0e0e0] p-0 m-0 max-w-none h-full w-full flex items-center justify-center"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-[#e0e0e0] w-full max-w-lg mx-auto p-6 rounded-lg shadow-lg">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {isEditing ? 'Editar Tarea' : 'Agregar Tarea al Presupuesto'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {isEditing 
                ? 'Modifica los datos de la tarea en el presupuesto'
                : 'Selecciona una tarea y especifica la cantidad para agregar al presupuesto'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-2">
              <FormField
                control={form.control}
                name="task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Tarea <span className="text-primary">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#d2d2d2] border-gray-300 focus:ring-primary focus:border-primary">
                          <SelectValue placeholder="Seleccionar tarea" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tasks.map((task: any) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.name} - {task.unit || 'unidad'}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Cantidad <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1.00"
                        className="bg-[#d2d2d2] border-gray-300 focus:ring-primary focus:border-primary"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Precio Unitario (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="bg-[#d2d2d2] border-gray-300 focus:ring-primary focus:border-primary"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Notas adicionales sobre esta tarea..."
                        className="bg-[#d2d2d2] border-gray-300 focus:ring-primary focus:border-primary resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-center gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="px-6 py-2 bg-white border-gray-300 hover:bg-gray-50"
                  disabled={saveTaskMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-white min-w-[120px]"
                  disabled={saveTaskMutation.isPending}
                >
                  {saveTaskMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Actualizando...' : 'Agregando...'}
                    </>
                  ) : (
                    isEditing ? 'Actualizar Tarea' : 'Agregar Tarea'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}