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

export default function GanttTimeline({ items = [], startDate, endDate }: GanttTimelineProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startDate || startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Datos de ejemplo para mostrar el concepto
  const sampleItems: GanttItem[] = [
    {
      id: '1',
      title: 'Reunión de inicio',
      startDate: new Date(2024, 4, 27),
      endDate: new Date(2024, 4, 27),
      type: 'bitacora',
      color: typeColors.bitacora,
      data: { description: 'Reunión inicial del proyecto' }
    },
    {
      id: '2',
      title: 'Pago inicial',
      startDate: new Date(2024, 4, 28),
      endDate: new Date(2024, 4, 28),
      type: 'movimientos',
      color: typeColors.movimientos,
      data: { amount: 50000, type: 'ingreso' }
    },
    {
      id: '3',
      title: 'Excavación',
      startDate: new Date(2024, 4, 29),
      endDate: new Date(2024, 5, 2),
      type: 'tareas',
      color: typeColors.tareas,
      data: { progress: 0.6 }
    },
    {
      id: '4',
      title: 'Planos actualizados',
      startDate: new Date(2024, 5, 1),
      endDate: new Date(2024, 5, 1),
      type: 'archivos',
      color: typeColors.archivos,
      data: { fileCount: 3 }
    },
    {
      id: '5',
      title: 'Equipo técnico',
      startDate: new Date(2024, 4, 30),
      endDate: new Date(2024, 5, 3),
      type: 'asistentes',
      color: typeColors.asistentes,
      data: { count: 5 }
    }
  ];

  const displayItems = items.length > 0 ? items : sampleItems;

  // Generar días de la semana
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 14; i++) { // Mostrar 2 semanas
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  }, [currentWeekStart]);

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
          <div className="grid grid-cols-14 gap-1">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className={cn(
                  "text-sm font-medium",
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