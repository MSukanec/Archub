import { Menu } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';

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
  'organization-overview': 'Organización',
  'organization-team': 'Equipo',
  'organization-settings': 'Configuración',
  'projects-list': 'Proyectos',
  'budgets-tasks': 'Cómputo y Presupuesto',
  'budgets-materials': 'Materiales',
  'sitelog-main': 'Bitácora',
  'transactions': 'Finanzas',
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
    return 'Archub';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-primary border-b border-input z-30">
      <div className="flex items-center justify-between h-full px-1">
        {/* Botón hamburguesa */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 flex items-center justify-center hover:bg-surface-secondary transition-colors"
        >
          <Menu className="w-8 h-8 text-foreground" />
        </button>

        {/* Título */}
        <h1 className="text-lg font-semibold text-foreground truncate">
          {getTitle()}
        </h1>

        {/* Espacio para balancear */}
        <div className="w-10" />
      </div>
    </header>
  );
}