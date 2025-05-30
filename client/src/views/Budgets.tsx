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
    setView('budgets');
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

  // Get projects to find current project name
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => projectsService.getAll(),
  });

  const currentProject = projects.find((p: any) => p.id === projectId);

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets', projectId] });
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error al eliminar presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Función para confirmar eliminación
  const confirmDelete = () => {
    if (budgetToDelete) {
      deleteBudgetMutation.mutate(budgetToDelete.id);
      setIsDeleteModalOpen(false);
      setBudgetToDelete(null);
    }
  };

  // Fetch budgets for the current project
  const { data: budgets = [] } = useQuery({
    queryKey: ['/api/budgets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Sin proyecto activo</h3>
          <p className="text-muted-foreground">
            Selecciona un proyecto para gestionar sus presupuestos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Presupuestos
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestión de presupuestos para el proyecto: <span className="font-medium">{currentProject?.name}</span>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Lista de Presupuestos
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lista de Tareas
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lista de Materiales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">

          <div className="grid gap-4">
            {budgets.length === 0 ? (
              /* Empty state */
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
              /* Budget list */
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
                              size="sm"
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
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-foreground">Cómputo y Presupuesto</h3>
              <p className="text-sm text-muted-foreground">
                Tabla de cómputo donde puedes agregar tareas con cantidades y ver subtotales
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={activeBudgetId?.toString() || ""} 
                onValueChange={(value) => {
                  console.log('Budget selected:', value);
                  const budgetId = Number(value);
                  console.log('Setting activeBudgetId to:', budgetId);
                  setActiveBudgetId(budgetId);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccionar presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {budgets?.map((budget: any) => (
                    <SelectItem key={budget.id} value={budget.id.toString()}>
                      {budget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsTaskModalOpen(true)}
                disabled={!activeBudgetId}
              >
                <Plus className="h-4 w-4" />
                Agregar Tarea
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tabla de Cómputo</span>
                <Badge variant="secondary">Total: $0.00</Badge>
              </CardTitle>
              <CardDescription>
                Agrega tareas y cantidades para calcular el presupuesto total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">Sin tareas agregadas</h4>
                <p className="text-muted-foreground mb-4">
                  Selecciona un presupuesto y comienza agregando tareas para calcular los costos
                </p>
                <Button variant="outline" className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Agregar primera tarea
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-foreground">Lista de Materiales</h3>
              <p className="text-sm text-muted-foreground">
                Listado de materiales involucrados en el presupuesto seleccionado
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-muted-foreground">
                Función próximamente disponible
              </CardTitle>
              <CardDescription className="text-center">
                Esta funcionalidad estará disponible en futuras actualizaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aquí podrás ver el desglose de materiales necesarios para el proyecto
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateBudgetModal
        budget={editingBudget}
        isOpen={isCreateBudgetModalOpen}
        onClose={() => {
          setIsCreateBudgetModalOpen(false);
          setEditingBudget(null);
        }}
      />
      
      <TaskModal
        budgetId={activeBudgetId}
        task={editingTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
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