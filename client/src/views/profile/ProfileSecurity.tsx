import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Save, Shield, Mail, MoreHorizontal, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigationStore } from '../../stores/navigationStore';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/use-toast';
import { useLinkedAccounts } from '../../hooks/useLinkedAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { supabase } from '../../lib/supabase';

interface ProviderInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const PROVIDER_CONFIG: Record<string, ProviderInfo> = {
  email: {
    name: 'Email',
    icon: <Mail className="w-5 h-5" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
};

export default function ProfileSecurity() {
  const { setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Linked accounts management
  const {
    linkedAccounts,
    isLoading: isLoadingAccounts,
    unlinkAccount,
    isUnlinking,
    linkGoogleAccount,
    canUnlink,
  } = useLinkedAccounts();

  // Form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('profile-security');
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

  // Helper functions for linked accounts
  const handleUnlinkAccount = (accountId: string) => {
    if (canUnlink) {
      unlinkAccount(accountId);
    }
  };

  const getProviderInfo = (provider: string): ProviderInfo => {
    return PROVIDER_CONFIG[provider.toLowerCase()] || {
      name: provider,
      icon: <div className="w-5 h-5 bg-muted rounded"></div>,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    };
  };

  const hasGoogleAccount = linkedAccounts.some(account => account.provider.toLowerCase() === 'google');

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

        {/* Sign-in Methods Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Métodos de Inicio de Sesión
              </span>
              <Badge variant="secondary" className="text-xs">
                {linkedAccounts.length} vinculado{linkedAccounts.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Personaliza cómo accedes a tu cuenta. Vincula tus perfiles y configura métodos para una autenticación segura y sin interrupciones.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingAccounts ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-20 bg-muted rounded"></div>
                        <div className="h-3 w-32 bg-muted rounded"></div>
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Linked Accounts */}
                {linkedAccounts.map((account) => {
                  const providerInfo = getProviderInfo(account.provider);
                  const formattedDate = format(new Date(account.created_at), 'dd/MM/yyyy', { locale: es });
                  
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${providerInfo.bgColor} rounded-lg flex items-center justify-center ${providerInfo.color}`}>
                          {providerInfo.icon}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {providerInfo.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Vinculado el {formattedDate}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {linkedAccounts.length === 1 && (
                          <Badge variant="outline" className="text-xs">
                            Principal
                          </Badge>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isUnlinking}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleUnlinkAccount(account.id)}
                              disabled={!canUnlink || isUnlinking}
                              className="text-destructive focus:text-destructive"
                            >
                              {isUnlinking ? 'Desvinculando...' : 'Desvincular'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}

                {/* Add Google Account if not linked */}
                {!hasGoogleAccount && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between p-4 border border-dashed border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          {PROVIDER_CONFIG.google.icon}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Google</div>
                          <div className="text-sm text-muted-foreground">
                            Conecta tu cuenta de Google
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={linkGoogleAccount}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Conectar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Info text */}
                {!canUnlink && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <strong>Nota:</strong> Necesitas al menos un método de inicio de sesión vinculado para acceder a tu cuenta.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}