import { useState, useMemo, useRef, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, differenceInDays, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, FileText, DollarSign, CheckSquare, Paperclip, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GanttItem {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'bitacora' | 'movimientos' | 'tareas' | 'archivos' | 'asistentes';
  color: string;
  data?: any; // Data específica del elemento
}

interface GanttTimelineProps {
  items?: GanttItem[];
  startDate?: Date;
  endDate?: Date;
  timelineEvents?: any[];
  weekDays?: Date[];
}

// Colores para cada tipo de elemento
const typeColors = {
  bitacora: 'bg-blue-500',
  movimientos: 'bg-green-500', 
  tareas: 'bg-orange-500',
  archivos: 'bg-purple-500',
  asistentes: 'bg-pink-500'
};

const typeIcons = {
  bitacora: FileText,
  movimientos: DollarSign,
  tareas: CheckSquare,
  archivos: Paperclip,
  asistentes: Users
};

const typeLabels = {
  bitacora: 'Bitácora',
  movimientos: 'Movimientos',
  tareas: 'Tareas',
  archivos: 'Archivos',
  asistentes: 'Asistentes'
};

export default function GanttTimeline({ items = [], startDate, endDate, timelineEvents = [], weekDays: propWeekDays }: GanttTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const [showLeftNav, setShowLeftNav] = useState(false);
  const [showRightNav, setShowRightNav] = useState(false);
  
  // Centrar el día actual - mostrar 3 días antes y 3 después (7 días total)
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startDate || subDays(new Date(), 3)
  );

  // Generar muchos más días para scroll infinito
  const allDays = useMemo(() => {
    const days = [];
    // Generar 60 días: 30 antes del centro y 30 después
    const centerDate = addDays(currentWeekStart, 3);
    for (let i = -30; i <= 30; i++) {
      days.push(addDays(centerDate, i));
    }
    return days;
  }, [currentWeekStart]);

  // Los 7 días visibles siguen siendo centrados
  const weekDays = propWeekDays ? propWeekDays.slice(0, 7) : useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  }, [currentWeekStart]);

  // Scroll automático al centro al montar
  useEffect(() => {
    if (scrollContainerRef.current && allDays.length > 0) {
      const dayWidth = 96; // w-24 = 96px
      const centerPosition = 30 * dayWidth; // 30 días desde el inicio
      scrollContainerRef.current.scrollLeft = centerPosition - (scrollContainerRef.current.clientWidth / 2);
      
      // También aplicar scroll inicial a la línea de timeline individual
      if (timelineContentRef.current) {
        timelineContentRef.current.scrollLeft = centerPosition - (timelineContentRef.current.clientWidth / 2);
      }
    }
  }, [allDays]);

  // Detectar cuando necesitamos mostrar navigation
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftNav(scrollLeft > 10);
      setShowRightNav(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  // Convertir datos reales del timeline a elementos Gantt
  const convertTimelineToGantt = useMemo(() => {
    const ganttItems: GanttItem[] = [];
    
    console.log('Timeline events received:', timelineEvents);
    
    timelineEvents.forEach(dayEvent => {
      const eventDate = new Date(dayEvent.date);
      
      // Agregar site logs como bitácora
      if (dayEvent.siteLogs && dayEvent.siteLogs.length > 0) {
        dayEvent.siteLogs.forEach((log: any) => {
          ganttItems.push({
            id: `log-${log.id}`,
            title: log.comments || log.description || 'Entrada de bitácora',
            startDate: eventDate,
            endDate: eventDate,
            type: 'bitacora',
            color: typeColors.bitacora,
            data: log
          });
        });
      }

      // Agregar movimientos
      if (dayEvent.movements && dayEvent.movements.length > 0) {
        dayEvent.movements.forEach((movement: any) => {
          // Usar la fecha real del movimiento, no la fecha del evento
          const movementDate = new Date(movement.date);
          ganttItems.push({
            id: `movement-${movement.id}`,
            title: `${movement.description || 'Movimiento'} - $${movement.amount}`,
            startDate: movementDate,
            endDate: movementDate,
            type: 'movimientos',
            color: typeColors.movimientos,
            data: movement
          });
        });
      }

      // Agregar tareas (si existen en el futuro)
      dayEvent.tasks?.forEach((task: any) => {
        ganttItems.push({
          id: `task-${task.id}`,
          title: task.name || 'Tarea',
          startDate: new Date(task.start_date || eventDate),
          endDate: new Date(task.end_date || eventDate),
          type: 'tareas',
          color: typeColors.tareas,
          data: task
        });
      });

      // Agregar archivos
      dayEvent.files?.forEach((file: any) => {
        ganttItems.push({
          id: `file-${file.id}`,
          title: file.name || 'Archivo',
          startDate: eventDate,
          endDate: eventDate,
          type: 'archivos',
          color: typeColors.archivos,
          data: file
        });
      });

      // Agregar asistentes
      dayEvent.attendees?.forEach((attendee: any) => {
        ganttItems.push({
          id: `attendee-${attendee.id}`,
          title: attendee.name || 'Asistente',
          startDate: eventDate,
          endDate: eventDate,
          type: 'asistentes',
          color: typeColors.asistentes,
          data: attendee
        });
      });
    });

    return ganttItems;
  }, [timelineEvents]);

  const displayItems = items.length > 0 ? items : convertTimelineToGantt;

  // Agrupar elementos por tipo
  const itemsByType = useMemo(() => {
    const grouped: Record<string, GanttItem[]> = {
      bitacora: [],
      movimientos: [],
      tareas: [],
      archivos: [],
      asistentes: []
    };

    displayItems.forEach(item => {
      grouped[item.type].push(item);
    });

    return grouped;
  }, [displayItems]);

  // Calcular posición y ancho de un elemento en la línea de tiempo
  const getItemPosition = (item: GanttItem) => {
    const startDay = startOfDay(item.startDate);
    const endDay = startOfDay(item.endDate);
    const timelineStart = startOfDay(allDays[0]);
    const timelineEnd = startOfDay(allDays[allDays.length - 1]);

    // Check if item is visible in current timeline
    if (endDay < timelineStart || startDay > timelineEnd) {
      return null;
    }

    const startOffset = Math.max(0, differenceInDays(startDay, timelineStart));
    const duration = differenceInDays(endDay, startDay) + 1;
    const dayWidth = 96; // w-24 = 96px

    return {
      left: `${startOffset * dayWidth}px`,
      width: `${duration * dayWidth}px`
    };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -1 : 1;
    setCurrentWeekStart(addDays(currentWeekStart, days));
  };

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      
      // Sincronizar scroll de todas las filas de contenido
      const contentRows = document.querySelectorAll('.timeline-content-row');
      contentRows.forEach(row => {
        if (row instanceof HTMLElement) {
          row.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
          });
        }
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftNav(scrollLeft > 0);
      setShowRightNav(scrollLeft < scrollWidth - clientWidth - 1);
      
      // Sincronizar scroll de todas las filas de contenido
      const contentRows = document.querySelectorAll('.timeline-content-row');
      contentRows.forEach(row => {
        if (row instanceof HTMLElement && row.scrollLeft !== scrollLeft) {
          row.scrollLeft = scrollLeft;
        }
      });
    }
  };

  const handleCreateAction = (type: keyof typeof typeLabels) => {
    const eventMap = {
      bitacora: 'openCreateSiteLogModal',
      movimientos: 'openCreateMovementModal', 
      tareas: 'openCreateTaskModal',
      archivos: 'openCreateFileModal',
      asistentes: 'openCreateAttendeeModal'
    };
    
    window.dispatchEvent(new CustomEvent(eventMap[type]));
  };

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Línea de Tiempo - Vista Gantt</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentWeekStart(subDays(new Date(), 3))}
              className="flex items-center gap-2 px-3 py-1 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
            >
              <Calendar size={16} />
              <span className="text-sm font-medium">
                {format(weekDays[Math.floor(weekDays.length / 2)], 'MMM yyyy', { locale: es })}
              </span>
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Header con días */}
        <div className="grid grid-cols-[200px_1fr] gap-4 relative">
          <div className="font-medium text-sm text-muted-foreground">Tipo / Fecha</div>
          <div 
            className="relative overflow-hidden"
            onMouseEnter={() => {
              setShowLeftNav(true);
              setShowRightNav(true);
            }}
            onMouseLeave={() => {
              setShowLeftNav(false);
              setShowRightNav(false);
            }}
          >
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide"
              onScroll={handleScroll}
            >
              {allDays.map((day, index) => (
                <div key={index} className="flex-shrink-0 w-24 text-center border-l border-muted first:border-l-0">
                  <div className="text-xs text-muted-foreground py-1">
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={cn(
                    "text-sm font-medium pb-2",
                    isSameDay(day, new Date()) ? "text-primary font-bold" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation buttons */}
            {showLeftNav && (
              <button
                onClick={() => scrollTimeline('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border rounded-full p-1 shadow-sm hover:bg-accent transition-colors z-10"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {showRightNav && (
              <button
                onClick={() => scrollTimeline('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border rounded-full p-1 shadow-sm hover:bg-accent transition-colors z-10"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filas por tipo */}
      <div className="space-y-4">
        {Object.entries(typeLabels).map(([type, label]) => {
          const Icon = typeIcons[type as keyof typeof typeIcons];
          const typeItems = itemsByType[type] || [];

          return (
            <div key={type} className="grid grid-cols-[200px_1fr] gap-4 items-center min-h-[60px]">
              {/* Etiqueta del tipo */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-muted-foreground" />
                  <span className="font-medium text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({typeItems.length})
                  </span>
                </div>
                <button
                  onClick={() => handleCreateAction(type as keyof typeof typeLabels)}
                  className="p-1 hover:bg-accent rounded-md transition-colors"
                  title={`Crear ${label}`}
                >
                  <Plus size={14} className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Línea de tiempo para este tipo */}
              <div 
                className="timeline-content-row relative h-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted overflow-x-auto"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <div 
                  className="relative h-full"
                  style={{ width: `${allDays.length * 96}px` }}
                >
                  {typeItems.map((item) => {
                    const position = getItemPosition(item);
                    if (!position) {
                      return null;
                    }

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "absolute h-8 top-2 rounded-md shadow-sm cursor-pointer transition-all hover:shadow-md",
                          item.color,
                          "flex items-center justify-center text-white text-xs font-medium"
                        )}
                        style={position}
                        title={`${item.title} (${format(item.startDate, 'dd/MM')} - ${format(item.endDate, 'dd/MM')})`}
                      >
                        <span className="truncate px-2">{item.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
}