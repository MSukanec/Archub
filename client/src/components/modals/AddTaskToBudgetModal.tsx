import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';

const taskToBudgetSchema = z.object({
  task_id: z.string().min(1, 'Selecciona una tarea'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  unit_price: z.number().min(0, 'El precio unitario no puede ser negativo'),
});

type TaskToBudgetForm = z.infer<typeof taskToBudgetSchema>;

interface AddTaskToBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: number | null;
}

export default function AddTaskToBudgetModal({ isOpen, onClose, budgetId }: AddTaskToBudgetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskToBudgetForm>({
    resolver: zodResolver(taskToBudgetSchema),
    defaultValues: {
      task_id: '',
      quantity: 1,
      unit_price: 0,
    },
  });

  // Fetch available tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const addTaskToBudgetMutation = useMutation({
    mutationFn: async (data: TaskToBudgetForm) => {
      if (!budgetId) throw new Error('No hay presupuesto seleccionado');
      
      const taskData = {
        budget_id: budgetId,
        task_id: data.task_id,
        quantity: data.quantity,
        unit_price: data.unit_price,
        subtotal: data.quantity * data.unit_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Adding task to budget with data:', taskData);

      const { data: budgetTask, error } = await supabase
        .from('budget_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding task to budget:', error);
        throw error;
      }

      return budgetTask;
    },
    onSuccess: () => {
      toast({
        title: 'Tarea agregada',
        description: 'La tarea se ha agregado al presupuesto exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budget-tasks'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error al agregar tarea al presupuesto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar la tarea al presupuesto. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TaskToBudgetForm) => {
    console.log('Form data being submitted:', data);
    addTaskToBudgetMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const watchedTaskId = form.watch('task_id');
  const selectedTask = tasks.find((task: any) => task.id === watchedTaskId);

  // Auto-fill unit price when task is selected
  useState(() => {
    if (selectedTask?.unit_price) {
      form.setValue('unit_price', selectedTask.unit_price);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Tarea al Presupuesto</DialogTitle>
          <DialogDescription>
            Selecciona una tarea y define la cantidad para agregarla al presupuesto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="task_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarea *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una tarea" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tasks.map((task: any) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.name}
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
                  <FormLabel>Cantidad *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="1.00"
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
                  <FormLabel>Precio Unitario *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('quantity') > 0 && form.watch('unit_price') > 0 && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">
                  Subtotal: ${(form.watch('quantity') * form.watch('unit_price')).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={addTaskToBudgetMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addTaskToBudgetMutation.isPending || !budgetId}
              >
                {addTaskToBudgetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Agregar Tarea
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}