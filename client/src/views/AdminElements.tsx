import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { elementsService } from '@/lib/elementsService';
import AdminElementsModal from '@/components/modals/AdminElementsModal';

export default function AdminElements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch elements
  const { data: elements = [], isLoading, error } = useQuery({
    queryKey: ['elements'],
    queryFn: () => elementsService.getAll(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });

  // Handle errors - Show user-friendly message instead of freezing
  if (error) {
    console.error('Error loading elements:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Gestión de Elementos
          </h1>
          <p className="text-muted-foreground">
            Administra los elementos del sistema.
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tabla no disponible
            </h3>
            <p className="text-muted-foreground max-w-md">
              La tabla de elementos no está configurada en la base de datos. 
              Esta funcionalidad estará disponible cuando se complete la configuración.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await elementsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elements'] });
      toast({
        title: 'Elemento eliminado',
        description: 'El elemento se ha eliminado exitosamente.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedElement(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el elemento. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  // Handle edit
  const handleEdit = (element: any) => {
    setSelectedElement(element);
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = (element: any) => {
    setSelectedElement(element);
    setIsDeleteDialogOpen(true);
  };

  // Filter elements based on search (newest first)
  const filteredElements = elements
    .filter((element: any) => {
      const matchesSearch = (element.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a: any, b: any) => b.id - a.id); // Sort by ID descending (newest first)

  if (isLoading) {
    return <AdminElementsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-400">Error al cargar los elementos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Elementos</h1>
          <p className="text-gray-400 mt-1">
            Administra todos los elementos de construcción del sistema.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Elemento
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar elementos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#282828] border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Elements Table */}
      <div className="bg-[#282828] rounded-lg border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-gray-300 h-10">ID</TableHead>
              <TableHead className="text-gray-300 h-10">Nombre</TableHead>
              <TableHead className="text-gray-300 text-right h-10">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredElements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-400 py-6 h-12">
                  {searchTerm 
                    ? 'No se encontraron elementos que coincidan con la búsqueda.'
                    : 'No hay elementos registrados.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredElements.map((element: any) => (
                <TableRow key={element.id} className="border-gray-600 h-12">
                  <TableCell className="py-2">
                    <div className="font-medium text-gray-300">{element.id}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="font-medium text-white">{element.name || 'Sin nombre'}</div>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(element)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(element)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
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
      </div>

      {/* Create Modal */}
      <AdminElementsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <AdminElementsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedElement(null);
        }}
        element={selectedElement}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#282828] border border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Eliminar elemento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente el elemento{' '}
              <span className="font-semibold text-white">"{selectedElement?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedElement && deleteMutation.mutate(selectedElement.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminElementsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-gray-600 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-600 rounded animate-pulse"></div>
      </div>
      
      <div className="h-10 w-80 bg-gray-600 rounded animate-pulse"></div>
      
      <div className="bg-[#282828] rounded-lg border border-gray-600 p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-8 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-600 rounded animate-pulse ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}