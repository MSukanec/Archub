import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calculator, Edit, Trash2, ArrowUpDown, Activity, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { supabase } from '@/lib/supabase';
import CreateBudgetModal from '@/components/modals/CreateBudgetModal';

interface Budget {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  project_id: string;
}

function BudgetsListSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default function SiteBudgetsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('budgets-list');
  }, [setSection, setView]);

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateBudgetModal = () => {
      setSelectedBudget(null);
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);

    return () => {
      window.removeEventListener('openCreateBudgetModal', handleOpenCreateBudgetModal);
    };
  }, []);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsDeleteDialogOpen(false);
      setSelectedBudget(null);
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto ha sido eliminado exitosamente.",
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsDeleteDialogOpen(true);
  };

  const handleBudgetClick = (budget: Budget) => {
    if (budget.id !== budgetId) {
      // Agregar clase de animación antes del cambio
      const cards = document.querySelectorAll('[data-budget-card]');
      cards.forEach(card => card.classList.add('animate-pulse'));
      
      setTimeout(() => {
        setBudgetId(budget.id);
        toast({
          title: "Presupuesto activo cambiado",
          description: `Ahora trabajas en: ${budget.name}`,
          duration: 2000,
        });
        
        // Remover animación después del cambio
        setTimeout(() => {
          cards.forEach(card => card.classList.remove('animate-pulse'));
        }, 300);
      }, 150);
    }
  };

  const confirmDelete = () => {
    if (selectedBudget) {
      deleteMutation.mutate(selectedBudget.id);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'rejected':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <BudgetsListSkeleton />;
  }

  // Filtrar y ordenar presupuestos
  const filteredBudgets = budgets
    .filter((budget: Budget) =>
      budget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // First, sort by active budget (active budget comes first)
      if (a.id === budgetId && b.id !== budgetId) return -1;
      if (b.id === budgetId && a.id !== budgetId) return 1;
      
      // Then sort by creation date
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

  // Calcular estadísticas del dashboard
  const totalBudgets = budgets.length;
  const draftBudgets = budgets.filter(b => b.status === 'draft').length;
  const approvedBudgets = budgets.filter(b => b.status === 'approved').length;
  const currentBudget = budgets.find(b => b.id === budgetId);

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Presupuestos
            </h1>
            <p className="text-sm text-muted-foreground">
              Dashboard general de tus presupuestos de construcción
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl shadow-md bg-[#e1e1e1] p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Presupuestos</p>
              <p className="text-3xl font-bold text-foreground">{totalBudgets}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-md bg-[#e1e1e1] p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Borradores</p>
              <p className="text-3xl font-bold text-yellow-500">{draftBudgets}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Edit className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-md bg-[#e1e1e1] p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aprobados</p>
              <p className="text-3xl font-bold text-emerald-500">{approvedBudgets}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar presupuestos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <ArrowUpDown size={16} />
          {sortOrder === 'newest' ? 'Más recientes' : 'Más antiguos'}
        </Button>
      </div>

      {/* Budgets List */}
      {filteredBudgets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {searchQuery ? 'No se encontraron presupuestos' : 'No hay presupuestos'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery 
                ? 'Intenta con un término de búsqueda diferente.'
                : 'Comienza creando tu primer presupuesto de construcción.'
              }
            </p>

          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBudgets.map((budget: Budget) => {
            const isActiveBudget = budget.id === budgetId;
            return (
              <div key={budget.id} className="relative">
                <Card 
                  data-budget-card
                  className={`transition-all duration-300 relative cursor-pointer hover:border-border/60 ${
                    isActiveBudget ? 'ring-2 ring-primary/50 bg-primary/5 border-transparent' : 'border-border'
                  } ${!isActiveBudget ? 'hover:shadow-md hover:ring-1 hover:ring-primary/30 hover:bg-primary/5' : ''}`}
                  onClick={() => handleBudgetClick(budget)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl font-semibold text-foreground truncate">
                            {budget.name}
                          </CardTitle>
                          {isActiveBudget && (
                            <Badge 
                              variant="default" 
                              className="bg-primary hover:bg-primary/90 text-white shrink-0"
                            >
                              Activo
                            </Badge>
                          )}
                          <Badge variant={getStatusVariant(budget.status)} className="shrink-0">
                            {budget.status === 'draft' ? 'Borrador' : 
                             budget.status === 'approved' ? 'Aprobado' : 
                             budget.status === 'rejected' ? 'Rechazado' : budget.status}
                          </Badge>
                        </div>
                        {budget.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {budget.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(budget);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(budget);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Creado: {new Date(budget.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      <CreateBudgetModal
        budget={selectedBudget}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedBudget(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el presupuesto "{selectedBudget?.name}" y todas sus tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}