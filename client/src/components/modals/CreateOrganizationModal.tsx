import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Nueva Organización
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dirección completa de la organización..."
                      {...field}
                      className="min-h-[60px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 resize-none"
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
                    <FormLabel>Teléfono</FormLabel>
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
                    <FormLabel>Email</FormLabel>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createOrganizationMutation.isPending}
                className="bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#919191] border-[#919191]/20 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createOrganizationMutation.isPending}
                className="bg-[#4f9eff] hover:bg-[#3d8bef] text-white border-[#4f9eff] rounded-xl"
              >
                {createOrganizationMutation.isPending ? 'Creando...' : 'Crear Organización'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}