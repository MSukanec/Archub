import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface DynamicCurrencyBalanceCardProps {
  projectId: string;
}

interface CurrencyBalance {
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

export default function DynamicCurrencyBalanceCard({ projectId }: DynamicCurrencyBalanceCardProps) {
  const { data: currencyBalances, isLoading } = useQuery({
    queryKey: ['dynamic-currency-balance', projectId],
    queryFn: async (): Promise<CurrencyBalance[]> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currencies!inner(
            code,
            name,
            symbol
          ),
          movement_concepts!inner(
            parent_concept:parent_id(
              name
            )
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const currencyMap = new Map<string, {
        currencyName: string;
        currencySymbol: string;
        ingresos: number;
        egresos: number;
      }>();

      movements?.forEach((movement: any) => {
        const currency = Array.isArray(movement.currencies) 
          ? movement.currencies[0]
          : movement.currencies;
        const parentConcept = Array.isArray(movement.movement_concepts) 
          ? movement.movement_concepts[0]?.parent_concept?.[0]
          : movement.movement_concepts?.parent_concept;
        
        if (!currency || !parentConcept) return;

        const currencyCode = currency.code;
        const isIncome = parentConcept.name === 'Ingresos';
        const amount = movement.amount || 0;

        if (!currencyMap.has(currencyCode)) {
          currencyMap.set(currencyCode, {
            currencyName: currency.name,
            currencySymbol: currency.symbol,
            ingresos: 0,
            egresos: 0
          });
        }

        const currencyData = currencyMap.get(currencyCode)!;
        if (isIncome) {
          currencyData.ingresos += amount;
        } else {
          currencyData.egresos += amount;
        }
      });

      return Array.from(currencyMap.entries()).map(([code, data]) => ({
        currencyCode: code,
        currencyName: data.currencyName,
        currencySymbol: data.currencySymbol,
        ingresos: data.ingresos,
        egresos: data.egresos,
        balance: data.ingresos - data.egresos
      }));
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!currencyBalances || currencyBalances.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No hay movimientos registrados
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Balance por Moneda</h3>
          <p className="text-sm text-muted-foreground">Resumen financiero del proyecto</p>
        </div>
      </div>

      <div className={`grid gap-12 ${
        currencyBalances.length === 1 ? 'grid-cols-1' :
        currencyBalances.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        currencyBalances.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {currencyBalances.map((currency) => (
          <div key={currency.currencyCode} className="space-y-4">
            {/* Header de moneda */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-surface-secondary rounded-lg flex items-center justify-center text-xs font-semibold text-foreground">
                {currency.currencyCode}
              </div>
              <div>
                <div className="font-medium text-foreground text-sm">{currency.currencyName}</div>
                <div className="text-xs text-muted-foreground">{currency.currencySymbol}</div>
              </div>
            </div>

            {/* Métricas */}
            <div className="space-y-3">
              {/* Ingresos */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                </div>
                <span className="text-sm font-medium text-primary">
                  {currency.currencySymbol} {currency.ingresos.toLocaleString()}
                </span>
              </div>

              {/* Egresos */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-expense" />
                  <span className="text-sm text-muted-foreground">Egresos</span>
                </div>
                <span className="text-sm font-medium text-expense">
                  {currency.currencySymbol} {currency.egresos.toLocaleString()}
                </span>
              </div>

              {/* Balance Total */}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Balance Total</span>
                  <span className={`text-lg font-bold ${
                    currency.balance >= 0 ? 'text-primary' : 'text-expense'
                  }`}>
                    {currency.currencySymbol} {currency.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}