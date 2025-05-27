import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DayCard from './DayCard';
import { Skeleton } from '@/components/ui/skeleton';

interface DayEvent {
  date: string;
  siteLogs: any[];
  movements: any[];
  tasks: any[];
  attendees: any[];
  files: any[];
}

interface TimelineWorkspaceProps {
  weekEvents: DayEvent[];
  weekDays: Date[];
  isLoading: boolean;
  onDayClick: (dayEvent: DayEvent) => void;
}

export default function TimelineWorkspace({ 
  weekEvents, 
  weekDays, 
  isLoading, 
  onDayClick 
}: TimelineWorkspaceProps) {
  
  if (isLoading) {
    return (
      <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Crear un mapa para acceso rápido a eventos por fecha
  const eventsByDate = weekEvents.reduce((acc, event) => {
    acc[event.date] = event;
    return acc;
  }, {} as Record<string, DayEvent>);

  return (
    <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
      {/* Timeline Header */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center">
            <div className="text-sm font-medium text-muted-foreground uppercase">
              {format(day, 'EEE', { locale: es })}
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {format(day, 'dd')}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Body */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvent = eventsByDate[dateKey] || {
            date: dateKey,
            siteLogs: [],
            movements: [],
            tasks: [],
            attendees: [],
            files: []
          };

          return (
            <DayCard
              key={dateKey}
              dayEvent={dayEvent}
              isToday={format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
              onClick={() => onDayClick(dayEvent)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Bitácora</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Movimientos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Tareas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Archivos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Asistentes</span>
          </div>
        </div>
      </div>
    </div>
  );
}