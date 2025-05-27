import { Plus, Zap, Crown, Rocket } from 'lucide-react';
import { useState } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { usersService } from '@/lib/usersService';
import { projectsService } from '@/lib/projectsService';
import { supabase } from '@/lib/supabase';

export default function TopBar() {
  const { setView, setSection } = useNavigationStore();
  const { organizationId, projectId, setUserContext } = useUserContextStore();
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

  // Fetch projects for the current organization
  const { data: projects = [] } = useQuery({
    queryKey: ['user-projects', organizationId],
    queryFn: () => projectsService.getAll(),
    enabled: !!organizationId,
  });

  // Find the current project based on projectId from context
  const currentProject = projects.find((p: any) => p.id === projectId);

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
        setUserContext({ projectId: projectId });
      }
    }
  };

  // Fetch current organization details
  const { data: currentOrganization } = useQuery({
    queryKey: ['/api/organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single();
      return data;
    },
    enabled: !!organizationId,
  });

  return (
    <>
      <header className="h-[45px] bg-[#282828] border-b border-border flex items-center justify-between px-6">
        {/* Left side - Organization and Project selectors */}
        <div className="flex items-center space-x-4">
          {/* Organization Display */}
          <div className="text-sm text-muted-foreground">
            <span>Organización: </span>
            <span className="text-foreground font-medium">
              {currentOrganization?.name || 'Cargando...'}
            </span>
          </div>
          
          {/* Project Selector */}
          <div className="min-w-[200px]">
            <Select 
              value={currentProject?.id?.toString() || ""} 
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="bg-[#1e1e1e] border-border h-8">
                <SelectValue placeholder="Proyecto: Crear nuevo proyecto" />
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
        </div>
      </header>

      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}