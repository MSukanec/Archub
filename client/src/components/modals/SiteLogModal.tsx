import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import { CalendarIcon, Plus, X, Upload, FileText, Users, CheckSquare, Cloud, Sun, CloudRain, CloudSnow, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { siteLogsService } from '@/lib/siteLogsService';
import { supabase } from '@/lib/supabase';
import { tasksService } from '@/lib/tasksService';
import { contactsService } from '@/lib/contactsService';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import type { SiteLog, Task, Contact, InsertSiteLogTask, InsertSiteLogAttendee } from '@shared/schema';

const siteLogSchema = z.object({
  date: z.date({
    required_error: "La fecha es requerida",
  }),
  description: z.string().optional(),
  weather: z.string().optional(),
});

type SiteLogForm = z.infer<typeof siteLogSchema>;

interface SiteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteLog?: SiteLog | null;
  projectId?: string;
}

const weatherOptions = [
  { value: 'Soleado', label: 'Soleado', icon: Sun },
  { value: 'Nublado', label: 'Nublado', icon: Cloud },
  { value: 'Lluvia', label: 'Lluvia', icon: CloudRain },
  { value: 'Tormenta', label: 'Tormenta', icon: CloudSnow },
];

export default function SiteLogModal({ isOpen, onClose, siteLog, projectId }: SiteLogModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [selectedTasks, setSelectedTasks] = useState<Array<{ task: Task; quantity: string; notes: string }>>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<Array<{ contact: Contact; role: string }>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; description: string }>>([]);
  const [taskSelectValue, setTaskSelectValue] = useState<string>("");
  const [attendeeSelectValue, setAttendeeSelectValue] = useState<string>("");

  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      date: siteLog ? new Date(siteLog.date) : new Date(),
      description: siteLog?.description || '',
      weather: siteLog?.weather || '',
    },
  });

  // Reset form when modal opens/closes or siteLog changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        date: siteLog ? new Date(siteLog.date) : new Date(),
        description: siteLog?.description || '',
        weather: siteLog?.weather || '',
      });
      setSelectedTasks([]);
      setSelectedAttendees([]);
      setUploadedFiles([]);
      setTaskSelectValue("");
      setAttendeeSelectValue("");
    }
  }, [isOpen, siteLog, form]);

  // Get tasks with error handling
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: () => tasksService.getAll(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Get contacts with error handling
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: () => contactsService.getAll(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      console.log('Form data being submitted:', data);
      console.log('Selected tasks:', selectedTasks);
      console.log('Selected attendees:', selectedAttendees);
      console.log('Active project ID:', projectId);

      const siteLogData = {
        project_id: projectId,
        date: data.date.toISOString().split('T')[0], // Send only date part
        weather: data.weather === 'none' ? null : data.weather || null,
        description: data.description || null,
      };

      console.log('Creating site log with data:', siteLogData);

      if (siteLog?.id) {
        // Update existing
        return siteLogsService.updateSiteLog(siteLog.id, siteLogData);
      } else {
        // Create new
        try {
          const { data: result, error } = await supabase
            .from('site_logs')
            .insert([siteLogData])
            .select()
            .single();

          if (error) {
            console.error('Supabase error creating site log:', error);
            throw error;
          }

          return result;
        } catch (error) {
          console.error('Error al guardar registro:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-logs'] });
      toast({
        title: siteLog ? 'Registro actualizado' : 'Registro creado',
        description: `El registro de obra ha sido ${siteLog ? 'actualizado' : 'creado'} correctamente.`,
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error saving site log:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro de obra.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SiteLogForm) => {
    mutation.mutate(data);
  };

  const addTask = (taskId: string) => {
    const task = tasks.find(t => t.id === Number(taskId));
    if (task && !selectedTasks.find(st => st.task.id === task.id)) {
      setSelectedTasks([...selectedTasks, { task, quantity: '1', notes: '' }]);
      setTaskSelectValue("");
    }
  };

  const removeTask = (taskId: number) => {
    setSelectedTasks(selectedTasks.filter(st => st.task.id !== taskId));
  };

  const addAttendee = (contactId: string) => {
    const contact = contacts.find(c => c.id === Number(contactId));
    if (contact && !selectedAttendees.find(sa => sa.contact.id === contact.id)) {
      setSelectedAttendees([...selectedAttendees, { contact, role: 'Obrero' }]);
      setAttendeeSelectValue("");
    }
  };

  const removeAttendee = (contactId: number) => {
    setSelectedAttendees(selectedAttendees.filter(sa => sa.contact.id !== contactId));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map(file => ({ file, description: '' }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const updateFileDescription = (index: number, description: string) => {
    const updated = [...uploadedFiles];
    updated[index].description = description;
    setUploadedFiles(updated);
  };

  // Show loading state
  if (tasksLoading || contactsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cargando...</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Cargando información necesaria para el registro de obra...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {siteLog ? 'Editar registro de obra' : 'Nuevo registro de obra'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={["general"]} className="w-full">
              
              {/* Información General */}
              <AccordionItem value="general" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Información General</h3>
                      <p className="text-sm text-muted-foreground">Fecha, clima y comentarios del día</p>
                    </div>
                    {form.watch('date') && (
                      <Check className="h-4 w-4 text-green-500 ml-auto mr-2" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Fecha <span className="text-primary">*</span>
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: es })
                                    ) : (
                                      <span>Seleccionar fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weather"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clima (opcional)</FormLabel>
                            <Select 
                              value={field.value || ''} 
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin especificar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sin especificar</SelectItem>
                                {weatherOptions.map((option) => {
                                  const Icon = option.icon;
                                  return (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {option.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comentarios generales</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe las actividades del día, observaciones, incidentes, etc."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Tareas Completadas */}
              <AccordionItem value="tasks" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Tareas Completadas</h3>
                      <p className="text-sm text-muted-foreground">Registra las tareas realizadas en el día</p>
                    </div>
                    {selectedTasks.length > 0 && (
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {selectedTasks.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={taskSelectValue} onValueChange={addTask}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar tarea" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks.filter(task => !selectedTasks.find(st => st.task.id === task.id)).map(task => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              {task.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTasks.map(({ task, quantity, notes }, index) => (
                      <div key={task.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Cantidad"
                            value={quantity}
                            onChange={(e) => {
                              const updated = [...selectedTasks];
                              updated[index].quantity = e.target.value;
                              setSelectedTasks(updated);
                            }}
                          />
                          <Input
                            placeholder="Notas"
                            value={notes}
                            onChange={(e) => {
                              const updated = [...selectedTasks];
                              updated[index].notes = e.target.value;
                              setSelectedTasks(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Asistentes */}
              <AccordionItem value="attendees" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Asistentes</h3>
                      <p className="text-sm text-muted-foreground">Personal presente en obra</p>
                    </div>
                    {selectedAttendees.length > 0 && (
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {selectedAttendees.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={attendeeSelectValue} onValueChange={addAttendee}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar contacto" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.filter(contact => !selectedAttendees.find(sa => sa.contact.id === contact.id)).map(contact => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.name} - {contact.company_name || 'Sin empresa'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedAttendees.map(({ contact, role }, index) => (
                      <div key={contact.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{contact.name}</h4>
                            <p className="text-sm text-muted-foreground">{contact.company_name || 'Sin empresa'}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttendee(contact.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Select
                          value={role}
                          onValueChange={(value) => {
                            const updated = [...selectedAttendees];
                            updated[index].role = value;
                            setSelectedAttendees(updated);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Obrero">Obrero</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Ingeniero">Ingeniero</SelectItem>
                            <SelectItem value="Arquitecto">Arquitecto</SelectItem>
                            <SelectItem value="Cliente">Cliente</SelectItem>
                            <SelectItem value="Proveedor">Proveedor</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Archivos Multimedia */}
              <AccordionItem value="files" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Archivos multimedia</h3>
                      <p className="text-sm text-muted-foreground">Imágenes, videos, PDF, documentos</p>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {uploadedFiles.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>Elegir archivos</span>
                        </Button>
                      </label>
                      <p className="text-sm text-muted-foreground mt-2">
                        Formatos soportados: imágenes, videos, PDF, documentos
                      </p>
                    </div>

                    {uploadedFiles.map((fileData, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{fileData.file.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Descripción del archivo"
                          value={fileData.description}
                          onChange={(e) => updateFileDescription(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : (siteLog ? 'Actualizar registro' : 'Crear registro')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}