import { useNavigationStore } from '@/stores/navigationStore';
import { cn } from '@/lib/utils';

// Define las vistas disponibles para cada sección
const sectionViews: Record<string, Array<{ id: string; label: string }>> = {
  dashboard: [
    { id: 'overview', label: 'Resumen' },
    { id: 'analytics', label: 'Analíticas' },
    { id: 'timeline', label: 'Timeline' }
  ],
  organization: [
    { id: 'organization-overview', label: 'Organización' },
    { id: 'organization-team', label: 'Equipo' }
  ],
  projects: [
    { id: 'projects-list', label: 'Proyectos' }
  ],
  sitelog: [
    { id: 'sitelog-main', label: 'Bitácora' }
  ],
  contacts: [
    { id: 'calendar', label: 'Agenda' },
    { id: 'contacts', label: 'Contactos' }
  ],
  movements: [
    { id: 'transactions', label: 'Movimientos' }
  ],
  budgets: [
    { id: 'budgets-list', label: 'Lista de Presupuestos' },
    { id: 'budgets-tasks', label: 'Tabla de Cómputo' },
    { id: 'budgets-materials', label: 'Lista de Materiales' }
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
  ]
};

export default function FloatingHeader() {
  const { currentSection, currentView, setView } = useNavigationStore();

  // No mostrar en la vista DashboardTimeline
  if (currentView === 'dashboard-timeline') {
    return null;
  }

  // Si no hay sección activa o no tiene vistas, no mostrar nada
  if (!currentSection || !sectionViews[currentSection]) {
    return null;
  }

  const views = sectionViews[currentSection];

  return (
    <div className="fixed top-2.5 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-[#e1e1e1] border border-[#919191]/20 rounded-full px-2 py-1 shadow-lg">
        <div className="flex items-center space-x-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setView(view.id as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 h-9 whitespace-nowrap shadow-lg hover:shadow-xl hover:scale-95 active:scale-90",
                currentView === view.id
                  ? "bg-black text-white shadow-lg hover:shadow-xl"
                  : "text-[#919191] hover:text-[#919191]"
              )}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}