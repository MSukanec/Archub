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
      {/* Unified Header - Fixed to top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-surface-primary border-b border-border">
        <div className="w-full px-6 py-4">
          <div className="flex items-center w-full gap-6">
            {/* Left Section - Dashboard Only (10%) */}
            <div className="w-[10%] flex items-center">
              {(() => {
                const dashboardSection = navigationSections[0]; // Dashboard section
                const { section: sectionKey, icon: Icon } = dashboardSection;
                return (
                  <button
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
                );
              })()}
            </div>

            {/* Center Section - Organization to Contacts (80%) */}
            <div className="w-[80%] flex items-center justify-center px-4">
              <div 
                className="flex items-center gap-2 relative overflow-hidden max-w-full"
                onMouseLeave={handleMouseLeave}
                style={{ width: 'fit-content', maxWidth: '100%' }}
              >
                {navigationSections.slice(1, -1).map((section, index) => { // Skip Dashboard and Contacts
                  const actualIndex = index + 1; // Adjust index for proper positioning
                  const { section: sectionKey, icon: Icon, label } = section;
                  const isExpanded = expandedSection === sectionKey;
                  const shouldMoveRight = expandedIndex !== -1 && actualIndex > expandedIndex;
                  
                  // Calculate exact width needed: each view button (75px min-width + padding) + gaps (8px between)
                  let expandedViewsWidth = 0;
                  if (expandedSectionData && expandedIndex !== -1 && actualIndex > expandedIndex) {
                    const viewCount = expandedSectionData.views.length;
                    expandedViewsWidth = (viewCount * 75) + ((viewCount - 1) * 8);
                  }
                  
                  return (
                    <div
                      key={sectionKey}
                      className="flex items-center gap-2"
                      style={{
                        transform: shouldMoveRight ? `translateX(${expandedViewsWidth}px)` : 'translateX(0)',
                        transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {/* Circular Button */}
                      <button
                        onMouseEnter={() => handleSectionHover(sectionKey, actualIndex)}
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
                            animation: 'slideInRight 600ms cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          {section.views.map(({ key, label: viewLabel }) => (
                            <button
                              key={key}
                              onClick={() => handleViewClick(sectionKey, key)}
                              className={cn(
                                "px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap min-w-[75px]",
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
            </div>

            {/* Right Section - Profile Only (10%) */}
            <div className="w-[10%] flex items-center justify-end">
              <button
                onClick={() => {
                  setSection('profile');
                  setView('profile-info');
                }}
                className="w-10 h-10 rounded-full bg-surface-secondary text-muted-foreground hover:bg-surface-secondary/80 hover:text-foreground flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full pt-20">
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