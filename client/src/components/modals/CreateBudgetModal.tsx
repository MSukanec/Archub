import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: z.string().default('draft'),
});

type BudgetForm = z.infer<typeof budgetSchema>;

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBudgetModal({ isOpen, onClose }: CreateBudgetModalProps) {
  const { projectId, organizationId } = useUserContextStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get internal user ID from the users table
  const { data: internalUser } = useQuery({
    queryKey: ['/api/internal-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get current project data
  const { data: currentProject } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetForm) => {
      if (!projectId) throw new Error('No hay proyecto seleccionado');
      if (!organizationId) throw new Error('No hay organización seleccionada');
      if (!user?.id) throw new Error('Usuario no autenticado');
      
      // Intentar obtener el usuario interno
      let userId = internalUser?.id;
      if (!userId) {
        // Si no existe el usuario interno, intentar obtenerlo de la base de datos
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (userError || !userData) {
          throw new Error('No se pudo encontrar el usuario en la base de datos. Por favor, contacta al administrador.');
        }
        
        userId = userData.id;
      }
      
      // Crear objeto simplificado con solo los campos esenciales
      const budgetData = {
        name: data.name,
        description: data.description || null,
        project_id: Number(projectId),
        organization_id: organizationId,
        created_by: userId,
        status: data.status || 'draft'
      };

      console.log('Creating budget with data:', budgetData);

      const { data: budget, error } = await supabase
        .from('budgets')
        .insert([budgetData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating budget:', error);
        throw error;
      }

      return budget;
    },
    onSuccess: () => {
      toast({
        title: 'Presupuesto creado',
        description: 'El presupuesto se ha creado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error al crear presupuesto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el presupuesto. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BudgetForm) => {
    console.log('Form data being submitted:', data);
    createBudgetMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
          <DialogDescription>
            Crea un nuevo presupuesto para el proyecto actual
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.handleSubmit(onSubmit)();
              }
            }}
          >
            {/* Campo del proyecto activo (bloqueado) */}
            <FormItem>
              <FormLabel>Proyecto</FormLabel>
              <FormControl>
                <Input
                  value={currentProject?.name || 'Cargando...'}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Presupuesto *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Presupuesto General de Obra"
                      {...field}
                    />
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
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createBudgetMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createBudgetMutation.isPending}
              >
                {createBudgetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Presupuesto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}