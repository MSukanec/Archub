import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const taskSchema = z.object({
  task_id: z.string().min(1, 'Debes seleccionar una tarea'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
});

type TaskForm = z.infer<typeof taskSchema>;

interface TaskModalNewProps {
  budgetId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModalNew({ budgetId, isOpen, onClose }: TaskModalNewProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      task_id: '',
      quantity: 1,
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSearchQuery('');
      setSelectedCategory('');
      setSelectedSubcategory('');
      setSelectedElement('');
      setSelectedTask(null);
    }
  }, [isOpen, form]);

  // Buscar tareas solo cuando la búsqueda sea válida
  const { data: tasks = [] } = useQuery({
    queryKey: ['search-tasks', organizationId, searchQuery],
    queryFn: async () => {
      console.log('Buscando tareas con query:', searchQuery);
      if (!organizationId || !searchQuery || searchQuery.length < 3) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .ilike('name', `%${searchQuery}%`)
        .order('name')
        .limit(20);
      
      if (error) {
        console.error('Error buscando tareas:', error);
        throw error;
      }
      console.log('Tareas encontradas:', data);
      return data || [];
    },
    enabled: Boolean(organizationId && isOpen && searchQuery && searchQuery.length >= 3),
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (data: TaskForm) => {
      if (!budgetId) throw new Error('No hay presupuesto seleccionado');
      if (!selectedTask) throw new Error('No hay tarea seleccionada');
      
      const taskData = {
        budget_id: budgetId,
        task_id: data.task_id,
        quantity: data.quantity,
        unit_price: selectedTask.unit_labor_price + selectedTask.unit_material_price,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: savedTask, error } = await supabase
        .from('budget_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      return savedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-tasks', budgetId] });
      toast({
        title: "Tarea agregada",
        description: "La tarea se ha agregado al presupuesto correctamente.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error al agregar tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskForm) => {
    saveTaskMutation.mutate(data);
  };

  const handleTaskSelect = (task: any) => {
    setSelectedTask(task);
    form.setValue('task_id', task.id.toString());
  };

  const handleClose = () => {
    form.reset();
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedElement('');
    setSelectedTask(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-[#e0e0e0] flex flex-col">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Agregar Tarea al Presupuesto
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Busca una tarea por nombre o utiliza los filtros para encontrar la tarea específica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-2 flex-1 overflow-y-auto">
          {/* Búsqueda por nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Buscar tarea por nombre (mínimo 3 caracteres)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Escribir nombre de la tarea..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#d2d2d2] border-gray-300 focus:ring-primary focus:border-primary"
              />
            </div>
            {searchQuery && searchQuery.length < 3 && (
              <p className="text-sm text-orange-600">
                Escribe al menos 3 caracteres para buscar tareas
              </p>
            )}
          </div>

          {/* Lista de tareas */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tareas encontradas ({tasks.length})
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-300 rounded-md p-2 bg-[#d2d2d2]">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedTask?.id === task.id
                        ? 'bg-primary text-white'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleTaskSelect(task)}
                  >
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Precio: ${(task.unit_labor_price + task.unit_material_price).toFixed(2)} / {task.unit || 'unidad'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de cantidad */}
          {selectedTask && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-foreground mb-2">Tarea seleccionada:</h4>
                  <p className="text-sm">{selectedTask.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Precio unitario: ${(selectedTask.unit_labor_price + selectedTask.unit_material_price).toFixed(2)}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        Cantidad <span className="text-primary">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="1.00"
                          className="bg-[#d2d2d2] border-gray-300 focus:ring-primary focus:border-primary"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-center gap-4 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose}
                    className="px-6 py-2 bg-white border-gray-300 hover:bg-gray-50"
                    disabled={saveTaskMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white min-w-[120px]"
                    disabled={saveTaskMutation.isPending}
                  >
                    {saveTaskMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      'Agregar Tarea'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}