import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';
import { CalendarIcon, FileText, Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  const mutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      const siteLogData = {
        project_id: projectId,
        log_date: data.date.toISOString().split('T')[0],
        weather: data.weather || null,
        comments: data.comments || null,
        author_id: user?.id,
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
        title: siteLog ? 'Registro actualizado' : 'Registro creado',
        description: `El registro de obra ha sido ${siteLog ? 'actualizado' : 'creado'} correctamente.`,
      });
      onClose();
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
    mutation.mutate(data);
  };

  const footer = (
    <div className="flex justify-end space-x-2">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" form="sitelog-form" disabled={mutation.isPending}>
        {mutation.isPending ? 'Guardando...' : (siteLog ? 'Actualizar registro' : 'Crear registro')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={siteLog ? 'Editar Registro de Bitácora' : 'Nueva Bitácora'}
      icon={FileText}
      footer={footer}
    >
      <Form {...form}>
        <form id="sitelog-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                    <PopoverContent className="w-auto p-0" align="start">
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

            <FormField
              control={form.control}
              name="weather"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clima</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar clima" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {weatherOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
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
          </div>

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comentarios</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe las actividades del día, observaciones, incidentes, etc."
                    className="resize-none min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ModernModal>
  );
}