import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Lock, CreditCard, Save, Crown, Zap, Rocket, Moon, Sun } from 'lucide-react';
import { useNavigationStore } from "../../stores/navigationStore';
import { useAuthStore } from "../../stores/authStore';
import { useThemeStore } from "../../stores/themeStore';
import { useUserContextStore } from "../../stores/userContextStore';
import { useToast } from "../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ComingSoon from "@/components/ui/ComingSoon";
import AvatarUpload from "../../components/profile/AvatarUpload';
import { supabase } from "../../lib/supabase';
import { useFeatures } from "../../hooks/useFeatures';

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
    setView('profile-main');
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

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();

  return (
    <div className="min-h-screen bg-surface-views p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal y preferencias de cuenta
            </p>
          </div>
        </div>

        {/* Avatar Upload Card */}
        <AvatarUpload currentUser={currentUser} />

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Tu nombre"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Tu apellido"
              />
            </div>

            {/* Full Name (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                disabled
                placeholder="Nombre completo"
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Este campo se genera automáticamente con tu nombre y apellido.
              </p>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <ComingSoon>
                <Input
                  id="age"
                  placeholder="Tu edad"
                  className="cursor-pointer"
                  readOnly
                />
              </ComingSoon>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <ComingSoon>
                <Input
                  id="country"
                  placeholder="Tu país"
                  className="cursor-pointer"
                  readOnly
                />
              </ComingSoon>
            </div>

            {/* Email */}
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


      </div>
    </div>
  );
}