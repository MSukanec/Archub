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
  const { projectId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [activeBudgetId, setActiveBudgetId] = useState<number | null>(null);
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
            value={activeBudgetId?.toString() || ""} 
            onValueChange={(value) => {
              console.log('Budget selected:', value);
              const budgetId = Number(value);
              console.log('Setting activeBudgetId to:', budgetId);
              setActiveBudgetId(budgetId);
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
            disabled={!activeBudgetId}
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
            <Badge variant="secondary">Total: $0.00</Badge>
          </CardTitle>
          <CardDescription>
            Agrega tareas y cantidades para calcular el presupuesto total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hay tareas en este presupuesto
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {!activeBudgetId 
                ? "Selecciona un presupuesto para ver sus tareas"
                : "Comienza agregando la primera tarea"
              }
            </p>
            {activeBudgetId && (
              <Button onClick={() => setIsTaskModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Primera Tarea
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        budgetId={activeBudgetId}
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