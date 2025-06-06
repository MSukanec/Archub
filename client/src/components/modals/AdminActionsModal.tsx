import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import ModernModal from "./components/ui/ModernModal";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./components/ui/form";
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

const actionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
});

type ActionFormData = z.infer<typeof actionSchema>;

interface AdminActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: any | null;
}

export default function AdminActionsModal({ 
  isOpen, 
  onClose, 
  action 
}: AdminActionsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      name: '',
    },
  });

  // Reset form when action changes or modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: action?.name || '',
      });
    }
  }, [action, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ActionFormData) => {
      const { error } = await supabase
        .from('actions')
        .insert([{
          ...data,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/actions'] });
      toast({
        title: "Acción creada",
        description: "La acción se ha creado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la acción.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ActionFormData) => {
      const { error } = await supabase
        .from('actions')
        .update(data)
        .eq('id', action!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/actions'] });
      toast({
        title: "Acción actualizada",
        description: "La acción se ha actualizado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la acción.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: ActionFormData) => {
    setIsSubmitting(true);
    
    if (action) {
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
        form="action-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (action ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={action ? 'Editar Acción' : 'Crear Nueva Acción'}
      subtitle="Gestiona las acciones del sistema"
      icon={Zap}
      footer={footer}
    >
      <Form {...form}>
        <form id="action-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Nombre de la Acción</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Revisar Documentos" 
                    className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
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