import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Calendar, Save, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/supabase';
import { organizationsService } from '@/lib/organizationsService';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

const profileSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileInfo() {
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);


  // Obtener la organización del usuario
  const { data: organization } = useQuery({
    queryKey: ['current-organization'],
    queryFn: organizationsService.getCurrentUserOrganization,
  });

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      console.log('Iniciando logout...');
      const { error } = await authService.signOut();
      console.log('Resultado signOut:', { error });
      
      if (error) {
        throw error;
      }
      
      console.log('Llamando logout del store...');
      logout();
      
      console.log('Cerrando modal y redirigiendo...');
      setShowLogoutModal(false);
      setLocation('/'); // Redirigir a la página de landing
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
    } catch (error) {
      console.error('Error en logout:', error);
      toast({
        title: "Error",
        description: `Error al cerrar sesión: ${error.message}`,
        variant: "destructive",
      });
      setShowLogoutModal(false);
    }
  };



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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Información del Perfil
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuraciones de cuenta.
        </p>
      </div>

      {/* Perfil y configuraciones en una sola card */}
      <Card>
        <CardContent className="pt-6">
          {/* Header del perfil */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-lg">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
            </div>
          </div>

          {/* Información personal */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center">
              <User className="mr-2" size={16} />
              INFORMACIÓN PERSONAL
            </h3>
            
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">NOMBRE</label>
                  <p className="text-foreground">{user?.firstName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">APELLIDO</label>
                  <p className="text-foreground">{user?.lastName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">EMAIL</label>
                  <p className="text-foreground">{user?.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Configuraciones rápidas */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">CONFIGURACIONES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" size="sm" className="justify-start h-10">
                <Mail className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
              <Button variant="outline" size="sm" className="justify-start h-10">
                <User className="h-4 w-4 mr-2" />
                Autenticación 2FA
              </Button>
              <Button variant="outline" size="sm" className="justify-start h-10">
                <Calendar className="h-4 w-4 mr-2" />
                Sesiones Activas
              </Button>
            </div>
          </div>

          {/* Acciones de cuenta */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">ACCIONES DE CUENTA</h3>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogoutClick}
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
              

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación para cerrar sesión */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-yellow-500" />
              Cerrar Sesión
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
}
