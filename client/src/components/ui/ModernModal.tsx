import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export default function ModernModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  width = "w-[420px]"
}: ModernModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Modal positioned to the right */}
      <div className="ml-auto w-[420px] max-w-[90vw] h-screen bg-[#e0e0e0] shadow-2xl flex flex-col border-l border-border/20 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20 bg-[#e0e0e0] flex-shrink-0">
          <h2 className="text-xl font-semibold text-foreground">
            {title}
          </h2>
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
        <div className="flex-1 overflow-y-auto p-6 bg-[#e0e0e0]">
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