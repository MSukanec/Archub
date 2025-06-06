import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Package, Search, Plus, Edit, Trash2, DollarSign, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabase";
import { materialsService } from "../../lib/materialsService";
import AdminMaterialsModal from "../../components/modals/AdminMaterialsModal";

export default function AdminMaterials() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;
  
  // State for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => materialsService.delete(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      setIsDeleteDialogOpen(false);
      setSelectedMaterial(null);
    },
  });

  // Event listener for floating action button
  useEffect(() => {
    const handleOpenCreateMaterialModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateMaterialModal', handleOpenCreateMaterialModal);
    return () => {
      window.removeEventListener('openCreateMaterialModal', handleOpenCreateMaterialModal);
    };
  }, []);

  // Fetch materials with units
  const { data: materials = [], isLoading, error } = useQuery({
    queryKey: ['/api/materials'],
    queryFn: () => materialsService.getAll(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Handle errors
  if (error) {
    console.error('Error loading materials:', error);
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Gestión de Materiales
              </h1>
              <p className="text-sm text-muted-foreground">
                Administra todos los materiales del sistema
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Error al cargar materiales
            </h3>
            <p className="text-muted-foreground max-w-md">
              No se pudieron cargar los materiales. Intenta recargar la página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle delete
  const handleDelete = (material: any) => {
    setSelectedMaterial(material);
    setIsDeleteDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (material: any) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedMaterial) {
      deleteMutation.mutate(selectedMaterial.id);
    }
  };

  // Filter, sort and paginate materials
  const filteredAndSortedMaterials = materials.filter((material: any) => {
    const matchesSearch = (material.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.unit?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a: any, b: any) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
  });

  const totalPages = Math.ceil(filteredAndSortedMaterials.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMaterials = filteredAndSortedMaterials.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  if (isLoading) {
    return <AdminMaterialsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Gestión de Materiales
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra todos los materiales del sistema
            </p>
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-surface-primary border-input rounded-xl"
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
                className="w-[200px] justify-start text-left font-normal rounded-xl bg-surface-secondary border-input"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {sortOrder === 'newest' ? "Más reciente primero" : "Más antiguo primero"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 bg-surface-secondary">
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

      {/* Materials Table */}
      <div className="rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-primary">
              <TableHead className="text-foreground font-semibold h-12 text-center">Categoría</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Material</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Unidad</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Precio</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 h-16">
                  {searchTerm 
                    ? 'No se encontraron materiales que coincidan con los filtros.'
                    : 'No hay materiales registrados.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedMaterials.map((material: any) => (
                <TableRow key={material.id} className="border-border bg-surface-secondary hover:bg-muted/30 transition-colors">
                  <TableCell className="text-center py-2">
                    <Badge variant="secondary" className="bg-surface-primary">
                      {material.category?.name || 'Sin categoría'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <div className="font-medium text-foreground">{material.name}</div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <Badge variant="outline" className="bg-surface-primary">
                      {material.unit?.name || 'No especificada'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {material.cost ? material.cost.toFixed(2) : '0.00'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                        className="text-muted-foreground hover:text-foreground hover:bg-surface-secondary bg-surface-primary h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material)}
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
        {filteredAndSortedMaterials.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedMaterials.length)} de {filteredAndSortedMaterials.length} elementos
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-surface-secondary border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente el material
              <span className="font-semibold text-foreground"> "{selectedMaterial?.name}"</span> y 
              todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-surface-primary border-input shadow-lg hover:shadow-xl text-foreground hover:bg-muted rounded-xl"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Material Modal */}
      <AdminMaterialsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Material Modal */}
      <AdminMaterialsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
      />
    </div>
  );
}

function AdminMaterialsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
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
      
      {/* Search skeleton */}
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-muted rounded-xl animate-pulse"></div>
          <div className="h-10 w-48 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
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