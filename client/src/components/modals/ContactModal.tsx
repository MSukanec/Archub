import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { User, Building2, Mail, Phone, MapPin, FileText, Check, X, Tags, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { contactsService, Contact, CreateContactData } from '@/lib/contactsService';
import { contactTypesService, ContactType } from '@/lib/contactTypesService';

const contactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  contact_types: z.array(z.string()).min(1, "Debe seleccionar al menos un tipo de contacto"),
});

type ContactForm = z.infer<typeof contactSchema>;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
}

export default function ContactModal({ isOpen, onClose, contact }: ContactModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch available contact types
  const { data: availableTypes = [] } = useQuery({
    queryKey: ['contact-types'],
    queryFn: contactTypesService.getAll,
  });

  // Fetch current contact types if editing
  const { data: currentContactTypes = [] } = useQuery({
    queryKey: ['contact-types', contact?.id],
    queryFn: () => contact?.id ? contactTypesService.getContactTypes(contact.id) : Promise.resolve([]),
    enabled: !!contact?.id,
  });

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      email: '',
      phone: '',
      location: '',
      notes: '',
      contact_types: [],
    },
  });

  // Reset form when modal opens/closes or contact changes
  useEffect(() => {
    if (isOpen) {
      if (contact) {
        // Load existing contact data
        form.reset({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          company_name: contact.company_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          location: contact.location || '',
          notes: contact.notes || '',
          contact_types: [],
        });
      } else {
        // Reset to empty form for new contact
        form.reset({
          first_name: '',
          last_name: '',
          company_name: '',
          email: '',
          phone: '',
          location: '',
          notes: '',
          contact_types: [],
        });
        setSelectedTypes([]);
      }
    }
  }, [isOpen, contact?.id]);

  // Load contact types separately to avoid form reset loop
  useEffect(() => {
    if (contact?.id && currentContactTypes.length > 0) {
      const typeIds = currentContactTypes.map(type => type.id);
      setSelectedTypes(typeIds);
      form.setValue('contact_types', typeIds);
    }
  }, [currentContactTypes, contact?.id]);

  const createMutation = useMutation({
    mutationFn: async (data: { contactData: CreateContactData; typeIds: string[] }) => {
      const newContact = await contactsService.create(data.contactData);
      if (data.typeIds.length > 0) {
        await contactTypesService.updateContactTypes(newContact.id, data.typeIds);
      }
      return newContact;
    },
    onSuccess: () => {
      // Force immediate refresh of all contact-related data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-types'] });
      queryClient.refetchQueries({ queryKey: ['contacts'] });
      queryClient.refetchQueries({ queryKey: ['contact-types'] });
      form.reset();
      toast({
        title: "Contacto creado",
        description: "El contacto se ha guardado correctamente.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el contacto. Inténtalo de nuevo.",
        variant: "destructive",
      });
      // Force close modal to prevent getting stuck
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; contactData: Partial<CreateContactData>; typeIds: string[] }) => {
      try {
        const updatedContact = await contactsService.update(data.id, data.contactData);
        await contactTypesService.updateContactTypes(data.id, data.typeIds);
        return updatedContact;
      } catch (error) {
        console.error('Error in update mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force immediate refresh of all contact-related data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-types'] });
      queryClient.refetchQueries({ queryKey: ['contacts'] });
      queryClient.refetchQueries({ queryKey: ['contact-types'] });
      form.reset();
      toast({
        title: "Contacto actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
      // Force close modal even on error to prevent getting stuck
      onClose();
    },
  });

  const onSubmit = (data: ContactForm) => {
    console.log('Form data received:', data);
    
    // Check if form is already being submitted
    if (createMutation.isPending || updateMutation.isPending) {
      console.log('Form already being submitted, ignoring...');
      return;
    }
    
    const contactData: CreateContactData = {
      first_name: data.first_name,
      last_name: data.last_name || null,
      company_name: data.company_name || null,
      email: data.email || null,
      phone: data.phone || null,
      location: data.location || null,
      notes: data.notes || null,
    };

    console.log('Submitting contact data:', contactData);
    console.log('Selected type IDs:', data.contact_types);

    if (contact?.id) {
      updateMutation.mutate({ 
        id: contact.id, 
        contactData, 
        typeIds: data.contact_types 
      });
    } else {
      createMutation.mutate({ 
        contactData, 
        typeIds: data.contact_types 
      });
    }
  };

  const handleTypeToggle = (typeId: string) => {
    const newSelectedTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    
    setSelectedTypes(newSelectedTypes);
    form.setValue('contact_types', newSelectedTypes);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </DialogTitle>
              <DialogDescription>
                Registra información de proveedores, contratistas y otros contactos importantes para el proyecto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="single" defaultValue="personal" className="w-full">
              
              {/* Información Personal */}
              <AccordionItem value="personal" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Información Personal</h3>
                      <p className="text-sm text-muted-foreground">Nombre y datos básicos</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Nombre <span className="text-primary">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="ej. Juan"
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="ej. Pérez"
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="contact_types"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Tipos de contacto <span className="text-primary">*</span>
                          </FormLabel>
                          <FormControl>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={open}
                                  className="w-full justify-between bg-background"
                                >
                                  {selectedTypes.length === 0
                                    ? "Seleccionar tipos..."
                                    : `${selectedTypes.length} tipo${selectedTypes.length > 1 ? 's' : ''} seleccionado${selectedTypes.length > 1 ? 's' : ''}`
                                  }
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Buscar tipos..." />
                                  <CommandEmpty>No se encontraron tipos.</CommandEmpty>
                                  <CommandGroup>
                                    {availableTypes.map((type) => (
                                      <CommandItem
                                        key={type.id}
                                        onSelect={() => handleTypeToggle(type.id)}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedTypes.includes(type.id) ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {type.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedTypes.map((typeId) => {
                              const type = availableTypes.find(t => t.id === typeId);
                              return type ? (
                                <Badge key={type.id} variant="secondary" className="flex items-center gap-1">
                                  {type.name}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={() => handleTypeToggle(type.id)}
                                  />
                                </Badge>
                              ) : null;
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Información de Empresa */}
              <AccordionItem value="company" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Información de Empresa</h3>
                      <p className="text-sm text-muted-foreground">Datos comerciales y empresa</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Empresa
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="ej. Constructora ABC"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Ubicación
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="ej. Buenos Aires, Argentina"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Información de Contacto */}
              <AccordionItem value="contact" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Información de Contacto</h3>
                      <p className="text-sm text-muted-foreground">Medios de comunicación</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              placeholder="ej. contacto@empresa.com"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Teléfono
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="ej. +54 11 1234-5678"
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Notas */}
              <AccordionItem value="notes" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Notas Adicionales</h3>
                      <p className="text-sm text-muted-foreground">Observaciones y comentarios</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Información adicional sobre el contacto..."
                            className="bg-background min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : contact ? 'Actualizar' : 'Crear'} Contacto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}