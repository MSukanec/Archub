import { ReactNode, useState } from 'react';
import { X, LucideIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClose: () => void;
}

interface ModalFooterProps {
  onClose: () => void;
  confirmText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
}

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
}

// Componente Header del Modal
function ModalHeader({ title, subtitle, icon: Icon, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-border/20 bg-[#e0e0e0] flex-shrink-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-8 w-8 p-0 rounded-lg hover:bg-[#d0d0d0] text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Componente Footer del Modal
function ModalFooter({ onClose, confirmText = "Confirmar", onConfirm, isLoading = false }: ModalFooterProps) {
  return (
    <div className="px-4 py-4 border-t border-border/20 bg-[#e0e0e0] flex-shrink-0">
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 bg-[#e0e0e0] border-[#919191]/30 text-[#919191] hover:bg-[#d0d0d0] rounded-xl"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        {onConfirm && (
          <Button
            onClick={onConfirm}
            className="flex-[3] bg-[#4f9eff] border-[#4f9eff] text-white hover:bg-[#3d8bef] rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        )}
      </div>
    </div>
  );
}

// Componente principal ModernModal
export default function ModernModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  icon,
  children, 
  footer,
  confirmText,
  onConfirm,
  isLoading = false
}: ModernModalProps) {
  if (!isOpen) return null;

  // Si se pasa un footer personalizado, usarlo; sino usar el ModalFooter por defecto
  const footerContent = footer || (
    <ModalFooter 
      onClose={onClose}
      confirmText={confirmText}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );

  return (
    <div 
      className="fixed inset-0 z-[9999]" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="modern-modal absolute bg-[#e0e0e0] shadow-2xl flex flex-col border-l border-border/20"
        style={{ 
          top: 0, 
          right: 0, 
          bottom: 0, 
          width: 'min(33.333vw, 90vw)', 
          minWidth: '420px',
          height: '100vh',
          margin: 0,
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <ModalHeader 
          title={title}
          subtitle={subtitle}
          icon={icon}
          onClose={onClose}
        />
        
        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#e0e0e0]">
          {children}
        </div>
        
        {/* Footer */}
        {footerContent}
      </div>
    </div>
  );
}

// Hook para manejar acordeones en modales
export function useModalAccordion(defaultOpen?: string) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(defaultOpen || null);

  const toggleAccordion = (accordion: string) => {
    setOpenAccordion(openAccordion === accordion ? null : accordion);
  };

  const isOpen = (accordion: string) => openAccordion === accordion;

  return { openAccordion, toggleAccordion, isOpen };
}

// Componente de Acordeón para usar dentro de los modales
interface ModalAccordionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export function ModalAccordion({ 
  id, 
  title, 
  subtitle, 
  icon: Icon, 
  isOpen, 
  onToggle, 
  children 
}: ModalAccordionProps) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full px-4 py-3 bg-muted/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div className="text-left">
            <span className="font-medium">{title}</span>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>
      
      {isOpen && (
        <div className="px-4 py-4 space-y-4 bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

// Estilos responsive para móvil
export const mobileModalStyles = `
  @media (max-width: 640px) {
    .modern-modal {
      width: 100vw !important;
      min-width: 100vw !important;
      max-width: 100vw !important;
    }
  }
`;