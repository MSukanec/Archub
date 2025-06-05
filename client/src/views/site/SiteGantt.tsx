import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Save, Edit3, BarChart3 } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { format, addDays, startOfWeek, endOfWeek, differenceInDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface Task {
  id: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  duration: number;
  status: string;
  progress: number;
  color: string;
}

interface GanttBar {
  task: Task;
  left: number;
  width: number;
  isDragging: boolean;
}

const categoryColors = {
  'Estructura': '#3B82F6',
  'Albañilería': '#EF4444',
  'Instalaciones': '#10B981',
  'Terminaciones': '#F59E0B',
  'Otros': '#6B7280'
};

export default function SiteGantt() {
  const { projectId } = useUserContextStore();
  const queryClient = useQueryClient();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    taskId: string | null;
    startX: number;
    originalLeft: number;
    originalWidth: number;
    type: 'move' | 'resize-start' | 'resize-end' | null;
  }>({
    taskId: null,
    startX: 0,
    originalLeft: 0,
    originalWidth: 0,
    type: null
  });

  // Fetch tasks for the current project
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks-gantt', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          name,
          created_at,
          category_id
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      // Fetch categories separately
      const { data: categoriesData } = await supabase
        .from('material_categories')
        .select('id, name, color');

      const categoriesMap = categoriesData?.reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {} as Record<string, any>) || {};

      console.log('Raw tasks data:', data);
      console.log('Categories map:', categoriesMap);

      return data?.map(task => {
        const category = categoriesMap[task.category_id];
        const startDate = task.created_at ? format(new Date(task.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const endDate = format(addDays(new Date(startDate), 7), 'yyyy-MM-dd');
        
        return {
          id: task.id,
          name: task.name,
          category: category?.name || 'Otros',
          start_date: startDate,
          end_date: endDate,
          duration: 7,
          status: 'Pendiente',
          progress: 25, // Default progress
          color: category?.color || categoryColors['Otros']
        };
      }) || [];
    },
    enabled: !!projectId
  });

  // Update task dates mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, startDate, endDate }: { 
      taskId: string; 
      startDate: string; 
      endDate: string; 
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          start_date: startDate,
          end_date: endDate
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks-gantt', projectId] });
    }
  });

  // Generate week view dates
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Calculate Gantt bar positions
  const calculateGanttBars = (): GanttBar[] => {
    return tasks.map(task => {
      const startDate = parseISO(task.start_date);
      const endDate = parseISO(task.end_date);
      
      if (!isValid(startDate) || !isValid(endDate)) {
        return {
          task,
          left: 0,
          width: 0,
          isDragging: dragState.taskId === task.id
        };
      }

      const daysSinceWeekStart = differenceInDays(startDate, weekStart);
      const taskDuration = differenceInDays(endDate, startDate) + 1;
      
      // Each day = 14.28% of the week (100% / 7 days)
      const dayWidth = 100 / 7;
      const left = Math.max(0, daysSinceWeekStart * dayWidth);
      const width = Math.min(taskDuration * dayWidth, 100 - left);

      return {
        task,
        left,
        width,
        isDragging: dragState.taskId === task.id
      };
    });
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent, taskId: string, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const ganttBar = calculateGanttBars().find(bar => bar.task.id === taskId);
    
    if (ganttBar) {
      setDragState({
        taskId,
        startX: e.clientX,
        originalLeft: ganttBar.left,
        originalWidth: ganttBar.width,
        type
      });
    }
  };

  // Handle drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.taskId || !dragState.type) return;

      const deltaX = e.clientX - dragState.startX;
      const dayWidth = 100 / 7;
      const daysDelta = Math.round(deltaX / (window.innerWidth * 0.6 * dayWidth / 100));

      const task = tasks.find(t => t.id === dragState.taskId);
      if (!task) return;

      const currentStartDate = parseISO(task.start_date);
      const currentEndDate = parseISO(task.end_date);

      if (dragState.type === 'move') {
        const newStartDate = addDays(currentStartDate, daysDelta);
        const duration = differenceInDays(currentEndDate, currentStartDate);
        const newEndDate = addDays(newStartDate, duration);

        if (isValid(newStartDate) && isValid(newEndDate)) {
          updateTaskMutation.mutate({
            taskId: dragState.taskId,
            startDate: format(newStartDate, 'yyyy-MM-dd'),
            endDate: format(newEndDate, 'yyyy-MM-dd')
          });
        }
      } else if (dragState.type === 'resize-end') {
        const newEndDate = addDays(currentEndDate, daysDelta);
        if (isValid(newEndDate) && newEndDate >= currentStartDate) {
          updateTaskMutation.mutate({
            taskId: dragState.taskId,
            startDate: task.start_date,
            endDate: format(newEndDate, 'yyyy-MM-dd')
          });
        }
      }
    };

    const handleMouseUp = () => {
      setDragState({
        taskId: null,
        startX: 0,
        originalLeft: 0,
        originalWidth: 0,
        type: null
      });
    };

    if (dragState.taskId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, tasks, updateTaskMutation]);

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const ganttBars = calculateGanttBars();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Diagrama de Gantt</h1>
            <p className="text-muted-foreground">Planificación temporal de tareas del proyecto</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {format(weekStart, 'dd MMM', { locale: es })} - {format(weekEnd, 'dd MMM yyyy', { locale: es })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Hoy
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cronograma de Tareas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timeline Header */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <h3 className="font-medium text-sm text-muted-foreground">Tarea</h3>
              </div>
              <div className="col-span-8">
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weekDays.map((day, index) => (
                    <div key={index} className="text-xs font-medium text-muted-foreground py-2">
                      <div>{format(day, 'EEE', { locale: es })}</div>
                      <div className="text-xs opacity-70">{format(day, 'dd')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks by Category */}
            {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 py-2 border-b border-border/50">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] || categoryColors['Otros'] }}
                  ></div>
                  <span className="font-medium text-sm">{category}</span>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTasks.length} tareas
                  </Badge>
                </div>

                {categoryTasks.map((task) => {
                  const ganttBar = ganttBars.find(bar => bar.task.id === task.id);
                  if (!ganttBar) return null;

                  return (
                    <div key={task.id} className="grid grid-cols-12 gap-4 py-2 hover:bg-muted/30 rounded">
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="flex-1">
                          {editingTask === task.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                defaultValue={task.name}
                                className="h-8 text-sm"
                                onBlur={() => setEditingTask(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingTask(null);
                                  }
                                }}
                              />
                              <Button size="sm" variant="ghost" onClick={() => setEditingTask(null)}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{task.name}</span>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => setEditingTask(task.id)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(task.start_date), 'dd/MM')} - {format(parseISO(task.end_date), 'dd/MM')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-8 relative h-8 flex items-center">
                        <div className="w-full h-2 bg-muted rounded relative">
                          {ganttBar.width > 0 && (
                            <div
                              className="absolute h-full rounded cursor-move hover:opacity-80 transition-opacity"
                              style={{
                                left: `${ganttBar.left}%`,
                                width: `${ganttBar.width}%`,
                                backgroundColor: task.color
                              }}
                              onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
                            >
                              {/* Resize handles */}
                              <div
                                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize hover:bg-black/20"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleMouseDown(e, task.id, 'resize-start');
                                }}
                              />
                              <div
                                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize hover:bg-black/20"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleMouseDown(e, task.id, 'resize-end');
                                }}
                              />
                              
                              {/* Task label */}
                              {ganttBar.width > 15 && (
                                <div className="absolute inset-0 flex items-center px-1">
                                  <span className="text-xs text-white font-medium truncate">
                                    {task.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay tareas programadas para este proyecto</p>
                <p className="text-sm">Las tareas se mostrarán aquí una vez que sean creadas</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}