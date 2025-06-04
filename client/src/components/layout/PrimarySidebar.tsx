import { useState } from 'react';
import { Home, Building2, FolderKanban, CreditCard, ClipboardList, DollarSign, Users, Settings, User, Calendar, UserCheck, Library, FolderOpen, HardHat, BarChart3, TrendingUp, Contact } from 'lucide-react';
import { useNavigationStore, Section, View } from '@/stores/navigationStore';
import { cn } from '@/lib/utils';
import { ProfilePopover } from '@/components/ui/ProfilePopover';

interface SubMenuItem {
  view: View;
  label: string;
  icon: any;
}

interface NavigationItem {
  section: Section;
  icon: any;
  label: string;
  subItems: SubMenuItem[];
}

const navigationItems: NavigationItem[] = [
  { 
    section: 'dashboard',
    icon: Home,
    label: 'Dashboard',
    subItems: [
      { view: 'dashboard-main', label: 'Vista Principal', icon: Home },
      { view: 'dashboard-timeline', label: 'Timeline', icon: Calendar }
    ]
  },
  { 
    section: 'organization',
    icon: Building2,
    label: 'Organización',
    subItems: [
      { view: 'organization-overview', label: 'Resumen', icon: Building2 },
      { view: 'organization-team', label: 'Equipo', icon: Users },
      { view: 'organization-activity', label: 'Actividad', icon: BarChart3 }
    ]
  },
  { 
    section: 'projects',
    icon: FolderOpen,
    label: 'Proyectos',
    subItems: [
      { view: 'projects-overview', label: 'Resumen', icon: FolderOpen },
      { view: 'projects-list', label: 'Lista de Proyectos', icon: FolderKanban }
    ]
  },
  { 
    section: 'budgets',
    icon: HardHat,
    label: 'Obra',
    subItems: [
      { view: 'budgets-list', label: 'Presupuestos', icon: ClipboardList },
      { view: 'budgets-tasks', label: 'Tareas', icon: Settings },
      { view: 'budgets-materials', label: 'Materiales', icon: Library },
      { view: 'sitelog-main', label: 'Bitácora', icon: Contact }
    ]
  },
  { 
    section: 'movements',
    icon: DollarSign,
    label: 'Finanzas',
    subItems: [
      { view: 'movements-main', label: 'Movimientos', icon: TrendingUp },
      { view: 'transactions', label: 'Transacciones', icon: CreditCard }
    ]
  },
  { 
    section: 'contacts',
    icon: UserCheck,
    label: 'Contactos',
    subItems: [
      { view: 'contacts', label: 'Lista de Contactos', icon: UserCheck }
    ]
  },
  { 
    section: 'calendar',
    icon: Calendar,
    label: 'Calendario',
    subItems: [
      { view: 'calendar', label: 'Vista de Calendario', icon: Calendar }
    ]
  }
];

export default function PrimarySidebar() {
  const { currentSection, currentView, setSection, setView } = useNavigationStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });

  // Handle navigation
  const handleNavigation = (section: Section, view?: View) => {
    setSection(section);
    if (view) {
      setView(view);
    }
    setHoveredItem(null);
  };

  // Handle hover for submenu
  const handleMouseEnter = (section: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSubmenuPosition({
      top: rect.top,
      left: rect.right + 5
    });
    setHoveredItem(section);
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      setHoveredItem(null);
    }, 100);
  };

  return (
    <div className="h-full bg-background border-r border-border flex flex-col w-[40px] min-w-[40px] max-w-[40px]">
      {/* Main Navigation Items */}
      <div className="flex flex-col">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.section;
          
          return (
            <div key={item.section} className="relative">
              <button
                className={cn(
                  "w-[39px] h-[39px] flex items-center justify-center transition-colors border-b border-border/50",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => handleNavigation(item.section)}
                onMouseEnter={(e) => handleMouseEnter(item.section, e)}
                onMouseLeave={handleMouseLeave}
              >
                <Icon className="w-[20px] h-[20px]" />
              </button>
              
              {/* Submenu */}
              {hoveredItem === item.section && (
                <div
                  className="fixed bg-popover border border-border rounded-md shadow-md z-50 w-[250px] py-2"
                  style={{
                    top: submenuPosition.top,
                    left: submenuPosition.left,
                  }}
                  onMouseEnter={() => setHoveredItem(item.section)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-3 py-2 border-b border-border">
                    <h3 className="font-medium text-sm text-foreground">{item.label}</h3>
                  </div>
                  <div className="py-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = currentView === subItem.view;
                      
                      return (
                        <button
                          key={subItem.view}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors",
                            isSubActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                          onClick={() => handleNavigation(item.section, subItem.view)}
                        >
                          <SubIcon className="w-4 h-4" />
                          {subItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section - Profile */}
      <div className="flex flex-col mt-auto">
        <ProfilePopover />
      </div>
    </div>
  );
}