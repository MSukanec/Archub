import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Calculator, Search, Filter, Plus, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import CreateBudgetModal from '@/components/modals/CreateBudgetModal';

// Types
interface Budget {
  id: string;
  name: string;
  description?: string;
  status: string;
  total_price?: number;
  created_at: string;
}

interface TaskData {
  id: string;
  name: string;
  description: string;
  category_name: string;
  category_code: string;
  unit_name: string;
  amount: number;
  unit_price: number;
  total_price: number;
}

interface BudgetAccordionProps {
  budget: Budget;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSetActive: () => void;
  onAddTask: () => void;
}

function BudgetAccordion({ budget, isActive, isExpanded, onToggle, onSetActive, onAddTask }: BudgetAccordionProps) {
  const { projectId } = useUserContextStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Query para obtener las tareas del presupuesto
  const { data: budgetTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['budget-tasks', budget.id],
    queryFn: async () => {
      try {
        // Obtener budget_tasks con datos relacionados
        const { data: budgetTasksData, error: budgetTasksError } = await supabase
          .from('budget_tasks')
          .select(`
            *,
            tasks(
              id,
              name,
              description,
              unit_id,
              category_id,
              units(name),
              task_categories!tasks_category_id_fkey(name, code)
            )
          `)
          .eq('budget_id', budget.id);
        
        if (budgetTasksError) throw budgetTasksError;
        
        return (budgetTasksData || []).map((budgetTask: any) => ({
          id: budgetTask.id,
          name: budgetTask.tasks?.name || 'Tarea no encontrada',
          description: budgetTask.tasks?.description || '',
          category_name: budgetTask.tasks?.task_categories?.name || 'Sin categoría',
          category_code: budgetTask.tasks?.task_categories?.code || '---',
          unit_name: budgetTask.tasks?.units?.name || 'Sin unidad',
          amount: parseFloat(budgetTask.quantity) || 0,
          unit_price: parseFloat(budgetTask.unit_price) || 0,
          total_price: (parseFloat(budgetTask.quantity) || 0) * (parseFloat(budgetTask.unit_price) || 0)
        }));
      } catch (error) {
        console.error('Error fetching budget tasks:', error);
        return [];
      }
    },
    enabled: !!budget.id && !!projectId,
  });

  // Query para obtener categorías únicas
  const { data: categories = [] } = useQuery({
    queryKey: ['element-categories', projectId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('task_categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    enabled: !!projectId,
  });

  // Filtrar tareas
  const filteredTasks = budgetTasks.filter((task: TaskData) => {
    const matchesSearch = !searchTerm || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
      task.category_name === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calcular totales
  const totalTasks = filteredTasks.length;
  const totalAmount = filteredTasks.reduce((sum: number, task: TaskData) => sum + task.total_price, 0);

  if (tasksLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <div className="pl-4 space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn(
        "rounded-2xl shadow-md border-0 overflow-hidden transition-all duration-200",
        isActive ? "bg-primary/5 ring-2 ring-primary/50" : "bg-card"
      )}>
        {/* Header del Acordeón */}
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <button
                onClick={onSetActive}
                className={cn(
                  "text-left flex-1 min-w-0",
                  isActive && "font-semibold"
                )}
              >
                <h3 className="text-lg font-medium text-foreground truncate">
                  {budget.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-foreground">
                    ${(totalAmount || 0).toLocaleString()}
                  </span>
                  {isActive && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs">
                      Activo
                    </Badge>
                  )}
                </div>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {!isActive && (
                <Button
                  onClick={onSetActive}
                  variant="outline"
                  size="sm"
                >
                  Hacer Activo
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implementar exportación PDF
                  console.log('Exportar PDF');
                }}
              >
                <FileText className="h-4 w-4 mr-1" />
                Exportar PDF
              </Button>
              
              <Button
                onClick={onAddTask}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Tarea
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido del Acordeón */}
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Controles de búsqueda y filtros */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de tareas */}
            <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left pl-6 py-3 font-medium text-muted-foreground text-sm w-[15%]">
                        Rubro
                      </th>
                      <th className="text-left py-3 font-medium text-muted-foreground text-sm">
                        Tarea
                      </th>
                      <th className="text-center py-3 font-medium text-muted-foreground text-sm w-[5%]">
                        Unidad
                      </th>
                      <th className="text-center py-3 font-medium text-muted-foreground text-sm w-[5%]">
                        Cantidad
                      </th>
                      <th className="text-center py-3 font-medium text-muted-foreground text-sm w-[5%]">
                        Precio Unit.
                      </th>
                      <th className="text-center py-3 font-medium text-muted-foreground text-sm w-[5%]">
                        Subtotal
                      </th>
                      <th className="text-center py-3 font-medium text-muted-foreground text-sm w-[5%]">
                        %
                      </th>
                      <th className="text-center py-3 font-medium text-muted-foreground text-sm w-[5%]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted-foreground py-8 h-32">
                          No hay tareas para mostrar
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        // Group tasks by category
                        const groupedTasks = filteredTasks.reduce((groups: any, task: TaskData) => {
                          const categoryName = task.category_name || 'Sin categoría';
                          if (!groups[categoryName]) {
                            groups[categoryName] = [];
                          }
                          groups[categoryName].push(task);
                          return groups;
                        }, {});

                        // Calculate total
                        const totalGeneral = filteredTasks.reduce((sum: number, task: TaskData) => 
                          sum + task.total_price, 0
                        );

                        return Object.entries(groupedTasks).flatMap(([categoryName, categoryTasks]: [string, any]) => {
                          // Calculate category totals
                          const categoryTotal = categoryTasks.reduce((sum: number, task: TaskData) => 
                            sum + task.total_price, 0
                          );
                          const categoryPercentage = totalGeneral > 0 ? (categoryTotal / totalGeneral) * 100 : 0;
                          
                          return [
                            // Category Header
                            <tr key={`category-${categoryName}`} className="bg-[#606060] border-border hover:bg-[#606060]">
                              <td className="pl-6 py-3 font-semibold text-sm text-white w-[15%]">
                                {categoryName}
                              </td>
                              <td className="py-3 text-left text-white text-sm"></td>
                              <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                              <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                              <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                              <td className="py-3 text-center font-semibold text-sm text-white w-[5%]">
                                ${categoryTotal.toFixed(2)}
                              </td>
                              <td className="py-3 text-center font-semibold text-sm text-white w-[5%]">
                                {categoryPercentage.toFixed(1)}%
                              </td>
                              <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                            </tr>,
                            // Category Tasks
                            ...categoryTasks.map((task: TaskData) => {
                              const percentage = totalGeneral > 0 ? (task.total_price / totalGeneral) * 100 : 0;
                              return (
                                <tr key={task.id} className="border-border hover:bg-primary/10 transition-colors h-12">
                                  <td className="pl-12 py-1 w-[15%]">
                                    <div className="text-sm font-medium text-foreground">{task.category_code}</div>
                                  </td>
                                  <td className="py-1 text-left pl-6">
                                    <div className="flex flex-col">
                                      <div className="font-medium text-foreground text-sm">{task.name}</div>
                                      {task.description && (
                                        <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="text-center py-1">
                                    <Badge variant="outline" className="bg-muted/50 text-xs">
                                      {task.unit_name}
                                    </Badge>
                                  </td>
                                  <td className="text-center py-1">
                                    <div className="text-sm">{task.amount}</div>
                                  </td>
                                  <td className="text-center py-1">
                                    <div className="text-sm">${task.unit_price ? task.unit_price.toFixed(2) : '0.00'}</div>
                                  </td>
                                  <td className="text-center py-1">
                                    <div className="font-semibold text-sm">${task.total_price.toFixed(2)}</div>
                                  </td>
                                  <td className="text-center py-1">
                                    <div className="text-sm">{percentage.toFixed(1)}%</div>
                                  </td>
                                  <td className="text-center py-1">
                                    <div className="text-sm">-</div>
                                  </td>
                                </tr>
                              );
                            })
                          ];
                        });
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function BudgetTasksMultipleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
      </div>
      
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/50">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(j => <Skeleton key={j} className="h-12 w-full" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SiteTasksMultiple() {
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('budgets-tasks-multiple');
  }, [setSection, setView]);

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateBudgetModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);
    
    return () => {
      window.removeEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);
    };
  }, []);

  // Query para obtener presupuestos
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', projectId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*')
          .eq('project_id', projectId);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching budgets:', error);
        return [];
      }
    },
    enabled: !!projectId,
  });

  // Ordenar presupuestos: activo primero, luego por fecha
  const sortedBudgets = budgets.sort((a: Budget, b: Budget) => {
    if (a.id === budgetId && b.id !== budgetId) return -1;
    if (b.id === budgetId && a.id !== budgetId) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Expandir automáticamente el presupuesto activo
  useEffect(() => {
    if (budgetId && !expandedBudgets.has(budgetId)) {
      setExpandedBudgets(prev => new Set([...Array.from(prev), budgetId]));
    }
  }, [budgetId, expandedBudgets]);

  const handleToggleExpanded = (budgetIdToToggle: string) => {
    setExpandedBudgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(budgetIdToToggle)) {
        newSet.delete(budgetIdToToggle);
      } else {
        newSet.add(budgetIdToToggle);
      }
      return newSet;
    });
  };

  const handleSetActiveBudget = (newBudgetId: string) => {
    setBudgetId(newBudgetId);
    // Expandir el nuevo presupuesto activo
    setExpandedBudgets(prev => new Set([...Array.from(prev), newBudgetId]));
  };

  const handleAddTask = (budgetIdForTask: string) => {
    // Aquí se podría abrir un modal para crear tareas
    toast({
      title: "Función en desarrollo",
      description: "La creación de tareas estará disponible pronto.",
    });
  };

  if (budgetsLoading) {
    return <BudgetTasksMultipleSkeleton />;
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Tareas
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestión de múltiples tablas de cómputo y presupuestos
            </p>
          </div>
        </div>
      </div>

      {/* Lista de presupuestos como acordeones */}
      <div className="space-y-4">
        {sortedBudgets.length === 0 ? (
          <div className="rounded-2xl shadow-md bg-card border-0 p-8 text-center">
            <div className="text-muted-foreground">
              No hay presupuestos disponibles
            </div>
          </div>
        ) : (
          sortedBudgets.map((budget: Budget) => (
            <BudgetAccordion
              key={budget.id}
              budget={budget}
              isActive={budget.id === budgetId}
              isExpanded={expandedBudgets.has(budget.id)}
              onToggle={() => handleToggleExpanded(budget.id)}
              onSetActive={() => handleSetActiveBudget(budget.id)}
              onAddTask={() => handleAddTask(budget.id)}
            />
          ))
        )}
      </div>

      {/* Create Budget Modal */}
      <CreateBudgetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}