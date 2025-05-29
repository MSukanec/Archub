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
import { useNavigationStore } from '@/stores/navigationStore';
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
  wallet_id?: string;
  related_contact_id?: string;
  related_task_id?: string;
  file_url?: string;
  project_id: string;
  concept_id: string;
  created_at: string;
  created_at_local?: string;
  updated_at: string;
  // Joined data from movement_concepts
  movement_concepts?: {
    id: string;
    name: string;
    parent_id: string;
    parent_concept?: {
      id: string;
      name: string;
    };
  };
  // Joined data from wallets
  wallets?: {
    id: string;
    name: string;
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
  const { setSection, setView } = useNavigationStore();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().getFullYear().toString());
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('movements');
    setView('transactions');
  }, [setSection, setView]);

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
          movement_concepts (
            id,
            name,
            parent_id
          ),
          wallets (
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at_local', { ascending: false });
        
      // Obtener información de los conceptos padre para cada movimiento
      if (data && data.length > 0) {
        const parentIds = data
          .map(movement => movement.movement_concepts?.parent_id)
          .filter(Boolean);
        
        if (parentIds.length > 0) {
          const { data: parentConcepts } = await supabase
            .from('movement_concepts')
            .select('id, name')
            .in('id', parentIds);
          
          // Agregar información del concepto padre a cada movimiento
          data.forEach(movement => {
            if (movement.movement_concepts?.parent_id) {
              const parentConcept = parentConcepts?.find(
                p => p.id === movement.movement_concepts.parent_id
              );
              if (parentConcept) {
                movement.movement_concepts.parent_concept = parentConcept;
              }
            }
          });
        }
      }
      
      if (error) {
        console.error('Error fetching movements:', error);
        throw error;
      }
      
      console.log('Movements fetched:', data);
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
      queryClient.invalidateQueries({ queryKey: ['movements', projectId] });
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
      
      // Filter by date
      const movementDate = movement.created_at_local ? new Date(movement.created_at_local) : new Date();
      const movementYear = movementDate.getFullYear();
      const currentYear = new Date().getFullYear();
      
      let matchesDate = true;
      if (dateFilter && dateFilter !== 'all') {
        const filterYear = parseInt(dateFilter);
        if (!isNaN(filterYear)) {
          matchesDate = movementYear === filterYear;
        }
      }
      
      const movementType = movement.movement_concepts?.movement_concepts?.name?.toLowerCase();
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'ingreso' && movementType === 'ingresos') ||
        (typeFilter === 'egreso' && movementType === 'egresos') ||
        (typeFilter === 'ajuste' && movementType === 'ajustes');
      
      return matchesSearch && matchesDate && matchesType;
    });

    // Sort by date (newest first) - ensure sorting is correct
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at_local || a.created_at);
      const dateB = new Date(b.created_at_local || b.created_at);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }, [movements, searchTerm, dateFilter, typeFilter]);

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const pesos = { ingresos: 0, egresos: 0, ajustes: 0 };
    const dolares = { ingresos: 0, egresos: 0, ajustes: 0 };
    
    console.log('Calculating totals for movements:', filteredMovements);
    
    filteredMovements.forEach(movement => {
      const amount = movement.amount;
      const target = movement.currency === 'USD' ? dolares : pesos;
      
      // Obtener el tipo padre correctamente
      let parentType = null;
      
      if (movement.movement_concepts?.parent_id && movement.movement_concepts?.parent_concept) {
        // Si tiene parent_id y tenemos la info del padre, usar el nombre del padre
        parentType = movement.movement_concepts.parent_concept.name?.toLowerCase();
      } else if (!movement.movement_concepts?.parent_id) {
        // Si no tiene parent_id, es un tipo principal
        parentType = movement.movement_concepts?.name?.toLowerCase();
      }
      
      console.log('Processing movement:', {
        amount,
        currency: movement.currency,
        conceptName: movement.movement_concepts?.name,
        parentType,
        hasParentId: !!movement.movement_concepts?.parent_id,
        parentConcept: movement.movement_concepts?.parent_concept
      });
      
      switch (parentType) {
        case 'ingreso':
        case 'ingresos':
          target.ingresos += amount;
          break;
        case 'egreso':
        case 'egresos':
          target.egresos += amount;
          break;
        case 'ajuste':
        case 'ajustes':
          target.ajustes += amount;
          break;
        default:
          console.log('Unknown parent type:', parentType);
      }
    });
    
    console.log('Final totals:', { pesos, dolares });
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
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Movimientos Financieros
            </h1>
            <p className="text-sm text-muted-foreground">
              Registro de ingresos, egresos y ajustes del proyecto
            </p>
          </div>
        </div>

      </div>

      {/* Summary Cards - Modern Professional Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pesos Argentinos */}
        <Card className="rounded-2xl shadow-md bg-[#e1e1e1] p-4 border-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center">
              <span className="text-sm">🇦🇷</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Pesos Argentinos</h3>
              <p className="text-xs text-muted-foreground">ARS</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Ingresos</span>
              </div>
              <span className="text-sm font-bold text-emerald-500">
                {formatCurrency(totalsByCurrency.pesos.ingresos, 'ARS')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3 h-3 text-rose-500" />
                <span className="text-xs text-muted-foreground">Egresos</span>
              </div>
              <span className="text-sm font-bold text-rose-500">
                {formatCurrency(totalsByCurrency.pesos.egresos, 'ARS')}
              </span>
            </div>
            
            <div className="h-px bg-border/50 my-2"></div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Balance Total</span>
              <span className={`text-lg font-bold ${balancePesos >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(balancePesos, 'ARS')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Ajustes</span>
              <span className="text-xs font-medium text-blue-500">
                {formatCurrency(totalsByCurrency.pesos.ajustes, 'ARS')}
              </span>
            </div>
          </div>
        </Card>

        {/* Dólares */}
        <Card className="rounded-2xl shadow-md bg-[#e1e1e1] p-4 border-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <span className="text-sm">🇺🇸</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Dólares Estadounidenses</h3>
              <p className="text-xs text-muted-foreground">USD</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Ingresos</span>
              </div>
              <span className="text-sm font-bold text-emerald-500">
                {formatCurrency(totalsByCurrency.dolares.ingresos, 'USD')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3 h-3 text-rose-500" />
                <span className="text-xs text-muted-foreground">Egresos</span>
              </div>
              <span className="text-sm font-bold text-rose-500">
                {formatCurrency(totalsByCurrency.dolares.egresos, 'USD')}
              </span>
            </div>
            
            <div className="h-px bg-border/50 my-2"></div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Balance Total</span>
              <span className={`text-lg font-bold ${balanceDolares >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(balanceDolares, 'USD')}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Ajustes</span>
              <span className="text-xs font-medium text-blue-500">
                {formatCurrency(totalsByCurrency.dolares.ajustes, 'USD')}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Movements List */}
      <Card className="rounded-2xl shadow-md bg-[#e1e1e1] border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Historial de Movimientos</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Lista completa de todos los movimientos registrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters inside movements list */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all"
              />
            </div>
            <Input
              placeholder="Año (ej: 2024)"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-32 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all">
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="egreso">Egresos</SelectItem>
                <SelectItem value="ajuste">Ajustes</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-xl hover:scale-105 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
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
                  <TableHead>Billetera</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-muted/50">
                    <TableCell>
                      {(() => {
                        const dateStr = movement.created_at_local || movement.created_at;
                        // Parse the date string without timezone conversion
                        const dateParts = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                        const [year, month, day] = dateParts.split('-');
                        return `${day}/${month}/${year}`;
                      })()}
                    </TableCell>
                    <TableCell>
                      {movement.movement_concepts?.parent_id ? 
                        movement.movement_concepts.parent_concept?.name || 'Sin tipo'
                        : movement.movement_concepts?.name || 'Sin tipo'}
                    </TableCell>
                    <TableCell>{movement.movement_concepts?.name || 'Sin categoría'}</TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell>{movement.currency}</TableCell>
                    <TableCell>{movement.wallets?.name || 'Sin billetera'}</TableCell>
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(movement)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar movimiento</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(movement)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar movimiento</span>
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