import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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


export default function BudgetTasks() {
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();

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
      // Task modal functionality removed
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
      
      try {
        // Primero obtenemos las budget_tasks
        const { data: budgetTasksData, error: budgetTasksError } = await supabase
          .from('budget_tasks')
          .select('*')
          .eq('budget_id', budgetId);
        
        if (budgetTasksError) throw budgetTasksError;
        if (!budgetTasksData || budgetTasksData.length === 0) return [];

        // Luego obtenemos los detalles de las tareas con sus unidades
        const taskIds = budgetTasksData.map(bt => bt.task_id);
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id, 
            name, 
            unit_id, 
            unit_labor_price, 
            unit_material_price, 
            category_id,
            units!inner(name)
          `)
          .in('id', taskIds);
        
        if (tasksError) throw tasksError;

        // Obtenemos las categorías por separado si hay tareas
        let categoriesData: any[] = [];
        if (tasksData && tasksData.length > 0) {
          const categoryIds = Array.from(new Set(tasksData.map(t => t.category_id).filter(Boolean)));
          if (categoryIds.length > 0) {
            const { data: catData } = await supabase
              .from('task_categories')
              .select('id, name')
              .in('id', categoryIds);
            categoriesData = catData || [];
          }
        }

        // Combinamos los datos
        const combinedData = budgetTasksData.map(budgetTask => {
          const task = tasksData?.find(t => t.id === budgetTask.task_id);
          const category = categoriesData.find(c => c.id === task?.category_id);
          return {
            ...budgetTask,
            task_name: task?.name || 'Tarea no encontrada',
            unit_labor_price: task?.unit_labor_price || 0,
            unit_material_price: task?.unit_material_price || 0,
            unit: task?.units?.name || '',
            category_name: category?.name || 'Sin categoría'
          };
        });

        return combinedData;
      } catch (error) {
        console.error('Error fetching budget tasks:', error);
        return [];
      }
    },
    enabled: !!budgetId,
  });

  // Agrupar tareas por categoría
  const groupedTasks = budgetTasks.reduce((groups: any, task: any) => {
    const categoryName = task.category_name || 'Sin categoría';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(task);
    return groups;
  }, {});

  // Calcular total general
  const totalGeneral = budgetTasks.reduce((sum: number, task: any) => 
    sum + (task.unit_labor_price * task.quantity), 0
  );

  // Mutation to update task quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('budget_tasks')
        .update({ quantity })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-tasks', budgetId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la cantidad',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete budget task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-tasks', budgetId] });
      toast({
        title: 'Éxito',
        description: 'Tarea eliminada del presupuesto',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tarea',
        variant: 'destructive',
      });
    },
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
            onClick={() => {}}
            disabled={!budgetId}
          >
            <Plus className="h-4 w-4" />
            Agregar Tarea
          </Button>
        </div>
      </div>

      <Card className="bg-[#e1e1e1]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tabla de Cómputo</span>
            <Badge variant="secondary">
              Total: ${budgetTasks.reduce((sum: number, task: any) => sum + (task.unit_labor_price * task.quantity), 0).toFixed(2)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Agrega tareas y cantidades para calcular el presupuesto total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {tasksLoading ? (
            <div className="p-6 space-y-3">
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
            <div className="overflow-hidden border border-gray-300 rounded-lg">
              {/* Table Header */}
              <div className="bg-gray-100 border-b border-gray-300 p-4">
                <div className="grid grid-cols-9 gap-4 font-medium text-sm text-gray-700">
                  <div className="col-span-1 text-center">Rubro</div>
                  <div className="col-span-2 text-center">Descripción</div>
                  <div className="col-span-1 text-center">Unidad</div>
                  <div className="col-span-1 text-center">Cantidad</div>
                  <div className="col-span-1 text-center">Costo M.O.</div>
                  <div className="col-span-1 text-center">Subtotal</div>
                  <div className="col-span-1 text-center">% Inc.</div>
                  <div className="col-span-1 text-center">Acciones</div>
                </div>
              </div>
              
              {/* Table Body */}
              <div className="max-h-[500px] overflow-y-auto bg-white">
                {Object.keys(groupedTasks).map((categoryName) => {
                  const categoryTasks = groupedTasks[categoryName];
                  const categoryTotal = categoryTasks.reduce((sum: number, task: any) => 
                    sum + (task.unit_labor_price * task.quantity), 0
                  );
                  
                  return (
                    <div key={categoryName}>
                      {/* Category Header */}
                      <div className="bg-[#787878] border-b border-gray-400 p-3 font-bold text-sm text-white">
                        <div className="grid grid-cols-9 gap-4 items-center">
                          <div className="col-span-1 text-center">{categoryName.toUpperCase()}</div>
                          <div className="col-span-5"></div>
                          <div className="col-span-1 text-center">${categoryTotal.toFixed(2)}</div>
                          <div className="col-span-1 text-center">
                            {totalGeneral > 0 ? ((categoryTotal / totalGeneral) * 100).toFixed(1) : '0.0'}%
                          </div>
                          <div className="col-span-1"></div>
                        </div>
                      </div>
                      
                      {/* Tasks in Category */}
                      {categoryTasks.map((budgetTask: any, index: number) => {
                        const unitPrice = budgetTask.unit_labor_price || 0;
                        const quantity = budgetTask.quantity || 0;
                        const subtotal = unitPrice * quantity;
                        const incidencePercentage = totalGeneral > 0 ? (subtotal / totalGeneral) * 100 : 0;
                        
                        return (
                          <div 
                            key={budgetTask.id} 
                            className={`grid grid-cols-9 gap-4 p-3 border-b border-gray-200 hover:bg-gray-50 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <div className="col-span-1 text-sm font-medium text-gray-500 text-center">
                              {/* Empty for rubro since it's in header */}
                            </div>
                            <div className="col-span-2 text-sm text-center">
                              {budgetTask.task_name}
                            </div>
                            <div className="col-span-1 text-sm text-center">
                              {budgetTask.unit}
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={budgetTask.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseFloat(e.target.value) || 0;
                                  updateQuantityMutation.mutate({ 
                                    id: budgetTask.id, 
                                    quantity: newQuantity 
                                  });
                                }}
                                className="h-8 text-sm bg-white border-gray-300 text-center w-full max-w-[80px]"
                              />
                            </div>
                            <div className="col-span-1 text-sm font-medium text-center">
                              ${budgetTask.unit_labor_price?.toFixed(2) || '0.00'}
                            </div>
                            <div className="col-span-1 text-sm font-bold text-center">
                              ${subtotal.toFixed(2)}
                            </div>
                            <div className="col-span-1 text-sm text-center">
                              {incidencePercentage.toFixed(1)}%
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTaskMutation.mutate(budgetTask.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              
              {/* Total Row */}
              <div className="bg-black border-t-2 border-gray-600 p-4 font-bold">
                <div className="grid grid-cols-9 gap-4">
                  <div className="col-span-5"></div>
                  <div className="col-span-1 text-lg text-white text-center">
                    TOTAL GENERAL:
                  </div>
                  <div className="col-span-1 text-lg text-white text-center">
                    ${totalGeneral.toFixed(2)}
                  </div>
                  <div className="col-span-1 text-lg text-white text-center">
                    100%
                  </div>
                  <div className="col-span-1"></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}