import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Building2, MapPin, Phone, Mail, Globe, DollarSign, Save, X, ImageIcon } from 'lucide-react';
import { useUserContextStore } from '../../stores/userContextStore';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import ModernModal from "./components/ui/ModernModal";
import { ModalAccordion } from "./components/ui/ModernModal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./components/ui/form";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Button } from "./components/ui/button";
import AddressAutocomplete from '../components/AddressAutocomplete';
import { PhoneInputField } from "./components/ui/PhoneInput";
import { FileUpload } from "./components/ui/FileUpload";
import CurrencyDeleteConfirmModal from './CurrencyDeleteConfirmModal';

const organizationSettingsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  default_currency: z.string().default('USD'),
  secondary_currencies: z.array(z.string()).default([]),
  default_wallet: z.string().optional(),
  secondary_wallets: z.array(z.string()).default([]),
  default_language: z.string().default('es'),
  tax_id: z.string().optional(),
  logo_url: z.string().optional(),
});

type OrganizationSettingsForm = z.infer<typeof organizationSettingsSchema>;

interface OrganizationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Currencies will be fetched from the database

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
];

export default function OrganizationSettingsModal({ isOpen, onClose }: OrganizationSettingsModalProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    location: false,
    contact: false,
    regional: false,
  });
  const [currencyToDelete, setCurrencyToDelete] = useState<{
    code: string;
    name: string;
    symbol: string;
  } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    enabled: !!organizationId && isOpen,
  });

  // Fetch all currencies from the database with fallback
  const { data: currencies, isLoading: currenciesLoading, error: currenciesError } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
    retry: 1,
  });

  // Fetch all wallets from the database
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fallback currencies if database is not available
  const fallbackCurrencies = [
    { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
    { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
  ];

  const availableCurrencies = currenciesError ? fallbackCurrencies : (currencies || []);

  // Fetch organization currencies with codes
  const { data: organizationCurrencies, isLoading: orgCurrenciesLoading } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          currency_id,
          is_default,
          is_active,
          currencies!inner(code)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Return only non-default currencies (secondary currencies)
      return data?.filter(oc => !oc.is_default).map(oc => oc.currencies.code).filter(Boolean) || [];
    },
    enabled: !!organizationId && isOpen,
    retry: 1,
  });

  // Fetch organization wallets with IDs
  const { data: organizationWallets, isLoading: orgWalletsLoading } = useQuery({
    queryKey: ['organization-wallets', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_wallets')
        .select(`
          wallet_id,
          is_default,
          is_active,
          wallets!inner(id, name, description)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Return only non-default wallets (secondary wallets)
      return data?.filter(ow => !ow.is_default).map(ow => ow.wallet_id).filter(Boolean) || [];
    },
    enabled: !!organizationId && isOpen,
    retry: 1,
  });

  const form = useForm<OrganizationSettingsForm>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      phone: '',
      email: '',
      website: '',
      default_currency: 'USD',
      secondary_currencies: [],
      default_wallet: '',
      secondary_wallets: [],
      default_language: 'es',
      tax_id: '',
      logo_url: '',
    },
  });

  // Update form when organization data loads
  useEffect(() => {
    if (organization && organizationCurrencies !== undefined && organizationWallets !== undefined) {
      form.reset({
        name: organization.name || '',
        description: organization.description || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
        postal_code: organization.postal_code || '',
        phone: organization.phone || '',
        email: organization.email || '',
        website: organization.website || '',
        default_currency: organization.default_currency || 'USD',
        secondary_currencies: organizationCurrencies || [],
        default_wallet: organization.default_wallet || '',
        secondary_wallets: organizationWallets || [],
        default_language: organization.default_language || 'es',
        tax_id: organization.tax_id || '',
        logo_url: organization.logo_url || '',
      });
    }
  }, [organization, organizationCurrencies, organizationWallets, form]);

  // Mutation for deleting currency with replacement
  const deleteCurrencyMutation = useMutation({
    mutationFn: async ({ currencyCode, replacementCurrency }: { currencyCode: string; replacementCurrency?: string }) => {
      if (!organizationId) throw new Error('Organization ID not found');
      
      // Get default currency if no replacement specified
      const finalReplacementCurrency = replacementCurrency || organization?.default_currency;
      if (!finalReplacementCurrency) {
        throw new Error('No replacement currency available');
      }

      // Update all movements that use this currency
      const { error: movementsError } = await supabase
        .from('movements')
        .update({ currency: finalReplacementCurrency })
        .eq('currency', currencyCode);

      if (movementsError) throw movementsError;

      // Get currency ID first
      const { data: currencyData, error: currencyError } = await supabase
        .from('currencies')
        .select('id')
        .eq('code', currencyCode)
        .single();

      if (currencyError) throw currencyError;

      // Remove currency from organization_currencies
      const { error: deleteError } = await supabase
        .from('organization_currencies')
        .delete()
        .eq('organization_id', organizationId)
        .eq('currency_id', currencyData.id);

      if (deleteError) throw deleteError;

      return { currencyCode, replacementCurrency: finalReplacementCurrency };
    },
    onSuccess: ({ currencyCode, replacementCurrency }) => {
      // Update form by removing the deleted currency from secondary currencies
      const currentSecondary = form.getValues('secondary_currencies') || [];
      const updatedSecondary = currentSecondary.filter(code => code !== currencyCode);
      form.setValue('secondary_currencies', updatedSecondary);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['organization-currencies', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      
      toast({
        description: `Moneda ${currencyCode} eliminada. ${replacementCurrency} ahora se usa en movimientos anteriores.`,
        duration: 3000,
      });
      
      setIsDeleteModalOpen(false);
      setCurrencyToDelete(null);
    },
    onError: (error: any) => {
      console.error('Error deleting currency:', error);
      toast({
        variant: 'destructive',
        description: 'Error al eliminar la moneda. Inténtalo de nuevo.',
        duration: 3000,
      });
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationSettingsForm) => {
      if (!organizationId) throw new Error('No organization ID');

      // Update organization
      const { data: updatedOrg, error: orgError } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          description: data.description || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          postal_code: data.postal_code || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          default_currency: data.default_currency,
          default_language: data.default_language,
          tax_id: data.tax_id || null,
          logo_url: data.logo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId)
        .select()
        .single();

      if (orgError) throw orgError;

      // Update organization currencies
      // First, delete existing organization currencies
      const { error: deleteError } = await supabase
        .from('organization_currencies')
        .delete()
        .eq('organization_id', organizationId);

      if (deleteError) throw deleteError;

      // Prepare all currencies to insert (default + secondary)
      const allCurrencyCodes = [data.default_currency, ...(data.secondary_currencies || [])];
      
      if (allCurrencyCodes.length > 0) {
        // Get the currency IDs from the codes
        const { data: currencyData, error: currencyError } = await supabase
          .from('currencies')
          .select('id, code')
          .in('code', allCurrencyCodes);

        if (currencyError) throw currencyError;

        // Validate that we have at least the default currency
        const defaultCurrencyRecord = currencyData?.find(c => c.code === data.default_currency);
        if (!defaultCurrencyRecord) {
          throw new Error('Moneda por defecto no encontrada en la base de datos');
        }

        const organizationCurrencies = currencyData?.map(currency => ({
          organization_id: organizationId,
          currency_id: currency.id,
          is_default: currency.code === data.default_currency,
          is_active: true,
        })) || [];

        if (organizationCurrencies.length > 0) {
          const { error: insertError } = await supabase
            .from('organization_currencies')
            .insert(organizationCurrencies);

          if (insertError) throw insertError;
        }
      }

      // Update organization wallets
      // First, delete existing organization wallets
      if (data.default_wallet || (data.secondary_wallets && data.secondary_wallets.length > 0)) {
        const { error: deleteWalletsError } = await supabase
          .from('organization_wallets')
          .delete()
          .eq('organization_id', organizationId);

        if (deleteWalletsError) throw deleteWalletsError;

        // Prepare all wallets to insert (default + secondary)
        const allWalletIds = [
          ...(data.default_wallet ? [data.default_wallet] : []),
          ...(data.secondary_wallets || [])
        ];
        
        if (allWalletIds.length > 0) {
          const organizationWallets = allWalletIds.map(walletId => ({
            organization_id: organizationId,
            wallet_id: walletId,
            is_default: walletId === data.default_wallet,
            is_active: true,
          }));

          const { error: insertWalletsError } = await supabase
            .from('organization_wallets')
            .insert(organizationWallets);

          if (insertWalletsError) throw insertWalletsError;
        }
      }

      return updatedOrg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-details', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-currencies', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-wallets', organizationId] });
      toast({
        description: 'Configuración de organización actualizada correctamente',
        duration: 2000,
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating organization:', error);
      toast({
        variant: 'destructive',
        description: 'Error al actualizar la configuración',
        duration: 2000,
      });
    },
  });

  const onSubmit = (data: OrganizationSettingsForm) => {
    updateOrganizationMutation.mutate(data);
  };

  const handleDeleteCurrency = (currency: { code: string; name: string; symbol: string }) => {
    // Prevent deletion of default currency
    if (currency.code === organization?.default_currency) {
      toast({
        variant: 'destructive',
        description: 'No puedes eliminar la moneda por defecto. Cambia primero la moneda por defecto.',
        duration: 3000,
      });
      return;
    }

    setCurrencyToDelete(currency);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCurrency = (replacementCurrency?: string) => {
    if (!currencyToDelete) return;
    
    deleteCurrencyMutation.mutate({
      currencyCode: currencyToDelete.code,
      replacementCurrency,
    });
  };

  const handleClose = () => {
    if (organization && organizationCurrencies !== undefined) {
      form.reset({
        name: organization.name || '',
        description: organization.description || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
        postal_code: organization.postal_code || '',
        phone: organization.phone || '',
        email: organization.email || '',
        website: organization.website || '',
        default_currency: organization.default_currency || 'USD',
        secondary_currencies: organizationCurrencies || [],
        default_language: organization.default_language || 'es',
        tax_id: organization.tax_id || '',
        logo_url: organization.logo_url || '',
      });
    }
    onClose();
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newState = { ...prev };
      // Cerrar todas las secciones
      Object.keys(newState).forEach(key => {
        newState[key] = false;
      });
      // Abrir solo la sección clickeada
      newState[section] = !prev[section];
      return newState;
    });
  };

  return (
    <>
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Configuración de Organización"
      subtitle="Gestiona la información y configuración de tu organización"
      icon={Settings}

      confirmText="Guardar Configuración"
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={updateOrganizationMutation.isPending}
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Información General */}
          <ModalAccordion
            id="general"
            title="Información General"
            icon={Building2}
            isOpen={openSections.general}
            onToggle={() => toggleSection('general')}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Nombre de la Organización <span className="text-primary">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">
                      Número de Identificación Fiscal
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="CUIT, RIF, NIT, etc."
                        className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Logo de la Organización</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://ejemplo.com/logo.png"
                        className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>

          {/* Ubicación */}
          <ModalAccordion
            id="location"
            title="Ubicación"
            icon={MapPin}
            isOpen={openSections.location}
            onToggle={() => toggleSection('location')}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Dirección</FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        value={field.value || ''}
                        onChange={(address) => {
                          field.onChange(address);
                        }}
                        onCoordinatesChange={(lat, lng) => {
                          // Opcionalmente almacenar coordenadas si las necesitas
                          console.log('Coordinates:', lat, lng);
                        }}
                        onCityChange={(city) => {
                          form.setValue('city', city);
                        }}
                        onZipCodeChange={(zipCode) => {
                          form.setValue('postal_code', zipCode);
                        }}
                        onStateChange={(state: string) => {
                          form.setValue('state', state);
                        }}
                        onCountryChange={(country: string) => {
                          form.setValue('country', country);
                        }}
                        placeholder="Buscar dirección..."
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Ciudad</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          readOnly
                          className="bg-[#f5f5f5] border-input text-muted-foreground cursor-not-allowed rounded-xl shadow-lg h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Estado/Provincia</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          readOnly
                          className="bg-[#f5f5f5] border-input text-muted-foreground cursor-not-allowed rounded-xl shadow-lg h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">País</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          readOnly
                          className="bg-[#f5f5f5] border-input text-muted-foreground cursor-not-allowed rounded-xl shadow-lg h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Código Postal</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          readOnly
                          className="bg-[#f5f5f5] border-input text-muted-foreground cursor-not-allowed rounded-xl shadow-lg h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ModalAccordion>

          {/* Información de Contacto */}
          <ModalAccordion
            id="contact"
            title="Información de Contacto"
            icon={Phone}
            isOpen={openSections.contact}
            onToggle={() => toggleSection('contact')}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Teléfono</FormLabel>
                    <FormControl>
                      <PhoneInputField
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Ingresa el teléfono de la organización"
                        error={!!fieldState.error}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="correo@organizacion.com"
                        className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Sitio Web</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://miorganizacion.com"
                        className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>



          {/* Configuración Regional */}
          <ModalAccordion
            id="regional"
            title="Configuración Regional"
            icon={DollarSign}
            isOpen={openSections.regional}
            onToggle={() => toggleSection('regional')}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="default_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Moneda por Defecto</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Eliminar de monedas secundarias si está seleccionada
                        const currentSecondary = form.getValues('secondary_currencies') || [];
                        if (currentSecondary.includes(value)) {
                          form.setValue('secondary_currencies', currentSecondary.filter(code => code !== value));
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10">
                          <SelectValue placeholder="Selecciona una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_currencies"
                render={({ field }) => {
                  const defaultCurrency = form.watch('default_currency');
                  const availableSecondary = availableCurrencies.filter(c => c.code !== defaultCurrency);
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">
                        Monedas Secundarias
                        <span className="text-muted-foreground ml-2 text-xs">
                          (Solo monedas no seleccionadas como principal)
                        </span>
                      </FormLabel>
                      
                      {/* Selected currencies chips */}
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-surface-primary rounded-xl border">
                          {field.value.map((currencyCode) => {
                            const currency = availableCurrencies.find(c => c.code === currencyCode);
                            if (!currency) return null;
                            
                            return (
                              <div
                                key={currencyCode}
                                className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
                              >
                                <span>{currency.symbol} {currency.code}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (currency) {
                                      handleDeleteCurrency(currency);
                                    }
                                  }}
                                  className="hover:bg-primary/20 rounded-full p-1 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Available currencies to select */}
                      <div className="space-y-2">
                        <div className="max-h-40 overflow-y-auto border rounded-xl p-3 bg-surface-secondary">
                          {availableSecondary.map((currency) => {
                            const isSelected = Array.isArray(field.value) && field.value.includes(currency.code);
                            
                            return (
                              <div key={currency.code} className="flex items-center space-x-2 py-1">
                                <input
                                  type="checkbox"
                                  id={`currency-${currency.code}`}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const currentValues = Array.isArray(field.value) ? field.value : [];
                                    if (e.target.checked) {
                                      field.onChange([...currentValues, currency.code]);
                                    } else {
                                      // Si se está destildando, mostrar modal de confirmación
                                      e.preventDefault();
                                      e.target.checked = true; // Revertir el cambio temporalmente
                                      handleDeleteCurrency(currency);
                                    }
                                  }}
                                  className="rounded border-input accent-primary text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
                                />
                                <label
                                  htmlFor={`currency-${currency.code}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {currency.symbol} {currency.name} ({currency.code})
                                </label>
                              </div>
                            );
                          })}
                          
                          {availableSecondary.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No hay monedas adicionales disponibles
                            </div>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Wallet Management Section */}
              <div className="border-t border-border pt-4 mt-6">
                <h4 className="text-sm font-medium text-foreground mb-4">Gestión de Billeteras</h4>
                
                <FormField
                  control={form.control}
                  name="default_wallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Billetera por Defecto</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Eliminar de billeteras secundarias si está seleccionada
                          const currentSecondary = form.getValues('secondary_wallets') || [];
                          if (currentSecondary.includes(value)) {
                            form.setValue('secondary_wallets', currentSecondary.filter(id => id !== value));
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10">
                            <SelectValue placeholder="Selecciona una billetera" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets?.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name} {wallet.description && `- ${wallet.description}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_wallets"
                  render={({ field }) => {
                    const defaultWallet = form.watch('default_wallet');
                    const availableSecondary = wallets?.filter(w => w.id !== defaultWallet) || [];
                    
                    return (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">
                          Billeteras Secundarias
                          <span className="text-muted-foreground ml-2 text-xs">
                            (Solo billeteras no seleccionadas como principal)
                          </span>
                        </FormLabel>
                        
                        {/* Selected wallets chips */}
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-surface-primary rounded-xl border">
                            {field.value.map((walletId) => {
                              const wallet = wallets?.find(w => w.id === walletId);
                              if (!wallet) return null;
                              
                              return (
                                <div
                                  key={walletId}
                                  className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
                                >
                                  <span>{wallet.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentValues = field.value || [];
                                      field.onChange(currentValues.filter(id => id !== walletId));
                                    }}
                                    className="hover:bg-primary/20 rounded-full p-1 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Available wallets to select */}
                        <div className="space-y-2">
                          <div className="max-h-40 overflow-y-auto border rounded-xl p-3 bg-surface-secondary">
                            {availableSecondary.map((wallet) => {
                              const isSelected = Array.isArray(field.value) && field.value.includes(wallet.id);
                              
                              return (
                                <div key={wallet.id} className="flex items-center space-x-2 py-1">
                                  <input
                                    type="checkbox"
                                    id={`wallet-${wallet.id}`}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const currentValues = Array.isArray(field.value) ? field.value : [];
                                      if (e.target.checked) {
                                        field.onChange([...currentValues, wallet.id]);
                                      } else {
                                        field.onChange(currentValues.filter(id => id !== wallet.id));
                                      }
                                    }}
                                    className="rounded border-input accent-primary text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
                                  />
                                  <label
                                    htmlFor={`wallet-${wallet.id}`}
                                    className="text-sm cursor-pointer flex-1"
                                  >
                                    {wallet.name} {wallet.description && `- ${wallet.description}`}
                                  </label>
                                </div>
                              );
                            })}
                            
                            {availableSecondary.length === 0 && (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No hay billeteras adicionales disponibles
                              </div>
                            )}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>


            </div>
          </ModalAccordion>
        </div>
      </Form>
    </ModernModal>

    {/* Currency Delete Confirmation Modal */}
    <CurrencyDeleteConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => {
        setIsDeleteModalOpen(false);
        setCurrencyToDelete(null);
      }}
      currencyToDelete={currencyToDelete}
      onConfirm={confirmDeleteCurrency}
    />
    </>
  );
}