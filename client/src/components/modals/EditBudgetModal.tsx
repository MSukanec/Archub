import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: z.enum(['draft', 'approved', 'rejected']),
});

type BudgetForm = z.infer<typeof budgetSchema>;

interface EditBudgetModalProps {
  budget: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditBudgetModal({ budget, isOpen, onClose }: EditBudgetModalProps) {
  const { projectId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
    },
  });

  // Reset form when budget changes
  useEffect(() => {
    if (budget) {
      form.reset({
        name: budget.name || '',
        description: budget.description || '',
        status: budget.status || 'draft',
      });
    }
  }, [budget, form]);

  const updateBudgetMutation = useMutation({
    mutationFn: async (data: BudgetForm) => {
      if (!budget?.id) throw new Error('No hay presupuesto seleccionado');
      
      const budgetData = {
        name: data.name,
        description: data.description || null,
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      console.log('Updating budget with data:', budgetData);

      const { data: updatedBudget, error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', budget.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating budget:', error);
        throw error;
      }

      return updatedBudget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets', projectId] });
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto se ha actualizado correctamente.",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      console.error('Error al actualizar presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el presupuesto. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetForm) => {
    console.log('Form data being submitted:', data);
    updateBudgetMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Presupuesto</DialogTitle>
          <DialogDescription>
            Modifica los datos del presupuesto existente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Presupuesto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Presupuesto General de Obra" {...field} />
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción del presupuesto..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || 'draft'}
                    defaultValue="draft"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleClose}
                disabled={updateBudgetMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={updateBudgetMutation.isPending}
              >
                {updateBudgetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Actualizar Presupuesto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}