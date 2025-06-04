import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Lock, CreditCard, Save, Crown, Zap, Rocket, Moon, Sun } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useFeatures } from '@/hooks/useFeatures';

export default function Profile() {
  const { setSection, setView } = useNavigationStore();
  const { user, setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userPlan, getCurrentPlan } = useFeatures();

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('profile-info');
  }, [setSection, setView]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ['current-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch all available plans
  const { data: availablePlans = [] } = useQuery({
    queryKey: ['/api/plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price');
      if (error) throw error;
      return data;
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: typeof profileForm) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email
        })
        .eq('auth_id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setUser({
        ...user!,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo nuevamente.",
        variant: "destructive"
      });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (passwords: typeof securityForm) => {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Verifica los datos ingresados.",
        variant: "destructive"
      });
    }
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSave = () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive"
      });
      return;
    }
    updatePasswordMutation.mutate(securityForm);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'free': return Zap;
      case 'pro': return Crown;
      case 'enterprise': return Rocket;
      default: return Zap;
    }
  };

  const currentPlanName = getCurrentPlan() || 'FREE';

  return (
    <div className="min-h-screen bg-surface-views p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal, seguridad y suscripción
            </p>
          </div>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Tu apellido"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="tu@email.com"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Contraseña actual"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nueva contraseña"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmar contraseña"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handlePasswordSave}
                disabled={updatePasswordMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Preferencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Modo Oscuro</div>
                <div className="text-sm text-muted-foreground">
                  Activar tema oscuro para una mejor experiencia visual
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {(() => {
                  const PlanIcon = getPlanIcon(currentPlanName);
                  return <PlanIcon className="w-6 h-6 text-primary" />;
                })()}
                <div>
                  <div className="font-semibold">Plan {currentPlanName}</div>
                  <div className="text-sm text-muted-foreground">
                    {userPlan ? `$${userPlan.price}/mes` : 'Gratis'}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Cambiar Plan
              </Button>
            </div>

            {/* Available Plans */}
            <div className="space-y-3">
              <Label>Planes Disponibles</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePlans.map((plan) => {
                  const PlanIcon = getPlanIcon(plan.name);
                  const isCurrentPlan = plan.name.toLowerCase() === currentPlanName.toLowerCase();
                  
                  return (
                    <div
                      key={plan.id}
                      className={`p-4 border rounded-lg ${
                        isCurrentPlan ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <PlanIcon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{plan.name}</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground">/mes</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {plan.description}
                      </div>
                      {isCurrentPlan ? (
                        <Button variant="outline" size="sm" disabled className="w-full">
                          Plan Actual
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full">
                          Seleccionar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}