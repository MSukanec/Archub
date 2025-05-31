import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  X
} from 'lucide-react';
import { Project } from '@/lib/projectsService';

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ProjectInfoModal({ isOpen, onClose, project }: ProjectInfoModalProps) {
  if (!project) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'en progreso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'planificación':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'en pausa':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-white dark:bg-gray-900 border-0 rounded-2xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="relative px-6 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{project.name}</h2>
              <div className="flex items-center gap-3">
                <Badge className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
                <span className="text-blue-100 text-sm">
                  Creado el {formatDate(project.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          
          {/* Descripción */}
          {project.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <FileText className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold">Descripción</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-6">
                {project.description}
              </p>
            </div>
          )}

          {/* Información del Cliente */}
          {(project.client_name || project.email || project.contact_phone) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <User className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold">Información del Cliente</h3>
              </div>
              <div className="ml-6 space-y-2">
                {project.client_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{project.client_name}</span>
                  </div>
                )}
                {project.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a 
                      href={`mailto:${project.email}`} 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {project.email}
                    </a>
                  </div>
                )}
                {project.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a 
                      href={`tel:${project.contact_phone}`} 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {project.contact_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ubicación */}
          {(project.address || project.city || project.zip_code) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <MapPin className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold">Ubicación</h3>
              </div>
              <div className="ml-6 space-y-2">
                {project.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{project.address}</span>
                  </div>
                )}
                {(project.city || project.zip_code) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {[project.city, project.zip_code].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold">Fechas</h3>
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Creado: {formatDate(project.created_at)}
                </span>
              </div>
              {project.updated_at && project.updated_at !== project.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Actualizado: {formatDate(project.updated_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}