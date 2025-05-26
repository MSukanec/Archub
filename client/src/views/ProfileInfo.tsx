import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Calendar, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileInfo() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // TODO: Implement profile update API call
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido actualizada correctamente.',
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Información del Perfil
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuraciones de cuenta.
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="mr-2" size={20} />
              Información Personal
            </CardTitle>
            {isEditing && (
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Save size={16} className="mr-2" />
                Guardar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-foreground font-medium">{user?.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Apellido</label>
                  <p className="text-foreground font-medium">{user?.lastName}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground font-medium">{user?.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones de Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Cambiar Contraseña</h4>
              <p className="text-sm text-muted-foreground">
                Actualiza tu contraseña para mantener tu cuenta segura
              </p>
            </div>
            <Button variant="outline" size="sm">
              Cambiar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Autenticación de Dos Factores</h4>
              <p className="text-sm text-muted-foreground">
                Añade una capa extra de seguridad a tu cuenta
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configurar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Sesiones Activas</h4>
              <p className="text-sm text-muted-foreground">
                Gestionar dispositivos donde has iniciado sesión
              </p>
            </div>
            <Button variant="outline" size="sm">
              Ver Sesiones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Eliminar Cuenta</h4>
              <p className="text-sm text-muted-foreground">
                Eliminar permanentemente tu cuenta y todos los datos asociados
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
