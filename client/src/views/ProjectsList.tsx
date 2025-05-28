import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building, MapPin, Edit, Trash2, ArrowUpDown, Users, Calendar, DollarSign, Activity, CreditCard, TrendingUp, Lock } from 'lucide-react';
import { useFeatures } from '@/hooks/useFeatures';
import { LimitLock } from '@/components/features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { projectsService } from '@/lib/projectsService';
import { Project } from '@/lib/projectsService';
import CreateProjectModal from '@/components/modals/CreateProjectModal';

export default function ProjectsOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId, projectId, setUserContext } = useUserContextStore();
  const { setView } = useNavigationStore();
  const { checkLimit } = useFeatures();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects', organizationId],
    queryFn: () => projectsService.getAll(),
    enabled: !!organizationId,
  });

  // Verificar límites y ordenar proyectos
  const limitCheck = checkLimit('max_projects', projects.length);
  const allowedProjectsCount = limitCheck.limit > 0 ? limitCheck.limit : projects.length;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleProjectClick = (project: Project) => {
    // Verificar si el proyecto está bloqueado por límites del plan
    const projectIndex = filteredProjects.findIndex(p => p.id === project.id);
    const isBlocked = limitCheck.isLimited && projectIndex >= allowedProjectsCount;
    
    if (isBlocked) {
      toast({
        title: "Proyecto bloqueado",
        description: "Actualiza tu plan para acceder a todos tus proyectos",
        duration: 3000,
      });
      return;
    }

    if (project.id !== projectId) {
      // Agregar clase de animación antes del cambio
      const cards = document.querySelectorAll('[data-project-card]');
      cards.forEach(card => card.classList.add('animate-pulse'));
      
      setTimeout(() => {
        setUserContext({ projectId: project.id });
        toast({
          title: "Proyecto activo cambiado",
          description: `Ahora trabajas en: ${project.name}`,
          duration: 2000,
        });
        
        // Remover animación después del cambio
        setTimeout(() => {
          cards.forEach(card => card.classList.remove('animate-pulse'));
        }, 300);
      }, 150);
    }
  };

  const confirmDelete = () => {
    if (selectedProject) {
      deleteMutation.mutate(selectedProject.id);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'planning':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <ProjectsListSkeleton />;
  }

  // Primero separar proyectos permitidos y bloqueados
  const allowedProjects = projects.slice(0, allowedProjectsCount);
  const blockedProjects = projects.slice(allowedProjectsCount);
  
  // Filtrar y ordenar solo los proyectos permitidos
  const filteredAllowedProjects = allowedProjects
    .filter((project: Project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // First, sort by active project (active project comes first)
      if (a.id === projectId && b.id !== projectId) return -1;
      if (b.id === projectId && a.id !== projectId) return 1;
      
      // Then sort by creation date
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

  // Combinar proyectos filtrados con bloqueados (los bloqueados siempre al final)
  const filteredProjects = [...filteredAllowedProjects, ...blockedProjects];

  // Calcular estadísticas del dashboard
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Activo' || p.status === 'En Progreso').length;
  const completedProjects = projects.filter(p => p.status === 'Completado').length;
  const currentProject = projects.find(p => p.id === projectId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Resumen de Proyectos
        </h1>
        <p className="text-muted-foreground">
          Dashboard general de tus proyectos de construcción.
        </p>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              En progreso actualmente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos finalizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyecto Activo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary truncate">
              {currentProject?.name || 'Ninguno'}
            </div>
            <p className="text-xs text-muted-foreground">
              Proyecto seleccionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <ArrowUpDown size={16} />
          {sortOrder === 'newest' ? 'Más recientes' : 'Más antiguos'}
        </Button>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
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
          {filteredProjects.map((project: Project, index: number) => {
            const isActiveProject = project.id === projectId;
            // Verificar si el proyecto está en la lista de bloqueados
            const originalIndex = projects.findIndex(p => p.id === project.id);
            const isBlocked = limitCheck.isLimited && originalIndex >= allowedProjectsCount;
            return (
              <div key={project.id} className="relative">
                <Card 
                  data-project-card
                  className={`transition-all duration-300 relative ${
                    isBlocked 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer hover:border-border/60'
                  } ${
                    isActiveProject ? 'ring-2 ring-primary/20 border-primary/30 bg-primary/5' : ''
                  } ${!isActiveProject && !isBlocked ? 'hover:shadow-md hover:ring-1 hover:ring-primary/10' : ''}`}
                  onClick={() => handleProjectClick(project)}
                >
                  {/* Badge de bloqueo */}
                  {isBlocked && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <LimitLock
                        limitName="max_projects"
                        currentCount={index + 1}
                        featureName="Acceso al proyecto"
                        description="Actualiza tu plan para acceder a todos tus proyectos"
                      >
                        <div className="bg-blue-600 rounded-full p-1.5 shadow-lg">
                          <Lock className="h-3 w-3 text-white" />
                        </div>
                      </LimitLock>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isActiveProject ? 'bg-primary/20' : 'bg-primary/10'
                        }`}>
                          <Building className="text-primary" size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{project.name}</h3>
                            {isActiveProject && (
                              <Badge variant="default" className="text-xs bg-primary">
                                Activo
                              </Badge>
                            )}
                            <Badge variant={getStatusVariant(project.status)} className="text-xs">
                              {project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                          {project.client_name && (
                            <span className="text-sm text-muted-foreground">
                              Cliente: {project.client_name}
                            </span>
                          )}
                          {project.address && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin size={12} />
                              {project.address}, {project.city}
                            </div>
                          )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserContext({ projectId: project.id });
                            setView('budgets-main');
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Ir a Presupuestos"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span className="sr-only">Ir a presupuestos</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserContext({ projectId: project.id });
                            setView('movements-main');
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Ir a Movimientos"
                        >
                          <DollarSign className="h-4 w-4" />
                          <span className="sr-only">Ir a movimientos</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(project);
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar proyecto</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar proyecto</span>
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

      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
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

function ProjectsListSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}