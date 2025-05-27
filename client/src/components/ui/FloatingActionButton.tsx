import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { cn } from '@/lib/utils';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import MovementModal from '@/components/modals/MovementModal';

const getActionConfig = (currentSection: string) => {
  switch (currentSection) {
    case 'projects':
      return {
        label: 'Nuevo Proyecto',
        action: 'create-project'
      };
    case 'budgets':
      return {
        label: 'Nuevo Presupuesto',
        action: 'create-budget'
      };
    case 'sitelog':
      return {
        label: 'Nueva Entrada',
        action: 'create-sitelog'
      };
    case 'movements':
      return {
        label: 'Nuevo Movimiento',
        action: 'create-movement'
      };
    case 'contacts':
      return {
        label: 'Nuevo Contacto',
        action: 'create-contact'
      };
    default:
      return null;
  }
};

export default function FloatingActionButton() {
  const { currentSection } = useNavigationStore();
  const { projectId } = useUserContextStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const config = getActionConfig(currentSection);

  if (!config) return null;

  const handleClick = () => {
    switch (config.action) {
      case 'create-project':
        setIsProjectModalOpen(true);
        break;
      case 'create-movement':
        setIsMovementModalOpen(true);
        break;
      case 'create-budget':
        // TODO: Implementar modal de presupuesto
        console.log('Crear presupuesto');
        break;
      case 'create-sitelog':
        // TODO: Implementar modal de entrada de bitácora
        console.log('Crear entrada de bitácora');
        break;
      case 'create-contact':
        // TODO: Implementar modal de contacto
        console.log('Crear contacto');
        break;
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-black rounded-full shadow-lg transition-all duration-300 z-50 flex items-center",
          isHovered ? "px-4 py-3" : "w-14 h-14"
        )}
      >
        <Plus size={24} className="flex-shrink-0" />
        <span
          className={cn(
            "ml-2 font-medium whitespace-nowrap transition-all duration-300",
            isHovered ? "opacity-100 max-w-xs" : "opacity-0 max-w-0 overflow-hidden"
          )}
        >
          {config.label}
        </span>
      </button>

      <CreateProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />

      <MovementModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        projectId={projectId}
      />
    </>
  );
}