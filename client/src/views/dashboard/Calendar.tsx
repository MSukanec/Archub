import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, MapPin, Users, CheckCircle, DollarSign, FileText, Plus, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow, isAfter, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import EventModal from '@/components/modals/EventModal';

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'deadline' | 'inspection' | 'other';
}

// Events will be loaded from database

// Custom Calendar Component
interface CustomCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  events: Event[];
}

const CustomCalendar = ({ currentMonth, onMonthChange, selectedDate, onDateSelect, events }: CustomCalendarProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500';
      case 'deadline':
        return 'bg-red-500';
      case 'inspection':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday Headers */}
        {weekdays.map((day) => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={index}
              className={`
                h-24 p-1 border border-gray-200 cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400'}
                ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}
                ${isToday ? 'bg-primary/10' : ''}
              `}
              onClick={() => onDateSelect(day)}
            >
              <div className="h-full flex flex-col">
                <div className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="flex-1 space-y-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={event.id}
                      className={`
                        text-xs px-1 py-0.5 rounded text-white truncate
                        ${getEventTypeColor(event.type)}
                      `}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getEventTypeIcon = (type: Event['type']) => {
  switch (type) {
    case 'meeting':
      return Users;
    case 'deadline':
      return Clock;
    case 'inspection':
      return CheckCircle;
    default:
      return CalendarIcon;
  }
};

const getEventTypeColor = (type: Event['type']) => {
  switch (type) {
    case 'meeting':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'deadline':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'inspection':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getEventTypeBadge = (type: Event['type']) => {
  switch (type) {
    case 'meeting':
      return 'Reunión';
    case 'deadline':
      return 'Plazo';
    case 'inspection':
      return 'Inspección';
    default:
      return 'Otro';
  }
};

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { projectId, organizationId } = useUserContextStore();

  // TODO: Connect to actual calendar events when table is available
  // Temporary demo events to show visual design
  const events: Event[] = [
    {
      id: '1',
      title: 'Inspección de obra',
      date: new Date(2025, 4, 31), // May 31, 2025
      time: '09:00',
      location: 'Sitio de construcción',
      type: 'inspection'
    },
    {
      id: '2',
      title: 'Reunión con cliente',
      date: new Date(2025, 5, 2), // June 2, 2025
      time: '14:30',
      location: 'Oficina central',
      type: 'meeting'
    },
    {
      id: '3',
      title: 'Entrega de materiales',
      date: new Date(2025, 5, 5), // June 5, 2025
      time: '08:00',
      type: 'deadline'
    },
    {
      id: '4',
      title: 'Supervisión estructural',
      date: new Date(2025, 5, 7), // June 7, 2025
      time: '10:00',
      type: 'inspection'
    }
  ];

  const selectedDateEvents = events.filter(
    event => selectedDate && format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  // Group upcoming events by date categories
  const groupedUpcomingEvents = () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    const todayEvents = events.filter((event: Event) => isToday(event.date));
    const tomorrowEvents = events.filter((event: Event) => isTomorrow(event.date));
    const upcomingEvents = events.filter((event: Event) => 
      isAfter(event.date, tomorrow) && event.date <= nextWeek
    );

    return {
      today: todayEvents,
      tomorrow: tomorrowEvents,
      upcoming: upcomingEvents
    };
  };

  const eventGroups = groupedUpcomingEvents();
  
  // Calculate day summary - TODO: Replace with actual data queries
  const getDaySummary = () => {
    if (!selectedDate) return null;
    
    // This would query actual database data for the selected date
    const activeTasks = 0; // Query tasks for selected date
    const totalIncome = 0; // Query movements where amount > 0 for selected date
    const totalExpenses = 0; // Query movements where amount < 0 for selected date
    const attendeesRegistered = 0; // Query contacts/attendees for selected date
    const hasBitacora = false; // Query if bitacora entries exist for selected date
    
    const hasActivity = activeTasks > 0 || totalIncome > 0 || totalExpenses > 0 || attendeesRegistered > 0 || hasBitacora;
    
    return {
      activeTasks,
      totalIncome,
      totalExpenses,
      attendeesRegistered,
      hasBitacora,
      hasActivity
    };
  };

  const daySummary = getDaySummary();

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Calendario
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona eventos y citas del proyecto
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 rounded-2xl shadow-md bg-[#e1e1e1] border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendario del Proyecto</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-800 rounded-lg p-4">
              {/* Month Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
                    className="text-white hover:bg-gray-700"
                  >
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
                    className="text-white hover:bg-gray-700"
                  >
                    →
                  </Button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SAB'].map(day => (
                  <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {eachDayOfInterval({
                  start: startOfMonth(currentMonth),
                  end: endOfMonth(currentMonth)
                }).map((day) => {
                  const dayEvents = events.filter(event => isSameDay(event.date, day));
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative h-16 p-1 rounded cursor-pointer transition-colors
                        ${isSelected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}
                        ${!isCurrentMonth ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="text-white text-sm">
                        {format(day, 'd')}
                      </div>
                      
                      {/* Event indicators */}
                      <div className="absolute bottom-1 left-1 right-1 flex gap-1 flex-wrap">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`
                              w-2 h-2 rounded-full
                              ${event.type === 'meeting' ? 'bg-blue-400' : 
                                event.type === 'inspection' ? 'bg-green-400' : 
                                event.type === 'deadline' ? 'bg-red-400' : 'bg-purple-400'}
                            `}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-300">+{dayEvents.length - 3}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Summary and Events */}
        <div className="space-y-6">
          {/* Day Summary */}
          <Card className="rounded-2xl shadow-md bg-[#e1e1e1] border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground">
                Resumen del día
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: es }) : 'Selecciona una fecha'}
              </p>
            </CardHeader>
            <CardContent>
              {daySummary && daySummary.hasActivity ? (
                <div className="space-y-3">
                  {daySummary.activeTasks > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Tareas activas</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{daySummary.activeTasks}</span>
                    </div>
                  )}
                  
                  {(daySummary.totalIncome > 0 || daySummary.totalExpenses > 0) && (
                    <div className="space-y-2">
                      {daySummary.totalIncome > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">Ingresos</span>
                          </div>
                          <span className="text-sm font-medium text-green-600">${daySummary.totalIncome.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {daySummary.totalExpenses > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-muted-foreground">Egresos</span>
                          </div>
                          <span className="text-sm font-medium text-red-600">-${daySummary.totalExpenses.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {daySummary.attendeesRegistered > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Asistentes registrados</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{daySummary.attendeesRegistered}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Bitácora</span>
                    </div>
                    <span className={`text-sm font-medium ${daySummary.hasBitacora ? 'text-green-600' : 'text-red-600'}`}>
                      {daySummary.hasBitacora ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-3 text-sm">No hay actividad registrada para este día</p>
                  <p className="text-xs text-muted-foreground mb-3">¿Querés cargar algo?</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEventModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Registrar Evento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="rounded-2xl shadow-md bg-[#e1e1e1] border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-foreground">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Today */}
                {eventGroups.today.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-xs font-medium text-foreground">Hoy</span>
                    </div>
                    <div className="space-y-2">
                      {eventGroups.today.map(event => {
                        const IconComponent = getEventTypeIcon(event.type);
                        return (
                          <div key={event.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <IconComponent className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.time}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tomorrow */}
                {eventGroups.tomorrow.length > 0 && (
                  <div>
                    {eventGroups.today.length > 0 && <Separator className="my-3" />}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-xs font-medium text-foreground">Mañana</span>
                    </div>
                    <div className="space-y-2">
                      {eventGroups.tomorrow.map(event => {
                        const IconComponent = getEventTypeIcon(event.type);
                        return (
                          <div key={event.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <IconComponent className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.time}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Próximos 7 días */}
                {eventGroups.upcoming.length > 0 && (
                  <div>
                    {(eventGroups.today.length > 0 || eventGroups.tomorrow.length > 0) && <Separator className="my-3" />}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-medium text-foreground">Próximos 7 días</span>
                    </div>
                    <div className="space-y-2">
                      {eventGroups.upcoming.map(event => {
                        const IconComponent = getEventTypeIcon(event.type);
                        return (
                          <div key={event.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <IconComponent className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(event.date, 'dd MMM', { locale: es })} • {event.time}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No events */}
                {eventGroups.today.length === 0 && eventGroups.tomorrow.length === 0 && eventGroups.upcoming.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No hay eventos programados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EventModal 
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={(data) => {
          console.log('Event created:', data);
          setIsEventModalOpen(false);
        }}
        isSubmitting={false}
      />
    </div>
  );
}