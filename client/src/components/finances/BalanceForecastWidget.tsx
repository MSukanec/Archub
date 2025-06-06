import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../components/ui/card';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface BalanceForecastWidgetProps {
  projectId: string;
}

interface ForecastData {
  currentBalance: number;
  monthlyTrend: number;
  projectedBalance: number;
  forecastMonths: number;
  confidence: 'high' | 'medium' | 'low';
}

export default function BalanceForecastWidget({ projectId }: BalanceForecastWidgetProps) {
  const { data: forecast, isLoading } = useQuery({
    queryKey: ['balance-forecast', projectId],
    queryFn: async (): Promise<ForecastData> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currency,
          created_at_local,
          movement_concepts!inner(
            parent_concept:parent_id!inner(name)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at_local');

      if (error) throw error;

      if (!movements || movements.length < 3) {
        return {
          currentBalance: 0,
          monthlyTrend: 0,
          projectedBalance: 0,
          forecastMonths: 3,
          confidence: 'low'
        };
      }

      // Calculate monthly balances for trend analysis (convert all to ARS)
      const monthlyBalances = new Map<string, number>();
      let currentBalance = 0;

      movements.forEach(movement => {
        const date = new Date(movement.created_at_local);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const parentConcept = movement.movement_concepts?.parent_concept;
        const isIncome = parentConcept && parentConcept.name === 'Ingresos';
        let amount = movement.amount || 0;

        // Convert USD to ARS for calculation (approximate rate)
        if (movement.currency === 'USD') {
          amount *= 1000;
        }

        if (!monthlyBalances.has(monthKey)) {
          monthlyBalances.set(monthKey, 0);
        }

        const monthBalance = monthlyBalances.get(monthKey)!;
        if (isIncome) {
          monthlyBalances.set(monthKey, monthBalance + amount);
          currentBalance += amount;
        } else {
          monthlyBalances.set(monthKey, monthBalance - amount);
          currentBalance -= amount;
        }
      });

      // Calculate trend from last 3 months
      const sortedMonths = Array.from(monthlyBalances.entries()).sort(([a], [b]) => a.localeCompare(b));
      const lastThreeMonths = sortedMonths.slice(-3);
      
      let monthlyTrend = 0;
      if (lastThreeMonths.length >= 2) {
        const changes = [];
        for (let i = 1; i < lastThreeMonths.length; i++) {
          const change = lastThreeMonths[i][1] - lastThreeMonths[i - 1][1];
          changes.push(change);
        }
        monthlyTrend = changes.reduce((sum, change) => sum + change, 0) / changes.length;
      }

      // Project balance 3 months ahead
      const forecastMonths = 3;
      const projectedBalance = currentBalance + (monthlyTrend * forecastMonths);

      // Determine confidence based on data consistency
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (movements.length > 10 && lastThreeMonths.length >= 3) {
        const variance = lastThreeMonths.reduce((sum, [_, balance], index) => {
          if (index === 0) return sum;
          const expectedBalance = lastThreeMonths[0][1] + (monthlyTrend * index);
          return sum + Math.abs(balance - expectedBalance);
        }, 0) / Math.max(lastThreeMonths.length - 1, 1);
        
        if (variance < Math.abs(monthlyTrend) * 0.3) {
          confidence = 'high';
        } else if (variance < Math.abs(monthlyTrend) * 0.6) {
          confidence = 'medium';
        }
      }

      return {
        currentBalance,
        monthlyTrend,
        projectedBalance,
        forecastMonths,
        confidence
      };
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Pronóstico de Balance</h3>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse h-12 bg-muted rounded"></div>
          <div className="animate-pulse h-8 bg-muted rounded"></div>
          <div className="animate-pulse h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Pronóstico de Balance</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">Datos insuficientes para pronóstico</p>
      </Card>
    );
  }

  const isPositiveTrend = forecast.monthlyTrend >= 0;
  const confidenceColor = {
    high: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-red-600 bg-red-100'
  }[forecast.confidence];

  const confidenceText = {
    high: 'Alta Confianza',
    medium: 'Confianza Media',
    low: 'Baja Confianza'
  }[forecast.confidence];

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Pronóstico de Balance</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${confidenceColor}`}>
          {confidenceText}
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Current Balance */}
        <div className="text-center p-4 bg-surface-primary rounded-lg">
          <p className="text-sm text-muted-foreground">Balance Actual</p>
          <p className="text-2xl font-bold text-foreground">
            ARS ${forecast.currentBalance.toLocaleString('es-AR')}
          </p>
        </div>

        {/* Monthly Trend */}
        <div className="flex items-center justify-between p-4 bg-surface-primary rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Tendencia Mensual</p>
            <p className={`text-lg font-semibold ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveTrend ? '+' : ''}ARS ${forecast.monthlyTrend.toLocaleString('es-AR')}
            </p>
          </div>
          {isPositiveTrend ? (
            <TrendingUp className="w-8 h-8 text-green-600" />
          ) : (
            <TrendingDown className="w-8 h-8 text-red-600" />
          )}
        </div>

        {/* Projected Balance */}
        <div className="text-center p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            Proyección a {forecast.forecastMonths} meses
          </p>
          <p className={`text-xl font-bold ${
            forecast.projectedBalance >= forecast.currentBalance ? 'text-green-600' : 'text-red-600'
          }`}>
            ARS ${forecast.projectedBalance.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Basado en tendencia actual
          </p>
        </div>
      </div>
    </Card>
  );
}