import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  tasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().optional(),
    notes: z.string().optional(),
    completed: z.boolean().default(false),
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
  
  // Sample tasks for the project (in a real app, these would come from the database)
  const availableTasks = [
    { id: '1', name: 'Excavación de cimientos' },
    { id: '2', name: 'Hormigón para base' },
    { id: '3', name: 'Colocación de hierros' },
    { id: '4', name: 'Levantamiento de paredes' },
    { id: '5', name: 'Instalación eléctrica' },
    { id: '6', name: 'Instalación de plomería' },
    { id: '7', name: 'Colocación de techo' },
    { id: '8', name: 'Revoque exterior' },
    { id: '9', name: 'Pintura' },
    { id: '10', name: 'Colocación de pisos' },
  ];

  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      date: siteLog ? new Date(siteLog.log_date) : new Date(),
      comments: siteLog?.comments || '',
      weather: siteLog?.weather || '',
    },
  });

  // Reset form when modal opens/closes or siteLog changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        date: siteLog ? new Date(siteLog.log_date) : new Date(),
        comments: siteLog?.comments || '',
        weather: siteLog?.weather || '',
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

      if (siteLog?.id) {
        // Update existing
        const { data: result, error } = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', siteLog.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        // Create new
        const { data: result, error } = await supabase
          .from('site_logs')
          .insert([siteLogData])
          .select()
          .single();

        if (error) throw error;
        return result;
      }
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
                        <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm h-10">
                          <SelectValue placeholder="Seleccionar clima" />
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
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm resize-none"
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
                
                <div className="grid gap-3">
                  {availableTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-secondary/50">
                      <Checkbox
                        id={`task-${task.id}`}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-2">
                        <label 
                          htmlFor={`task-${task.id}`}
                          className="text-sm font-medium text-foreground cursor-pointer"
                        >
                          {task.name}
                        </label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Cantidad/Avance</label>
                            <Input
                              type="number"
                              placeholder="ej: 15 m²"
                              className="h-8 text-xs bg-surface-primary border-input"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Notas</label>
                            <Input
                              placeholder="Observaciones..."
                              className="h-8 text-xs bg-surface-primary border-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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