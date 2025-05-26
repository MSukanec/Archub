import { ChartLine, Building, Settings, User, Shield, Bell } from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const topNavigationItems = [
  { section: 'dashboard' as Section, icon: ChartLine, label: 'Organización' },
  { section: 'projects' as Section, icon: Building, label: 'Proyectos' },
];

const bottomNavigationItems = [
  { section: 'admin' as Section, icon: Shield, label: 'Administración' },
];

export default function PrimarySidebar() {
  const { currentSection, setSection } = useNavigationStore();
  const { user } = useAuthStore();

  return (
    <div className="w-16 bg-surface border-r border-border flex flex-col items-center py-4 space-y-2">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
      </div>
      
      {/* Top Navigation Icons */}
      {topNavigationItems.map(({ section, icon: Icon, label }) => (
        <button
          key={section}
          onClick={() => setSection(section)}
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200",
            currentSection === section
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
          )}
          title={label}
        >
          <Icon size={20} />
        </button>
      ))}
      
      <div className="flex-1" />
      
      {/* Separator */}
      <div className="w-8 h-px bg-border mb-4"></div>
      
      {/* Bottom Navigation Icons */}
      {bottomNavigationItems.map(({ section, icon: Icon, label }) => {
        // Hide admin section for non-admin users
        if (section === 'admin' && user?.role !== 'admin') {
          return null;
        }
        
        return (
          <button
            key={section}
            onClick={() => setSection(section)}
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 mb-2",
              currentSection === section
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
            )}
            title={label}
          >
            <Icon size={20} />
          </button>
        );
      })}
      
      {/* Notifications */}
      <button
        onClick={() => setSection('profile')}
        className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 mb-2 text-muted-foreground hover:text-foreground hover:bg-surface/60 relative"
        title="Notificaciones"
      >
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
      </button>
      
      {/* Profile Avatar */}
      <button
        onClick={() => setSection('profile')}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border-2",
          currentSection === 'profile'
            ? "bg-primary border-primary text-white"
            : "bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400"
        )}
        title="Perfil"
      >
        <span className="text-sm font-semibold">
          {user?.firstName?.[0]?.toUpperCase() || ''}
          {user?.lastName?.[0]?.toUpperCase() || ''}
        </span>
      </button>
    </div>
  );
}
