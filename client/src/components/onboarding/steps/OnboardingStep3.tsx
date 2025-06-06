import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { useUserContextStore } from '../../stores/userContextStore';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { CheckCircle, Edit3, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

export function OnboardingStep3() {
  const { data, updateData, previousStep, closeModal, setLoading, isLoading } = useOnboardingStore();
  const { user } = useAuthStore();
  const userContext = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<string | null>(null);

  // Fetch reference data for display
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('currencies').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wallets').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: pdfTemplates = [] } = useQuery({
    queryKey: ['pdf_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pdf_templates').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const selectedCurrency = currencies.find(c => c.id === data.defaultCurrencyId);
  const selectedWallet = wallets.find(w => w.id === data.defaultWalletId);
  const selectedTemplate = pdfTemplates.find(t => t.id === data.pdfTemplateId);

  const submitOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      // Step 1: Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.organizationName,
          avatar_url: data.avatarUrl || null
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Step 2: Insert organization preferences
      const { error: orgPrefError } = await supabase
        .from('organization_preferences')
        .upsert({
          organization_id: organization.id,
          default_currency_id: data.defaultCurrencyId,
          default_wallet_id: data.defaultWalletId,
          pdf_template_id: data.pdfTemplateId
        });

      if (orgPrefError) throw orgPrefError;

      // Step 3: Insert user profile data
      const { error: profileError } = await supabase
        .from('user_profile_data')
        .upsert({
          user_id: user.id,
          country: data.country,
          age: data.age,
          discovered_by: data.discoveredBy
        });

      if (profileError) throw profileError;

      // Step 4: Update user preferences to mark onboarding as completed
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
      
      closeModal();
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

  const handleSubmit = () => {
    setLoading(true);
    submitOnboarding.mutate();
  };

  const discoveredByLabels = {
    'google': 'Google',
    'instagram': 'Instagram',
    'recommended': 'Recomendado',
    'other': 'Otro'
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 mx-auto text-primary mb-2" />
        <h2 className="text-2xl font-bold text-foreground">Confirma tu Configuración</h2>
        <p className="text-muted-foreground mt-2">
          Paso 3 de 3: Revisa y confirma la información
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization Data Summary */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Datos de la Organización</h3>
          
          {/* Organization Name */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Nombre</Label>
              {editingField === 'organizationName' ? (
                <Input
                  value={data.organizationName}
                  onChange={(e) => updateData('organizationName', e.target.value)}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                  autoFocus
                />
              ) : (
                <p className="font-medium">{data.organizationName}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingField('organizationName')}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Moneda</Label>
              <p className="font-medium">
                {selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : 'No seleccionada'}
              </p>
            </div>
          </div>

          {/* Wallet */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Billetera</Label>
              <p className="font-medium">
                {selectedWallet ? selectedWallet.name : 'No seleccionada'}
              </p>
            </div>
          </div>

          {/* PDF Template */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Template PDF</Label>
              <p className="font-medium">
                {selectedTemplate ? selectedTemplate.name : 'No seleccionado'}
              </p>
            </div>
          </div>

          {/* Avatar */}
          {data.avatarUrl && (
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground">Avatar</Label>
              <img
                src={data.avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border"
              />
            </div>
          )}
        </div>

        {/* User Profile Data Summary */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Tu Perfil</h3>
          
          {/* Country */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">País</Label>
              <p className="font-medium">{data.country}</p>
            </div>
          </div>

          {/* Age */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Edad</Label>
              {editingField === 'age' ? (
                <Input
                  type="number"
                  value={data.age || ''}
                  onChange={(e) => updateData('age', parseInt(e.target.value) || null)}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                  autoFocus
                />
              ) : (
                <p className="font-medium">{data.age} años</p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingField('age')}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>

          {/* Discovered By */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Conociste Archub por</Label>
              <p className="font-medium">{discoveredByLabels[data.discoveredBy as keyof typeof discoveredByLabels] || data.discoveredBy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={previousStep} disabled={isLoading || submitOnboarding.isPending}>
          Anterior
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="px-8"
          disabled={isLoading || submitOnboarding.isPending}
        >
          {(isLoading || submitOnboarding.isPending) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Confirmar y Continuar'
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mt-6">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}