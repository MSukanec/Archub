import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Calculator, Search, Filter, Plus, ChevronDown, ChevronRight } from 'lucide-react';
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
    queryKey: ['/api/budget-tasks', budget.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/budget-tasks?budget_id=${budget.id}&project_id=${projectId}`);
        if (!response.ok) throw new Error('Error fetching budget tasks');
        
        const data = await response.json();
        return data.map((task: any) => ({
          id: task.id,
          name: task.name,
          description: task.description || '',
          category_name: task.element_categories?.name || 'Sin categoría',
          category_code: task.element_categories?.code || '---',
          unit_name: task.units?.name || 'Sin unidad',
          amount: parseFloat(task.amount) || 0,
          unit_price: parseFloat(task.unit_price) || 0,
          total_price: (parseFloat(task.amount) || 0) * (parseFloat(task.unit_price) || 0)
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
    queryKey: ['/api/element-categories', projectId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/element-categories?organization_id=${projectId}`);
        if (!response.ok) throw new Error('Error fetching categories');
        return await response.json();
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
                <p className="text-sm text-muted-foreground">
                  {totalTasks} tareas • ${totalAmount.toLocaleString()}
                </p>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {isActive && (
                <Badge variant="default" className="bg-primary text-white">
                  Activo
                </Badge>
              )}
              
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
                  className="pl-10 bg-white/80 hover:bg-white"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 bg-white/80 hover:bg-white">
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
                      <th className="text-left p-4 font-medium text-muted-foreground" style={{ width: '15%' }}>
                        Rubro
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground flex-1">
                        Tarea
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground" style={{ width: '5%' }}>
                        Unidad
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground" style={{ width: '5%' }}>
                        Cantidad
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground" style={{ width: '5%' }}>
                        Precio Unit.
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground" style={{ width: '5%' }}>
                        Precio Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No hay tareas para mostrar
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task: TaskData) => (
                        <tr
                          key={task.id}
                          className="border-b border-border hover:bg-primary/5 transition-colors"
                        >
                          <td className="p-4" style={{ width: '15%' }}>
                            <span className="font-medium text-foreground">
                              {task.category_code}
                            </span>
                          </td>
                          <td className="p-4 flex-1">
                            <div className="space-y-1">
                              <div className="font-medium text-foreground">
                                {task.name}
                              </div>
                              {task.description && (
                                <div className="text-sm text-muted-foreground">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4" style={{ width: '5%' }}>
                            <span className="text-foreground">
                              {task.unit_name}
                            </span>
                          </td>
                          <td className="p-4" style={{ width: '5%' }}>
                            <span className="text-foreground">
                              {task.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4" style={{ width: '5%' }}>
                            <span className="text-foreground">
                              ${task.unit_price.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4" style={{ width: '5%' }}>
                            <span className="font-medium text-foreground">
                              ${task.total_price.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))
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

export default function BudgetTasksMultiple() {
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('budgets-tasks-multiple');
  }, [setSection, setView]);

  // Query para obtener presupuestos
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['/api/budgets', projectId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/budgets?project_id=${projectId}`);
        if (!response.ok) throw new Error('Error fetching budgets');
        return await response.json();
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
    </div>
  );
}