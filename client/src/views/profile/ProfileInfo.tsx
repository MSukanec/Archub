import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Calendar, Edit, Building2, Crown, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useToast } from '@/hooks/use-toast';
import { authService, supabase } from '@/lib/supabase';
import { organizationsService } from '@/lib/organizationsService';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EditProfileModal from '@/components/modals/EditProfileModal';

export default function ProfileInfo() {
  const { user } = useAuthStore();
  const { theme, setTheme, isLoading: themeLoading } = useThemeStore();
  const { setSection, setView } = useNavigationStore();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleThemeChange = async (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('profile-info');
  }, [setSection, setView]);


  // Obtener la organización del usuario
  const { data: organization } = useQuery({
    queryKey: ['current-organization'],
    queryFn: organizationsService.getCurrentUserOrganization,
  });

  // Obtener datos del usuario desde la base de datos
  const { data: currentUser } = useQuery({
    queryKey: ['current-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching current user:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });



  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Mi Perfil
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu información personal y configuraciones de cuenta
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Cards de información */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="rounded-2xl shadow-md bg-card p-6 border-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Información Personal</h3>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16 rounded-xl">
              <AvatarFallback className="text-lg bg-primary/10 text-primary rounded-xl">
                {getInitials(currentUser?.first_name || user?.firstName, currentUser?.last_name || user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {currentUser?.first_name || user?.firstName} {currentUser?.last_name || user?.lastName}
              </h4>
              <p className="text-sm text-muted-foreground">{currentUser?.email || user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">NOMBRE COMPLETO</label>
              <p className="text-foreground font-medium">
                {currentUser?.first_name || user?.firstName} {currentUser?.last_name || user?.lastName}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">EMAIL</label>
              <p className="text-foreground font-medium">{currentUser?.email || user?.email}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">ROL</label>
              <div className="flex items-center gap-2">
                {currentUser?.role === 'admin' ? (
                  <>
                    <Crown className="h-4 w-4 text-amber-600" />
                    <span className="text-foreground font-medium">Administrador</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-foreground font-medium">Usuario</span>
                  </>
                )}
              </div>
            </div>
            {currentUser?.created_at && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">MIEMBRO DESDE</label>
                <p className="text-foreground font-medium">
                  {formatDate(currentUser.created_at)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Información de Organización */}
        <div className="rounded-2xl shadow-md bg-card p-6 border-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Organización</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">ORGANIZACIÓN ACTUAL</label>
              <p className="text-foreground font-medium">{organization?.name || 'Sin organización'}</p>
            </div>
            {organization?.name && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">TIPO</label>
                <p className="text-foreground font-medium">Organización</p>
              </div>
            )}
            {organization?.created_at && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">CREADA EL</label>
                <p className="text-foreground font-medium">
                  {formatDate(organization.created_at)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Configuración de Apariencia */}
        <div className="rounded-2xl shadow-md bg-card p-6 border-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Configuración de Apariencia</h3>
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
