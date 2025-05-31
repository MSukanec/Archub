import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  X,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { projectsService } from '@/lib/projectsService';
import { useUserContextStore } from '@/stores/userContextStore';
import { useToast } from '@/hooks/use-toast';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import ProjectInfoModal from '@/components/modals/ProjectInfoModal';
// Use the existing Project type from projectsService
type Project = any;

export default function ProjectsOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToView, setProjectToView] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { projectId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects with stable query
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => projectsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetching to prevent glitch
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => projectsService.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Event listeners for floating action button
  useEffect(() => {
    const handleOpenCreateProjectModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateProjectModal', handleOpenCreateProjectModal);
    return () => {
      window.removeEventListener('openCreateProjectModal', handleOpenCreateProjectModal);
    };
  }, []);

  const handleEdit = (project: Project) => {
    // Funcionalidad de edición a implementar
    toast({
      title: "Función en desarrollo",
      description: "La edición de proyectos estará disponible próximamente.",
    });
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleViewProject = (project: Project) => {
    setProjectToView(project);
    setIsInfoModalOpen(true);
  };

  const handleProjectClick = (project: Project) => {
    // Set as active project and move to top
    const { setUserContext } = useUserContextStore.getState();
    setUserContext({ projectId: project.id });
  };

  const confirmDelete = () => {
    if (selectedProject) {
      deleteMutation.mutate(selectedProject.id);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // Filter and sort projects with active project first
  const filteredProjects = projects
    .filter((project: any) =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      // Active project first
      if (a.id === projectId && b.id !== projectId) return -1;
      if (b.id === projectId && a.id !== projectId) return 1;
      
      // Then by date
      if (sortOrder === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      } else {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
    });

  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Gestión de Proyectos
            </h1>
            <p className="text-sm text-muted-foreground">
              Dashboard general de tus proyectos de construcción
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl shadow-md bg-[#e1e1e1] p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Proyectos</p>
              <p className="text-3xl font-bold text-foreground">{totalProjects}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-md bg-[#e1e1e1] p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Proyectos Activos</p>
              <p className="text-3xl font-bold text-emerald-500">{activeProjects}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters con Projects List incluida */}
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
            <SelectTrigger className="w-[200px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-[#e1e1e1] border-[#919191]/20">
              <SelectItem value="newest">Más reciente primero</SelectItem>
              <SelectItem value="oldest">Más antiguo primero</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects List - Moved outside the card */}
      {filteredProjects.length === 0 ? (
        <Card className="rounded-2xl shadow-md bg-card p-12 border-0">
          <CardContent className="text-center p-0">
            <Building className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery 
                ? 'Intenta con un término de búsqueda diferente.'
                : 'Comienza creando tu primer proyecto de construcción.'
              }
            </p>
            {!searchQuery && (
              <Button 
                className="mt-4 bg-primary hover:bg-primary/90"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                Crear Proyecto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project: any) => {
            const isActiveProject = project.id === projectId;
            
            return (
              <div
                key={project.id}
                className={`p-3 rounded-2xl shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg bg-[#e1e1e1] hover:bg-primary/5 ${
                  isActiveProject 
                    ? 'border-2 border-primary' 
                    : 'border-0'
                }`}
                onClick={() => handleProjectClick(project)}
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">{project.name}</h3>
                              {isActiveProject && (
                                <Badge variant="default" className="text-xs bg-primary text-white">
                                  Activo
                                </Badge>
                              )}
                              <Badge variant={getStatusVariant(project.status || 'planning')} className="text-xs">
                                {project.status === 'active' ? 'Activo' : 
                                 project.status === 'completed' ? 'Completado' : 
                                 project.status === 'planning' ? 'Planificación' : 'En Progreso'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              {project.client_name && (
                                <span>Cliente: {project.client_name}</span>
                              )}
                              {project.address && (
                                <span>📍 {project.address}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProject(project);
                          }}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 w-8 p-0 rounded-lg"
                          title="Ver información del proyecto"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(project);
                          }}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 w-8 p-0 rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project);
                          }}
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8 p-0 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ProjectInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          setProjectToView(null);
        }}
        project={projectToView}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto "{selectedProject?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}