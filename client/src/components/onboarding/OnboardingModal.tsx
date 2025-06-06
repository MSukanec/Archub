import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useUserContextStore } from '../../stores/userContextStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building2, User, CheckCircle, Loader2, Upload } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingData {
  organizationName: string;
  country: string;
  age: number | null;
  discoveredBy: string;
  avatarUrl: string;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user } = useAuthStore();
  const userContext = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    organizationName: '',
    country: '',
    age: null,
    discoveredBy: '',
    avatarUrl: ''
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
    { value: 'instagram', label: 'Instagram' },
    { value: 'recommended', label: 'Recomendado' },
    { value: 'other', label: 'Otro' }
  ];

  const predefinedAvatars = [
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=100&h=100&fit=crop&crop=face'
  ];

  const submitOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.organizationName,
          avatar_url: data.avatarUrl || null
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update user preferences to mark onboarding as completed and set organization
      const { error: userPrefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          last_organization_id: organization.id,
          onboarding_completed: true
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
      
      onClose();
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
      if (!data.organizationName.trim()) {
        toast({
          title: "Campo requerido",
          description: "Por favor, ingresa el nombre de la organización",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!data.country || !data.discoveredBy) {
        toast({
          title: "Campos requeridos",
          description: "Por favor, completa todos los campos",
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
          <Label>Avatar de la Organización (Opcional)</Label>
          {data.avatarUrl && (
            <div className="flex justify-center mb-2">
              <img
                src={data.avatarUrl}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
              />
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {predefinedAvatars.map((url, index) => (
              <button
                key={index}
                type="button"
                onClick={() => updateData('avatarUrl', url)}
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
              >
                <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
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

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-primary mb-2" />
        <h3 className="text-lg font-semibold">Confirma tu Configuración</h3>
        <p className="text-sm text-muted-foreground">Paso 3 de 3</p>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <h4 className="font-medium">Organización</h4>
          <div className="flex items-center gap-3">
            {data.avatarUrl && (
              <img src={data.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            )}
            <span className="font-medium">{data.organizationName}</span>
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración Inicial</DialogTitle>
          <DialogDescription>
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
  );
}