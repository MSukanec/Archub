import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import TimelineWorkspace from '@/components/timeline/TimelineWorkspace';
import DayDetailModal from '@/components/timeline/DayDetailModal';
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
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    return addDays(today, mondayOffset);
  });

  // Generar array de días para la semana actual
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Fetch todos los eventos para la semana actual
  const { data: weekEvents = [], isLoading } = useQuery({
    queryKey: ['/api/timeline-events', projectId, format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!projectId) return [];
      
      const weekStart = startOfDay(currentWeekStart);
      const weekEnd = endOfDay(addDays(currentWeekStart, 6));
      
      // Fetch site logs
      const { data: siteLogs } = await supabase
        .from('site_logs')
        .select(`
          *,
          site_log_tasks(*),
          site_log_attendees(*),
          site_log_files(*)
        `)
        .eq('project_id', projectId)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      // Fetch site movements
      const { data: movements } = await supabase
        .from('site_movements')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      // Agrupar eventos por fecha
      const eventsByDate: Record<string, DayEvent> = {};
      
      // Inicializar todos los días de la semana
      weekDays.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        eventsByDate[dateKey] = {
          date: dateKey,
          siteLogs: [],
          movements: [],
          tasks: [],
          attendees: [],
          files: []
        };
      });

      // Agregar site logs
      siteLogs?.forEach(log => {
        if (eventsByDate[log.date]) {
          eventsByDate[log.date].siteLogs.push(log);
          eventsByDate[log.date].tasks.push(...(log.site_log_tasks || []));
          eventsByDate[log.date].attendees.push(...(log.site_log_attendees || []));
          eventsByDate[log.date].files.push(...(log.site_log_files || []));
        }
      });

      // Agregar movements
      movements?.forEach(movement => {
        if (eventsByDate[movement.date]) {
          eventsByDate[movement.date].movements.push(movement);
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => 
      direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7)
    );
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    setCurrentWeekStart(addDays(today, mondayOffset));
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
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Display */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          {format(currentWeekStart, 'dd', { locale: es })} - {format(addDays(currentWeekStart, 6), 'dd MMMM yyyy', { locale: es })}
        </h2>
      </div>

      {/* Timeline */}
      <TimelineWorkspace 
        weekEvents={weekEvents}
        weekDays={weekDays}
        isLoading={isLoading}
        onDayClick={handleDayClick}
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