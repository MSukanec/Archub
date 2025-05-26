import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { actionsService, Action } from '@/lib/actionsService';
import AdminActionsModal from '@/components/modals/AdminActionsModal';

export default function AdminActions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['/api/actions'],
    queryFn: () => actionsService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => actionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actions'] });
      toast({
        title: 'Éxito',
        description: 'Acción eliminada correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar la acción',
        variant: 'destructive',
      });
    },
  });

  const filteredActions = actions.filter(action =>
    action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (action: Action) => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta acción?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
  };

  if (isLoading) {
    return <AdminActionsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrar Acciones</h1>
          <p className="text-muted-foreground">
            Gestiona las acciones disponibles en el sistema
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Acción
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Acciones ({filteredActions.length})</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar acciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No se encontraron acciones que coincidan con tu búsqueda.' : 'No hay acciones creadas aún.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">{action.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {action.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(action.createdAt).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
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
                          onClick={() => handleDelete(action.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminActionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        action={editingAction}
      />
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-80 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}