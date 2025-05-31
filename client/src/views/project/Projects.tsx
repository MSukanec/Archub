import { useState } from 'react';
import { FolderOpen, Plus, Building, MapPin, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserContextStore } from '@/stores/userContextStore';
import { projectsService } from '@/lib/projectsService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'planificación':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'en progreso':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'completado':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'pausado':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export default function Projects() {
  const { organizationId, projectId, setUserContext } = useUserContextStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: () => projectsService.getAll(),
    enabled: !!organizationId,
  });

  const handleProjectSelect = (selectedProjectId: string) => {
    setUserContext({ projectId: selectedProjectId });
  };

  const handleCreateProject = () => {
    window.dispatchEvent(new CustomEvent('openCreateProjectModal'));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Proyectos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona y administra tus proyectos de construcción
            </p>
          </div>
        </div>
        <Button 
          onClick={handleCreateProject}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay proyectos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comienza creando tu primer proyecto de construcción
            </p>
            <Button onClick={handleCreateProject}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primer proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                projectId === project.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleProjectSelect(project.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold line-clamp-1">
                    {project.name}
                  </CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                {project.client_name && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Building className="w-4 h-4" />
                    <span>{project.client_name}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                {project.address && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {project.address}
                      {project.city && `, ${project.city}`}
                    </span>
                  </div>
                )}

                {project.contact_phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{project.contact_phone}</span>
                  </div>
                )}

                {project.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{project.email}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Creado {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                    {projectId === project.id && (
                      <Badge variant="outline" className="text-xs">
                        Activo
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {projects.length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">En Progreso</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {projects.filter(p => p.status === 'En Progreso').length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Planificación</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {projects.filter(p => p.status === 'Planificación').length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Completados</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {projects.filter(p => p.status === 'Completado').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}