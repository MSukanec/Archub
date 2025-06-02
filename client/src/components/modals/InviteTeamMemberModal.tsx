import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Shield, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'member'], {
    required_error: 'Debe seleccionar un rol',
  }),
  message: z.string().optional(),
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'member',
      message: 'Te invito a unirte a nuestro equipo en Archmony para colaborar en los proyectos de construcción.',
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${data.email}`,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setShowAdvanced(false);
    onClose();
  };

  const selectedRole = form.watch('role');
  const selectedRoleConfig = roleOptions.find(r => r.value === selectedRole);

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invitar Miembro al Equipo"
      icon={UserPlus}
      maxWidth="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre"
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
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apellido"
                        className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl"
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

          {/* Opciones avanzadas (colapsable) */}
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between p-0 h-auto text-left"
            >
              <span className="font-medium">Opciones avanzadas</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje personalizado (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mensaje personalizado para incluir en la invitación..."
                          className="min-h-[100px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Footer con botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-[#e0e0e0] border-[#919191]/30 text-[#919191] hover:bg-[#d0d0d0] rounded-xl"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-[3] bg-[#4f9eff] border-[#4f9eff] text-white hover:bg-[#3d8bef] rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </div>
        </form>
      </Form>
    </ModernModal>
  );
}