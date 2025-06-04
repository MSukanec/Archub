import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Building2, MapPin, Phone, Mail, Globe, DollarSign, Edit, CreditCard } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import OrganizationSettingsModal from '@/components/modals/OrganizationSettingsModal';
import FinancialSettingsModal from '@/components/modals/FinancialSettingsModal';

export default function OrganizationSettings() {
  const { organizationId } = useUserContextStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  // Fetch organization data
  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization-details', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    );
  }

  const formatField = (value: string | null | undefined, fallback = 'No especificado') => {
    return value && value.trim() ? value : fallback;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Configuración de Organización</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona la información y configuración de tu organización
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary border-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar Configuración
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información General */}
        <Card className="rounded-2xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Nombre de la Organización</label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {formatField(organization.name)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Descripción</label>
              <div className="p-3 bg-muted rounded-xl text-sm min-h-[80px]">
                {formatField(organization.description)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Número de Identificación Fiscal</label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {formatField(organization.tax_id)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card className="rounded-2xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Dirección</label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {formatField(organization.address)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Ciudad</label>
                <div className="p-3 bg-muted rounded-xl text-sm">
                  {formatField(organization.city)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Estado/Provincia</label>
                <div className="p-3 bg-muted rounded-xl text-sm">
                  {formatField(organization.state)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">País</label>
                <div className="p-3 bg-muted rounded-xl text-sm">
                  {formatField(organization.country)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Código Postal</label>
                <div className="p-3 bg-muted rounded-xl text-sm">
                  {formatField(organization.postal_code)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <Card className="rounded-2xl shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-primary" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Teléfono</label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {formatField(organization.phone)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {formatField(organization.email)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                <Globe className="w-4 h-4 inline mr-1" />
                Sitio Web
              </label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {formatField(organization.website)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración Regional */}
        <Card className="rounded-2xl shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-primary" />
              Configuración Regional
            </CardTitle>
            <Button
              onClick={() => setIsFinancialModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Configurar Finanzas
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Moneda por Defecto</label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {organization.default_currency || 'USD'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Idioma por Defecto</label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {organization.default_language === 'es' ? 'Español' : 
                 organization.default_language === 'en' ? 'English' :
                 organization.default_language === 'pt' ? 'Português' :
                 organization.default_language === 'fr' ? 'Français' :
                 organization.default_language || 'Español'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">URL del Logo</label>
              <div className="p-3 bg-muted rounded-xl text-sm">
                {formatField(organization.logo_url)}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Usa el botón "Configurar Finanzas" para gestionar monedas, billeteras y configuración avanzada.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de edición */}
      <OrganizationSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal de configuración financiera */}
      <FinancialSettingsModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />
    </div>
  );
}