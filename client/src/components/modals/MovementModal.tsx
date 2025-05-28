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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { contactsService } from '@/lib/contactsService';
import { cn } from '@/lib/utils';

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
  const [contactOpen, setContactOpen] = useState(false);
  const isEditing = !!movement;

  // Fetch contacts for selection
  const { data: contactsList = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
    enabled: isOpen,
  });

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
        related_contact_id: movement.related_contact_id || '',
        related_task_id: movement.related_task_id || '',
      });
    } else {
      form.reset({
        type: 'egreso',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: 0,
        currency: 'ARS',
        related_contact_id: '',
        related_task_id: '',
      });
    }
  }, [movement, isEditing, form, isOpen]);

  // Helper function to display contact names
  const getContactDisplayName = (contact: any) => {
    return `${contact.first_name} ${contact.last_name || ''}`.trim() || contact.company_name || 'Sin nombre';
  };

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      const { data: result, error } = await supabase
        .from('site_movements')
        .insert([{
          project_id: projectId,
          type: data.type,
          date: data.date,
          category: data.category,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          related_contact_id: data.related_contact_id || null,
          related_task_id: data.related_task_id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements', projectId] });
      toast({
        title: "Movimiento creado",
        description: "El movimiento se ha guardado correctamente.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating movement:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el movimiento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Update movement mutation
  const updateMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      const { data: result, error } = await supabase
        .from('site_movements')
        .update({
          type: data.type,
          date: data.date,
          category: data.category,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          related_contact_id: data.related_contact_id || null,
          related_task_id: data.related_task_id || null,
        })
        .eq('id', movement.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements', projectId] });
      toast({
        title: "Movimiento actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating movement:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el movimiento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MovementForm) => {
    if (isEditing) {
      updateMovementMutation.mutate(data);
    } else {
      createMovementMutation.mutate(data);
    }
  };

  const handleClose = () => {
    form.reset();
    setContactOpen(false);
    onClose();
  };

  const isLoading = createMovementMutation.isPending || updateMovementMutation.isPending;

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
              {/* Tipo */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo <span className="text-primary">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Fecha */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha <span className="text-primary">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Categoría */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría <span className="text-primary">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="ej. Materiales, Mano de obra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Moneda */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción <span className="text-primary">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe el detalle del movimiento..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monto */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto <span className="text-primary">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
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
              {/* Contacto */}
              <FormField
                control={form.control}
                name="related_contact_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Contacto (opcional)</FormLabel>
                    <Popover open={contactOpen} onOpenChange={setContactOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? contactsList.find((contact) => contact.id === field.value)
                                ? getContactDisplayName(contactsList.find((contact) => contact.id === field.value))
                                : "Sin contacto"
                              : "Sin contacto"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar contacto..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron contactos.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value=""
                                onSelect={() => {
                                  field.onChange("");
                                  setContactOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Sin contacto
                              </CommandItem>
                              {contactsList.map((contact) => (
                                <CommandItem
                                  value={getContactDisplayName(contact)}
                                  key={contact.id}
                                  onSelect={() => {
                                    field.onChange(contact.id);
                                    setContactOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      contact.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {getContactDisplayName(contact)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tarea */}
              <FormField
                control={form.control}
                name="related_task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarea (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin tarea" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin tarea</SelectItem>
                        {/* Aquí irían las tareas del proyecto */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading && (
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