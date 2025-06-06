import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Users, User, Phone, MapPin, FileText, Info } from 'lucide-react';
import ModernModal, { ModalAccordion, useModalAccordion } from '../../components/ui/ModernModal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { PhoneInputField } from '../../components/ui/PhoneInput';
import { SimpleMultiSelectContactTypes } from '../../components/ui/SimpleMultiSelectContactTypes';
import { useToast } from '../../hooks/use-toast';
import { contactsService, CreateContactData } from '../../lib/contactsService';
import { contactTypesService } from '../../lib/contactTypesService';

const contactSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  contact_type_ids: z.array(z.string()).min(1, 'Debe seleccionar al menos un tipo de contacto'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface AdminContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: any | null;
}

export default function AdminContactsModal({ 
  isOpen, 
  onClose, 
  contact 
}: AdminContactsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openAccordion, toggleAccordion, isOpen: isAccordionOpen } = useModalAccordion('general');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      email: '',
      phone: '',
      location: '',
      notes: '',
      contact_type_ids: [],
    },
  });

  // Reset form when modal opens/closes or contact changes
  useEffect(() => {
    if (isOpen) {
      if (contact) {
        form.reset({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          company_name: contact.company_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          location: contact.location || '',
          notes: contact.notes || '',
          contact_type_ids: contact.contact_types?.map((type: any) => type.id) || [],
        });
      } else {
        form.reset({
          first_name: '',
          last_name: '',
          company_name: '',
          email: '',
          phone: '',
          location: '',
          notes: '',
          contact_type_ids: [],
        });
      }
    }
  }, [isOpen, contact, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const contactData: CreateContactData = {
        first_name: data.first_name,
        last_name: data.last_name || null,
        company_name: data.company_name || null,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        notes: data.notes || null,
        contact_type_ids: data.contact_type_ids,
      };
      const newContact = await contactsService.create(contactData);
      
      // Actualizar tipos de contacto si hay alguno seleccionado
      if (data.contact_type_ids.length > 0 && newContact.id) {
        await contactTypesService.updateContactTypes(newContact.id, data.contact_type_ids);
      }
      
      return newContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contact-types'] });
      toast({
        title: "Contacto creado",
        description: "El contacto se ha creado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el contacto.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const contactData: Partial<CreateContactData> = {
        first_name: data.first_name,
        last_name: data.last_name || null,
        company_name: data.company_name || null,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        notes: data.notes || null,
        contact_type_ids: data.contact_type_ids,
      };
      const updatedContact = await contactsService.update(contact!.id, contactData);
      
      // Actualizar tipos de contacto
      await contactTypesService.updateContactTypes(contact!.id, data.contact_type_ids);
      
      return updatedContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contact-types'] });
      toast({
        title: "Contacto actualizado",
        description: "El contacto se ha actualizado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el contacto.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: ContactFormData) => {
    setIsSubmitting(true);
    
    if (contact) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={contact ? 'Editar Contacto' : 'Crear Nuevo Contacto'}
      subtitle="Gestiona los contactos del sistema"
      icon={Users}
      confirmText={contact ? 'Actualizar' : 'Crear Contacto'}
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={isSubmitting}
    >
      <Form {...form}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Información General */}
          <ModalAccordion
            id="general"
            title="Información General"
            subtitle="Datos básicos del contacto"
            icon={Info}
            isOpen={isAccordionOpen('general')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="contact_type_ids"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Tipo de contacto *</FormLabel>
                    <FormControl>
                      <SimpleMultiSelectContactTypes
                        value={field.value || []}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={!!fieldState.error}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Nombre *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Juan" 
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
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
                    <FormLabel className="text-xs font-medium text-foreground">Apellido (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Pérez" 
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Empresa (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Constructora ABC" 
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
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
                    <FormLabel className="text-xs font-medium text-foreground">Ubicación (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Buenos Aires, Argentina" 
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>

          {/* Información de Contacto */}
          <ModalAccordion
            id="contacto"
            title="Información de Contacto"
            subtitle="Email y teléfono del contacto"
            icon={Phone}
            isOpen={isAccordionOpen('contacto')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="ejemplo@email.com" 
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Teléfono (Opcional)</FormLabel>
                    <FormControl>
                      <PhoneInputField
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Ingresa tu teléfono"
                        error={!!fieldState.error}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>

          {/* Notas */}
          <ModalAccordion
            id="notas"
            title="Notas Adicionales"
            subtitle="Información adicional sobre el contacto"
            icon={FileText}
            isOpen={isAccordionOpen('notas')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Información adicional sobre el contacto..." 
                        className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>
        </div>
      </Form>
    </ModernModal>
  );
}