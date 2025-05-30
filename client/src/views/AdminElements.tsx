import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Shapes, Search, Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import AdminElementsModal from '@/components/modals/AdminElementsModal';

export default function AdminElements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  
  const ITEMS_PER_PAGE = 10;

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
      const matchesDate = !dateFilter || 
                         format(new Date(element.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
      return matchesSearch && matchesDate;
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
  }, [searchTerm, dateFilter, sortOrder]);

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
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Elementos</h1>
            <p className="text-sm text-muted-foreground">Administra todos los elementos del sistema</p>
          </div>
        </div>

      </div>

      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar elementos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border rounded-xl"
            />
          </div>
          
          <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest' | 'name') => setSortOrder(value)}>
            <SelectTrigger className="w-[160px] rounded-xl border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más reciente primero</SelectItem>
              <SelectItem value="oldest">Más antiguo primero</SelectItem>
              <SelectItem value="name">Por nombre</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal rounded-xl border-border text-sm",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Filtro por fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
              {dateFilter && (
                <div className="p-3 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDateFilter(undefined)}
                    className="w-full"
                  >
                    Limpiar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="text-foreground font-semibold h-12 text-center">Elemento</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedElements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-4 h-8">
                  {searchTerm || dateFilter 
                    ? 'No se encontraron elementos que coincidan con los filtros.'
                    : 'No hay elementos registrados.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedElements.map((element: any) => (
                <TableRow key={element.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2 text-center h-8">
                    <div className="font-medium text-foreground">{element.name}</div>
                  </TableCell>
                  <TableCell className="text-center py-2 h-8">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(element)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(element)}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8 p-0 rounded-lg"
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSortedElements.length)} de {filteredAndSortedElements.length} elementos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
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
                className="rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente el elemento
              <span className="font-semibold text-foreground"> "{selectedElement?.name}"</span> y 
              todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-foreground hover:bg-muted rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedElement(null);
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