import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHierarchicalConcepts, setHierarchicalFormValues } from '@/hooks/useHierarchicalConcepts';
import { contactsService } from '@/lib/contactsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  DollarSign, 
  FileText, 
  Calendar,
  Search,
  Wallet,
  Target,
  User,
  Loader2,
  X,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import ModernModal from '@/components/ui/ModernModal';

const movementSchema = z.object({
  type_id: z.string().min(1, 'El tipo es requerido'),
  concept_id: z.string().min(1, 'La categoría es requerida'),
  created_at: z.string().min(1, 'La fecha es requerida'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: z.string().min(1, 'La moneda es requerida'),
  wallet_id: z.string().min(1, 'La billetera es requerida'),
  description: z.string().optional(),
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
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false);
  const isEditing = !!movement;

  // Use hierarchical concepts hook for optimized concept management
  const { data: conceptStructures, isLoading: conceptsLoading } = useHierarchicalConcepts('movement_concepts');

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type_id: '',
      concept_id: '',
      created_at: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'ARS',
      wallet_id: '',
      description: '',
      related_contact_id: '',
      related_task_id: ''
    },
  });

  // Reset form when modal opens/closes or movement changes
  useEffect(() => {
    if (isOpen && conceptStructures) {
      if (movement && isEditing) {
        const conceptId = movement.concept_id || '';
        
        if (conceptId && conceptStructures) {
          // Use hierarchical path to set both type and concept
          const conceptPath = conceptStructures.getConceptPath(conceptId);
          const typeId = conceptPath.length >= 2 ? conceptPath[0] : '';
          
          console.log('Editing movement with hierarchical path:', { 
            conceptId, 
            conceptPath, 
            typeId, 
            movement 
          });
          
          // Set the selected type FIRST for dependent selects
          setSelectedTypeId(typeId);
          
          // Then use hierarchical form setter with a small delay to ensure UI is ready
          setTimeout(() => {
            setHierarchicalFormValues(form, conceptPath, ['type_id', 'concept_id']);
          }, 10);
          
          // Set other form values
          form.setValue('created_at', movement.created_at_local ? new Date(movement.created_at_local).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
          form.setValue('description', movement.description || '');
          form.setValue('amount', movement.amount || 0);
          form.setValue('currency', movement.currency || 'ARS');
          form.setValue('wallet_id', movement.wallet_id || '');
          form.setValue('related_contact_id', movement.related_contact_id || '');
          form.setValue('related_task_id', movement.related_task_id || '');
        }
      } else {
        setSelectedTypeId('');
        form.reset({
          type_id: '',
          concept_id: '',
          created_at: new Date().toISOString().split('T')[0],
          description: '',
          amount: 0,
          currency: 'ARS',
          wallet_id: '',
          related_contact_id: '',
          related_task_id: '',
        });
      }
    }
  }, [isOpen, movement, isEditing, form, conceptStructures]);

  // Get movement types (root concepts) and categories using hierarchical structure
  const movementTypes = conceptStructures?.getRootConcepts() || [];
  const movementCategories = conceptStructures?.getChildConcepts(selectedTypeId) || [];

  // Fetch contacts
  const { data: contactsList = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
      return data || [];
    },
    enabled: isOpen && !!organizationId,
  });

  // Fetch wallets
  const { data: walletsList = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (isEditing && movement?.id) {
        const { data: result, error } = await supabase
          .from('site_movements')
          .update({
            concept_id: data.concept_id,
            created_at_local: data.created_at.includes('T') ? data.created_at : data.created_at + 'T00:00:00.000Z',
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            wallet_id: data.wallet_id,
            related_contact_id: data.related_contact_id || null,
            related_task_id: data.related_task_id || null,
          })
          .eq('id', movement.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('site_movements')
          .insert([{
            project_id: projectId,
            organization_id: organizationId,
            concept_id: data.concept_id,
            created_at_local: data.created_at.includes('T') ? data.created_at : data.created_at + 'T00:00:00.000Z',
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            wallet_id: data.wallet_id,
            related_contact_id: data.related_contact_id || null,
            related_task_id: data.related_task_id || null,
          }])
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-events'] });
      
      toast({
        title: isEditing ? "Movimiento actualizado" : "Movimiento creado",
        description: isEditing ? "El movimiento se ha actualizado correctamente." : "El movimiento se ha guardado correctamente.",
      });
      
      handleClose();
    },
    onError: (error) => {
      console.error('Error with movement:', error);
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar el movimiento." : "No se pudo crear el movimiento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MovementForm) => {
    if (!data.concept_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar una categoría válida.",
        variant: "destructive",
      });
      return;
    }
    
    createMovementMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setSelectedTypeId('');
    onClose();
  };

  const getContactDisplayName = (contact: any) => {
    return `${contact.first_name} ${contact.last_name || ''}`.trim() || contact.company_name || 'Sin nombre';
  };

  const content = (
    <Form {...form}>
      <form id="movement-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Accordion type="single" collapsible defaultValue="basic-info">
          {/* Información Básica */}
          <AccordionItem value="basic-info">
            <AccordionTrigger 
              title="Información Básica"
              subtitle="Datos básicos del movimiento"
              icon={FileText}
            />
            <AccordionContent>
              {/* Fecha */}
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Fecha <span className="text-primary">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tipo */}
                <FormField
                  control={form.control}
                  name="type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Tipo <span className="text-primary">*</span></FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedTypeId(value);
                        form.setValue('concept_id', '');
                      }} value={selectedTypeId} disabled={false}>
                        <FormControl>
                          <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm ">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-primary border-input z-[9999]">
                          {movementTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id} className="[&>span:first-child]:hidden">
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoría */}
                <FormField
                  control={form.control}
                  name="concept_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Categoría <span className="text-primary">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''} 
                        disabled={!selectedTypeId || conceptsLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm ">
                            <SelectValue placeholder={
                              conceptsLoading ? "Cargando categorías..." :
                              !selectedTypeId ? "Primero selecciona un tipo" :
                              movementCategories.length === 0 ? "No hay categorías disponibles" :
                              "Seleccionar categoría"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-primary border-input z-[9999]">
                          {movementCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id} className="[&>span:first-child]:hidden">
                              {category.name}
                            </SelectItem>
                          ))}
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
                    <FormLabel className="text-xs font-medium text-foreground">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el detalle del movimiento... (opcional)"
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Detalle de Movimiento */}
          <AccordionItem value="movement-details">
            <AccordionTrigger 
              title="Detalle de Movimiento"
              subtitle="Moneda, monto y billetera"
              icon={DollarSign}
            />
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Moneda */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Moneda <span className="text-primary">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm ">
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-primary border-input z-[9999]">
                          <SelectItem value="ARS" className="[&>span:first-child]:hidden">ARS - Peso Argentino</SelectItem>
                          <SelectItem value="USD" className="[&>span:first-child]:hidden">USD - Dólar Estadounidense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Billetera */}
                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Billetera <span className="text-primary">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm ">
                            <SelectValue placeholder="Seleccionar billetera" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-primary border-input z-[9999]">
                          {walletsList.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id} className="[&>span:first-child]:hidden">
                              {wallet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cantidad */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Cantidad <span className="text-primary">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={field.value ? new Intl.NumberFormat('es-AR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        }).format(field.value) : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Remove all formatting and convert comma to dot for parsing
                          const cleanValue = value.replace(/\./g, '').replace(',', '.');
                          const numericValue = parseFloat(cleanValue);
                          field.onChange(isNaN(numericValue) ? 0 : numericValue);
                        }}
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Relaciones */}
          <AccordionItem value="relations">
            <AccordionTrigger 
              title="Relaciones"
              subtitle="Contactos y tareas relacionadas"
              icon={User}
            />
            <AccordionContent>
              {/* Contacto Relacionado */}
              <FormField
                control={form.control}
                name="related_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Contacto Relacionado</FormLabel>
                    <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm  h-10 font-normal"
                          >
                            <span className="truncate">
                              {field.value 
                                ? contactsList.find((contact) => contact.id === field.value)
                                  ? getContactDisplayName(contactsList.find((contact) => contact.id === field.value)!)
                                  : "Contacto no encontrado"
                                : "Buscar contacto (opcional)..."}
                            </span>
                            <div className="flex items-center gap-1 ml-2">
                              {field.value && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    field.onChange('');
                                  }}
                                  className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <Search className="h-4 w-4 shrink-0 opacity-50" />
                            </div>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[10000] bg-surface-primary border-input" align="start">
                        <Command className="bg-surface-primary">
                          <CommandInput 
                            placeholder="Escribir para buscar..."
                            value={contactSearchTerm}
                            onValueChange={setContactSearchTerm}
                            className="bg-surface-primary border-none"
                          />
                          <CommandList className="bg-surface-primary">
                            <CommandEmpty className="text-muted-foreground text-sm p-2">
                              {contactSearchTerm.length < 3 
                                ? "Escribir al menos 3 caracteres"
                                : "No se encontraron contactos"}
                            </CommandEmpty>
                            {contactSearchTerm.length >= 3 && (
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    field.onChange('');
                                    setIsContactPopoverOpen(false);
                                    setContactSearchTerm('');
                                  }}
                                >
                                  Sin contacto
                                </CommandItem>
                                {contactsList
                                  .filter((contact) =>
                                    getContactDisplayName(contact)
                                      .toLowerCase()
                                      .includes(contactSearchTerm.toLowerCase())
                                  )
                                  .map((contact) => (
                                    <CommandItem
                                      key={contact.id}
                                      onSelect={() => {
                                        field.onChange(contact.id);
                                        setIsContactPopoverOpen(false);
                                        setContactSearchTerm('');
                                      }}
                                    >
                                      {getContactDisplayName(contact)}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
          disabled={createMovementMutation.isPending}
          className="flex-1 bg-surface-secondary border-input text-muted-foreground hover:bg-surface-primary rounded-lg h-10"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="movement-form"
          disabled={createMovementMutation.isPending}
          className="flex-[3] bg-primary border-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10"
        >
          {createMovementMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar Movimiento' : 'Crear Movimiento'}
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
      title={isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
      subtitle="Gestiona ingresos, egresos y ajustes financieros del proyecto"
      icon={DollarSign}
      footer={footer}
    >
      {content}
    </ModernModal>
  );
}