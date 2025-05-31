import { ReactNode } from 'react';
import { X, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export default function ModernModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  icon: Icon,
  children, 
  footer,
  width = "w-[420px]"
}: ModernModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-[#e0e0e0] shadow-2xl flex flex-col border-l border-border/20 h-full"
        style={{ 
          width: '420px', 
          maxWidth: '90vw'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20 bg-[#e0e0e0] flex-shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 bg-[#8fc700] rounded-full flex items-center justify-center">
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
        
        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#e0e0e0]">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-border/20 bg-[#e0e0e0] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Responsive breakpoint styles for mobile
export const mobileModalStyles = `
  @media (max-width: 640px) {
    .modern-modal {
      width: 100vw !important;
      min-width: 100vw !important;
      max-width: 100vw !important;
    }
  }
`;