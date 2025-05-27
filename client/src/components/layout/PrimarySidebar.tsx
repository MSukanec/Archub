import { Home, Building2, FolderKanban, CreditCard, ClipboardList, TrendingUp, Users, Settings, User, Shield, Bell, Contact, Crown } from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const topNavigationItems = [
  { section: 'dashboard' as Section, icon: Home, label: 'Dashboard' },
  { section: 'organization' as Section, icon: Building2, label: 'Organización' },
  { section: 'projects' as Section, icon: FolderKanban, label: 'Proyectos' },
  { section: 'budgets' as Section, icon: CreditCard, label: 'Presupuestos' },
  { section: 'sitelog' as Section, icon: ClipboardList, label: 'Bitácora' },
  { section: 'movements' as Section, icon: TrendingUp, label: 'Movimientos de Obra' },
  { section: 'contacts' as Section, icon: Contact, label: 'Agenda' },
];

const planNavigationItems = [
  { icon: Crown, label: 'Plan', view: 'subscription-tables' },
];

const bottomNavigationItems = [
  { section: 'admin' as Section, icon: Shield, label: 'Administración' },
];

export default function PrimarySidebar() {
  const { currentSection, setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();

  return (
    <div className="fixed left-0 top-0 h-screen w-[45px] bg-[#282828] border-r border-border flex flex-col items-center z-50">
      {/* Logo */}
      <div className="h-[45px] flex items-center justify-center border-b border-border w-full">
        <div className="w-[30px] h-[30px] bg-primary rounded-md flex items-center justify-center">
          <span className="text-sm font-bold text-black">M</span>
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
      
      {/* Plan Button with Separator */}
      <div className="flex flex-col items-center pb-2">
        {/* Separator */}
        <div className="w-[35px] h-px bg-border mb-3"></div>
        
        {/* Plan Button */}
        {planNavigationItems.map(({ icon: Icon, label, view }) => (
          <button
            key={label}
            onClick={() => setView(view as any)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-surface/60 mb-3"
            title={label}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
      
      {/* Bottom Navigation Icons */}
      <div className="flex flex-col items-center pb-4 space-y-[5px]">
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
      </div>
    </div>
  );
}