import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, User, MapPin, Clock } from 'lucide-react';
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

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Inspección de obra',
    date: new Date(2025, 4, 31),
    time: '09:00',
    location: 'Sitio de construcción',
    attendees: ['Juan Pérez', 'María García'],
    type: 'inspection'
  },
  {
    id: '2',
    title: 'Reunión con cliente',
    date: new Date(2025, 5, 2),
    time: '14:30',
    location: 'Oficina central',
    attendees: ['Cliente ABC', 'Arquitecto'],
    type: 'meeting'
  },
  {
    id: '3',
    title: 'Entrega de materiales',
    date: new Date(2025, 5, 5),
    time: '08:00',
    location: 'Depósito',
    type: 'deadline'
  }
];

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

  const selectedDateEvents = mockEvents.filter(
    event => selectedDate && format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const upcomingEvents = mockEvents
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

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
                hasEvent: mockEvents.map(event => event.date)
              }}
              modifiersStyles={{
                hasEvent: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }
              }}
            />
          </CardContent>
        </Card>

        {/* Events for selected date */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: es }) : 'Selecciona una fecha'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {event.time}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-2 mt-1">
                              <MapPin className="w-3 h-3 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {event.location}
                              </span>
                            </div>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center space-x-2 mt-1">
                              <User className="w-3 h-3 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {event.attendees.length} asistente{event.attendees.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {getEventTypeBadge(event.type)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay eventos para esta fecha</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setIsEventModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear evento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {format(event.date, 'dd MMM', { locale: es })} • {event.time}
                      </p>
                    </div>
                  </div>
                ))}
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