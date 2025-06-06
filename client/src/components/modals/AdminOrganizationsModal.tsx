import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { organizationsService } from '../../lib/organizationsService';
import { usersService } from '../../lib/usersService';

const organizationFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().optional(),
  owner_id: z.string().min(1, 'Debe seleccionar un propietario'),
});

type OrganizationFormData = z.infer<typeof organizationFormSchema>;

interface AdminOrganizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization?: any; // Para edición
}

export default function AdminOrganizationsModal({ 
  isOpen, 
  onClose, 
  organization 
}: AdminOrganizationsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!organization;

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      owner_id: '',
    },
  });

  // Fetch users for the owner selector
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => usersService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      return organizationsService.create({
        name: data.name,
        slug: data.slug || null,
        owner_id: data.owner_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: 'Organización creada',
        description: 'La organización se ha creado exitosamente.',
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la organización. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      return organizationsService.update(organization.id, {
        name: data.name,
        slug: data.slug || null,
        owner_id: data.owner_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: 'Organización actualizada',
        description: 'La organización se ha actualizado exitosamente.',
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la organización. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OrganizationFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Update form when organization prop changes
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        slug: organization.slug || '',
        owner_id: organization.owner_id || '',
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        owner_id: '',
      });
    }
  }, [organization, form]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Organización' : 'Nueva Organización'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la organización'
              : 'Crea una nueva organización en el sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Organización</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Constructora ABC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL amigable)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="nombre-organización"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propietario</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar propietario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.full_name || user.email} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Guardando...'
                  : (isEditing ? 'Actualizar' : 'Crear')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}