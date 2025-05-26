import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { projectsService, Project, CreateProjectData } from '@/lib/projectsService';
import { organizationsService, Organization } from '@/lib/organizationsService';
import { contactsService, Contact } from '@/lib/contactsService';
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
import { Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userPreferencesService } from '@/lib/userPreferencesService';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  client_name: z.string().optional(),
  contact_id: z.number().optional(),
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
  const { setCurrentProject } = useProjectStore();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      client_name: '',
      contact_id: undefined,
      status: 'planning',
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

  // Get current user's organization
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await organizationsService.getCurrentUserOrganization();
        setCurrentOrganization(org);
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    };
    fetchOrganization();
  }, []);

  // Reset form when project changes (for editing)
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        client_name: project.client_name || '',
        contact_id: project.contact_id || undefined,
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
        contact_id: undefined,
        status: 'planning',
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
    form.setValue('contact_id', contact.id);
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
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
      
      // If creating a new project, set it as current and save to preferences
      if (!project && user) {
        setCurrentProject(createdProject);
        try {
          await userPreferencesService.updateLastProject(user.id, createdProject.id);
        } catch (error) {
          console.error('Error saving project preference:', error);
        }
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
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.handleSubmit(onSubmit)();
              }
            }}
          >
            <div className="grid grid-cols-2 gap-6">
              {/* Columna Izquierda */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Organización
                  </label>
                  <Input 
                    value={currentOrganization?.name || "Tu organización"}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. Edificio Residencial Norte"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Nombre del cliente"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsContactDialogOpen(true)}
                            className="shrink-0"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
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
                        <Input 
                          placeholder="Dirección del proyecto"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ciudad"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de Contacto</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Número de teléfono"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado del Proyecto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planificación</SelectItem>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="on_hold">En Pausa</SelectItem>
                        </SelectContent>
                      </Select>
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
                          placeholder="Describe el proyecto..."
                          className="min-h-[120px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                type="submit"
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
