import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";

interface Movement {
  id: string;
  description: string;
  amount: string;
  created_at_local: string;
  movement_concepts?: {
    name: string;
    parent_concept?: {
      name: string;
    };
  };
  currencies?: {
    code: string;
    symbol: string;
  };
  wallets?: {
    name: string;
  };
}

interface DeleteMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: Movement | null;
  onConfirm: () => void;
}

export default function DeleteMovementModal({
  isOpen,
  onClose,
  movement,
  onConfirm,
}: DeleteMovementModalProps) {
  if (!movement) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Movimiento</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar este movimiento financiero?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-2">
          <div className="text-sm">
            <span className="font-medium">Tipo:</span> {movement.movement_concepts?.parent_concept?.name || 'No especificado'}
          </div>
          <div className="text-sm">
            <span className="font-medium">Categoría:</span> {movement.movement_concepts?.name || 'No especificado'}
          </div>
          <div className="text-sm">
            <span className="font-medium">Detalle:</span> {movement.description}
          </div>
          <div className="text-sm">
            <span className="font-medium">Monto:</span> {movement.currencies?.symbol || ''} {parseFloat(movement.amount || '0').toLocaleString()}
          </div>
          <div className="text-sm">
            <span className="font-medium">Fecha:</span> {movement.created_at_local ? new Date(movement.created_at_local).toLocaleDateString('es-ES') : 'No especificada'}
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-destructive/10 p-3 rounded-lg">
          ⚠️ Esta acción no se puede deshacer. El movimiento será eliminado permanentemente.
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Eliminar Movimiento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}