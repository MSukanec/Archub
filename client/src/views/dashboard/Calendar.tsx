import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// TODO: Replace with actual calendar events from database
const events: Event[] = [];

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

  const selectedDateEvents = events.filter(
    event => selectedDate && format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const upcomingEvents = events
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Calendario
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona eventos y citas del proyecto
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsEventModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Evento</span>
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendario del Proyecto</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md border"
              modifiers={{
                hasEvent: events.map((event: Event) => event.date)
              }}
              modifiersStyles={{
                hasEvent: { backgroundColor: 'hsl(var(--primary))', color: 'white', fontWeight: 'bold' }
              }}
            />
          </CardContent>
        </Card>

        {/* Events for selected date */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: es }) : 'Selecciona una fecha'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-2">
                            {event.title}
                          </h4>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {event.time}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {event.location}
                                </span>
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <Users className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {event.attendees.length} asistente{event.attendees.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={getEventTypeColor(event.type)}>
                          {getEventTypeBadge(event.type)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-3">No hay eventos para esta fecha</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEventModalOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear evento</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type).includes('blue') ? 'bg-blue-500' : getEventTypeColor(event.type).includes('red') ? 'bg-red-500' : 'bg-green-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.date, 'dd MMM', { locale: es })} • {event.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No hay eventos próximos
                </p>
              )}
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