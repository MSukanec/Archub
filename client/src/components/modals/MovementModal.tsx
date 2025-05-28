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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Loader2, Check, ChevronsUpDown, DollarSign, Calendar, FileText, User, Briefcase, Upload, File, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { contactsService } from '@/lib/contactsService';
import { movementConceptsService } from '@/lib/movementConceptsService';
import { cn } from '@/lib/utils';

const movementSchema = z.object({
  type_id: z.string().min(1, 'Debes seleccionar un tipo de movimiento'),
  concept_id: z.string().min(1, 'Debes seleccionar una categoría'),
  date: z.string().min(1, 'La fecha es requerida'),
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
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const isEditing = !!movement;

  // Fetch contacts for selection
  const { data: contactsList = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
    enabled: isOpen,
  });

  // Fetch movement types from movement_concepts table (parent_id IS NULL)
  const { data: movementTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['movement-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .is('parent_id', null)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch categories for selected type from movement_concepts table
  const { data: movementCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['movement-categories', selectedTypeId],
    queryFn: async () => {
      if (!selectedTypeId) return [];
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .eq('parent_id', selectedTypeId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!selectedTypeId,
  });

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type_id: '',
      concept_id: '',
      date: new Date().toISOString().split('T')[0],
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
      // Get the parent type ID from the concept's parent_id
      const typeId = movement.movement_concepts?.parent_id || '';
      const conceptId = movement.concept_id || '';
      
      form.reset({
        type_id: typeId,
        concept_id: conceptId,
        date: movement.date ? movement.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: movement.description || '',
        amount: movement.amount || 0,
        currency: movement.currency || 'ARS',
        related_contact_id: movement.related_contact_id || '',
        related_task_id: movement.related_task_id || '',
      });
      setSelectedTypeId(typeId);
    } else {
      form.reset({
        type_id: '',
        concept_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        currency: 'ARS',
        related_contact_id: '',
        related_task_id: '',
      });
      setSelectedTypeId('');
    }
  }, [movement, isEditing, form, isOpen]);

  // Helper function to display contact names
  const getContactDisplayName = (contact: any) => {
    return `${contact.first_name} ${contact.last_name || ''}`.trim() || contact.company_name || 'Sin nombre';
  };

  // Function to upload file to Supabase Storage
  const uploadFile = async (file: File, movementId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('Usuario no autenticado');

    const fileExtension = file.name.split('.').pop();
    const fileName = `${file.name}`;
    const filePath = `${user.id}/${movementId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('movement-files')
      .upload(filePath, file, {
        upsert: true
      });

    if (error) throw error;
    return filePath;
  };

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      setIsUploadingFile(true);
      try {
        // First create the movement
        const { data: result, error } = await supabase
          .from('site_movements')
          .insert([{
            project_id: projectId,
            concept_id: data.concept_id,
            date: data.date,
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            related_contact_id: data.related_contact_id || null,
            related_task_id: data.related_task_id || null,
          }])
          .select()
          .single();

        if (error) throw error;

        // If there's a file, upload it and update the movement
        if (selectedFile && result) {
          const filePath = await uploadFile(selectedFile, result.id);
          
          const { error: updateError } = await supabase
            .from('site_movements')
            .update({ file_url: filePath })
            .eq('id', result.id);

          if (updateError) throw updateError;
          result.file_url = filePath;
        }

        return result;
      } finally {
        setIsUploadingFile(false);
      }
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
      setIsUploadingFile(true);
      try {
        let updateData: any = {
          concept_id: data.concept_id,
          date: data.date,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          related_contact_id: data.related_contact_id || null,
          related_task_id: data.related_task_id || null,
        };

        // If there's a new file, upload it first
        if (selectedFile) {
          const filePath = await uploadFile(selectedFile, movement.id);
          updateData.file_url = filePath;
        }

        const { data: result, error } = await supabase
          .from('site_movements')
          .update(updateData)
          .eq('id', movement.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } finally {
        setIsUploadingFile(false);
      }
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}</DialogTitle>
              <DialogDescription>
                Gestiona ingresos, egresos y ajustes financieros del proyecto
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="single" collapsible defaultValue="basic" className="w-full">
              {/* Información Básica */}
              <AccordionItem value="basic">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Información Básica</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Tipo */}
                    <FormField
                      control={form.control}
                      name="type_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo <span className="text-primary">*</span></FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedTypeId(value);
                            form.setValue('concept_id', ''); // Reset category when type changes
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                      name="concept_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría <span className="text-primary">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTypeId}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedTypeId ? "Seleccionar categoría" : "Primero selecciona un tipo"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {movementCategories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
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
                </AccordionContent>
              </AccordionItem>

              {/* Relaciones */}
              <AccordionItem value="relations">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>Relaciones</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4 items-start">
                    {/* Contacto */}
                    <FormField
                      control={form.control}
                      name="related_contact_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Contacto</FormLabel>
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
                              <Command
                                filter={(value, search) => {
                                  if (search.length < 3) return 0;
                                  return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                                }}
                              >
                                <CommandInput placeholder="Buscar contacto (min 3 chars)..." />
                                <CommandList>
                                  <CommandEmpty>Escribe al menos 3 caracteres para buscar.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="sin-contacto"
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
                        <FormItem className="flex flex-col">
                          <FormLabel>Tarea</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sin tarea" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sin-tarea">Sin tarea</SelectItem>
                              {/* Aquí irían las tareas del proyecto */}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Archivo */}
              <AccordionItem value="file">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>Archivo Adjunto</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Adjuntar archivo (opcional)</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                            }
                          }}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center space-y-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Haz clic para seleccionar un archivo
                            </span>
                            <span className="text-xs text-gray-500">
                              PDF, JPG, PNG, DOC hasta 10MB
                            </span>
                          </div>
                        </label>
                      </div>
                      
                      {selectedFile && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <File className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                          >
                            ×
                          </Button>
                        </div>
                      )}

                      {movement?.file_url && !selectedFile && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <File className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Archivo actual</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const { data } = supabase.storage
                                .from('movement-files')
                                .getPublicUrl(movement.file_url);
                              window.open(data.publicUrl, '_blank');
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

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
                disabled={isLoading || isUploadingFile}
              >
                {(isLoading || isUploadingFile) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploadingFile ? 'Subiendo archivo...' : isEditing ? 'Actualizar' : 'Crear'} 
                {!isUploadingFile && ' Movimiento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}