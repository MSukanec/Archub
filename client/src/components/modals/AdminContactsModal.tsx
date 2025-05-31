import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { contactsService, CreateContactData } from '@/lib/contactsService';

const contactSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  contact_type: z.string().min(1, 'El tipo de contacto es requerido'),
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
      contact_type: '',
    },
  });

  // Reset form when contact changes or modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        first_name: contact?.first_name || '',
        last_name: contact?.last_name || '',
        company_name: contact?.company_name || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
        location: contact?.location || '',
        notes: contact?.notes || '',
        contact_type: contact?.contact_type || '',
      });
    }
  }, [contact, isOpen, form]);

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
        contact_type: data.contact_type,
      };
      return await contactsService.create(contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
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
        contact_type: data.contact_type,
      };
      return await contactsService.update(contact!.id, contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
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

  const footer = (
    <div className="flex gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isSubmitting}
        className="w-1/4 bg-transparent border-[#919191]/30 text-foreground hover:bg-[#d0d0d0] rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="contact-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (contact ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={contact ? 'Editar Contacto' : 'Crear Nuevo Contacto'}
      subtitle="Gestiona los contactos del sistema"
      icon={Users}
      footer={footer}
    >
      <Form {...form}>
        <form id="contact-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">Nombre *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Juan" 
                      className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
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
                  <FormLabel className="text-xs font-medium text-foreground">Apellido</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Pérez" 
                      className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                      {...field} 
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
                <FormLabel className="text-xs font-medium text-foreground">Empresa</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Constructora ABC" 
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="ejemplo@email.com" 
                      className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: +54 9 11 1234-5678" 
                      className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                      {...field} 
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
                <FormLabel className="text-xs font-medium text-foreground">Ubicación</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Buenos Aires, Argentina" 
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Notas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Información adicional sobre el contacto..." 
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ModernModal>
  );
}