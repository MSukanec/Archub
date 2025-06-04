import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building2, 
  FileText, 
  TrendingUp, 
  Users, 
  Plus, 
  DollarSign, 
  ArrowRight,
  Calendar,
  Activity,
  Clock,
  Edit,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TimelineEvent {
  id: string;
  type: 'project' | 'movement' | 'calendar' | 'log';
  title: string;
  description: string;
  date: Date;
  time?: string;
  icon: any;
  color: string;
  projectName?: string;
  amount?: number;
  currency?: string;
}

export default function ArchubDashboard() {
  const { organizationId } = useUserContextStore();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch timeline events from last 30 days
  const { data: timelineEvents = [] } = useQuery<TimelineEvent[]>({
    queryKey: ['/api/timeline-events', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const events: TimelineEvent[] = [];
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      // Get site movements
      const { data: movements } = await supabase
        .from('site_movements')
        .select(`
          *,
          projects(name),
          currencies(code, symbol)
        `)
        .eq('organization_id', organizationId)
        .gte('created_at_local', format(startDate, 'yyyy-MM-dd'))
        .lte('created_at_local', format(endDate, 'yyyy-MM-dd'))
        .order('created_at_local', { ascending: false })
        .limit(20);

      movements?.forEach(movement => {
        events.push({
          id: `movement-${movement.id}`,
          type: 'movement',
          title: 'Nuevo movimiento financiero',
          description: movement.description,
          date: new Date(movement.created_at_local),
          icon: DollarSign,
          color: '#10B981',
          projectName: movement.projects?.name,
          amount: movement.amount,
          currency: movement.currencies?.symbol || movement.currencies?.code
        });
      });

      // Get calendar events
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false })
        .limit(15);

      calendarEvents?.forEach(event => {
        events.push({
          id: `calendar-${event.id}`,
          type: 'calendar',
          title: event.title,
          description: event.description,
          date: new Date(`${event.date}T${event.time || '00:00'}`),
          time: event.time,
          icon: Calendar,
          color: '#6366F1'
        });
      });

      // Get recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      projects?.forEach(project => {
        events.push({
          id: `project-${project.id}`,
          type: 'project',
          title: 'Nuevo proyecto creado',
          description: project.description || project.name,
          date: new Date(project.created_at),
          icon: Building2,
          color: '#3B82F6',
          projectName: project.name
        });
      });

      return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    enabled: !!organizationId
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard-stats', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const [projectsRes, siteLogsRes, movementsRes, contactsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id')
          .eq('organization_id', organizationId),
        supabase
          .from('site_logs')
          .select('id')
          .eq('organization_id', organizationId),
        supabase
          .from('site_movements')
          .select('amount, currencies(symbol)')
          .eq('organization_id', organizationId),
        supabase
          .from('contacts')
          .select('id')
          .eq('organization_id', organizationId)
      ]);

      const totalMovements = movementsRes.data?.reduce((sum, movement) => sum + (movement.amount || 0), 0) || 0;

      return {
        totalProjects: projectsRes.data?.length || 0,
        totalSiteLogs: siteLogsRes.data?.length || 0,
        totalMovements,
        totalContacts: contactsRes.data?.length || 0
      };
    },
    enabled: !!organizationId
  });

  if (!organizationId) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md">
            <div className="border-2 border-dashed border-muted rounded-lg p-12 bg-muted/20">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Bienvenido a Archub
              </h3>
              <p className="text-muted-foreground mb-6">
                Para comenzar, selecciona una organización desde el menú lateral.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-views">
      {/* Static Timeline Header with curved edges - aligned with sidebar top */}
      <div className="relative bg-surface-primary mx-6 mt-0 mb-6 rounded-2xl overflow-hidden h-16">
        {/* Timeline with events positioned statically */}
        <div className="relative h-full flex items-center justify-center">
          {/* Current day vertical line in center */}
          <div className="absolute left-1/2 transform -translate-x-0.5 h-full w-0.5 bg-primary z-20" />
          
          {/* Static positioned event nodes */}
          <div className="flex items-center justify-center w-full px-8">
            {timelineEvents.slice(0, 7).map((event, index) => {
              const Icon = event.icon;
              // Position events relative to center
              const position = (index - 3) * 80; // Spread events 80px apart, center is index 3
              
              return (
                <div
                  key={event.id}
                  className="absolute group cursor-pointer"
                  style={{ left: `calc(50% + ${position}px)`, transform: 'translateX(-50%)' }}
                  onClick={() => {
                    if (event.type === 'project') {
                      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
                        detail: { section: 'projects', view: 'projects-list' } 
                      }));
                    } else if (event.type === 'movement') {
                      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
                        detail: { section: 'movements', view: 'movements-dashboard' } 
                      }));
                    } else if (event.type === 'calendar') {
                      window.dispatchEvent(new CustomEvent('navigate-to-section', { 
                        detail: { section: 'calendar', view: 'calendar-main' } 
                      }));
                    }
                  }}
                >
                  {/* Circular Event Node - all with primary color */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary border-2 border-surface-primary transition-all duration-300 flex items-center justify-center group-hover:scale-125 group-hover:shadow-lg relative z-10">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Event Info Tooltip */}
                    <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      <div className="bg-surface-secondary border border-border rounded-lg px-3 py-2 shadow-lg min-w-[140px] max-w-[200px]">
                        <div className="text-xs font-medium text-foreground truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(event.date, 'HH:mm', { locale: es })}
                        </div>
                        {event.projectName && (
                          <div className="text-xs text-primary truncate mt-1">{event.projectName}</div>
                        )}
                        {event.amount && event.currency && (
                          <div className="text-xs text-emerald-600 mt-1">
                            {event.currency}{Math.abs(event.amount).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stats Cards with integrated action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl shadow-md overflow-hidden p-0">
            <CardContent className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats?.totalProjects || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openCreateProjectModal'))}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-b-2xl flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Nuevo Proyecto
            </button>
          </Card>

          <Card className="rounded-2xl shadow-md overflow-hidden p-0">
            <CardContent className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bitácoras</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats?.totalSiteLogs || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openCreateSiteLogModal'))}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-b-2xl flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Nueva Bitácora
            </button>
          </Card>

          <Card className="rounded-2xl shadow-md overflow-hidden p-0">
            <CardContent className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Movimientos</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${(stats?.totalMovements || 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openCreateMovementModal'))}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-b-2xl flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Nuevo Movimiento
            </button>
          </Card>

          <Card className="rounded-2xl shadow-md overflow-hidden p-0">
            <CardContent className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contactos</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats?.totalContacts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openCreateContactModal'))}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-b-2xl flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Nuevo Contacto
            </button>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card className="rounded-2xl shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Resumen de Actividad</h3>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-4">
              {timelineEvents.slice(0, 5).map((event) => {
                const Icon = event.icon;
                return (
                  <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-secondary/50">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${event.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: event.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(event.date, 'dd/MM HH:mm', { locale: es })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}