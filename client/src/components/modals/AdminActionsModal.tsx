import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { actionsService, CreateActionData } from '@/lib/actionsService';

const actionFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
});

type ActionFormData = z.infer<typeof actionFormSchema>;

interface AdminActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: any; // Para edición
}

export default function AdminActionsModal({ 
  isOpen, 
  onClose, 
  action 
}: AdminActionsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      name: action?.name || '',
      description: action?.description || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ActionFormData) => {
      return actionsService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      toast({
        title: 'Éxito',
        description: 'Acción creada correctamente',
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear la acción',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ActionFormData) => {
      return actionsService.update(action.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      toast({
        title: 'Éxito',
        description: 'Acción actualizada correctamente',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar la acción',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ActionFormData) => {
    if (action) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {action ? 'Editar Acción' : 'Nueva Acción'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la acción" {...field} />
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
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción de la acción"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Guardando...' 
                  : action ? 'Actualizar' : 'Crear'
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}