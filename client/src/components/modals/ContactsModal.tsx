import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { User, Building2, Mail, Phone, MapPin, FileText, Tags } from 'lucide-react';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { contactsService, Contact, CreateContactData } from '../../lib/contactsService';
import { contactTypesService, ContactType } from '../../lib/contactTypesService';
import ModernModal from '../ui/ModernModal';

const contactSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type ContactForm = z.infer<typeof contactSchema>;

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
}

export default function ContactsModal({ isOpen, onClose, contact }: ContactsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);

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
        });
      } else {
        // Reset to completely empty form for new contact
        form.reset({
          first_name: '',
          last_name: '',
          company_name: '',
          email: '',
          phone: '',
          location: '',
          notes: '',
        });
        setSelectedTypeIds([]);
      }
    }
  }, [isOpen, contact, form]);

  // Load contact types when editing
  useEffect(() => {
    if (contact?.id && currentContactTypes.length > 0) {
      const typeIds = currentContactTypes.map(type => type.id);
      setSelectedTypeIds(typeIds);
    } else if (!contact) {
      setSelectedTypeIds([]);
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
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-types'] });
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
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; contactData: Partial<CreateContactData>; typeIds: string[] }) => {
      const updatedContact = await contactsService.update(data.id, data.contactData);
      await contactTypesService.updateContactTypes(data.id, data.typeIds);
      return updatedContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-types'] });
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
    },
  });

  const onSubmit = (data: ContactForm) => {
    if (createMutation.isPending || updateMutation.isPending) {
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

    if (contact?.id) {
      updateMutation.mutate({ 
        id: contact.id, 
        contactData, 
        typeIds: selectedTypeIds 
      });
    } else {
      createMutation.mutate({ 
        contactData, 
        typeIds: selectedTypeIds 
      });
    }
  };

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypeIds(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <ModernModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={contact ? 'Editar Contacto' : 'Crear Contacto'}
      subtitle="Gestiona contactos de proveedores, contratistas y colaboradores"
      icon={User}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion type="multiple" defaultValue={["personal", "types"]} className="w-full space-y-4">
            
            {/* Información Personal */}
            <AccordionItem value="personal" className="border border-input rounded-lg bg-surface-secondary">
              <AccordionTrigger className="px-4 hover:no-underline text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#919191]/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-muted-foreground">Información Personal</h3>
                    <p className="text-sm text-muted-foreground/70">Nombre y datos básicos del contacto</p>
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
                          <FormLabel className="text-xs font-medium text-muted-foreground">
                            Nombre *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="ej. Juan"
                              className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary text-sm"
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
                          <FormLabel className="text-xs font-medium text-muted-foreground">Apellido</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="ej. Pérez"
                              className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Empresa</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="ej. Constructora ABC"
                            className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Tipos de Contacto */}
            <AccordionItem value="types" className="border border-input rounded-lg bg-surface-secondary">
              <AccordionTrigger className="px-4 hover:no-underline text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#919191]/10 flex items-center justify-center">
                    <Tags className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-muted-foreground">Tipos de Contacto</h3>
                    <p className="text-sm text-muted-foreground/70">Categorías que definen el rol del contacto</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {availableTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedTypeIds.includes(type.id)}
                        onCheckedChange={() => handleTypeToggle(type.id)}
                        className="border-input"
                      />
                      <label
                        htmlFor={type.id}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Información de Contacto */}
            <AccordionItem value="contact" className="border border-input rounded-lg bg-surface-secondary">
              <AccordionTrigger className="px-4 hover:no-underline text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#919191]/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-muted-foreground">Información de Contacto</h3>
                    <p className="text-sm text-muted-foreground/70">Email, teléfono y ubicación</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              placeholder="ejemplo@email.com"
                              className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary text-sm"
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
                          <FormLabel className="text-xs font-medium text-muted-foreground">Teléfono</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="ej. +54 9 11 1234-5678"
                              className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Ubicación</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="ej. Buenos Aires, Argentina"
                            className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary text-sm"
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
            <AccordionItem value="notes" className="border border-input rounded-lg bg-surface-secondary">
              <AccordionTrigger className="px-4 hover:no-underline text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#919191]/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-muted-foreground">Notas Adicionales</h3>
                    <p className="text-sm text-muted-foreground/70">Información adicional sobre el contacto</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">Notas</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Información adicional sobre el contacto..."
                          className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary text-sm min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-input">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-input text-muted-foreground hover:bg-surface-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Guardando...' : (contact ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Form>
    </ModernModal>
  );
}