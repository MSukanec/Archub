import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Calendar, Save, LogOut, AlertTriangle } from 'lucide-react';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

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
      await authService.signOut();
      logout();
      setShowLogoutModal(false);
      setLocation('/'); // Redirigir a la página de landing
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión.",
        variant: "destructive",
      });
      setShowLogoutModal(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirmationText('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!organization || confirmationText !== organization.name) {
      toast({
        title: "Error",
        description: "Debes escribir exactamente el nombre de tu organización para confirmar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implement account deletion logic
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada permanentemente.",
        variant: "destructive",
      });
      setShowDeleteModal(false);
      setConfirmationText('');
      await authService.signOut();
      logout();
      setLocation('/'); // Redirigir a la página de landing
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la cuenta.",
        variant: "destructive",
      });
      setShowDeleteModal(false);
    }
  };

  const isDeleteConfirmationValid = organization && confirmationText === organization.name;

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
              <h4 className="font-medium text-foreground">Cerrar Sesión</h4>
              <p className="text-sm text-muted-foreground">
                Cerrar sesión en este dispositivo
              </p>
            </div>
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
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-destructive">Eliminar Cuenta</h4>
              <p className="text-sm text-muted-foreground">
                Eliminar permanentemente tu cuenta y todos los datos asociados
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteClick}
            >
              Eliminar
            </Button>
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

      {/* Modal de confirmación para eliminar cuenta */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              ⚠️ PELIGRO: Eliminar Cuenta
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <div className="font-semibold text-red-700 dark:text-red-400">
                  Esta acción NO se puede deshacer.
                </div>
                <div>
                  Al eliminar tu cuenta se borrarán <strong>permanentemente</strong>:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Todos tus proyectos y presupuestos</li>
                  <li>Toda la información de tu organización</li>
                  <li>Todos los archivos y documentos</li>
                  <li>Todo el historial de actividades</li>
                  <li>Tu perfil y configuraciones</li>
                </ul>
                <div className="font-medium text-red-700 dark:text-red-400">
                  Esta acción es IRREVERSIBLE. ¿Estás completamente seguro?
                </div>
                {organization && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    <div className="text-sm font-medium mb-2">
                      Para confirmar, escribe el nombre de tu organización: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">{organization.name}</span>
                    </div>
                    <Input
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="Nombre de la organización"
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationText('')}>No, mantener mi cuenta</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={!isDeleteConfirmationValid}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sí, eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
