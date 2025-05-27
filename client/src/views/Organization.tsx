import { Activity, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function Organization() {
  const { organizationId } = useUserContextStore();

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

      // Get total budget from all projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('budget')
        .eq('organization_id', organizationId);

      console.log('Projects data:', projects, 'Error:', projectsError);

      const totalBudget = projects?.reduce((sum, project) => {
        const budgetValue = parseFloat(project.budget) || 0;
        console.log('Project budget:', project.budget, 'Parsed:', budgetValue);
        return sum + budgetValue;
      }, 0) || 0;

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organización</h1>
          <p className="text-muted-foreground">{organization?.name}</p>
        </div>
      </div>
      
      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Proyectos Totales</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalProjects || 0}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Presupuesto Total</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats?.totalBudget ? (stats.totalBudget / 1000000).toFixed(1) + 'M' : '0'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Actividad Mensual</p>
              <p className="text-2xl font-bold text-foreground">{stats?.monthlyActivity || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Días Activos</p>
              <p className="text-2xl font-bold text-foreground">{stats?.activeDays || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
      
      {/* Organization Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Información de la Organización</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-foreground">{organization?.name || 'Cargando...'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descripción</label>
              <p className="text-foreground">{organization?.description || 'Sin descripción'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
              <p className="text-foreground">
                {organization?.created_at 
                  ? new Date(organization.created_at).toLocaleDateString('es-ES')
                  : 'Cargando...'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Aquí se mostrará la actividad reciente de la organización.
            </p>
            {/* Aquí se pueden agregar elementos de actividad reciente */}
          </div>
        </div>
      </div>
    </div>
  );
}