import { Phone, Mail, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Contact } from '../lib/contactsService';
import ModernModal from '../components/ui/ModernModal';

interface ContactActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

export default function ContactActionsModal({ isOpen, onClose, contact }: ContactActionsModalProps) {
  if (!contact) return null;

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    return cleaned;
  };

  const handleWhatsAppClick = () => {
    if (contact.phone) {
      const formattedPhone = formatPhoneForWhatsApp(contact.phone);
      const whatsappUrl = `https://wa.me/${formattedPhone}`;
      window.open(whatsappUrl, '_blank');
      onClose();
    }
  };

  const handleEmailClick = () => {
    if (contact.email) {
      const mailtoUrl = `mailto:${contact.email}`;
      window.location.href = mailtoUrl;
      onClose();
    }
  };

  const handlePhoneClick = () => {
    if (contact.phone) {
      const telUrl = `tel:${contact.phone}`;
      window.location.href = telUrl;
      onClose();
    }
  };

  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
  const hasContactMethods = contact.phone || contact.email;

  const footer = (
    <div className="flex justify-end w-full">
      <Button
        variant="outline"
        onClick={onClose}
        className="bg-transparent border-input text-foreground hover:bg-surface-secondary rounded-lg"
      >
        Cerrar
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contactar a ${fullName}`}
      subtitle="Selecciona el método de contacto"
      icon={MessageCircle}
      footer={footer}
    >
      <div className="space-y-4">
        {!hasContactMethods ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              No hay información de contacto disponible para este contacto.
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {contact.phone && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Teléfono</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp Card */}
                  <Button
                    onClick={handleWhatsAppClick}
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    <MessageCircle className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">WhatsApp</div>
                      <div className="text-xs opacity-90">{contact.phone}</div>
                    </div>
                  </Button>

                  {/* Phone Call Card */}
                  <Button
                    onClick={handlePhoneClick}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-surface-primary border-input hover:bg-[#c5c5c5] rounded-lg"
                  >
                    <Phone className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Llamar</div>
                      <div className="text-xs text-muted-foreground">{contact.phone}</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Email</h4>
                <Button
                  onClick={handleEmailClick}
                  variant="outline"
                  className="w-full h-auto p-4 flex items-center gap-3 bg-surface-primary border-input hover:bg-[#c5c5c5] rounded-lg"
                >
                  <Mail className="h-6 w-6" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Enviar email</div>
                    <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                  </div>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ModernModal>
  );
}