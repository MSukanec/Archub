import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building, MapPin, Edit, Trash2, ArrowUpDown, Users, Calendar, DollarSign, Activity, CreditCard, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { projectsService, Project } from '@/lib/projectsService';
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

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects', organizationId],
    queryFn: () => projectsService.getAll(),
    enabled: !!organizationId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsService.delete(id),
    onSuccess: () => {
      // Invalidate both the specific project query and all projects queries
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.removeQueries({ queryKey: ['/api/projects', organizationId] });
      
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
        duration: 2000,
      });
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el proyecto.",
        duration: 2000,
      });
    }
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

  const filteredProjects = projects
    .filter((project: Project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // First, sort by active project (active project comes first)
      if (a.id === projectId && b.id !== projectId) return -1;
      if (b.id === projectId && a.id !== projectId) return 1;
      
      // Then sort by date
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Calcular estadísticas del dashboard
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Activo' || p.status === 'En Progreso').length;
  const completedProjects = projects.filter(p => p.status === 'Completado').length;
  const currentProject = projects.find(p => p.id === projectId);

  return (
    <>
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
              <div className="text-2xl font-bold text-primary">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                Proyectos en tu organización
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
                En progreso o planificación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
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
            {filteredProjects.map((project: Project) => {
              const isActiveProject = project.id === projectId;
              return (
                <Card 
                  key={project.id}
                  data-project-card
                  className={`hover:border-border/60 transition-all duration-300 cursor-pointer ${
                    isActiveProject ? 'ring-2 ring-primary/20 border-primary/30 bg-primary/5' : ''
                  } ${!isActiveProject ? 'hover:shadow-md hover:ring-1 hover:ring-primary/10' : ''}`}
                  onClick={() => handleProjectClick(project)}
                >
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
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin size={12} className="mr-1" />
                              {project.address}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Creado: {new Date(project.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserContext({ projectId: project.id });
                          setView('budgets-list');
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
            );
            })}
          </div>
        )}
      </div>

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
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto
              <strong> {selectedProject?.name}</strong> y todos sus datos asociados.
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
    </>
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
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-64" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
