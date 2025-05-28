import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MovementModal from '@/components/modals/MovementModal';
import DeleteMovementModal from '@/components/modals/DeleteMovementModal';

interface Movement {
  id: string;
  date: string;
  type: 'ingreso' | 'egreso' | 'ajuste';
  category: string;
  description: string;
  amount: number;
  currency: string;
  related_contact_id?: string;
  related_task_id?: string;
  file_url?: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  contact?: {
    id: string;
    name: string;
    company_name?: string;
  };
  task?: {
    id: string;
    name: string;
  };
}

export default function Movements() {
  const { projectId } = useUserContextStore();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateMovementModal = () => {
      setEditingMovement(null);
      setIsMovementModalOpen(true);
    };

    window.addEventListener('openCreateMovementModal', handleOpenCreateMovementModal);
    return () => {
      window.removeEventListener('openCreateMovementModal', handleOpenCreateMovementModal);
    };
  }, []);

  // Fetch movements for current project
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('site_movements')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Movement[];
    },
    enabled: !!projectId,
  });

  // Delete movement mutation
  const deleteMovementMutation = useMutation({
    mutationFn: async (movementId: string) => {
      const { error } = await supabase
        .from('site_movements')
        .delete()
        .eq('id', movementId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movements', projectId] });
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      console.error('Error al eliminar movimiento:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el movimiento. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (movement: Movement) => {
    setEditingMovement(movement);
    setIsMovementModalOpen(true);
  };

  const handleDelete = (movement: Movement) => {
    setMovementToDelete(movement);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (movementToDelete) {
      deleteMovementMutation.mutate(movementToDelete.id);
      setIsDeleteModalOpen(false);
      setMovementToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsMovementModalOpen(false);
    setEditingMovement(null);
  };

  // Filter and sort movements
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    
    let filtered = movements.filter(movement => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        movement.description.toLowerCase().includes(searchTermLower) ||
        movement.category.toLowerCase().includes(searchTermLower) ||
        movement.type.toLowerCase().includes(searchTermLower) ||
        movement.amount.toString().includes(searchTermLower);
      
      const matchesType = typeFilter === 'all' || movement.type === typeFilter;
      
      return matchesSearch && matchesType;
    });

    // Sort by date (newest first) - data is already sorted from query
    return filtered;
  }, [movements, searchTerm, typeFilter]);

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const pesos = { ingresos: 0, egresos: 0, ajustes: 0 };
    const dolares = { ingresos: 0, egresos: 0, ajustes: 0 };
    
    filteredMovements.forEach(movement => {
      const amount = movement.amount;
      const target = movement.currency === 'USD' ? dolares : pesos;
      
      switch (movement.type) {
        case 'ingreso':
          target.ingresos += amount;
          break;
        case 'egreso':
          target.egresos += amount;
          break;
        case 'ajuste':
          target.ajustes += amount;
          break;
      }
    });
    
    return { pesos, dolares };
  }, [filteredMovements]);

  const balancePesos = totalsByCurrency.pesos.ingresos - totalsByCurrency.pesos.egresos + totalsByCurrency.pesos.ajustes;
  const balanceDolares = totalsByCurrency.dolares.ingresos - totalsByCurrency.dolares.egresos + totalsByCurrency.dolares.ajustes;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ingreso':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'egreso':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'ajuste':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'ingreso':
        return 'default';
      case 'egreso':
        return 'destructive';
      case 'ajuste':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un proyecto para ver los movimientos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimientos Financieros</h1>
          <p className="text-muted-foreground">
            Registro de ingresos, egresos y ajustes del proyecto
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar movimientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de movimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="ingreso">Ingresos</SelectItem>
            <SelectItem value="egreso">Egresos</SelectItem>
            <SelectItem value="ajuste">Ajustes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards - Separated by Currency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pesos Argentinos */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-2xl">🇦🇷</span>
            Pesos Argentinos (ARS)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalsByCurrency.pesos.ingresos, 'ARS')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalsByCurrency.pesos.egresos, 'ARS')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ajustes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalsByCurrency.pesos.ajustes, 'ARS')}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${balancePesos >= 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${balancePesos >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  <DollarSign className="h-4 w-4" />
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${balancePesos >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(balancePesos, 'ARS')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dólares */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-2xl">🇺🇸</span>
            Dólares Estadounidenses (USD)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalsByCurrency.dolares.ingresos, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalsByCurrency.dolares.egresos, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ajustes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalsByCurrency.dolares.ajustes, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${balanceDolares >= 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${balanceDolares >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  <DollarSign className="h-4 w-4" />
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${balanceDolares >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(balanceDolares, 'USD')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            Lista completa de todos los movimientos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Cargando movimientos...</p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No hay movimientos registrados</p>
              <p className="text-sm text-muted-foreground">
                Comienza agregando tu primer movimiento
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-muted/50">
                    <TableCell>
                      {format(new Date(movement.created_at), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(movement.type)}
                        <Badge variant={getTypeBadgeVariant(movement.type)}>
                          {movement.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{movement.category}</TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell>{movement.currency}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        movement.type === 'ingreso' ? 'text-green-600' : 
                        movement.type === 'egreso' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {formatCurrency(movement.amount, movement.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(movement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(movement)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Movement Modal */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={handleCloseModal}
        movement={editingMovement}
        projectId={projectId}
      />

      {/* Delete Movement Modal */}
      <DeleteMovementModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        movement={movementToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}