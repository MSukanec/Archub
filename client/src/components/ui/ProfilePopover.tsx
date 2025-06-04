import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Moon, Sun, Settings } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';

interface ProfilePopoverProps {
  children: React.ReactNode;
}

export function ProfilePopover({ children }: ProfilePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setView } = useNavigationStore();
  const { preferences, updatePreferences } = useUserContextStore();
  const { user } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(preferences?.theme || 'dark');
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleProfileClick = () => {
    setView('profile-main');
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

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Apply theme classes and styles
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Apply background colors directly
    if (newTheme === 'dark') {
      document.body.style.backgroundColor = '#1e1e1e';
    } else {
      document.body.style.backgroundColor = '#d1d1d1';
    }
    
    // Save theme preference to database
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  // Load theme from preferences on component mount and when preferences change
  useEffect(() => {
    const currentTheme = preferences?.theme || 'dark';
    setTheme(currentTheme);
    
    // Apply theme classes and styles
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(currentTheme);
    
    // Apply background colors directly
    if (currentTheme === 'dark') {
      document.body.style.backgroundColor = '#1e1e1e';
    } else {
      document.body.style.backgroundColor = '#d1d1d1';
    }
  }, [preferences?.theme]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </div>

      {isOpen && (
        <div 
          className="fixed bottom-4 left-16 w-44 bg-card border border-border rounded-lg shadow-xl z-50"
        >
          {/* Menu Items - Compact */}
          <div className="py-1">
            {/* Profile Button */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-muted transition-colors"
            >
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-foreground">Mi Perfil</span>
            </button>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <Moon className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Sun className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-xs text-foreground">Modo Oscuro</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-primary scale-75"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border my-1" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-3 h-3" />
              <span className="text-xs">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}