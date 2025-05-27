import { Home, Building2, FolderKanban, CreditCard, ClipboardList, DollarSign, Users, Settings, User, Shield, Bell, Contact, Crown } from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const topNavigationItems = [
  { section: 'dashboard' as Section, icon: Home, label: 'Línea de Tiempo' },
  { section: 'organization' as Section, icon: Building2, label: 'Organización' },
  { section: 'projects' as Section, icon: FolderKanban, label: 'Proyectos' },
  { section: 'budgets' as Section, icon: CreditCard, label: 'Presupuestos' },
  { section: 'sitelog' as Section, icon: ClipboardList, label: 'Bitácora' },
  { section: 'movements' as Section, icon: DollarSign, label: 'Movimientos de Obra' },
  { section: 'contacts' as Section, icon: Contact, label: 'Agenda' },
];

const bottomNavigationItems = [
  { section: 'admin' as Section, icon: Shield, label: 'Administración' },
];

export default function PrimarySidebar() {
  const { currentSection, setSection, setHoveredSection } = useNavigationStore();
  const { user } = useAuthStore();

  return (
    <div className="w-[45px] bg-surface border-r border-border flex flex-col">
      {/* Header area - 45px alto para coincidir con TopBar */}
      <div className="h-[45px] flex items-center justify-center border-b border-border">
        <div className="w-[30px] h-[30px] bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
      </div>
      
      {/* Top Navigation Icons */}
      <div className="flex flex-col items-center pt-4 space-y-[5px]">
        {topNavigationItems.map(({ section, icon: Icon, label }) => (
          <button
            key={section}
            onClick={() => setSection(section)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              currentSection === section
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
            )}
            title={label}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
      
      <div className="flex-1" />
      
      {/* Bottom Navigation Icons */}
      <div className="flex flex-col items-center pb-4 space-y-[5px]">
        {/* Plan button */}
        <button
          onClick={() => {
            setSection('profile');
            // Use the navigation store to change view
            window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-surface/60"
          title="Plan"
        >
          <Crown size={20} />
        </button>
        
        {/* Separator */}
        <div className="w-6 h-px bg-border my-1"></div>
        
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
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
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
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-surface/60 relative"
          title="Notificaciones"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        {/* Profile Avatar */}
        <button
          onMouseEnter={() => setSection('profile')}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border-2",
            currentSection === 'profile'
              ? "bg-primary border-primary text-white"
              : "bg-gray-600 border-gray-500 text-white hover:bg-gray-500 hover:border-gray-400"
          )}
          title="Perfil"
        >
          <span className="text-xs font-semibold">
            {user?.firstName?.[0]?.toUpperCase() || ''}
            {user?.lastName?.[0]?.toUpperCase() || ''}
          </span>
        </button>
      </div>
    </div>
  );
}
