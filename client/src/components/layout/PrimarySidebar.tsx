import { useState, useEffect } from 'react';
import { 
  Home, Building2, FolderKanban, CreditCard, ClipboardList, DollarSign, Users, Settings, User, Calendar, UserCheck, Library, FolderOpen, HardHat, BarChart3, TrendingUp, Contact, Shield, PanelLeftOpen, PanelLeftClose, Plus, Globe, LogOut, Moon, Sun, Lock as LockIcon, Crown, Zap, Rocket, FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigationStore, Section, View } from '../../stores/navigationStore';
import { useAuthStore } from '../../stores/authStore';
import { useUserContextStore } from '../../stores/userContextStore';
import { useFeatures } from '../../hooks/useFeatures';
import { queryClient } from '../../lib/queryClient';
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from '../../hooks/use-toast';

import { cn } from '../../lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubMenuItem {
  view: View;
  label: string;
  icon: any;
  locked?: boolean;
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
      { view: 'dashboard-timeline', label: 'Timeline', icon: Calendar },
      { view: 'projects-list', label: 'Gestión de Proyectos', icon: FolderKanban }
    ]
  },
  { 
    section: 'organization',
    icon: Building2,
    label: 'Organización',
    subItems: [
      { view: 'organization-overview', label: 'Resumen', icon: Building2 },
      { view: 'organization-team', label: 'Equipo', icon: Users },
      { view: 'organization-settings', label: 'Administración', icon: Settings }
    ]
  },
  { 
    section: 'projects',
    icon: FileText,
    label: 'Diseño',
    subItems: []
  },
  { 
    section: 'budgets',
    icon: HardHat,
    label: 'Obra',
    subItems: [
      { view: 'budgets-list', label: 'Tareas', icon: ClipboardList },
      { view: 'budgets-materials', label: 'Materiales', icon: Library },
      { view: 'sitelog-main', label: 'Bitácora', icon: Contact },
      { view: 'site-gantt', label: 'Gantt', icon: BarChart3, locked: true }
    ]
  },
  { 
    section: 'movements',
    icon: DollarSign,
    label: 'Finanzas',
    subItems: [
      { view: 'movements-dashboard', label: 'Dashboard', icon: BarChart3 },
      { view: 'movements-main', label: 'Movimientos', icon: TrendingUp }
    ]
  },
  { 
    section: 'contacts',
    icon: Users,
    label: 'Contactos',
    subItems: [
      { view: 'contacts', label: 'Lista de Contactos', icon: Users }
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

const adminItems: NavigationItem[] = [
  { 
    section: 'admin-community',
    icon: Users,
    label: 'Comunidad',
    subItems: [
      { view: 'admin-organizations', label: 'Organizaciones', icon: Building2 },
      { view: 'admin-users', label: 'Usuarios', icon: Users }
    ]
  },
  { 
    section: 'admin-library',
    icon: Library,
    label: 'Biblioteca',
    subItems: [
      { view: 'admin-categories', label: 'Categorías', icon: Settings },
      { view: 'admin-material-categories', label: 'Categorías de Materiales', icon: Library },
      { view: 'admin-materials', label: 'Materiales', icon: Contact },
      { view: 'admin-units', label: 'Unidades', icon: Settings },
      { view: 'admin-elements', label: 'Elementos', icon: FolderKanban },
      { view: 'admin-actions', label: 'Acciones', icon: Settings },
      { view: 'admin-tasks', label: 'Tareas', icon: ClipboardList },
      { view: 'admin-permissions', label: 'Permisos', icon: Shield }
    ]
  }
];

export default function PrimarySidebar() {
  const { currentSection, currentView, setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { userPlan } = useFeatures();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isDocked, setIsDocked] = useState(false);
  const { toast } = useToast();

  // Query current user data for avatar
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    enabled: !!user?.id
  });

  // Handle navigation
  const handleNavigation = (section: Section, view?: View) => {
    setSection(section);
    if (view) {
      setView(view);
    } else {
      // Set default views for sections when no specific view is provided
      const sectionItem = navigationItems.find(item => item.section === section);
      if (sectionItem && sectionItem.subItems && sectionItem.subItems.length > 0) {
        // Auto-select the first sub-item for all sections except dashboard
        if (section !== 'dashboard') {
          setView(sectionItem.subItems[0].view);
        }
      }
    }
    
    // When sidebar is docked and we click on a navigation item, show its secondary sidebar
    if (isDocked) {
      setHoveredItem(section);
    } else {
      setHoveredItem(null);
    }
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    setHoveredItem('profile');
  };

  // Handle hover for secondary sidebar
  const handleMouseEnter = (section: string) => {
    setHoveredItem(section);
  };

  const handleContainerMouseLeave = () => {
    // Only close when leaving the entire sidebar container if not docked
    if (!isDocked) {
      setTimeout(() => {
        setHoveredItem(null);
      }, 100);
    }
  };

  const handleMouseEnterOverride = (section: string) => {
    // Always allow navigation between sections, even when docked
    setHoveredItem(section);
  };

  const toggleDock = () => {
    setIsDocked(!isDocked);
    // When docking, keep current section's sidebar open
    if (!isDocked) {
      setHoveredItem(currentSection);
    }
    // When undocking, clear hovered item
    if (isDocked) {
      setHoveredItem(null);
    }
  };

  const allItems = [...navigationItems, ...(user?.role === 'admin' ? adminItems : [])];

  // Fetch projects for dashboard secondary sidebar
  const { organizationId, projectId: activeProjectId } = useUserContextStore();
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Use the same Supabase client that's working elsewhere in the app
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Direct Supabase query error:', error);
        throw new Error('Failed to fetch projects');
      }
      
      console.log('Projects fetched directly from Supabase:', data);
      
      // Sort projects to put the active project first
      const { projectId: activeProjectId } = useUserContextStore.getState();
      if (activeProjectId && data) {
        const sorted = [...data].sort((a, b) => {
          if (a.id === activeProjectId) return -1;
          if (b.id === activeProjectId) return 1;
          return 0;
        });
        return sorted;
      }
      
      return data || [];
    },
    enabled: !!organizationId && (hoveredItem === 'dashboard' || (isDocked && hoveredItem === 'dashboard'))
  });

  const handleProjectSelect = async (projectId: string) => {
    // Update user preferences to set this as the active project
    try {
      const { supabase } = await import('../../lib/supabase');
      const { setProjectId } = useUserContextStore.getState();
      
      // Update the user context store immediately
      setProjectId(projectId);
      
      // Update user preferences in the database
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('Error updating user preferences:', error);
      } else {
        console.log('Project set as active:', projectId);
        // Invalidate the projects query to trigger a re-fetch and reorder
        queryClient.invalidateQueries({ queryKey: ['/api/projects', organizationId] });
      }
    } catch (error) {
      console.error('Error selecting project:', error);
    }
  };

  const handleNewProject = () => {
    // This will be handled by the existing CreateProjectModal
    setHoveredItem(null);
    // You can trigger the modal here if needed
  };

  const handleLogout = async () => {
    try {
      // Import supabase and authService
      const { authService } = await import('../../lib/supabase');
      
      // Clear auth state first
      const { logout } = useAuthStore.getState();
      logout();
      
      // Sign out from Supabase (this will trigger the auth state change)
      await authService.signOut();
      
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Fallback: Force clear everything and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  // Theme management with persistence
  const { preferences, updatePreferences } = useUserContextStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(preferences?.theme || 'dark');
  
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Save theme preference to database
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Load theme from preferences on component mount and when preferences change
  useEffect(() => {
    if (preferences?.theme) {
      setTheme(preferences.theme);
      document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
    } else {
      // Default to dark theme
      document.documentElement.classList.add('dark');
    }
  }, [preferences?.theme]);



  const renderDashboardSidebar = () => (
    <div className="h-full flex flex-col">
      <div className="px-4 h-[39px] flex items-center border-b border-border bg-muted/30">
        <h3 className="font-medium text-sm text-foreground">Dashboard</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {(projects as any[]).map((project: any) => {
          const isActive = project.id === activeProjectId;
          return (
            <button
              key={project.id}
              className={`w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors ${
                isActive 
                  ? 'text-primary border-r-2 border-primary bg-primary/5' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleProjectSelect(project.id)}
            >
              <FolderKanban className="w-4 h-4" />
              {project.name}
            </button>
          );
        })}
        
        {/* Project Management Button */}
        <button
          className={`w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors border-t border-dashed border-border/50 ${
            currentView === 'projects-list' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleNavigation('projects', 'projects-list')}
        >
          <FolderKanban className="w-4 h-4" />
          Gestión de Proyectos
        </button>
      </div>
    </div>
  );

  const renderProfileSidebar = () => (
    <div className="h-full flex flex-col">
      <div className="px-4 h-[39px] flex items-center border-b border-border bg-muted/30">
        <h3 className="font-medium text-sm text-foreground">Perfil</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Mi Perfil Button */}
        <button
          className="w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSection('profile');
            setView('profile-main');
            setHoveredItem(null);
          }}
        >
          <User className="w-4 h-4" />
          Mi Perfil
        </button>
        
        {/* Security Button */}
        <button
          className="w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSection('profile');
            setView('profile-security');
            setHoveredItem(null);
          }}
        >
          <LockIcon className="w-4 h-4" />
          Seguridad
        </button>
        
        {/* Subscription Button */}
        <button
          className="w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSection('profile');
            setView('profile-subscription');
            setHoveredItem(null);
          }}
        >
          <CreditCard className="w-4 h-4" />
          Suscripción
        </button>
        
        {/* Theme Toggle */}
        <button
          className="w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        </button>

      </div>
      
      {/* Logout Button at bottom */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors text-red-500 hover:text-red-400 border-t border-dashed border-border/50">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#141414] border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-muted-foreground hover:bg-muted/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const renderRegularSidebar = (item: any) => (
    <div className="h-full flex flex-col">
      <div className="px-4 h-[39px] flex items-center border-b border-border bg-muted/30">
        <h3 className="font-medium text-sm text-foreground">{item.label}</h3>
      </div>
      <div className="flex-1">
        {item.subItems.map((subItem: any) => {
          const SubIcon = subItem.icon;
          const isSubActive = currentView === subItem.view;
          const isLocked = subItem.locked && user?.role !== 'admin';
          
          return (
            <button
              key={subItem.view}
              className={cn(
                "w-full px-4 h-[39px] text-left text-sm flex items-center gap-3 transition-colors relative",
                isSubActive
                  ? "text-primary"
                  : isLocked
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => {
                if (isLocked) {
                  toast({
                    title: "Funcionalidad Próximamente",
                    description: "Esta función estará disponible próximamente. Mantente atento a las actualizaciones.",
                    duration: 3000,
                  });
                  return;
                }
                handleNavigation(item.section, subItem.view);
              }}
              disabled={isLocked}
            >
              <SubIcon className="w-4 h-4" />
              {subItem.label}
              {isLocked && (
                <LockIcon className="w-3 h-3 ml-auto text-muted-foreground/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div 
      className="flex h-full" 
      onMouseLeave={handleContainerMouseLeave}
    >
      {/* Primary Sidebar */}
      <div className="h-full bg-background border-r border-border flex flex-col w-[40px] min-w-[40px] max-w-[40px]">
        {/* Main Navigation Items */}
        <div className="flex flex-col">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentSection === item.section;
            const isDashboard = item.section === 'dashboard';
            
            return (
              <div key={item.section} className="relative">
                <button
                  className={cn(
                    "w-[40px] h-[39px] flex items-center justify-center transition-colors",
                    isDashboard && "border-b border-border",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleNavigation(item.section)}
                  onMouseEnter={() => handleMouseEnter(item.section)}
                >
                  <Icon className="w-[20px] h-[20px]" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Section - Admin buttons + Dock toggle + Profile */}
        <div className="flex flex-col mt-auto">
          {/* Admin Section */}
          {user?.role === 'admin' && adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.section;
            
            return (
              <div key={item.section} className="relative">
                <button
                  className={cn(
                    "w-[40px] h-[39px] flex items-center justify-center transition-colors",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleNavigation(item.section)}
                  onMouseEnter={() => handleMouseEnter(item.section)}
                >
                  <Icon className="w-[20px] h-[20px]" />
                </button>
              </div>
            );
          })}

          {/* Dock Toggle Button */}
          <button
            className={cn(
              "w-[40px] h-[39px] flex items-center justify-center transition-colors",
              isDocked
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleDock}
            title={isDocked ? "Undock sidebar" : "Dock sidebar"}
          >
            {isDocked ? (
              <PanelLeftClose className="w-[20px] h-[20px]" />
            ) : (
              <PanelLeftOpen className="w-[20px] h-[20px]" />
            )}
          </button>

          {/* Plan Button */}
          <button
            className={cn(
              "w-[40px] h-[39px] flex items-center justify-center transition-colors",
              currentSection === 'profile' && (currentView === 'subscription-tables' || currentView === 'profile-subscription')
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => {
              setSection('profile');
              setView('subscription-tables');
            }}
            title="Plan de suscripción"
          >
            {(() => {
              const currentPlan = userPlan?.name?.toLowerCase() || 'free';
              if (currentPlan === 'pro') return <Crown className="w-[20px] h-[20px] text-primary" />;
              if (currentPlan === 'enterprise') return <Rocket className="w-[20px] h-[20px] text-primary" />;
              return <Zap className="w-[20px] h-[20px] text-primary" />;
            })()}
          </button>

          {/* Profile Button */}
          <button
            className={cn(
              "w-[40px] h-[39px] flex items-center justify-center transition-colors",
              hoveredItem === 'profile' || currentSection === 'profile'
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleNavigation('profile', 'profile-main')}
            onMouseEnter={() => handleMouseEnter('profile')}
          >
            <UserAvatar 
              size="sm" 
              className="ring-2 ring-transparent hover:ring-primary/20 transition-all" 
              currentUser={currentUser as any}
            />
          </button>
        </div>
      </div>

      {/* Secondary Sidebar */}
      {(hoveredItem || isDocked) && (
        <div className="h-full bg-background border-r border-border w-[200px] min-w-[200px] max-w-[200px] z-10">
          {hoveredItem === 'dashboard'
            ? renderDashboardSidebar()
            : hoveredItem === 'profile'
            ? renderProfileSidebar()
            : allItems
                .filter(item => item.section === hoveredItem)
                .map((item) => (
                  <div key={item.section}>
                    {renderRegularSidebar(item)}
                  </div>
                ))
          }
        </div>
      )}
    </div>
  );
}