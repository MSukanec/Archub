import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package2, Search, X, Edit, Trash2, MoreHorizontal, DollarSign, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { projectsService } from '@/lib/projectsService';
import { supabase } from '@/lib/supabase';

function BudgetMaterialsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <div className="border-b border-border bg-muted/50 p-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SiteMaterials() {
  const { projectId, budgetId, setBudgetId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('budgets-materials');
  }, [setSection, setView]);

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateMaterialModal = () => {
      toast({
        title: "Funcionalidad en desarrollo",
        description: "La gestión de materiales estará disponible próximamente.",
      });
    };

    window.addEventListener('openCreateMaterialModal', handleOpenCreateMaterialModal);
    
    return () => {
      window.removeEventListener('openCreateMaterialModal', handleOpenCreateMaterialModal);
    };
  }, [toast]);

  // Fetch budgets for current project
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch materials for current budget
  const { data: budgetMaterials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['budget-materials', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      
      try {
        // Get all tasks for the budget first
        const { data: budgetTasks, error: budgetTasksError } = await supabase
          .from('budget_tasks')
          .select('task_id')
          .eq('budget_id', budgetId);
        
        if (budgetTasksError) throw budgetTasksError;
        if (!budgetTasks || budgetTasks.length === 0) return [];

        const taskIds = budgetTasks.map(bt => bt.task_id);
        
        // Get task materials with material details
        const { data: taskMaterials, error: taskMaterialsError } = await supabase
          .from('task_materials')
          .select(`
            *,
            materials(id, name, unit_id),
            tasks(name)
          `)
          .in('task_id', taskIds);
        
        if (taskMaterialsError) throw taskMaterialsError;
        if (!taskMaterials || taskMaterials.length === 0) return [];

        // Get unit information
        const unitIds = Array.from(new Set(taskMaterials.map(tm => tm.materials?.unit_id).filter(Boolean)));
        let unitsData: any[] = [];
        if (unitIds.length > 0) {
          const { data: units } = await supabase
            .from('units')
            .select('id, name')
            .in('id', unitIds);
          unitsData = units || [];
        }

        // Combine and structure data
        const combinedData = taskMaterials.map(taskMaterial => {
          const unit = unitsData.find(u => u.id === taskMaterial.materials?.unit_id);
          return {
            id: taskMaterial.id,
            material_id: taskMaterial.material_id,
            material_name: taskMaterial.materials?.name || 'Material no encontrado',
            task_name: taskMaterial.tasks?.name || 'Tarea no encontrada',
            amount: taskMaterial.amount,
            unit: unit?.name || 'Sin unidad',
            task_id: taskMaterial.task_id
          };
        });

        return combinedData;
      } catch (error) {
        console.error('Error fetching budget materials:', error);
        return [];
      }
    },
    enabled: !!budgetId,
  });

  // Get unique material categories for filter (simplified version)
  const materialCategories = Array.from(new Set(budgetMaterials.map(material => material.material_name.split(' ')[0])))
    .filter(Boolean)
    .map(name => ({ id: name, name }));

  // Filter materials based on search and category
  const filteredMaterials = budgetMaterials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.task_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
      material.material_name.toLowerCase().startsWith(categoryFilter.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  // Calculate total materials count
  const totalMaterials = filteredMaterials.reduce((sum: number, material: any) => 
    sum + material.amount, 0
  );

  if (budgetsLoading) {
    return <BudgetMaterialsSkeleton />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Lista de Materiales
            </h1>
            <p className="text-sm text-muted-foreground">
              Dashboard general de materiales y cantidades del presupuesto
            </p>
          </div>
        </div>

        <Select 
          value={budgetId || ""} 
          onValueChange={(value) => {
            setBudgetId(value);
            setSearchTerm('');
            setCategoryFilter('all');
          }}
        >
          <SelectTrigger className="w-48 bg-white/80 hover:bg-white border-input">
            <SelectValue placeholder="Seleccionar presupuesto" />
          </SelectTrigger>
          <SelectContent>
            {budgets?.map((budget: any) => (
              <SelectItem key={budget.id} value={budget.id.toString()}>
                {budget.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters and Search - exactly like Gestión de Tareas */}
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl"
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
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="bg-[#e1e1e1] border-[#919191]/20">
              <SelectItem value="all">Todas las categorías</SelectItem>
              {materialCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline"
            onClick={() => {
              toast({
                title: "Funcionalidad en desarrollo",
                description: "La exportación a PDF estará disponible próximamente.",
              });
            }}
            className="bg-[#e1e1e1] border-[#919191]/20 rounded-xl hover:bg-[#d1d1d1]"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-[#606060]">
              <TableHead className="text-white text-sm h-12 text-left pl-6">Material</TableHead>
              <TableHead className="text-white text-sm h-12 text-center">Tarea Asociada</TableHead>
              <TableHead className="text-white text-sm h-12 text-center">Cantidad</TableHead>
              <TableHead className="text-white text-sm h-12 text-center">Unidad</TableHead>
              <TableHead className="text-white text-sm h-12 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materialsLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-border h-12">
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-32 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-24 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-16 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-6 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 h-32">
                  {!budgetId 
                    ? 'Selecciona un presupuesto para ver sus materiales'
                    : searchTerm || categoryFilter !== 'all'
                    ? 'No se encontraron materiales que coincidan con los filtros.'
                    : 'No hay materiales en este presupuesto.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material: any) => (
                <TableRow key={material.id} className="border-border hover:bg-muted/20 transition-colors h-12">
                  <TableCell className="pl-6 py-1">
                    <div className="text-sm font-medium text-foreground">{material.material_name}</div>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="text-sm">{material.task_name}</div>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="text-sm font-medium">{material.amount}</div>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge variant="outline" className="bg-muted/50 text-xs">
                      {material.unit}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Funcionalidad en desarrollo",
                            description: "La edición de materiales estará disponible próximamente.",
                          });
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Funcionalidad en desarrollo",
                            description: "La eliminación de materiales estará disponible próximamente.",
                          });
                        }}
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
    </div>
  );
}