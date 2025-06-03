import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, Search, Plus, Edit, Trash2, Shield, Mail, Calendar } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import AdminUsersModal from '@/components/modals/AdminUsersModal';

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  
  // State for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Event listener for floating action button
  useEffect(() => {
    const handleOpenCreateUserModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateUserModal', handleOpenCreateUserModal);
    return () => {
      window.removeEventListener('openCreateUserModal', handleOpenCreateUserModal);
    };
  }, []);

  // Fetch users with plan information
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          plan:plans(name, price)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Handle errors
  if (error) {
    console.error('Error loading users:', error);
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Gestión de Usuarios
              </h1>
              <p className="text-sm text-muted-foreground">
                Administra todos los usuarios del sistema
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Error al cargar usuarios
            </h3>
            <p className="text-muted-foreground max-w-md">
              No se pudieron cargar los usuarios. Intenta recargar la página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle delete
  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Filter users based on search and date
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = (user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
                       format(new Date(user.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesDate;
  });

  if (isLoading) {
    return <AdminUsersSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra todos los usuarios del sistema
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
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-surface-primary border-input rounded-xl shadow-lg hover:shadow-xl"
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

      {/* Users Table */}
      <div className="rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="text-foreground font-semibold h-12 text-center">Usuario</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Email</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Plan</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Rol</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Fecha de registro</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8 h-16">
                  {searchTerm || dateFilter 
                    ? 'No se encontraron usuarios que coincidan con los filtros.'
                    : 'No hay usuarios registrados.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: any) => (
                <TableRow key={user.id} className="border-border bg-surface-secondary hover:bg-muted/30 transition-colors">
                  <TableCell className="py-4 text-center">
                    <div className="font-medium text-foreground">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.full_name || 'Sin nombre'
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge 
                      variant="outline"
                      className={
                        user.plan?.name === 'pro' 
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : user.plan?.name === 'enterprise'
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-surface-secondary text-gray-700 border-gray-200"
                      }
                    >
                      {user.plan?.name ? user.plan.name.toUpperCase() : 'FREE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge 
                      variant={user.role === 'admin' ? "default" : "secondary"}
                      className={user.role === 'admin'
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-muted text-muted-foreground"
                      }
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role || 'Usuario'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {format(new Date(user.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditModalOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-surface-secondary border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente el usuario
              <span className="font-semibold text-foreground"> "{selectedUser?.email}"</span> y 
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
              onClick={() => {
                // Add delete logic here
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Modal */}
      <AdminUsersModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit User Modal */}
      <AdminUsersModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
}

function AdminUsersSkeleton() {
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}