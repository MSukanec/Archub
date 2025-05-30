import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckSquare, Search, Plus, Edit, Trash2, DollarSign, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import AdminTasksModal from '@/components/modals/AdminTasksModal';

export default function AdminTasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const ITEMS_PER_PAGE = 10;

  // Event listener for floating action button
  useEffect(() => {
    const handleOpenCreateTaskModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateTaskModal', handleOpenCreateTaskModal);
    return () => {
      window.removeEventListener('openCreateTaskModal', handleOpenCreateTaskModal);
    };
  }, []);

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:task_categories!category_id(name),
          unit:units!unit_id(name)
        `)
        .order('name', { ascending: true });
      
      if (error) {
        console.warn('Tasks table error, returning empty array:', error);
        return [];
      }
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
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Tareas</h1>
            <p className="text-sm text-muted-foreground">Administra todas las tareas del sistema</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar tareas</h3>
            <p className="text-muted-foreground max-w-md">No se pudieron cargar las tareas. Intenta recargar la página.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = (task: any) => {
    setSelectedTask(task);
    setIsDeleteDialogOpen(true);
  };

  const filteredAndSortedTasks = tasks.filter((task: any) => {
    const matchesSearch = (task.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.unit?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a: any, b: any) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
  });

  const totalPages = Math.ceil(filteredAndSortedTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = filteredAndSortedTasks.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  if (isLoading) {
    return <AdminTasksSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Tareas</h1>
            <p className="text-sm text-muted-foreground">Administra todas las tareas del sistema</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-background border-border rounded-xl"
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
                className="w-[200px] justify-start text-left font-normal rounded-xl border-border"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {sortOrder === 'newest' ? "Más reciente primero" : "Más antiguo primero"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 bg-[#e1e1e1]">
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

      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="text-foreground font-semibold h-12">Categoría</TableHead>
              <TableHead className="text-foreground font-semibold h-12">Tarea</TableHead>
              <TableHead className="text-foreground font-semibold h-12">Unidad</TableHead>
              <TableHead className="text-foreground font-semibold h-12">Precio Mano de Obra</TableHead>
              <TableHead className="text-foreground font-semibold h-12">Precio Material</TableHead>
              <TableHead className="text-foreground font-semibold text-right h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4 h-8">
                  {searchTerm || dateFilter 
                    ? 'No se encontraron tareas que coincidan con los filtros.'
                    : 'No hay tareas registradas.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map((task: any) => (
                <TableRow key={task.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2">
                    <Badge variant="outline" className="bg-muted/50">
                      {task.category?.name || 'Sin categoría'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="font-medium text-foreground">{task.name}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="bg-muted/50">
                      {task.unit?.name || 'Sin unidad'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground py-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {task.unit_labor_price ? task.unit_labor_price.toFixed(2) : '0.00'}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground py-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {task.unit_material_price ? task.unit_material_price.toFixed(2) : '0.00'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsEditModalOpen(true);
                        }}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task)}
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
        {filteredAndSortedTasks.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedTasks.length)} de {filteredAndSortedTasks.length} elementos
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
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea
              <span className="font-semibold text-foreground"> "{selectedTask?.name}"</span> y 
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
                setSelectedTask(null);
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Task Modal */}
      <AdminTasksModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Task Modal */}
      <AdminTasksModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />
    </div>
  );
}

function AdminTasksSkeleton() {
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