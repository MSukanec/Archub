import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package2, Search, Plus, Trash2, Calculator, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';

interface Material {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  created_at: string;
}

interface MaterialData {
  id: string;
  name: string;
  description: string;
  category_name: string;
  category_code: string;
  parent_category_name: string;
  unit_name: string;
  stock: number;
  unit_price: number;
  total_value: number;
}

interface MaterialAccordionProps {
  category: string;
  isExpanded: boolean;
  onToggle: () => void;
  onAddMaterial: () => void;
  onDeleteMaterial: (materialId: string) => void;
  isDeletingMaterial: boolean;
}

function MaterialAccordion({ category, isExpanded, onToggle, onAddMaterial, onDeleteMaterial, isDeletingMaterial }: MaterialAccordionProps) {
  const { projectId } = useUserContextStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Query para obtener todos los materiales utilizados en el proyecto
  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Primero obtenemos todos los presupuestos del proyecto
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('id')
        .eq('project_id', projectId);

      if (budgetsError) throw budgetsError;
      
      const budgetIds = budgets?.map(b => b.id) || [];
      if (budgetIds.length === 0) return [];

      // Luego obtenemos todas las tareas de esos presupuestos y sus materiales
      const { data, error } = await supabase
        .from('budget_tasks')
        .select(`
          task_id,
          quantity,
          tasks!inner(
            id,
            tasks_materials!inner(
              quantity,
              materials!inner(
                id,
                name,
                description,
                unit_material_price,
                material_categories!inner(name, code),
                units(name)
              )
            )
          )
        `)
        .in('budget_id', budgetIds);

      if (error) throw error;

      // Procesamos los datos para obtener materiales únicos con cantidades totales
      const materialMap = new Map();
      
      data?.forEach((budgetTask: any) => {
        const taskQuantity = budgetTask.quantity || 1;
        
        budgetTask.tasks?.tasks_materials?.forEach((taskMaterial: any) => {
          const material = taskMaterial.materials;
          const materialQuantity = taskMaterial.quantity || 0;
          const totalQuantity = taskQuantity * materialQuantity;
          
          if (materialMap.has(material.id)) {
            const existing = materialMap.get(material.id);
            existing.stock += totalQuantity;
            existing.total_value = existing.stock * existing.unit_price;
          } else {
            materialMap.set(material.id, {
              id: material.id,
              name: material.name,
              description: material.description || '',
              category_name: material.material_categories?.name || 'Sin categoría',
              category_code: material.material_categories?.code || '',
              parent_category_name: material.material_categories?.name || 'Sin categoría',
              unit_name: material.units?.name || 'und',
              stock: totalQuantity,
              unit_price: parseFloat(material.unit_material_price || '0'),
              total_value: totalQuantity * parseFloat(material.unit_material_price || '0')
            });
          }
        });
      });
      
      return Array.from(materialMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!projectId,
  });

  const filteredMaterials = materials.filter((material: MaterialData) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                           material.category_name.toLowerCase().includes(categoryFilter.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredMaterials.reduce((sum: number, material: MaterialData) => sum + material.total_value, 0);

  return (
    <div className="bg-card rounded-2xl shadow-md border-0 overflow-hidden">
      {/* Header del Acordeón */}
      <div className="flex items-center justify-between p-6 bg-card">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onToggle}
            className="flex items-center gap-4 flex-1 text-left hover:opacity-75 transition-opacity"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">{category}</h3>
                <Badge variant="outline" className="bg-muted/50">
                  {filteredMaterials.length} materiales
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Total: ${totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Gestión de inventario y costos de materiales
              </div>
            </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implementar exportación PDF
              console.log('Exportar PDF');
            }}
          >
            Exportar PDF
          </Button>
          

        </div>
      </div>

      {/* Contenido del Acordeón */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Controles de búsqueda y filtros */}
          <div className="p-4 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar materiales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="estructura">Estructura</SelectItem>
                  <SelectItem value="acabados">Acabados</SelectItem>
                  <SelectItem value="instalaciones">Instalaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabla de materiales - Desktop */}
          <div className="hidden xl:block">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left h-12">
                    <th className="pl-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">
                      Código
                    </th>
                    <th className="py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[25%]">
                      Material
                    </th>
                    <th className="text-center py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">
                      Unidad
                    </th>
                    <th className="text-center py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">
                      Stock
                    </th>
                    <th className="text-center py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">
                      Precio Unit.
                    </th>
                    <th className="text-center py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">
                      Valor Total
                    </th>
                    <th className="text-center py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">
                      % del Total
                    </th>
                    <th className="text-center py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[5%]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {isLoadingMaterials ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="h-12">
                        <td className="pl-6 py-1"><Skeleton className="h-4 w-12" /></td>
                        <td className="py-1"><Skeleton className="h-4 w-32" /></td>
                        <td className="text-center py-1"><Skeleton className="h-4 w-12 mx-auto" /></td>
                        <td className="text-center py-1"><Skeleton className="h-4 w-8 mx-auto" /></td>
                        <td className="text-center py-1"><Skeleton className="h-4 w-16 mx-auto" /></td>
                        <td className="text-center py-1"><Skeleton className="h-4 w-16 mx-auto" /></td>
                        <td className="text-center py-1"><Skeleton className="h-4 w-8 mx-auto" /></td>
                        <td className="text-center py-1"><Skeleton className="h-4 w-8 mx-auto" /></td>
                      </tr>
                    ))
                  ) : filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron materiales
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      // Agrupar materiales por categoría
                      const groupedMaterials = filteredMaterials.reduce((groups: any, material: MaterialData) => {
                        const categoryName = material.category_name;
                        if (!groups[categoryName]) {
                          groups[categoryName] = [];
                        }
                        groups[categoryName].push(material);
                        return groups;
                      }, {});

                      const totalGeneral = filteredMaterials.reduce((sum: number, material: MaterialData) => 
                        sum + material.total_value, 0
                      );

                      return Object.entries(groupedMaterials).flatMap(([categoryName, categoryMaterials]: [string, any]) => {
                        const categoryTotal = categoryMaterials.reduce((sum: number, material: MaterialData) => 
                          sum + material.total_value, 0
                        );
                        const categoryPercentage = totalGeneral > 0 ? (categoryTotal / totalGeneral) * 100 : 0;
                        
                        return [
                          // Category Header
                          <tr key={`category-${categoryName}`} className="bg-[#606060] border-border hover:bg-[#606060]">
                            <td colSpan={2} className="pl-6 py-3 font-semibold text-sm text-white">
                              {categoryName}
                            </td>
                            <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                            <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                            <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                            <td className="py-3 text-center font-semibold text-sm text-white w-[5%]">
                              ${categoryTotal.toFixed(2)}
                            </td>
                            <td className="py-3 text-center font-semibold text-sm text-white w-[5%]">
                              {categoryPercentage.toFixed(1)}%
                            </td>
                            <td className="py-3 text-center text-white text-sm w-[5%]"></td>
                          </tr>,
                          // Category Materials
                          ...categoryMaterials.map((material: MaterialData) => {
                            const percentage = totalGeneral > 0 ? (material.total_value / totalGeneral) * 100 : 0;
                            return (
                              <tr key={material.id} className="border-border hover:bg-muted/50 transition-colors h-12">
                                <td className="pl-12 py-1 w-[15%]">
                                  <div className="text-sm font-medium text-foreground">{material.category_code}</div>
                                </td>
                                <td className="py-1 text-left pl-6">
                                  <div className="flex flex-col">
                                    <div className="font-medium text-foreground text-sm">{material.name}</div>
                                    {material.description && (
                                      <div className="text-xs text-muted-foreground mt-0.5">{material.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center py-1">
                                  <Badge variant="outline" className="bg-muted/50 text-xs">
                                    {material.unit_name}
                                  </Badge>
                                </td>
                                <td className="text-center py-1">
                                  <div className="text-sm">{material.stock}</div>
                                </td>
                                <td className="text-center py-1">
                                  <div className="text-sm">${material.unit_price ? material.unit_price.toFixed(2) : '0.00'}</div>
                                </td>
                                <td className="text-center py-1">
                                  <div className="font-semibold text-sm">${material.total_value.toFixed(2)}</div>
                                </td>
                                <td className="text-center py-1">
                                  <div className="text-sm">{percentage.toFixed(1)}%</div>
                                </td>
                                <td className="text-center py-1">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción eliminará permanentemente el material "{material.name}" del inventario. Esta acción NO se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => onDeleteMaterial(material.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          disabled={isDeletingMaterial}
                                        >
                                          {isDeletingMaterial ? "Eliminando..." : "Eliminar Material"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </td>
                              </tr>
                            );
                          })
                        ];
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards responsivas - Tablet/Mobile */}
          <div className="xl:hidden space-y-3">
            {filteredMaterials.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No se encontraron materiales
              </div>
            ) : (
              filteredMaterials.map((material: MaterialData) => (
                <div key={material.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{material.name}</h4>
                        <Badge variant="outline" className="bg-muted/50 text-xs">
                          {material.category_code}
                        </Badge>
                      </div>
                      {material.description && (
                        <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Categoría: <span className="text-foreground">{material.category_name}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Unidad: <span className="text-foreground">{material.unit_name}</span>
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente el material "{material.name}" del inventario. Esta acción NO se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteMaterial(material.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeletingMaterial}
                          >
                            {isDeletingMaterial ? "Eliminando..." : "Eliminar Material"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">Stock</div>
                      <div className="font-medium">{material.stock}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Precio Unitario</div>
                      <div className="font-medium">${material.unit_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Valor Total</div>
                      <div className="font-semibold text-primary">${material.total_value.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">% del Total</div>
                      <div className="font-medium">
                        {totalAmount > 0 ? ((material.total_value / totalAmount) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="rounded-2xl shadow-md bg-card border-0 overflow-hidden">
        <div className="p-6">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function SiteMaterials() {
  const { toast } = useToast();
  const { projectId } = useUserContextStore();
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Materiales']));

  // Mutación para eliminar material
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado del inventario correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar material",
        description: "No se pudo eliminar el material. Intenta nuevamente.",
        variant: "destructive",
      });
      console.error('Error deleting material:', error);
    },
  });

  const handleToggleExpanded = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleAddMaterial = () => {
    // TODO: Implementar modal para agregar material
    console.log('Add material');
  };

  if (!projectId) {
    return <MaterialsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Materiales
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestión de inventario y costos de materiales de construcción
            </p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar materiales, categorías..."
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los materiales</SelectItem>
            <SelectItem value="in-stock">En stock</SelectItem>
            <SelectItem value="low-stock">Stock bajo</SelectItem>
            <SelectItem value="out-of-stock">Sin stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Acordeón de materiales */}
      <div className="space-y-4">
        <MaterialAccordion
          key="Materiales"
          category="Materiales"
          isExpanded={expandedCategories.has('Materiales')}
          onToggle={() => handleToggleExpanded('Materiales')}
          onAddMaterial={handleAddMaterial}
          onDeleteMaterial={(materialId) => deleteMaterialMutation.mutate(materialId)}
          isDeletingMaterial={deleteMaterialMutation.isPending}
        />
      </div>
    </div>
  );
}