import { 
  Home,
  BarChart3, 
  Activity, 
  ChartBar, 
  List, 
  Plus, 
  Building, 
  Users, 
  UserCog, 
  CreditCard, 
  Bell,
  MoreHorizontal,
  Ruler,
  Blocks,
  Zap,
  Box,
  Contact,
  FolderTree,
  ChevronDown,
  CheckSquare,
  Package,
  DollarSign,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { useNavigationStore, View } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { authService } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const sectionConfig = {
  dashboard: {
    title: 'Dashboard',
    description: 'Vista principal del sistema',
    items: [
      { view: 'dashboard-main' as View, icon: Home, label: 'Principal' },
      { view: 'dashboard-timeline' as View, icon: Activity, label: 'Timeline' },
    ],
  },
  organization: {
    title: 'Organización',
    description: 'Vista general y actividad de la organización',
    items: [
      { view: 'organization-overview' as View, icon: ChartBar, label: 'Resumen General' },
      { view: 'organization-team' as View, icon: Users, label: 'Equipo' },
      { view: 'organization-activity' as View, icon: Activity, label: 'Actividad Reciente' },
    ],
  },
  projects: {
    title: 'Proyectos',
    description: 'Dashboard de proyectos de construcción',
    items: [
      { view: 'projects-overview' as View, icon: ChartBar, label: 'Resumen de Proyectos' },
    ],
  },
  budgets: {
    title: 'Presupuestos',
    description: 'Gestión de presupuestos y costos',
    items: [
      { view: 'budgets-list' as View, icon: CreditCard, label: 'Lista de Presupuestos' },
      { view: 'budgets-tasks' as View, icon: CheckSquare, label: 'Lista de Tareas' },
      { view: 'budgets-materials' as View, icon: Package, label: 'Lista de Materiales' },
    ],
  },
  sitelog: {
    title: 'Bitácora',
    description: 'Registro diario de actividades en obra',
    items: [
      { view: 'sitelog-main' as View, icon: CheckSquare, label: 'Bitácora de Obra' },
    ],
  },
  movements: {
    title: 'Movimientos de Obra',
    description: 'Registro de ingresos y egresos',
    items: [
      { view: 'movements-main' as View, icon: DollarSign, label: 'Movimientos Financieros' },
    ],
  },
  contacts: {
    title: 'Agenda',
    description: 'Gestión de contactos y proveedores',
    items: [
      { view: 'contacts' as View, icon: Contact, label: 'Contactos' },
    ],
  },
  admin: {
    title: 'Administración',
    description: 'Gestión de organizaciones y usuarios',
    items: [
      { view: 'admin-organizations' as View, icon: Building, label: 'Organizaciones' },
      { view: 'admin-users' as View, icon: Users, label: 'Usuarios' },
      { view: 'admin-categories' as View, icon: FolderTree, label: 'Categorías' },
      { view: 'admin-materials' as View, icon: Box, label: 'Materiales' },
      { view: 'admin-units' as View, icon: Ruler, label: 'Unidades' },
      { view: 'admin-elements' as View, icon: Blocks, label: 'Elementos' },
      { view: 'admin-actions' as View, icon: Zap, label: 'Acciones' },
      { view: 'admin-tasks' as View, icon: CheckSquare, label: 'Tareas' },
    ],
  },
  profile: {
    title: 'Perfil',
    description: 'Información personal y suscripción',
    items: [
      { view: 'profile-info' as View, icon: UserCog, label: 'Información' },
      { view: 'profile-subscription' as View, icon: CreditCard, label: 'Suscripción' },
      { view: 'profile-notifications' as View, icon: Bell, label: 'Notificaciones' },
    ],
  },
};

export default function SecondarySidebar() {
  const { currentSection, currentView, setView } = useNavigationStore();
  const { user, logout } = useAuthStore();
  const { isSecondarySidebarVisible } = useSidebarStore();
  const { organizationId, setUserContext } = useUserContextStore();

  const config = sectionConfig[currentSection];

  // Fetch current organization details only
  const { data: currentOrganization } = useQuery({
    queryKey: ['/api/organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single();
      return data;
    },
    enabled: !!organizationId,
  });

  // Remove unused function since we're not using a selector anymore

  const handleLogout = async () => {
    await authService.signOut();
    logout();
  };



  return (
    <div className={cn(
      "fixed left-[56px] top-0 h-screen bg-[#282828] border-r border-border flex flex-col z-50",
      isSecondarySidebarVisible ? "w-60" : "w-0 overflow-hidden"
    )}>
      {/* Header */}
      <div className="h-[56px] flex items-center px-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
        
        {/* Organization Display - Only show in dashboard section */}
        {currentSection === 'dashboard' && currentOrganization && (
          <div className="mt-3 p-2 bg-[#1e1e1e] rounded-lg border border-border">
            <div className="text-sm font-medium text-foreground">
              {currentOrganization.name}
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {config.items.map(({ view, icon: Icon, label }, index) => (
            <button
              key={`${view}-${index}`}
              onClick={() => setView(view)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200",
                currentView === view
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon size={16} className="mr-3" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Logout Button - Only show in profile section */}
      {currentSection === 'profile' && (
        <div className="p-2 border-t border-border">
          <button
            onClick={async () => {
              try {
                await authService.signOut();
                logout();
                // Clear user context
                setUserContext({
                  organizationId: null,
                  projectId: null,
                  budgetId: null,
                  planId: null,
                  organization: null,
                  currentProjects: null,
                  lastDataFetch: null,
                });
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
            className="w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={16} className="mr-3" />
            Cerrar Sesión
          </button>
        </div>
      )}

    </div>
  );
}
