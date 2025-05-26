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
import { unitsService } from '@/lib/unitsService';
import AdminUnitsModal from '@/components/modals/AdminUnitsModal';

export default function AdminUnits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch units
  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ['/api/units'],
    queryFn: () => unitsService.getAll(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await unitsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      toast({
        title: 'Unidad eliminada',
        description: 'La unidad se ha eliminado exitosamente.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedUnit(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la unidad. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  // Handle edit
  const handleEdit = (unit: any) => {
    setSelectedUnit(unit);
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = (unit: any) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  // Filter units based on search
  const filteredUnits = units.filter((unit: any) => {
    const matchesSearch = (unit.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (unit.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return <AdminUnitsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-400">Error al cargar las unidades</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Unidades</h1>
          <p className="text-gray-400 mt-1">
            Administra todas las unidades de medida del sistema.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#4f9eff] hover:bg-[#3a8bef]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Unidad
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar unidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#282828] border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-[#282828] rounded-lg border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-gray-300 h-10">ID</TableHead>
              <TableHead className="text-gray-300 h-10">Nombre</TableHead>
              <TableHead className="text-gray-300 h-10">Descripción</TableHead>
              <TableHead className="text-gray-300 text-right h-10">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-6 h-12">
                  {searchTerm 
                    ? 'No se encontraron unidades que coincidan con la búsqueda.'
                    : 'No hay unidades registradas.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit: any) => (
                <TableRow key={unit.id} className="border-gray-600 h-12">
                  <TableCell className="py-2">
                    <div className="font-medium text-gray-300">{unit.id}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="font-medium text-white">{unit.name || 'Sin nombre'}</div>
                  </TableCell>
                  <TableCell className="text-gray-300 py-2">
                    {unit.description || '-'}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(unit)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(unit)}
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
      <AdminUnitsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <AdminUnitsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#282828] border border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              ¿Eliminar unidad?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente la unidad{' '}
              <span className="font-semibold text-white">"{selectedUnit?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUnit && deleteMutation.mutate(selectedUnit.id)}
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

function AdminUnitsSkeleton() {
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
              <div className="h-4 w-32 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-600 rounded animate-pulse ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}