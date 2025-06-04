import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface UnifiedBalanceCardProps {
  projectId: string;
}

interface BalanceData {
  totalIncomePesos: number;
  totalExpensePesos: number;
  totalIncomeDollars: number;
  totalExpenseDollars: number;
}

export default function UnifiedBalanceCard({ projectId }: UnifiedBalanceCardProps) {
  const { data: balanceData, isLoading, error } = useQuery({
    queryKey: ['unified-balance', projectId],
    queryFn: async (): Promise<BalanceData> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currencies(code),
          movement_concepts(
            name,
            parent_id,
            parent_concept:movement_concepts!parent_id(name)
          )
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching movements for balance:', error);
        return {
          totalIncomePesos: 0,
          totalExpensePesos: 0,
          totalIncomeDollars: 0,
          totalExpenseDollars: 0
        };
      }

      let totalIncomePesos = 0;
      let totalExpensePesos = 0;
      let totalIncomeDollars = 0;
      let totalExpenseDollars = 0;

      movements?.forEach((movement: any) => {
        const parentConcept = movement.movement_concepts?.parent_concept;
        const isIncome = parentConcept?.name === 'Ingresos';
        const amount = parseFloat(movement.amount) || 0;
        const currencyCode = movement.currencies?.code;

        console.log('Processing movement in UnifiedBalanceCard:', {
          amount,
          currencyCode,
          isIncome,
          parentConcept: parentConcept?.name
        });

        if (currencyCode === 'ARS' || currencyCode === 'COP') {
          if (isIncome) {
            totalIncomePesos += amount;
          } else {
            totalExpensePesos += amount;
          }
        } else if (currencyCode === 'USD') {
          if (isIncome) {
            totalIncomeDollars += amount;
          } else {
            totalExpenseDollars += amount;
          }
        }
      });

      console.log('Final balance calculation:', {
        totalIncomePesos,
        totalExpensePesos,
        totalIncomeDollars,
        totalExpenseDollars
      });

      return {
        totalIncomePesos,
        totalExpensePesos,
        totalIncomeDollars,
        totalExpenseDollars
      };
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="animate-pulse h-12 w-12 bg-muted rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="animate-pulse h-4 bg-muted rounded w-1/4"></div>
            <div className="animate-pulse h-6 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Error al cargar datos</h3>
            <p className="text-sm text-muted-foreground">No se pudo obtener el balance del proyecto</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!balanceData) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Balance Total del Proyecto</h3>
            <p className="text-sm text-muted-foreground">No hay movimientos registrados</p>
          </div>
        </div>
      </Card>
    );
  }

  const pesosBalance = balanceData.totalIncomePesos - balanceData.totalExpensePesos;
  const dollarsBalance = balanceData.totalIncomeDollars - balanceData.totalExpenseDollars;

  // Convertir todo a USD (usando tasa aproximada de 1000 ARS = 1 USD)
  const exchangeRate = 1000;
  const pesosInUSD = pesosBalance / exchangeRate;
  const totalUSDBalance = dollarsBalance + pesosInUSD;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Balance Total del Proyecto</h3>
            <p className="text-sm text-muted-foreground">Equivalente en USD</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">
            ${totalUSDBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {totalUSDBalance >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-primary">Positivo</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-expense" />
                <span className="text-expense">Negativo</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-surface-primary rounded-lg">
          <p className="text-sm text-muted-foreground">Pesos Argentinos</p>
          <p className="text-xl font-semibold text-foreground">
            ${pesosBalance.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="text-center p-4 bg-surface-primary rounded-lg">
          <p className="text-sm text-muted-foreground">Dólares Estadounidenses</p>
          <p className="text-xl font-semibold text-foreground">
            ${dollarsBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </Card>
  );
}