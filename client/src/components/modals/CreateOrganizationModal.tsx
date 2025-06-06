import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Building2, Info, MapPin } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import ModernModal, { ModalAccordion, useModalAccordion } from '../components/ui/ModernModal';

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateOrganizationModal({ isOpen, onClose }: CreateOrganizationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { openAccordion, toggleAccordion, isOpen: isAccordionOpen } = useModalAccordion('general');

  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationFormData) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      // Obtener el usuario interno
      const { data: internalUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError || !internalUser) {
        throw new Error('Usuario interno no encontrado');
      }

      // Crear la organización
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: data.name,
          description: data.description || null,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          owner_id: internalUser.id,
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // Crear el member record para el owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: organization.id,
          user_id: internalUser.id,
          role: 'owner',
          status: 'active'
        }]);

      if (memberError) throw memberError;

      // Actualizar las preferencias del usuario con la nueva organización
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .update({ 
          last_organization_id: organization.id,
          last_project_id: null,
          last_budget_id: null
        })
        .eq('user_id', internalUser.id);

      if (prefsError) throw prefsError;

      return organization;
    },
    onSuccess: (organization) => {
      toast({
        title: 'Organización creada',
        description: `${organization.name} ha sido creada exitosamente.`,
      });
      
      // Invalidar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      
      form.reset();
      onClose();
      
      // Recargar la página para actualizar el contexto
      window.location.reload();
    },
    onError: (error) => {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al crear la organización. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: CreateOrganizationFormData) => {
    createOrganizationMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nueva Organización"
      subtitle="Gestiona los equipos de construcción"
      icon={Building2}
      confirmText="Crear Organización"
      onConfirm={form.handleSubmit(handleSubmit)}
      isLoading={createOrganizationMutation.isPending}
    >
      <Form {...form}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Información General */}
          <ModalAccordion
            id="general"
            title="Información General"
            subtitle="Datos básicos de la organización"
            icon={Info}
            isOpen={isAccordionOpen('general')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Nombre de la Organización *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Constructora ABC S.A."
                        {...field}
                        className="bg-input border-surface-primary text-white placeholder:text-muted-foreground"
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
                        placeholder="Describe el tipo de organización o su enfoque..."
                        {...field}
                        className="min-h-[80px] bg-input border-surface-primary text-white placeholder:text-muted-foreground resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>

          {/* Información de Contacto */}
          <ModalAccordion
            id="contact"
            title="Información de Contacto"
            subtitle="Datos de contacto de la organización"
            icon={MapPin}
            isOpen={isAccordionOpen('contact')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Dirección</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dirección de la oficina principal"
                        {...field}
                        className="bg-input border-surface-primary text-white placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: +54 11 1234-5678"
                        {...field}
                        className="bg-input border-surface-primary text-white placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contacto@empresa.com"
                        {...field}
                        className="bg-input border-surface-primary text-white placeholder:text-muted-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>
        </div>
      </Form>
    </ModernModal>
  );
}