import { useState } from 'react';
import { 
  Home, 
  Building2, 
  FolderOpen, 
  HardHat, 
  Calendar, 
  DollarSign, 
  UserCheck,
  Settings,
  User,
  Plus,
  UserCircle,
  Shield,
  CreditCard
} from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/lib/projectsService';
import { cn } from '@/lib/utils';

const navigationSections = [
  { 
    section: 'organization' as Section, 
    icon: Building2, 
    label: 'Organización',
    views: [
      { key: 'organization-overview', label: 'Resumen' },
      { key: 'organization-team', label: 'Equipo' },
      { key: 'organization-settings', label: 'Configuración' }
    ]
  },
  { 
    section: 'projects' as Section, 
    icon: FolderOpen, 
    label: 'Proyectos',
    views: [
      { key: 'projects-overview', label: 'Todos los Proyectos' },
      { key: 'projects-active', label: 'Activos' },
      { key: 'projects-completed', label: 'Completados' }
    ]
  },
  { 
    section: 'site' as Section, 
    icon: HardHat, 
    label: 'Obra',
    views: [
      { key: 'site-overview', label: 'Vista General' },
      { key: 'site-progress', label: 'Progreso' },
      { key: 'site-materials', label: 'Materiales' }
    ]
  },
  { 
    section: 'calendar' as Section, 
    icon: Calendar, 
    label: 'Calendario',
    views: [
      { key: 'calendar-main', label: 'Calendario' }
    ]
  },
  { 
    section: 'movements' as Section, 
    icon: DollarSign, 
    label: 'Finanzas',
    views: [
      { key: 'movements-dashboard-archub', label: 'Dashboard' },
      { key: 'movements-main-archub', label: 'Movimientos' }
    ]
  },
  { 
    section: 'contacts' as Section, 
    icon: UserCheck, 
    label: 'Contactos',
    views: [
      { key: 'contacts-list', label: 'Lista de Contactos' }
    ]
  }
];

const profileViews = [
  { key: 'profile-info', label: 'Información Personal', icon: UserCircle },
  { key: 'profile-security', label: 'Seguridad', icon: Shield },
  { key: 'profile-subscription', label: 'Suscripción', icon: CreditCard }
];

interface ArchubLayoutProps {
  children: React.ReactNode;
}

export default function ArchubLayout({ children }: ArchubLayoutProps) {
  const { currentSection, currentView, setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { projectId, setUserContext } = useUserContextStore();
  const [hoveredSection, setHoveredSection] = useState<Section | null>(null);
  const [showDashboardPopover, setShowDashboardPopover] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  
  // Fetch real projects data
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => projectsService.getAll(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleSectionHover = (section: Section) => {
    setHoveredSection(section);
  };

  const handleSectionClick = (section: Section) => {
    setSection(section);
    // Use the first view of the section as default
    const firstView = navigationSections.find(s => s.section === section)?.views[0]?.key;
    if (firstView) {
      setView(firstView as any);
    }
  };

  const handleViewClick = (section: Section, viewKey: string) => {
    setSection(section);
    setView(viewKey as any);
    setHoveredSection(null);
  };

  const handleMouseLeave = () => {
    setHoveredSection(null);
  };

  const handleDashboardClick = () => {
    setSection('dashboard' as any);
    setView('dashboard-main' as any);
  };

  const handleProfileClick = (viewKey: string) => {
    setSection('profile' as any);
    setView(viewKey as any);
    setShowProfilePopover(false);
  };

  const handleProjectSelect = (project: any) => {
    setUserContext({ projectId: project.id });
    setShowDashboardPopover(false);
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white">
      {/* Header Principal - 50px height */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[50px] flex items-center bg-[#1e1e1e]">
        <div className="w-full max-w-full mx-auto px-4 flex items-center">
          {/* Dashboard Button (10%) */}
          <div className="w-[10%] flex items-center justify-center relative">
            <div
              onMouseEnter={() => setShowDashboardPopover(true)}
              onMouseLeave={() => setShowDashboardPopover(false)}
              className="relative"
            >
              <button
                onClick={handleDashboardClick}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  "bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40"
                )}
              >
                <Home className="w-5 h-5 text-lime-400" />
              </button>

              {/* Dashboard Popover */}
              {showDashboardPopover && (
                <div className="absolute top-12 left-0 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl p-3 min-w-[280px] z-60">
                  <div className="text-sm font-medium text-gray-300 mb-2">Proyectos</div>
                  {projects?.slice(0, 5).map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded transition-colors flex flex-col gap-1",
                        project.id === projectId 
                          ? "bg-lime-500/20 text-lime-400 border border-lime-500/40" 
                          : "text-gray-200 hover:bg-gray-700"
                      )}
                    >
                      <span className="font-medium">{project.name}</span>
                      <span className="text-xs text-gray-400">{project.client_name}</span>
                    </button>
                  ))}
                  {projects?.length > 5 && (
                    <div className="text-xs text-gray-400 px-3 py-1">
                      +{projects.length - 5} proyectos más
                    </div>
                  )}
                  <div className="border-t border-gray-600 mt-2 pt-2">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openCreateProjectModal'));
                        setShowDashboardPopover(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-lime-400 hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Proyecto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Navigation (80%) */}
          <div className="w-[80%] flex items-center justify-center">
            {/* Main Navigation Buttons - Centered */}
            <div className="flex items-center gap-4 relative">
              {navigationSections.map((section) => {
                const { section: sectionKey, icon: Icon, label } = section;
                const isActive = currentSection === sectionKey;
                
                return (
                  <button
                    key={sectionKey}
                    onClick={() => handleSectionClick(sectionKey)}
                    onMouseEnter={() => handleSectionHover(sectionKey)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      isActive 
                        ? "bg-lime-500 text-gray-900" 
                        : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Button (10%) */}
          <div className="w-[10%] flex items-center justify-center relative">
            <div
              onMouseEnter={() => setShowProfilePopover(true)}
              onMouseLeave={() => setShowProfilePopover(false)}
              className="relative"
            >
              <button
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
                )}
              >
                <User className="w-5 h-5" />
              </button>

              {/* Profile Popover */}
              {showProfilePopover && (
                <div className="absolute top-12 right-0 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl p-3 min-w-[220px] z-60">
                  <div className="text-sm font-medium text-gray-300 mb-2 px-2">
                    {user?.firstName} {user?.lastName}
                  </div>
                  {profileViews.map((view) => (
                    <button
                      key={view.key}
                      onClick={() => handleProfileClick(view.key)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
                    >
                      <view.icon className="w-4 h-4" />
                      {view.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Submenu Fixed - Appears on hover */}
      {hoveredSection && (
        <div 
          className="fixed top-[50px] left-0 right-0 z-40 h-[50px] bg-[#1e1e1e] flex items-center"
          onMouseEnter={() => setHoveredSection(hoveredSection)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full max-w-full mx-auto px-4 flex items-center justify-center">
            <div className="flex items-center gap-4">
              {navigationSections.find(s => s.section === hoveredSection)?.views.map((view) => (
                <button
                  key={view.key}
                  onClick={() => handleViewClick(hoveredSection, view.key)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-full transition-all duration-300",
                    currentView === view.key
                      ? "bg-lime-500 text-gray-900 font-medium"
                      : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
                  )}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        hoveredSection ? "pt-[100px]" : "pt-[50px]"
      )}>
        {children}
      </main>
    </div>
  );
}