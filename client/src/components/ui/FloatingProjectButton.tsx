import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function FloatingProjectButton() {
  const [isHovered, setIsHovered] = useState(false);
  const { organizationId, projectId, setUserContext } = useUserContextStore();

  // Fetch current project
  const { data: currentProject } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all projects for current organization
  const { data: projects } = useQuery({
    queryKey: ['/api/projects', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  const handleProjectChange = async (projId: string) => {
    const project = projects?.find(p => p.id === projId);
    if (project) {
      await setUserContext(organizationId, projId);
    }
  };

  const openCreateProjectModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateProjectModal'));
  };

  // Get project initials
  const getProjectDisplay = () => {
    if (!currentProject) return 'P';
    
    // Generate initials from project name
    const words = currentProject.name.split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return currentProject.name.substring(0, 2);
  };

  return (
    <div 
      className="fixed bottom-6 left-20 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-lg hover:shadow-xl rounded-xl",
          "flex items-center justify-center cursor-pointer",
          "transition-all duration-300 ease-in-out",
          "border border-primary/20",
          "relative overflow-hidden",
          isHovered 
            ? "h-auto py-3 px-4 min-w-48 flex-col" 
            : "h-14 w-14"
        )}
        style={{
          width: isHovered ? '192px' : '56px'
        }}
      >
        {isHovered ? (
          // Show projects list when hovered
          <div className="space-y-2 w-full">
            {projects?.map((project) => (
              <div
                key={project.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectChange(project.id);
                }}
                className={cn(
                  "flex items-center text-sm rounded px-2 py-1 cursor-pointer transition-colors w-full text-left",
                  project.id === projectId 
                    ? "bg-primary-foreground/20" 
                    : "hover:bg-primary-foreground/10"
                )}
              >
                <div className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold bg-primary-foreground/20 rounded flex-shrink-0">
                  {(() => {
                    const words = project.name.split(' ');
                    return words.length >= 2 ? words[0][0] + words[1][0] : project.name.substring(0, 2);
                  })()}
                </div>
                <span className="whitespace-nowrap truncate">{project.name}</span>
              </div>
            ))}
            <div className="border-t border-primary-foreground/20 pt-2">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateProjectModal();
                }}
                className="flex items-center text-sm hover:bg-primary-foreground/10 rounded px-2 py-1 cursor-pointer transition-colors w-full text-left"
              >
                <FolderOpen size={14} className="mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Nuevo Proyecto</span>
              </div>
            </div>
          </div>
        ) : (
          // Show project initials when not hovered
          <div className="flex items-center justify-center text-sm font-bold">
            {getProjectDisplay()}
          </div>
        )}
      </div>
    </div>
  );
}