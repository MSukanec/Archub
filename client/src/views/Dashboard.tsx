import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import HorizontalTimeline from '@/components/timeline/HorizontalTimeline';
import SiteLogModal from '@/components/modals/SiteLogModal';
import MovementModal from '@/components/modals/MovementModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FolderKanban, BarChart3, Building2, Plus } from 'lucide-react';
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

  // Obtener datos del proyecto activo
  const { data: activeProject } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (error) {
        console.error('Error fetching project:', error);
        return null;
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
    retry: 1
  });
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSiteLogModalOpen, setIsSiteLogModalOpen] = useState(false);
  const [selectedSiteLog, setSelectedSiteLog] = useState<any | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [viewStartDate, setViewStartDate] = useState(() => {
    // Mostrar 3 días antes de hoy y 3 después (7 días total)
    return subDays(new Date(), 3);
  });

  // Generar array de días para el período visible (7 días)
  const visibleDays = Array.from({ length: 7 }, (_, i) => addDays(viewStartDate, i));

  // Función para convertir los datos del timeline a eventos para el timeline horizontal
  const convertToTimelineEvents = (timelineData: DayEvent[]) => {
    const events: any[] = [];
    
    timelineData.forEach(dayEvent => {
      // Agregar bitácoras
      dayEvent.siteLogs?.forEach(log => {
        events.push({
          id: `sitelog-${log.id}`,
          type: 'bitacora',
          title: log.comments || log.description || 'Entrada de bitácora',
          description: log.comments || log.description,
          date: log.log_date || log.date,
          data: log
        });
      });

      // Agregar movimientos
      dayEvent.movements?.forEach(movement => {
        events.push({
          id: `movement-${movement.id}`,
          type: 'movimiento',
          title: `${movement.description || 'Movimiento financiero'}`,
          description: movement.description,
          date: movement.date,
          amount: movement.amount,
          currency: movement.currency,
          data: movement
        });
      });

      // Agregar tareas
      dayEvent.tasks?.forEach(task => {
        events.push({
          id: `task-${task.id}`,
          type: 'tarea',
          title: task.name || 'Tarea',
          description: task.description,
          date: task.start_date || dayEvent.date,
          data: task
        });
      });
    });

    return events;
  };

  // Manejar click en eventos del timeline
  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
    
    if (event.type === 'bitacora') {
      setSelectedSiteLog(event.data);
      setIsSiteLogModalOpen(true);
    } else if (event.type === 'movimiento') {
      setSelectedMovement(event.data);
      setIsMovementModalOpen(true);
    }
  };

  // Manejar creación de nuevos eventos
  const handleCreateEvent = (type: string, date: string) => {
    console.log('Create event:', type, date);
    
    if (type === 'bitacora') {
      setSelectedSiteLog(null);
      setIsSiteLogModalOpen(true);
    } else if (type === 'movimiento') {
      setSelectedMovement(null);
      setIsMovementModalOpen(true);
    }
  };

  // Listen for timeline action events
  useEffect(() => {
    const handleOpenCreateSiteLogModal = () => {
      setSelectedSiteLog(null);
      setIsSiteLogModalOpen(true);
    };

    window.addEventListener('openCreateSiteLogModal', handleOpenCreateSiteLogModal);
    return () => {
      window.removeEventListener('openCreateSiteLogModal', handleOpenCreateSiteLogModal);
    };
  }, []);

  // Fetch todos los eventos para el período visible
  const { data: timelineEvents = [], isLoading } = useQuery({
    queryKey: ['/api/timeline-events', projectId, format(viewStartDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Usar el mismo rango que el GanttTimeline (60 días centrados en hoy)
      const today = new Date();
      const periodStart = startOfDay(addDays(today, -30));
      const periodEnd = endOfDay(addDays(today, 30));
      
      // Fetch site logs con información del autor
      const { data: siteLogs, error: siteLogsError } = await supabase
        .from('site_logs')
        .select(`
          *,
          author:users(first_name, last_name)
        `)
        .eq('project_id', projectId)
        .gte('log_date', format(periodStart, 'yyyy-MM-dd'))
        .lte('log_date', format(periodEnd, 'yyyy-MM-dd'));
        
      if (siteLogsError) {
        console.error('Error fetching site logs:', siteLogsError);
      } else {
        console.log('Site logs fetched:', siteLogs);
      }

      // Fetch site movements (sin relación por ahora hasta que se cree la tabla)
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
        // Usar directamente la fecha string sin crear Date object para evitar desfases de zona horaria
        const logDate = log.log_date; // Ya está en formato 'yyyy-MM-dd'
        if (eventsByDate[logDate]) {
          eventsByDate[logDate].siteLogs.push(log);
        }
      });

      // Agregar movements
      movements?.forEach(movement => {
        // Usar directamente la fecha string
        const movementDate = movement.date; // Ya está en formato 'yyyy-MM-dd'
        if (eventsByDate[movementDate]) {
          eventsByDate[movementDate].movements.push(movement);
        }
      });

      return Object.values(eventsByDate);
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 3000
  });

  const handleDayClick = (date: string, dayData: any) => {
    console.log('Day clicked:', date, dayData);
    setSelectedDayData(dayData);
    setFilterType(undefined); // Sin filtro cuando se hace clic en el día completo
    setIsDayDetailModalOpen(true);
  };

  const handleItemClick = (item: any) => {
    console.log('Item clicked:', item);
    
    // Mapear tipos del timeline a tipos del modal
    const typeMapping = {
      'bitacora': 'sitelog',
      'movimientos': 'movement',
      'tareas': 'task',
      'asistentes': 'attendee',
      'archivos': 'file'
    };
    
    const modalType = typeMapping[item.type as keyof typeof typeMapping];
    
    if (modalType) {
      // Abrir el modal de día con filtro por tipo específico
      setSelectedDayData({
        date: item.date,
        siteLogs: item.type === 'bitacora' ? [item.data] : [],
        movements: item.type === 'movimientos' ? [item.data] : [],
        tasks: item.type === 'tareas' ? [item.data] : [],
        attendees: item.type === 'asistentes' ? [item.data] : [],
        files: item.type === 'archivos' ? [item.data] : []
      });
      setFilterType(modalType);
      setIsDayDetailModalOpen(true);
    } else {
      // Fallback para modales específicos si es necesario
      if (item.type === 'bitacora') {
        setSelectedSiteLog(item.data);
        setIsSiteLogModalOpen(true);
      } else if (item.type === 'movimientos') {
        setSelectedMovement(item.data);
        setIsMovementModalOpen(true);
      }
    }
  };

  const handleDayItemClick = (type: string, item: any) => {
    console.log('Day item clicked:', type, item);
    setIsDayDetailModalOpen(false);
    
    if (type === 'sitelog') {
      setSelectedSiteLog(item);
      setIsSiteLogModalOpen(true);
    } else if (type === 'movement') {
      setSelectedMovement(item);
      setIsMovementModalOpen(true);
    }
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
      setSelectedSiteLog(null);
      setIsSiteLogModalOpen(true);
    };

    const handleOpenCreateMovementModal = () => {
      setSelectedMovement(null);
      setIsMovementModalOpen(true);
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
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md">
            <div className="border-2 border-dashed border-muted rounded-lg p-12 bg-muted/20">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <FolderKanban className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Todavía no tienes proyectos
              </h3>
              <p className="text-muted-foreground mb-6">
                Crea tu primer proyecto para comenzar a gestionar presupuestos, bitácoras y movimientos de obra.
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateProjectModal'))}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
          {activeProject?.name && (
            <p className="text-sm text-muted-foreground">
              {activeProject.name}
            </p>
          )}
        </div>
      </div>

      {/* Línea de Tiempo Horizontal */}
      <HorizontalTimeline 
        events={convertToTimelineEvents(timelineEvents)}
        onEventClick={handleEventClick}
        onCreateEvent={handleCreateEvent}
      />

      {/* Cards con información relevante */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Bitácoras */}
        <Card className="rounded-2xl shadow-md bg-muted/10 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bitácoras</p>
                <p className="text-3xl font-bold text-foreground">
                  {timelineEvents.reduce((total, event) => total + (event.siteLogs?.length || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total de Movimientos */}
        <Card className="rounded-2xl shadow-md bg-muted/10 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Movimientos</p>
                <p className="text-3xl font-bold text-foreground">
                  {timelineEvents.reduce((total, event) => total + (event.movements?.length || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total de Tareas */}
        <Card className="rounded-2xl shadow-md bg-muted/10 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tareas</p>
                <p className="text-3xl font-bold text-foreground">
                  {timelineEvents.reduce((total, event) => total + (event.tasks?.length || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proyecto Activo */}
        <Card className="rounded-2xl shadow-md bg-muted/10 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyecto Activo</p>
                <p className="text-lg font-bold text-foreground truncate">
                  {activeProject?.name || 'Sin proyecto'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Site Log Modal */}
      <SiteLogModal
        isOpen={isSiteLogModalOpen}
        onClose={() => {
          setIsSiteLogModalOpen(false);
          // Invalidar cache para actualizar el timeline
          queryClient.invalidateQueries({
            queryKey: ['/api/timeline-events']
          });
        }}
        siteLog={selectedSiteLog}
        projectId={projectId}
      />

      {/* Movement Modal */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          // Invalidar cache para actualizar el timeline
          queryClient.invalidateQueries({
            queryKey: ['/api/timeline-events']
          });
        }}
        movement={selectedMovement}
        projectId={projectId}
      />



    </div>
  );
}