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
    { id: 'info', label: 'Información' },
    { id: 'members', label: 'Miembros' },
    { id: 'settings', label: 'Configuración' }
  ],
  projects: [
    { id: 'list', label: 'Lista' },
    { id: 'gantt', label: 'Gantt' },
    { id: 'reports', label: 'Reportes' }
  ],
  sitelog: [
    { id: 'logs', label: 'Bitácoras' },
    { id: 'reports', label: 'Reportes' },
    { id: 'calendar', label: 'Calendario' }
  ],
  contacts: [
    { id: 'list', label: 'Lista' },
    { id: 'tasks', label: 'Tareas' },
    { id: 'schedule', label: 'Agenda' }
  ],
  movements: [
    { id: 'transactions', label: 'Movimientos' },
    { id: 'budgets', label: 'Presupuestos' },
    { id: 'reports', label: 'Reportes' }
  ],
  budgets: [
    { id: 'active', label: 'Activos' },
    { id: 'templates', label: 'Plantillas' },
    { id: 'analysis', label: 'Análisis' }
  ]
};

export default function FloatingHeader() {
  const { currentSection, currentView, setView } = useNavigationStore();

  // Si no hay sección activa o no tiene vistas, no mostrar nada
  if (!currentSection || !sectionViews[currentSection]) {
    return null;
  }

  const views = sectionViews[currentSection];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-[#e1e1e1] border border-[#919191]/20 rounded-full px-2 py-1 shadow-lg">
        <div className="flex items-center space-x-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setView(view.id as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                currentView === view.id
                  ? "bg-[#8fc700] text-white shadow-md"
                  : "text-[#919191] hover:text-[#8fc700] hover:bg-[#8fc700]/10"
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