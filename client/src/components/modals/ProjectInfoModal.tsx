import { Building, MapPin, User, Share2, Phone, Mail, ExternalLink } from 'lucide-react';
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
    let locationText = project.address || 'No especificada';
    if (project.city) {
      locationText += `, ${project.city}`;
    }
    if (project.zip_code) {
      locationText += ` (CP: ${project.zip_code})`;
    }

    let message = `📋 *Información del Proyecto*\n\n` +
      `🏗️ *Proyecto:* ${project.name}\n` +
      `👤 *Cliente:* ${project.client_name || 'No especificado'}\n`;
    
    if (project.contact_phone) {
      message += `📞 *Teléfono:* ${project.contact_phone}\n`;
    }
    
    message += `📍 *Ubicación:* ${locationText}\n`;
    
    if (project.email) {
      message += `📧 *Email:* ${project.email}\n`;
    }

    // Agregar enlace de Google Maps si hay coordenadas
    if (project.lat && project.lng) {
      const googleMapsUrl = `https://maps.google.com/?q=${project.lat},${project.lng}`;
      message += `🗺️ *Ubicación en Maps:* ${googleMapsUrl}`;
    } else if (project.address) {
      const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(project.address)}`;
      message += `🗺️ *Ubicación en Maps:* ${googleMapsUrl}`;
    }
    
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
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Cliente</h3>
              <p className="text-gray-600 mb-2">{project.client_name || 'No especificado'}</p>
              {project.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{project.contact_phone}</span>
                </div>
              )}
              {project.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{project.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Ubicación</h3>
              <p className="text-gray-600 mb-2">{project.address || 'No especificada'}</p>
              <div className="flex gap-4 text-sm text-gray-600">
                {project.city && (
                  <span>📍 {project.city}</span>
                )}
                {project.zip_code && (
                  <span>📮 CP: {project.zip_code}</span>
                )}
              </div>
              {(project.lat && project.lng || project.address) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = project.lat && project.lng 
                      ? `https://maps.google.com/?q=${project.lat},${project.lng}`
                      : `https://maps.google.com/?q=${encodeURIComponent(project.address || '')}`;
                    window.open(url, '_blank');
                  }}
                  className="mt-2 h-8 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir en Maps
                </Button>
              )}
            </div>
          </div>


        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-1/4"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleWhatsAppShare}
            className="w-3/4 bg-primary hover:bg-primary/90 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir por WhatsApp
          </Button>
        </div>
      </div>
    </ModernModal>
  );
}