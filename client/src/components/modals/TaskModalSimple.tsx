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
import { Search, X } from 'lucide-react';
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

  // Filtrar tareas basado en la búsqueda
  const filteredTasks = allTasks.filter(task =>
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
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Agregar Tareas al Presupuesto
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Busca tareas por nombre y selecciona las que quieres agregar al presupuesto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-2 flex-1 overflow-y-auto">
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

          {/* Tabla de todas las tareas */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              Tareas disponibles ({filteredTasks.length}{allTasks.length > 0 && allTasks.length !== filteredTasks.length ? ` de ${allTasks.length}` : ''})
            </h3>
            <div className="border border-gray-300 rounded-lg bg-[#d2d2d2] max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-300 bg-gray-100 font-medium text-sm sticky top-0">
                <div className="col-span-1">Seleccionar</div>
                <div className="col-span-6">Nombre de la tarea</div>
                <div className="col-span-2">Precio unitario</div>
                <div className="col-span-1">Unidad</div>
                <div className="col-span-2">Cantidad</div>
              </div>
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

          {/* Resumen de tareas seleccionadas */}
          {selectedTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Tareas seleccionadas ({selectedTasks.length})
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="flex justify-between items-center py-1">
                    <span className="text-sm">{task.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Cantidad: {task.quantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTasks(prev => prev.filter(t => t.id !== task.id))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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