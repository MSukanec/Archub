import { useState } from 'react';
import { Activity, BarChart3, Calendar, TrendingUp, Building2, Plus, FileText, Users, DollarSign } from 'lucide-react';
import { useUserContextStore } from "../../stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../../lib/supabase';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CreateOrganizationModal from "../../components/modals/CreateOrganizationModal';
import { FeatureLock } from "../../components/features';

export default function Organization() {
  const { organizationId } = useUserContextStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch current organization details
  const { data: organization } = useQuery({
    queryKey: ['/api/organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      return data;
    },
    enabled: !!organizationId,
  });

  // Fetch organization statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/organization-stats', organizationId],
    queryFn: async () => {
      if (!organizationId) return { totalProjects: 0, totalBudget: 0, monthlyActivity: 0, activeDays: 0 };
      
      console.log('Fetching stats for organization:', organizationId);
      
      // Get total projects count
      const { count: projectsCount, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      console.log('Projects count:', projectsCount, 'Error:', countError);

      // Get projects data without budget field (since it doesn't exist)
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('organization_id', organizationId);

      console.log('Projects data:', projects, 'Error:', projectsError);

      // For now, set budget to 0 since the column doesn't exist
      const totalBudget = 0;

      // Get monthly activity (site logs from this month for projects in this organization)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: orgProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organizationId);

      const projectIds = orgProjects?.map(p => p.id) || [];

      const { count: monthlyActivity } = await supabase
        .from('site_logs')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .gte('created_at', startOfMonth.toISOString());

      // Get active days (days with activity in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeDaysData } = await supabase
        .from('site_logs')
        .select('log_date')
        .in('project_id', projectIds)
        .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]);

      const uniqueDays = new Set(activeDaysData?.map(log => log.log_date));
      const activeDays = uniqueDays.size;

      return {
        totalProjects: projectsCount || 0,
        totalBudget,
        monthlyActivity: monthlyActivity || 0,
        activeDays
      };
    },
    enabled: !!organizationId,
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['/api/organization-activity', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const activities = [];
      
      // Get recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, created_at, client_name')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      projects?.forEach(project => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          title: 'Nuevo proyecto creado',
          description: `${project.name} - ${project.client_name || 'Sin cliente'}`,
          date: new Date(project.created_at),
          icon: Building2,
          color: '#3B82F6'
        });
      });

      // Get recent site logs
      const { data: siteLogs } = await supabase
        .from('site_logs')
        .select('id, title, log_date, projects(name)')
        .eq('organization_id', organizationId)
        .order('log_date', { ascending: false })
        .limit(5);
      
      siteLogs?.forEach(log => {
        activities.push({
          id: `log-${log.id}`,
          type: 'log',
          title: 'Nueva bitácora',
          description: `${log.title} - ${log.projects?.name || 'Proyecto'}`,
          date: new Date(log.log_date),
          icon: FileText,
          color: '#10B981'
        });
      });

      // Get recent movements
      const { data: movements } = await supabase
        .from('site_movements')
        .select('id, description, amount, created_at, projects(name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      movements?.forEach(movement => {
        activities.push({
          id: `movement-${movement.id}`,
          type: 'movement',
          title: 'Nuevo movimiento',
          description: `$${movement.amount} - ${movement.description || movement.projects?.name || 'Sin descripción'}`,
          date: new Date(movement.created_at),
          icon: DollarSign,
          color: '#F59E0B'
        });
      });

      return activities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10);
    },
    enabled: !!organizationId,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Organización
            </h1>
            <p className="text-sm text-muted-foreground">
              {organization?.name}
            </p>
          </div>
        </div>
        <FeatureLock feature="multiple_organizations">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary border-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Organización
          </Button>
        </FeatureLock>
      </div>
      
      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl shadow-md p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Proyectos Totales</p>
              <p className="text-3xl font-bold text-foreground">{stats?.totalProjects || 0}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="rounded-2xl shadow-md p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Presupuesto Total</p>
              <p className="text-3xl font-bold text-foreground">
                ${stats?.totalBudget ? (stats.totalBudget / 1000000).toFixed(1) + 'M' : '0'}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="rounded-2xl shadow-md p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Actividad Mensual</p>
              <p className="text-3xl font-bold text-foreground">{stats?.monthlyActivity || 0}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="rounded-2xl shadow-md p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Días Activos</p>
              <p className="text-3xl font-bold text-foreground">{stats?.activeDays || 0}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Organization Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-md p-6 border-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Información de la Organización</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Nombre</label>
              <p className="text-foreground font-medium">{organization?.name || 'Cargando...'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Descripción</label>
              <p className="text-foreground font-medium">{organization?.description || 'Sin descripción'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Fecha de Creación</label>
              <p className="text-foreground font-medium">
                {organization?.created_at 
                  ? new Date(organization.created_at).toLocaleDateString('es-ES')
                  : 'Sin fecha disponible'
                }
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Miembros</label>
              <p className="text-foreground font-medium">1 miembro activo</p>
            </div>
          </div>
        </Card>
        
        <Card className="rounded-2xl shadow-md p-6 border-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Actividad Reciente</h3>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay actividad reciente en esta organización.
              </p>
            ) : (
              recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${activity.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: activity.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.date.toLocaleDateString('es-ES', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}