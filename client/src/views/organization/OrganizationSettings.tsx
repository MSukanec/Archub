import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Building2, MapPin, Phone, Mail, Globe, DollarSign, Save, X } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
  default_language: z.string().default('es'),
  tax_id: z.string().optional(),
  logo_url: z.string().optional(),
});

type OrganizationSettingsForm = z.infer<typeof organizationSettingsSchema>;

const currencies = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
];

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
];

export default function OrganizationSettings() {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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
      default_language: 'es',
      tax_id: '',
      logo_url: '',
    },
  });

  // Update form when organization data loads
  useState(() => {
    if (organization) {
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
        default_language: organization.default_language || 'es',
        tax_id: organization.tax_id || '',
        logo_url: organization.logo_url || '',
      });
    }
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationSettingsForm) => {
      if (!organizationId) throw new Error('No organization ID');

      const { data: updatedOrg, error } = await supabase
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

      if (error) throw error;
      return updatedOrg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-details', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      toast({
        description: 'Configuración de organización actualizada correctamente',
        duration: 2000,
      });
      setIsEditing(false);
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

  const handleCancel = () => {
    if (organization) {
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
        default_language: organization.default_language || 'es',
        tax_id: organization.tax_id || '',
        logo_url: organization.logo_url || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración de Organización</h1>
            <p className="text-muted-foreground">
              Gestiona la información y configuración de tu organización
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateOrganizationMutation.isPending}
                className="bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#919191] border-[#919191]/20 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateOrganizationMutation.isPending}
                className="bg-[#4f9eff] hover:bg-[#3d8bef] text-white border-[#4f9eff] rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateOrganizationMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#4f9eff] hover:bg-[#3d8bef] text-white border-[#4f9eff] rounded-xl"
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar Configuración
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
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
                        disabled={!isEditing}
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
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
                        disabled={!isEditing}
                        rows={3}
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl resize-none"
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
                        disabled={!isEditing}
                        placeholder="CUIT, RIF, NIT, etc."
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Dirección</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
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
                          disabled={!isEditing}
                          className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
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
                          disabled={!isEditing}
                          className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
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
                          disabled={!isEditing}
                          className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
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
                          disabled={!isEditing}
                          className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        type="tel"
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
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
                    <FormLabel className="text-xs font-medium text-foreground">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        type="email"
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
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
                    <FormLabel className="text-xs font-medium text-foreground">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Sitio Web
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing}
                        type="url"
                        placeholder="https://..."
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Configuración Regional */}
          <Card className="rounded-2xl shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-primary" />
                Configuración Regional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="default_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Moneda por Defecto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10">
                          <SelectValue placeholder="Selecciona una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
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
                name="default_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Idioma por Defecto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10">
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
                        disabled={!isEditing}
                        type="url"
                        placeholder="https://..."
                        className="bg-[#e1e1e1] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-lg hover:shadow-xl h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
}