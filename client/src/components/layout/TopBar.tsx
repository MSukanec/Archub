import { Bell, ChevronRight, Plus, ChevronDown, Zap, Crown, Rocket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { usersService } from '@/lib/usersService';
import { projectsService } from '@/lib/projectsService';
import { userPreferencesService } from '@/lib/userPreferencesService';

const breadcrumbConfig = {
  'dashboard-main': { section: 'Organización', view: 'Principal' },
  'dashboard-activity': { section: 'Organización', view: 'Actividad Reciente' },
  'projects-overview': { section: 'Proyectos', view: 'Resumen' },
  'projects-list': { section: 'Proyectos', view: 'Lista' },
  'contacts': { section: 'Agenda', view: 'Contactos' },
  'admin-organizations': { section: 'Administración', view: 'Organizaciones' },
  'admin-users': { section: 'Administración', view: 'Usuarios' },
  'admin-categories': { section: 'Administración', view: 'Categorías' },
  'admin-materials': { section: 'Administración', view: 'Materiales' },
  'admin-units': { section: 'Administración', view: 'Unidades' },
  'admin-elements': { section: 'Administración', view: 'Elementos' },
  'admin-actions': { section: 'Administración', view: 'Acciones' },
  'admin-tasks': { section: 'Administración', view: 'Gestión de Tareas' },
  'admin-permissions': { section: 'Administración', view: 'Permisos' },
  'profile-info': { section: 'Perfil', view: 'Información' },
  'profile-subscription': { section: 'Perfil', view: 'Suscripción' },
  'profile-notifications': { section: 'Perfil', view: 'Notificaciones' },
  'subscription-tables': { section: 'Planes', view: 'Suscripciones' },
};

export default function TopBar() {
  const { currentView, setView, setSection } = useNavigationStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Get user's plan information
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => usersService.getAll(),
    enabled: !!user,
  });
  
  const currentUserData = users.find(u => u.email === user?.email);
  
  const getPlanIcon = (planName: string | null | undefined) => {
    switch (planName?.toLowerCase()) {
      case 'free':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'pro':
        return <Crown className="h-4 w-4 text-blue-500" />;
      case 'enterprise':
        return <Rocket className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  // Fetch projects for the selector
  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects'],
    queryFn: () => projectsService.getAll(),
  });

  // Load last active project when user logs in
  useEffect(() => {
    if (user && projects.length > 0 && !currentProject) {
      const loadLastProject = async () => {
        try {
          const lastProjectId = await userPreferencesService.getLastProjectId(user.id);
          if (lastProjectId) {
            const lastProject = projects.find((p: any) => p.id === lastProjectId);
            if (lastProject) {
              setCurrentProject(lastProject);
            }
          }
        } catch (error) {
          console.error('Error loading last project:', error);
        }
      };
      loadLastProject();
    }
  }, [user, projects, currentProject, setCurrentProject]);

  const handleProjectChange = async (projectId: string) => {
    console.log('Project change triggered:', projectId);
    if (projectId === 'create-new') {
      console.log('Opening create project modal');
      setIsCreateModalOpen(true);
      // Navigate to projects list
      setSection('projects');
      setView('projects-list');
    } else {
      const project = projects.find((p: any) => p.id === projectId);
      if (project) {
        setCurrentProject(project);
        // Save last project to preferences
        if (user) {
          try {
            await userPreferencesService.updateLastProject(user.id, projectId);
          } catch (error) {
            console.error('Error saving last project:', error);
          }
        }
      }
    }
  };

  return (
    <>
      <header className="h-[45px] bg-[#141414] border-b border-border flex items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">{breadcrumbConfig[currentView]?.section || 'Metrik'}</span>
          <ChevronRight size={14} className="text-muted-foreground" />
          <span className="text-foreground">{breadcrumbConfig[currentView]?.view || 'Principal'}</span>
        </div>

        {/* Project Selector and Actions */}
        <div className="flex items-center space-x-4">
          {/* Project Selector */}
          <div className="min-w-[200px]">
            <Select 
              value={currentProject?.id?.toString() || ""} 
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="bg-[#1e1e1e] border-border">
                <SelectValue placeholder="Crear nuevo proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.length > 0 && projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
                <SelectItem value="create-new">
                  <div className="flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Crear nuevo proyecto</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Plan Button */}
          <button
            onClick={() => setView('subscription-tables')}
            className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-border hover:bg-[#282828] flex items-center justify-center transition-colors"
            title={`Plan: ${currentUserData?.plan_name || 'No asignado'}`}
          >
            {getPlanIcon(currentUserData?.plan_name)}
          </button>
        </div>
      </header>

      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
