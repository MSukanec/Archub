import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigationStore, View } from '@/stores/navigationStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/lib/projectsService';
import { LimitLock } from '@/components/features';
import { useFeatures } from '@/hooks/useFeatures';
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
    console.log('Dispatching openCreateSiteLogModal event');
    window.dispatchEvent(new CustomEvent('openCreateSiteLogModal'));
  };

  const openInviteTeamMemberModal = () => {
    window.dispatchEvent(new CustomEvent('openInviteTeamMemberModal'));
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

  const openCreateUnitModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateUnitModal'));
  };

  const openCreateElementModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateElementModal'));
  };

  const openCreateActionModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateActionModal'));
  };

  const openCreateEventModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateEventModal'));
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
    openCreateUnitModal,
    openCreateElementModal,
    openCreateActionModal,
    openCreateEventModal,
    openInviteTeamMemberModal,
  };
};

export default function FloatingActionButton() {
  const { currentView } = useNavigationStore();
  const [isHovered, setIsHovered] = useState(false);
  const modalActions = useModalActions();
  const { organizationId } = useUserContextStore();
  const { checkLimit: checkProjectLimit } = useFeatures();

  // Obtener conteo de proyectos para verificar límites
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects', organizationId],
    queryFn: () => projectsService.getAll(),
    enabled: !!organizationId,
  });

  // Configuración de acciones por vista
  const viewActions: Record<View, { label: string; action: () => void; isMultiple?: boolean; options?: any[] } | null> = {
    'dashboard-main': { label: 'Crear Proyecto', action: modalActions.openCreateProjectModal },
    'dashboard-timeline': null,
    'organization-overview': { label: 'Crear Organización', action: modalActions.openCreateOrganizationModal },
    'organization-team': { label: 'Agregar Compañero', action: modalActions.openInviteTeamMemberModal },
    'organization-activity': null,
    'projects-overview': { label: 'Crear Proyecto', action: modalActions.openCreateProjectModal },
    'projects-list': { label: 'Crear Proyecto', action: modalActions.openCreateProjectModal },
    'budgets-list': { label: 'Crear Presupuesto', action: modalActions.openCreateBudgetModal },
    'budgets-tasks': { label: 'Crear Tarea', action: modalActions.openCreateTaskModal },
    'budgets-materials': { label: 'Crear Material', action: modalActions.openCreateMaterialModal },
    'sitelog-main': { label: 'Crear Entrada', action: modalActions.openCreateSiteLogModal },
    'movements-main': { label: 'Crear Movimiento', action: modalActions.openCreateMovementModal },
    'transactions': { label: 'Crear Movimiento', action: modalActions.openCreateMovementModal },
    'contacts': { label: 'Crear Contacto', action: modalActions.openCreateContactModal },
    'calendar': { label: 'Crear Evento', action: modalActions.openCreateEventModal },
    'admin-organizations': { label: 'Crear Organización', action: modalActions.openCreateOrganizationModal },
    'admin-users': { label: 'Crear Usuario', action: modalActions.openCreateUserModal },
    'admin-categories': { label: 'Crear Categoría', action: modalActions.openCreateCategoryModal },
    'admin-materials': { label: 'Crear Material', action: modalActions.openCreateMaterialModal },
    'admin-units': { label: 'Crear Unidad', action: modalActions.openCreateUnitModal },
    'admin-elements': { label: 'Crear Elemento', action: () => console.log('Crear Elemento') },
    'admin-actions': { label: 'Crear Acción', action: () => console.log('Crear Acción') },
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

  // Verificar si la acción actual es crear proyecto y aplicar restricción
  const isProjectCreation = actionConfig.label.includes('Proyecto') || 
    (actionConfig.isMultiple && actionConfig.options?.some(opt => opt.label.includes('Proyecto')));

  // Verificar si está bloqueado
  const isBlocked = isProjectCreation && checkProjectLimit('max_projects', projects.length).isLimited;

  return (
    <div 
      className="fixed bottom-[37px] right-[37px] z-50"
      onMouseEnter={() => !isBlocked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={!isBlocked ? handleClick : undefined}
        className={cn(
          "w-16 h-16 rounded-full bg-[#e1e1e1] shadow-lg flex items-center justify-center",
          "transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(82_100%_39%)] focus-visible:ring-offset-2",
          isBlocked 
            ? "opacity-75 cursor-not-allowed" 
            : "hover:shadow-xl cursor-pointer",
          isHovered && !isBlocked && "pressed",
          actionConfig.isMultiple && isHovered && !isBlocked && "bg-[#8fc700]"
        )}
      >
        <Plus className="w-6 h-6 text-[#919191]" strokeWidth={1.5} />
      </button>
      
      {/* Tooltip cuando hover */}
      {isHovered && !isBlocked && (
        <div className="absolute bottom-full right-0 mb-2 bg-[#e1e1e1] text-[#919191] px-2 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg border border-[#919191]/20 z-[200]">
          {actionConfig.label}
        </div>
      )}
      
      {/* Badge de restricción para creación de proyectos */}
      {isProjectCreation && isBlocked && (
        <LimitLock
          limitName="max_projects"
          currentCount={projects.length}
          featureName="proyecto"
          description="Has alcanzado el límite de proyectos para tu plan actual. Actualiza a PRO para crear proyectos ilimitados."
        />
      )}
    </div>
  );
}