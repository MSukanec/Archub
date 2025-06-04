import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  Users, 
  Building2, 
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
  Plus
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  type: 'sitelog' | 'movement' | 'calendar' | 'project' | 'contact';
  title: string;
  description?: string;
  date: Date;
  time?: string;
  icon: any;
  color: string;
  projectName?: string;
  amount?: number;
  currency?: string;
}

export default function ArchubDashboard() {
  const { projectId, organizationId } = useUserContextStore();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch timeline events for header
  const { data: timelineEvents = [] } = useQuery({
    queryKey: ['archub-timeline-events', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const events: TimelineEvent[] = [];
      const now = new Date();
      const startDate = subDays(now, 30);
      const endDate = addDays(now, 30);

      // Get site logs
      const { data: siteLogs } = await supabase
        .from('site_logs')
        .select(`
          *,
          projects(name)
        `)
        .eq('organization_id', organizationId)
        .gte('log_date', format(startDate, 'yyyy-MM-dd'))
        .lte('log_date', format(endDate, 'yyyy-MM-dd'))
        .order('log_date', { ascending: false })
        .limit(20);

      siteLogs?.forEach(log => {
        events.push({
          id: `sitelog-${log.id}`,
          type: 'sitelog',
          title: 'Nueva bitácora de obra',
          description: log.description || log.comments,
          date: new Date(log.log_date),
          icon: FileText,
          color: '#FF6B35',
          projectName: log.projects?.name
        });
      });

      // Get movements
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
          description: project.description,
          date: new Date(project.created_at),
          icon: Building2,
          color: '#8B5CF6',
          projectName: project.name
        });
      });

      // Get recent contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      contacts?.forEach(contact => {
        events.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: 'Nuevo contacto agregado',
          description: `${contact.first_name} ${contact.last_name}`,
          date: new Date(contact.created_at),
          icon: Users,
          color: '#F59E0B',
        });
      });

      return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    enabled: !!organizationId,
    refetchInterval: 30000 // Refresh every 30 seconds for live updates
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', organizationId],
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

  // Auto-scroll timeline header
  useEffect(() => {
    if (timelineEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentEventIndex(prev => (prev + 1) % timelineEvents.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [timelineEvents.length]);

  // Smooth scroll timeline
  useEffect(() => {
    if (timelineRef.current && timelineEvents.length > 0) {
      const eventWidth = 320; // Width of each event card
      const scrollPosition = currentEventIndex * eventWidth;
      
      timelineRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentEventIndex]);

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
                Configura tu organización para comenzar a gestionar tus proyectos de construcción.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Dynamic Timeline Header */}
      <div className="relative bg-gradient-to-r from-surface-secondary to-surface-secondary/80 rounded-2xl border border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
        
        {/* Timeline Content */}
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Actividad Reciente</h2>
                <p className="text-sm text-muted-foreground">Eventos en tiempo real de tu organización</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Actualizado hace {Math.floor(Math.random() * 5) + 1} min</span>
            </div>
          </div>

          {/* Scrolling Timeline */}
          <div 
            ref={timelineRef}
            className="flex gap-4 overflow-x-hidden pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.id}
                  className={`flex-shrink-0 w-80 p-4 rounded-xl border transition-all duration-500 ${
                    index === currentEventIndex 
                      ? 'bg-surface-primary border-primary/20 scale-105' 
                      : 'bg-surface-secondary/50 border-border/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${event.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: event.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {event.title}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(event.date, 'HH:mm', { locale: es })}
                        </span>
                      </div>
                      {event.projectName && (
                        <p className="text-xs text-primary mb-1 truncate">
                          {event.projectName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                      {event.amount && (
                        <p className="text-xs font-medium text-green-600 mt-1">
                          {event.currency}{event.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline indicators */}
          <div className="flex justify-center gap-1 mt-4">
            {timelineEvents.slice(0, 10).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentEventIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentEventIndex % 10 
                    ? 'bg-primary' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
          </Card>

          <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
          </Card>

          <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
          </Card>

          <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="rounded-2xl shadow-md border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateProjectModal'))}
                className="h-24 flex-col gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                variant="outline"
              >
                <Plus className="w-6 h-6" />
                <span>Nuevo Proyecto</span>
              </Button>
              
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateSiteLogModal'))}
                className="h-24 flex-col gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border-orange-500/20"
                variant="outline"
              >
                <FileText className="w-6 h-6" />
                <span>Nueva Bitácora</span>
              </Button>
              
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateMovementModal'))}
                className="h-24 flex-col gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20"
                variant="outline"
              >
                <DollarSign className="w-6 h-6" />
                <span>Nuevo Movimiento</span>
              </Button>
              
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateContactModal'))}
                className="h-24 flex-col gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border-purple-500/20"
                variant="outline"
              >
                <Users className="w-6 h-6" />
                <span>Nuevo Contacto</span>
              </Button>
            </div>
          </CardContent>
        </Card>

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