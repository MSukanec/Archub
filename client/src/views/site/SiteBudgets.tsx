import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Calculator, Search, Filter, Plus, ChevronDown, ChevronRight, FileText, Trash2, FileDown, Edit } from 'lucide-react';
import { useUserContextStore } from '../stores/userContextStore';
import { useNavigationStore } from '../stores/navigationStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { useToast } from '../hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import CreateBudgetModal from '../components/modals/CreateBudgetModal';
import { BudgetTaskModal } from '../components/modals/BudgetTaskModal';
import PDFExportPreview from '../components/modals/PDFExportPreview';

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
  parent_category_name: string;
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
  onDeleteBudget: (budgetId: string) => void;
  isDeleting: boolean;
  onDeleteTask: (taskId: string) => void;
  isDeletingTask: boolean;
  onExportPDF: (budget: Budget) => void;
}

function BudgetAccordion({ budget, isActive, isExpanded, onToggle, onSetActive, onAddTask, onDeleteBudget, isDeleting, onDeleteTask, isDeletingTask, onExportPDF }: BudgetAccordionProps) {
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
          parent_category_name: budgetTask.tasks?.task_categories?.parent_category_name || 'Sin categoría padre',
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

  // Query para obtener categorías únicas (usaremos las categorías normales por ahora)
  const { data: parentCategories = [] } = useQuery({
    queryKey: ['task-categories', projectId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('task_categories')
          .select('name')
          .order('name');
        
        if (error) throw error;
        
        // Obtener categorías únicas
        const uniqueCategories = Array.from(new Set((data || []).map(item => item.name)));
        return uniqueCategories.map(name => ({ name }));
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
        isActive ? "bg-surface-secondary ring-2 ring-primary/50" : "bg-surface-secondary"
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
                    <Badge className="text-xs">
                      Activo
                    </Badge>
                  )}
                </div>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {!isActive ? (
                <>
                  <Button
                    onClick={onSetActive}
                    variant="outline"
                    size="sm"
                  >
                    Hacer Activo
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Abrir modal de edición de presupuesto
                      console.log('Editar presupuesto:', budget.id);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            <strong>¡ATENCIÓN!</strong> Esta acción eliminará permanentemente el presupuesto "{budget.name}" y <strong>TODOS</strong> los datos relacionados:
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Todas las tareas asociadas al presupuesto</li>
                            <li>Todas las bitácoras relacionadas</li>
                            <li>Todos los cómputos y cálculos</li>
                            <li>Cualquier otro dato vinculado al presupuesto</li>
                          </ul>
                          <p className="font-semibold text-destructive">
                            Esta acción NO se puede deshacer.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteBudget(budget.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Eliminando..." : "Eliminar Presupuesto"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => onExportPDF(budget)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  
                  <Button
                    onClick={onAddTask}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Tarea
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            <strong>¡ATENCIÓN!</strong> Esta acción eliminará permanentemente el presupuesto "{budget.name}" y <strong>TODOS</strong> los datos relacionados:
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Todas las tareas asociadas al presupuesto</li>
                            <li>Todas las bitácoras relacionadas</li>
                            <li>Todos los cómputos y cálculos</li>
                            <li>Cualquier otro dato vinculado al presupuesto</li>
                          </ul>
                          <p className="font-semibold text-destructive">
                            Esta acción NO se puede deshacer.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteBudget(budget.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Eliminando..." : "Eliminar Presupuesto"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
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
                  className="pl-10 bg-surface-primary border-input rounded-xl shadow-lg hover:shadow-xl"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {parentCategories.map((category: any) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de tareas - Desktop */}
            <div className="hidden xl:block rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left pl-6 py-3 font-medium text-muted-foreground text-sm w-[10%]">
                        Rubro
                      </th>
                      <th className="text-left pl-6 py-3 font-medium text-muted-foreground text-sm">
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

                        const allRows = Object.entries(groupedTasks).flatMap(([categoryName, categoryTasks]: [string, any]) => {
                          // Calculate category totals
                          const categoryTotal = categoryTasks.reduce((sum: number, task: TaskData) => 
                            sum + task.total_price, 0
                          );
                          const categoryPercentage = totalGeneral > 0 ? (categoryTotal / totalGeneral) * 100 : 0;
                          
                          return [
                            // Category Header
                            <tr key={`category-${categoryName}`} className="bg-[#606060] border-border hover:bg-[#606060]">
                              <td colSpan={2} className="pl-6 py-3 font-semibold text-sm text-white">
                                {categoryName}
                              </td>
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
                                <tr key={task.id} className="border-border hover:bg-muted/50 transition-colors h-12">
                                  <td className="pl-6 py-1 w-[10%]">
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
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción eliminará permanentemente la tarea "{task.name}" del presupuesto. Esta acción NO se puede deshacer.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => onDeleteTask(task.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={isDeletingTask}
                                          >
                                            {isDeletingTask ? "Eliminando..." : "Eliminar Tarea"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </td>
                                </tr>
                              );
                            })
                          ];
                        });

                        // Agregar fila de TOTALES
                        allRows.push(
                          <tr key="totals" className="bg-black border-black hover:bg-black">
                            <td colSpan={2} className="pl-6 py-4 font-bold text-white text-base">
                              TOTALES
                            </td>
                            <td className="py-4 text-center text-white"></td>
                            <td className="py-4 text-center text-white"></td>
                            <td className="py-4 text-center text-white"></td>
                            <td className="py-4 text-center font-bold text-white text-base">
                              ${totalGeneral.toFixed(2)}
                            </td>
                            <td className="py-4 text-center font-bold text-white text-base">
                              100.0%
                            </td>
                            <td className="py-4 text-center text-white"></td>
                          </tr>
                        );

                        return allRows;
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards responsivas - Tablet/Mobile */}
            <div className="xl:hidden space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No hay tareas para mostrar
                </div>
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

                  return Object.entries(groupedTasks).map(([categoryName, categoryTasks]: [string, any]) => {
                    // Calculate category totals
                    const categoryTotal = categoryTasks.reduce((sum: number, task: TaskData) => 
                      sum + task.total_price, 0
                    );
                    const categoryPercentage = totalGeneral > 0 ? (categoryTotal / totalGeneral) * 100 : 0;

                    return (
                      <div key={categoryName} className="space-y-2">
                        {/* Category Header Card */}
                        <div className="rounded-lg shadow-md bg-[#606060] p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-white text-sm">{categoryName}</span>
                            <div className="text-right">
                              <div className="font-semibold text-white text-sm">
                                ${categoryTotal.toFixed(2)}
                              </div>
                              <div className="text-xs text-white/80">
                                {categoryPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Category Tasks Cards */}
                        {categoryTasks.map((task: TaskData) => {
                          const percentage = totalGeneral > 0 ? (task.total_price / totalGeneral) * 100 : 0;
                          
                          return (
                            <div 
                              key={task.id} 
                              className="rounded-lg shadow-md bg-surface-secondary border-0 p-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate text-foreground">{task.name}</h4>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-foreground ml-2">
                                  ${task.total_price.toFixed(2)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Unidad:</span>
                                  <span className="font-medium text-foreground">{task.unit_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Cantidad:</span>
                                  <span className="font-medium text-foreground">{task.amount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Precio Unit.:</span>
                                  <span className="font-medium text-foreground">${task.unit_price ? task.unit_price.toFixed(2) : '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">% Incidencia:</span>
                                  <span className="font-medium text-foreground">{percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()
              )}
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
        <div key={i} className="rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
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

export default function SiteBudgets() {
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfExportData, setPdfExportData] = useState<{budgetName: string; tasks: any[]}>({budgetName: '', tasks: []});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('budgets-tasks-multiple');
  }, [setSection, setView]);



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

  // Mutación para eliminar presupuesto
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetIdToDelete: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetIdToDelete);
      
      if (error) throw error;
    },
    onSuccess: (_, budgetIdDeleted) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      // Si se eliminó el presupuesto activo, cambiar al primer presupuesto disponible
      if (budgetIdDeleted === budgetId) {
        const remainingBudgets = budgets.filter(b => b.id !== budgetIdDeleted);
        if (remainingBudgets.length > 0) {
          setBudgetId(remainingBudgets[0].id);
        } else {
          setBudgetId('');
        }
      }

      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto y todos sus datos relacionados han sido eliminados correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar presupuesto",
        description: "No se pudo eliminar el presupuesto. Intenta nuevamente.",
        variant: "destructive",
      });
      console.error('Error deleting budget:', error);
    },
  });

  // Mutación para eliminar tarea del presupuesto
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('budget_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-tasks'] });
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada del presupuesto correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar tarea",
        description: "No se pudo eliminar la tarea. Intenta nuevamente.",
        variant: "destructive",
      });
      console.error('Error deleting task:', error);
    },
  });

  // Función para manejar la exportación PDF
  const handleExportPDF = async (budget: Budget) => {
    try {
      // Obtener las tareas del presupuesto usando la misma estructura que funciona
      const { data: budgetTasks, error } = await supabase
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

      if (error) throw error;

      // Formatear los datos para el PDF usando la estructura correcta
      const formattedTasks = (budgetTasks || []).map((budgetTask: any) => ({
        id: budgetTask.id,
        name: budgetTask.tasks?.name || 'Tarea sin nombre',
        description: budgetTask.tasks?.description || '',
        category_name: budgetTask.tasks?.task_categories?.name || 'General',
        category_code: budgetTask.tasks?.task_categories?.code || 'GEN',
        unit_name: budgetTask.tasks?.units?.name || 'Unidad',
        amount: parseFloat(budgetTask.quantity) || 0,
        unit_price: parseFloat(budgetTask.unit_price) || 0,
        total_price: (parseFloat(budgetTask.quantity) || 0) * (parseFloat(budgetTask.unit_price) || 0)
      }));

      // Configurar los datos para el modal PDF
      setPdfExportData({
        budgetName: budget.name,
        tasks: formattedTasks
      });
      
      setIsPDFModalOpen(true);
    } catch (error) {
      console.error('Error preparing PDF export:', error);
      toast({
        title: "Error al preparar exportación",
        description: "No se pudieron cargar los datos del presupuesto.",
        variant: "destructive",
      });
    }
  };

  // Establecer presupuesto activo por defecto y expandir
  useEffect(() => {
    if (!budgetsLoading && budgets.length > 0) {
      // Si no hay presupuesto activo, establecer el primero como activo
      if (!budgetId) {
        const firstBudgetId = budgets[0].id;
        setBudgetId(firstBudgetId);
        // Expandir inmediatamente el presupuesto activo
        setExpandedBudgets(new Set([firstBudgetId]));
      } else {
        // Si ya hay un presupuesto activo, asegurar que esté expandido
        setExpandedBudgets(new Set([budgetId]));
      }
    }
  }, [budgets, budgetsLoading, budgetId, setBudgetId]);

  // Expandir el presupuesto cuando cambie el activo
  useEffect(() => {
    if (budgetId) {
      setExpandedBudgets(new Set([budgetId]));
    }
  }, [budgetId]);

  const handleToggleExpanded = (budgetIdToToggle: string) => {
    if (budgetIdToToggle === budgetId) {
      // Si es el presupuesto activo, alternar su estado
      setExpandedBudgets(prev => {
        return prev.has(budgetIdToToggle) ? new Set() : new Set([budgetIdToToggle]);
      });
    } else {
      // Si no es el activo, hacer activo y expandir
      setBudgetId(budgetIdToToggle);
      setExpandedBudgets(new Set([budgetIdToToggle]));
    }
  };

  const handleSetActiveBudget = (newBudgetId: string) => {
    setBudgetId(newBudgetId);
    // Expandir el nuevo presupuesto activo
    setExpandedBudgets(prev => new Set([...Array.from(prev), newBudgetId]));
  };

  const handleAddTask = (budgetIdForTask: string) => {
    setBudgetId(budgetIdForTask);
    setIsTaskModalOpen(true);
  };

  if (budgetsLoading) {
    return <BudgetTasksMultipleSkeleton />;
  }

  return (
    <>
      <div className="flex-1 p-6 md:p-6 p-3 space-y-6 md:space-y-6 space-y-3">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Cómputo y Presupuesto
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestión de múltiples tablas de cómputo y presupuestos
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Presupuesto
          </Button>
        </div>

        {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Presupuestos</p>
              <p className="text-2xl font-bold text-foreground">{budgets.length}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="bg-surface-secondary border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total del Proyecto</p>
              <p className="text-2xl font-bold text-foreground">
                ${budgets.reduce((sum, budget) => sum + (budget.total_price || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Calculator className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar presupuestos..."
            className="pl-10 bg-surface-primary border-input rounded-xl shadow-lg hover:shadow-xl"
          />
        </div>
        <Button variant="outline" size="sm" className="w-96">
          <Filter className="h-4 w-4 mr-2" />
          Más recientes
        </Button>
      </div>

      {/* Lista de presupuestos como acordeones */}
      <div className="space-y-4">
        {sortedBudgets.length === 0 ? (
          <div className="rounded-2xl shadow-md bg-surface-secondary border-0 p-8 text-center">
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
              onDeleteBudget={(budgetIdToDelete) => deleteBudgetMutation.mutate(budgetIdToDelete)}
              isDeleting={deleteBudgetMutation.isPending}
              onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
              isDeletingTask={deleteTaskMutation.isPending}
              onExportPDF={handleExportPDF}
            />
          ))
        )}
      </div>

      {/* Create Budget Modal */}
      <CreateBudgetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBudgetCreated={(newBudgetId) => {
          // Establecer el nuevo presupuesto como activo y expandirlo
          setBudgetId(newBudgetId);
          setExpandedBudgets(new Set([newBudgetId]));
        }}
      />

      {/* Task Modal */}
      <BudgetTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      {/* PDF Export Modal */}
      <PDFExportPreview
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        title={pdfExportData.budgetName}
        data={pdfExportData.tasks}
        type="budget"
      />
      </div>

      {/* Floating Action Button - Mobile only */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
}