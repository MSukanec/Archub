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
import { organizationsService } from '@/lib/organizationsService';
import { cn } from '@/lib/utils';
import AdminOrganizationsModal from '@/components/modals/AdminOrganizationsModal';

export default function AdminOrganizations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
  // State for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);

  // Fetch organizations
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => organizationsService.getAll(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await organizationsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({
        title: 'Organización eliminada',
        description: 'La organización se ha eliminado exitosamente.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedOrganization(null);
    },
    onError: (error: any) => {
      console.error('Error deleting organization:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la organización. Intenta nuevamente.',
        variant: 'destructive',
      });
    },
  });

  // Handle edit
  const handleEdit = (organization: any) => {
    setSelectedOrganization(organization);
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = (organization: any) => {
    setSelectedOrganization(organization);
    setIsDeleteDialogOpen(true);
  };

  // Filter organizations based on search and date
  const filteredOrganizations = organizations.filter((org: any) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (org.slug && org.slug.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || 
                       format(new Date(org.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesDate;
  });

  if (isLoading) {
    return <AdminOrganizationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Organizaciones</h1>
          <p className="text-gray-400 mt-1">
            Administra todas las organizaciones del sistema.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Organización
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar organizaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                !dateFilter && "text-gray-400"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Filtro por fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
            <CalendarComponent
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
              className="bg-gray-800 text-white"
            />
            {dateFilter && (
              <div className="p-3 border-t border-gray-700">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDateFilter(undefined)}
                  className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Limpiar filtro
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Organizations Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Organización</TableHead>
              <TableHead className="text-gray-300">Propietario</TableHead>
              <TableHead className="text-gray-300">Fecha de creación</TableHead>
              <TableHead className="text-gray-300">Estado</TableHead>
              <TableHead className="text-gray-300 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  {searchTerm || dateFilter 
                    ? 'No se encontraron organizaciones que coincidan con los filtros.'
                    : 'No hay organizaciones registradas.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map((organization: any) => (
                <TableRow key={organization.id} className="border-gray-700">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{organization.name}</div>
                      {organization.slug && (
                        <div className="text-sm text-gray-400">/{organization.slug}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {organization.owner_name || 'Sin asignar'}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {format(new Date(organization.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={organization.is_active ? "default" : "secondary"}
                      className={organization.is_active 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-gray-600 hover:bg-gray-700 text-white"
                      }
                    >
                      {organization.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(organization)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(organization)}
                        className="text-red-400 hover:text-red-300 hover:bg-gray-700"
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
      <AdminOrganizationsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <AdminOrganizationsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOrganization(null);
        }}
        organization={selectedOrganization}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Esta acción no se puede deshacer. Esto eliminará permanentemente la organización
              <span className="font-semibold"> "{selectedOrganization?.name}"</span> y 
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
              onClick={() => selectedOrganization && deleteMutation.mutate(selectedOrganization.id)}
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

function AdminOrganizationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-64 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-700 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-40 bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}