import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import TimelineWorkspace from '@/components/timeline/TimelineWorkspace';
import DayDetailModal from '@/components/timeline/DayDetailModal';
import GanttTimeline from '@/components/timeline/GanttTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayEvent {
  date: string;
  siteLogs: any[];
  movements: any[];
  tasks: any[];
  attendees: any[];
  files: any[];
}

export default function Dashboard() {
  const { projectId } = useUserContextStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewStartDate, setViewStartDate] = useState(() => {
    // Mostrar 15 días antes de hoy y 15 días después (30 días total)
    return subDays(new Date(), 15);
  });

  // Generar array de días para el período visible (30 días)
  const visibleDays = Array.from({ length: 30 }, (_, i) => addDays(viewStartDate, i));

  // Fetch todos los eventos para el período visible
  const { data: timelineEvents = [], isLoading } = useQuery({
    queryKey: ['/api/timeline-events', projectId, format(viewStartDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Usar el mismo rango que el GanttTimeline (60 días centrados en hoy)
      const today = new Date();
      const periodStart = startOfDay(addDays(today, -30));
      const periodEnd = endOfDay(addDays(today, 30));
      
      // Fetch site logs
      const { data: siteLogs, error: siteLogsError } = await supabase
        .from('site_logs')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', format(periodStart, 'yyyy-MM-dd'))
        .lte('date', format(periodEnd, 'yyyy-MM-dd'));
        
      if (siteLogsError) {
        console.error('Error fetching site logs:', siteLogsError);
      } else {
        console.log('Site logs fetched:', siteLogs);
      }

      // Fetch site movements
      const { data: movements, error: movementsError } = await supabase
        .from('site_movements')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', format(periodStart, 'yyyy-MM-dd'))
        .lte('date', format(periodEnd, 'yyyy-MM-dd'));
        
      if (movementsError) {
        console.error('Error fetching site movements:', movementsError);
      } else {
        console.log('Site movements fetched:', movements);
      }

      // Agrupar eventos por fecha
      const eventsByDate: Record<string, DayEvent> = {};
      
      // Inicializar todos los días del período (60 días centrados en hoy)
      for (let i = -30; i <= 30; i++) {
        const day = addDays(today, i);
        const dateKey = format(day, 'yyyy-MM-dd');
        eventsByDate[dateKey] = {
          date: dateKey,
          siteLogs: [],
          movements: [],
          tasks: [],
          attendees: [],
          files: []
        };
      }

      // Agregar site logs
      siteLogs?.forEach(log => {
        const logDate = format(new Date(log.date), 'yyyy-MM-dd');
        if (eventsByDate[logDate]) {
          eventsByDate[logDate].siteLogs.push(log);
        }
      });

      // Agregar movements
      movements?.forEach(movement => {
        const movementDate = format(new Date(movement.date), 'yyyy-MM-dd');
        if (eventsByDate[movementDate]) {
          eventsByDate[movementDate].movements.push(movement);
        }
      });

      return Object.values(eventsByDate);
    },
    enabled: !!projectId
  });

  const handleDayClick = (dayEvent: DayEvent) => {
    setSelectedDay(dayEvent);
    setIsModalOpen(true);
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    setViewStartDate(prev => 
      direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7)
    );
  };

  const goToToday = () => {
    setViewStartDate(subDays(new Date(), 15)); // Centrar el día actual
  };

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateBudgetModal = () => {
      window.dispatchEvent(new CustomEvent('openCreateBudgetModal'));
    };

    const handleOpenCreateSiteLogModal = () => {
      window.dispatchEvent(new CustomEvent('openCreateSiteLogModal'));
    };

    const handleOpenCreateMovementModal = () => {
      window.dispatchEvent(new CustomEvent('openCreateMovementModal'));
    };

    const handleOpenCreateTaskModal = () => {
      window.dispatchEvent(new CustomEvent('openCreateTaskModal'));
    };

    const handleOpenCreateContactModal = () => {
      window.dispatchEvent(new CustomEvent('openCreateContactModal'));
    };

    window.addEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);
    window.addEventListener('openCreateSiteLogModal', handleOpenCreateSiteLogModal);
    window.addEventListener('openCreateMovementModal', handleOpenCreateMovementModal);
    window.addEventListener('openCreateTaskModal', handleOpenCreateTaskModal);
    window.addEventListener('openCreateContactModal', handleOpenCreateContactModal);
    
    return () => {
      window.removeEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);
      window.removeEventListener('openCreateSiteLogModal', handleOpenCreateSiteLogModal);
      window.removeEventListener('openCreateMovementModal', handleOpenCreateMovementModal);
      window.removeEventListener('openCreateTaskModal', handleOpenCreateTaskModal);
      window.removeEventListener('openCreateContactModal', handleOpenCreateContactModal);
    };
  }, []);

  if (!projectId) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Línea de Tiempo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Selecciona un proyecto para ver la línea de tiempo de eventos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Línea de Tiempo</h1>
          <p className="text-muted-foreground">
            Visualiza todos los eventos diarios de tu proyecto
          </p>
        </div>
        

      </div>

      {/* Vista Gantt */}
      <GanttTimeline 
        timelineEvents={timelineEvents}
        weekDays={visibleDays.slice(15 - 3, 15 + 4)} // 7 días centrados en hoy
        startDate={subDays(new Date(), 3)}
        endDate={addDays(new Date(), 3)}
      />

      {/* Detail Modal */}
      <DayDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayEvent={selectedDay}
      />
    </div>
  );
}