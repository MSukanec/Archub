import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Shield, UserPlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ModernModal from '@/components/ui/ModernModal';

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
  const [openAccordion, setOpenAccordion] = useState<string | null>('general');

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
    setOpenAccordion('general');
    onClose();
  };

  const toggleAccordion = (accordion: string) => {
    setOpenAccordion(openAccordion === accordion ? null : accordion);
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invitar Miembro al Equipo"
      icon={UserPlus}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Información General */}
          <div className="border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAccordion('general')}
              className="w-full px-4 py-3 bg-muted/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">Información General</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${
                openAccordion === 'general' ? 'rotate-180' : ''
              }`} />
            </button>
            
            {openAccordion === 'general' && (
              <div className="p-4 space-y-4 bg-card">
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
                          className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl"
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
                          <SelectTrigger className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl">
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
            )}
          </div>
        </form>
      </Form>
      
      {/* Footer */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex-1 bg-[#e0e0e0] border-[#919191]/30 text-[#919191] hover:bg-[#d0d0d0] rounded-xl"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          className="flex-[3] bg-[#4f9eff] border-[#4f9eff] text-white hover:bg-[#3d8bef] rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
        </Button>
      </div>
    </ModernModal>
  );
}