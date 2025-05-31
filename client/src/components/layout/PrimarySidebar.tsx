import { useEffect, useState } from 'react';
import { Home, Building2, FolderKanban, CreditCard, ClipboardList, DollarSign, Users, Settings, User, Shield, Bell, Contact, Crown, Zap, Rocket, Star, Diamond, Calendar, UserCheck, Library, FolderOpen, ChevronDown, Plus } from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import CircularButton from '@/components/ui/CircularButton';

const topNavigationItems = [
  { 
    section: 'dashboard' as Section, 
    icon: Home, 
    label: 'Dashboard',
    description: 'Vista general del proyecto, métricas y acceso rápido a funciones principales.',
    hasTimeline: true
  },
  { 
    section: 'organization' as Section, 
    icon: Building2, 
    label: 'Organización',
    description: 'Gestión de la empresa, equipos de trabajo y estructura organizacional.',
    hasTimeline: false
  },
  { 
    section: 'projects' as Section, 
    icon: FolderOpen, 
    label: 'Proyectos',
    description: 'Gestión y administración de proyectos de construcción.',
    hasTimeline: true
  },
  { 
    section: 'sitelog' as Section, 
    icon: ClipboardList, 
    label: 'Bitácora',
    description: 'Registro diario de actividades, eventos y seguimiento del progreso de obra.',
    hasTimeline: true
  },
  { 
    section: 'calendar' as Section, 
    icon: Calendar, 
    label: 'Calendario',
    description: 'Calendario de eventos, reuniones y citas del proyecto.',
    hasTimeline: true
  },
  { 
    section: 'movements' as Section, 
    icon: DollarSign, 
    label: 'Finanzas',
    description: 'Control de ingresos, egresos y movimientos financieros del proyecto.',
    hasTimeline: true
  },
  { 
    section: 'budgets' as Section, 
    icon: CreditCard, 
    label: 'Presupuestos',
    description: 'Elaboración y gestión de presupuestos, cómputos métricos y materiales.',
    hasTimeline: true
  },
  { 
    section: 'contacts' as Section, 
    icon: UserCheck, 
    label: 'Contactos',
    description: 'Gestión de contactos, clientes y proveedores del proyecto.',
    hasTimeline: false
  },
];



export default function PrimarySidebar() {
  const { currentSection, currentView, setSection, setHoveredSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { organizationId, projectId, setUserContext, currentProjects } = useUserContextStore();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);

  // Use projects from the store instead of fetching again
  const projects = currentProjects || [];
  const currentProject = projects.find(p => p.id === projectId);

  // Escuchar eventos de navegación desde el timeline
  useEffect(() => {
    const handleTimelineNavigation = (event: CustomEvent) => {
      const { section, view } = event.detail;
      setSection(section);
      setView(view);
    };

    window.addEventListener('navigate-to-section', handleTimelineNavigation as EventListener);
    return () => {
      window.removeEventListener('navigate-to-section', handleTimelineNavigation as EventListener);
    };
  }, [setSection, setView]);

  // Get project initials
  const getProjectInitials = (project?: any) => {
    if (!project) return 'P';
    const words = project.name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return project.name.substring(0, 2).toUpperCase();
  };

  // Function to get the plan icon based on plan name
  const getPlanIcon = (planName: string) => {
    const name = planName?.toLowerCase();
    switch (name) {
      case 'free':
        return Zap;
      case 'pro':
        return Crown;
      case 'enterprise':
        return Rocket;
      default:
        return Zap;
    }
  };

  // Function to get the plan color based on plan name
  const getPlanColor = (planName: string) => {
    const name = planName?.toLowerCase();
    switch (name) {
      case 'free':
        return 'text-primary';
      case 'pro':
        return 'text-blue-600';
      case 'enterprise':
        return 'text-purple-600';
      default:
        return 'text-primary';
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    setUserContext({ projectId: newProjectId });
    setShowProjectMenu(false);
  };

  const handleMouseEnter = () => {
    if (menuTimeout) {
      clearTimeout(menuTimeout);
      setMenuTimeout(null);
    }
    setShowProjectMenu(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowProjectMenu(false);
    }, 300);
    setMenuTimeout(timeout);
  };

  const handlePlanClick = () => {
    setView('subscription-tables');
  };

  // Obtener el plan actual del usuario
  const { data: userPlan } = useQuery({
    queryKey: ['/api/user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          plan_id,
          plans (
            name,
            price
          )
        `)
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user plan:', error);
        return null;
      }
      
      return data?.plans || null;
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto de cache para actualizaciones más rápidas
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recibe foco
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
  });

  return (
    <div className="w-[56px] flex flex-col relative z-30">
      {/* Top section - Dashboard and Project selector */}
      <div className="flex flex-col items-center pt-2.5 pr-2.5 space-y-2">
        <CircularButton
          icon={Home}
          isActive={currentSection === 'dashboard'}
          onClick={() => setSection('dashboard')}
          section="dashboard"
          label="Dashboard"
        />

        {/* Project selector with consistent styling */}
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <div className="w-11 h-11 rounded-full bg-[#e1e1e1] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer group relative">
            <span className="text-sm font-bold text-gray-700">
              {getProjectInitials(currentProject)}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-600 absolute -bottom-1 -right-1" />
          </div>

          {/* Project menu with consistent popover styling */}
          {showProjectMenu && (
            <div className="absolute left-full top-0 ml-2 w-80 bg-gray-900 text-white rounded-lg shadow-xl z-50 p-3">
              <h3 className="font-medium text-white mb-3 text-sm">Seleccionar Proyecto</h3>
              <div className="space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors text-sm ${
                      project.id === projectId
                        ? 'bg-white/20 text-white'
                        : 'hover:bg-white/10 text-gray-200'
                    }`}
                  >
                    <span className="font-medium">{project.name}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{project.description}</p>
                  </button>
                ))}
                <button className="w-full text-left p-2 rounded-md hover:bg-white/10 border border-dashed border-gray-600 mt-2">
                  <Plus className="w-3 h-3 inline mr-2 text-gray-400" />
                  <span className="font-medium text-sm text-gray-200">Crear Nuevo Proyecto</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Middle navigation buttons */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-2 pr-2.5">
        {topNavigationItems.slice(1).map(({ section, icon, label, description }) => (
          <CircularButton
            key={section}
            icon={icon}
            isActive={currentSection === section}
            onClick={() => setSection(section)}
            section={section}
            label={label}
            description={description}
          />
        ))}
      </div>
      
      {/* Admin buttons section - only for admin users */}
      {user?.role === 'admin' && (
        <div className="flex flex-col items-center pr-2.5 space-y-2">
          <CircularButton
            icon={Calendar}
            isActive={currentView === 'dashboard-timeline'}
            onClick={() => setView('dashboard-timeline')}
            label="Dashboard Timeline"
          />

          <CircularButton
            icon={Shield}
            isActive={currentView === 'admin-organizations'}
            onClick={() => setView('admin-organizations')}
            label="Admin Organizaciones"
          />

          <CircularButton
            icon={Users}
            isActive={currentView === 'admin-users'}
            onClick={() => setView('admin-users')}
            label="Admin Usuarios"
          />
        </div>
      )}

      {/* Bottom buttons section */}
      <div className="flex flex-col items-center pb-2.5 pr-2.5 space-y-2">
        {/* Plan button */}
        {userPlan && (
          <div 
            className={`w-11 h-11 rounded-full bg-[#e1e1e1] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer group border-2 ${
              userPlan.name?.toLowerCase() === 'free'
                ? 'border-primary'
                : userPlan.name?.toLowerCase() === 'pro'
                  ? 'border-blue-600'
                  : 'border-purple-600'
            }`}
            onClick={handlePlanClick}
          >
            {(() => {
              const PlanIcon = getPlanIcon(userPlan.name);
              return <PlanIcon className={`w-5 h-5 ${getPlanColor(userPlan.name)} group-hover:scale-110 transition-transform`} />;
            })()}
          </div>
        )}

        {/* Profile button */}
        <CircularButton
          icon={User}
          isActive={currentSection === 'profile'}
          onClick={() => setSection('profile')}
          section="profile"
          label="Perfil"
        />
      </div>
    </div>
  );
}
