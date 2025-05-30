import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { materialCategoriesService, type MaterialCategory } from '@/lib/materialCategoriesService';
import AdminMaterialCategoriesModal from '@/components/modals/AdminMaterialCategoriesModal';

// Skeleton component for loading state
const AdminMaterialCategoriesSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div>
        <div className="h-8 bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-muted rounded w-64"></div>
      </div>
    </div>
    <div className="flex gap-4">
      <div className="h-10 bg-muted rounded flex-1"></div>
      <div className="h-10 bg-muted rounded w-48"></div>
    </div>
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="h-12 bg-muted border-b border-border"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-background border-b border-border last:border-b-0"></div>
      ))}
    </div>
  </div>
);

export default function AdminMaterialCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Listen for create category modal events
  useEffect(() => {
    const handleOpenCreateCategoryModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateCategoryModal', handleOpenCreateCategoryModal);
    
    return () => {
      window.removeEventListener('openCreateCategoryModal', handleOpenCreateCategoryModal);
    };
  }, []);

  // Fetch material categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['/api/material-categories'],
    queryFn: () => materialCategoriesService.getAll(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Handle errors
  if (error) {
    console.error('Error loading material categories:', error);
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialCategoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-categories'] });
      toast({ title: 'Categoría eliminada exitosamente' });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({
        title: 'Error al eliminar categoría',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <AdminMaterialCategoriesSkeleton />
      </div>
    );
  }

  // Handle delete
  const handleDelete = (category: MaterialCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (category: MaterialCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  // Filter and sort categories
  const filteredCategories = categories.filter((category: MaterialCategory) => {
    const matchesSearch = (category.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a: MaterialCategory, b: MaterialCategory) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías de Materiales</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las categorías para organizar tus materiales de construcción
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border rounded-xl"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[200px] justify-start text-left font-normal rounded-xl border-border"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {sortOrder === 'newest' ? "Más reciente primero" : "Más antiguo primero"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="space-y-2">
              <Button
                variant={sortOrder === 'newest' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortOrder('newest')}
                className="w-full justify-start"
              >
                Más reciente primero
              </Button>
              <Button
                variant={sortOrder === 'oldest' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortOrder('oldest')}
                className="w-full justify-start"
              >
                Más antiguo primero
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Categories Table */}
      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-foreground font-semibold text-center h-12">Nombre</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8 h-16">
                  {searchTerm 
                    ? 'No se encontraron categorías que coincidan con los filtros.'
                    : 'No hay categorías registradas.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category: MaterialCategory) => (
                <TableRow key={category.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="py-4 text-center">
                    <div className="font-medium text-foreground">{category.name}</div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category)}
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
      </Card>

      {/* Create Modal */}
      <AdminMaterialCategoriesModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <AdminMaterialCategoriesModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#e0e0e0] border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminará permanentemente la categoría{' '}
              <span className="font-semibold">"{selectedCategory?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCategory(null);
              }}
              className="bg-background border-border text-foreground hover:bg-muted rounded-xl"
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
    </div>
  );
}