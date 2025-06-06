import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import ModernModal from './ui/ModernModal';

// Schema for form validation
const eventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  date: z.string().min(1, 'La fecha es requerida'),
  time: z.string().min(1, 'La hora es requerida'),
  duration: z.string().min(1, 'La duración es requerida'),
  type: z.enum(['meeting', 'task', 'reminder', 'appointment']),
  priority: z.enum(['low', 'medium', 'high']),
  location: z.string().optional(),
  attendees: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;

export interface CalendarEvent extends EventFormData {
  id: string;
  organization_id: string;
  created_at?: string;
  created_at_local?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  onSubmit: (data: EventFormData) => void;
  isSubmitting: boolean;
}

export default function EventModal({ isOpen, onClose, event, onSubmit, isSubmitting }: EventModalProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '60',
      location: '',
      attendees: '',
      type: 'meeting',
      priority: 'medium',
    },
  });

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (isOpen) {
      if (event) {
        form.reset({
          title: event.title,
          description: event.description || '',
          date: event.date,
          time: event.time,
          duration: event.duration,
          location: event.location || '',
          attendees: event.attendees || '',
          type: event.type,
          priority: event.priority,
        });
      } else {
        form.reset({
          title: '',
          description: '',
          date: '',
          time: '',
          duration: '60',
          location: '',
          attendees: '',
          type: 'meeting',
          priority: 'medium',
        });
      }
    }
  }, [event, isOpen, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const footer = (
    <div className="flex gap-2 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isSubmitting}
        className="w-1/4 bg-transparent border-input text-foreground hover:bg-surface-secondary rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="event-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (event ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={event ? "Editar Evento" : "Crear Nuevo Evento"}
      subtitle={event ? "Modifica los datos del evento existente" : "Crea un nuevo evento en el calendario"}
      icon={Calendar}
      footer={footer}
    >
      <Form {...form}>
        <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Accordion type="single" defaultValue="basic" className="w-full">
            {/* Basic Information */}
            <AccordionItem value="basic" className="border-input">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Información Básica
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Título <span className="text-primary">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Reunión con cliente"
                          className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del evento..."
                          rows={3}
                          className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Date and Time */}
            <AccordionItem value="datetime" className="border-input">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Fecha y Hora
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Fecha <span className="text-primary">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Hora <span className="text-primary">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="time"
                            className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Duración <span className="text-primary">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                              <SelectValue placeholder="Seleccionar duración" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-primary border-input z-[10000]">
                            <SelectItem value="15">15 minutos</SelectItem>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="45">45 minutos</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="90">1 hora 30 min</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                            <SelectItem value="180">3 horas</SelectItem>
                            <SelectItem value="240">4 horas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Tipo <span className="text-primary">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-primary border-input z-[10000]">
                            <SelectItem value="meeting">Reunión</SelectItem>
                            <SelectItem value="task">Tarea</SelectItem>
                            <SelectItem value="reminder">Recordatorio</SelectItem>
                            <SelectItem value="appointment">Cita</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Additional Details */}
            <AccordionItem value="details" className="border-input">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Detalles Adicionales
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Prioridad <span className="text-primary">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-primary border-input z-[10000]">
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Ubicación</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ubicación del evento"
                            className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="attendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Asistentes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Lista de asistentes (separados por comas)"
                          rows={2}
                          className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </Form>
    </ModernModal>
  );
}