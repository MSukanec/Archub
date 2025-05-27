import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigationStore, View } from '@/stores/navigationStore';
import { cn } from '@/lib/utils';

// Hook personalizado para manejar modales
const useModalActions = () => {
  // Aquí podríamos usar un contexto global para manejar modales
  // Por ahora, usamos eventos personalizados para comunicarnos con los componentes
  const openCreateProjectModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateProjectModal'));
  };
  
  const openCreateMovementModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateMovementModal'));
  };
  
  const openCreateContactModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateContactModal'));
  };

  const openCreateBudgetModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateBudgetModal'));
  };

  const openCreateSiteLogModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateSiteLogModal'));
  };

  const openCreateOrganizationModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateOrganizationModal'));
  };

  const openCreateUserModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateUserModal'));
  };

  const openCreateCategoryModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateCategoryModal'));
  };

  const openCreateMaterialModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateMaterialModal'));
  };

  const openCreateTaskModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateTaskModal'));
  };

  return {
    openCreateProjectModal,
    openCreateMovementModal,
    openCreateContactModal,
    openCreateBudgetModal,
    openCreateSiteLogModal,
    openCreateOrganizationModal,
    openCreateUserModal,
    openCreateCategoryModal,
    openCreateMaterialModal,
    openCreateTaskModal,
  };
};

export default function FloatingActionButton() {
  const { currentView } = useNavigationStore();
  const [isHovered, setIsHovered] = useState(false);
  const modalActions = useModalActions();

  // Configuración de acciones por vista
  const viewActions: Record<View, { label: string; action: () => void; isMultiple?: boolean; options?: any[] } | null> = {
    'dashboard-main': { 
      label: 'Crear', 
      action: () => {}, 
      isMultiple: true,
      options: [
        { label: 'Nueva Bitácora', action: modalActions.openCreateSiteLogModal },
        { label: 'Nuevo Movimiento', action: modalActions.openCreateMovementModal },
        { label: 'Crear Presupuesto', action: modalActions.openCreateBudgetModal },
        { label: 'Nueva Tarea', action: modalActions.openCreateTaskModal },
        { label: 'Nuevo Contacto', action: modalActions.openCreateContactModal }
      ]
    },
    'organization-overview': { label: 'Crear Organización', action: modalActions.openCreateOrganizationModal },
    'organization-activity': null,
    'projects-overview': { label: 'Crear Proyecto', action: modalActions.openCreateProjectModal },
    'projects-list': { label: 'Crear Proyecto', action: modalActions.openCreateProjectModal },
    'budgets-list': { label: 'Crear Presupuesto', action: modalActions.openCreateBudgetModal },
    'budgets-tasks': { label: 'Crear Tarea', action: modalActions.openCreateTaskModal },
    'budgets-materials': { label: 'Crear Material', action: modalActions.openCreateMaterialModal },
    'sitelog-main': { label: 'Crear Entrada', action: modalActions.openCreateSiteLogModal },
    'movements-main': { label: 'Crear Movimiento', action: modalActions.openCreateMovementModal },
    'contacts': { label: 'Crear Contacto', action: modalActions.openCreateContactModal },
    'admin-organizations': { label: 'Crear Organización', action: modalActions.openCreateOrganizationModal },
    'admin-users': { label: 'Crear Usuario', action: modalActions.openCreateUserModal },
    'admin-categories': { label: 'Crear Categoría', action: modalActions.openCreateCategoryModal },
    'admin-materials': { label: 'Crear Material', action: modalActions.openCreateMaterialModal },
    'admin-units': null,
    'admin-elements': null,
    'admin-actions': null,
    'admin-tasks': { label: 'Crear Tarea', action: modalActions.openCreateTaskModal },
    'admin-permissions': null,
    'profile-info': null,
    'profile-subscription': null,
    'profile-notifications': null,
    'subscription-tables': null,
  };
  
  const actionConfig = viewActions[currentView];
  
  // No mostrar el botón si no hay acción configurada para esta vista
  if (!actionConfig) return null;
  
  const handleClick = () => {
    if (!actionConfig.isMultiple) {
      actionConfig.action();
    }
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
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-lg hover:shadow-xl rounded-xl",
          "flex items-center justify-center",
          "transition-all duration-300 ease-in-out",
          "border border-primary/20",
          "relative overflow-hidden",
          actionConfig.isMultiple && isHovered 
            ? "h-auto py-3 px-4 min-w-48 flex-col" 
            : actionConfig.isMultiple 
              ? "h-14 w-14" 
              : isHovered 
                ? "h-14 justify-start pl-4 pr-6" 
                : "h-14 w-14"
        )}
        style={{
          width: actionConfig.isMultiple 
            ? (isHovered ? '192px' : '56px')
            : (isHovered ? `${56 + (actionConfig.label.length * 8) + 32}px` : '56px')
        }}
      >
        {actionConfig.isMultiple ? (
          isHovered ? (
            // Mostrar opciones verticalmente dentro del botón
            <div className="space-y-2">
              {actionConfig.options?.map((option, index) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    option.action();
                  }}
                  className="flex items-center text-sm hover:bg-primary-foreground/10 rounded px-2 py-1 cursor-pointer transition-colors"
                >
                  <Plus size={14} className="mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">{option.label}</span>
                </div>
              ))}
            </div>
          ) : (
            // Mostrar solo el ícono +
            <Plus size={20} className="flex-shrink-0" />
          )
        ) : (
          // Botón simple para otras vistas
          <>
            <Plus size={20} className="flex-shrink-0" />
            <span 
              className={cn(
                "font-medium text-sm whitespace-nowrap transition-all duration-300 ease-in-out ml-2",
                isHovered 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 translate-x-4"
              )}
            >
              {isHovered ? actionConfig.label : ''}
            </span>
          </>
        )}
      </button>
    </div>
  );
}