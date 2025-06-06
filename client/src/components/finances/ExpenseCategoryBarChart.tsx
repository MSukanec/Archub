import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ExpenseCategoryBarChartProps {
  projectId: string;
}

interface CategoryExpense {
  category: string;
  totalARS: number;
  totalUSD: number;
  total: number;
}

export default function ExpenseCategoryBarChart({ projectId }: ExpenseCategoryBarChartProps) {
  const { data: categoryExpenses, isLoading } = useQuery({
    queryKey: ['expense-categories', projectId],
    queryFn: async (): Promise<CategoryExpense[]> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currencies!inner(code),
          movement_concepts!inner(
            name,
            parent_concept:parent_id!inner(
              name
            )
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const categoryMap = new Map<string, { totalARS: number; totalUSD: number }>();

      movements?.forEach((movement: any) => {
        const parentConcept = Array.isArray(movement.movement_concepts) 
          ? movement.movement_concepts[0]?.parent_concept?.[0]
          : movement.movement_concepts?.parent_concept;
        if (parentConcept && parentConcept.name === 'Egresos') {
          const categoryName = Array.isArray(movement.movement_concepts) 
            ? movement.movement_concepts[0]?.name
            : movement.movement_concepts?.name;
          const amount = movement.amount || 0;
          const currencyCode = Array.isArray(movement.currencies) 
            ? movement.currencies[0]?.code 
            : movement.currencies?.code;

          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, { totalARS: 0, totalUSD: 0 });
          }

          const categoryData = categoryMap.get(categoryName)!;
          if (currencyCode === 'ARS') {
            categoryData.totalARS += amount;
          } else if (currencyCode === 'USD') {
            categoryData.totalUSD += amount;
          }
        }
      });

      return Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category: category.length > 20 ? category.substring(0, 20) + '...' : category,
          totalARS: data.totalARS,
          totalUSD: data.totalUSD,
          total: data.totalARS + (data.totalUSD * 1000) // Convert USD to ARS for sorting
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8); // Top 8 categories
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Gastos por Categoría</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!categoryExpenses || categoryExpenses.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Gastos por Categoría</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No hay datos de gastos disponibles</p>
        </div>
      </Card>
    );
  }

  const formatTooltip = (value: number, name: string) => {
    const currency = name === 'totalARS' ? 'ARS' : 'USD';
    return [`${currency} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, currency];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Gastos por Categoría</h3>
        <span className="text-sm text-muted-foreground">(Top 8)</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryExpenses} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="category" type="category" width={100} />
            <Tooltip formatter={formatTooltip} />
            <Bar dataKey="totalARS" fill="#8bc34a" name="ARS" />
            <Bar dataKey="totalUSD" fill="#4caf50" name="USD" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}