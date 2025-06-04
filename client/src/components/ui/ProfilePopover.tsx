import { useState } from 'react';
import { User, LogOut, Moon, Sun, Settings } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';

interface ProfilePopoverProps {
  children: React.ReactNode;
}

export function ProfilePopover({ children }: ProfilePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setView } = useNavigationStore();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();

  const handleProfileClick = () => {
    setView('profile-info');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      // The auth state will be updated by the auth listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setTimeout(() => setIsOpen(false), 200)}
      >
        {children}
      </div>

      {isOpen && (
        <div 
          className="absolute bottom-full mb-2 right-0 w-64 bg-surface-secondary border border-border rounded-lg shadow-xl z-50"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Info Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {getUserInitials()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile Button */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-surface-secondary/50 transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Mi Perfil</span>
            </button>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-4 py-3 hover:bg-surface-secondary/50 transition-colors">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm text-foreground">Modo Oscuro</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border my-2" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}