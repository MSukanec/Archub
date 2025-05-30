import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isEqual, addMonths, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';

// Event schema for form validation
const eventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  date: z.string().min(1, 'La fecha es requerida'),
  time: z.string().min(1, 'La hora es requerida'),
  duration: z.string().min(1, 'La duración es requerida'),
  location: z.string().optional(),
  attendees: z.string().optional(),
  type: z.enum(['meeting', 'task', 'reminder', 'appointment']),
  priority: z.enum(['low', 'medium', 'high']),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: string;
  location?: string;
  attendees?: string;
  type: 'meeting' | 'task' | 'reminder' | 'appointment';
  priority: 'low' | 'medium' | 'high';
  organization_id: string;
  created_at?: string;
}

export default function Calendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId } = useUserContextStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

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

  // Event listener for floating action button
  useEffect(() => {
    const handleOpenCreateEventModal = () => {
      setEditingEvent(null);
      form.reset({
        title: '',
        description: '',
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        duration: '60',
        location: '',
        attendees: '',
        type: 'meeting',
        priority: 'medium',
      });
      setIsEventModalOpen(true);
    };

    window.addEventListener('openCreateEventModal', handleOpenCreateEventModal);
    return () => {
      window.removeEventListener('openCreateEventModal', handleOpenCreateEventModal);
    };
  }, [selectedDate, form]);

  // Fetch events from Supabase
  const { data: events = [] } = useQuery({
    queryKey: ['/api/calendar/events', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('organization_id', organizationId)
        .order('date', { ascending: true });
      
      if (error) {
        console.warn('Error fetching events:', error);
        return [];
      }
      
      return data as CalendarEvent[];
    },
    enabled: !!organizationId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Omit<CalendarEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: 'Éxito',
        description: 'Evento creado correctamente',
      });
      setIsEventModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el evento',
        variant: 'destructive',
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: CalendarEvent) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', eventData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: 'Éxito',
        description: 'Evento actualizado correctamente',
      });
      setIsEventModalOpen(false);
      setEditingEvent(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el evento',
        variant: 'destructive',
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: 'Éxito',
        description: 'Evento eliminado correctamente',
      });
      setIsViewEventModalOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el evento',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    if (!organizationId) return;

    const eventData = {
      ...data,
      organization_id: organizationId,
    };

    if (editingEvent) {
      updateEventMutation.mutate({
        ...eventData,
        id: editingEvent.id,
        created_at: editingEvent.created_at,
      });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
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
    setIsViewEventModalOpen(false);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
    
    if (dayEvents.length === 0) {
      // Open create event modal with the selected date
      setEditingEvent(null);
      form.reset({
        title: '',
        description: '',
        date: format(date, 'yyyy-MM-dd'),
        time: '09:00',
        duration: '60',
        location: '',
        attendees: '',
        type: 'meeting',
        priority: 'medium',
      });
      setIsEventModalOpen(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewEventModalOpen(true);
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500';
      case 'task': return 'bg-purple-500';
      case 'reminder': return 'bg-orange-500';
      case 'appointment': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  // Calculate starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startDay = getDay(monthStart);
  const paddingDays = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus eventos y reuniones</p>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card className="bg-card border-0 shadow-md rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0 hover:bg-muted rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-lg font-semibold text-foreground">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            
            <Button
              variant="ghost"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0 hover:bg-muted rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Padding days */}
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="h-24 p-1"></div>
            ))}
            
            {/* Calendar days */}
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`h-24 p-1 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-primary/10 border-primary' : ''
                  } ${isTodayDate ? 'bg-primary/5 border-primary/30' : ''}`}
                >
                  <div className={`text-sm font-medium ${
                    isTodayDate ? 'text-primary' : 'text-foreground'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Events */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 ${getTypeColor(event.type)}`}
                      >
                        {event.time} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Creation/Edit Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título del evento" {...field} />
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
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción del evento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Hora *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (minutos) *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Duración" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="90">1.5 horas</SelectItem>
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
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de evento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridad *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Prioridad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ubicación del evento" {...field} />
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
                    <FormLabel>Asistentes</FormLabel>
                    <FormControl>
                      <Input placeholder="Lista de asistentes (separados por comas)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEventModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                >
                  {createEventMutation.isPending || updateEventMutation.isPending
                    ? 'Guardando...'
                    : editingEvent ? 'Actualizar' : 'Crear Evento'
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Event View Modal */}
      <Dialog open={isViewEventModalOpen} onOpenChange={setIsViewEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsViewEventModalOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Descripción</h4>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Fecha</h4>
                  <p className="text-sm">{format(new Date(selectedEvent.date), 'dd/MM/yyyy', { locale: es })}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Hora</h4>
                  <p className="text-sm">{selectedEvent.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Duración</h4>
                  <p className="text-sm">{selectedEvent.duration} minutos</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Tipo</h4>
                  <Badge className={`${getTypeColor(selectedEvent.type)} text-white`}>
                    {selectedEvent.type === 'meeting' ? 'Reunión' :
                     selectedEvent.type === 'task' ? 'Tarea' :
                     selectedEvent.type === 'reminder' ? 'Recordatorio' : 'Cita'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Prioridad</h4>
                  <Badge className={`${getPriorityColor(selectedEvent.priority)} text-white`}>
                    {selectedEvent.priority === 'high' ? 'Alta' :
                     selectedEvent.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
                {selectedEvent.location && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Ubicación</h4>
                    <p className="text-sm">{selectedEvent.location}</p>
                  </div>
                )}
              </div>

              {selectedEvent.attendees && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Asistentes</h4>
                  <p className="text-sm">{selectedEvent.attendees}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedEvent && handleEditEvent(selectedEvent)}
            >
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}