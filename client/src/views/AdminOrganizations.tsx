import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertOrganizationSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { organizationsService } from '@/lib/organizationsService';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const organizationFormSchema = insertOrganizationSchema.pick({
  name: true,
}).extend({
  slug: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationFormSchema>;

export default function AdminOrganizations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsService.getAll,
  });

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      return organizationsService.create({
        ...data,
        owner_id: 1, // TODO: Get actual user ID from auth
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organización creada',
        description: 'La organización ha sido creada exitosamente',
      });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      return organizationsService.update(selectedOrganization.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organización actualizada',
        description: 'La organización ha sido actualizada exitosamente',
      });
      setIsEditModalOpen(false);
      setSelectedOrganization(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return organizationsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organización eliminada',
        description: 'La organización ha sido eliminada exitosamente',
      });
      setIsDeleteDialogOpen(false);
      setSelectedOrganization(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (organization: any) => {
    setSelectedOrganization(organization);
    form.reset({
      name: organization.name,
      slug: organization.slug || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (organization: any) => {
    setSelectedOrganization(organization);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = (data: OrganizationFormData) => {
    if (isEditModalOpen) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <AdminOrganizationsSkeleton />;
  }

  const filteredOrganizations = (organizations || []).filter((org: any) =>
    org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.slug && org.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Gestión de Organizaciones
            </h1>
            <p className="text-muted-foreground">
              Administra todas las organizaciones del sistema.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            Nueva Organización
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Buscar organizaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredOrganizations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                {searchQuery ? 'No se encontraron organizaciones' : 'No hay organizaciones'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery 
                  ? 'Intenta con un término de búsqueda diferente.'
                  : 'Comienza creando la primera organización del sistema.'
                }
              </p>
              {!searchQuery && (
                <Button 
                  className="mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={16} className="mr-2" />
                  Crear Organización
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org: any) => (
              <Card key={org.id} className="hover:border-border/60 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <Building className="mr-2 text-primary" size={20} />
                      {org.name}
                    </CardTitle>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(org)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(org)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {org.description || 'Sin descripción'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users size={14} className="mr-1" />
                      {org.memberCount || 0} miembros
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar size={14} className="mr-1" />
                      {new Date(org.createdAt).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {org.projectCount || 0} proyectos
                    </Badge>
                    <Badge variant={org.ownerId ? "default" : "secondary"}>
                      {org.ownerName || 'Sin propietario'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedOrganization(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? 'Editar Organización' : 'Nueva Organización'}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen 
                ? 'Modifica la información de la organización'
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
                      <Input 
                        placeholder="Ej. Constructora del Norte"
                        {...field} 
                      />
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
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedOrganization(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    'Guardando...'
                  ) : (
                    isEditModalOpen ? 'Actualizar' : 'Crear'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la organización
              "{selectedOrganization?.name}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedOrganization.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AdminOrganizationsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}