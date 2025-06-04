import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import { CalendarIcon, Plus, X, Upload, FileText, Users, CheckSquare, Cloud, Sun, CloudRain, CloudSnow, Check, Camera, Wrench, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { siteLogsService } from '@/lib/siteLogsService';
import { supabase } from '@/lib/supabase';
import { tasksService } from '@/lib/tasksService';
import { contactsService } from '@/lib/contactsService';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import ModernModal from '@/components/ui/ModernModal';
import type { SiteLog, Task, Contact, InsertSiteLogTask, InsertSiteLogAttendee } from '@shared/schema';

const siteLogSchema = z.object({
  date: z.date({
    required_error: "La fecha es requerida",
  }),
  comments: z.string().optional(),
  weather: z.string().min(1, "El clima es requerido"),
});

type SiteLogForm = z.infer<typeof siteLogSchema>;

interface SiteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
  siteLog?: SiteLog | null;
  projectId?: string;
}

const weatherOptions = [
  { value: 'Soleado', label: 'Soleado', icon: Sun, color: 'text-primary' },
  { value: 'Nublado', label: 'Nublado', icon: Cloud, color: 'text-primary' },
  { value: 'Lluvia', label: 'Lluvia', icon: CloudRain, color: 'text-primary' },
  { value: 'Tormenta', label: 'Tormenta', icon: CloudSnow, color: 'text-primary' },
];

export default function SiteLogModal({ isOpen, onClose, onOpenChange, siteLog, projectId }: SiteLogModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditing = !!siteLog;
  
  const [selectedTasks, setSelectedTasks] = useState<Array<{ task: Task; quantity: string; notes: string }>>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<Array<{ contact: Contact; role: string }>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; description: string }>>([]);
  const [taskSelectValue, setTaskSelectValue] = useState<string>("");
  const [attendeeSelectValue, setAttendeeSelectValue] = useState<string>("");

  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    mode: 'onSubmit',
    defaultValues: {
      date: siteLog ? new Date(siteLog.log_date) : new Date(),
      comments: siteLog?.comments || '',
      weather: siteLog?.weather || '',
    },
  });

  // Fetch tasks for current project
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksService.getAll(),
    enabled: !!projectId && isOpen,
  });

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsService.getAll(),
    enabled: isOpen,
  });

  // Reset form when modal opens/closes or siteLog changes
  useEffect(() => {
    if (isOpen && siteLog) {
      form.reset({
        date: new Date(siteLog.log_date),
        comments: siteLog.comments || '',
        weather: siteLog.weather || '',
      });
      // Load existing tasks and attendees
      // This would need to be implemented based on your data structure
    } else if (isOpen && !siteLog) {
      form.reset({
        date: new Date(),
        comments: '',
        weather: '',
      });
      setSelectedTasks([]);
      setSelectedAttendees([]);
      setUploadedFiles([]);
    }
  }, [isOpen, siteLog, form]);

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      const siteLogData = {
        log_date: format(data.date, 'yyyy-MM-dd'),
        comments: data.comments || null,
        weather: data.weather,
        project_id: projectId!,
        created_by: user?.id!,
      };

      if (isEditing && siteLog) {
        const result = await siteLogsService.updateSiteLog(siteLog.id, siteLogData);
        
        // Update related tasks and attendees
        // Implementation depends on your service structure
        
        return result;
      } else {
        const result = await siteLogsService.createSiteLog(siteLogData);
        
        // Add tasks and attendees
        // Implementation depends on your service structure
        
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeline-events'] });
      toast({
        title: isEditing ? "Registro actualizado" : "Registro creado",
        description: isEditing ? "El registro de obra se ha actualizado correctamente." : "El registro de obra se ha creado correctamente.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el registro",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SiteLogForm) => {
    createMutation.mutate(data);
  };

  // Task management functions
  const addTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !selectedTasks.find(st => st.task.id === taskId)) {
      setSelectedTasks(prev => [...prev, {
        task,
        quantity: '1',
        notes: ''
      }]);
      setTaskSelectValue("");
    }
  };

  const removeTask = (taskId: string) => {
    setSelectedTasks(prev => prev.filter(st => st.task.id !== taskId));
  };

  const updateTaskQuantity = (taskId: string, quantity: string) => {
    setSelectedTasks(prev => prev.map(st => 
      st.task.id === taskId ? { ...st, quantity } : st
    ));
  };

  const updateTaskNotes = (taskId: string, notes: string) => {
    setSelectedTasks(prev => prev.map(st => 
      st.task.id === taskId ? { ...st, notes } : st
    ));
  };

  // Attendee management functions
  const addAttendee = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact && !selectedAttendees.find(sa => sa.contact.id === contactId)) {
      setSelectedAttendees(prev => [...prev, {
        contact,
        role: 'Trabajador'
      }]);
      setAttendeeSelectValue("");
    }
  };

  const removeAttendee = (contactId: string) => {
    setSelectedAttendees(prev => prev.filter(sa => sa.contact.id !== contactId));
  };

  const updateAttendeeRole = (contactId: string, role: string) => {
    setSelectedAttendees(prev => prev.map(sa => 
      sa.contact.id === contactId ? { ...sa, role } : sa
    ));
  };

  // File management functions
  const addFile = (file: File) => {
    setUploadedFiles(prev => [...prev, { file, description: '' }]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileDescription = (index: number, description: string) => {
    setUploadedFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, description } : item
    ));
  };

  // Check for form errors
  const formErrors = form.formState.errors;
  const hasErrors = Object.keys(formErrors).length > 0;

  const footer = (
    <div className="space-y-3">
      {/* Error summary */}
      {hasErrors && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-sm font-medium text-primary mb-2">Por favor completa los siguientes campos:</p>
          <ul className="text-sm text-primary/80 space-y-1">
            {formErrors.date && <li>• Fecha del registro</li>}
            {formErrors.weather && <li>• Condiciones climáticas</li>}
          </ul>
        </div>
      )}
      
      {/* Buttons */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-background border-border text-foreground hover:bg-muted rounded-xl flex-[1] basis-1/4"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="sitelog-form"
          disabled={createMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex-[3] basis-3/4"
        >
          {createMutation.isPending && (
            <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
          )}
          {isEditing ? 'Actualizar Registro' : 'Crear Registro'}
        </Button>
      </div>
    </div>
  );

  // Show loading state
  if (tasksLoading || contactsLoading) {
    return (
      <ModernModal 
        isOpen={isOpen} 
        onClose={onClose}
        title="Cargando..."
        subtitle="Preparando información del registro"
        icon={Clock}
      >
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Cargando información necesaria para el registro de obra...
          </p>
        </div>
      </ModernModal>
    );
  }

  return (
    <ModernModal 
      isOpen={isOpen} 
      onClose={onClose}

      title={isEditing ? "Editar Registro de Obra" : "Nuevo Registro de Obra"}
      subtitle={isEditing ? "Modifica los datos del registro existente" : "Registra las actividades diarias y personal presente en obra"}
      icon={FileText}
      footer={footer}
    >
      <Form {...form}>
        <form id="sitelog-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <Accordion type="single" defaultValue="basic" className="w-full flex-1 flex flex-col">
            {/* Basic Information Section */}
            <AccordionItem value="basic" className="border-input">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Información Básica
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-3">
                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Fecha del Registro *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "bg-muted border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm justify-start text-left font-normal w-full",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[10000]" align="start">
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

                {/* Weather */}
                <FormField
                  control={form.control}
                  name="weather"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Condiciones Climáticas *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="bg-muted border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                            <SelectValue placeholder="Seleccionar clima" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-muted border-input z-[10001]">
                          {weatherOptions.map((option) => {
                            const IconComponent = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className={cn("h-4 w-4", option.color)} />
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

                {/* Comments */}
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Comentarios Generales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe las actividades del día, observaciones importantes..."
                          {...field}
                          className="bg-muted border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm min-h-[80px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Tasks Section */}
            <AccordionItem value="tasks" className="border-input">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  Tareas Realizadas
                  {selectedTasks.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {selectedTasks.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {/* Task Selection */}
                <div className="space-y-2">
                  <FormLabel className="text-xs font-medium text-foreground">Agregar Tarea</FormLabel>
                  <Select value={taskSelectValue} onValueChange={addTask}>
                    <SelectTrigger className="bg-muted border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                      <SelectValue placeholder="Seleccionar tarea..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-input max-h-[200px] z-[10001]">
                      {tasks.filter(task => !selectedTasks.find(st => st.task.id === task.id)).map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{task.name}</span>
                            {task.description && (
                              <span className="text-xs text-muted-foreground">{task.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Tasks */}
                {selectedTasks.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel className="text-xs font-medium text-foreground">Tareas Seleccionadas</FormLabel>
                    <div className="space-y-2">
                      {selectedTasks.map((selectedTask) => (
                        <div key={selectedTask.task.id} className="bg-[#c2c2c2] border border-input rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground truncate">
                                {selectedTask.task.name}
                              </h4>
                              {selectedTask.task.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedTask.task.description}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(selectedTask.task.id)}
                              className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Cantidad</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={selectedTask.quantity}
                                onChange={(e) => updateTaskQuantity(selectedTask.task.id, e.target.value)}
                                className="bg-muted border-input text-xs h-8 mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Notas</label>
                              <Input
                                placeholder="Observaciones..."
                                value={selectedTask.notes}
                                onChange={(e) => updateTaskNotes(selectedTask.task.id, e.target.value)}
                                className="bg-muted border-input text-xs h-8 mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Attendees Section */}
            <AccordionItem value="attendees" className="border-input">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Personal Presente
                  {selectedAttendees.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {selectedAttendees.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {/* Attendee Selection */}
                <div className="space-y-2">
                  <FormLabel className="text-xs font-medium text-foreground">Agregar Personal</FormLabel>
                  <Select value={attendeeSelectValue} onValueChange={addAttendee}>
                    <SelectTrigger className="bg-muted border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                      <SelectValue placeholder="Seleccionar persona..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-input max-h-[200px] z-[10001]">
                      {contacts.filter(contact => !selectedAttendees.find(sa => sa.contact.id === contact.id)).map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{contact.name}</span>
                            {contact.email && (
                              <span className="text-xs text-muted-foreground">{contact.email}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Attendees */}
                {selectedAttendees.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel className="text-xs font-medium text-foreground">Personal Seleccionado</FormLabel>
                    <div className="space-y-2">
                      {selectedAttendees.map((selectedAttendee) => (
                        <div key={selectedAttendee.contact.id} className="bg-[#c2c2c2] border border-input rounded-lg p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground truncate">
                                {selectedAttendee.contact.name}
                              </h4>
                              {selectedAttendee.contact.email && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedAttendee.contact.email}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={selectedAttendee.role}
                                onValueChange={(value) => updateAttendeeRole(selectedAttendee.contact.id, value)}
                              >
                                <SelectTrigger className="w-[120px] bg-muted border-input text-xs h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-muted border-input z-[10001]">
                                  <SelectItem value="Trabajador">Trabajador</SelectItem>
                                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                                  <SelectItem value="Inspector">Inspector</SelectItem>
                                  <SelectItem value="Cliente">Cliente</SelectItem>
                                  <SelectItem value="Proveedor">Proveedor</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttendee(selectedAttendee.contact.id)}
                                className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Files Section */}
            <AccordionItem value="files" className="border-input">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Archivos y Fotos
                  {uploadedFiles.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {uploadedFiles.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {/* File Upload */}
                <div className="space-y-2">
                  <FormLabel className="text-xs font-medium text-foreground">Subir Archivos</FormLabel>
                  <div className="border-2 border-dashed border-input rounded-lg p-4 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(addFile);
                        e.target.value = '';
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="bg-muted border-input text-xs"
                    >
                      Seleccionar Archivos
                    </Button>
                  </div>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel className="text-xs font-medium text-foreground">Archivos Seleccionados</FormLabel>
                    <div className="space-y-2">
                      {uploadedFiles.map((fileItem, index) => (
                        <div key={index} className="bg-[#c2c2c2] border border-input rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground truncate">
                                {fileItem.file.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-2">
                            <Input
                              placeholder="Descripción del archivo..."
                              value={fileItem.description}
                              onChange={(e) => updateFileDescription(index, e.target.value)}
                              className="bg-muted border-input text-xs h-8"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </Form>
    </ModernModal>
  );
}