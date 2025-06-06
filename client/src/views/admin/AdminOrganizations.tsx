import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Building2, Search, Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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
import { useToast } from '../hooks/use-toast';
import { organizationsService } from '../lib/organizationsService';
import { cn } from '../lib/utils';
import AdminOrganizationsModal from '../components/modals/AdminOrganizationsModal';

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

  // Event listener for floating action button
  useEffect(() => {
    const handleOpenCreateOrganizationModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateOrganizationModal', handleOpenCreateOrganizationModal);
    return () => {
      window.removeEventListener('openCreateOrganizationModal', handleOpenCreateOrganizationModal);
    };
  }, []);

  // Fetch organizations
  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => organizationsService.getAll(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Handle errors - Show user-friendly message instead of freezing
  if (error) {
    console.error('Error loading organizations:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Gestión de Organizaciones
          </h1>
          <p className="text-muted-foreground">
            Administra las organizaciones del sistema.
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tabla no disponible
            </h3>
            <p className="text-muted-foreground max-w-md">
              La tabla de organizaciones no está configurada en la base de datos. 
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
    const matchesSearch = (org.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (org.slug && org.slug.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || 
                       format(new Date(org.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesDate;
  });

  if (isLoading) {
    return <AdminOrganizationsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Gestión de Organizaciones
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra todas las organizaciones del sistema
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
              placeholder="Buscar organizaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-surface-primary border-input shadow-lg hover:shadow-xl rounded-xl"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal rounded-xl border-border",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : "Filtro por fecha"}
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

      {/* Organizations Table */}
      <div className="rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-primary">
              <TableHead className="text-foreground font-semibold h-12 text-center">Organización</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Propietario</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Fecha de creación</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Estado</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 h-16">
                  {searchTerm || dateFilter 
                    ? 'No se encontraron organizaciones que coincidan con los filtros.'
                    : 'No hay organizaciones registradas.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map((organization: any) => (
                <TableRow key={organization.id} className="border-border bg-surface-secondary hover:bg-muted/30 transition-colors">
                  <TableCell className="py-4 text-center">
                    <div className="font-medium text-foreground">{organization.name || 'Sin nombre'}</div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {organization.owner_name || 'Sin asignar'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {organization.created_at ? format(new Date(organization.created_at), 'dd/MM/yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge 
                      variant={organization.is_active ? "default" : "secondary"}
                      className={organization.is_active 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-muted text-muted-foreground"
                      }
                    >
                      {organization.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(organization)}
                        className="text-muted-foreground hover:text-foreground hover:bg-surface-secondary bg-surface-primary h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(organization)}
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
        <AlertDialogContent className="bg-surface-secondary border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente la organización
              <span className="font-semibold text-foreground"> "{selectedOrganization?.name}"</span> y 
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
              onClick={() => selectedOrganization && deleteMutation.mutate(selectedOrganization.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
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