import { useState, useMemo, useRef, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, differenceInDays, startOfDay, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, FileText, DollarSign, CheckSquare, Paperclip, Users, Plus, User } from 'lucide-react';
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
  onItemClick?: (item: GanttItem) => void;
  onDayClick?: (date: string, dayData: any) => void;
}

// Colores para cada tipo de elemento - usando color primario con transparencia
const typeColors = {
  bitacora: 'bg-primary/50 border border-primary/30',
  movimientos: 'bg-primary/50 border border-primary/30', 
  tareas: 'bg-primary/50 border border-primary/30',
  archivos: 'bg-primary/50 border border-primary/30',
  asistentes: 'bg-primary/50 border border-primary/30'
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

export default function GanttTimeline({ items = [], startDate, endDate, timelineEvents = [], weekDays: propWeekDays, onItemClick, onDayClick }: GanttTimelineProps) {
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
      const dayWidth = 128; // w-32 = 128px
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
          // Usar parseISO para manejar fechas correctamente sin desfase de zona horaria
          const logDateString = log.log_date || log.date;
          const logDate = parseISO(logDateString + 'T12:00:00'); // Agregar hora al mediodía para evitar desfases
          ganttItems.push({
            id: `log-${log.id}`,
            title: log.comments || log.description || 'Entrada de bitácora',
            startDate: logDate,
            endDate: logDate,
            type: 'bitacora',
            color: typeColors.bitacora,
            data: log
          });
        });
      }

      // Agregar movimientos
      if (dayEvent.movements && dayEvent.movements.length > 0) {
        dayEvent.movements.forEach((movement: any) => {
          // Usar parseISO para manejar fechas correctamente sin desfase de zona horaria
          const movementDateString = movement.date;
          const movementDate = parseISO(movementDateString + 'T12:00:00'); // Agregar hora al mediodía para evitar desfases
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
    
    const dayIndex = allDays.findIndex(day => 
      format(day, 'yyyy-MM-dd') === format(startDay, 'yyyy-MM-dd')
    );
    
    if (dayIndex === -1) return null;

    return {
      position: 'absolute' as const,
      left: `${dayIndex * 128 + 4}px`,
      width: '120px',
      top: '50%',
      transform: 'translateY(-50%)'
    };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -1 : 1;
    setCurrentWeekStart(addDays(currentWeekStart, days));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfDay(new Date()));
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
    <div>
      <div className="mb-6">

        {/* Header con días */}
        <div className="grid grid-cols-[200px_1fr] gap-4 relative">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateWeek('prev')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  // Centrar en el día actual
                  setCurrentWeekStart(subDays(new Date(), 3));
                }}
                className="px-3 py-1 text-sm font-medium text-white bg-accent hover:bg-accent/80 rounded transition-colors"
              >
                Hoy
              </button>
              <button 
                onClick={() => navigateWeek('next')}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
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
                <div key={index} className="flex-shrink-0 w-32 text-center border-l border-muted first:border-l-0">
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
      <div className="space-y-3">
        {Object.entries(typeLabels).map(([type, label]) => {
          const Icon = typeIcons[type as keyof typeof typeIcons];
          const typeItems = itemsByType[type] || [];

          return (
            <div key={type} className="grid grid-cols-[200px_1fr] gap-4 items-center min-h-[30px]">
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
                className="timeline-content-row relative h-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted overflow-x-auto scrollbar-hide"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <div 
                  className="relative h-full flex"
                  style={{ width: `${allDays.length * 128}px` }}
                >
                  {/* Agrupar items por día para mostrar contadores */}
                  {(() => {
                    const itemsByDay: Record<string, typeof typeItems> = {};
                    typeItems.forEach(item => {
                      const dayKey = format(item.startDate, 'yyyy-MM-dd');
                      if (!itemsByDay[dayKey]) {
                        itemsByDay[dayKey] = [];
                      }
                      itemsByDay[dayKey].push(item);
                    });

                    return Object.entries(itemsByDay).map(([dayKey, dayItems]) => {
                      const firstItem = dayItems[0];
                      const position = getItemPosition(firstItem);
                      if (!position) {
                        return null;
                      }

                      const hasMultipleItems = dayItems.length > 1;
                      
                      // Buscar el evento del día correspondiente
                      const dayEvent = timelineEvents.find(event => event.date === dayKey);

                      return (
                        <div
                          key={`${type}-${dayKey}`}
                          className={cn(
                            "h-8 mt-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-lg hover:scale-105",
                            firstItem.color,
                            "flex items-center gap-2 px-3 text-foreground text-xs font-medium backdrop-blur-sm"
                          )}
                          style={position}
                          title={hasMultipleItems 
                            ? `${dayItems.length} eventos el ${format(firstItem.startDate, 'dd/MM')}`
                            : `${firstItem.title} (${format(firstItem.startDate, 'dd/MM')})`
                          }
                          onClick={() => {
                            // Siempre abrir el modal de lista del día, sin importar si hay 1 o varios items
                            if (onDayClick && dayEvent) {
                              onDayClick(dayKey, dayEvent);
                            }
                          }}
                        >
                          {/* Avatar del usuario */}
                          <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">
                              {(() => {
                                // Obtener las iniciales del usuario que creó el item
                                const userData = firstItem.data;
                                if (userData?.author_full_name) {
                                  return userData.author_full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                                }
                                if (userData?.created_by_name) {
                                  return userData.created_by_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                                }
                                return 'MS'; // Fallback para tu usuario
                              })()}
                            </span>
                          </div>
                          
                          {/* Contenido del elemento */}
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="truncate">
                              {hasMultipleItems 
                                ? `${dayItems.length} eventos`
                                : firstItem.title
                              }
                            </span>
                          </div>
                          
                          {/* Indicador de cantidad si hay múltiples */}
                          {hasMultipleItems && (
                            <div className="w-5 h-5 bg-primary/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">{dayItems.length}</span>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
}