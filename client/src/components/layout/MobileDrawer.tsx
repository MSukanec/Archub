import { useState, useEffect } from 'react';
import { X, Home, Building2, ClipboardList, Calendar, DollarSign, CreditCard, User, ChevronDown, ChevronRight, FolderOpen, Shield } from 'lucide-react';
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
    section: 'sitelog' as const, 
    icon: ClipboardList, 
    label: 'Bitácora',
    subItems: [
      { id: 'sitelog-main', label: 'Bitácora' }
    ]
  },
  { 
    section: 'contacts' as const, 
    icon: Calendar, 
    label: 'Agenda',
    subItems: [
      { id: 'calendar', label: 'Agenda' },
      { id: 'contacts', label: 'Contactos' }
    ]
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
    section: 'budgets' as const, 
    icon: CreditCard, 
    label: 'Presupuestos',
    subItems: [
      { id: 'budgets-list', label: 'Lista de Presupuestos' },
      { id: 'budgets-tasks', label: 'Tabla de Cómputo' },
      { id: 'budgets-materials', label: 'Lista de Materiales' }
    ]
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

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
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

  const handleSectionClick = (section: string) => {
    if (openAccordion === section) {
      setOpenAccordion(null);
    } else {
      setOpenAccordion(section);
      setSection(section as any);
    }
    // NO cerrar automáticamente aquí - solo expandir/contraer acordeón
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
          "fixed top-0 left-0 h-full w-80 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: '#d2d2d2' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#919191]/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg text-black">Archmony</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#919191]/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Project Selector */}
        {currentProject && (
          <div className="p-4 border-b border-[#919191]/20">
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left bg-[#e1e1e1] hover:bg-[#919191]/10"
              >
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {getProjectInitials(currentProject)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black text-sm">{currentProject.name}</p>
                  <p className="text-xs text-[#919191]">Proyecto Activo</p>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-black transition-transform",
                  showProjectMenu && "rotate-180"
                )} />
              </button>
              
              {showProjectMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#e1e1e1] rounded-lg border border-[#919191]/20 shadow-lg z-10">
                  {currentProjects?.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectChange(project.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#919191]/10 first:rounded-t-lg last:rounded-b-lg",
                        project.id === projectId ? "bg-black text-white" : "text-black"
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
                {navigationItems.slice(0, 7).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.section;
                  const isExpanded = openAccordion === item.section;
                  
                  return (
                    <div key={item.section}>
                      {/* Main section button */}
                      <button
                        onClick={() => handleSectionClick(item.section)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group",
                          isActive
                            ? "bg-black text-white"
                            : "text-[#333] hover:bg-black/5 bg-card"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#666]")} />
                          <span className="font-normal text-sm">{item.label}</span>
                        </div>
                        {item.subItems.length > 1 && (
                          <ChevronRight className={cn(
                            "w-4 h-4 text-[#999] transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        )}
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
                                    : "text-[#666] hover:bg-black/5 bg-card"
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

            {/* Profile section */}
            {navigationItems.slice(7).length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3 px-2">Configuración</h3>
                <div className="space-y-1">
                  {navigationItems.slice(7).map((item) => {
                    const Icon = item.icon;
                    const isActive = currentSection === item.section;
                    const isExpanded = openAccordion === item.section;
                    
                    return (
                      <div key={item.section}>
                        {/* Main section button */}
                        <button
                          onClick={() => handleSectionClick(item.section)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group",
                            isActive
                              ? "bg-black text-white"
                              : "text-[#333] hover:bg-black/5 bg-card"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-4 h-4 text-[#666]" />
                            <span className="font-normal text-sm">{item.label}</span>
                          </div>
                          {item.subItems.length > 1 && (
                            <ChevronRight className={cn(
                              "w-4 h-4 text-[#999] transition-transform",
                              isExpanded && "rotate-90"
                            )} />
                          )}
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
                                      : "text-[#666] hover:bg-black/5 bg-card"
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
                          onClick={() => handleSectionClick(item.section)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group",
                            isActive
                              ? "bg-black text-white"
                              : "text-[#333] hover:bg-black/5 bg-card"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-4 h-4 text-[#666]" />
                            <span className="font-normal text-sm">{item.label}</span>
                          </div>
                          {item.subItems.length > 1 && (
                            <ChevronRight className={cn(
                              "w-4 h-4 text-[#999] transition-transform",
                              isExpanded && "rotate-90"
                            )} />
                          )}
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
                                      : "text-[#666] hover:bg-black/5 bg-card"
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

        {/* User Info - Fixed at absolute bottom */}
        {user && (
          <div className="p-4 border-t border-[#919191]/20 mt-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-black">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-[#919191]">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}