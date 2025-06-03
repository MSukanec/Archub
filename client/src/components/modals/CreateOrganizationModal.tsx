import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  taxId: z.string().optional(),
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
  const { organizationId } = useUserContextStore();

  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxId: '',
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
        throw new Error('No se pudo obtener la información del usuario');
      }

      // Crear la organización
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description || null,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          tax_id: data.taxId || null,
          owner_id: internalUser.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Actualizar las preferencias del usuario para usar la nueva organización
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organization.id })
        .eq('user_id', internalUser.id);

      if (prefsError) {
        console.error('Error updating user preferences:', prefsError);
      }

      return organization;
    },
    onSuccess: (organization) => {
      toast({
        title: 'Organización creada',
        description: `${organization.name} ha sido creada exitosamente.`,
      });
      
      // Actualizar el contexto del usuario con la nueva organización
      switchOrganization(organization.id);
      
      // Invalidar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      
      form.reset();
      onClose();
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
    setActiveAccordion('basic');
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nueva Organización"
      subtitle="Crea una nueva organización para gestionar tus proyectos"
      icon={Building2}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <ModalAccordion
              title="Información Básica"
              icon={Building2}
              isOpen={activeAccordion === 'basic'}
              onToggle={() => setActiveAccordion(activeAccordion === 'basic' ? null : 'basic')}
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Organización *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Constructora ABC S.A."
                          {...field}
                          className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Breve descripción de la organización..."
                          {...field}
                          className="min-h-[80px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT/CUIT/NIT</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 12.345.678-9"
                          {...field}
                          className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ModalAccordion>

            <ModalAccordion
              title="Información de Contacto"
              icon={Users}
              isOpen={activeAccordion === 'contact'}
              onToggle={() => setActiveAccordion(activeAccordion === 'contact' ? null : 'contact')}
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Dirección
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dirección completa de la organización..."
                          {...field}
                          className="min-h-[80px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Teléfono
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: +54 11 1234-5678"
                            {...field}
                            className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contacto@empresa.com"
                            {...field}
                            className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Sitio Web
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.empresa.com"
                          {...field}
                          className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ModalAccordion>
          </div>

          <ModalFooter
            confirmText="Crear Organización"
            onConfirm={() => form.handleSubmit(handleSubmit)()}
            isLoading={createOrganizationMutation.isPending}
          />
        </form>
      </Form>
    </ModernModal>
  );
}