import { useState, useEffect } from 'react';
import { X, Home, Building2, ClipboardList, Calendar, DollarSign, CreditCard, User } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { section: 'dashboard' as const, icon: Home, label: 'Dashboard' },
  { section: 'organization' as const, icon: Building2, label: 'Organización' },
  { section: 'sitelog' as const, icon: ClipboardList, label: 'Bitácora' },
  { section: 'contacts' as const, icon: Calendar, label: 'Agenda' },
  { section: 'movements' as const, icon: DollarSign, label: 'Finanzas' },
  { section: 'budgets' as const, icon: CreditCard, label: 'Presupuestos' },
  { section: 'profile' as const, icon: User, label: 'Perfil' },
];

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { currentSection, setSection } = useNavigationStore();
  const { user } = useAuthStore();

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleItemClick = (section: string) => {
    setSection(section as any);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Metrik</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.section;
              
              return (
                <li key={item.section}>
                  <button
                    onClick={() => handleItemClick(item.section)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left",
                      isActive
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}