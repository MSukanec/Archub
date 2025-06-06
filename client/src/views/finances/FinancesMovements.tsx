import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, FileText, Search, Download, ChevronLeft, ChevronRight, X, Filter, Tag, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "../../hooks/use-toast";
import { useUserContextStore } from "../../stores/userContextStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { supabase } from "../../lib/supabase";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MovementModal from "../../components/modals/MovementModal";
import DeleteMovementModal from "../../components/modals/DeleteMovementModal";
import DynamicCurrencyBalanceCard from "../../components/finances/DynamicCurrencyBalanceCard";

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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
          ),
          currencies (
            code,
            name,
            symbol
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
      // Invalidate all financial-related queries
      queryClient.invalidateQueries({ queryKey: ['movements', projectId] });
      queryClient.invalidateQueries({ queryKey: ['timeline-events'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-currency-balance'] });
      queryClient.invalidateQueries({ queryKey: ['unified-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance-pie'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-cashflow'] });
      queryClient.invalidateQueries({ queryKey: ['expense-category-bar'] });
      
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
        const matchesCurrency = currencyFilter === 'all' || movement.currencies?.code === currencyFilter;
        
        // Category filtering
        const categoryName = movement.movement_concepts?.name?.toLowerCase() || '';
        const matchesCategory = categoryFilter === 'all' || categoryName.includes(categoryFilter.toLowerCase());
        
        return matchesDate && matchesType && matchesCurrency && matchesCategory;
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
      // Get currency from currency_id lookup (fallback to ARS for now)
      const target = pesos; // TODO: Implement proper currency lookup based on currency_id
      
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

  const handleExportToExcel = () => {
    toast({
      title: "Exportar Excel",
      description: "Función de exportación en desarrollo",
    });
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un proyecto para ver los movimientos</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 p-6 md:p-6 p-3 space-y-6 md:space-y-6 space-y-3">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Movimientos Financieros
              </h1>
              <p className="text-sm text-muted-foreground">
                Registro financiero del proyecto
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setEditingMovement(null);
              setModalKey(prev => prev + 1);
              setIsMovementModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>



        {/* Dynamic Currency Balance Card */}
        <DynamicCurrencyBalanceCard projectId={projectId} />

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Desktop: Filters first row - Distributed width */}
        <div className="hidden lg:grid grid-cols-5 gap-3 w-full">
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Todas las monedas" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="all">Todas las monedas</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="ingresos">Ingresos</SelectItem>
              <SelectItem value="egresos">Egresos</SelectItem>
              <SelectItem value="ajustes">Ajustes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="movimientos">Movimientos</SelectItem>
              <SelectItem value="cuotas">Cuotas</SelectItem>
              <SelectItem value="herramientas">Herramientas y Equipos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Filtro por fecha" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="year">Por año</SelectItem>
              <SelectItem value="date">Fecha específica</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="newest">Más reciente primero</SelectItem>
              <SelectItem value="oldest">Más antiguo primero</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Search bar second row */}
        <div className="hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tablet/Mobile: Filters first, then search */}
        <div className="lg:hidden space-y-3">


          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile: Compact inline layout - DEPRECATED */}
        <div className="hidden flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-surface-primary border-input rounded-xl shadow-lg h-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>



          <Button
            variant="outline"
            size="sm"
            className="w-9 h-9 bg-surface-secondary border-0 rounded-full hover:bg-muted shadow-lg p-0"
          >
            <Download className="h-4 w-4 text-foreground" />
          </Button>
        </div>

        {/* Legacy filters - hidden now */}
        <div className="hidden">
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Todas las monedas" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="all">Todas las monedas</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="ingresos">Ingresos</SelectItem>
              <SelectItem value="egresos">Egresos</SelectItem>
              <SelectItem value="ajustes">Ajustes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="movimientos">Movimientos</SelectItem>
              <SelectItem value="cuotas">Cuotas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder as any}>
            <SelectTrigger className="bg-surface-primary border-input rounded-xl shadow-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-primary border-input">
              <SelectItem value="newest">Más reciente primero</SelectItem>
              <SelectItem value="oldest">Más antiguo primero</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="bg-surface-secondary border-input rounded-xl hover:bg-muted shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* History Table - Desktop Only */}
      <div className="hidden xl:block rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="text-foreground font-semibold h-12 text-center w-[8%]">Fecha</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center w-[8%]">Tipo</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center w-[16%]">Categoría</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-left">Detalle</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center w-[8%]">Billetera</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center w-[8%]">Moneda</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center w-[8%]">Cantidad</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center w-[8%]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-4 h-8">
                  {searchTerm || currencyFilter !== 'all' || typeFilter !== 'all'
                    ? 'No se encontraron movimientos que coincidan con los filtros.'
                    : 'No hay movimientos registrados.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map((movement) => (
                <TableRow key={movement.id} className="border-border hover:bg-muted/30 transition-colors h-12">
                  <TableCell className="text-center py-1">
                    {(() => {
                      const dateStr = movement.created_at_local || movement.created_at;
                      const dateParts = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                      const [year, month, day] = dateParts.split('-');
                      return `${day}/${month}/${year}`;
                    })()}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge variant="outline" className="bg-muted/50">
                      {movement.movement_concepts?.parent_id ? 
                        movement.movement_concepts.parent_concept?.name || 'Sin tipo'
                        : movement.movement_concepts?.name || 'Sin tipo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge variant="secondary" className="bg-muted/50">
                      {movement.movement_concepts?.name || 'Sin categoría'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left py-1">
                    <div className="font-medium text-foreground truncate max-w-[180px]" title={movement.description}>
                      {movement.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    {movement.wallets?.name || 'Sin billetera'}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge variant="outline" className="bg-muted/50">
                      {movement.currencies?.code || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <span className="text-sm font-medium">
                      {movement.amount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-2">
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
                          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 p-0 rounded-lg"
                          title="Descargar archivo"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(movement)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(movement)}
                        className="text-destructive hover:text-destructive/90 h-8 w-8 p-0 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Paginación */}
        {filteredAndSortedMovements.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedMovements.length)} de {filteredAndSortedMovements.length} elementos
            </div>
            
            {totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-xl border-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0 rounded-lg"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-border"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tablet Cards View */}
      <div className="xl:hidden space-y-3">
        {paginatedMovements.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm || currencyFilter !== 'all' || typeFilter !== 'all'
              ? 'No se encontraron movimientos que coincidan con los filtros.'
              : 'No hay movimientos registrados.'
            }
          </div>
        ) : (
          paginatedMovements.map((movement) => (
            <Card 
              key={movement.id} 
              className="rounded-2xl shadow-md bg-surface-secondary border-0 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => handleEdit(movement)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    movement.movement_concepts?.parent_concept?.name === 'Ingresos' ? 'bg-emerald-500' :
                    movement.movement_concepts?.parent_concept?.name === 'Egresos' ? 'bg-rose-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-xs font-medium text-foreground">
                    {movement.movement_concepts?.parent_concept?.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const dateStr = movement.created_at_local || movement.created_at;
                      const dateParts = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
                      const [year, month, day] = dateParts.split('-');
                      return `${day}/${month}`;
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground truncate max-w-[40%]">
                    {movement.movement_concepts?.name || 'Sin categoría'}
                  </span>
                  <span className="text-xs text-right max-w-[55%] truncate font-medium">
                    {movement.description || 'Sin descripción'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">
                    {movement.wallets?.name || 'Sin billetera'}
                  </span>
                  <span className={`text-sm font-bold ${
                    movement.movement_concepts?.parent_concept?.name === 'Ingresos' ? 'text-primary' :
                    movement.movement_concepts?.parent_concept?.name === 'Egresos' ? 'text-rose-500' :
                    'text-blue-500'
                  }`}>
                    {formatCurrency(movement.amount, movement.currencies?.code || 'ARS')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end mt-2 pt-1 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(movement);
                  }}
                  className="text-destructive hover:text-destructive/90 h-6 w-6 p-0 rounded-lg"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))
        )}

        {/* Mobile Pagination */}
        {filteredAndSortedMovements.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-xl border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground px-2">
              {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-xl border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

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

      {/* Floating Action Button for Mobile and Tablet */}
      <Button
        onClick={() => {
          setEditingMovement(null);
          setModalKey(prev => prev + 1);
          setIsMovementModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 md:hidden w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg p-0 flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  );
}