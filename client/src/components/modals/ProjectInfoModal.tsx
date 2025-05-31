import { Building, MapPin, User, Share2 } from 'lucide-react';
import { Project } from '@/lib/projectsService';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ProjectInfoModal({ isOpen, onClose, project }: ProjectInfoModalProps) {
  if (!project) return null;

  const handleWhatsAppShare = () => {
    const message = `📋 *Información del Proyecto*\n\n` +
      `🏗️ *Proyecto:* ${project.name}\n` +
      `👤 *Cliente:* ${project.client_name || 'No especificado'}\n` +
      `📍 *Ubicación:* ${project.location || 'No especificada'}\n` +
      `📞 *Teléfono:* ${project.client_phone || 'No especificado'}\n` +
      `📧 *Email:* ${project.client_email || 'No especificado'}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Información del Proyecto"
      icon={Building}
    >
      <div className="space-y-6">
        {/* Project Name */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{project.name}</h2>
        </div>

        {/* Project Details */}
        <div className="space-y-4">
          {/* Client */}
          <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Cliente</h3>
              <p className="text-gray-600">{project.client_name || 'No especificado'}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Ubicación</h3>
              <p className="text-gray-600">{project.location || 'No especificada'}</p>
            </div>
          </div>

          {/* Contact Info */}
          {(project.client_phone || project.client_email) && (
            <div className="space-y-3">
              {project.client_phone && (
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                  <span className="text-gray-700">📞 Teléfono</span>
                  <span className="font-medium text-gray-800">{project.client_phone}</span>
                </div>
              )}
              {project.client_email && (
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                  <span className="text-gray-700">📧 Email</span>
                  <span className="font-medium text-gray-800">{project.client_email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleWhatsAppShare}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir por WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </ModernModal>
  );
}