import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService, Project } from '../../lib/projectsService';
import { Organization } from '../../lib/organizationsService';
import { supabase } from '../../lib/supabase';
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { PhoneInputField } from "./components/ui/PhoneInput";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "./components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { 
  Loader2, 
  Building,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  User,
  FolderPlus
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useUserContextStore } from '../../stores/userContextStore';
import { useAuthStore } from '../../stores/authStore';
import ModernModal, { useModalAccordion, ModalAccordion } from "./components/ui/ModernModal";
import AddressAutocomplete from '../components/AddressAutocomplete';

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
  const { user } = useAuthStore();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [nameValidation, setNameValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [nameExists, setNameExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);

  const { toggleAccordion, isOpen: isAccordionOpen } = useModalAccordion('informacion-general');

  // Función para actualizar las preferencias del usuario
  const updateUserPreferences = async (projectId: string) => {
    try {
      if (user?.id) {
        const { data: internalUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (internalUser) {
          await supabase
            .from('user_preferences')
            .update({ last_project_id: projectId })
            .eq('user_id', internalUser.id);
        }
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

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
    onSuccess: (createdProject) => {
      // Invalidar todas las queries relacionadas con proyectos
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', currentOrgId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', currentOrgId] });
      queryClient.invalidateQueries({ queryKey: ['/api/organization-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organization-stats', currentOrgId] });
      
      // Si se creó un nuevo proyecto, actualizar las preferencias del usuario
      if (!project && createdProject) {
        updateUserPreferences(createdProject.id);
      }
      
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

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
      subtitle="Gestiona los proyectos de construcción"
      icon={project ? Building : FolderPlus}
      confirmText={project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Información General */}
          <ModalAccordion
            id="informacion-general"
            title="Información General"
            subtitle="Datos básicos del proyecto"
            icon={FileText}
            isOpen={isAccordionOpen('informacion-general')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              {/* Organización */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Organización</label>
                <Input 
                  value={currentOrganization?.name || "Cargando..."}
                  disabled
                  className="h-10 bg-surface-secondary border-input rounded-xl shadow-lg"
                />
              </div>

              {/* Nombre del Proyecto */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Nombre del Proyecto *</FormLabel>
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
                        className="h-10 bg-surface-secondary border-input rounded-xl shadow-lg hover:shadow-xl"
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
                    <FormLabel>Estado del Proyecto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-surface-secondary border-input rounded-xl shadow-lg hover:shadow-xl">
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
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe brevemente el alcance y características del proyecto..."
                        className="min-h-[100px] bg-surface-secondary border-input rounded-xl shadow-lg hover:shadow-xl resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>

          {/* Información del Cliente */}
          <ModalAccordion
            id="informacion-cliente"
            title="Información del Cliente"
            subtitle="Datos de contacto del cliente"
            icon={User}
            isOpen={isAccordionOpen('informacion-cliente')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              {/* Nombre del Cliente */}
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Cliente</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Constructora ABC S.A."
                        className="h-10 bg-surface-secondary border-input rounded-xl shadow-lg hover:shadow-xl"
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
                    <FormLabel>Email de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="cliente@empresa.com"
                        className="h-10 bg-surface-secondary border-input rounded-xl shadow-lg hover:shadow-xl"
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
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Contacto</FormLabel>
                    <FormControl>
                      <PhoneInputField
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Ingresa el teléfono del cliente"
                        error={!!fieldState.error}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>

          {/* Ubicación */}
          <ModalAccordion
            id="ubicacion"
            title="Ubicación del Proyecto"
            subtitle="Dirección y datos de ubicación"
            icon={MapPin}
            isOpen={isAccordionOpen('ubicacion')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              {/* Dirección con Autocompletado */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
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
                      <FormLabel className="text-muted-foreground">Ciudad</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Se completa automáticamente"
                          disabled
                          className="h-10 bg-[#f0f0f0] border-input text-muted-foreground rounded-xl cursor-not-allowed"
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
                      <FormLabel className="text-muted-foreground">Código Postal</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Se completa automáticamente"
                          disabled
                          className="h-10 bg-[#f0f0f0] border-input text-muted-foreground rounded-xl cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ModalAccordion>
        </div>
      </Form>
    </ModernModal>
  );
}