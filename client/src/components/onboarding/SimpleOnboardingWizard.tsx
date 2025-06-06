import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useUserContextStore } from '../../stores/userContextStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Building2, User, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

interface OnboardingData {
  firstName: string;
  lastName: string;
  organizationName: string;
  defaultCurrencyId: string;
  defaultWalletId: string;
  country: string;
  age: number | null;
  discoveredBy: string;
  avatarUrl: string;
}

export function SimpleOnboardingWizard() {
  const { user } = useAuthStore();
  const userContext = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    organizationName: '',
    defaultCurrencyId: '58c50aa7-b8b1-4035-b509-58028dd0e33f',
    defaultWalletId: '2658c575-0fa8-4cf6-85d7-6430ded7e188',
    country: '',
    age: null,
    discoveredBy: '',
    avatarUrl: ''
  });

  // Check if user needs onboarding
  const { data: userOnboarding } = useQuery({
    queryKey: ['user-onboarding-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.log('No user found, onboarding needed');
        return { onboarding_completed: false };
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Auto-open modal if onboarding not completed
  useEffect(() => {
    if (userOnboarding && !userOnboarding.onboarding_completed && !isOpen) {
      setIsOpen(true);
    }
  }, [userOnboarding, isOpen]);

  // Fetch currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const countries = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Ecuador', 
    'Guyana', 'Paraguay', 'Perú', 'Suriname', 'Uruguay', 'Venezuela',
    'México', 'Estados Unidos', 'Canadá', 'España', 'Otro'
  ];

  const discoveredByOptions = [
    { value: 'google', label: 'Google' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'recommended', label: 'Recomendado' },
    { value: 'other', label: 'Otro' }
  ];

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateData('avatarUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      // Get internal user ID
      const { data: internalUser, error: userQueryError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userQueryError || !internalUser) throw new Error('Usuario interno no encontrado');

      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.organizationName,
          is_active: true
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create organization currency relation
      const { error: orgCurrencyError } = await supabase
        .from('organization_currencies')
        .insert({
          organization_id: organization.id,
          currency_id: data.defaultCurrencyId,
          is_active: true,
          is_default: true
        });

      if (orgCurrencyError) throw orgCurrencyError;

      // Create organization wallet relation
      const { error: orgWalletError } = await supabase
        .from('organization_wallets')
        .insert({
          organization_id: organization.id,
          wallet_id: data.defaultWalletId,
          is_active: true,
          is_default: true
        });

      if (orgWalletError) throw orgWalletError;

      // Create organization preferences with default PDF template and avatar
      const { error: orgPrefError } = await supabase
        .from('organization_preferences')
        .insert({
          organization_id: organization.id,
          default_pdf_template_id: 'b6266a04-9b03-4f3a-af2d-f6ee6d0a948b',
          default_avatar_url: data.avatarUrl || null
        });

      if (orgPrefError) throw orgPrefError;

      // Mark user onboarding as completed and update user info
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`.trim()
        })
        .eq('auth_id', user.id);

      if (userUpdateError) throw userUpdateError;

      // Update user preferences to set organization
      const { error: userPrefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: internalUser.id,
          last_organization_id: organization.id
        });

      if (userPrefError) throw userPrefError;

      return organization;
    },
    onSuccess: (organization) => {
      userContext.setOrganizationId(organization.id);
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      toast({
        title: "¡Configuración completada!",
        description: "Tu organización ha sido creada exitosamente.",
      });
      
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Error during onboarding:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!data.organizationName.trim() || !data.defaultCurrencyId || !data.defaultWalletId) {
        toast({
          title: "Campos requeridos",
          description: "Por favor, completa el nombre de la organización, moneda y billetera",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!data.firstName.trim() || !data.lastName.trim() || !data.country || !data.discoveredBy) {
        toast({
          title: "Campos requeridos",
          description: "Por favor, completa tu nombre, apellido, país y cómo conociste Archub",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = () => {
    setIsLoading(true);
    submitOnboarding.mutate();
  };



  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="w-12 h-12 mx-auto text-primary mb-2" />
        <h3 className="text-lg font-semibold">Configura tu Organización</h3>
        <p className="text-sm text-muted-foreground">Paso 1 de 3</p>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
        <p className="text-sm text-primary">
          💡 Todos estos datos podrán ser modificados posteriormente en la configuración de tu organización.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName">Nombre de la Organización</Label>
          <Input
            id="orgName"
            value={data.organizationName}
            onChange={(e) => updateData('organizationName', e.target.value)}
            placeholder="Ej: Constructora ABC"
          />
        </div>

        <div className="space-y-2">
          <Label>Moneda Predeterminada</Label>
          <Select
            value={data.defaultCurrencyId}
            onValueChange={(value) => updateData('defaultCurrencyId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una moneda" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Billetera Predeterminada</Label>
          <Select
            value={data.defaultWalletId}
            onValueChange={(value) => updateData('defaultWalletId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una billetera" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Logo de la Organización (Opcional)</Label>
          {data.avatarUrl && (
            <div className="flex justify-center mb-2">
              <img
                src={data.avatarUrl}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
              />
            </div>
          )}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Subir Imagen
            </Button>
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 mx-auto text-primary mb-2" />
        <h3 className="text-lg font-semibold">Tu Perfil</h3>
        <p className="text-sm text-muted-foreground">Paso 2 de 3</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => updateData('firstName', e.target.value)}
              placeholder="Juan"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => updateData('lastName', e.target.value)}
              placeholder="Pérez"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>País</Label>
          <Select value={data.country} onValueChange={(value) => updateData('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Edad (Opcional)</Label>
          <Input
            id="age"
            type="number"
            min="1"
            max="120"
            value={data.age || ''}
            onChange={(e) => updateData('age', parseInt(e.target.value) || null)}
            placeholder="Ej: 30"
          />
        </div>

        <div className="space-y-2">
          <Label>¿Cómo conociste Archub?</Label>
          <Select value={data.discoveredBy} onValueChange={(value) => updateData('discoveredBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {discoveredByOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedCurrency = currencies.find(c => c.id === data.defaultCurrencyId);
    const selectedWallet = wallets.find(w => w.id === data.defaultWalletId);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-primary mb-2" />
          <h3 className="text-lg font-semibold">Confirma tu Configuración</h3>
          <p className="text-sm text-muted-foreground">Paso 3 de 3</p>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Organización</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {data.avatarUrl && (
                  <img src={data.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                )}
                <span className="font-medium">{data.organizationName}</span>
              </div>
              <p><span className="text-muted-foreground">Moneda:</span> {selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : 'No seleccionada'}</p>
              <p><span className="text-muted-foreground">Billetera:</span> {selectedWallet ? selectedWallet.name : 'No seleccionada'}</p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Tu Perfil</h4>
            <p><span className="text-muted-foreground">País:</span> {data.country}</p>
            {data.age && <p><span className="text-muted-foreground">Edad:</span> {data.age} años</p>}
            <p><span className="text-muted-foreground">Conociste Archub por:</span> {discoveredByOptions.find(opt => opt.value === data.discoveredBy)?.label}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>


      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent 
          hideCloseButton={true}
          className="max-w-md bg-background border-border text-foreground dark:bg-[#1e1e1e] dark:border-gray-700 dark:text-white"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground dark:text-white">Configuración Inicial</DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-gray-300">
              Configura tu espacio de trabajo en Archub
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          <div className="flex justify-between">
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={isLoading}>
                Anterior
              </Button>
            )}
            <div className="flex-1" />
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading || submitOnboarding.isPending}>
                {(isLoading || submitOnboarding.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Confirmar y Continuar'
                )}
              </Button>
            )}
          </div>

          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    step === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}