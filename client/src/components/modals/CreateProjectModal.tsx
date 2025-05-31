import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService, Project } from '@/lib/projectsService';
import { Organization } from '@/lib/organizationsService';
import { supabase } from '@/lib/supabase';
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
import { 
  Loader2, 
  Building,
  MapPin,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  User,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import ModernModal from '@/components/ui/ModernModal';
import AddressAutocomplete from '@/components/AddressAutocomplete';

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
  const { organizationId: currentOrgId } = useUserContextStore();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [nameValidation, setNameValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [nameExists, setNameExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);

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
      refreshData();
    }
  }, [orgFromStore, currentOrgId, refreshData]);

  // Refresh data when modal opens for editing
  useEffect(() => {
    if (isOpen && project) {
      refreshData();
    }
  }, [isOpen, project, refreshData]);

  // Map database status to form values
  const mapStatusFromDB = (dbStatus: string) => {
    const statusMap: { [key: string]: string } = {
      'Activo': 'in_progress',
      'En Progreso': 'in_progress',
      'Planificación': 'planning',
      'En Pausa': 'on_hold',
      'Completado': 'completed',
      'Cancelado': 'cancelled'
    };
    return statusMap[dbStatus] || 'planning';
  };

  // Set form values when editing
  useEffect(() => {
    if (isOpen) {
      if (project) {
        form.reset({
          name: project.name || '',
          description: project.description || '',
          client_name: project.client_name || '',
          status: mapStatusFromDB(project.status || ''),
          address: project.address || '',
          city: project.city || '',
          zip_code: project.zip_code || '',
          contact_phone: project.contact_phone || '',
          email: project.email || '',
        });
        // Set coordinates from existing project
        setMapLat(project.lat || null);
        setMapLng(project.lng || null);
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
        // Reset coordinates for new project
        setMapLat(null);
        setMapLng(null);
      }
    }
  }, [project, isOpen, form]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/projects', currentOrgId] });
      toast({
        title: 'Éxito',
        description: project ? 'Proyecto actualizado correctamente' : 'Proyecto creado correctamente',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  // Map form status back to database format
  const mapStatusToDB = (formStatus: string) => {
    const statusMap: { [key: string]: string } = {
      'planning': 'Planificación',
      'in_progress': 'En Progreso',
      'on_hold': 'En Pausa',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };
    return statusMap[formStatus] || 'Planificación';
  };

  const handleClose = () => {
    form.reset();
    setNameValidation('idle');
    setNameExists(false);
    setIsSubmitting(false);
    onClose();
  };

  const onSubmit = (data: CreateProjectFormData) => {
    if (!data.name) {
      toast({
        title: "Error",
        description: "El nombre del proyecto es requerido",
        variant: "destructive",
      });
      return;
    }
    
    if (nameValidation === 'invalid') {
      toast({
        title: "Error",
        description: "El nombre del proyecto ya existe",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const dbData = {
      ...data,
      status: mapStatusToDB(data.status || 'planning'),
      lat: mapLat,
      lng: mapLng
    };
    
    createProjectMutation.mutate(dbData);
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        disabled={isSubmitting}
        className="bg-[#d2d2d2] border-[#919191]/20 text-foreground hover:bg-[#c2c2c2] rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="project-form"
        disabled={isSubmitting || nameValidation === 'invalid'}
        className="bg-[#8fc700] hover:bg-[#7fb600] text-white rounded-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {project ? 'Actualizando...' : 'Creando...'}
          </>
        ) : (
          <>
            <Building className="h-4 w-4 mr-2" />
            {project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
      subtitle="Gestiona los proyectos de construcción"
      icon={Building}
      footer={footer}
    >
      <Form {...form}>
        <form id="project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Accordion type="single" collapsible defaultValue="informacion-general" className="w-full space-y-1">
            
            {/* Información General */}
            <AccordionItem value="informacion-general" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Información General
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                {/* Organización */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Organización</label>
                  <Input 
                    value={currentOrganization?.name || "Cargando..."}
                    disabled
                    className="bg-[#c8c8c8] border-[#919191]/20 text-muted-foreground rounded-lg text-sm"
                  />
                </div>

                {/* Nombre del Proyecto */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-xs font-medium text-foreground">Nombre del Proyecto *</FormLabel>
                        {nameValidation === 'validating' && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {nameValidation === 'valid' && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        {nameValidation === 'invalid' && (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Ej: Torre Norte – Etapa 2"
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            validateProjectName(e.target.value);
                          }}
                        />
                      </FormControl>
                      {nameValidation === 'invalid' && nameExists && (
                        <p className="text-xs text-red-600 mt-1">Este nombre ya existe</p>
                      )}
                      {nameValidation === 'valid' && (
                        <p className="text-xs text-green-600 mt-1">Nombre disponible</p>
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
                      <FormLabel className="text-xs font-medium text-foreground">Estado del Proyecto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                            <SelectValue placeholder="Selecciona el estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
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
                      <FormLabel className="text-xs font-medium text-foreground">Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe brevemente el alcance y características del proyecto..."
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm min-h-[60px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Información del Cliente */}
            <AccordionItem value="informacion-cliente" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información del Cliente
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                {/* Nombre del Cliente */}
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Constructora ABC S.A."
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
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
                      <FormLabel className="text-xs font-medium text-foreground">Email de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="cliente@empresa.com"
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teléfono */}
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Teléfono de Contacto</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: +54 11 1234-5678"
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Ubicación */}
            <AccordionItem value="ubicacion" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ubicación del Proyecto
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                {/* Dirección con Autocompletado */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Dirección</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value || ''}
                          onChange={(address) => {
                            field.onChange(address);
                          }}
                          onCoordinatesChange={(lat, lng) => {
                            setMapLat(lat);
                            setMapLng(lng);
                          }}
                          onCityChange={(city) => {
                            form.setValue('city', city);
                          }}
                          onZipCodeChange={(zipCode) => {
                            form.setValue('zip_code', zipCode);
                          }}
                          placeholder="Buscar dirección..."
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  {/* Ciudad */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Ciudad</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Se completa automáticamente"
                            disabled
                            className="bg-[#f0f0f0] border-[#919191]/20 text-muted-foreground rounded-lg text-sm cursor-not-allowed"
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
                        <FormLabel className="text-xs font-medium text-muted-foreground">Código Postal</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Se completa automáticamente"
                            disabled
                            className="bg-[#f0f0f0] border-[#919191]/20 text-muted-foreground rounded-lg text-sm cursor-not-allowed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </form>
      </Form>
    </ModernModal>
  );
}