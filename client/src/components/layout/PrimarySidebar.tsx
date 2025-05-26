import { ChartLine, Building, Settings, User } from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { cn } from '@/lib/utils';

const navigationItems = [
  { section: 'dashboard' as Section, icon: ChartLine, label: 'Dashboard' },
  { section: 'projects' as Section, icon: Building, label: 'Proyectos' },
  { section: 'admin' as Section, icon: Settings, label: 'Administración' },
];

export default function PrimarySidebar() {
  const { currentSection, setSection } = useNavigationStore();

  return (
    <div className="w-16 bg-surface border-r border-border flex flex-col items-center py-4 space-y-2">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
      </div>
      
      {/* Navigation Icons */}
      {navigationItems.map(({ section, icon: Icon, label }) => (
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
      
      {/* Profile Icon */}
      <button
        onClick={() => setSection('profile')}
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200",
          currentSection === 'profile'
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
        )}
        title="Perfil"
      >
        <User size={20} />
      </button>
    </div>
  );
}
