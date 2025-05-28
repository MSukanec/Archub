import { useEffect } from 'react';
import { Home, Building2, FolderKanban, CreditCard, ClipboardList, DollarSign, Users, Settings, User, Shield, Bell, Contact, Crown, Zap, Rocket, Star, Diamond } from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
  const { currentSection, setSection, setHoveredSection, setView } = useNavigationStore();
  const { user } = useAuthStore();

  // Escuchar eventos de navegación desde el timeline
  useEffect(() => {
    const handleTimelineNavigation = (event: CustomEvent) => {
      const { section, view } = event.detail;
      setSection(section);
      setView(view);
    };

    window.addEventListener('navigate-to-section', handleTimelineNavigation as EventListener);
    return () => {
      window.removeEventListener('navigate-to-section', handleTimelineNavigation as EventListener);
    };
  }, [setSection, setView]);

  // Function to get the plan icon based on plan name
  const getPlanIcon = (planName: string) => {
    const name = planName?.toLowerCase();
    switch (name) {
      case 'free':
        return Zap;
      case 'pro':
        return Crown;
      case 'enterprise':
        return Rocket;
      default:
        return Zap; // Default to Zap for free
    }
  };

  // Obtener el plan actual del usuario
  const { data: userPlan } = useQuery({
    queryKey: ['/api/user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          plan_id,
          plans (
            name,
            price
          )
        `)
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user plan:', error);
        return null;
      }
      
      return data?.plans || null;
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minuto de cache para actualizaciones más rápidas
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recibe foco
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
  });

  return (
    <div className="w-[56px] bg-card flex flex-col shadow-sm">
      {/* Header area - Logo */}
      <div className="h-[56px] flex items-center justify-center border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">M</span>
        </div>
      </div>
      
      {/* Top Navigation Icons */}
      <div className="flex flex-col items-center pt-6 space-y-2">
        {topNavigationItems.map(({ section, icon: Icon, label }) => (
          <button
            key={section}
            onClick={() => setSection(section)}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group",
              currentSection === section
                ? "text-primary bg-primary/10 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
            )}
            title={label}
          >
            <Icon size={20} className="transition-transform group-hover:scale-105" />
          </button>
        ))}
      </div>
      
      <div className="flex-1" />
      
      {/* Bottom Navigation Icons */}
      <div className="flex flex-col items-center pb-6 space-y-2">
        {/* Plan button */}
        <button
          onClick={() => {
            setSection('profile');
            // Use the navigation store to change view
            window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
          }}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105 group"
          title={userPlan ? `Plan: ${userPlan.name}` : "Plan"}
        >
          {(() => {
            const PlanIcon = getPlanIcon(userPlan?.name || '');
            return <PlanIcon size={20} className="transition-transform group-hover:scale-105" />;
          })()}
        </button>
        
        {/* Separator */}
        <div className="w-6 h-px bg-border my-3"></div>
        
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
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group",
                currentSection === section
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
              )}
              title={label}
            >
              <Icon size={20} className="transition-transform group-hover:scale-105" />
            </button>
          );
        })}
        
        {/* Notifications */}
        <button
          onClick={() => setSection('profile')}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105 relative group"
          title="Notificaciones"
        >
          <Bell size={20} className="transition-transform group-hover:scale-105" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-sm"></span>
        </button>
        
        {/* Profile Avatar */}
        <button
          onClick={() => setSection('profile')}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border-2",
            currentSection === 'profile'
              ? "bg-primary border-primary text-white"
              : "bg-primary/80 border-primary/60 text-white hover:bg-primary hover:border-primary"
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
