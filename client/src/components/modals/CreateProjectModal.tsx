import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { projectsService, Project, CreateProjectData } from '@/lib/projectsService';
import { organizationsService, Organization } from '@/lib/organizationsService';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Loader2, 
  Building,
  MapPin,
  Phone,
  FileText,
  Info,
  CheckCircle,
  AlertCircle,
  User,
  Users,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  client_name: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('planning'),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  budget: z.number().optional(),
  project_manager: z.string().optional(),
  architect: z.string().optional(),
  contractor: z.string().optional(),
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
  const { organizationId } = useUserContextStore();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [nameValidation, setNameValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [nameExists, setNameExists] = useState(false);

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      client_name: '',
      status: 'planning',
      address: '',
      city: '',
      postal_code: '',
      phone: '',
      email: '',
      budget: undefined,
      project_manager: '',
      architect: '',
      contractor: '',
    },
  });

  // Fetch organization
  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations'],
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (organizations && organizationId) {
      const org = organizations.find((o: Organization) => o.id === organizationId);
      setCurrentOrganization(org || null);
    }
  }, [organizations, organizationId]);

  // Set form values when editing
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name || '',
        description: project.description || '',
        client_name: project.client_name || '',
        status: project.status || 'planning',
        address: project.address || '',
        city: project.city || '',
        postal_code: project.postal_code || '',
        phone: project.phone || '',
        email: project.email || '',
        budget: project.budget || undefined,
        project_manager: project.project_manager || '',
        architect: project.architect || '',
        contractor: project.contractor || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        client_name: '',
        status: 'planning',
        address: '',
        city: '',
        postal_code: '',
        phone: '',
        email: '',
        budget: undefined,
        project_manager: '',
        architect: '',
        contractor: '',
      });
    }
  }, [project, form]);

  // Real-time name validation
  const validateProjectName = async (name: string) => {
    if (!name || name.length < 2) {
      setNameValidation('idle');
      return;
    }

    setNameValidation('validating');
    
    try {
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .ilike('name', name);

      const exists = existingProjects?.some(p => 
        p.name.toLowerCase() === name.toLowerCase() && 
        (!project || p.name !== project.name)
      );

      setNameExists(exists);
      setNameValidation(exists ? 'invalid' : 'valid');
    } catch (error) {
      setNameValidation('idle');
    }
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectFormData) => {
      if (project) {
        return await projectsService.updateProject(project.id, data);
      } else {
        return await projectsService.createProject(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Éxito',
        description: project ? 'Proyecto actualizado correctamente' : 'Proyecto creado correctamente',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateProjectFormData) => {
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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </DialogTitle>
          <DialogDescription>
            {project ? 'Actualiza la información del proyecto' : 'Crea un nuevo proyecto de construcción organizando la información por secciones'}
          </DialogDescription>
        </DialogHeader>

        <TooltipProvider>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="stakeholders" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Stakeholders
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contacto
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6 max-h-[50vh] overflow-y-auto pr-2">
                  {/* PESTAÑA: INFORMACIÓN GENERAL */}
                  <TabsContent value="general" className="space-y-6">
                    <div className="space-y-1 mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Información General
                      </h3>
                      <p className="text-sm text-muted-foreground">Datos básicos del proyecto de construcción</p>
                      <div className="h-px bg-border mt-3"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Organización */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm font-medium">Organización</label>
                        </div>
                        <Input 
                          value={currentOrganization?.name || "Cargando..."}
                          disabled
                          className="bg-muted text-muted-foreground mt-2"
                        />
                      </div>

                      {/* Nombre del Proyecto con validación en tiempo real */}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <FormLabel className="flex items-center gap-2">
                                  Nombre del Proyecto
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Nombre único que identifique tu proyecto</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                {nameValidation === 'validating' && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {nameValidation === 'valid' && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {nameValidation === 'invalid' && (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej: Torre Norte – Etapa 2"
                                  className="mt-2"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    validateProjectName(e.target.value);
                                  }}
                                />
                              </FormControl>
                              {nameValidation === 'invalid' && nameExists && (
                                <p className="text-sm text-red-500 mt-1">❌ Este nombre ya existe</p>
                              )}
                              {nameValidation === 'valid' && (
                                <p className="text-sm text-green-500 mt-1">✅ Nombre disponible</p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Descripción */}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Descripción</FormLabel>
                              </div>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe brevemente el alcance y características del proyecto..."
                                  className="mt-2 min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Estado del Proyecto */}
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Estado del Proyecto</FormLabel>
                            </div>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Selecciona el estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="planning">Planificación</SelectItem>
                                <SelectItem value="in_progress">En Progreso</SelectItem>
                                <SelectItem value="on_hold">En Pausa</SelectItem>
                                <SelectItem value="completed">Completado</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Presupuesto */}
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">$</span>
                              <FormLabel className="flex items-center gap-2">
                                Presupuesto
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Presupuesto total estimado del proyecto</p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Ej: 1500000"
                                className="mt-2"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* PESTAÑA: STAKEHOLDERS */}
                  <TabsContent value="stakeholders" className="space-y-6">
                    <div className="space-y-1 mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Stakeholders
                      </h3>
                      <p className="text-sm text-muted-foreground">Personas y empresas involucradas en el proyecto</p>
                      <div className="h-px bg-border mt-3"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cliente */}
                      <FormField
                        control={form.control}
                        name="client_name"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Cliente</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: Constructora ABC S.A."
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Jefe de Proyecto */}
                      <FormField
                        control={form.control}
                        name="project_manager"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Jefe de Proyecto</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: Ing. María García"
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Arquitecto */}
                      <FormField
                        control={form.control}
                        name="architect"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Arquitecto</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: Arq. Carlos Ruiz"
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Contratista */}
                      <FormField
                        control={form.control}
                        name="contractor"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Contratista</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: Construcciones del Sur Ltda."
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* PESTAÑA: UBICACIÓN */}
                  <TabsContent value="location" className="space-y-6">
                    <div className="space-y-1 mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Ubicación
                      </h3>
                      <p className="text-sm text-muted-foreground">Dirección y ubicación física del proyecto</p>
                      <div className="h-px bg-border mt-3"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Dirección */}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Dirección</FormLabel>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej: Av. Libertador 1234, Piso 15"
                                  className="mt-2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Ciudad */}
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Ciudad</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: San Isidro"
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Código Postal */}
                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Código Postal</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: 1602"
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* PESTAÑA: CONTACTO */}
                  <TabsContent value="contact" className="space-y-6">
                    <div className="space-y-1 mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Contacto y Comunicación
                      </h3>
                      <p className="text-sm text-muted-foreground">Información de contacto principal del proyecto</p>
                      <div className="h-px bg-border mt-3"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Teléfono */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Teléfono</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: 01171643000"
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <FormLabel>Email</FormLabel>
                            </div>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="Ej: proyecto@empresa.com"
                                className="mt-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProjectMutation.isPending || (nameValidation === 'invalid')}
                    className="flex items-center gap-2"
                  >
                    {createProjectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {project ? 'Actualizando...' : 'Creando...'}
                      </>
                    ) : (
                      <>
                        <Building className="h-4 w-4" />
                        {project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
                      </>
                    )}
                  </Button>
                </div>
              </Tabs>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}