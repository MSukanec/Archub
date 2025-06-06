import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';

interface WalletBalancePieChartProps {
  projectId: string;
}

interface WalletBalance {
  walletName: string;
  balance: number;
  currency: string;
  color: string;
}

const COLORS = ['#8bc34a', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7'];

export default function WalletBalancePieChart({ projectId }: WalletBalancePieChartProps) {
  const { data: walletBalances, isLoading } = useQuery({
    queryKey: ['wallet-balances', projectId],
    queryFn: async (): Promise<WalletBalance[]> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currencies!inner(code),
          wallets!inner(name),
          movement_concepts!inner(
            parent_concept:parent_id(name)
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const walletBalances = new Map<string, { balance: number; currency: string }>();

      movements?.forEach((movement: any) => {
        const currencyCode = Array.isArray(movement.currencies) 
          ? movement.currencies[0]?.code 
          : movement.currencies?.code;
        const walletName = Array.isArray(movement.wallets) 
          ? movement.wallets[0]?.name 
          : movement.wallets?.name;
        const walletKey = `${walletName}-${currencyCode}`;
        const parentConcept = Array.isArray(movement.movement_concepts) 
          ? movement.movement_concepts[0]?.parent_concept?.[0]
          : movement.movement_concepts?.parent_concept;
        const isIncome = parentConcept?.name === 'Ingresos';
        const amount = movement.amount || 0;

        if (!walletBalances.has(walletKey)) {
          walletBalances.set(walletKey, { 
            balance: 0, 
            currency: currencyCode 
          });
        }

        const current = walletBalances.get(walletKey)!;
        current.balance += isIncome ? amount : -amount;
      });

      return Array.from(walletBalances.entries())
        .filter(([_, data]) => data.balance > 0)
        .map(([key, data], index) => ({
          walletName: key.split('-')[0],
          balance: data.balance,
          currency: data.currency,
          color: COLORS[index % COLORS.length]
        }));
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Distribución por Billetera</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!walletBalances || walletBalances.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Distribución por Billetera</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </div>
      </Card>
    );
  }

  const formatTooltip = (value: number, name: string, props: any) => {
    const currency = props.payload.currency;
    return [
      `${currency} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      name
    ];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Wallet className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Distribución por Billetera</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={walletBalances}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="balance"
            >
              {walletBalances.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            <Legend 
              formatter={(value, entry) => 
                `${value} (${entry.payload?.currency || 'N/A'})`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}