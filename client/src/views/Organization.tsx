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
              <p className="text-2xl font-bold text-foreground">8</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Presupuesto Total</p>
              <p className="text-2xl font-bold text-foreground">$1.2M</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Actividad Mensual</p>
              <p className="text-2xl font-bold text-foreground">156</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Días Activos</p>
              <p className="text-2xl font-bold text-foreground">23</p>
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