import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Building2, MapPin, Phone, Mail, Globe, DollarSign, Save, X, ImageIcon } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ModernModal from '@/components/ui/ModernModal';
import { ModalAccordion } from '@/components/ui/ModernModal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { PhoneInputField } from '@/components/ui/PhoneInput';
import { FileUpload } from '@/components/ui/FileUpload';

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
    branding: false,
    regional: false,
  });

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

  // Fetch organization currencies
  const { data: organizationCurrencies, isLoading: orgCurrenciesLoading } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select('currency_id')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data?.map(oc => oc.currency_id) || [];
    },
    enabled: !!organizationId && isOpen,
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
      default_language: 'es',
      tax_id: '',
      logo_url: '',
    },
  });

  // Update form when organization data loads
  useEffect(() => {
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
  }, [organization, organizationCurrencies, form]);

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

      // Then, insert new organization currencies if any
      if (data.secondary_currencies && data.secondary_currencies.length > 0) {
        const organizationCurrencies = data.secondary_currencies.map(currencyCode => ({
          organization_id: organizationId,
          currency_id: currencyCode,
        }));

        const { error: insertError } = await supabase
          .from('organization_currencies')
          .insert(organizationCurrencies);

        if (insertError) throw insertError;
      }

      return updatedOrg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-details', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-currencies', organizationId] });
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

          {/* Logo y Branding */}
          <ModalAccordion
            id="branding"
            title="Logo y Branding"
            icon={ImageIcon}
            isOpen={openSections.branding}
            onToggle={() => toggleSection('branding')}
          >
            <div className="space-y-4">
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
                      onValueChange={field.onChange}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Monedas Secundarias</FormLabel>
                    <div className="space-y-2">
                      <div className="max-h-40 overflow-y-auto border rounded-xl p-3 bg-surface-secondary">
                        {availableCurrencies.map((currency) => (
                          <div key={currency.code} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={`currency-${currency.code}`}
                              checked={field.value?.includes(currency.code) || false}
                              onChange={(e) => {
                                const currentValues = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentValues, currency.code]);
                                } else {
                                  field.onChange(currentValues.filter(code => code !== currency.code));
                                }
                              }}
                              className="rounded border-input"
                            />
                            <label
                              htmlFor={`currency-${currency.code}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {currency.symbol} {currency.name} ({currency.code})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Idioma por Defecto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10">
                          <SelectValue placeholder="Selecciona un idioma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.name}
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
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">URL del Logo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://..."
                        className="bg-surface-secondary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ModalAccordion>
        </div>
      </Form>
    </ModernModal>
  );
}