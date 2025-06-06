import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserContextStore } from "../../stores/userContextStore';
import { supabase } from "../../lib/supabase';
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


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
      {/* Main Dashboard Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stats Cards with integrated action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl shadow-md overflow-hidden p-0 h-40 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.totalProjects || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateProjectModal'))}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-lg flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-3 h-3" />
                Nuevo Proyecto
              </button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md overflow-hidden p-0 h-40 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bitácoras</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.totalSiteLogs || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateSiteLogModal'))}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-lg flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-3 h-3" />
                Nueva Bitácora
              </button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md overflow-hidden p-0 h-40 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Movimientos</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${(stats?.totalMovements || 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateMovementModal'))}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-lg flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-3 h-3" />
                Nuevo Movimiento
              </button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md overflow-hidden p-0 h-40 flex flex-col">
            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contactos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.totalContacts || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openCreateContactModal'))}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors rounded-lg flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-3 h-3" />
                Nuevo Contacto
              </button>
            </CardContent>
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