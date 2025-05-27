import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigationStore, View } from '@/stores/navigationStore';
import { cn } from '@/lib/utils';

// Configuración de acciones por vista
const viewActions: Record<View, { label: string; action: () => void } | null> = {
  'dashboard-main': { label: 'Crear Dashboard', action: () => console.log('Crear dashboard') },
  'organization-overview': { label: 'Crear Organización', action: () => console.log('Crear organización') },
  'organization-activity': { label: 'Crear Actividad', action: () => console.log('Crear actividad') },
  'projects-overview': { label: 'Crear Proyecto', action: () => console.log('Crear proyecto') },
  'projects-list': { label: 'Crear Proyecto', action: () => console.log('Crear proyecto') },
  'budgets-list': { label: 'Crear Presupuesto', action: () => console.log('Crear presupuesto') },
  'budgets-tasks': { label: 'Crear Tarea', action: () => console.log('Crear tarea') },
  'budgets-materials': { label: 'Crear Material', action: () => console.log('Crear material') },
  'sitelog-main': { label: 'Crear Entrada', action: () => console.log('Crear entrada bitácora') },
  'movements-main': { label: 'Crear Movimiento', action: () => console.log('Crear movimiento') },
  'contacts': { label: 'Crear Contacto', action: () => console.log('Crear contacto') },
  'admin-organizations': { label: 'Crear Organización', action: () => console.log('Crear organización') },
  'admin-users': { label: 'Crear Usuario', action: () => console.log('Crear usuario') },
  'admin-categories': { label: 'Crear Categoría', action: () => console.log('Crear categoría') },
  'admin-materials': { label: 'Crear Material', action: () => console.log('Crear material') },
  'admin-units': { label: 'Crear Unidad', action: () => console.log('Crear unidad') },
  'admin-elements': { label: 'Crear Elemento', action: () => console.log('Crear elemento') },
  'admin-actions': { label: 'Crear Acción', action: () => console.log('Crear acción') },
  'admin-tasks': { label: 'Crear Tarea', action: () => console.log('Crear tarea') },
  'admin-permissions': { label: 'Crear Permiso', action: () => console.log('Crear permiso') },
  'profile-info': null, // No mostrar botón en perfil
  'profile-subscription': null,
  'profile-notifications': null,
  'subscription-tables': null,
};

export default function FloatingActionButton() {
  const { currentView } = useNavigationStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const actionConfig = viewActions[currentView];
  
  // No mostrar el botón si no hay acción configurada para esta vista
  if (!actionConfig) return null;
  
  const handleClick = () => {
    actionConfig.action();
  };
  
  return (
    <div 
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleClick}
        className={cn(
          "h-14 bg-primary hover:bg-primary/90 text-primary-foreground",
          "rounded-full shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-300 ease-in-out",
          "border border-primary/20",
          "relative overflow-hidden",
          isHovered ? "px-4" : "w-14"
        )}
        style={{
          width: isHovered ? `${56 + (actionConfig.label.length * 8) + 32}px` : '56px'
        }}
      >
        <Plus size={20} className="flex-shrink-0 z-10" />
        <div 
          className={cn(
            "absolute left-12 top-1/2 -translate-y-1/2",
            "font-medium text-sm whitespace-nowrap transition-all duration-300 ease-in-out",
            isHovered 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 translate-x-4"
          )}
        >
          {actionConfig.label}
        </div>
      </button>
    </div>
  );
}