import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { z } from 'zod';
import { CalendarIcon, Plus, X, Upload, FileText, Image, Video, Users, CheckSquare, Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { siteLogsService } from '@/lib/siteLogsService';
import { tasksService } from '@/lib/tasksService';
import { contactsService } from '@/lib/contactsService';
import type { SiteLog, Task, Contact, InsertSiteLogTask, InsertSiteLogAttendee } from '@shared/schema';

const siteLogSchema = z.object({
  date: z.date(),
  comments: z.string().optional(),
  weather: z.string().optional(),
});

type SiteLogForm = z.infer<typeof siteLogSchema>;

interface SiteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteLog?: SiteLog | null;
  projectId?: number;
}

export default function SiteLogModal({ isOpen, onClose, siteLog, projectId }: SiteLogModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTasks, setSelectedTasks] = useState<Array<{ task: Task; quantity: string; notes: string }>>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<Array<{ contact: Contact; role: string }>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; description: string }>>([]);

  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      date: new Date(),
      comments: '',
      weather: '',
    },
  });

  // Fetch tasks and contacts
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: () => tasksService.getAll(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: () => contactsService.getAll(),
  });

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      if (!projectId) throw new Error('No hay proyecto seleccionado');
      
      const siteLogData = {
        project_id: projectId,
        date: data.date,
        comments: data.comments || '',
        weather: data.weather || '',
      };

      let createdSiteLog: SiteLog;
      
      if (siteLog) {
        createdSiteLog = await siteLogsService.updateSiteLog(siteLog.id, siteLogData);
      } else {
        createdSiteLog = await siteLogsService.createSiteLog(siteLogData);
      }

      // Create tasks
      for (const taskData of selectedTasks) {
        await siteLogsService.createSiteLogTask({
          site_log_id: createdSiteLog.id,
          task_id: taskData.task.id,
          quantity: parseFloat(taskData.quantity) || 0,
          notes: taskData.notes,
        });
      }

      // Create attendees
      for (const attendeeData of selectedAttendees) {
        await siteLogsService.createSiteLogAttendee({
          site_log_id: createdSiteLog.id,
          contact_id: attendeeData.contact.id,
          role: attendeeData.role,
        });
      }

      // Upload files
      for (const fileData of uploadedFiles) {
        const fileUrl = await siteLogsService.uploadFile(fileData.file, createdSiteLog.id);
        await siteLogsService.createSiteLogFile({
          site_log_id: createdSiteLog.id,
          file_name: fileData.file.name,
          file_url: fileUrl,
          file_type: fileData.file.type.startsWith('image/') ? 'image' : 
                    fileData.file.type.startsWith('video/') ? 'video' : 'document',
          file_size: fileData.file.size,
          description: fileData.description,
        });
      }

      return createdSiteLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-logs'] });
      toast({
        title: siteLog ? 'Registro actualizado' : 'Registro creado',
        description: siteLog ? 'El registro de obra ha sido actualizado.' : 'Se ha creado un nuevo registro de obra.',
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error al guardar registro:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro de obra.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SiteLogForm) => {
    createMutation.mutate(data);
  };

  const addTask = (task: Task) => {
    if (!selectedTasks.find(t => t.task.id === task.id)) {
      setSelectedTasks([...selectedTasks, { task, quantity: '1', notes: '' }]);
    }
  };

  const removeTask = (taskId: number) => {
    setSelectedTasks(selectedTasks.filter(t => t.task.id !== taskId));
  };

  const updateTask = (taskId: number, field: 'quantity' | 'notes', value: string) => {
    setSelectedTasks(selectedTasks.map(t => 
      t.task.id === taskId ? { ...t, [field]: value } : t
    ));
  };

  const addAttendee = (contact: Contact) => {
    if (!selectedAttendees.find(a => a.contact.id === contact.id)) {
      setSelectedAttendees([...selectedAttendees, { contact, role: 'Trabajador' }]);
    }
  };

  const removeAttendee = (contactId: number) => {
    setSelectedAttendees(selectedAttendees.filter(a => a.contact.id !== contactId));
  };

  const updateAttendeeRole = (contactId: number, role: string) => {
    setSelectedAttendees(selectedAttendees.map(a => 
      a.contact.id === contactId ? { ...a, role } : a
    ));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).map(file => ({
      file,
      description: '',
    }));
    
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const updateFileDescription = (index: number, description: string) => {
    setUploadedFiles(uploadedFiles.map((file, i) => 
      i === index ? { ...file, description } : file
    ));
  };

  const weatherOptions = [
    { value: 'Soleado', icon: Sun, emoji: '☀️' },
    { value: 'Parcialmente nublado', icon: Cloud, emoji: '⛅' },
    { value: 'Nublado', icon: Cloud, emoji: '☁️' },
    { value: 'Lluvia', icon: CloudRain, emoji: '🌧️' },
    { value: 'Tormenta', icon: CloudRain, emoji: '⛈️' },
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (siteLog) {
        form.reset({
          date: new Date(siteLog.date),
          comments: siteLog.comments || '',
          weather: siteLog.weather || '',
        });
      } else {
        form.reset({
          date: new Date(),
          comments: '',
          weather: '',
        });
      }
      setSelectedTasks([]);
      setSelectedAttendees([]);
      setUploadedFiles([]);
    }
  }, [isOpen, siteLog, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {siteLog ? 'Editar registro de obra' : 'Nuevo registro de obra'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('date') ? format(form.watch('date'), 'dd/MM/yyyy') : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => date && form.setValue('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Weather */}
            <div className="space-y-2">
              <Label htmlFor="weather">Clima</Label>
              <Select value={form.watch('weather')} onValueChange={(value) => form.setValue('weather', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar clima" />
                </SelectTrigger>
                <SelectContent>
                  {weatherOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.emoji}</span>
                        <span>{option.value}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comentarios generales</Label>
            <Textarea
              {...form.register('comments')}
              placeholder="Describe las actividades del día, observaciones, incidentes, etc."
              rows={4}
            />
          </div>

          {/* Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Tareas realizadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add task */}
              <div className="space-y-2">
                <Label>Agregar tarea</Label>
                <Select onValueChange={(value) => {
                  const task = tasks.find(t => t.id === parseInt(value));
                  if (task) addTask(task);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tarea" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.filter(task => !selectedTasks.find(t => t.task.id === task.id)).map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected tasks */}
              <div className="space-y-3">
                {selectedTasks.map((taskData) => (
                  <div key={taskData.task.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{taskData.task.name}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(taskData.task.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={taskData.quantity}
                          onChange={(e) => updateTask(taskData.task.id, 'quantity', e.target.value)}
                          placeholder="1.0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Notas</Label>
                        <Input
                          value={taskData.notes}
                          onChange={(e) => updateTask(taskData.task.id, 'notes', e.target.value)}
                          placeholder="Observaciones..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Asistentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add attendee */}
              <div className="space-y-2">
                <Label>Agregar asistente</Label>
                <Select onValueChange={(value) => {
                  const contact = contacts.find(c => c.id === parseInt(value));
                  if (contact) addAttendee(contact);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar contacto" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.filter(contact => !selectedAttendees.find(a => a.contact.id === contact.id)).map((contact) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.name} - {contact.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected attendees */}
              <div className="space-y-3">
                {selectedAttendees.map((attendeeData) => (
                  <div key={attendeeData.contact.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{attendeeData.contact.name}</h4>
                        <p className="text-sm text-muted-foreground">{attendeeData.contact.company_name}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(attendeeData.contact.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Rol</Label>
                      <Select 
                        value={attendeeData.role} 
                        onValueChange={(value) => updateAttendeeRole(attendeeData.contact.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Trabajador">Trabajador</SelectItem>
                          <SelectItem value="Inspector">Inspector</SelectItem>
                          <SelectItem value="Técnico">Técnico</SelectItem>
                          <SelectItem value="Contratista">Contratista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Archivos multimedia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File upload */}
              <div>
                <Label htmlFor="files">Subir archivos</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos soportados: imágenes, videos, PDF, documentos
                </p>
              </div>

              {/* Uploaded files */}
              <div className="space-y-3">
                {uploadedFiles.map((fileData, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {fileData.file.type.startsWith('image/') ? (
                          <Image className="h-4 w-4" />
                        ) : fileData.file.type.startsWith('video/') ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="font-medium">{fileData.file.name}</span>
                        <Badge variant="secondary">
                          {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
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
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        value={fileData.description}
                        onChange={(e) => updateFileDescription(index, e.target.value)}
                        placeholder="Descripción del archivo..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Guardando...' : (siteLog ? 'Actualizar' : 'Crear registro')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}