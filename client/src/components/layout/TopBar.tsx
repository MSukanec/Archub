import { Bell, ChevronRight, Plus, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateProjectModal from '@/components/modals/CreateProjectModal';

const viewBreadcrumbs = {
  'dashboard-main': 'Dashboard',
  'dashboard-activity': 'Actividad Reciente',
  'projects-overview': 'Resumen de Proyectos',
  'projects-list': 'Lista de Proyectos',
  'admin-organizations': 'Organizaciones',
  'admin-users': 'Usuarios',
  'admin-units': 'Unidades',
  'admin-permissions': 'Permisos',
  'profile-info': 'Información del Perfil',
  'profile-subscription': 'Suscripción',
  'profile-notifications': 'Notificaciones',
};

export default function TopBar() {
  const { currentView } = useNavigationStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch projects for the selector
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const handleProjectChange = (projectId: string) => {
    if (projectId === 'create-new') {
      setIsCreateModalOpen(true);
    } else {
      const project = projects.find((p: any) => p.id.toString() === projectId);
      setCurrentProject(project || null);
    }
  };

  return (
    <>
      <header className="h-14 bg-[#141414] border-b border-border flex items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Metrik</span>
          <ChevronRight size={14} className="text-muted-foreground" />
          <span className="text-foreground">{viewBreadcrumbs[currentView]}</span>
        </div>

        {/* Project Selector and Actions */}
        <div className="flex items-center space-x-4">
          {/* Project Selector */}
          <div className="min-w-[200px]">
            <Select 
              value={currentProject?.id?.toString() || 'create-new'} 
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="bg-[#1e1e1e] border-border">
                <SelectValue placeholder="Seleccionar proyecto" />
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

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
          </Button>
        </div>
      </header>

      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
