import { Building, MapPin, User, Share2, Phone, Mail, ExternalLink } from 'lucide-react';
import { Project } from '@/lib/projectsService';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

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
      title={project.name}
      subtitle="Información completa del proyecto de construcción"
      icon={Building}
    >
      <div className="space-y-3">
        {/* Client */}
        <div className="flex items-center gap-3 p-3 bg-[#e1e1e1] rounded-lg">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground mb-1">Cliente</h3>
            <p className="text-sm text-muted-foreground truncate">{project.client_name || 'No especificado'}</p>
            <div className="flex gap-3 mt-1">
              {project.contact_phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <PhoneInput
                    value={project.contact_phone}
                    disabled
                    containerClass="phone-input-display"
                    inputClass="!text-xs !p-0 !border-0 !bg-transparent !text-muted-foreground"
                    buttonClass="!border-0 !bg-transparent !p-0 !w-4 !h-3"
                    dropdownClass="hidden"
                    country="ar"
                    disableDropdown
                    inputStyle={{
                      fontSize: '12px',
                      padding: '0',
                      border: 'none',
                      background: 'transparent',
                      color: 'inherit',
                      width: 'auto'
                    }}
                    buttonStyle={{
                      border: 'none',
                      background: 'transparent',
                      padding: '0',
                      width: '16px',
                      height: '12px'
                    }}
                  />
                </div>
              )}
              {project.email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{project.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3 p-3 bg-[#e1e1e1] rounded-lg">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground mb-1">Ubicación</h3>
            <p className="text-sm text-muted-foreground truncate">{project.address || 'No especificada'}</p>
            <div className="flex gap-3 mt-1">
              {project.city && (
                <span className="text-xs text-muted-foreground">📍 {project.city}</span>
              )}
              {project.zip_code && (
                <span className="text-xs text-muted-foreground">📮 CP: {project.zip_code}</span>
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
                className="mt-2 h-6 text-xs px-2"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Abrir en Maps
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Actions - Como en los modales de admin */}
      <div className="flex gap-3 pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleWhatsAppShare}
          className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartir por WhatsApp
        </Button>
      </div>
    </ModernModal>
  );
}