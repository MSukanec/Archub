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
import { DollarSign, FileText, User, Upload, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { contactsService } from '@/lib/contactsService';
import { cn } from '@/lib/utils';

// Form schema
const movementSchema = z.object({
  type_id: z.string().min(1, 'Tipo es requerido'),
  concept_id: z.string().min(1, 'Categoría es requerida'),
  created_at: z.string().min(1, 'Fecha es requerida'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  currency: z.enum(['ARS', 'USD']),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
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
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        // Load existing movement data
        const typeId = movement.movement_concepts?.parent_id || '';
        const conceptId = movement.concept_id || '';
        
        // Set selected type first to trigger category loading
        setSelectedTypeId(typeId);
        
        // Reset form with proper values
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
        // Reset for new movement
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

  const steps = [
    { title: 'Información Básica', icon: FileText },
    { title: 'Relaciones', icon: User },
    { title: 'Archivo Adjunto', icon: Upload }
  ];

  // Fetch movement types
  const { data: movementTypes = [] } = useQuery({
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
        return [];
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





  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (form.formState.isValid) {
          form.handleSubmit(onSubmit)();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, form]);

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (isEditing && movement?.id) {
        // Update existing movement
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
        // Create new movement
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
      // Invalidate all movement-related queries
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-events'] });
      
      // Clear potentially stale queries
      queryClient.removeQueries({ queryKey: ['movement-categories'] });
      
      toast({
        title: isEditing ? "Movimiento actualizado" : "Movimiento creado",
        description: isEditing ? "El movimiento se ha actualizado correctamente." : "El movimiento se ha guardado correctamente.",
      });
      
      // Always reset completely regardless of mode
      setTimeout(() => {
        form.reset({
          type_id: '',
          concept_id: '',
          created_at: new Date().toISOString().split('T')[0],
          amount: 0,
          currency: 'ARS',
          wallet_id: '',
          description: '',
          related_contact_id: '',
          related_task_id: ''
        });
        setSelectedTypeId('');
        setCurrentStep(0);
        setContactOpen(false);
        setSelectedFile(null);
        setContactSearch('');
      }, 100);
      
      onClose();
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
    // Validate that we have the required concept data
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
    // Force complete reset
    form.reset({
      type_id: '',
      concept_id: '',
      created_at: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'ARS',
      wallet_id: '',
      description: '',
      related_contact_id: '',
      related_task_id: ''
    });
    
    setCurrentStep(0);
    setContactOpen(false);
    setSelectedTypeId('');
    setSelectedFile(null);
    setContactSearch('');
    
    // Aggressively clear queries to prevent cache issues
    queryClient.removeQueries({ queryKey: ['movement-categories'] });
    queryClient.removeQueries({ queryKey: ['movement-types'] });
    
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getContactDisplayName = (contact: any) => {
    return `${contact.first_name} ${contact.last_name || ''}`.trim() || contact.company_name || 'Sin nombre';
  };

  const isLoading = createMovementMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-hidden bg-[#e0e0e0] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8fc700] rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[#333333]">
                {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
              </DialogTitle>
              <DialogDescription className="text-[#666666]">
                Gestiona ingresos, egresos y ajustes financieros del proyecto
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Navigation */}
        <div className="flex justify-between items-center py-4 border-b border-[#cccccc]">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setCurrentStep(index)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === currentStep ? 'bg-[#8fc700] text-white' : 
                  index < currentStep ? 'bg-[#d2d2d2] text-[#666666]' : 
                  'bg-[#f0f0f0] text-[#999999]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm ${
                  index === currentStep ? 'text-[#333333] font-medium' : 'text-[#666666]'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form className="flex-1 flex flex-col">
            {/* Step Content */}
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
              {/* Step 0: Basic Information */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tipo */}
                    <FormField
                      control={form.control}
                      name="type_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#333333]">Tipo <span className="text-[#8fc700]">*</span></FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedTypeId(value);
                            form.setValue('concept_id', '');
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {movementTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Fecha */}
                    <FormField
                      control={form.control}
                      name="created_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#333333]">Fecha <span className="text-[#8fc700]">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="bg-[#d2d2d2] border-[#cccccc]"
                            />
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
                      name="concept_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#333333]">Categoría <span className="text-[#8fc700]">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTypeId}>
                            <FormControl>
                              <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                                <SelectValue placeholder={selectedTypeId ? "Seleccionar categoría" : "Primero selecciona un tipo"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {movementCategories.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500">No hay categorías disponibles</div>
                              ) : (
                                movementCategories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
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
                          <FormLabel className="text-[#333333]">Moneda</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                              <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Billetera */}
                    <FormField
                      control={form.control}
                      name="wallet_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#333333]">Billetera <span className="text-[#8fc700]">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                                <SelectValue placeholder="Seleccionar billetera" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>

                              {walletsList.map((wallet) => (
                                <SelectItem key={wallet.id} value={wallet.id}>
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
                          <FormLabel className="text-[#333333]">Cantidad <span className="text-[#8fc700]">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="bg-[#d2d2d2] border-[#cccccc]"
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
                        <FormLabel className="text-[#333333]">Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe el detalle del movimiento... (opcional)"
                            {...field}
                            className="bg-[#d2d2d2] border-[#cccccc]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 1: Relations */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Contact Selection */}
                  <FormField
                    control={form.control}
                    name="related_contact_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333]">Contacto Relacionado</FormLabel>
                        <Popover open={contactOpen} onOpenChange={setContactOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between bg-[#d2d2d2] border-[#cccccc]",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? getContactDisplayName(contactsList.find((contact) => contact.id === field.value))
                                  : "Seleccionar contacto (opcional)"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Buscar contacto (min. 3 caracteres)..." 
                                value={contactSearch}
                                onValueChange={setContactSearch}
                              />
                              {contactSearch.length < 3 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  Escribe al menos 3 caracteres para buscar contactos
                                </div>
                              ) : (
                                <>
                                  <CommandEmpty>No se encontró contacto.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandList>
                                      <CommandItem
                                        onSelect={() => {
                                          form.setValue("related_contact_id", "");
                                          setContactOpen(false);
                                          setContactSearch('');
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
                                      {contactsList
                                        .filter(contact => 
                                          getContactDisplayName(contact)
                                            .toLowerCase()
                                            .includes(contactSearch.toLowerCase())
                                        )
                                        .map((contact) => (
                                          <CommandItem
                                            key={contact.id}
                                            onSelect={() => {
                                              form.setValue("related_contact_id", contact.id);
                                              setContactOpen(false);
                                              setContactSearch('');
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === contact.id ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {getContactDisplayName(contact)}
                                          </CommandItem>
                                        ))}
                                    </CommandList>
                                  </CommandGroup>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: File Attachment */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-[#666666] mx-auto mb-2" />
                    <p className="text-[#666666]">Adjuntar archivo (opcional)</p>
                    <p className="text-sm text-[#999999]">Máximo 10MB - PDF, imágenes, documentos</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-[#cccccc] rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-[#666666] hover:text-[#333333]"
                    >
                      {selectedFile ? (
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-[#999999]">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <p>Haz clic para seleccionar un archivo</p>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-[#cccccc]">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="bg-[#d2d2d2] border-[#cccccc]"
                >
                  Cancelar
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="bg-[#d2d2d2] border-[#cccccc]"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              </div>

              <div className="flex gap-2">
                {currentStep < steps.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNext}
                    className="bg-[#d2d2d2] border-[#cccccc]"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                
                <Button 
                  type="button"
                  onClick={() => form.handleSubmit(onSubmit)()}
                  disabled={isLoading}
                  className="bg-[#8fc700] hover:bg-[#7fb600] text-white"
                >
                  {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}