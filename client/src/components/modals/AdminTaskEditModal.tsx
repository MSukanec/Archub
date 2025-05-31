import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { tasksService, UpdateTaskData } from '@/lib/tasksService';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trash2, Plus } from 'lucide-react';

// Types
interface TaskCategory {
  id: string;
  name: string;
  parent_id?: string;
  position: string;
  code: string;
}

interface Material {
  id: string;
  name: string;
  cost?: number;
}

interface Unit {
  id: string;
  name: string;
  description: string;
}

interface TaskMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface Task {
  id: string;
  name: string;
  unit_labor_price?: number;
  unit_material_price?: number;
  category_id: string;
  subcategory_id: string;
  element_category_id: string;
  unit_id: string;
  action_id: string;
  element_id: string;
  organization_id: string;
  category?: { name: string };
  unit?: { name: string };
}

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  unit_labor_price: z.string().optional(),
  unit_material_price: z.string().optional(),
  category_id: z.string().min(1, 'La categoría es requerida'),
  subcategory_id: z.string().min(1, 'El subrubro es requerido'),
  element_category_id: z.string().min(1, 'El elemento es requerido'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
  action_id: z.string().min(1, 'La acción es requerida'),
  element_id: z.string().min(1, 'El elemento es requerido'),
});

interface AdminTaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export function AdminTaskEditModal({ isOpen, onClose, task }: AdminTaskEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organizationId } = useUserContextStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedElementCategoryId, setSelectedElementCategoryId] = useState<string>('');
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedElementId, setSelectedElementId] = useState<string>('');
  const [generatedName, setGeneratedName] = useState<string>('');
  const [taskMaterials, setTaskMaterials] = useState<TaskMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [materialQuantity, setMaterialQuantity] = useState<string>('');
  const [materialUnitCost, setMaterialUnitCost] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      unit_labor_price: '',
      unit_material_price: '',
      category_id: '',
      subcategory_id: '',
      element_category_id: '',
      unit_id: '',
      action_id: '',
      element_id: '',
    },
  });

  // Fetch task categories from Supabase
  const { data: allCategories = [] } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('position');
      
      if (error) {
        console.error('Error fetching task categories:', error);
        return [];
      }
      return data as TaskCategory[];
    },
    enabled: isOpen,
    retry: 1,
  });

  // Fetch materials
  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
      return data as Material[];
    },
    enabled: isOpen,
    retry: 1,
  });

  // Fetch actions
  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching actions:', error);
        return [];
      }
      return data;
    },
    enabled: isOpen,
    retry: 1,
  });

  // Fetch task elements
  const { data: taskElements = [] } = useQuery({
    queryKey: ['task-elements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_elements')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching task elements:', error);
        return [];
      }
      return data;
    },
    enabled: isOpen,
    retry: 1,
  });

  // Fetch units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching units:', error);
        return [];
      }
      return data as Unit[];
    },
    enabled: isOpen,
    retry: 1,
  });

  // Helper functions for category filtering
  const getSubcategories = (parentID: string) => {
    return allCategories.filter((cat: TaskCategory) => cat.parent_id === parentID);
  };

  const getElementCategories = (parentID: string) => {
    return allCategories.filter((cat: TaskCategory) => cat.parent_id === parentID);
  };

  // Calculate filtered categories based on current selection
  const subcategoriesFiltered = selectedCategoryId ? getSubcategories(selectedCategoryId) : [];
  const elementCategoriesFiltered = selectedSubcategoryId ? getElementCategories(selectedSubcategoryId) : [];

  // Generate task name from action and element
  const generateTaskName = (actionId: string, elementId: string) => {
    const action = actions.find((a: any) => a.id === actionId);
    const element = taskElements.find((e: any) => e.id === elementId);
    
    if (action && element) {
      return `${action.name} de ${element.name}.`;
    }
    return '';
  };

  // Update generated name when action or element changes
  useEffect(() => {
    if (selectedActionId && selectedElementId) {
      const name = generateTaskName(selectedActionId, selectedElementId);
      setGeneratedName(name);
      form.setValue('name', name);
    }
  }, [selectedActionId, selectedElementId, actions, taskElements, form]);

  // Load task data when modal opens and data is available
  useEffect(() => {
    if (isOpen && task && allCategories.length > 0) {
      console.log('Loading task data for editing:', task);
      
      // Set local state for dropdowns
      setSelectedCategoryId(task.category_id);
      setSelectedSubcategoryId(task.subcategory_id);
      setSelectedElementCategoryId(task.element_category_id);
      setSelectedActionId(task.action_id);
      setSelectedElementId(task.element_id);
      
      // Set form values
      form.reset({
        name: task.name,
        unit_labor_price: task.unit_labor_price?.toString() || '',
        unit_material_price: task.unit_material_price?.toString() || '',
        category_id: task.category_id,
        subcategory_id: task.subcategory_id,
        element_category_id: task.element_category_id,
        unit_id: task.unit_id,
        action_id: task.action_id,
        element_id: task.element_id,
      });
      
      console.log('Edit form initialized with values:');
      console.log('- Category:', task.category_id);
      console.log('- Subcategory:', task.subcategory_id);
      console.log('- Element Category:', task.element_category_id);
      console.log('- Action:', task.action_id);
      console.log('- Element:', task.element_id);
    }
  }, [isOpen, task, allCategories, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTaskData) => tasksService.update(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      toast({
        title: 'Tarea actualizada',
        description: 'La tarea se ha actualizado correctamente.',
        variant: 'default',
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al actualizar la tarea.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No se encontró la organización.',
        variant: 'destructive',
      });
      return;
    }

    const taskData: UpdateTaskData = {
      name: values.name,
      unit_labor_price: values.unit_labor_price ? parseFloat(values.unit_labor_price) : null,
      unit_material_price: values.unit_material_price ? parseFloat(values.unit_material_price) : null,
      category_id: values.category_id,
      subcategory_id: values.subcategory_id,
      element_category_id: values.element_category_id,
      unit_id: values.unit_id,
      action_id: values.action_id,
      element_id: values.element_id,
      organization_id: organizationId,
    };

    updateMutation.mutate(taskData);
  };

  // Material management functions
  const addMaterial = () => {
    if (!selectedMaterialId || !materialQuantity || !materialUnitCost) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos del material.',
        variant: 'destructive',
      });
      return;
    }

    const material = materials.find(m => m.id === selectedMaterialId);
    if (!material) return;

    const quantity = parseFloat(materialQuantity);
    const unitCost = parseFloat(materialUnitCost);
    const totalCost = quantity * unitCost;

    const newMaterial: TaskMaterial = {
      materialId: selectedMaterialId,
      materialName: material.name,
      quantity,
      unitCost,
      totalCost,
    };

    setTaskMaterials([...taskMaterials, newMaterial]);
    setSelectedMaterialId('');
    setMaterialQuantity('');
    setMaterialUnitCost('');
  };

  const removeMaterial = (index: number) => {
    setTaskMaterials(taskMaterials.filter((_, i) => i !== index));
  };

  return (
    <ModernModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-6">Editar Tarea</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Gestiona tareas de construcción y sus materiales asociados
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={["category", "task", "materials"]} className="w-full">
              {/* Categoría de Rubro Section */}
              <AccordionItem value="category">
                <AccordionTrigger className="text-sm font-medium">
                  Categoría de Rubro
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Rubro</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            setSelectedCategoryId(value);
                            setSelectedSubcategoryId('');
                            setSelectedElementCategoryId('');
                            field.onChange(value);
                            form.setValue('subcategory_id', '');
                            form.setValue('element_category_id', '');
                          }} 
                          value={selectedCategoryId}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                              <SelectValue placeholder="Seleccionar rubro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                            {allCategories.filter((cat: TaskCategory) => !cat.parent_id).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.code} - {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcategory_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Subrubro</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            setSelectedSubcategoryId(value);
                            setSelectedElementCategoryId('');
                            field.onChange(value);
                            form.setValue('element_category_id', '');
                          }} 
                          value={selectedSubcategoryId}
                          disabled={!selectedCategoryId}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                              <SelectValue placeholder="Seleccionar subrubro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                            {subcategoriesFiltered.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                                {subcategory.code} - {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="element_category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Elemento</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            setSelectedElementCategoryId(value);
                            field.onChange(value);
                          }} 
                          value={selectedElementCategoryId}
                          disabled={!selectedSubcategoryId}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                              <SelectValue placeholder="Seleccionar elemento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                            {elementCategoriesFiltered.map((element) => (
                              <SelectItem key={element.id} value={element.id.toString()}>
                                {element.code} - {element.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Tarea Section */}
              <AccordionItem value="task">
                <AccordionTrigger className="text-sm font-medium">
                  Tarea
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="action_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-foreground">Acción</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              setSelectedActionId(value);
                              field.onChange(value);
                            }} 
                            value={selectedActionId}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                                <SelectValue placeholder="Seleccionar acción" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                              {actions.map((action: any) => (
                                <SelectItem key={action.id} value={action.id}>
                                  {action.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="element_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-foreground">Elemento</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              setSelectedElementId(value);
                              field.onChange(value);
                            }} 
                            value={selectedElementId}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                                <SelectValue placeholder="Seleccionar elemento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                              {taskElements.map((element: any) => (
                                <SelectItem key={element.id} value={element.id}>
                                  {element.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Nombre de la Tarea</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                            placeholder="Nombre de la tarea"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Unidad y Precios Section */}
              <AccordionItem value="pricing">
                <AccordionTrigger className="text-sm font-medium">
                  Unidad y Precios
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Unidad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name} - {unit.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unit_labor_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-foreground">Precio Unitario de Mano de Obra</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              step="0.01"
                              className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit_material_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-foreground">Precio Unitario de Materiales</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              step="0.01"
                              className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Materiales Section */}
              <AccordionItem value="materials">
                <AccordionTrigger className="text-sm font-medium">
                  Materiales
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <Select 
                      value={selectedMaterialId} 
                      onValueChange={setSelectedMaterialId}
                    >
                      <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                        <SelectValue placeholder="Material" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Cantidad"
                      value={materialQuantity}
                      onChange={(e) => setMaterialQuantity(e.target.value)}
                      className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                    />
                    
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Costo unit."
                      value={materialUnitCost}
                      onChange={(e) => setMaterialUnitCost(e.target.value)}
                      className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                    />
                    
                    <Button
                      type="button"
                      onClick={addMaterial}
                      size="sm"
                      className="bg-[#8CC63F] hover:bg-[#7AB82F] text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {taskMaterials.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Materiales Agregados:</h4>
                      {taskMaterials.map((material, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{material.materialName}</p>
                            <p className="text-xs text-muted-foreground">
                              Cantidad: {material.quantity} | Costo Unit.: ${material.unitCost} | Total: ${material.totalCost.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex justify-end gap-3 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-[#919191]/20 text-foreground hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="bg-[#8CC63F] hover:bg-[#7AB82F] text-white"
              >
                {updateMutation.isPending ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ModernModal>
  );
}