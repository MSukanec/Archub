import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { projectsService, Project, CreateProjectData } from '@/lib/projectsService';
import { organizationsService, Organization } from '@/lib/organizationsService';
import { contactsService, Contact } from '@/lib/contactsService';
import { supabase } from '@/lib/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userPreferencesService } from '@/lib/userPreferencesService';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  client_name: z.string().optional(),
  status: z.string().optional(),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  city: z.string().optional(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

export default function CreateProjectModal({ isOpen, onClose, project }: CreateProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { setUserContext, organizationId } = useUserContextStore();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      client_name: '',
      contact_id: undefined,
      status: 'Planificación',
      address: '',
      contact_phone: '',
      city: '',
    },
  });

  // Fetch contacts for selection
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
    enabled: isContactDialogOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Get current user's organization from context
  useEffect(() => {
    const fetchActiveOrganization = async () => {
      try {
        if (!user || !organizationId) return;

        // Get the organization details using the organizationId from context
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
          return;
        }

        if (orgData) {
          setCurrentOrganization(orgData);
        }
      } catch (error) {
        console.error('Error fetching active organization:', error);
      }
    };

    if (user && organizationId) {
      fetchActiveOrganization();
    }
  }, [user, organizationId]);

  // Reset form when project changes (for editing)
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        client_name: project.client_name || '',

        status: project.status,
        address: project.address || '',
        contact_phone: project.contact_phone || '',
        city: project.city || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        client_name: '',

        status: 'Planificación',
        address: '',
        contact_phone: '',
        city: '',
      });
    }
  }, [project, form]);

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    form.setValue('client_name', contact.name);
    // Contact ID removed from schema
    setIsContactDialogOpen(false);
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectFormData) => {
      if (project) {
        return projectsService.update(project.id, data);
      } else {
        return projectsService.create(data);
      }
    },
    onSuccess: async (createdProject) => {
      // Invalidate all project-related queries
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Force refresh of the user context data
      const { organizationId } = useUserContextStore.getState();
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: ['user-projects', organizationId] });
      }
      
      // If creating a new project, set it as current
      if (!project && user) {
        // Set as current project in user context
        setUserContext({ projectId: createdProject.id });
        console.log('New project created:', createdProject.id);
      }
      
      toast({
        title: project ? 'Proyecto actualizado' : 'Proyecto creado',
        description: project ? 'El proyecto ha sido actualizado exitosamente' : 'El proyecto ha sido creado exitosamente',
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateProjectFormData) => {
    console.log('Form submission triggered with data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Form validation state:', form.formState.isValid);
    
    // Add loading state and better error handling
    if (!data.name) {
      toast({
        title: "Error",
        description: "El nombre del proyecto es requerido",
        variant: "destructive",
      });
      return;
    }
    
    createProjectMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
          <DialogDescription>
            {project ? 'Actualiza la información del proyecto' : 'Crea un nuevo proyecto de construcción'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            {/* Campos básicos - siempre visibles */}
            <div className="space-y-4">
              {/* Organización */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium w-32 text-left flex-shrink-0">
                  Organización
                </label>
                <Input 
                  value={currentOrganization?.name || "Cargando..."}
                  disabled
                  className="bg-muted text-muted-foreground flex-1"
                />
              </div>

              {/* Nombre del Proyecto */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-4">
                      <FormLabel className="w-32 text-left flex-shrink-0">Nombre del Proyecto</FormLabel>
                      <FormControl className="flex-1">
                        <Input 
                          placeholder="Ej. Edificio Residencial Norte"
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-36" />
                  </FormItem>
                )}
              />

              {/* Cliente */}
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-4">
                      <FormLabel className="w-32 text-left flex-shrink-0">Cliente</FormLabel>
                      <FormControl className="flex-1">
                        <Input 
                          placeholder="Nombre del cliente"
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="ml-36" />
                  </FormItem>
                )}
              />
            </div>

            {/* Botón para mostrar más detalles */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="flex items-center gap-2"
              >
                {showMoreDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Menos Detalles
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Más Detalles
                  </>
                )}
              </Button>
            </div>

            {/* Campos adicionales - mostrar solo cuando showMoreDetails es true */}
            {showMoreDetails && (
              <div className="space-y-4 border-t pt-4">
                {/* Estado del Proyecto */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-4">
                        <FormLabel className="w-32 text-left flex-shrink-0">Estado del Proyecto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl className="flex-1">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Planificación">Planificación</SelectItem>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Completado">Completado</SelectItem>
                            <SelectItem value="En Pausa">En Pausa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage className="ml-36" />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-4">
                        <FormLabel className="w-32 text-left flex-shrink-0 pt-2">Descripción</FormLabel>
                        <FormControl className="flex-1">
                          <Textarea 
                            placeholder="Describe el proyecto..."
                            className="min-h-[100px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="ml-36" />
                    </FormItem>
                  )}
                />

                {/* Dirección */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-4">
                        <FormLabel className="w-32 text-left flex-shrink-0">Dirección</FormLabel>
                        <FormControl className="flex-1">
                          <Input 
                            placeholder="Dirección del proyecto"
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="ml-36" />
                    </FormItem>
                  )}
                />

                {/* Ciudad */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-4">
                        <FormLabel className="w-32 text-left flex-shrink-0">Ciudad</FormLabel>
                        <FormControl className="flex-1">
                          <Input 
                            placeholder="Ciudad"
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="ml-36" />
                    </FormItem>
                  )}
                />

                {/* Teléfono de Contacto */}
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-4">
                        <FormLabel className="w-32 text-left flex-shrink-0">Teléfono de Contacto</FormLabel>
                        <FormControl className="flex-1">
                          <Input 
                            placeholder="Número de teléfono"
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="ml-36" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createProjectMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  console.log('DEBUG: Button clicked');
                  console.log('DEBUG: Form values:', form.getValues());
                  console.log('DEBUG: Form errors:', form.formState.errors);
                  console.log('DEBUG: Form valid:', form.formState.isValid);
                  
                  const formData = form.getValues();
                  if (formData.name) {
                    console.log('DEBUG: Triggering mutation manually');
                    createProjectMutation.mutate(formData);
                  } else {
                    console.log('DEBUG: Name is missing');
                    toast({
                      title: "Error",
                      description: "El nombre del proyecto es requerido",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-primary hover:bg-primary/90"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
              </Button>
            </div>
          </form>
        </Form>

        {/* Contact Selection Dialog */}
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Seleccionar Cliente</DialogTitle>
              <DialogDescription>
                Selecciona un contacto de tu organización para este proyecto
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay contactos disponibles en tu organización
                </p>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="font-medium">{contact.name}</div>
                    {contact.company_name && (
                      <div className="text-sm text-muted-foreground">{contact.company_name}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {contact.contact_type} • {contact.email || contact.phone || 'Sin contacto'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
