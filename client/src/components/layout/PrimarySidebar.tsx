import { useEffect, useState } from 'react';
import { Home, Building2, FolderKanban, CreditCard, ClipboardList, DollarSign, Users, Settings, User, Shield, Bell, Contact, Crown, Zap, Rocket, Star, Diamond, Calendar, UserCheck, Library, FolderOpen, ChevronDown, Plus, HardHat } from 'lucide-react';
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
    section: 'budgets' as Section, 
    icon: HardHat, 
    label: 'Obra',
    description: 'Elaboración y gestión de presupuestos, cómputos métricos y materiales.',
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
    <div className="w-[55px] flex flex-col relative z-30">
      {/* Dashboard button - moved to top */}
      <div className="flex items-center justify-center pt-2.5 pl-2.5">
        <CircularButton
          icon={Home}
          isActive={currentSection === 'dashboard'}
          onClick={() => setSection('dashboard')}
          section="dashboard"
          label="Dashboard"
        />
      </div>

      {/* Project selector */}
      <div className="flex items-center justify-center pt-2 pl-2.5 relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="w-11 h-11 rounded-full bg-surface-primary border-2 border-input shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer group hover:pressed">
          <span className="text-sm font-bold text-muted-foreground">
            {getProjectInitials(currentProject)}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-600 absolute -bottom-1 -right-1" />
        </div>

        {/* Project menu */}
        {showProjectMenu && (
          <div className="absolute top-0 left-full ml-3 bg-surface-secondary rounded-2xl shadow-lg z-50 pointer-events-auto max-w-[280px] min-w-[200px]">
            <div className="p-4">
              {/* Title in black */}
              <div className="font-semibold text-sm text-foreground mb-2">
                Seleccionar Proyecto
              </div>
              {/* Project list */}
              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      project.id === projectId
                        ? 'bg-black text-white'
                        : 'hover:bg-black/5'
                    }`}
                  >
                    <span className={`font-medium text-xs ${project.id === projectId ? 'text-white' : 'text-foreground'}`}>
                      {project.name}
                    </span>
                    <p className={`text-xs mt-1 leading-relaxed whitespace-normal ${
                      project.id === projectId ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {project.description}
                    </p>
                  </button>
                ))}
                <button className="w-full text-left p-2 rounded-lg hover:bg-black/5 border border-dashed border-input mt-2">
                  <Plus className="w-3 h-3 inline mr-1 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">Crear Nuevo Proyecto</span>
                </button>
              </div>
            </div>
            {/* Arrow pointing to project selector button */}
            <div className="absolute top-5 right-full w-0 h-0 border-t-[8px] border-b-[8px] border-transparent border-r-[8px] border-r-[#e1e1e1]" />
          </div>
        )}
      </div>
      
      {/* Center navigation buttons */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-2 pl-2.5">
        {topNavigationItems.slice(1).map(({ section, icon, label, description, hasTimeline }) => (
          <div key={section} className="relative">
            <CircularButton
              icon={icon}
              isActive={currentSection === section}
              onClick={() => {
                setSection(section);
                // Auto-navigate to dashboard view when "movements" section is selected
                if (section === 'movements') {
                  setView('movements-dashboard');
                }
              }}
              section={section}
              label={label}
              description={description}
            />
            {/* Timeline line extending to the right - only show in dashboard timeline view */}
            {hasTimeline === true && currentSection === 'dashboard' && (
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-[calc(100vw-112px)] h-0.5 bg-border/20 pointer-events-none" />
            )}
          </div>
        ))}
      </div>
      
      {/* Bottom buttons section */}
      <div className="flex flex-col items-center pb-2.5 pl-2.5 space-y-2">
        {/* Plan button */}
        {userPlan && (
          <div 
            className={`w-11 h-11 rounded-full bg-surface-primary shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer group border-2 ${
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
