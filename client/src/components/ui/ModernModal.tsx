import { ReactNode, useState } from 'react';
import { X, LucideIcon, Plus, Minus } from 'lucide-react';
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
    <div className="flex items-center justify-between px-4 py-4 border-b border-border/20 bg-surface-views flex-shrink-0">
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
        className="h-8 w-8 p-0 rounded-lg hover:bg-surface-primary text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Componente Footer del Modal
function ModalFooter({ onClose, confirmText = "Confirmar", onConfirm, isLoading = false }: ModalFooterProps) {
  return (
    <div className="border-t border-border/20 bg-surface-views p-4">
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 bg-surface-secondary border-input text-muted-foreground hover:bg-surface-primary rounded-lg h-10"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        {onConfirm && (
          <Button
            onClick={onConfirm}
            className="flex-[3] bg-primary border-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10"
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
        className="modern-modal absolute bg-surface-views shadow-2xl border-l border-border/20"
        style={{ 
          top: 0, 
          right: 0, 
          bottom: 0, 
          width: 'min(33.333vw, 90vw)', 
          minWidth: '420px',
          height: '100vh',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column'
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
        
        {/* Body - Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0">
          {footerContent}
        </div>
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
    <div className="flex flex-col flex-shrink-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 bg-surface-views hover:bg-surface-primary transition-colors text-white flex-shrink-0 border-t border-b border-surface-primary"
        style={{ borderWidth: '2px' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Icon className="w-3 h-3 text-white" />
          </div>
          <div className="text-left">
            <div className="font-medium text-white text-sm">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </div>
        {isOpen ? (
          <Minus className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Plus className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 bg-surface-views">
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