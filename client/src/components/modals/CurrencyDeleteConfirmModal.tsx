import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, DollarSign, ArrowRight, Trash2, RefreshCw } from 'lucide-react';
import { useUserContextStore } from '../stores/userContextStore';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';
import ModernModal from '../components/ui/ModernModal';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';

interface CurrencyDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyToDelete: {
    code: string;
    name: string;
    symbol: string;
  } | null;
  onConfirm: (replacementCurrency?: string) => void;
}

export default function CurrencyDeleteConfirmModal({ 
  isOpen, 
  onClose, 
  currencyToDelete,
  onConfirm 
}: CurrencyDeleteConfirmModalProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const [replacementCurrency, setReplacementCurrency] = useState<string>('');
  const [deleteOption, setDeleteOption] = useState<'replace_with_default' | 'replace_with_selected'>('replace_with_default');

  // Get movements count that use this currency
  const { data: movementsCount, isLoading: countLoading } = useQuery({
    queryKey: ['movements-count-by-currency', organizationId, currencyToDelete?.code],
    queryFn: async () => {
      if (!organizationId || !currencyToDelete?.code) return 0;
      
      const { count, error } = await supabase
        .from('movements')
        .select('*', { count: 'exact', head: true })
        .eq('currency', currencyToDelete.code)
        .not('project_id', 'is', null); // Only count movements with valid projects
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId && !!currencyToDelete?.code && isOpen,
  });

  // Get organization's default currency
  const { data: defaultCurrency } = useQuery({
    queryKey: ['organization-default-currency', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('default_currency')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data.default_currency;
    },
    enabled: !!organizationId && isOpen,
  });

  // Get available currencies for replacement (excluding the one being deleted)
  const { data: availableCurrencies } = useQuery({
    queryKey: ['available-replacement-currencies', organizationId, currencyToDelete?.code],
    queryFn: async () => {
      if (!organizationId || !currencyToDelete?.code) return [];
      
      const { data, error } = await supabase
        .from('organization_currencies')
        .select(`
          currencies!inner(code, name, symbol)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .neq('currencies.code', currencyToDelete.code);
      
      if (error) throw error;
      return data?.map(oc => oc.currencies).filter(Boolean) || [];
    },
    enabled: !!organizationId && !!currencyToDelete?.code && isOpen,
  });

  const handleConfirm = () => {
    if (deleteOption === 'replace_with_selected' && !replacementCurrency) {
      toast({
        variant: 'destructive',
        description: 'Debes seleccionar una moneda de reemplazo',
      });
      return;
    }

    const replacement = deleteOption === 'replace_with_default' 
      ? defaultCurrency 
      : replacementCurrency;

    onConfirm(replacement);
  };

  if (!currencyToDelete) return null;

  const isDefaultCurrency = defaultCurrency === currencyToDelete.code;

  const content = (
    <div className="space-y-6">
      {/* Warning Header */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive mt-1" />
            <div className="space-y-2">
              <h3 className="font-semibold text-destructive">
                ¡Atención! Esta acción afectará datos existentes
              </h3>
              <p className="text-sm text-muted-foreground">
                {isDefaultCurrency ? (
                  "No puedes eliminar la moneda por defecto de tu organización. Primero cambia la moneda por defecto a otra antes de eliminar esta."
                ) : (
                  `Estás a punto de eliminar la moneda ${currencyToDelete.symbol} ${currencyToDelete.name} (${currencyToDelete.code}) de tu organización.`
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Information */}
      {!isDefaultCurrency && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <DollarSign className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Movimientos afectados
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {countLoading ? (
                  "Calculando..."
                ) : (
                  `${movementsCount || 0} movimientos financieros utilizan esta moneda`
                )}
              </p>
            </div>
          </div>

          {/* Replacement Options */}
          {(movementsCount || 0) > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">
                ¿Qué hacer con los movimientos existentes?
              </h4>

              <div className="space-y-3">
                {/* Option 1: Replace with default */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    deleteOption === 'replace_with_default' 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setDeleteOption('replace_with_default')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={deleteOption === 'replace_with_default'}
                        onChange={() => setDeleteOption('replace_with_default')}
                        className="accent-primary text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Cambiar a moneda por defecto
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Todos los movimientos pasarán a usar <strong>{defaultCurrency}</strong> (moneda por defecto)
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{currencyToDelete.code}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium">{defaultCurrency}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Option 2: Replace with selected */}
                {availableCurrencies && availableCurrencies.length > 0 && (
                  <Card 
                    className={`cursor-pointer transition-all ${
                      deleteOption === 'replace_with_selected' 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setDeleteOption('replace_with_selected')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={deleteOption === 'replace_with_selected'}
                          onChange={() => setDeleteOption('replace_with_selected')}
                          className="accent-primary text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
                        />
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="font-medium text-sm">
                              Cambiar a otra moneda específica
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Elige manualmente qué moneda usar para reemplazar
                            </p>
                          </div>
                          
                          {deleteOption === 'replace_with_selected' && (
                            <Select 
                              value={replacementCurrency} 
                              onValueChange={setReplacementCurrency}
                            >
                              <SelectTrigger className="bg-surface-secondary border-input">
                                <SelectValue placeholder="Seleccionar moneda de reemplazo" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCurrencies.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.name} ({currency.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="border-t border-border/20 bg-surface-views p-4">
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 bg-surface-secondary border-input text-muted-foreground hover:bg-surface-primary rounded-lg h-10"
        >
          Cancelar
        </Button>
        
        {!isDefaultCurrency && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={countLoading || (deleteOption === 'replace_with_selected' && !replacementCurrency)}
            className="flex-[2] rounded-lg h-10"
          >
            {countLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Calculando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Moneda
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={isDefaultCurrency ? "No se puede eliminar" : "Confirmar eliminación de moneda"}
      subtitle={isDefaultCurrency 
        ? "La moneda por defecto no puede ser eliminada" 
        : `${currencyToDelete.symbol} ${currencyToDelete.name} (${currencyToDelete.code})`
      }
      icon={isDefaultCurrency ? AlertTriangle : Trash2}
      footer={footer}
    >
      {content}
    </ModernModal>
  );
}