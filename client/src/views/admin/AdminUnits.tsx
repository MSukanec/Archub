import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Ruler, Search, Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { unitsService } from '@/lib/unitsService';
import AdminUnitsModal from '@/components/modals/AdminUnitsModal';

export default function AdminUnits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  
  const ITEMS_PER_PAGE = 10;
  const queryClient = useQueryClient();

  // Event listener for floating action button
  useEffect(() => {
    const handleOpenCreateUnitModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateUnitModal', handleOpenCreateUnitModal);
    return () => {
      window.removeEventListener('openCreateUnitModal', handleOpenCreateUnitModal);
    };
  }, []);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (unitId: string) => unitsService.delete(unitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/units'] });
      setIsDeleteDialogOpen(false);
      setSelectedUnit(null);
    },
  });

  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/units'],
    queryFn: () => unitsService.getAll(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Ruler className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Unidades</h1>
            <p className="text-sm text-muted-foreground">Administra todas las unidades del sistema</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar unidades</h3>
            <p className="text-muted-foreground max-w-md">No se pudieron cargar las unidades. Intenta recargar la página.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = (unit: any) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUnit = () => {
    if (selectedUnit) {
      deleteMutation.mutate(selectedUnit.id);
    }
  };

  const filteredAndSortedUnits = units.filter((unit: any) => {
    const matchesSearch = (unit.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (unit.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a: any, b: any) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
  });

  const totalPages = Math.ceil(filteredAndSortedUnits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUnits = filteredAndSortedUnits.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  if (isLoading) {
    return <AdminUnitsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Ruler className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Unidades</h1>
            <p className="text-sm text-muted-foreground">Administra todas las unidades del sistema</p>
          </div>
        </div>

      </div>

      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar unidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl"
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
          


          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal rounded-xl bg-[#e1e1e1] border-[#919191]/20"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {sortOrder === 'newest' ? "Más reciente primero" : "Más antiguo primero"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 bg-[#e1e1e1]">
              <div className="space-y-1">
                <Button
                  variant={sortOrder === 'newest' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortOrder('newest')}
                  className="w-full justify-start text-sm h-8"
                >
                  Más reciente primero
                </Button>
                <Button
                  variant={sortOrder === 'oldest' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortOrder('oldest')}
                  className="w-full justify-start text-sm h-8"
                >
                  Más antiguo primero
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="text-foreground font-semibold h-12 text-center">Símbolo</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Descripción</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4 h-8">
                  {searchTerm 
                    ? 'No se encontraron unidades que coincidan con los filtros.'
                    : 'No hay unidades registradas.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedUnits.map((unit: any) => (
                <TableRow key={unit.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2 text-center">
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded text-sm">
                      {unit.name || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="font-medium text-foreground">{unit.description || unit.name}</div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setIsEditModalOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(unit)}
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
        {filteredAndSortedUnits.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedUnits.length)} de {filteredAndSortedUnits.length} elementos
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente la unidad
              <span className="font-semibold text-foreground"> "{selectedUnit?.name}"</span> y 
              todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-foreground hover:bg-muted rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Unit Modal */}
      <AdminUnitsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Unit Modal */}
      <AdminUnitsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
      />
    </div>
  );
}

function AdminUnitsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-xl animate-pulse"></div>
          <div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <div className="h-10 w-40 bg-muted rounded-xl animate-pulse"></div>
      </div>
      
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-muted rounded-xl animate-pulse"></div>
          <div className="h-10 w-48 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
      
      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted rounded-lg animate-pulse"></div>
                  <div className="h-8 w-8 bg-muted rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}