import { useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, FileText, Info, Settings } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from '../../hooks/use-toast';
import { useUserContextStore } from '../../stores/userContextStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import ModernModal, { ModalAccordion, useModalAccordion } from "@/components/ui/ModernModal";

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
  onBudgetCreated?: (budgetId: string) => void; // Callback cuando se crea un presupuesto
}

export default function CreateBudgetModal({ isOpen, onClose, budget, onBudgetCreated }: CreateBudgetModalProps) {
  const { projectId, organizationId } = useUserContextStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openAccordion, toggleAccordion, isOpen: isAccordionOpen } = useModalAccordion('general');

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

  // Get user preferences to find the active project
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id || !internalUser?.id) return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', internalUser.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!internalUser?.id,
  });

  // Get current project data (either from context or user preferences)
  const activeProjectId = projectId || userPreferences?.last_project_id;
  
  const { data: currentProject } = useQuery({
    queryKey: ['/api/projects', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', activeProjectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeProjectId,
  });

  // Get all projects for the organization in case we need to show a selector
  const { data: availableProjects = [] } = useQuery({
    queryKey: ['/api/organization-projects', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
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
        
        // Usar el proyecto activo (desde contexto o preferencias del usuario)
        const targetProjectId = activeProjectId;
        
        if (!targetProjectId) {
          throw new Error('No hay proyecto seleccionado. Por favor selecciona o crea un proyecto primero.');
        }

        // Crear objeto simplificado con solo los campos esenciales
        const budgetData = {
          name: data.name,
          description: data.description || null,
          project_id: targetProjectId, // Usar el proyecto activo correcto
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
    onSuccess: (newBudget) => {
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
      
      // Si es un nuevo presupuesto y tenemos callback, establecerlo como activo
      if (!budget?.id && onBudgetCreated && newBudget?.id) {
        onBudgetCreated(newBudget.id);
      }
      
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
      subtitle={budget?.id ? 'Modifica los datos del presupuesto existente' : 'Gestiona los presupuestos de construcción'}
      icon={FileText}
      confirmText={budget?.id ? 'Actualizar' : 'Crear Presupuesto'}
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={budgetMutation.isPending}
    >
      <Form {...form}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Información General */}
          <ModalAccordion
            id="general"
            title="Información General"
            subtitle="Datos básicos del presupuesto"
            icon={Info}
            isOpen={isAccordionOpen('general')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              {/* Campo del proyecto */}
              <FormItem>
                <FormLabel className="text-white">
                  Proyecto <span className="text-primary">*</span>
                </FormLabel>
                <FormControl>
                  {currentProject ? (
                    <Input
                      value={currentProject.name}
                      disabled
                      className="bg-input border-surface-primary text-white cursor-not-allowed"
                    />
                  ) : availableProjects.length > 0 ? (
                    <Select 
                      value={activeProjectId || ''}
                      onValueChange={(value) => {
                        // Aquí podrías actualizar el proyecto seleccionado si fuera necesario
                      }}
                    >
                      <SelectTrigger className="bg-input border-surface-primary text-white">
                        <SelectValue placeholder="Selecciona un proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value="No hay proyectos disponibles"
                      disabled
                      className="bg-input border-surface-primary text-muted-foreground cursor-not-allowed"
                    />
                  )}
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Nombre del Presupuesto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Presupuesto General de Obra"
                        className="bg-input border-surface-primary text-white placeholder:text-muted-foreground"
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
                    <FormLabel className="text-white">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción del presupuesto..."
                        rows={3}
                        className="bg-input border-surface-primary text-white placeholder:text-muted-foreground resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>

          {/* Configuración (solo para edición) */}
          {budget?.id && (
            <ModalAccordion
              id="settings"
              title="Configuración"
              subtitle="Estado y configuraciones del presupuesto"
              icon={Settings}
              isOpen={isAccordionOpen('settings')}
              onToggle={toggleAccordion}
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Estado *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || 'draft'}
                        defaultValue="draft"
                      >
                        <FormControl>
                          <SelectTrigger className="bg-input border-surface-primary text-white">
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
              </div>
            </ModalAccordion>
          )}
        </div>
      </Form>
    </ModernModal>
  );
}