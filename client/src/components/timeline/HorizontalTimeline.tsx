import { useState, useRef, useEffect } from 'react';
import { format, parseISO, differenceInDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TimelineEvent {
  id: string;
  type: 'bitacora' | 'movimiento' | 'tarea';
  title: string;
  description?: string;
  date: string;
  amount?: number;
  currency?: string;
  data?: any;
}

interface HorizontalTimelineProps {
  events?: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  onCreateEvent?: (type: string, date: string) => void;
}

const typeConfig = {
  bitacora: {
    icon: Calendar,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100',
    label: 'Bitácora'
  },
  movimiento: {
    icon: DollarSign,
    color: 'bg-primary',
    lightColor: 'bg-orange-100',
    label: 'Movimiento'
  },
  tarea: {
    icon: CheckSquare,
    color: 'bg-green-500',
    lightColor: 'bg-green-100',
    label: 'Tarea'
  }
};

export default function HorizontalTimeline({ 
  events = [], 
  onEventClick, 
  onCreateEvent 
}: HorizontalTimelineProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['bitacora', 'movimiento', 'tarea']);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // Datos de ejemplo mientras integramos con los datos reales
  const sampleEvents: TimelineEvent[] = [
    {
      id: '1',
      type: 'bitacora',
      title: 'Inicio de obra',
      description: 'Se dio inicio a la construcción del proyecto',
      date: '2025-05-01'
    },
    {
      id: '2',
      type: 'movimiento',
      title: 'Compra de materiales',
      description: 'Adquisición de cemento y hierro',
      date: '2025-05-15',
      amount: 150000,
      currency: 'ARS'
    },
    {
      id: '3',
      type: 'tarea',
      title: 'Excavación completada',
      description: 'Finalización de trabajos de excavación',
      date: '2025-05-20'
    },
    {
      id: '4',
      type: 'movimiento',
      title: 'Pago a contratista',
      description: 'Pago mensual al equipo de construcción',
      date: '2025-05-25',
      amount: 400000,
      currency: 'ARS'
    }
  ];

  const allEvents = [...sampleEvents, ...events];
  
  // Filtrar eventos
  const filteredEvents = allEvents.filter(event => selectedFilters.includes(event.type));
  
  // Obtener rango de fechas
  const today = new Date();
  const eventDates = filteredEvents.map(e => parseISO(e.date));
  const minDate = eventDates.length > 0 ? new Date(Math.min(...eventDates.map(d => d.getTime()))) : new Date();
  const maxDate = new Date(Math.max(today.getTime(), ...eventDates.map(d => d.getTime())));
  
  // Agregar padding a las fechas
  const startDate = new Date(minDate);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(maxDate);
  endDate.setDate(endDate.getDate() + 30);
  
  const totalDays = differenceInDays(endDate, startDate);
  const dayWidth = 120; // Ancho por día en px
  const timelineWidth = totalDays * dayWidth;

  // Auto-scroll a "Hoy" al montar
  useEffect(() => {
    if (todayRef.current && timelineRef.current) {
      const todayPosition = differenceInDays(today, startDate) * dayWidth;
      const containerWidth = timelineRef.current.clientWidth;
      timelineRef.current.scrollLeft = todayPosition - containerWidth / 2;
    }
  }, []);

  // Calcular posición de eventos
  const getEventPosition = (date: string) => {
    const eventDate = parseISO(date);
    const daysDiff = differenceInDays(eventDate, startDate);
    return daysDiff * dayWidth;
  };

  // Agrupar eventos por fecha
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const dateKey = event.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const toggleFilter = (type: string) => {
    setSelectedFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const scrollToToday = () => {
    if (todayRef.current && timelineRef.current) {
      const todayPosition = differenceInDays(today, startDate) * dayWidth;
      const containerWidth = timelineRef.current.clientWidth;
      timelineRef.current.scrollTo({
        left: todayPosition - containerWidth / 2,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-muted/10 rounded-2xl p-6 shadow-md border-0">
      {/* Header con filtros */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Línea de Tiempo del Proyecto</h2>
            <p className="text-sm text-muted-foreground">Evolución cronológica de la obra</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtros */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Tipos de eventos</h4>
                {Object.entries(typeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <label key={type} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(type)}
                        onChange={() => toggleFilter(type)}
                        className="rounded"
                      />
                      <div className={cn("w-4 h-4 rounded-full", config.color)} />
                      <span className="text-sm">{config.label}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Botón Hoy */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={scrollToToday}
            className="rounded-xl bg-primary hover:bg-primary/80"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Hoy
          </Button>
        </div>
      </div>

      {/* Timeline container */}
      <div className="relative">
        <div 
          ref={timelineRef}
          className="overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div 
            className="relative h-32"
            style={{ width: `${timelineWidth}px` }}
          >
            {/* Línea base */}
            <div className="absolute top-16 left-0 right-0 h-0.5 bg-border" />
            
            {/* Marcador de HOY */}
            <div 
              ref={todayRef}
              className="absolute top-0 bottom-0 z-20"
              style={{ left: `${getEventPosition(format(today, 'yyyy-MM-dd'))}px` }}
            >
              <div className="w-0.5 h-full bg-primary" />
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-white text-xs px-2 py-1 rounded-md font-medium">
                  HOY
                </div>
              </div>
            </div>

            {/* Eventos */}
            <TooltipProvider>
              {Object.entries(eventsByDate).map(([date, dayEvents]) => {
                const position = getEventPosition(date);
                const isToday = isSameDay(parseISO(date), today);
                
                return (
                  <div
                    key={date}
                    className="absolute z-10"
                    style={{ 
                      left: `${position - 20}px`,
                      top: '40px',
                      width: '40px'
                    }}
                  >
                    {dayEvents.map((event, index) => {
                      const config = typeConfig[event.type];
                      const Icon = config.icon;
                      const eventY = index * 50; // Separar eventos verticalmente si hay múltiples
                      
                      return (
                        <Tooltip key={event.id}>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                "absolute w-10 h-10 rounded-full border-2 border-white shadow-lg",
                                "hover:scale-110 transition-all duration-200 cursor-pointer",
                                "flex items-center justify-center",
                                config.color,
                                hoveredEvent === event.id && "scale-110 ring-2 ring-primary/50"
                              )}
                              style={{ top: `${eventY}px` }}
                              onClick={() => onEventClick?.(event)}
                              onMouseEnter={() => setHoveredEvent(event.id)}
                              onMouseLeave={() => setHoveredEvent(null)}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-64">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", config.color)} />
                                <span className="font-medium">{event.title}</span>
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(event.date), 'dd/MM/yyyy', { locale: es })}
                              </div>
                              {event.amount && (
                                <div className="text-sm font-medium text-primary">
                                  {event.currency} ${event.amount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        {Object.entries(typeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", config.color)} />
              <span className="text-sm text-muted-foreground">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}