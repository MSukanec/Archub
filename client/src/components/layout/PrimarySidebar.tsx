import { useEffect } from 'react';
import { Home, Building2, FolderKanban, CreditCard, ClipboardList, DollarSign, Users, Settings, User, Shield, Bell, Contact, Crown, Zap, Rocket, Star, Diamond, Calendar, UserCheck, Library } from 'lucide-react';
import { useNavigationStore, Section } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import CircularButton from '@/components/ui/CircularButton';

const topNavigationItems = [
  { 
    section: 'dashboard' as Section, 
    icon: Home, 
    label: 'Dashboard',
    description: 'Vista general del proyecto, métricas y acceso rápido a funciones principales.'
  },
  { 
    section: 'organization' as Section, 
    icon: Building2, 
    label: 'Organización',
    description: 'Gestión de la empresa, equipos de trabajo y estructura organizacional.'
  },
  { 
    section: 'sitelog' as Section, 
    icon: ClipboardList, 
    label: 'Bitácora',
    description: 'Registro diario de actividades, eventos y seguimiento del progreso de obra.'
  },
  { 
    section: 'contacts' as Section, 
    icon: Calendar, 
    label: 'Agenda',
    description: 'Calendario de eventos, reuniones y gestión de contactos del proyecto.'
  },
  { 
    section: 'movements' as Section, 
    icon: DollarSign, 
    label: 'Finanzas',
    description: 'Control de ingresos, egresos y movimientos financieros del proyecto.'
  },
  { 
    section: 'budgets' as Section, 
    icon: CreditCard, 
    label: 'Presupuestos',
    description: 'Elaboración y gestión de presupuestos, cómputos métricos y materiales.'
  },
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
    <div className="w-[56px] flex flex-col relative z-30">
      {/* Dashboard button - fixed at top */}
      <div className="flex items-center justify-center pt-2.5 pl-2.5">
        <CircularButton
          icon={Home}
          isActive={currentSection === 'dashboard'}
          onClick={() => setSection('dashboard')}
          section="dashboard"
          label="Dashboard"
          description="Vista general del proyecto, métricas y acceso rápido a funciones principales."
        />
      </div>
      
      {/* Center navigation buttons */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 pl-2.5">
        {topNavigationItems.slice(1).map(({ section, icon, label, description }) => (
          <CircularButton
            key={section}
            icon={icon}
            isActive={currentSection === section}
            onClick={() => setSection(section)}
            section={section}
            label={label}
            description={description}
          />
        ))}

      </div>
      
      {/* Bottom buttons section */}
      <div className="flex items-center pb-2.5 pl-2.5">
        {/* Profile button */}
        <CircularButton
          icon={User}
          isActive={currentSection === 'profile'}
          onClick={() => setSection('profile')}
          section="profile"
          label="Perfil"
          description="Configuración de usuario, suscripción y preferencias de la cuenta."
        />
      </div>
    </div>
  );
}
