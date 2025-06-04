import { useUserContextStore } from '@/stores/userContextStore';
import UnifiedBalanceCard from '@/components/finances/UnifiedBalanceCard';
import WalletBalancePieChart from '@/components/finances/WalletBalancePieChart';
import MonthlyCashflowLineChart from '@/components/finances/MonthlyCashflowLineChart';
import ExpenseCategoryBarChart from '@/components/finances/ExpenseCategoryBarChart';
import WalletSummaryTable from '@/components/finances/WalletSummaryTable';
import FinancialHealthIndicators from '@/components/finances/FinancialHealthIndicators';
import BalanceForecastWidget from '@/components/finances/BalanceForecastWidget';

export default function FinancesDashboard() {
  const { activeProject } = useUserContextStore();

  if (!activeProject?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un proyecto para ver el dashboard financiero</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Análisis financiero completo del proyecto
          </p>
        </div>
      </div>

      {/* Balance General */}
      <UnifiedBalanceCard projectId={activeProject.id} />

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletBalancePieChart projectId={activeProject.id} />
        <MonthlyCashflowLineChart projectId={activeProject.id} />
      </div>

      {/* Análisis por categorías */}
      <ExpenseCategoryBarChart projectId={activeProject.id} />

      {/* Indicadores y pronósticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialHealthIndicators projectId={activeProject.id} />
        <BalanceForecastWidget projectId={activeProject.id} />
      </div>

      {/* Tabla resumen */}
      <WalletSummaryTable projectId={activeProject.id} />
    </div>
  );
}