import { Home, Calendar, CreditCard, User } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { cn } from '@/lib/utils';

const bottomNavItems = [
  { 
    section: 'dashboard' as const, 
    icon: Home, 
    label: 'Inicio',
    view: 'dashboard-main' as const
  },
  { 
    section: 'contacts' as const, 
    icon: Calendar, 
    label: 'Agenda',
    view: 'calendar' as const
  },
  { 
    section: 'budgets' as const, 
    icon: CreditCard, 
    label: 'Presupuestos',
    view: 'budgets-list' as const
  },
  { 
    section: 'profile' as const, 
    icon: User, 
    label: 'Perfil',
    view: 'profile-info' as const
  },
];

export default function MobileBottomNav() {
  const { currentSection, setSection, setView } = useNavigationStore();

  const handleItemClick = (section: string, view: string) => {
    setSection(section as any);
    setView(view as any);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-[#919191]/20 z-30" style={{ backgroundColor: '#d2d2d2' }}>
      <div className="flex items-center justify-around h-full px-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.section;
          
          return (
            <button
              key={item.section}
              onClick={() => handleItemClick(item.section, item.view)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1",
                isActive
                  ? "text-white"
                  : "text-black hover:bg-[#919191]/10"
              )}
              style={isActive ? { backgroundColor: '#6366f1' } : { backgroundColor: '#e1e1e1' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}