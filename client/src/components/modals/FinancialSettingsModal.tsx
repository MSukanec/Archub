import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Save, X, Wallet } from 'lucide-react';
import { useUserContextStore } from '../../stores/userContextStore';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import ModernModal from '../ui/ModernModal';
import { ModalAccordion } from '../ui/ModernModal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import CurrencyDeleteConfirmModal from './CurrencyDeleteConfirmModal';

const financialSettingsSchema = z.object({
  default_currency: z.string().default('USD'),
  secondary_currencies: z.array(z.string()).default([]),
  default_wallet: z.string().optional(),
  secondary_wallets: z.array(z.string()).default([]),
  default_language: z.string().default('es'),
});

type FinancialSettingsForm = z.infer<typeof financialSettingsSchema>;

interface FinancialSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
];

export default function FinancialSettingsModal({ isOpen, onClose }: FinancialSettingsModalProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    currencies: true,
    wallets: false,
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

  // Fetch all currencies from the database
  const { data: currencies, isLoading: currenciesLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch organization currencies
  const { data: organizationCurrencies } = useQuery({
    queryKey: ['organization-currencies', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          currency_id,
          is_default,
          currencies (code, name, symbol)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Return array of currency codes for secondary currencies (non-default)
      return data?.filter(oc => !oc.is_default).map(oc => oc.currencies?.code).filter(Boolean) || [];
    },
    enabled: !!organizationId && isOpen,
  });

  // Fetch all wallets
  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch organization wallets
  const { data: organizationWallets } = useQuery({
    queryKey: ['organization-wallets', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_wallets')
        .select(`
          wallet_id,
          is_default,
          wallets (id, name, description)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Return array of wallet IDs for secondary wallets (non-default)
      return data?.filter(ow => !ow.is_default).map(ow => ow.wallet_id).filter(Boolean) || [];
    },
    enabled: !!organizationId && isOpen,
  });

  const availableCurrencies = currencies || [];

  const form = useForm<FinancialSettingsForm>({
    resolver: zodResolver(financialSettingsSchema),
    defaultValues: {
      default_currency: 'USD',
      secondary_currencies: [],
      default_wallet: '',
      secondary_wallets: [],
      default_language: 'es',
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (organization && organizationCurrencies !== undefined) {
      const organizationWalletData = organizationWallets || [];
      const defaultWallet = wallets?.find(w => 
        organizationWalletData.some(ow => ow === w.id)
      )?.id || '';

      form.reset({
        default_currency: organization.default_currency || 'USD',
        secondary_currencies: organizationCurrencies || [],
        default_wallet: defaultWallet,
        secondary_wallets: organizationWalletData || [],
        default_language: organization.default_language || 'es',
      });
    }
  }, [organization, organizationCurrencies, organizationWallets, wallets, form]);

  // Delete currency mutation
  const deleteCurrencyMutation = useMutation({
    mutationFn: async ({ currencyCode, replacementCurrency }: { currencyCode: string; replacementCurrency?: string }) => {
      if (!organizationId) throw new Error('No organization ID');

      // Update movements that use this currency to use replacement currency
      if (replacementCurrency) {
        const { data: replacementCurrencyData, error: replacementError } = await supabase
          .from('currencies')
          .select('id')
          .eq('code', replacementCurrency)
          .single();

        if (replacementError) throw replacementError;

        const { data: currentCurrencyData, error: currentError } = await supabase
          .from('currencies')
          .select('id')
          .eq('code', currencyCode)
          .single();

        if (currentError) throw currentError;

        const { error: updateError } = await supabase
          .from('site_movements')
          .update({ currency_id: replacementCurrencyData.id })
          .eq('currency_id', currentCurrencyData.id)
          .eq('organization_id', organizationId);

        if (updateError) throw updateError;
      }

      // Remove from organization currencies
      const { data: currencyData, error: currencyError } = await supabase
        .from('currencies')
        .select('id')
        .eq('code', currencyCode)
        .single();

      if (currencyError) throw currencyError;

      const { error: deleteError } = await supabase
        .from('organization_currencies')
        .delete()
        .eq('organization_id', organizationId)
        .eq('currency_id', currencyData.id);

      if (deleteError) throw deleteError;

      // Update form
      const currentSecondary = form.getValues('secondary_currencies') || [];
      form.setValue('secondary_currencies', currentSecondary.filter(code => code !== currencyCode));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-currencies', organizationId] });
      setIsDeleteModalOpen(false);
      setCurrencyToDelete(null);
      toast({
        description: 'Moneda eliminada correctamente',
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: 'Error al eliminar la moneda. Inténtalo de nuevo.',
        duration: 3000,
      });
    },
  });

  const updateFinancialSettingsMutation = useMutation({
    mutationFn: async (data: FinancialSettingsForm) => {
      if (!organizationId) throw new Error('No organization ID');

      // Update organization
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          default_currency: data.default_currency,
          default_language: data.default_language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);

      if (orgError) throw orgError;

      // Update organization currencies
      const { error: deleteError } = await supabase
        .from('organization_currencies')
        .delete()
        .eq('organization_id', organizationId);

      if (deleteError) throw deleteError;

      const allCurrencyCodes = [data.default_currency, ...(data.secondary_currencies || [])];
      
      if (allCurrencyCodes.length > 0) {
        const { data: currencyData, error: currencyError } = await supabase
          .from('currencies')
          .select('id, code')
          .in('code', allCurrencyCodes);

        if (currencyError) throw currencyError;

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
      if (data.default_wallet || (data.secondary_wallets && data.secondary_wallets.length > 0)) {
        const { error: deleteWalletsError } = await supabase
          .from('organization_wallets')
          .delete()
          .eq('organization_id', organizationId);

        if (deleteWalletsError) throw deleteWalletsError;

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-details', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-currencies', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-wallets', organizationId] });
      toast({
        description: 'Configuración financiera actualizada correctamente',
        duration: 2000,
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating financial settings:', error);
      toast({
        variant: 'destructive',
        description: 'Error al actualizar la configuración financiera',
        duration: 2000,
      });
    },
  });

  const onSubmit = (data: FinancialSettingsForm) => {
    updateFinancialSettingsMutation.mutate(data);
  };

  const handleDeleteCurrency = (currency: { code: string; name: string; symbol: string }) => {
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
      const organizationWalletData = organizationWallets || [];
      const defaultWallet = wallets?.find(w => 
        organizationWalletData.some(ow => ow === w.id)
      )?.id || '';

      form.reset({
        default_currency: organization.default_currency || 'USD',
        secondary_currencies: organizationCurrencies || [],
        default_wallet: defaultWallet,
        secondary_wallets: organizationWalletData || [],
        default_language: organization.default_language || 'es',
      });
    }
    onClose();
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key] = false;
      });
      newState[section] = !prev[section];
      return newState;
    });
  };

  return (
    <>
      <ModernModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Configuración Financiera"
        subtitle="Gestiona monedas, billeteras y configuración regional"
        icon={DollarSign}
        size="lg"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Gestión de Monedas */}
            <ModalAccordion
              id="currencies"
              title="Gestión de Monedas"
              icon={DollarSign}
              isOpen={openSections.currencies}
              onToggle={() => toggleSection('currencies')}
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
                                        e.preventDefault();
                                        e.target.checked = true;
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
              </div>
            </ModalAccordion>

            {/* Gestión de Billeteras */}
            <ModalAccordion
              id="wallets"
              title="Gestión de Billeteras"
              icon={Wallet}
              isOpen={openSections.wallets}
              onToggle={() => toggleSection('wallets')}
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="default_wallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Billetera por Defecto</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
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
                              {wallet.name}
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
                                    {wallet.name}
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
              </div>
            </ModalAccordion>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateFinancialSettingsMutation.isPending}
                className="px-6 bg-primary hover:bg-primary/90"
              >
                {updateFinancialSettingsMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </ModernModal>

      {/* Currency Delete Confirmation Modal */}
      <CurrencyDeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrencyToDelete(null);
        }}
        currency={currencyToDelete}
        availableCurrencies={availableCurrencies.filter(c => 
          c.code !== currencyToDelete?.code && 
          c.code !== organization?.default_currency
        )}
        onConfirm={confirmDeleteCurrency}
      />
    </>
  );
}