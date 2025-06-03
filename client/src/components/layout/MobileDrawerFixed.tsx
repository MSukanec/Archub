import { useState, useEffect } from 'react';
import { X, Home, Building2, ClipboardList, Calendar, DollarSign, CreditCard, User, ChevronDown, ChevronRight, FolderOpen, Shield, Users } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { 
    section: 'dashboard' as const, 
    icon: Home, 
    label: 'Dashboard',
    subItems: [
      { id: 'dashboard-main', label: 'Resumen' },
      { id: 'dashboard-timeline', label: 'Timeline' }
    ]
  },
  { 
    section: 'organization' as const, 
    icon: Building2, 
    label: 'Organización',
    subItems: [
      { id: 'organization-overview', label: 'Organización' },
      { id: 'organization-team', label: 'Equipo' }
    ]
  },
  { 
    section: 'projects' as const, 
    icon: FolderOpen, 
    label: 'Proyectos',
    subItems: [
      { id: 'projects-overview', label: 'Vista General' },
      { id: 'projects-list', label: 'Lista de Proyectos' }
    ]
  },
  { 
    section: 'budgets' as const, 
    icon: CreditCard, 
    label: 'Obra',
    subItems: [
      { id: 'budgets-list', label: 'Lista de Presupuestos' },
      { id: 'budgets-tasks', label: 'Tabla de Cómputo' },
      { id: 'budgets-materials', label: 'Lista de Materiales' },
      { id: 'sitelog-main', label: 'Bitácora' }
    ]
  },
  { 
    section: 'calendar' as const, 
    icon: Calendar, 
    label: 'Agenda',
    subItems: []
  },
  { 
    section: 'movements' as const, 
    icon: DollarSign, 
    label: 'Finanzas',
    subItems: [
      { id: 'transactions', label: 'Movimientos' }
    ]
  },
  { 
    section: 'contacts' as const, 
    icon: Users, 
    label: 'Contactos',
    subItems: []
  },
  { 
    section: 'profile' as const, 
    icon: User, 
    label: 'Perfil',
    subItems: [
      { id: 'profile-info', label: 'Mi Perfil' },
      { id: 'profile-subscription', label: 'Suscripción' },
      { id: 'profile-notifications', label: 'Notificaciones' }
    ]
  },
];

const adminNavigationItems = [
  { 
    section: 'admin-community' as const, 
    icon: Shield, 
    label: 'Administración',
    subItems: [
      { id: 'admin-organizations', label: 'Organizaciones' },
      { id: 'admin-users', label: 'Usuarios' }
    ]
  },
  { 
    section: 'admin-library' as const, 
    icon: Building2, 
    label: 'Biblioteca',
    subItems: [
      { id: 'admin-tasks', label: 'Tareas' },
      { id: 'admin-categories', label: 'Tareas (Categorías)' },
      { id: 'admin-materials', label: 'Materiales' },
      { id: 'admin-material-categories', label: 'Materiales (Categorías)' },
      { id: 'admin-units', label: 'Unidades' },
      { id: 'admin-elements', label: 'Elementos' },
      { id: 'admin-actions', label: 'Acciones' }
    ]
  },
];

export default function MobileDrawerFixed({ isOpen, onClose }: MobileDrawerProps) {
  const { currentSection, currentView, setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { currentProjects, projectId, setUserContext } = useUserContextStore();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSectionClick = (section: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      if (openAccordion === section) {
        setOpenAccordion(null);
      } else {
        setOpenAccordion(section);
        setSection(section as any);
      }
    } else {
      // For sections without subitems, navigate directly
      setSection(section as any);
      onClose();
    }
  };

  const handleSubItemClick = (viewId: string) => {
    setView(viewId as any);
    onClose();
  };

  const handleProjectChange = (newProjectId: string) => {
    setUserContext({ projectId: newProjectId });
    setShowProjectMenu(false);
  };

  const currentProject = currentProjects?.find(p => p.id === projectId);
  
  const getProjectInitials = (project?: any) => {
    if (!project) return 'P';
    const words = project.name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return project.name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-full bg-surface-primary shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-input">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Archub</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Project Selector */}
        {currentProject && (
          <div className="p-4 border-b border-input">
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left bg-surface-secondary hover:bg-accent"
              >
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {getProjectInitials(currentProject)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{currentProject.name}</p>
                  <p className="text-xs text-muted-foreground">Proyecto Activo</p>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-foreground transition-transform",
                  showProjectMenu && "rotate-180"
                )} />
              </button>
              
              {showProjectMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-secondary rounded-lg border border-input shadow-lg z-10">
                  {currentProjects?.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectChange(project.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-surface-secondary first:rounded-t-lg last:rounded-b-lg",
                        project.id === projectId ? "bg-black text-white" : "text-foreground"
                      )}
                    >
                      <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {getProjectInitials(project)}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 pt-2 overflow-y-auto">
          <div className="space-y-6">
            {/* Main navigation section */}
            <div>
              <h3 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3 px-2">Principal</h3>
              <div className="space-y-1">
                {navigationItems.slice(0, 9).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.section;
                  const isExpanded = openAccordion === item.section;
                  const hasSubItems = item.subItems.length > 0;
                  
                  return (
                    <div key={item.section}>
                      {/* Main section button */}
                      <button
                        onClick={() => handleSectionClick(item.section, hasSubItems)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group",
                          isActive
                            ? "bg-black text-white"
                            : "text-white hover:bg-black/20 bg-surface-secondary"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4 text-white" />
                          <span className="font-normal text-sm">{item.label}</span>
                        </div>
                        {hasSubItems && (
                          <ChevronRight className={cn(
                            "w-4 h-4 text-white transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        )}
                      </button>
                      
                      {/* Sub-items */}
                      {hasSubItems && isExpanded && (
                        <div className="mt-1 ml-7 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = currentView === subItem.id;
                            return (
                              <button
                                key={subItem.id}
                                onClick={() => handleSubItemClick(subItem.id)}
                                className={cn(
                                  "w-full flex items-center px-3 py-2 rounded-md transition-colors text-left",
                                  isSubActive
                                    ? "bg-black text-white"
                                    : "text-white hover:bg-black/20 bg-surface-secondary"
                                )}
                              >
                                <span className="text-sm">{subItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin navigation items - only for admin users */}
            {user?.role === 'admin' && (
              <div>
                <h3 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3 px-2">Administración</h3>
                <div className="space-y-1">
                  {adminNavigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentSection === item.section;
                    const isExpanded = openAccordion === item.section;
                    
                    return (
                      <div key={item.section}>
                        {/* Main section button */}
                        <button
                          onClick={() => handleSectionClick(item.section, true)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group",
                            isActive
                              ? "bg-black text-white"
                              : "text-white hover:bg-black/20 bg-surface-secondary"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-4 h-4 text-white" />
                            <span className="font-normal text-sm">{item.label}</span>
                          </div>
                          <ChevronRight className={cn(
                            "w-4 h-4 text-white transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        </button>
                        
                        {/* Sub-items */}
                        {isExpanded && (
                          <div className="mt-1 ml-7 space-y-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive = currentView === subItem.id;
                              return (
                                <button
                                  key={subItem.id}
                                  onClick={() => handleSubItemClick(subItem.id)}
                                  className={cn(
                                    "w-full flex items-center px-3 py-2 rounded-md transition-colors text-left",
                                    isSubActive
                                      ? "bg-black text-white"
                                      : "text-white hover:bg-black/20 bg-surface-secondary"
                                  )}
                                >
                                  <span className="text-sm">{subItem.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-input">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}