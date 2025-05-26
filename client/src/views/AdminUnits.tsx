import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { unitsService } from '@/lib/unitsService';
import { cn } from '@/lib/utils';
import AdminUnitsModal from '@/components/modals/AdminUnitsModal';

export default function AdminUnits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
  // State for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  // Fetch units
  const { data: units = [], isLoading } = useQuery({
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
    onError: (error: any) => {
      console.error('Error deleting unit:', error);
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

  // Filter units based on search and date
  const filteredUnits = units.filter((unit: any) => {
    const matchesSearch = (unit.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (unit.symbol && unit.symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (unit.type && unit.type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || 
                       format(new Date(unit.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesDate;
  });

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      'length': 'Longitud',
      'area': 'Área',
      'volume': 'Volumen',
      'weight': 'Peso',
      'quantity': 'Cantidad',
      'time': 'Tiempo',
      'other': 'Otro'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  if (isLoading) {
    return <AdminUnitsSkeleton />;
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar unidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#282828] border-gray-600 text-white"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal bg-[#282828] border-gray-600 text-white hover:bg-gray-700",
                !dateFilter && "text-gray-400"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Filtro por fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#282828] border-gray-600">
            <CalendarComponent
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
              className="bg-[#282828] text-white"
            />
            {dateFilter && (
              <div className="p-3 border-t border-gray-600">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDateFilter(undefined)}
                  className="w-full bg-[#282828] border-gray-600 text-white hover:bg-gray-700"
                >
                  Limpiar filtro
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Units Table */}
      <div className="bg-[#282828] rounded-lg border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-gray-300 h-10">Unidad</TableHead>
              <TableHead className="text-gray-300 h-10">Símbolo</TableHead>
              <TableHead className="text-gray-300 h-10">Tipo</TableHead>
              <TableHead className="text-gray-300 h-10">Fecha de creación</TableHead>
              <TableHead className="text-gray-300 h-10">Estado</TableHead>
              <TableHead className="text-gray-300 text-right h-10">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-6 h-12">
                  {searchTerm || dateFilter 
                    ? 'No se encontraron unidades que coincidan con los filtros.'
                    : 'No hay unidades registradas.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit: any) => (
                <TableRow key={unit.id} className="border-gray-600 h-12">
                  <TableCell className="py-2">
                    <div className="font-medium text-white">{unit.name || 'Sin nombre'}</div>
                  </TableCell>
                  <TableCell className="text-gray-300 py-2">
                    <code className="bg-gray-700 px-2 py-1 rounded text-sm">{unit.symbol}</code>
                  </TableCell>
                  <TableCell className="text-gray-300 py-2">
                    {getTypeLabel(unit.type)}
                  </TableCell>
                  <TableCell className="text-gray-300 py-2">
                    {format(new Date(unit.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge 
                      variant={unit.is_active ? "default" : "secondary"}
                      className={unit.is_active 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-gray-600 hover:bg-gray-700 text-white"
                      }
                    >
                      {unit.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(unit)}
                        className="text-[#4f9eff] hover:text-[#3a8bef] hover:bg-gray-700 h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(unit)}
                        className="text-red-400 hover:text-red-300 hover:bg-gray-700 h-8 w-8 p-0"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#282828] border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Esta acción no se puede deshacer. Esto eliminará permanentemente la unidad
              <span className="font-semibold"> "{selectedUnit?.name}"</span> y 
              todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
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
          <div className="h-8 w-64 bg-gray-600 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-600 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-40 bg-gray-600 rounded animate-pulse"></div>
      </div>
      
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-gray-600 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-600 rounded animate-pulse"></div>
      </div>
      
      <div className="bg-[#282828] rounded-lg border border-gray-600 p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between h-10">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-6 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-6 w-6 bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}