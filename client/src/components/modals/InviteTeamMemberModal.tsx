import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Shield, UserPlus } from 'lucide-react';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useToast } from '../../hooks/use-toast';
import ModernModal, { useModalAccordion, ModalAccordion } from './ui/ModernModal';

const inviteSchema = z.object({
  email: z.string().email('El email debe ser válido'),
  role: z.enum(['admin', 'member'], {
    required_error: 'Debe seleccionar un rol',
  }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions = [
  {
    value: 'member',
    label: 'Miembro',
    description: 'Acceso básico a proyectos y bitácoras',
    icon: User,
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso completo y gestión de equipo',
    icon: Shield,
  }
];

export default function InviteTeamMemberModal({ isOpen, onClose }: InviteTeamMemberModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toggleAccordion, isOpen: isAccordionOpen } = useModalAccordion('general');

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        description: `Se ha enviado una invitación a ${data.email}`,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        description: "No se pudo enviar la invitación. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invitar Miembro al Equipo"
      icon={UserPlus}
      confirmText="Enviar Invitación"
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          <ModalAccordion
            id="general"
            title="Información General"
            icon={Mail}
            isOpen={isAccordionOpen('general')}
            onToggle={toggleAccordion}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@ejemplo.com"
                        className="h-10 bg-surface-secondary border-input rounded-xl shadow-lg hover:shadow-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol en el equipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-surface-secondary border-input rounded-xl shadow-lg hover:shadow-xl">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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