import { useState } from 'react';
import { 
  Home, 
  Building2, 
  FolderOpen, 
  HardHat, 
  Calendar, 
  DollarSign, 
  UserCheck,
  ChevronDown,
  Settings,
  User
} from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const navigationSections = [
  { 
    section: 'dashboard' as Section, 
    icon: Home, 
    label: 'Dashboard',
    views: [
      { key: 'dashboard-main', label: 'Dashboard' }
    ]
  },
  { 
    section: 'organization' as Section, 
    icon: Building2, 
    label: 'Organización',
    views: [
      { key: 'organization-overview', label: 'Vista General' },
      { key: 'organization-team', label: 'Equipo' },
      { key: 'organization-settings', label: 'Configuración' }
    ]
  },
  { 
    section: 'projects' as Section, 
    icon: FolderOpen, 
    label: 'Proyectos',
    views: [
      { key: 'projects-list', label: 'Lista de Proyectos' }
    ]
  },
  { 
    section: 'budgets' as Section, 
    icon: HardHat, 
    label: 'Obra',
    views: [
      { key: 'budgets-list', label: 'Presupuestos' },
      { key: 'materials-list', label: 'Materiales' },
      { key: 'logs-list', label: 'Bitácoras' }
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
      { key: 'movements-dashboard', label: 'Dashboard' },
      { key: 'movements-list', label: 'Movimientos' }
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

interface ArchubLayoutProps {
  children: React.ReactNode;
}

export default function ArchubLayout({ children }: ArchubLayoutProps) {
  const { currentSection, currentView, setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const [expandedSection, setExpandedSection] = useState<Section | null>(null);

  const handleSectionHover = (section: Section, sectionIndex: number) => {
    setExpandedSection(section);
    // No cambiar la sección actual, solo mostrar el menú
  };

  const handleMouseLeave = () => {
    setExpandedSection(null);
  };

  const handleSectionClick = (section: Section) => {
    setSection(section);
    // Navegar a la primera vista de la sección
    const sectionData = navigationSections.find(s => s.section === section);
    if (sectionData && sectionData.views.length > 0) {
      setView(sectionData.views[0].key as any);
    }
  };

  const handleViewClick = (section: Section, viewKey: string) => {
    setSection(section);
    setView(viewKey as any);
    setExpandedSection(null);
  };

  const getExpandedSectionIndex = () => {
    return navigationSections.findIndex(s => s.section === expandedSection);
  };

  const expandedIndex = getExpandedSectionIndex();
  const expandedSectionData = expandedSection ? navigationSections.find(s => s.section === expandedSection) : null;

  return (
    <div className="min-h-screen bg-surface-views">
      {/* Unified Header */}
      <div className="bg-surface-primary border-b border-border">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation Sections with Inline Animation */}
            <div 
              className="flex items-center gap-2 relative"
              onMouseLeave={handleMouseLeave}
            >
              {navigationSections.map((section, index) => {
                const { section: sectionKey, icon: Icon, label } = section;
                const isExpanded = expandedSection === sectionKey;
                const shouldMoveRight = expandedIndex !== -1 && index > expandedIndex;
                const expandedViewsWidth = expandedSectionData ? (expandedSectionData.views.length * 120) : 0;
                
                return (
                  <div
                    key={sectionKey}
                    className="flex items-center gap-2"
                    style={{
                      transform: shouldMoveRight ? `translateX(${expandedViewsWidth}px)` : 'translateX(0)',
                      transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {/* Circular Button */}
                    <button
                      onMouseEnter={() => handleSectionHover(sectionKey, index)}
                      onClick={() => handleSectionClick(sectionKey)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105",
                        currentSection === sectionKey 
                          ? "bg-primary text-white shadow-lg" 
                          : "bg-surface-secondary text-muted-foreground hover:bg-surface-secondary/80"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </button>

                    {/* Inline Views - appear after the hovered button */}
                    {isExpanded && (
                      <div 
                        className="flex items-center gap-2"
                        style={{
                          animation: 'slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {section.views.map(({ key, label: viewLabel }) => (
                          <button
                            key={key}
                            onClick={() => handleViewClick(sectionKey, key)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                              currentView === key 
                                ? "bg-primary text-white shadow-md" 
                                : "bg-surface-secondary text-foreground hover:bg-surface-secondary/80"
                            )}
                          >
                            {viewLabel}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Side - User Actions */}
            <div className="flex items-center gap-3">
              {/* Settings */}
              <button
                onClick={() => {
                  setSection('organization');
                  setView('organization-settings');
                }}
                className="w-10 h-10 rounded-full bg-surface-secondary text-muted-foreground hover:bg-surface-secondary/80 hover:text-foreground flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Profile */}
              <button
                onClick={() => {
                  setSection('profile');
                  setView('profile-info');
                }}
                className="w-10 h-10 rounded-full bg-surface-secondary text-muted-foreground hover:bg-surface-secondary/80 hover:text-foreground flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <User className="w-5 h-5" />
              </button>

              {/* User Info */}
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}

// CSS Animation for slide in right
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);