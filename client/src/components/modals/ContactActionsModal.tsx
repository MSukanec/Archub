import { Phone, Mail, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Contact } from '@/lib/contactsService';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contactar a {fullName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasContactMethods ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No hay información de contacto disponible para este contacto.
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {contact.phone && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Teléfono</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp Card */}
                    <Button
                      onClick={handleWhatsAppClick}
                      className="h-auto p-4 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
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
                      className="h-auto p-4 flex flex-col items-center gap-2"
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
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                  <Button
                    onClick={handleEmailClick}
                    variant="outline"
                    className="w-full h-auto p-4 flex items-center gap-3"
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

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}