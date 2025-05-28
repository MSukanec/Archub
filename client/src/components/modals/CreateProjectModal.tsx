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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  status: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().optional(),
  contact_phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
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
  const { organizationId: currentOrgId } = useUserContextStore();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
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
      zip_code: '',
      contact_phone: '',
      email: '',
    },
  });

  // Get organization from store
  const { organization: orgFromStore, refreshData } = useUserContextStore();

  useEffect(() => {
    if (orgFromStore) {
      setCurrentOrganization(orgFromStore);
    } else if (currentOrgId && !orgFromStore) {
      // If we have an organizationId but no organization data, refresh it
      refreshData();
    }
  }, [orgFromStore, currentOrgId, refreshData]);

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
        zip_code: project.zip_code || '',
        contact_phone: project.contact_phone || '',
        email: project.email || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        client_name: '',
        status: 'planning',
        address: '',
        city: '',
        zip_code: '',
        contact_phone: '',
        email: '',
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
        .eq('organization_id', currentOrgId)
        .eq('is_active', true)
        .ilike('name', name);

      const exists = existingProjects?.some(p => 
        p.name.toLowerCase() === name.toLowerCase() && 
        (!project || p.name !== project.name)
      );

      setNameExists(!!exists);
      setNameValidation(exists ? 'invalid' : 'valid');
    } catch (error) {
      setNameValidation('idle');
    }
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectFormData) => {
      if (project) {
        return await projectsService.update(project.id, data);
      } else {
        return await projectsService.create(data);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
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
              <Accordion 
                type="single" 
                collapsible 
                defaultValue="general"
                className="w-full"
              >
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-2">
                  {/* ACORDEÓN: INFORMACIÓN GENERAL */}
                  <AccordionItem value="general" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Información General</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Organización */}
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <label className="text-sm font-medium">Organización</label>
                          </div>
                          <Input 
                            value={currentOrganization?.name || "Cargando..."}
                            disabled
                            className="bg-muted text-muted-foreground"
                          />
                        </div>

                        {/* Nombre del Proyecto */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
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

                        {/* Estado del Proyecto */}
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Estado del Proyecto</FormLabel>
                              </div>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
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

                        {/* Descripción */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Descripción</FormLabel>
                              </div>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe brevemente el alcance y características del proyecto..."
                                  className="min-h-[80px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* ACORDEÓN: UBICACIÓN */}
                  <AccordionItem value="location" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Ubicación</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Dirección */}
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Dirección</FormLabel>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej: Av. Libertador 1234, Piso 15"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Ciudad */}
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Ciudad</FormLabel>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej: San Isidro"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Código Postal */}
                        <FormField
                          control={form.control}
                          name="zip_code"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Código Postal</FormLabel>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej: 1602"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* ACORDEÓN: PARTES INTERESADAS */}
                  <AccordionItem value="stakeholders" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Partes Interesadas</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Cliente */}
                        <FormField
                          control={form.control}
                          name="client_name"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Cliente</FormLabel>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej: Constructora ABC S.A."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* ACORDEÓN: CONTACTO */}
                  <AccordionItem value="contact" className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Contacto y Comunicación</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Teléfono */}
                        <FormField
                          control={form.control}
                          name="contact_phone"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-3 mb-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Teléfono</FormLabel>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej: 01171643000"
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
                              <div className="flex items-center gap-3 mb-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <FormLabel>Email</FormLabel>
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="Ej: proyecto@empresa.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              </Accordion>

              {/* Botones de acción */}
              <div className="flex justify-between pt-4 border-t">
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
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}