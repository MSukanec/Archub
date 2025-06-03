import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, X, Plus, Calculator, CheckSquare, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import ModernModal from '@/components/ui/ModernModal';

interface BudgetTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Task {
  id: string;
  name: string;
  description?: string;
  unit_labor_price: number;
  unit_material_price: number;
  unit_name?: string;
  category_name?: string;
}

interface SelectedTask extends Task {
  quantity: number;
}

export function BudgetTaskModal({ isOpen, onClose }: BudgetTaskModalProps) {
  const { toast } = useToast();
  const { organizationId, budgetId } = useUserContextStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedTasks([]);
    }
  }, [isOpen]);

  // Query para obtener tareas disponibles
  const { data: availableTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['available-tasks', organizationId, searchQuery],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Primero obtener las tareas básicas
      let query = supabase
        .from('tasks')
        .select(`
          id,
          name,
          description,
          unit_labor_price,
          unit_material_price,
          unit_id,
          category_id
        `)
        .eq('organization_id', organizationId);

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      const { data: tasks, error } = await query;
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
      
      if (!tasks || tasks.length === 0) {
        return [];
      }

      // Obtener nombres de unidades y categorías por separado
      const unitIds = [...new Set(tasks.map(t => t.unit_id).filter(Boolean))];
      const categoryIds = [...new Set(tasks.map(t => t.category_id).filter(Boolean))];

      const [unitsResult, categoriesResult] = await Promise.all([
        unitIds.length > 0 
          ? supabase.from('units').select('id, name').in('id', unitIds)
          : Promise.resolve({ data: [], error: null }),
        categoryIds.length > 0 
          ? supabase.from('task_categories').select('id, name').in('id', categoryIds)
          : Promise.resolve({ data: [], error: null })
      ]);

      const unitsMap = new Map((unitsResult.data || []).map(u => [u.id, u.name]));
      const categoriesMap = new Map((categoriesResult.data || []).map(c => [c.id, c.name]));

      console.log('Tasks fetched:', tasks.length);
      
      // Transform data to match our interface
      return tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        unit_labor_price: Number(task.unit_labor_price) || 0,
        unit_material_price: Number(task.unit_material_price) || 0,
        unit_name: unitsMap.get(task.unit_id) || 'Sin unidad',
        category_name: categoriesMap.get(task.category_id) || 'Sin categoría'
      }));
    },
    enabled: !!organizationId && isOpen,
  });

  // Mutación para agregar tareas al presupuesto
  const addTasksMutation = useMutation({
    mutationFn: async (tasks: SelectedTask[]) => {
      if (!budgetId) throw new Error('No hay presupuesto seleccionado');

      const budgetTasks = tasks.map(task => ({
        budget_id: budgetId,
        task_id: task.id,
        quantity: task.quantity,
      }));

      const { error } = await supabase
        .from('budget_tasks')
        .insert(budgetTasks);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['budget-materials'] });
      toast({
        title: "Tareas agregadas",
        description: `Se agregaron ${selectedTasks.length} tarea(s) al presupuesto correctamente.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error al agregar tareas",
        description: "No se pudieron agregar las tareas al presupuesto. Intenta nuevamente.",
        variant: "destructive",
      });
      console.error('Error adding tasks:', error);
    },
  });

  const handleTaskSelect = (task: Task, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, { ...task, quantity: 1 }]);
    } else {
      setSelectedTasks(prev => prev.filter(t => t.id !== task.id));
    }
  };

  const handleQuantityChange = (taskId: string, quantity: number) => {
    setSelectedTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, quantity: Math.max(0.01, quantity) }
          : task
      )
    );
  };

  const handleRemoveTask = (taskId: string) => {
    setSelectedTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleSubmit = () => {
    if (selectedTasks.length === 0) {
      toast({
        title: "Selecciona tareas",
        description: "Debes seleccionar al menos una tarea para agregar al presupuesto.",
        variant: "destructive",
      });
      return;
    }
    
    addTasksMutation.mutate(selectedTasks);
  };

  const filteredTasks = availableTasks.filter(task => 
    !selectedTasks.some(selected => selected.id === task.id)
  );

  const totalAmount = selectedTasks.reduce((sum, task) => 
    sum + (task.unit_labor_price + task.unit_material_price) * task.quantity, 0
  );

  const footerContent = (
    <div className="space-y-4">
      {selectedTasks.length > 0 && (
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <span className="font-medium text-foreground">Total del presupuesto:</span>
          <span className="text-xl font-bold text-primary">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-[0_0_25%] rounded-xl bg-[#e0e0e0] border-[#919191] text-muted-foreground hover:bg-surface-secondary"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedTasks.length === 0 || addTasksMutation.isPending}
          className="flex-[0_0_75%] rounded-xl bg-[#4f9eff] border-[#4f9eff] text-white hover:bg-[#3d8ce6]"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {addTasksMutation.isPending ? 'Agregando...' : `Agregar ${selectedTasks.length} Tarea(s)`}
        </Button>
      </div>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Tareas"
      subtitle="Selecciona las tareas que deseas agregar al presupuesto"
      width="4xl"
      icon={Wrench}
      footer={footerContent}
    >
      <div className="space-y-6">
        <Accordion type="multiple" defaultValue={["search", "selected"]} className="w-full space-y-2">
          {/* Búsqueda de Tareas */}
          <AccordionItem value="search" className="border-input">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Buscar Tareas Disponibles
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-3">
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar tareas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#d2d2d2] border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                />
              </div>

              {/* Lista de tareas disponibles */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {tasksLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando tareas...
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No se encontraron tareas que coincidan con la búsqueda.' : 'No hay tareas disponibles.'}
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <Checkbox
                          checked={selectedTasks.some(t => t.id === task.id)}
                          onCheckedChange={(checked) => handleTaskSelect(task, checked as boolean)}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">{task.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {task.category_name}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {task.unit_name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-medium text-foreground">
                          ${(task.unit_labor_price + task.unit_material_price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tareas Seleccionadas */}
          <AccordionItem value="selected" className="border-input">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                Tareas Seleccionadas ({selectedTasks.length})
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-3">
              {selectedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No has seleccionado ninguna tarea
                </div>
              ) : (
                <>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {selectedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 border border-border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">{task.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {task.category_name}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {task.unit_name}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={task.quantity}
                            onChange={(e) => handleQuantityChange(task.id, parseFloat(e.target.value) || 0.01)}
                            min="0.01"
                            step="0.01"
                            className="w-16 h-7 text-center bg-[#d2d2d2] border-input rounded-lg text-xs"
                          />
                          <div className="text-right text-xs min-w-[60px]">
                            <div className="font-medium text-foreground">
                              ${((task.unit_labor_price + task.unit_material_price) * task.quantity).toFixed(2)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTask(task.id)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10 h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ModernModal>
  );
}