import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import { CalendarIcon, FileText, Cloud, Sun, CloudRain, CloudSnow, Loader2, Plus, X, CheckSquare } from 'lucide-react';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';

import { cn } from '@/lib/utils';
import type { SiteLog } from '@shared/schema';

const siteLogSchema = z.object({
  date: z.date({
    required_error: "La fecha es requerida",
  }),
  weather: z.string().optional(),
  comments: z.string().optional(),
  tasks: z.record(z.object({
    selected: z.boolean().default(false),
    progress_percentage: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  })).optional(),
});

type SiteLogForm = z.infer<typeof siteLogSchema>;

interface SiteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteLog?: SiteLog | null;
  projectId: string;
}

const weatherOptions = [
  { value: 'Soleado', label: 'Soleado', icon: Sun },
  { value: 'Nublado', label: 'Nublado', icon: Cloud },
  { value: 'Lluvia', label: 'Lluvia', icon: CloudRain },
  { value: 'Tormenta', label: 'Tormenta', icon: CloudSnow },
];

export default function SiteLogModal({ isOpen, onClose, siteLog, projectId }: SiteLogModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { userId } = useUserContextStore();
  const isEditing = !!siteLog;
  
  // Define task type
  interface ProjectTask {
    id: string;
    name: string;
    description?: string;
  }

  // Fetch project tasks from budget_tasks
  const { data: projectTasks = [], isLoading: tasksLoading } = useQuery<ProjectTask[]>({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // First get the budget for this project
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('id')
        .eq('project_id', projectId);
      
      if (budgetError) throw budgetError;
      if (!budgets || budgets.length === 0) return [];
      
      const budgetId = budgets[0].id;
      
      // Then get tasks for this budget
      const { data, error } = await supabase
        .from('budget_tasks')
        .select(`
          task_id,
          tasks (
            id,
            name,
            description
          )
        `)
        .eq('budget_id', budgetId);
      
      if (error) throw error;
      return data?.map((item: any) => ({
        id: item.tasks?.id,
        name: item.tasks?.name,
        description: item.tasks?.description
      })).filter((task: any) => task.id) || [];
    },
    enabled: !!projectId,
  });

  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      date: siteLog ? new Date(siteLog.log_date) : new Date(),
      comments: siteLog?.comments || '',
      weather: siteLog?.weather || '',
      tasks: {},
    },
  });

  // Reset form when modal opens/closes or siteLog changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        date: siteLog ? new Date(siteLog.log_date) : new Date(),
        comments: siteLog?.comments || '',
        weather: siteLog?.weather || '',
        tasks: {},
      });
    }
  }, [isOpen, siteLog, form]);

  // Create/Update mutation
  const createSiteLogMutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      const siteLogData = {
        project_id: projectId,
        log_date: data.date.toISOString().split('T')[0],
        weather: data.weather || null,
        comments: data.comments || null,
        author_id: userId, // Use internal user UUID
      };

      let siteLogId: string;

      if (siteLog?.id) {
        // Update existing
        const { data: result, error } = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', siteLog.id)
          .select()
          .single();

        if (error) throw error;
        siteLogId = result.id;
      } else {
        // Create new
        const { data: result, error } = await supabase
          .from('site_logs')
          .insert([siteLogData])
          .select()
          .single();

        if (error) throw error;
        siteLogId = result.id;
      }

      // Save tasks
      if (data.tasks) {
        // First delete existing tasks for this site log
        await supabase
          .from('site_log_tasks')
          .delete()
          .eq('site_log_id', siteLogId);

        // Insert selected tasks
        const tasksToInsert = Object.entries(data.tasks)
          .filter(([_, taskData]) => taskData.selected)
          .map(([taskId, taskData]) => ({
            site_log_id: siteLogId,
            task_id: taskId,
            progress_percentage: taskData.progress_percentage || 0,
            notes: taskData.notes || null,
          }));

        if (tasksToInsert.length > 0) {
          const { error: tasksError } = await supabase
            .from('site_log_tasks')
            .insert(tasksToInsert);

          if (tasksError) throw tasksError;
        }
      }

      return { id: siteLogId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      toast({
        title: isEditing ? 'Registro actualizado' : 'Registro creado',
        description: `El registro de obra ha sido ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro de obra.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SiteLogForm) => {
    createSiteLogMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const content = (
    <Form {...form}>
      <form id="sitelog-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Accordion type="single" collapsible defaultValue="basic-info">
          {/* Información Básica */}
          <AccordionItem value="basic-info">
            <AccordionTrigger 
              title="Información Básica"
              subtitle="Fecha, clima y comentarios del día"
              icon={FileText}
            />
            <AccordionContent>
              {/* Fecha */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Fecha <span className="text-primary">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm h-10",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-surface-primary border-input z-[9999]" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Clima */}
              <FormField
                control={form.control}
                name="weather"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Clima</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm h-10 text-white dark:text-white">
                          <SelectValue placeholder="Seleccionar clima" className="text-white dark:text-white" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-surface-primary border-input z-[9999]">
                        {weatherOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value} className="[&>span:first-child]:hidden">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comentarios */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Comentarios</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe las actividades del día, observaciones, incidentes, etc."
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm resize-none text-white dark:text-white"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Tareas Diarias */}
          <AccordionItem value="daily-tasks">
            <AccordionTrigger 
              title="Tareas Realizadas"
              subtitle="Actividades completadas durante el día"
              icon={CheckSquare}
            />
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecciona las tareas que se realizaron hoy y agrega detalles si es necesario.
                </p>
                
                {tasksLoading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">Cargando tareas del proyecto...</div>
                  </div>
                ) : projectTasks.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">No hay tareas asignadas a este proyecto.</div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {projectTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-secondary/50">
                        <FormField
                          control={form.control}
                          name={`tasks.${task.id}.selected`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Checkbox
                                  id={`task-${task.id}`}
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-0.5"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex-1 space-y-2">
                          <label 
                            htmlFor={`task-${task.id}`}
                            className="text-sm font-medium text-foreground cursor-pointer"
                          >
                            {task.name}
                          </label>
                          {task.description && (
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">% de avance</label>
                              <FormField
                                control={form.control}
                                name={`tasks.${task.id}.progress_percentage`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="ej: 75"
                                        className="h-8 text-xs bg-surface-primary border-input text-white dark:text-white"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Notas</label>
                              <FormField
                                control={form.control}
                                name={`tasks.${task.id}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="Observaciones..."
                                        className="h-8 text-xs bg-surface-primary border-input text-white dark:text-white"
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </Form>
  );

  const footer = (
    <div className="border-t border-border/20 bg-surface-views p-4">
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={createSiteLogMutation.isPending}
          className="flex-1 bg-surface-secondary border-input text-muted-foreground hover:bg-surface-primary rounded-lg h-10"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="sitelog-form"
          disabled={createSiteLogMutation.isPending}
          className="flex-[3] bg-primary border-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10"
        >
          {createSiteLogMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar Registro' : 'Crear Registro'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Registro de Bitácora' : 'Nueva Bitácora'}
      subtitle="Registro diario de actividades y progreso de obra"
      icon={FileText}
      footer={footer}
    >
      {content}
    </ModernModal>
  );
}