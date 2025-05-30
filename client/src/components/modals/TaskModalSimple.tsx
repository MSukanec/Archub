import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X, ShoppingCart, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

interface TaskModalSimpleProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Task {
  id: string;
  name: string;
  unit_labor_price: number;
  unit_material_price: number;
  unit: number;
}

interface SelectedTask extends Task {
  quantity: number;
}

export function TaskModalSimple({ isOpen, onOpenChange }: TaskModalSimpleProps) {
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

  // Obtener tareas ya agregadas al presupuesto
  const { data: existingBudgetTasks = [] } = useQuery({
    queryKey: ['budget-tasks', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      
      const { data, error } = await supabase
        .from('budget_tasks')
        .select('task_id')
        .eq('budget_id', budgetId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!budgetId && isOpen,
  });

  // Obtener todas las tareas
  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(organizationId && isOpen),
  });

  // Obtener IDs de tareas ya agregadas
  const existingTaskIds = existingBudgetTasks.map(bt => bt.task_id);
  
  // Filtrar tareas excluyendo las ya agregadas
  const availableTasks = allTasks.filter(task => !existingTaskIds.includes(task.id));

  // Filtrar tareas basado en la búsqueda
  const filteredTasks = availableTasks.filter(task =>
    searchQuery.length === 0 || 
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Agregar tareas al presupuesto
  const addTasksMutation = useMutation({
    mutationFn: async (tasksToAdd: SelectedTask[]) => {
      if (!budgetId) throw new Error('No hay presupuesto seleccionado');

      const budgetTasks = tasksToAdd.map(task => ({
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
      toast({
        title: 'Tareas agregadas',
        description: `Se agregaron ${selectedTasks.length} tarea(s) al presupuesto correctamente`,
      });
      queryClient.invalidateQueries({ queryKey: ['budget-tasks'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error al agregar tareas:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al agregar las tareas',
        variant: 'destructive',
      });
    },
  });

  const handleTaskToggle = (task: Task, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, { ...task, quantity: 1 }]);
    } else {
      setSelectedTasks(prev => prev.filter(t => t.id !== task.id));
    }
  };

  const handleQuantityChange = (taskId: string, quantity: number) => {
    setSelectedTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, quantity: Math.max(1, quantity) } : task
      )
    );
  };

  const handleSubmit = () => {
    if (selectedTasks.length === 0) {
      toast({
        title: 'Selecciona tareas',
        description: 'Debes seleccionar al menos una tarea',
        variant: 'destructive',
      });
      return;
    }
    addTasksMutation.mutate(selectedTasks);
  };

  const isTaskSelected = (taskId: string) => {
    return selectedTasks.some(task => task.id === taskId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-[#e0e0e0] border-gray-300 flex flex-col">
        <DialogHeader className="pb-4 relative">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-2">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Agregar Tareas al Presupuesto
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Busca tareas por nombre y selecciona las que quieres agregar al presupuesto
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-2 flex-1 overflow-hidden">
          <Tabs defaultValue="available" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-[#d2d2d2]">
              <TabsTrigger 
                value="available"
                className="data-[state=active]:bg-white data-[state=active]:text-foreground"
              >
                Tareas Disponibles ({filteredTasks.length})
              </TabsTrigger>
              <TabsTrigger 
                value="selected" 
                className="relative data-[state=active]:bg-white data-[state=active]:text-foreground"
              >
                Seleccionadas ({selectedTasks.length})
                {selectedTasks.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {selectedTasks.length}
                  </div>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="flex-1 space-y-4 overflow-hidden">
              {/* Campo de búsqueda */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Filtrar tareas por nombre
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por nombre de tarea..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#d2d2d2] border-gray-300 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Tabla de tareas disponibles */}
              <div className="border border-gray-300 rounded-lg bg-[#d2d2d2] flex-1 overflow-hidden flex flex-col">
                <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-300 bg-gray-100 font-medium text-sm">
                  <div className="col-span-1">Seleccionar</div>
                  <div className="col-span-6">Nombre de la tarea</div>
                  <div className="col-span-2">Precio unitario</div>
                  <div className="col-span-1">Unidad</div>
                  <div className="col-span-2">Cantidad</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {allTasks.length === 0 ? 'No hay tareas disponibles' : 'No se encontraron tareas con ese filtro'}
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div key={task.id} className="grid grid-cols-12 gap-2 p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                        <div className="col-span-1 flex items-center">
                          <Checkbox
                            checked={isTaskSelected(task.id)}
                            onCheckedChange={(checked) => handleTaskToggle(task, checked as boolean)}
                          />
                        </div>
                        <div className="col-span-6 text-sm">
                          {task.name}
                        </div>
                        <div className="col-span-2 text-sm">
                          ${(task.unit_labor_price + task.unit_material_price).toFixed(2)}
                        </div>
                        <div className="col-span-1 text-sm">
                          {task.unit}
                        </div>
                        <div className="col-span-2">
                          {isTaskSelected(task.id) && (
                            <Input
                              type="number"
                              min="1"
                              value={selectedTasks.find(t => t.id === task.id)?.quantity || 1}
                              onChange={(e) => handleQuantityChange(task.id, parseInt(e.target.value) || 1)}
                              className="h-8 text-sm bg-white"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="selected" className="flex-1 space-y-4 overflow-hidden">
              {selectedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No hay tareas seleccionadas
                  </h3>
                  <p className="text-sm text-gray-400">
                    Ve a la pestaña "Tareas Disponibles" para seleccionar tareas
                  </p>
                </div>
              ) : (
                <div className="space-y-2 h-full overflow-y-auto">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Tareas seleccionadas para agregar al presupuesto
                  </h3>
                  <div className="space-y-2">
                    {selectedTasks.map((task) => (
                      <div key={task.id} className="bg-[#d2d2d2] border border-gray-300 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {task.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Precio unitario: ${(task.unit_labor_price + task.unit_material_price).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTasks(prev => prev.filter(t => t.id !== task.id))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <label className="text-sm font-medium">Cantidad:</label>
                          <Input
                            type="number"
                            min="1"
                            value={task.quantity}
                            onChange={(e) => handleQuantityChange(task.id, parseInt(e.target.value) || 1)}
                            className="w-20 h-8 text-sm bg-white"
                          />
                          <span className="text-sm text-muted-foreground">
                            = ${(task.quantity * (task.unit_labor_price + task.unit_material_price)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total estimado:</span>
                      <span className="text-lg font-bold text-green-600">
                        ${selectedTasks.reduce((total, task) => 
                          total + (task.quantity * (task.unit_labor_price + task.unit_material_price)), 0
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedTasks.length === 0 || addTasksMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {addTasksMutation.isPending ? 'Agregando...' : 'Agregar Tareas'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}