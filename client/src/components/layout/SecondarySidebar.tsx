import { Calendar, Shield, FolderOpen, Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import CircularButton from '@/components/ui/CircularButton';
import { useState, useEffect } from 'react';

export default function SecondarySidebar() {
  const { setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { organizationId, projectId, setUserContext, currentProjects } = useUserContextStore();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);

  // Use projects from the store instead of fetching again
  const projects = currentProjects || [];
  const currentProject = projects.find(p => p.id === projectId);

  // Get project initials
  const getProjectInitials = (project?: any) => {
    if (!project) return 'P';
    const words = project.name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return project.name.substring(0, 2).toUpperCase();
  };

  const handleProjectChange = (newProjectId: string) => {
    setUserContext({ projectId: newProjectId });
    setShowProjectMenu(false);
  };

  const handleCreateProject = () => {
    setView('projects-list');
    setShowProjectMenu(false);
  };

  const handleMouseEnter = () => {
    if (menuTimeout) {
      clearTimeout(menuTimeout);
      setMenuTimeout(null);
    }
    setShowProjectMenu(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowProjectMenu(false);
    }, 200); // Small delay to allow moving to popover
    setMenuTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (menuTimeout) {
        clearTimeout(menuTimeout);
      }
    };
  }, [menuTimeout]);

  return (
    <div className="fixed top-0 right-0 w-16 h-screen z-40 flex flex-col justify-between">
      {/* Top section - Project selector */}
      <div className="flex flex-col items-center pt-2.5 pr-2.5">
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Project button using CircularButton style but with custom content */}
          <div className="w-11 h-11 rounded-full bg-[#e1e1e1] hover:bg-[#d1d1d1] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer hover:animate-pulse-x text-[#919191] font-medium text-sm">
            {getProjectInitials(currentProject)}
          </div>

          {/* Project dropdown menu */}
          {showProjectMenu && (
            <div 
              className="absolute top-0 right-12 bg-white rounded-xl shadow-2xl border border-gray-200 min-w-64 z-50 py-2"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Cambiar Proyecto</h3>
                <p className="text-xs text-gray-500">Selecciona un proyecto activo</p>
              </div>

              {/* Projects list */}
              <div className="max-h-64 overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      project.id === projectId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                      project.id === projectId 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getProjectInitials(project)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${
                        project.id === projectId ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {project.name}
                      </p>
                      {project.client_name && (
                        <p className="text-xs text-gray-500 truncate">{project.client_name}</p>
                      )}
                      {project.status && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          project.status === 'Activo' || project.status === 'En Progreso'
                            ? 'bg-green-100 text-green-700'
                            : project.status === 'Completado'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Create new project button */}
              <div className="border-t border-gray-100 mt-2">
                <button
                  onClick={handleCreateProject}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-blue-600"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm">Crear Nuevo Proyecto</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons section */}
      <div className="flex flex-col items-center space-y-2 pb-2.5 pr-2.5">
        {/* Dashboard button */}
        <CircularButton
          icon={Calendar}
          isActive={false}
          onClick={() => setView('dashboard-main')}
          label="Dashboard"
        />
        
        {/* Admin button - only for admin users */}
        {user?.role === 'admin' && (
          <CircularButton
            icon={Shield}
            isActive={false}
            onClick={() => setView('admin-organizations')}
            label="Administración"
          />
        )}
      </div>
    </div>
  );
}