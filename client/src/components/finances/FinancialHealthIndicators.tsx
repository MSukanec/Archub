import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';

interface FinancialHealthIndicatorsProps {
  projectId: string;
}

interface HealthIndicator {
  title: string;
  status: 'good' | 'warning' | 'danger';
  message: string;
  icon: any;
}

export default function FinancialHealthIndicators({ projectId }: FinancialHealthIndicatorsProps) {
  const { data: indicators, isLoading } = useQuery({
    queryKey: ['financial-health', projectId],
    queryFn: async (): Promise<HealthIndicator[]> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currency,
          wallets!inner(name),
          movement_concepts!inner(
            parent_concept:parent_id!inner(name)
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const indicators: HealthIndicator[] = [];
      
      // Check wallet balances
      const walletBalances = new Map<string, number>();
      let totalExpenses = 0;
      let totalIncome = 0;
      let recentExpenses = 0; // Last 30 days

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      movements?.forEach(movement => {
        const walletKey = `${movement.wallets.name}-${movement.currency}`;
        const parentConcept = movement.movement_concepts?.parent_concept;
        const isIncome = parentConcept && parentConcept.name === 'Ingresos';
        const amount = movement.amount || 0;

        if (!walletBalances.has(walletKey)) {
          walletBalances.set(walletKey, 0);
        }

        if (isIncome) {
          walletBalances.set(walletKey, walletBalances.get(walletKey)! + amount);
          totalIncome += amount;
        } else {
          walletBalances.set(walletKey, walletBalances.get(walletKey)! - amount);
          totalExpenses += amount;
          
          const movementDate = new Date(movement.created_at);
          if (movementDate >= thirtyDaysAgo) {
            recentExpenses += amount;
          }
        }
      });

      // Negative balance indicator
      const negativeWallets = Array.from(walletBalances.entries()).filter(([_, balance]) => balance < 0);
      if (negativeWallets.length > 0) {
        indicators.push({
          title: 'Billeteras en Rojo',
          status: 'danger',
          message: `${negativeWallets.length} billetera(s) con saldo negativo`,
          icon: XCircle
        });
      } else {
        indicators.push({
          title: 'Billeteras Saludables',
          status: 'good',
          message: 'Todas las billeteras tienen saldo positivo',
          icon: CheckCircle
        });
      }

      // Cash flow indicator
      const cashFlowRatio = totalIncome > 0 ? (totalExpenses / totalIncome) : 0;
      if (cashFlowRatio > 0.9) {
        indicators.push({
          title: 'Flujo de Caja',
          status: 'warning',
          message: 'Gastos muy altos respecto a ingresos',
          icon: AlertTriangle
        });
      } else if (cashFlowRatio > 0.7) {
        indicators.push({
          title: 'Flujo de Caja',
          status: 'warning',
          message: 'Gastos moderados, monitorear de cerca',
          icon: Activity
        });
      } else {
        indicators.push({
          title: 'Flujo de Caja',
          status: 'good',
          message: 'Gastos controlados',
          icon: CheckCircle
        });
      }

      // Recent spending indicator
      const avgMonthlyExpenses = totalExpenses / 6; // Assuming 6 months of data
      if (recentExpenses > avgMonthlyExpenses * 1.5) {
        indicators.push({
          title: 'Gastos Recientes',
          status: 'warning',
          message: 'Gastos últimos 30 días por encima del promedio',
          icon: AlertTriangle
        });
      } else {
        indicators.push({
          title: 'Gastos Recientes',
          status: 'good',
          message: 'Gastos recientes dentro del promedio',
          icon: CheckCircle
        });
      }

      return indicators;
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Indicadores de Salud Financiera</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!indicators || indicators.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Indicadores de Salud Financiera</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">Sin datos suficientes para análisis</p>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'danger': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Indicadores de Salud Financiera</h3>
      </div>
      
      <div className="space-y-3">
        {indicators.map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-surface-primary">
              <div className={`p-2 rounded-full ${getStatusColor(indicator.status)}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{indicator.title}</h4>
                <p className="text-sm text-muted-foreground">{indicator.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}