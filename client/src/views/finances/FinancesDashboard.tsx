import { useUserContextStore } from '@/stores/userContextStore';
import { DollarSign } from 'lucide-react';
import ArchubLayout from '@/components/layout/ArchubLayout';
import UnifiedBalanceCard from '@/components/finances/UnifiedBalanceCard';
import WalletBalancePieChart from '@/components/finances/WalletBalancePieChart';
import MonthlyCashflowLineChart from '@/components/finances/MonthlyCashflowLineChart';
import ExpenseCategoryBarChart from '@/components/finances/ExpenseCategoryBarChart';
import WalletSummaryTable from '@/components/finances/WalletSummaryTable';
import FinancialHealthIndicators from '@/components/finances/FinancialHealthIndicators';
import BalanceForecastWidget from '@/components/finances/BalanceForecastWidget';

export default function FinancesDashboard() {
  const { projectId } = useUserContextStore();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un proyecto para ver el dashboard financiero</p>
      </div>
    );
  }

  return (
    <ArchubLayout>
      <div className="flex-1 p-6 md:p-6 p-3 space-y-6 md:space-y-6 space-y-3">
        {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Dashboard Financiero
            </h1>
            <p className="text-sm text-muted-foreground">
              Análisis completo del proyecto
            </p>
          </div>
        </div>
      </div>

      {/* Balance General */}
      <UnifiedBalanceCard projectId={projectId} />

      {/* Tabla resumen de billeteras */}
      <WalletSummaryTable projectId={projectId} />

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletBalancePieChart projectId={projectId} />
        <MonthlyCashflowLineChart projectId={projectId} />
      </div>

      {/* Análisis por categorías */}
      <ExpenseCategoryBarChart projectId={projectId} />

      {/* Indicadores y pronósticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialHealthIndicators projectId={projectId} />
        <BalanceForecastWidget projectId={projectId} />
        </div>
      </div>
    </ArchubLayout>
  );
}