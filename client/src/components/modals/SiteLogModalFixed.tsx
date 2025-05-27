import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Cloud, FileText, Users, CheckSquare, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const siteLogSchema = z.object({
  log_date: z.string(),
  description: z.string().optional(),
  weather: z.string().optional(),
});

type SiteLogForm = z.infer<typeof siteLogSchema>;

interface SiteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
}

export default function SiteLogModalFixed({ isOpen, onClose, projectId }: SiteLogModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const form = useForm<SiteLogForm>({
    resolver: zodResolver(siteLogSchema),
    defaultValues: {
      log_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      weather: '',
    },
  });

  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (data: SiteLogForm) => {
      if (!projectId) {
        throw new Error('No project selected');
      }

      // Get internal user data
      const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user?.email)
        .single();
      
      if (!internalUser) {
        throw new Error('No se pudo encontrar el usuario interno');
      }
      
      // Create the site log entry directly in Supabase
      const { data: createdSiteLog, error } = await supabase
        .from('site_logs')
        .insert({
          project_id: projectId,
          log_date: data.log_date,
          weather: data.weather || '',
          description: data.description || '',
          author_id: internalUser.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createdSiteLog;
    },
    onSuccess: () => {
      toast({
        title: "Bitácora guardada",
        description: "Nueva entrada de bitácora creada correctamente.",
      });
      
      // Reset form and close modal
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/timeline'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error saving site log:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la bitácora.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SiteLogForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Bitácora de Obra
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic fields - always visible */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="log_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weather"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Clima
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Soleado, Nublado, Lluvia..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentarios</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe las actividades del día..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* More Details Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="flex items-center gap-2"
              >
                {showMoreDetails ? 'Menos Detalles' : 'Más Detalles'}
                {showMoreDetails ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
              </Button>
            </div>

            {/* Additional fields - shown when expanded */}
            {showMoreDetails && (
              <div className="space-y-6">
                {/* Tasks section placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      Tareas Realizadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Las tareas se podrán agregar una vez que se creen las tablas relacionadas.
                    </p>
                  </CardContent>
                </Card>

                {/* Attendees section placeholder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Asistentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Los asistentes se podrán agregar una vez que se creen las tablas relacionadas.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar Bitácora'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}