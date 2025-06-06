import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Shapes, Search, Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import AdminElementsModal from '../components/modals/AdminElementsModal';

export default function AdminElements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  
  const ITEMS_PER_PAGE = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('task_elements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/elements'] });
      toast({
        title: "Elemento eliminado",
        description: "El elemento se ha eliminado exitosamente.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedElement(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el elemento.",
        variant: "destructive",
      });
    },
  });

  // Event listener for floating action button
  useEffect(() => {
    const handleOpenCreateElementModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateElementModal', handleOpenCreateElementModal);
    return () => {
      window.removeEventListener('openCreateElementModal', handleOpenCreateElementModal);
    };
  }, []);

  const { data: elements = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/elements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_elements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shapes className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Elementos</h1>
            <p className="text-sm text-muted-foreground">Administra todos los elementos del sistema</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar elementos</h3>
            <p className="text-muted-foreground max-w-md">No se pudieron cargar los elementos. Intenta recargar la página.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = (element: any) => {
    setSelectedElement(element);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (element: any) => {
    setSelectedElement(element);
    setIsEditModalOpen(true);
  };

  const filteredAndSortedElements = elements
    .filter((element: any) => {
      const matchesSearch = (element.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a: any, b: any) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedElements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedElements = filteredAndSortedElements.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  if (isLoading) {
    return <AdminElementsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shapes className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Acciones</h1>
            <p className="text-sm text-muted-foreground">Administra todas las acciones del sistema</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar acciones..."
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
                {sortOrder === 'newest' ? "Más reciente primero" : sortOrder === 'oldest' ? "Más antiguo primero" : "Por nombre"}
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
                <Button
                  variant={sortOrder === 'name' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortOrder('name')}
                  className="w-full justify-start text-sm h-8"
                >
                  Por nombre
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-primary">
              <TableHead className="text-foreground font-semibold h-12 text-center">Elemento</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedElements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-4 h-8">
                  {searchTerm 
                    ? 'No se encontraron elementos que coincidan con los filtros.'
                    : 'No hay elementos registrados.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedElements.map((element: any) => (
                <TableRow key={element.id} className="border-border bg-surface-secondary hover:bg-muted/30 transition-colors">
                  <TableCell className="py-1 text-center h-6">
                    <div className="font-medium text-foreground text-sm">{element.name}</div>
                  </TableCell>
                  <TableCell className="text-center py-1 h-6">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(element)}
                        className="text-muted-foreground hover:text-foreground hover:bg-surface-secondary bg-surface-primary h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(element)}
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
        {filteredAndSortedElements.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedElements.length)} de {filteredAndSortedElements.length} elementos
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
        <AlertDialogContent className="bg-surface-secondary border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente el elemento
              <span className="font-semibold text-foreground"> "{selectedElement?.name}"</span> y 
              todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-surface-primary border-input shadow-lg hover:shadow-xl text-foreground hover:bg-muted rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedElement) {
                  deleteMutation.mutate(selectedElement.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Element Modal */}
      <AdminElementsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Element Modal */}
      <AdminElementsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedElement(null);
        }}
        element={selectedElement}
      />
    </div>
  );
}

function AdminElementsSkeleton() {
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
      
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-muted rounded-xl animate-pulse"></div>
          <div className="h-10 w-48 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
      
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