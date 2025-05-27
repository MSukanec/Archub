import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, FileText, DollarSign, CheckSquare, Paperclip, Users } from 'lucide-react';
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
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startDate || startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Usar los días proporcionados desde el Dashboard o generar los propios
  const weekDays = propWeekDays || useMemo(() => {
    const days = [];
    for (let i = 0; i < 14; i++) { // Mostrar 2 semanas
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  }, [currentWeekStart]);

  // Convertir datos reales del timeline a elementos Gantt
  const convertTimelineToGantt = useMemo(() => {
    const ganttItems: GanttItem[] = [];
    
    timelineEvents.forEach(dayEvent => {
      const eventDate = new Date(dayEvent.date);
      
      // Agregar site logs como bitácora
      dayEvent.siteLogs?.forEach((log: any) => {
        ganttItems.push({
          id: `log-${log.id}`,
          title: log.comments || 'Entrada de bitácora',
          startDate: eventDate,
          endDate: eventDate,
          type: 'bitacora',
          color: typeColors.bitacora,
          data: log
        });
      });

      // Agregar movimientos
      dayEvent.movements?.forEach((movement: any) => {
        ganttItems.push({
          id: `movement-${movement.id}`,
          title: `${movement.description || 'Movimiento'} - $${movement.amount}`,
          startDate: eventDate,
          endDate: eventDate,
          type: 'movimientos',
          color: typeColors.movimientos,
          data: movement
        });
      });

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
    const timelineStart = startOfDay(weekDays[0]);
    const timelineEnd = startOfDay(weekDays[weekDays.length - 1]);

    // Check if item is visible in current timeline
    if (endDay < timelineStart || startDay > timelineEnd) {
      return null;
    }

    const startOffset = Math.max(0, differenceInDays(startDay, timelineStart));
    const duration = differenceInDays(endDay, startDay) + 1;
    const dayWidth = 100 / weekDays.length; // Porcentaje por día

    return {
      left: `${startOffset * dayWidth}%`,
      width: `${duration * dayWidth}%`
    };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7;
    setCurrentWeekStart(addDays(currentWeekStart, days));
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
            <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-lg">
              <Calendar size={16} />
              <span className="text-sm font-medium">
                {format(currentWeekStart, 'MMM yyyy', { locale: es })}
              </span>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Header con días */}
        <div className="grid grid-cols-[200px_1fr] gap-4">
          <div className="font-medium text-sm text-muted-foreground">Tipo / Fecha</div>
          <div className="flex">
            {weekDays.map((day, index) => (
              <div key={index} className="flex-1 text-center border-l border-muted first:border-l-0">
                <div className="text-xs text-muted-foreground py-1">
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className={cn(
                  "text-sm font-medium pb-2",
                  isSameDay(day, new Date()) ? "text-primary" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
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
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Icon size={16} className="text-muted-foreground" />
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">
                  ({typeItems.length})
                </span>
              </div>

              {/* Línea de tiempo para este tipo */}
              <div className="relative h-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                {typeItems.map((item) => {
                  const position = getItemPosition(item);
                  if (!position) return null;

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
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Leyenda:</span>
          {Object.entries(typeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded", typeColors[type as keyof typeof typeColors])} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}