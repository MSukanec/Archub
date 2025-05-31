import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Shield, UserPlus, X, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso completo y gestión de equipo',
    icon: Shield,
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  }
];

export default function InviteTeamMemberModal({ isOpen, onClose }: InviteTeamMemberModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'member',
      message: 'Te invito a unirte a nuestro equipo en Archmony para colaborar en los proyectos de construcción.',
    },
  });

  const selectedRole = watch('role');
  const selectedRoleConfig = roleOptions.find(r => r.value === selectedRole);

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${data.email}`,
      });
      
      reset();
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
    reset();
    onClose();
  };

  return (
    <ModernModal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Invitar Miembro al Equipo
              </h2>
              <p className="text-sm text-muted-foreground">
                Envía una invitación por correo electrónico
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-muted/50 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Información Personal
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">
                    NOMBRE
                  </Label>
                  <Input
                    {...register('firstName')}
                    placeholder="Nombre del invitado"
                    className="bg-[#d2d2d2] border-0 text-foreground placeholder:text-muted-foreground"
                  />
                  {errors.firstName && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      {errors.firstName.message}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">
                    APELLIDO
                  </Label>
                  <Input
                    {...register('lastName')}
                    placeholder="Apellido del invitado"
                    className="bg-[#d2d2d2] border-0 text-foreground placeholder:text-muted-foreground"
                  />
                  {errors.lastName && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      {errors.lastName.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">
                  EMAIL
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="pl-10 bg-[#d2d2d2] border-0 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </div>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Rol y Permisos
                </h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">
                  ROL EN LA ORGANIZACIÓN
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue('role', value as 'admin' | 'member')}
                >
                  <SelectTrigger className="bg-[#d2d2d2] border-0 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => {
                      const IconComponent = role.icon;
                      return (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {role.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {errors.role.message}
                  </div>
                )}
              </div>

              {selectedRoleConfig && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className={selectedRoleConfig.color}>
                      <selectedRoleConfig.icon className="w-3 h-3 mr-1" />
                      {selectedRoleConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedRoleConfig.description}
                  </p>
                </div>
              )}
            </div>

            {/* Custom Message */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Mensaje de Invitación
                </h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">
                  MENSAJE PERSONALIZADO (OPCIONAL)
                </Label>
                <Textarea
                  {...register('message')}
                  placeholder="Escribe un mensaje personalizado para acompañar la invitación..."
                  rows={4}
                  className="bg-[#d2d2d2] border-0 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="min-w-[140px] bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Enviar Invitación
              </div>
            )}
          </Button>
        </div>
      </div>
    </ModernModal>
  );
}