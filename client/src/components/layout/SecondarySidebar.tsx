import { 
  BarChart3, 
  Clock, 
  ChartBar, 
  List, 
  Plus, 
  Building, 
  Users, 
  Shield, 
  UserCog, 
  CreditCard, 
  Bell,
  MoreHorizontal
} from 'lucide-react';
import { useNavigationStore, View } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const sectionConfig = {
  dashboard: {
    title: 'Dashboard',
    description: 'Panel principal de control',
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
      { view: 'projects-list' as View, icon: Plus, label: 'Nuevo Proyecto' },
    ],
  },
  admin: {
    title: 'Administración',
    description: 'Configuración y usuarios',
    items: [
      { view: 'admin-organizations' as View, icon: Building, label: 'Organizaciones' },
      { view: 'admin-users' as View, icon: Users, label: 'Usuarios' },
      { view: 'admin-permissions' as View, icon: Shield, label: 'Permisos' },
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

  const config = sectionConfig[currentSection];

  const handleLogout = async () => {
    await authService.signOut();
    logout();
  };

  return (
    <div className="w-60 bg-surface border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {config.items.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
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

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Constructora ABC
            </p>
          </div>
          <div className="relative">
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
