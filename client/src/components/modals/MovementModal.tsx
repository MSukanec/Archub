import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';

const movementSchema = z.object({
  type: z.enum(['ingreso', 'egreso', 'ajuste'], {
    required_error: 'Debes seleccionar un tipo de movimiento',
  }),
  date: z.string().min(1, 'La fecha es requerida'),
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency: z.string().default('ARS'),
  related_contact_id: z.string().optional(),
  related_task_id: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement?: any;
  projectId: string;
}

export default function MovementModal({ isOpen, onClose, movement, projectId }: MovementModalProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const isEditing = !!movement;

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'egreso',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: 0,
      currency: 'ARS',
      related_contact_id: '',
      related_task_id: '',
    },
  });

  // Reset form when movement changes
  useEffect(() => {
    if (movement && isEditing) {
      form.reset({
        type: movement.type,
        date: movement.date ? movement.date.split('T')[0] : new Date().toISOString().split('T')[0],
        category: movement.category || '',
        description: movement.description || '',
        amount: movement.amount || 0,
        currency: movement.currency || 'ARS',
        related_contact_id: movement.related_contact_id || 'none',
        related_task_id: movement.related_task_id || 'none',
      });
    } else {
      form.reset({
        type: 'egreso',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: 0,
        currency: 'ARS',
        related_contact_id: 'none',
        related_task_id: 'none',
      });
    }
  }, [movement, isEditing, form, isOpen]);

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, name, company_name')
          .eq('organization_id', organizationId)
          .order('name');
        
        if (error) {
          console.warn('Error fetching contacts:', error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.warn('Failed to fetch contacts:', error);
        return [];
      }
    },
    enabled: !!organizationId && isOpen,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.warn('Error fetching tasks:', error);
          return [];
        }
        return data || [];
      } catch (error) {
        console.warn('Failed to fetch tasks:', error);
        return [];
      }
    },
    enabled: !!organizationId && isOpen,
  });

  // Upload file to Supabase Storage
  const uploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `movements/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  const saveMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      let fileUrl = movement?.file_url || null;
      
      // Upload file if selected
      if (uploadedFile) {
        fileUrl = await uploadFile(uploadedFile);
      }

      const movementData = {
        project_id: projectId,
        type: data.type,
        date: data.date,
        category: data.category,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        related_contact_id: data.related_contact_id && data.related_contact_id !== 'none' ? data.related_contact_id : null,
        related_task_id: data.related_task_id && data.related_task_id !== 'none' ? data.related_task_id : null,
        file_url: fileUrl,
      };

      if (isEditing && movement?.id) {
        // Update existing movement
        const { data: updatedMovement, error } = await supabase
          .from('site_movements')
          .update(movementData)
          .eq('id', movement.id)
          .select()
          .single();

        if (error) throw error;
        return updatedMovement;
      } else {
        // Create new movement
        const { data: newMovement, error } = await supabase
          .from('site_movements')
          .insert(movementData)
          .select()
          .single();

        if (error) throw error;
        return newMovement;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movements', projectId] });
      toast({
        title: isEditing ? "Movimiento actualizado" : "Movimiento creado",
        description: isEditing 
          ? "El movimiento se ha actualizado correctamente." 
          : "El movimiento se ha registrado correctamente.",
      });
      onClose();
      setUploadedFile(null);
    },
    onError: (error) => {
      console.error('Error al guardar movimiento:', error);
      toast({
        title: "Error",
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} el movimiento. Intenta nuevamente.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MovementForm) => {
    saveMovementMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setUploadedFile(null);
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos del movimiento'
              : 'Registra un nuevo ingreso, egreso o ajuste en el proyecto'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso</SelectItem>
                        <SelectItem value="egreso">Egreso</SelectItem>
                        <SelectItem value="ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ej: materiales, mano de obra..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe el movimiento..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="related_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar contacto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin contacto</SelectItem>
                        {contacts.map((contact: any) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.company_name || contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="related_task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarea (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tarea" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin tarea</SelectItem>
                        {tasks.map((task: any) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Archivo adjunto (opcional)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {uploadingFile && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
              {uploadedFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {uploadedFile.name}
                </p>
              )}
              {movement?.file_url && !uploadedFile && (
                <p className="text-sm text-muted-foreground">
                  📎 Archivo actual adjunto
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleClose}
                disabled={saveMovementMutation.isPending || uploadingFile}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={saveMovementMutation.isPending || uploadingFile}
              >
                {(saveMovementMutation.isPending || uploadingFile) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Actualizar' : 'Crear'} Movimiento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}