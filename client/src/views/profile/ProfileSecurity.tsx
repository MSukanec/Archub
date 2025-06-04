import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Save, Shield } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

export default function ProfileSecurity() {
  const { setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Form state
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

  return (
    <div className="min-h-screen bg-surface-views p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Seguridad</h1>
            <p className="text-muted-foreground">
              Gestiona la seguridad de tu cuenta y contraseña
            </p>
          </div>
        </div>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Cambiar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
      </div>
    </div>
  );
}