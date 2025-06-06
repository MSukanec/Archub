import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MonthlyCashflowLineChartProps {
  projectId: string;
}

interface MonthlyData {
  month: string;
  ingresosPesos: number;
  egresosPesos: number;
  ingresosDolares: number;
  egresosDolares: number;
  balancePesos: number;
  balanceDolares: number;
}

export default function MonthlyCashflowLineChart({ projectId }: MonthlyCashflowLineChartProps) {
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['monthly-cashflow', projectId],
    queryFn: async (): Promise<MonthlyData[]> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currencies!inner(code),
          created_at_local,
          movement_concepts!inner(
            parent_concept:parent_id(name)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at_local');

      if (error) throw error;

      const monthlyMap = new Map<string, {
        ingresosPesos: number;
        egresosPesos: number;
        ingresosDolares: number;
        egresosDolares: number;
      }>();

      movements?.forEach((movement: any) => {
        const date = new Date(movement.created_at_local);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const parentConcept = Array.isArray(movement.movement_concepts) 
          ? movement.movement_concepts[0]?.parent_concept?.[0]
          : movement.movement_concepts?.parent_concept;
        const isIncome = parentConcept?.name === 'Ingresos';
        const amount = movement.amount || 0;
        const currencyCode = Array.isArray(movement.currencies) 
          ? movement.currencies[0]?.code 
          : movement.currencies?.code;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            ingresosPesos: 0,
            egresosPesos: 0,
            ingresosDolares: 0,
            egresosDolares: 0
          });
        }

        const monthData = monthlyMap.get(monthKey)!;

        if (currencyCode === 'ARS') {
          if (isIncome) {
            monthData.ingresosPesos += amount;
          } else {
            monthData.egresosPesos += amount;
          }
        } else if (currencyCode === 'USD') {
          if (isIncome) {
            monthData.ingresosDolares += amount;
          } else {
            monthData.egresosDolares += amount;
          }
        }
      });

      return Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('es-AR', { 
            month: 'short', 
            year: 'numeric' 
          }),
          ...data,
          balancePesos: data.ingresosPesos - data.egresosPesos,
          balanceDolares: data.ingresosDolares - data.egresosDolares
        }));
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Flujo de Caja Mensual</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Flujo de Caja Mensual</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </div>
      </Card>
    );
  }

  const formatTooltip = (value: number, name: string) => {
    const currency = name.includes('Dolares') ? 'USD' : 'ARS';
    return [`${currency} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, name];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Flujo de Caja Mensual</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={formatTooltip} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balancePesos" 
              stroke="#8bc34a" 
              strokeWidth={2}
              name="Balance ARS"
            />
            <Line 
              type="monotone" 
              dataKey="balanceDolares" 
              stroke="#4caf50" 
              strokeWidth={2}
              name="Balance USD"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}