import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, FileText, Search, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'year' | 'date' | 'custom'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalKey, setModalKey] = useState<number>(0);
  const [modalReady, setModalReady] = useState<boolean>(true);
  
  const ITEMS_PER_PAGE = 10;
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
      if (!modalReady) return; // Prevent opening if modal is not ready
      setEditingMovement(null);
      setModalKey(prev => prev + 1); // Force fresh modal mount
      setIsMovementModalOpen(true);
    };

    window.addEventListener('openCreateMovementModal', handleOpenCreateMovementModal);
    return () => {
      window.removeEventListener('openCreateMovementModal', handleOpenCreateMovementModal);
    };
  }, [modalReady]);

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
    setModalKey(prev => prev + 1); // Force fresh modal mount for editing
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
    setModalReady(false);
    
    // Force modal remount by changing key and adding delay
    setTimeout(() => {
      setModalKey(prev => prev + 1);
      setModalReady(true);
    }, 300);
  };

  // Filter and sort movements with optimized performance
  const filteredMovements = useMemo(() => {
    if (!movements || !Array.isArray(movements)) return [];
    
    try {
      let filtered = movements.filter(movement => {
        if (!movement) return false;
        
        // Optimize search by checking if searchTerm exists first
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
          movement.description?.toLowerCase().includes(searchTermLower) ||
          movement.movement_concepts?.name?.toLowerCase().includes(searchTermLower) ||
          movement.movement_concepts?.parent_concept?.name?.toLowerCase().includes(searchTermLower) ||
          movement.amount?.toString().includes(searchTermLower);
        
        // Early return if search doesn't match to avoid unnecessary processing
        if (!matchesSearch) return false;
        
        // Filter by date with safe error handling
        let matchesDate = true;
        if (filterType !== 'all' && movement.created_at_local) {
          try {
            const movementDate = new Date(movement.created_at_local);
            
            switch (filterType) {
              case 'year':
                if (dateFilter && dateFilter !== 'all') {
                  const filterYear = parseInt(dateFilter);
                  if (!isNaN(filterYear)) {
                    matchesDate = movementDate.getFullYear() === filterYear;
                  }
                }
                break;
              case 'date':
                if (customDate) {
                  const selectedDate = new Date(customDate);
                  const movementDateOnly = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate());
                  const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                  matchesDate = movementDateOnly.getTime() === selectedDateOnly.getTime();
                }
                break;
            }
          } catch (error) {
            matchesDate = true; // Don't filter out due to date parsing errors
          }
        }
        
        // Type filtering with safe property access
        const movementType = movement.movement_concepts?.parent_concept?.name?.toLowerCase();
        const matchesType = typeFilter === 'all' || 
          (typeFilter === 'ingresos' && movementType === 'ingresos') ||
          (typeFilter === 'egresos' && movementType === 'egresos') ||
          (typeFilter === 'ajustes' && movementType === 'ajustes');
        
        // Currency filtering
        const matchesCurrency = currencyFilter === 'all' || movement.currency === currencyFilter;
        
        return matchesDate && matchesType && matchesCurrency;
      });

      // Sort movements with error handling
      return filtered.sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.created_at_local || b.created_at || 0).getTime() - new Date(a.created_at_local || a.created_at || 0).getTime();
        } else {
          return new Date(a.created_at_local || a.created_at || 0).getTime() - new Date(b.created_at_local || b.created_at || 0).getTime();
        }
      });
    } catch (error) {
      console.error('Error filtering movements:', error);
      return [];
    }
  }, [movements, searchTerm, filterType, dateFilter, customDate, typeFilter, currencyFilter, sortOrder]);

  // Paginated movements
  const filteredAndSortedMovements = filteredMovements;
  const totalPages = Math.ceil(filteredAndSortedMovements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMovements = filteredAndSortedMovements.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, currencyFilter, typeFilter, sortOrder]);

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
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(value: 'all' | 'year' | 'date' | 'custom') => {
                setFilterType(value);
                if (value === 'all') {
                  setDateFilter('all');
                  setCustomDate('');
                }
              }}>
                <SelectTrigger className="w-28 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all">
                  <SelectValue placeholder="Filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="year">Año</SelectItem>
                  <SelectItem value="date">Fecha</SelectItem>
                </SelectContent>
              </Select>
              
              {filterType === 'year' && (
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-20 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
              
              {filterType === 'date' && (
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-36 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all"
                />
              )}
            </div>
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

      {/* Movement Modal - Force complete remount */}
      {isMovementModalOpen && modalReady && (
        <MovementModal
          key={`movement-modal-${modalKey}-${editingMovement?.id || 'new'}`}
          isOpen={isMovementModalOpen}
          onClose={handleCloseModal}
          movement={editingMovement}
          projectId={projectId}
        />
      )}

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