import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, FileText, Search, Download } from 'lucide-react';
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
  description: string;
  amount: number;
  currency: string;
  related_contact_id?: string;
  related_task_id?: string;
  file_url?: string;
  project_id: string;
  concept_id: string;
  created_at: string;
  updated_at: string;
  // Joined data from movement_concepts
  movement_concepts?: {
    id: string;
    name: string;
    parent_id: string;
    movement_concepts?: {
      id: string;
      name: string;
    };
  };
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
        .select(`
          *,
          movement_concepts!concept_id (
            id,
            name,
            parent_id,
            movement_concepts!parent_id (
              id,
              name
            )
          )
        `)
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
        movement.description?.toLowerCase().includes(searchTermLower) ||
        movement.movement_concepts?.name?.toLowerCase().includes(searchTermLower) ||
        movement.movement_concepts?.movement_concepts?.name?.toLowerCase().includes(searchTermLower) ||
        movement.amount.toString().includes(searchTermLower);
      
      const movementType = movement.movement_concepts?.movement_concepts?.name?.toLowerCase();
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'ingreso' && movementType === 'ingresos') ||
        (typeFilter === 'egreso' && movementType === 'egresos') ||
        (typeFilter === 'ajuste' && movementType === 'ajustes');
      
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
      const movementType = movement.movement_concepts?.movement_concepts?.name?.toLowerCase();
      
      switch (movementType) {
        case 'ingresos':
          target.ingresos += amount;
          break;
        case 'egresos':
          target.egresos += amount;
          break;
        case 'ajustes':
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
        return 'default'; // Will be styled with emerald colors
      case 'egreso':
        return 'destructive'; // Will be styled with rose colors
      case 'ajuste':
        return 'secondary'; // Will be styled with sky colors
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

      {/* Summary Cards - Compact Format */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pesos Argentinos */}
        <Card className="p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>🇦🇷</span>
              Pesos Argentinos (ARS)
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-500">Ingreso:</span>
                <span className="font-medium text-emerald-500">{formatCurrency(totalsByCurrency.pesos.ingresos, 'ARS')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-500">Egreso:</span>
                <span className="font-medium text-rose-500">{formatCurrency(totalsByCurrency.pesos.egresos, 'ARS')}</span>
              </div>
              <hr className="my-1" />
              <div className="flex justify-between">
                <span className={balancePesos >= 0 ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>Balance:</span>
                <span className={`font-bold ${balancePesos >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(balancePesos, 'ARS')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-500">Ajuste:</span>
                <span className="font-medium text-sky-500">{formatCurrency(totalsByCurrency.pesos.ajustes, 'ARS')}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Dólares */}
        <Card className="p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>🇺🇸</span>
              Dólares Estadounidenses (USD)
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-500">Ingreso:</span>
                <span className="font-medium text-emerald-500">{formatCurrency(totalsByCurrency.dolares.ingresos, 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-500">Egreso:</span>
                <span className="font-medium text-rose-500">{formatCurrency(totalsByCurrency.dolares.egresos, 'USD')}</span>
              </div>
              <hr className="my-1" />
              <div className="flex justify-between">
                <span className={balanceDolares >= 0 ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>Balance:</span>
                <span className={`font-bold ${balanceDolares >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(balanceDolares, 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-500">Ajuste:</span>
                <span className="font-medium text-sky-500">{formatCurrency(totalsByCurrency.dolares.ajustes, 'USD')}</span>
              </div>
            </div>
          </div>
        </Card>
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
          {/* Filters inside movements list */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1">
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
                      <Badge 
                        className={
                          movement.movement_concepts?.movement_concepts?.name === 'Ingresos' 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : movement.movement_concepts?.movement_concepts?.name === 'Egresos'
                            ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
                        }
                      >
{movement.movement_concepts?.movement_concepts?.name || 'Sin tipo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.movement_concepts?.name || 'Sin categoría'}</TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell>{movement.currency}</TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {formatCurrency(movement.amount, movement.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {movement.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (movement.file_url) {
                                const { data } = supabase.storage
                                  .from('movement-files')
                                  .getPublicUrl(movement.file_url);
                                window.open(data.publicUrl, '_blank');
                              }
                            }}
                            title="Descargar archivo"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
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