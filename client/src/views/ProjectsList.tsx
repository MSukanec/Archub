import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Building, MapPin, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import CreateProjectModal from '@/components/modals/CreateProjectModal';

export default function ProjectsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  if (isLoading) {
    return <ProjectsListSkeleton />;
  }

  const filteredProjects = projects?.filter((project: any) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Lista de Proyectos
            </h1>
            <p className="text-muted-foreground">
              Gestiona todos tus proyectos de construcción desde aquí.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Proyecto
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
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
            {filteredProjects.map((project: any) => (
              <Card key={project.id} className="hover:border-border/60 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="text-primary" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        {project.location && (
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <MapPin size={14} className="mr-1" />
                            {project.location}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="secondary">
                            {project.status}
                          </Badge>
                          {project.budget && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <DollarSign size={14} className="mr-1" />
                              ${parseFloat(project.budget).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <Progress value={project.progress || 0} className="w-24" />
                        <span className="text-sm text-muted-foreground w-12">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
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
