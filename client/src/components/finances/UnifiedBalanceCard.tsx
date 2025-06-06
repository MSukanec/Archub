import { useQuery } from '@tanstack/react-query';
import { Card } from './ui/card';
import { DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
      try {
        // Consulta simple para obtener movimientos
        const { data: movements, error } = await supabase
          .from('site_movements')
          .select(`
            amount,
            currencies(code),
            movement_concepts(
              name,
              parent_id
            )
          `)
          .eq('project_id', projectId);

        if (error) {
          console.error('Error fetching movements:', error);
          return {
            totalIncomePesos: 0,
            totalExpensePesos: 0,
            totalIncomeDollars: 0,
            totalExpenseDollars: 0
          };
        }

        // Obtener conceptos padre únicos
        const parentIds = Array.from(new Set(
          movements?.map((m: any) => m.movement_concepts?.parent_id).filter(Boolean)
        )) || [];

        const { data: parentConcepts } = parentIds.length > 0 ? await supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', parentIds) : { data: [] };

        // Crear un mapa de conceptos padre
        const parentConceptMap = new Map();
        parentConcepts?.forEach((parent: any) => {
          parentConceptMap.set(parent.id, parent);
        });

        let totalIncomePesos = 0;
        let totalExpensePesos = 0;
        let totalIncomeDollars = 0;
        let totalExpenseDollars = 0;

        movements?.forEach((movement: any) => {
          const concept = movement.movement_concepts;
          const parentConcept = concept?.parent_id ? parentConceptMap.get(concept.parent_id) : null;
          
          // Verificar si es ingreso
          const isIncome = parentConcept?.name === 'Ingresos' || concept?.name === 'Ingresos';
          const amount = parseFloat(movement.amount) || 0;
          const currencyCode = movement.currencies?.code;

          console.log('Processing movement in UnifiedBalanceCard:', {
            amount,
            currencyCode,
            isIncome,
            conceptName: concept?.name,
            parentConcept: parentConcept?.name,
            parentConceptCheck: parentConcept?.name === 'Ingresos',
            conceptCheck: concept?.name === 'Ingresos'
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
      } catch (error) {
        console.error('Error in balance calculation:', error);
        return {
          totalIncomePesos: 0,
          totalExpensePesos: 0,
          totalIncomeDollars: 0,
          totalExpenseDollars: 0
        };
      }
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

  // Calcular el balance total en USD (asumiendo tasa de cambio aproximada)
  const totalBalanceUSD = dollarsBalance + (pesosBalance / 1000); // Ajustar según tasa real

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">Balance Total del Proyecto</h3>
          <p className="text-sm text-muted-foreground">Equivalente en USD</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            ${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-sm font-medium ${totalBalanceUSD >= 0 ? 'text-primary' : 'text-expense'}`}>
            {totalBalanceUSD >= 0 ? '↗ Positivo' : '↘ Negativo'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <div>
          <h4 className="font-medium text-foreground mb-2">Pesos Argentinos</h4>
          <div className="text-lg font-semibold text-foreground">
            ${pesosBalance.toLocaleString('es-AR')}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-foreground mb-2">Dólares Estadounidenses</h4>
          <div className="text-lg font-semibold text-foreground">
            ${dollarsBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </Card>
  );
}