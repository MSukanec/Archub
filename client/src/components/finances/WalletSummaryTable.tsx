import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard } from 'lucide-react';

interface WalletSummaryTableProps {
  projectId: string;
}

interface WalletSummary {
  walletName: string;
  currency: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

export default function WalletSummaryTable({ projectId }: WalletSummaryTableProps) {
  const { data: walletSummaries, isLoading } = useQuery({
    queryKey: ['wallet-summary', projectId],
    queryFn: async (): Promise<WalletSummary[]> => {
      const { data: movements, error } = await supabase
        .from('site_movements')
        .select(`
          amount,
          currencies(code),
          wallets(name),
          movement_concepts(
            id,
            name,
            parent_id,
            parent_concept:movement_concepts!parent_id(name)
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const walletMap = new Map<string, { ingresos: number; egresos: number }>();

      movements?.forEach((movement: any) => {
        const currencyCode = movement.currencies?.code;
        const walletName = movement.wallets?.name;
        const walletKey = `${walletName}-${currencyCode}`;
        const parentConcept = movement.movement_concepts?.parent_concept;
        const isIncome = parentConcept?.name === 'Ingresos';
        const amount = movement.amount || 0;

        if (!walletMap.has(walletKey)) {
          walletMap.set(walletKey, { ingresos: 0, egresos: 0 });
        }

        const walletData = walletMap.get(walletKey)!;
        if (isIncome) {
          walletData.ingresos += amount;
        } else {
          walletData.egresos += amount;
        }
      });

      return Array.from(walletMap.entries()).map(([key, data]) => {
        const [walletName, currency] = key.split('-');
        return {
          walletName,
          currency,
          ingresos: data.ingresos,
          egresos: data.egresos,
          saldo: data.ingresos - data.egresos
        };
      }).sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Resumen por Billetera</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-12 bg-muted rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!walletSummaries || walletSummaries.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Resumen por Billetera</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">No hay movimientos registrados</p>
      </Card>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Resumen por Billetera</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Billetera</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Egresos</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {walletSummaries.map((wallet, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{wallet.walletName}</TableCell>
                <TableCell>{wallet.currency}</TableCell>
                <TableCell className="text-right text-primary">
                  {formatCurrency(wallet.ingresos, wallet.currency)}
                </TableCell>
                <TableCell className="text-right text-expense">
                  {formatCurrency(wallet.egresos, wallet.currency)}
                </TableCell>
                <TableCell className={`text-right font-semibold ${
                  wallet.saldo >= 0 ? 'text-primary' : 'text-expense'
                }`}>
                  {formatCurrency(wallet.saldo, wallet.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}