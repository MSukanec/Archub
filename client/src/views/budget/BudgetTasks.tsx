import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, Search, X, Edit, Trash2, MoreHorizontal, DollarSign, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { TaskModalSimple } from '@/components/modals/TaskModalSimple';

function BudgetTasksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <div className="border-b border-border bg-muted/50 p-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BudgetTasks() {
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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
      return data;
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

  // Get unique categories for filter
  const categories = Array.from(new Set(budgetTasks.map(task => task.category_name)))
    .filter(Boolean)
    .map(name => ({ id: name, name }));

  // Filter tasks based on search and category
  const filteredTasks = budgetTasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || task.category_name === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Group tasks by category
  const groupedTasks = filteredTasks.reduce((groups: any, task: any) => {
    const categoryName = task.category_name || 'Sin categoría';
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(task);
    return groups;
  }, {});

  // Calculate total
  const totalGeneral = filteredTasks.reduce((sum: number, task: any) => 
    sum + (task.unit_labor_price * task.quantity), 0
  );

  // Calculate percentages for each task
  const tasksWithPercentage = filteredTasks.map(task => ({
    ...task,
    subtotal: task.unit_labor_price * task.quantity,
    percentage: totalGeneral > 0 ? ((task.unit_labor_price * task.quantity) / totalGeneral) * 100 : 0
  }));

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

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('budget_tasks')
        .delete()
        .eq('id', taskId);
      
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
    return <BudgetTasksSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header - consistent with Lista de Presupuestos */}
      <div>
        <h3 className="text-lg font-medium text-foreground">Tabla de Cómputo</h3>
        <p className="text-sm text-muted-foreground">
          Administra las tareas y cantidades del sistema
        </p>
      </div>

      {/* Budget Selector */}
      <div className="flex items-center justify-between">
        <Select 
          value={budgetId || ""} 
          onValueChange={(value) => {
            setBudgetId(value);
            setSearchTerm('');
            setCategoryFilter('all');
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
      </div>

      {/* Filters - consistent with Movimientos style */}
      <div className="flex items-center gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-white/80 hover:bg-white border-input">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          className="bg-white/80 hover:bg-white border-input"
          onClick={() => {
            toast({
              title: "Funcionalidad en desarrollo",
              description: "La exportación a PDF estará disponible próximamente.",
            });
          }}
        >
          <FileDown className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-background"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="text-foreground font-semibold h-12 text-left pl-6">Rubro</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Tarea</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Unidad</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Cantidad</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Precio Unit.</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Subtotal</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">% Incidencia</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index} className="border-border h-12">
                  <TableCell className="pl-6 py-1">
                    <Skeleton className="h-6 w-32" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-32 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-16 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-8 w-20 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-16 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-20 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-8 w-16 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8 h-32">
                  {!budgetId 
                    ? 'Selecciona un presupuesto para ver sus tareas'
                    : searchTerm || categoryFilter !== 'all'
                    ? 'No se encontraron tareas que coincidan con los filtros.'
                    : 'No hay tareas en este presupuesto.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              <>
                {Object.entries(groupedTasks).map(([categoryName, categoryTasks]: [string, any]) => [
                  // Category Header
                  <TableRow key={`category-${categoryName}`} className="bg-muted/30 border-border">
                    <TableCell colSpan={8} className="pl-6 py-3 font-semibold text-sm">
                      {categoryName}
                    </TableCell>
                  </TableRow>,
                  // Category Tasks
                  ...categoryTasks.map((task: any) => {
                    const subtotal = task.unit_labor_price * task.quantity;
                    const percentage = totalGeneral > 0 ? (subtotal / totalGeneral) * 100 : 0;
                    return (
                      <TableRow key={task.id} className="border-border hover:bg-muted/20 transition-colors h-12">
                        <TableCell className="pl-12 py-1">
                          <div className="text-sm text-muted-foreground">—</div>
                        </TableCell>
                        <TableCell className="py-1 text-center">
                          <div className="font-medium text-foreground text-sm">{task.task_name}</div>
                        </TableCell>
                        <TableCell className="text-center py-1">
                          <Badge variant="outline" className="bg-muted/50 text-xs">
                            {task.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={task.quantity}
                            onChange={(e) => {
                              const newQuantity = parseFloat(e.target.value) || 0;
                              updateQuantityMutation.mutate({ 
                                id: task.id, 
                                quantity: newQuantity 
                              });
                            }}
                            className="w-20 text-center text-sm h-8"
                            disabled={updateQuantityMutation.isPending}
                          />
                        </TableCell>
                        <TableCell className="text-center py-1">
                          <div className="text-sm">${task.unit_labor_price ? task.unit_labor_price.toFixed(2) : '0.00'}</div>
                        </TableCell>
                        <TableCell className="text-center py-1">
                          <div className="font-semibold text-sm">${subtotal.toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="text-center py-1">
                          <div className="text-sm">{percentage.toFixed(1)}%</div>
                        </TableCell>
                        <TableCell className="text-center py-1">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTask(task)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              disabled={deleteTaskMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ]).flat()}
                {/* Total Row */}
                {filteredTasks.length > 0 && (
                  <TableRow className="bg-primary/10 border-border font-semibold">
                    <TableCell colSpan={5} className="pl-6 py-3 text-right font-bold">
                      TOTAL
                    </TableCell>
                    <TableCell className="text-center py-3 font-bold">
                      ${totalGeneral.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center py-3 font-bold">
                      100.0%
                    </TableCell>
                    <TableCell className="text-center py-3">
                      —
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      {isTaskModalOpen && (
        <TaskModalSimple
          isOpen={isTaskModalOpen}
          onOpenChange={setIsTaskModalOpen}
        />
      )}
    </div>
  );
}