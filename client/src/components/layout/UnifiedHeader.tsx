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

export default function UnifiedHeader() {
  const { currentSection, currentView, setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const [expandedSection, setExpandedSection] = useState<Section | null>(currentSection);

  const handleSectionClick = (section: Section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
      setSection(section);
    }
  };

  const handleViewClick = (section: Section, viewKey: string) => {
    setSection(section);
    setView(viewKey as any);
    setExpandedSection(null);
  };

  return (
    <div className="bg-surface-primary border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Navigation Sections */}
        <div className="flex items-center gap-2">
          {navigationSections.map(({ section, icon: Icon, label, views }) => (
            <div key={section} className="relative">
              {/* Circular Button */}
              <button
                onClick={() => handleSectionClick(section)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105",
                  currentSection === section 
                    ? "bg-primary text-white shadow-lg" 
                    : "bg-surface-secondary text-muted-foreground hover:bg-surface-secondary/80"
                )}
              >
                <Icon className="w-5 h-5" />
              </button>

              {/* Expanded Views */}
              {expandedSection === section && (
                <div className="absolute top-full left-0 mt-2 bg-surface-secondary border border-border rounded-xl shadow-lg py-2 min-w-[160px] z-50">
                  {views.map(({ key, label: viewLabel }) => (
                    <button
                      key={key}
                      onClick={() => handleViewClick(section, key)}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-primary",
                        currentView === key 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-foreground"
                      )}
                    >
                      {viewLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
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

      {/* Current Section Label */}
      {currentSection && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {(() => {
              const section = navigationSections.find(s => s.section === currentSection);
              const Icon = section?.icon;
              return (
                <>
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{section?.label}</span>
                </>
              );
            })()}
          </div>
          {currentView && (
            <>
              <ChevronDown className="w-3 h-3 text-muted-foreground rotate-[-90deg]" />
              <span className="text-sm font-medium text-foreground">
                {(() => {
                  const section = navigationSections.find(s => s.section === currentSection);
                  const view = section?.views.find(v => v.key === currentView);
                  return view?.label || currentView;
                })()}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}