import { useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, FileText } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import ModernModal from '@/components/ui/ModernModal';

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: z.enum(['draft', 'approved', 'rejected']).default('draft'),
});

type BudgetForm = z.infer<typeof budgetSchema>;

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: any; // Para edición
}

export default function CreateBudgetModal({ isOpen, onClose, budget }: CreateBudgetModalProps) {
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

  // Resetear el formulario cuando cambia el presupuesto o se abre el modal
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: budget?.name || '',
        description: budget?.description || '',
        status: budget?.status || 'draft',
      });
    }
  }, [budget, isOpen, form]);

  const budgetMutation = useMutation({
    mutationFn: async (data: BudgetForm) => {
      if (!projectId) throw new Error('No hay proyecto seleccionado');
      
      if (budget?.id) {
        // Editar presupuesto existente
        const { data: updatedBudget, error } = await supabase
          .from('budgets')
          .update({
            name: data.name,
            description: data.description || null,
            status: data.status,
          })
          .eq('id', budget.id)
          .select()
          .single();

        if (error) throw error;
        return updatedBudget;
      } else {
        // Crear nuevo presupuesto
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
          project_id: projectId, // Mantener como UUID string
          organization_id: organizationId,
          created_by: userId,
          status: data.status || 'draft'
        };

        console.log('Creating budget with data:', budgetData);

        const { data: newBudget, error } = await supabase
          .from('budgets')
          .insert([budgetData])
          .select()
          .single();

        if (error) {
          console.error('Supabase error creating budget:', error);
          throw error;
        }

        return newBudget;
      }
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con presupuestos
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['/api/budgets', projectId] });
        queryClient.invalidateQueries({ queryKey: ['budgets', projectId] });
      }
      
      toast({
        description: budget?.id ? "Presupuesto actualizado correctamente" : "Presupuesto creado correctamente",
        duration: 2000,
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error with budget:', error);
      toast({
        variant: 'destructive',
        description: budget?.id ? "Error al actualizar el presupuesto" : "Error al crear el presupuesto",
        duration: 2000,
      });
    },
  });

  const onSubmit = (data: BudgetForm) => {
    console.log('Form data being submitted:', data);
    budgetMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={budget?.id ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}
      subtitle={budget?.id ? 'Modifica los datos del presupuesto existente' : 'Crea un nuevo presupuesto para el proyecto actual'}
      icon={FileText}
      footer={
        <div className="flex gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={budgetMutation.isPending}
            className="w-1/4 bg-transparent border-[#919191]/30 text-foreground hover:bg-[#d0d0d0] rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={budgetMutation.isPending}
            className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            {budgetMutation.isPending ? 'Guardando...' : (budget?.id ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Campo del proyecto activo (bloqueado) */}
          <FormItem>
            <FormLabel className="text-xs font-medium text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Proyecto
            </FormLabel>
            <FormControl>
              <Input
                value={currentProject?.name || 'Cargando...'}
                disabled
                className="bg-muted cursor-not-allowed rounded-lg"
              />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Nombre del Presupuesto <span className="text-primary">*</span></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Presupuesto General de Obra"
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
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
                <FormLabel className="text-xs font-medium text-foreground">Descripción (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción del presupuesto..."
                    rows={3}
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {budget?.id && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">Estado <span className="text-primary">*</span></FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || 'draft'}
                    defaultValue="draft"
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
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
          )}
        </div>
      </Form>
    </ModernModal>
  );
}