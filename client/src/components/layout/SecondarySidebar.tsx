import { 
  BarChart3, 
  Clock, 
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
  CheckSquare
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
    title: 'Organización',
    description: 'Información de la organización',
    items: [
      { view: 'dashboard-main' as View, icon: BarChart3, label: 'Resumen General' },
      { view: 'dashboard-activity' as View, icon: Clock, label: 'Actividad Reciente' },
    ],
  },
  projects: {
    title: 'Proyectos',
    description: 'Gestión de proyectos de construcción',
    items: [
      { view: 'projects-overview' as View, icon: ChartBar, label: 'Resumen' },
      { view: 'projects-list' as View, icon: List, label: 'Lista de Proyectos' },
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
      "fixed left-[45px] top-0 h-full bg-[#141414] border-r border-border flex flex-col z-50",
      isSecondarySidebarVisible ? "w-60" : "w-0 overflow-hidden"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
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


    </div>
  );
}
