import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Shield, Smartphone, Monitor, MapPin, Calendar, Eye, EyeOff, Key, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

export default function ProfileSecurity() {
  const { user, logout } = useAuthStore();
  const { setSection, setView } = useNavigationStore();
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);



  // Obtener sesiones activas (mock data por ahora)
  const activeSessions = [
    {
      id: '1',
      device: 'Chrome en Windows',
      location: 'Buenos Aires, Argentina',
      lastActive: new Date().toISOString(),
      current: true,
      ip: '192.168.1.100'
    },
    {
      id: '2',
      device: 'Safari en iPhone',
      location: 'Buenos Aires, Argentina',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      current: false,
      ip: '192.168.1.101'
    }
  ];

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Activo ahora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`;
    } else {
      return format(date, 'dd MMM yyyy', { locale: es });
    }
  };

  const handleChangePassword = () => {
    // Implementar cambio de contraseña
    toast({
      description: "Funcionalidad de cambio de contraseña en desarrollo",
      duration: 2000,
    });
  };

  const handleToggle2FA = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      description: enabled ? "Autenticación de dos factores habilitada" : "Autenticación de dos factores deshabilitada",
      duration: 2000,
    });
  };

  const handleRevokeSession = (sessionId: string) => {
    toast({
      description: "Sesión cerrada correctamente",
      duration: 2000,
    });
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      toast({
        description: "Sesión cerrada correctamente",
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Error al cerrar sesión. Intenta nuevamente.",
        duration: 3000,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Seguridad
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona la seguridad de tu cuenta y privacidad
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleLogoutClick}
          variant="outline" 
          className="border-red-600/30 text-red-600 hover:bg-red-600 hover:text-white rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Cambio de Contraseña */}
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Cambiar Contraseña</h3>
        </div>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Contraseña Actual
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña actual"
                className="h-10 bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Ingresa tu nueva contraseña"
                className="h-10 bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Confirmar Nueva Contraseña
            </label>
            <Input
              type="password"
              placeholder="Confirma tu nueva contraseña"
              className="h-10 bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            />
          </div>
          
          <Button 
            onClick={handleChangePassword}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            <Key className="h-4 w-4 mr-2" />
            Actualizar Contraseña
          </Button>
        </div>
      </div>

      {/* Autenticación de Dos Factores */}
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Autenticación de Dos Factores</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">Habilitar 2FA</h4>
            <p className="text-sm text-muted-foreground">
              Agrega una capa adicional de seguridad usando tu teléfono
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
          />
        </div>
        
        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">
              Escanea este código QR con tu aplicación de autenticación:
            </p>
            <div className="w-32 h-32 bg-surface-secondary rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Código QR</span>
            </div>
          </div>
        )}
      </div>

      {/* Sesiones Activas */}
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Monitor className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Sesiones Activas</h3>
        </div>
        
        <div className="space-y-4">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{session.device}</h4>
                    {session.current && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Actual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {session.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatLastActive(session.lastActive)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">IP: {session.ip}</p>
                </div>
              </div>
              
              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                  className="border-red-600/30 text-red-600 hover:bg-red-600 hover:text-white rounded-xl"
                >
                  Cerrar Sesión
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Configuraciones de Privacidad */}
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Configuraciones de Privacidad</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Notificaciones por Email</h4>
              <p className="text-sm text-muted-foreground">
                Recibe actualizaciones de seguridad por email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Actividad de Inicio de Sesión</h4>
              <p className="text-sm text-muted-foreground">
                Registrar información de ubicación y dispositivo
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

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