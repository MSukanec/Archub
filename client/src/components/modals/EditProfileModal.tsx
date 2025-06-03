import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ModernModal from '@/components/ui/ModernModal';

const profileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden o falta la contraseña actual",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme, isLoading: themeLoading } = useThemeStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // Update profile information in auth.users
      const updates: any = {};
      
      if (data.firstName !== user?.firstName || data.lastName !== user?.lastName) {
        updates.data = {
          first_name: data.firstName,
          last_name: data.lastName,
        };
      }

      if (data.email !== user?.email) {
        updates.email = data.email;
      }

      if (data.newPassword && data.currentPassword) {
        updates.password = data.newPassword;
      }

      // Update auth user if there are changes
      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) throw authError;
      }

      // Update internal users table
      if (user?.id) {
        const { error: dbError } = await supabase
          .from('users')
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
          })
          .eq('auth_id', user.id);

        if (dbError) throw dbError;
      }

      // Update user in store
      setUser({
        ...user!,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });

      toast({
        description: "Perfil actualizado correctamente",
        duration: 2000,
      });

      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        description: error.message || "Error al actualizar el perfil",
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThemeChange = async (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Perfil"
      subtitle="Actualiza tu información personal y configuraciones de cuenta"
      icon={User}
      footer={
        <div className="flex gap-2 w-full">
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
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Información Personal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
              <User className="h-4 w-4" />
              Información Personal
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Nombre <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ingresa tu nombre"
                        className="h-10 bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow"
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
                    <FormLabel className="text-xs font-medium text-foreground">
                      Apellido <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ingresa tu apellido"
                        className="h-10 bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow"
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
                  <FormLabel className="text-xs font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email <span className="text-primary">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Ingresa tu email"
                      className="h-10 bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Cambio de Contraseña */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
              <Lock className="h-4 w-4" />
              Cambiar Contraseña (Opcional)
            </div>

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">
                    Contraseña Actual
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Ingresa tu contraseña actual"
                      className="h-10 bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Nueva Contraseña
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Nueva contraseña"
                        className="h-10 bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Confirmar Contraseña
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirma la contraseña"
                        className="h-10 bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Configuración de Apariencia */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b border-border pb-2">
              <Palette className="h-4 w-4" />
              Configuración de Apariencia
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">Modo Oscuro</div>
                <div className="text-xs text-muted-foreground">
                  Cambia entre el tema claro y oscuro de la aplicación
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
                disabled={themeLoading}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>
      </Form>
    </ModernModal>
  );
}