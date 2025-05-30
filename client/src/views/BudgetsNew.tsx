import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calculator, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { supabase } from '@/lib/supabase';
import CreateBudgetModal from '@/components/modals/CreateBudgetModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

export default function Budgets() {
  const { projectId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [activeBudgetId, setActiveBudgetId] = useState<number | null>(null);
  const [isCreateBudgetModalOpen, setIsCreateBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('list');
  }, [setSection, setView]);

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateBudgetModal = () => {
      setIsCreateBudgetModalOpen(true);
    };

    window.addEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);
    
    return () => {
      window.removeEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);
    };
  }, []);

  // Fetch budgets for current project
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: number) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsDeleteModalOpen(false);
      setBudgetToDelete(null);
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error deleting budget:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudgetMutation.mutate(budgetToDelete.id);
    }
  };

  if (budgetsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Lista de Presupuestos</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona todos los presupuestos de tu proyecto
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateBudgetModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      <div className="grid gap-4">
        {budgets.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-muted-foreground">
                No hay presupuestos creados
              </CardTitle>
              <CardDescription className="text-center">
                Usa el botón flotante para crear tu primer presupuesto
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          budgets.map((budget: any) => (
            <Card key={budget.id} className="cursor-pointer hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1" onClick={() => setActiveBudgetId(budget.id)}>
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={budget.status === 'approved' ? 'default' : 'secondary'}>
                      {budget.status === 'draft' ? 'Borrador' : 
                       budget.status === 'approved' ? 'Aprobado' : 
                       budget.status === 'rejected' ? 'Rechazado' : budget.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingBudget(budget);
                          setIsCreateBudgetModalOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setBudgetToDelete(budget);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {budget.description && (
                  <CardDescription onClick={() => setActiveBudgetId(budget.id)}>
                    {budget.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent onClick={() => setActiveBudgetId(budget.id)}>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Creado: {new Date(budget.created_at).toLocaleDateString()}</span>
                  {activeBudgetId === budget.id && (
                    <Badge variant="outline">Seleccionado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <CreateBudgetModal
        budget={editingBudget}
        isOpen={isCreateBudgetModalOpen}
        onClose={() => {
          setIsCreateBudgetModalOpen(false);
          setEditingBudget(null);
        }}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setBudgetToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="¿Eliminar presupuesto?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente el presupuesto "${budgetToDelete?.name}" y todas sus tareas asociadas.`}
        isLoading={deleteBudgetMutation.isPending}
      />
    </div>
  );
}