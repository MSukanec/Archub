import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { projectsService } from '@/lib/projectsService';
import { supabase } from '@/lib/supabase';
import TaskModal from '@/components/modals/TaskModal';

export default function BudgetTasks() {
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('budgets-tasks');
  }, [setSection, setView]);

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateTaskModal = () => {
      setIsTaskModalOpen(true);
    };

    window.addEventListener('openCreateTaskModal', handleOpenCreateTaskModal);
    
    return () => {
      window.removeEventListener('openCreateTaskModal', handleOpenCreateTaskModal);
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

  // Fetch budget tasks for current budget
  const { data: budgetTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['budget-tasks', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      
      const { data, error } = await supabase
        .from('budget_tasks')
        .select(`
          *,
          task:tasks (
            id,
            name,
            unit,
            unit_labor_price,
            unit_material_price
          )
        `)
        .eq('budget_id', Number(budgetId))
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!budgetId,
  });



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
          <h3 className="text-lg font-medium text-foreground">Cómputo y Presupuesto</h3>
          <p className="text-sm text-muted-foreground">
            Tabla de cómputo donde puedes agregar tareas con cantidades y ver subtotales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={budgetId || ""} 
            onValueChange={(value) => {
              setBudgetId(value);
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
            disabled={!budgetId}
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
            <Badge variant="secondary">
              Total: ${budgetTasks.reduce((sum: number, task: any) => sum + (task.unit_price * task.quantity), 0).toFixed(2)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Agrega tareas y cantidades para calcular el presupuesto total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : budgetTasks.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No hay tareas en este presupuesto
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {!budgetId 
                  ? "Selecciona un presupuesto para ver sus tareas"
                  : "Comienza agregando la primera tarea"
                }
              </p>
              {budgetId && (
                <Button onClick={() => setIsTaskModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Tarea
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {budgetTasks.map((budgetTask: any) => (
                <div key={budgetTask.id} className="bg-[#e1e1e1] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {budgetTask.task?.name || 'Tarea eliminada'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {budgetTask.quantity} {budgetTask.task?.unit || 'unidad'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          ${(budgetTask.unit_price * budgetTask.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${budgetTask.unit_price.toFixed(2)} c/u
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingTask(budgetTask);
                            setIsTaskModalOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {budgetTask.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {budgetTask.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        budgetId={budgetId ? Number(budgetId) : null}
        task={editingTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}