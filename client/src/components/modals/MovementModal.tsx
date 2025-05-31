import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
  Loader2 
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
    if (isOpen) {
      if (movement && isEditing) {
        const typeId = movement.movement_concepts?.parent_id || '';
        const conceptId = movement.concept_id || '';
        
        console.log('Editing movement:', { typeId, conceptId, movement });
        
        // Set the selected type and form values
        setSelectedTypeId(typeId);
        
        form.reset({
          type_id: typeId,
          concept_id: conceptId,
          created_at: movement.created_at_local ? new Date(movement.created_at_local).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          description: movement.description || '',
          amount: movement.amount || 0,
          currency: movement.currency || 'ARS',
          wallet_id: movement.wallet_id || '',
          related_contact_id: movement.related_contact_id || '',
          related_task_id: movement.related_task_id || '',
        });
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
  }, [isOpen, movement, isEditing, form]);

  // Fetch movement types
  const { data: movementTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['movement-types'],
    queryFn: async () => {
      console.log('Fetching movement types...');
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .is('parent_id', null)
        .order('name');
      
      if (error) {
        console.error('Error fetching movement types:', error);
        throw error;
      }
      console.log('Movement types fetched:', data);
      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch categories for selected type
  const { data: movementCategories = [] } = useQuery({
    queryKey: ['movement-categories', selectedTypeId],
    queryFn: async () => {
      if (!selectedTypeId) return [];
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .eq('parent_id', selectedTypeId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!selectedTypeId,
  });

  // Fetch contacts
  const { data: contactsList = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
    enabled: isOpen,
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
      <form id="movement-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="single" collapsible defaultValue="basic-info" className="w-full space-y-1">
          {/* Información Básica */}
          <AccordionItem value="basic-info" className="border-[#919191]/20">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Información Básica
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-1">
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
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm hover:bg-[#c8c8c8]">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[9999]">
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTypeId}>
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm hover:bg-[#c8c8c8]">
                            <SelectValue placeholder={selectedTypeId ? "Seleccionar categoría" : "Primero selecciona un tipo"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[9999]">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Fecha */}
                <FormField
                  control={form.control}
                  name="created_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Fecha *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                        />
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
                      <FormLabel className="text-xs font-medium text-foreground">Moneda <span className="text-primary">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm hover:bg-[#c8c8c8]">
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[9999]">
                          <SelectItem value="ARS" className="[&>span:first-child]:hidden">ARS - Peso Argentino</SelectItem>
                          <SelectItem value="USD" className="[&>span:first-child]:hidden">USD - Dólar Estadounidense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Billetera */}
                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Billetera <span className="text-primary">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm hover:bg-[#c8c8c8]">
                            <SelectValue placeholder="Seleccionar billetera" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[9999]">
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

                {/* Cantidad */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Cantidad *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                        />
                      </FormControl>
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
                        className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm resize-none"
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

          {/* Relaciones */}
          <AccordionItem value="relations" className="border-[#919191]/20">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Relaciones
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-1">
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
                            className="w-full justify-between bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm hover:bg-[#c8c8c8] h-10"
                          >
                            {field.value 
                              ? contactsList.find((contact) => contact.id === field.value)
                                ? getContactDisplayName(contactsList.find((contact) => contact.id === field.value)!)
                                : "Contacto no encontrado"
                              : "Buscar contacto (opcional)..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Escribir al menos 3 caracteres..."
                            value={contactSearchTerm}
                            onValueChange={setContactSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {contactSearchTerm.length < 3 
                                ? "Escribir al menos 3 caracteres para buscar"
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
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={createMovementMutation.isPending}
        className="w-1/4 bg-[#d2d2d2] border-[#919191]/20 text-foreground hover:bg-[#c2c2c2] rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="movement-form"
        disabled={createMovementMutation.isPending}
        className="w-3/4 bg-[#8fc700] hover:bg-[#7fb600] text-white rounded-lg"
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