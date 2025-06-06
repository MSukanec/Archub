import { useNavigationStore } from '../../stores/navigationStore';
import { cn } from '../../lib/utils';

// Define las vistas disponibles para cada sección
const sectionViews: Record<string, Array<{ id: string; label: string }>> = {
  dashboard: [
    { id: 'overview', label: 'Resumen' },
    { id: 'analytics', label: 'Analíticas' },
    { id: 'timeline', label: 'Timeline' }
  ],
  organization: [
    { id: 'organization-overview', label: 'Organización' },
    { id: 'organization-team', label: 'Equipo' },
    { id: 'organization-settings', label: 'Configuración' }
  ],
  projects: [
    { id: 'projects-list', label: 'Proyectos' }
  ],
  contacts: [
    { id: 'contacts', label: 'Contactos' }
  ],
  calendar: [
    { id: 'calendar', label: 'Agenda' }
  ],
  movements: [
    { id: 'movements-dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Movimientos' }
  ],
  budgets: [
    { id: 'budgets-tasks-multiple', label: 'Cómputo y Presupuesto' },
    { id: 'budgets-materials', label: 'Materiales' },
    { id: 'sitelog-main', label: 'Bitácora' }
  ],
  'admin-community': [
    { id: 'admin-organizations', label: 'Organizaciones' },
    { id: 'admin-users', label: 'Usuarios' }
  ],
  'admin-library': [
    { id: 'admin-tasks', label: 'Tareas' },
    { id: 'admin-categories', label: 'Tareas (Categorías)' },
    { id: 'admin-materials', label: 'Materiales' },
    { id: 'admin-material-categories', label: 'Materiales (Categorías)' },
    { id: 'admin-units', label: 'Unidades' },
    { id: 'admin-elements', label: 'Elementos' },
    { id: 'admin-actions', label: 'Acciones' }
  ],
  profile: [
    { id: 'profile-info', label: 'Información Personal' },
    { id: 'profile-security', label: 'Seguridad' },
    { id: 'profile-subscription', label: 'Suscripción' }
  ]
};

export default function FloatingHeader() {
  // Floating header disabled - returning null to hide it completely
  return null;
}