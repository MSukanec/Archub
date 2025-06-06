import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
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
            parent_id
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

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

      const walletMap = new Map<string, { ingresos: number; egresos: number }>();

      movements?.forEach((movement: any) => {
        const currencyCode = movement.currencies?.code;
        const walletName = movement.wallets?.name;
        const walletKey = `${walletName}-${currencyCode}`;
        const concept = movement.movement_concepts;
        const parentConcept = concept?.parent_id ? parentConceptMap.get(concept.parent_id) : null;
        
        // Verificar si es ingreso por el concepto padre o por el concepto mismo
        const isIncome = parentConcept?.name === 'Ingresos' || concept?.name === 'Ingresos';
        const amount = parseFloat(movement.amount) || 0;

        console.log('Processing movement in WalletSummaryTable:', {
          walletName,
          currencyCode,
          amount,
          isIncome,
          conceptName: concept?.name,
          parentConcept: parentConcept?.name,
          hasParentId: !!concept?.parent_id,
          parentConceptCheck: parentConcept?.name === 'Ingresos',
          conceptCheck: concept?.name === 'Ingresos',
          rawMovement: movement
        });

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

      const result = Array.from(walletMap.entries()).map(([key, data]) => {
        const [walletName, currency] = key.split('-');
        const saldo = data.ingresos - data.egresos;
        
        console.log('Wallet summary calculation:', {
          walletName,
          currency,
          ingresos: data.ingresos,
          egresos: data.egresos,
          saldo
        });
        
        return {
          walletName,
          currency,
          ingresos: data.ingresos,
          egresos: data.egresos,
          saldo
        };
      }).sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));
      
      console.log('Final wallet summaries:', result);
      return result;
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