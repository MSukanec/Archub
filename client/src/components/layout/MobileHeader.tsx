import { Menu } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

// Mapeo de secciones a títulos legibles
const sectionTitles: Record<string, string> = {
  'dashboard': 'Dashboard',
  'organization': 'Organización',
  'sitelog': 'Bitácora',
  'contacts': 'Agenda',
  'movements': 'Finanzas',
  'budgets': 'Presupuestos',
  'profile': 'Perfil',
  'admin-community': 'Administración',
  'admin-library': 'Biblioteca',
};

// Mapeo de vistas específicas a títulos
const viewTitles: Record<string, string> = {
  'dashboard-main': 'Dashboard',
  'dashboard-timeline': 'Timeline',
  'organization-overview': 'Organización',
  'organization-team': 'Equipo',
  'organization-activity': 'Actividad',
  'projects-overview': 'Proyectos',
  'projects-list': 'Lista de Proyectos',
  'budgets-list': 'Presupuestos',
  'budgets-tasks': 'Tabla de Cómputo',
  'budgets-materials': 'Lista de Materiales',
  'sitelog-main': 'Bitácora',
  'movements-main': 'Finanzas',
  'transactions': 'Movimientos',
  'contacts': 'Contactos',
  'calendar': 'Agenda',
  'admin-organizations': 'Organizaciones',
  'admin-users': 'Usuarios',
  'admin-categories': 'Categorías de Tareas',
  'admin-material-categories': 'Categorías de Materiales',
  'admin-materials': 'Materiales',
  'admin-units': 'Unidades',
  'admin-elements': 'Elementos',
  'admin-actions': 'Acciones',
  'admin-tasks': 'Tareas',
  'profile-info': 'Mi Perfil',
  'profile-subscription': 'Suscripción',
  'profile-notifications': 'Notificaciones',
  'subscription-tables': 'Tablas de Suscripción',
};

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { currentSection, currentView } = useNavigationStore();

  // Determinar el título a mostrar
  const getTitle = () => {
    if (currentView && viewTitles[currentView]) {
      return viewTitles[currentView];
    }
    if (currentSection && sectionTitles[currentSection]) {
      return sectionTitles[currentSection];
    }
    return 'Archmony';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-[#919191]/20 z-30" style={{ backgroundColor: '#d2d2d2' }}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Botón hamburguesa */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 flex items-center justify-center hover:bg-[#919191]/10 transition-colors"
        >
          <Menu className="w-8 h-8 text-black" />
        </button>

        {/* Título */}
        <h1 className="text-lg font-semibold text-black truncate">
          {getTitle()}
        </h1>

        {/* Espacio para balancear */}
        <div className="w-10" />
      </div>
    </header>
  );
}