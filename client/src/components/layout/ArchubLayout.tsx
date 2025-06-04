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
  const [hoveredSection, setHoveredSection] = useState<Section | null>(null);
  const [showDashboardPopover, setShowDashboardPopover] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  
  // Mock projects data
  const projects = [
    { id: '1', name: 'Casa Familiar' },
    { id: '2', name: 'Edificio Comercial' },
    { id: '3', name: 'Renovación Oficina' }
  ];

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
    setSection('dashboard');
    setView('dashboard-main');
  };

  const handleProfileClick = (viewKey: string) => {
    setSection('profile');
    setView(viewKey);
    setShowProfilePopover(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header Principal - 50px height */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[50px] flex items-center">
        <div className="w-full max-w-full mx-auto px-4 flex items-center">
          {/* Dashboard Button (10%) */}
          <div className="w-[10%] flex items-center justify-center relative">
            <button
              onClick={handleDashboardClick}
              onMouseEnter={() => setShowDashboardPopover(true)}
              onMouseLeave={() => setShowDashboardPopover(false)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40"
              )}
            >
              <Home className="w-5 h-5 text-lime-400" />
            </button>

            {/* Dashboard Popover */}
            {showDashboardPopover && (
              <div className="absolute top-12 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[250px] z-60">
                <div className="text-sm font-medium text-gray-300 mb-2">Proyectos</div>
                {projects?.slice(0, 3).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      // Navigate to project
                      setShowDashboardPopover(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded transition-colors"
                  >
                    {project.name}
                  </button>
                ))}
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <button
                    onClick={() => {
                      // Create new project
                      setShowDashboardPopover(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-lime-400 hover:bg-gray-800 rounded transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Proyecto
                  </button>
                </div>
              </div>
            )}
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
            <button
              onMouseEnter={() => setShowProfilePopover(true)}
              onMouseLeave={() => setShowProfilePopover(false)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
              )}
            >
              <User className="w-5 h-5" />
            </button>

            {/* Profile Popover */}
            {showProfilePopover && (
              <div className="absolute top-12 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[200px] z-60">
                <div className="text-sm font-medium text-gray-300 mb-2">
                  {user?.firstName} {user?.lastName}
                </div>
                {profileViews.map((view) => (
                  <button
                    key={view.key}
                    onClick={() => handleProfileClick(view.key)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded transition-colors flex items-center gap-2"
                  >
                    <view.icon className="w-4 h-4" />
                    {view.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Submenu Fixed - Appears on hover */}
      {hoveredSection && (
        <div 
          className="fixed top-[50px] left-0 right-0 z-40 h-[50px] bg-gray-900/95 border-b border-gray-700/50 flex items-center"
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