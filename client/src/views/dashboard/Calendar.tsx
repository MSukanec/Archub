import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, User, Users, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
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
      return '#3b82f6';
    case 'deadline':
      return '#ef4444';
    case 'inspection':
      return '#10b981';
    default:
      return '#6b7280';
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
    <div className="h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#0d1117]">
      {/* Header */}
      <div className="p-6 border-b border-[#e1e4e8] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0969da]/10 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-[#0969da]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#24292f] dark:text-[#f0f6fc]">
                Calendario
              </h1>
              <p className="text-sm text-[#656d76] dark:text-[#8b949e]">
                Gestiona eventos y citas del proyecto
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0969da] hover:bg-[#0860ca] text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2 bg-white dark:bg-[#161b22] rounded-lg border border-[#d0d7de] dark:border-[#30363d]">
              <div className="p-4 border-b border-[#d0d7de] dark:border-[#30363d]">
                <h2 className="text-lg font-semibold text-[#24292f] dark:text-[#f0f6fc] flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-[#656d76] dark:text-[#8b949e]" />
                  <span>Calendario del Proyecto</span>
                </h2>
              </div>
              <div className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={es}
                  className="rounded-md"
                  modifiers={{
                    hasEvent: mockEvents.map(event => event.date)
                  }}
                  modifiersStyles={{
                    hasEvent: { backgroundColor: '#0969da', color: 'white', fontWeight: 'bold' }
                  }}
                />
              </div>
            </div>

            {/* Events for selected date */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#161b22] rounded-lg border border-[#d0d7de] dark:border-[#30363d]">
                <div className="p-4 border-b border-[#d0d7de] dark:border-[#30363d]">
                  <h3 className="text-lg font-semibold text-[#24292f] dark:text-[#f0f6fc]">
                    {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: es }) : 'Selecciona una fecha'}
                  </h3>
                </div>
                <div className="p-4">
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map(event => (
                        <div 
                          key={event.id} 
                          className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-3 hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-[#24292f] dark:text-[#f0f6fc] mb-2">
                                {event.title}
                              </h4>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3 h-3 text-[#656d76] dark:text-[#8b949e]" />
                                  <span className="text-sm text-[#656d76] dark:text-[#8b949e]">
                                    {event.time}
                                  </span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="w-3 h-3 text-[#656d76] dark:text-[#8b949e]" />
                                    <span className="text-sm text-[#656d76] dark:text-[#8b949e]">
                                      {event.location}
                                    </span>
                                  </div>
                                )}
                                {event.attendees && event.attendees.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <Users className="w-3 h-3 text-[#656d76] dark:text-[#8b949e]" />
                                    <span className="text-sm text-[#656d76] dark:text-[#8b949e]">
                                      {event.attendees.length} asistente{event.attendees.length > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div 
                              className="px-2 py-1 rounded text-xs font-medium text-white ml-2"
                              style={{ backgroundColor: getEventTypeColor(event.type) }}
                            >
                              {getEventTypeBadge(event.type)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-[#656d76] dark:text-[#8b949e] opacity-50" />
                      <p className="text-[#656d76] dark:text-[#8b949e] mb-3">No hay eventos para esta fecha</p>
                      <button 
                        onClick={() => setIsEventModalOpen(true)}
                        className="px-3 py-1 text-sm border border-[#d0d7de] dark:border-[#30363d] rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Crear evento</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming events */}
              <div className="bg-white dark:bg-[#161b22] rounded-lg border border-[#d0d7de] dark:border-[#30363d]">
                <div className="p-4 border-b border-[#d0d7de] dark:border-[#30363d]">
                  <h3 className="text-lg font-semibold text-[#24292f] dark:text-[#f0f6fc]">Próximos Eventos</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getEventTypeColor(event.type) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#24292f] dark:text-[#f0f6fc] truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-[#656d76] dark:text-[#8b949e]">
                            {format(event.date, 'dd MMM', { locale: es })} • {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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