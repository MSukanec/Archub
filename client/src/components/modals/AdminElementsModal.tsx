import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Shapes } from 'lucide-react';
import ModernModal from '../../components/ui/ModernModal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

const elementSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
});

type ElementFormData = z.infer<typeof elementSchema>;

interface AdminElementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  element?: any | null;
}

export default function AdminElementsModal({ 
  isOpen, 
  onClose, 
  element 
}: AdminElementsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ElementFormData>({
    resolver: zodResolver(elementSchema),
    defaultValues: {
      name: '',
    },
  });

  // Reset form when element changes or modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: element?.name || '',
      });
    }
  }, [element, isOpen, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ElementFormData) => {
      const { data: result, error } = await supabase
        .from('task_elements')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elements'] });
      toast({
        title: "Elemento creado",
        description: "El elemento se ha creado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el elemento.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ElementFormData) => {
      const { data: result, error } = await supabase
        .from('task_elements')
        .update(data)
        .eq('id', element!.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elements'] });
      toast({
        title: "Elemento actualizado",
        description: "El elemento se ha actualizado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el elemento.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: ElementFormData) => {
    setIsSubmitting(true);
    
    if (element) {
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
        form="element-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (element ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={element ? 'Editar Elemento' : 'Nuevo Elemento'}
      subtitle="Gestiona los elementos utilizados en las tareas"
      icon={Shapes}
      footer={footer}
    >
      <Form {...form}>
        <form id="element-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Nombre</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Columna, Viga, etc."
                    className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
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