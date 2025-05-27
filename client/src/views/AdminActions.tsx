import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { actionsService } from '@/lib/actionsService';
import AdminActionsModal from '@/components/modals/AdminActionsModal';

export default function AdminActions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch actions
  const { data: actions = [], isLoading, error } = useQuery({
    queryKey: ['actions'],
    queryFn: () => actionsService.getAll(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });

  // Handle errors
  if (error) {
    console.error('Error loading actions:', error);
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await actionsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      toast({
        title: 'Acción eliminada',
        description: 'La acción se ha eliminado exitosamente.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedAction(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la acción. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  // Handle edit
  const handleEdit = (action: any) => {
    setSelectedAction(action);
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = (action: any) => {
    setSelectedAction(action);
    setIsDeleteDialogOpen(true);
  };

  // Filter actions based on search (newest first by ID)
  const filteredActions = actions
    .filter((action: any) =>
      action.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: any, b: any) => b.id - a.id);

  if (isLoading) {
    return <AdminActionsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-destructive">Error al cargar las acciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrar Acciones</h1>
          <p className="text-muted-foreground">
            Gestiona las acciones disponibles en el sistema
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Acción
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar acciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  {searchTerm ? 'No se encontraron acciones que coincidan con tu búsqueda.' : 'No hay acciones creadas aún.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredActions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(action)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(action)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <AdminActionsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <AdminActionsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAction(null);
        }}
        action={selectedAction}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la acción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAction(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAction && deleteMutation.mutate(selectedAction.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminActionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      <div className="space-y-4">
        <div className="h-10 w-80 bg-muted rounded animate-pulse" />
        <div className="border rounded-md p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="h-6 w-64 bg-muted rounded animate-pulse" />
                <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}