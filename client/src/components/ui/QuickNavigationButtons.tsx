import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Building2, FolderOpen, Plus } from 'lucide-react';
import { useUserContextStore } from '../../stores/userContextStore';
import { useAuthStore } from '../../stores/authStore';
import { useFeatures } from '../../hooks/useFeatures';
import { projectsService } from '../../lib/projectsService';
import { supabase } from '../../lib/supabase';
import { FeatureLock } from '../../components/features/FeatureLock';

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
}

interface Project {
  id: string;
  name: string;
  client_name?: string;
}

export default function QuickNavigationButtons() {
  const { organizationId, projectId, setUserContext } = useUserContextStore();
  const { user } = useAuthStore();
  const { checkLimit, getCurrentPlan } = useFeatures();
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  // Fetch current organization
  const { data: currentOrganization } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      return data;
    },
    enabled: !!organizationId,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects-nav', organizationId],
    queryFn: () => projectsService.getAll(),
    enabled: !!organizationId,
  });

  const currentProject = projects.find(p => p.id === projectId);
  
  // Check project limits
  const projectLimit = checkLimit('max_projects', projects.length);
  const currentPlan = getCurrentPlan();

  // Generate initials for organization
  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate initials for project
  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProjectChange = (newProjectId: string) => {
    setUserContext({ projectId: newProjectId });
    setIsProjectMenuOpen(false);
  };

  const handleCreateProject = () => {
    window.dispatchEvent(new CustomEvent('openCreateProjectModal'));
    setIsProjectMenuOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Organization Button */}
      <div className="relative">
        <button
          onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
          onMouseEnter={() => setIsOrgMenuOpen(true)}
          onMouseLeave={() => setTimeout(() => setIsOrgMenuOpen(false), 200)}
          className="group flex items-center space-x-2 h-9 px-3 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {currentOrganization?.logo_url ? (
            <img 
              src={currentOrganization.logo_url} 
              alt={currentOrganization.name}
              className="w-5 h-5 rounded-sm object-cover"
            />
          ) : (
            <div className="w-5 h-5 bg-primary rounded-sm flex items-center justify-center text-xs font-bold text-foreground">
              {currentOrganization ? getOrgInitials(currentOrganization.name) : 'ORG'}
            </div>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Organization Menu */}
        {isOrgMenuOpen && (
          <div 
            className="absolute top-full right-0 mt-2 w-64 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-xl z-50"
            onMouseEnter={() => setIsOrgMenuOpen(true)}
            onMouseLeave={() => setIsOrgMenuOpen(false)}
          >
            <div className="p-3 border-b border-[#333]">
              <div className="text-xs font-medium text-muted-foreground mb-2">ORGANIZACIÓN</div>
              {currentOrganization && (
                <div className="flex items-center space-x-3">
                  {currentOrganization.logo_url ? (
                    <img 
                      src={currentOrganization.logo_url} 
                      alt={currentOrganization.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-sm font-bold text-foreground">
                      {getOrgInitials(currentOrganization.name)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-foreground">{currentOrganization.name}</div>
                    <div className="text-xs text-muted-foreground">Organización activa</div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-2">
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-[#282828] rounded transition-colors">
                <Plus className="w-4 h-4" />
                <span>Crear nueva organización</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Button */}
      <div className="relative">
        <button
          onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
          onMouseEnter={() => setIsProjectMenuOpen(true)}
          onMouseLeave={() => setTimeout(() => setIsProjectMenuOpen(false), 200)}
          className="group flex items-center space-x-2 h-9 px-3 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="w-5 h-5 bg-blue-600 rounded-sm flex items-center justify-center text-xs font-bold text-white">
            {currentProject ? getProjectInitials(currentProject.name) : 'PR'}
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Project Menu */}
        {isProjectMenuOpen && (
          <div 
            className="absolute top-full right-0 mt-2 w-72 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-xl z-50"
            onMouseEnter={() => setIsProjectMenuOpen(true)}
            onMouseLeave={() => setIsProjectMenuOpen(false)}
          >
            <div className="p-3 border-b border-[#333]">
              <div className="text-xs font-medium text-muted-foreground mb-2">PROYECTO ACTIVO</div>
              {currentProject && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-sm font-bold text-white">
                    {getProjectInitials(currentProject.name)}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{currentProject.name}</div>
                    {currentProject.client_name && (
                      <div className="text-xs text-muted-foreground">{currentProject.client_name}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {projects.length > 0 && (
              <div className="p-2 border-b border-[#333]">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-1">CAMBIAR PROYECTO</div>
                <div className="max-h-32 overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectChange(project.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded transition-colors ${
                        project.id === projectId 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground hover:bg-[#282828]'
                      }`}
                    >
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs font-bold text-white">
                        {getProjectInitials(project.name)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{project.name}</div>
                        {project.client_name && (
                          <div className="text-xs text-muted-foreground">{project.client_name}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-2">
              <FeatureLock
                feature="unlimited_projects"
                showLockIcon={false}
              >
                <button 
                  onClick={projectLimit.isLimited ? undefined : handleCreateProject}
                  disabled={projectLimit.isLimited}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-[#282828] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear nuevo proyecto</span>
                </button>
              </FeatureLock>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}