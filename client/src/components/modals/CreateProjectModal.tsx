import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService, Project } from '@/lib/projectsService';
import { Organization } from '@/lib/organizationsService';
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
import { 
  Loader2, 
  Building,
  MapPin,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  X
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

  const onSubmit = (data: CreateProjectFormData) => {
    if (!data.name) {
      toast({
        title: "Error",
        description: "El nombre del proyecto es requerido",
        variant: "destructive",
      });
      return;
    }
    
    const dbData = {
      ...data,
      status: mapStatusToDB(data.status || 'planning')
    };
    
    createProjectMutation.mutate(dbData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 bg-white dark:bg-gray-900 border-0 rounded-2xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h2>
              <p className="text-blue-100 text-sm">
                {project ? 'Actualiza la información del proyecto' : 'Crea un nuevo proyecto de construcción'}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Información General */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Información General</h3>
                </div>

                {/* Organización */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Building className="h-4 w-4 text-gray-400" />
                    Organización
                  </div>
                  <Input 
                    value={currentOrganization?.name || "Cargando..."}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                </div>

                {/* Nombre del Proyecto */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Building className="h-4 w-4 text-gray-400" />
                        Nombre del Proyecto
                        {nameValidation === 'validating' && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
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
                          value={field.value || ''}
                          placeholder="Ej: Torre Norte – Etapa 2"
                          className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            validateProjectName(e.target.value);
                          }}
                        />
                      </FormControl>
                      {nameValidation === 'invalid' && nameExists && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Este nombre ya existe
                        </p>
                      )}
                      {nameValidation === 'valid' && (
                        <p className="text-sm text-green-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Nombre disponible
                        </p>
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
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        Estado del Proyecto
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500">
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
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <FileText className="h-4 w-4 text-gray-400" />
                        Descripción
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe brevemente el alcance y características del proyecto..."
                          className="min-h-[80px] border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información del Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Información del Cliente</h3>
                </div>

                {/* Nombre del Cliente */}
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <User className="h-4 w-4 text-gray-400" />
                        Nombre del Cliente
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Constructora ABC S.A."
                          className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
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
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Mail className="h-4 w-4 text-gray-400" />
                        Email de Contacto
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="cliente@empresa.com"
                          className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
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
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Phone className="h-4 w-4 text-gray-400" />
                        Teléfono de Contacto
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: +54 11 1234-5678"
                          className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Ubicación */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Ubicación del Proyecto</h3>
                </div>

                {/* Dirección */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Dirección
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Av. Libertador 1234, Piso 15"
                          className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Ciudad */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          Ciudad
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Buenos Aires"
                            className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
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
                      <FormItem className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          Código Postal
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: C1001"
                            className="border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

            </form>
          </Form>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createProjectMutation.isPending || (nameValidation === 'invalid')}
            onClick={form.handleSubmit(onSubmit)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 min-w-[140px]"
          >
            {createProjectMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {project ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Building className="h-4 w-4" />
                {project ? 'Actualizar' : 'Crear Proyecto'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}