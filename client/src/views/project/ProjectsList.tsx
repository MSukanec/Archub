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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { projectsService } from '../lib/projectsService';
import { useUserContextStore } from '../stores/userContextStore';
import { useToast } from '../hooks/use-toast';
import { useFeatures } from '../hooks/useFeatures';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import ProjectInfoModal from '../components/modals/ProjectInfoModal';
import { FeatureLock } from '../components/features/FeatureLock';

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
  const { checkLimit, getCurrentPlan } = useFeatures();

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



  const handleCreate = () => {
    setSelectedProject(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsCreateModalOpen(true);
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

  // Check project limits
  const projectLimit = checkLimit('max_projects', projects.length);
  const currentPlan = getCurrentPlan();
  
  // Filter and sort projects with active project first
  let filteredProjects = projects
    .filter((project: any) =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      // Active project first
      if (a.id === projectId && b.id !== projectId) return -1;
      if (b.id === projectId && a.id !== projectId) return 1;
      
      // Then by date (newest first)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  // For FREE plan, show only the 2 most recent projects
  if (currentPlan === 'FREE' && projectLimit.limit > 0) {
    // Keep active project and fill with most recent ones up to limit
    const activeProject = filteredProjects.find(p => p.id === projectId);
    const otherProjects = filteredProjects.filter(p => p.id !== projectId);
    
    if (activeProject) {
      // If there's an active project, show it plus (limit-1) others
      filteredProjects = [activeProject, ...otherProjects.slice(0, projectLimit.limit - 1)];
    } else {
      // If no active project, show the most recent ones up to limit
      filteredProjects = otherProjects.slice(0, projectLimit.limit);
    }
  }

  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;

  return (
    <>
      <div className="flex-1 p-6 md:p-6 p-3 space-y-6 md:space-y-6 space-y-3">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
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
          <FeatureLock
            feature="unlimited_projects"
            showLockIcon={false}
          >
            <Button 
              onClick={projectLimit.isLimited ? undefined : handleCreate}
              disabled={projectLimit.isLimited}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </FeatureLock>
        </div>

        {/* Plan Limit Info for FREE users */}
      {currentPlan === 'FREE' && projectLimit.limit > 0 && (
        <div className="rounded-2xl shadow-md bg-amber-500/10 border border-amber-500/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Building className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Plan FREE - Límite de Proyectos
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {projectLimit.remaining > 0 
                  ? `Puedes crear ${projectLimit.remaining} proyecto${projectLimit.remaining !== 1 ? 's' : ''} más`
                  : 'Has alcanzado el límite de proyectos. Actualiza a PRO para proyectos ilimitados.'
                }
              </p>
            </div>
            <div className="text-sm font-bold text-amber-800 dark:text-amber-200">
              {totalProjects}/{projectLimit.limit}
            </div>
          </div>
        </div>
      )}

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Proyectos</p>
              <p className="text-3xl font-bold text-foreground">
                {totalProjects}
                {currentPlan === 'FREE' && projectLimit.limit > 0 && (
                  <span className="text-base text-muted-foreground ml-2">/ {projectLimit.limit}</span>
                )}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
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
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-surface-primary border-input rounded-xl"
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
            <SelectTrigger className="w-[200px] bg-surface-primary border-input rounded-xl">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="newest">Más reciente primero</SelectItem>
              <SelectItem value="oldest">Más antiguo primero</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects List - Moved outside the card */}
      {filteredProjects.length === 0 ? (
        <Card className="rounded-2xl shadow-md bg-surface-secondary p-12 border-0">
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
              <FeatureLock
                feature="unlimited_projects"
                showLockIcon={false}
              >
                <Button 
                  onClick={projectLimit.isLimited ? undefined : () => setIsCreateModalOpen(true)}
                  disabled={projectLimit.isLimited}
                  className="mt-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} className="mr-2" />
                  Crear Proyecto
                </Button>
              </FeatureLock>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects
            .sort((a: any, b: any) => {
              // Active project first
              if (a.id === projectId && b.id !== projectId) return -1;
              if (b.id === projectId && a.id !== projectId) return 1;
              // Then by updated_at (newest first)
              return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
            })
            .map((project: any, sortedIndex: number) => {
              const isActiveProject = project.id === projectId;
              const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   project.address?.toLowerCase().includes(searchQuery.toLowerCase());
              
              // For FREE plan, only allow access to the first N projects (sorted by updated_at)
              // Always allow access to active project regardless of position
              const isAccessible = currentPlan !== 'FREE' || 
                                  projectLimit.limit === -1 || 
                                  sortedIndex < projectLimit.limit ||
                                  isActiveProject;
              
              // Skip projects that don't match search
              if (!matchesSearch) return null;
              
              return (
                <div
                  key={project.id}
                  className={`p-3 rounded-2xl shadow-md transition-all duration-200 bg-surface-secondary relative ${
                    !isAccessible 
                      ? 'opacity-60 cursor-not-allowed border-2 border-amber-500/30' 
                      : isActiveProject 
                        ? 'border-2 border-primary cursor-pointer hover:shadow-lg' 
                        : 'border-2 border-transparent hover:border-primary cursor-pointer hover:shadow-lg'
                  }`}
                  onClick={isAccessible ? () => handleProjectClick(project) : undefined}
                >
                {!isAccessible && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                    Plan FREE
                  </div>
                )}
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
                          className="text-muted-foreground hover:text-foreground hover:bg-surface-secondary bg-surface-primary h-8 w-8 p-0 rounded-lg"
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
                          className="text-muted-foreground hover:text-foreground hover:bg-surface-secondary bg-surface-primary h-8 w-8 p-0 rounded-lg"
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
                          className="text-destructive hover:text-destructive/90 h-8 w-8 p-0 rounded-lg"
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
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
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

      {/* Floating Action Button - Mobile only */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <FeatureLock
          feature="unlimited_projects"
          showLockIcon={false}
        >
          <Button 
            onClick={projectLimit.isLimited ? undefined : handleCreate}
            disabled={projectLimit.isLimited}
            size="lg"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </FeatureLock>
      </div>
    </>
  );
}