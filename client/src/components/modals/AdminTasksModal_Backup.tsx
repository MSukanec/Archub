import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { tasksService, Task, CreateTaskData } from '@/lib/tasksService';
import { insertTaskSchema } from '@shared/schema';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useHierarchicalConcepts, setHierarchicalFormValues } from '@/hooks/useHierarchicalConcepts';

import { z } from 'zod';
import { CheckSquare, X, Info, FolderTree, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const createTaskSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  unit_labor_price: z.string().optional().or(z.literal('')),
  unit_material_price: z.string().optional().or(z.literal('')),
  category_id: z.string().min(1, "Rubro es requerido"),
  subcategory_id: z.string().min(1, "Subrubro es requerido"),
  element_category_id: z.string().min(1, "Elemento es requerido"),
  unit_id: z.string().min(1, "Unidad es requerida"),
  action_id: z.string().optional().or(z.literal('')),
  element_id: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof createTaskSchema>;

// Tipo extendido que incluye los nuevos campos
type TaskWithNewFields = Task & {
  action_id?: string | null;
  element_id?: string | null;
};

interface AdminTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: TaskWithNewFields | null;
}

interface TaskCategory {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  position: number;
}

interface TaskMaterial {
  material_id: string;
  material_name: string;
  quantity: number;
  unit_cost: number;
}

function AdminTasksModal({ isOpen, onClose, task }: AdminTasksModalProps) {
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

  // Use hierarchical concepts hook for optimized task category management
  const { data: taskCategoriesStructure, isLoading: taskCategoriesLoading } = useHierarchicalConcepts('task_categories');

  // Fetch materials from Supabase
  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, cost');
      
      if (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
      return data;
    },
    enabled: isOpen,
    retry: 1,
  });

  // Fetch actions from Supabase
  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('id, name')
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

  // Fetch task elements from Supabase
  const { data: taskElements = [] } = useQuery({
    queryKey: ['task-elements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_elements')
        .select('id, name')
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

  // Fetch units from Supabase
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
      return data;
    },
    enabled: isOpen,
    retry: 1,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: task?.name || '',
      unit_labor_price: task?.unit_labor_price?.toString() || '',
      unit_material_price: task?.unit_material_price?.toString() || '',
      category_id: task?.category_id || '',
      subcategory_id: task?.subcategory_id || '',
      element_category_id: task?.element_category_id || '',
      unit_id: task?.unit_id?.toString() || '',
      action_id: task?.action_id || '',
      element_id: task?.element_id || '',
    },
  });

  // Get categories using hierarchical structure
  const mainCategories = taskCategoriesStructure?.getRootConcepts() || [];
  const subcategoriesFiltered = taskCategoriesStructure?.getChildConcepts(selectedCategoryId) || [];
  const elementCategoriesFiltered = taskCategoriesStructure?.getChildConcepts(selectedSubcategoryId) || [];

  // Initialize form when modal opens (same as MovementModal)
  useEffect(() => {
    if (isOpen && taskCategoriesStructure) {
      if (task) {
        // Editing task - use hierarchical logic
        const elementCategoryId = task.element_category_id || '';
        
        if (elementCategoryId && taskCategoriesStructure) {
          // Use hierarchical path to set category, subcategory and element (exact same as MovementModal)
          const conceptPath = taskCategoriesStructure.getConceptPath(elementCategoryId);
          const categoryId = conceptPath.length >= 1 ? conceptPath[0] : '';
          
          console.log('Editing task with hierarchical path:', { 
            element_category_id: elementCategoryId, 
            conceptPath, 
            categoryId,
            task 
          });
          
          // Set the selected category FIRST for dependent selects (same as MovementModal)
          setSelectedCategoryId(categoryId);
          
          // Then use hierarchical form setter with a small delay to ensure UI is ready (same as MovementModal)
          setTimeout(() => {
            setHierarchicalFormValues(form, conceptPath, ['category_id', 'subcategory_id', 'element_category_id']);
          }, 10);
          
          // Set other form values (same as MovementModal)
          form.setValue('name', task.name || '');
          form.setValue('unit_labor_price', task.unit_labor_price?.toString() || '');
          form.setValue('unit_material_price', task.unit_material_price?.toString() || '');
          form.setValue('unit_id', task.unit_id || '');
          form.setValue('action_id', task.action_id || '');
          form.setValue('element_id', task.element_id || '');
        }
      } else {
        // Creating new task - reset everything
        setSelectedCategoryId('');
        setSelectedSubcategoryId('');
        setSelectedElementCategoryId('');
        setSelectedActionId('');
        setSelectedElementId('');
        
        form.reset({
          name: '',
          unit_labor_price: '',
          unit_material_price: '',
          category_id: '',
          subcategory_id: '',
          element_category_id: '',
          unit_id: '',
          action_id: '',
          element_id: '',
        });
      }
    }
  }, [task, isOpen, taskCategoriesStructure, form]);

  // Debug logs
  console.log('Task categories structure:', taskCategoriesStructure);
  console.log('Materials:', materials);
  console.log('Actions:', actions);
  console.log('Task elements:', taskElements);
  console.log('Units:', units);
  console.log('Selected category ID:', selectedCategoryId);
  console.log('Subcategories filtered:', subcategoriesFiltered);
  console.log('Selected subcategory ID:', selectedSubcategoryId);
  console.log('Element categories filtered:', elementCategoriesFiltered);

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
    } else {
      setGeneratedName('');
      form.setValue('name', '');
    }
  }, [selectedActionId, selectedElementId, actions, taskElements, form]);

  // First effect: Set initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        console.log('Loading task for edit:', task);
        // Set the selected IDs for the dropdowns immediately
        setSelectedCategoryId(task.category_id || '');
        setSelectedSubcategoryId(task.subcategory_id || '');
        setSelectedElementCategoryId(task.element_category_id || '');
        setSelectedActionId(task.action_id || '');
        setSelectedElementId(task.element_id || '');
      } else {
        console.log('Creating new task - clearing all fields');
        // Creating new task - clear everything
        setSelectedCategoryId('');
        setSelectedSubcategoryId('');
        setSelectedElementCategoryId('');
        setSelectedActionId('');
        setSelectedElementId('');
        setGeneratedName('');
        setTaskMaterials([]);
        setSelectedMaterialId('');
        setMaterialQuantity('');
        setMaterialUnitCost('');
      }
    }
  }, [task, isOpen]);

  // Second effect: Set form values when categories are loaded
  useEffect(() => {
    if (task && taskCategoriesStructure) {
      console.log('Setting form values with categories loaded');
      form.reset({
        name: task.name || '',
        unit_labor_price: task.unit_labor_price?.toString() || '',
        unit_material_price: task.unit_material_price?.toString() || '',
        category_id: task.category_id || '',
        subcategory_id: task.subcategory_id || '',
        element_category_id: task.element_category_id || '',
        unit_id: task.unit_id?.toString() || '',
        action_id: task.action_id || '',
        element_id: task.element_id || '',
      });
      
      // Use hierarchical form setter for optimized category handling
      if (task.element_category_id && taskCategoriesStructure) {
        const conceptPath = taskCategoriesStructure.getConceptPath(task.element_category_id);
        console.log('Task hierarchical path:', { 
          element_category_id: task.element_category_id, 
          conceptPath,
          task 
        });
        
        // Set state for dependent selects first
        setSelectedCategoryId(conceptPath[0] || '');
        setSelectedSubcategoryId(conceptPath[1] || '');
        setSelectedElementCategoryId(conceptPath[2] || '');
        
        // Then use hierarchical form setter with small delay
        setTimeout(() => {
          setHierarchicalFormValues(form, conceptPath, ['category_id', 'subcategory_id', 'element_category_id']);
        }, 10);
      } else {
        // Fallback to manual setting
        setSelectedCategoryId(task.category_id || '');
        setSelectedSubcategoryId(task.subcategory_id || '');
        setSelectedElementCategoryId(task.element_category_id || '');
      }
      
      setSelectedActionId(task.action_id || '');
      setSelectedElementId(task.element_id || '');
    } else if (!task && taskCategoriesStructure) {
      // Creating new task - clear form
      form.reset({
        name: '',
        unit_labor_price: '',
        unit_material_price: '',
        category_id: '',
        subcategory_id: '',
        element_category_id: '',
        unit_id: '',
        action_id: '',
        element_id: '',
      });
    }
  }, [task, taskCategoriesStructure, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskData) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      toast({
        title: "Éxito",
        description: "Tarea creada correctamente",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la tarea",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<CreateTaskData> }) => 
      tasksService.update(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      toast({
        title: "Éxito",
        description: "Tarea actualizada correctamente",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la tarea",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    console.log('Organization ID from context:', organizationId);
    console.log('Selected action ID:', selectedActionId);
    console.log('Selected element ID:', selectedElementId);
    
    // Check if required fields are present
    if (!organizationId) {
      console.error('Missing organization ID');
      toast({
        title: "Error",
        description: "ID de organización no encontrado",
        variant: "destructive",
      });
      return;
    }
    
    const taskData = {
      name: data.name,
      unit_labor_price: data.unit_labor_price ? parseFloat(data.unit_labor_price) : undefined,
      unit_material_price: data.unit_material_price ? parseFloat(data.unit_material_price) : undefined,
      organization_id: organizationId,
      category_id: data.category_id || undefined,
      subcategory_id: data.subcategory_id || undefined,
      element_category_id: data.element_category_id || undefined,
      unit_id: data.unit_id || undefined,
      action_id: selectedActionId || undefined,
      element_id: selectedElementId || undefined,
    };

    console.log('Task data to send:', taskData);
    console.log('Task data keys:', Object.keys(taskData));
    console.log('Task data values:', Object.values(taskData));

    if (task) {
      updateMutation.mutate({ id: task.id, updates: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };



  const handleClose = () => {
    form.reset({
      name: '',
      unit_labor_price: '',
      unit_material_price: '',
      category_id: '',
      subcategory_id: '',
      element_category_id: '',
      unit_id: '',
      action_id: '',
      element_id: '',
    });
    
    // Reset all local state
    setSelectedCategoryId('');
    setSelectedSubcategoryId('');
    setSelectedElementCategoryId('');
    setSelectedActionId('');
    setSelectedElementId('');
    setGeneratedName('');
    setTaskMaterials([]);
    setSelectedMaterialId('');
    setMaterialQuantity('');
    setMaterialUnitCost('');
    
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const addMaterial = () => {
    if (selectedMaterialId && materialQuantity) {
      const material = materials.find(m => m.id === selectedMaterialId);
      if (material) {
        const newMaterial: TaskMaterial = {
          material_id: selectedMaterialId,
          material_name: material.name,
          quantity: parseFloat(materialQuantity),
          unit_cost: 0, // No longer using unit cost
        };
        
        setTaskMaterials([...taskMaterials, newMaterial]);
        setSelectedMaterialId('');
        setMaterialQuantity('');
        setMaterialUnitCost('');
      }
    }
  };

  const removeMaterial = (index: number) => {
    setTaskMaterials(taskMaterials.filter((_, i) => i !== index));
  };

  const footer = (
    <div className="flex gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isLoading}
        className="w-1/4 bg-transparent border-[#919191]/30 text-foreground hover:bg-[#d0d0d0] rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="task-form"
        disabled={isLoading}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isLoading ? 'Guardando...' : (task ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={task ? 'Editar Tarea' : 'Nueva Tarea'}
      subtitle="Gestiona tareas de construcción y sus materiales asociados"
      icon={CheckSquare}
      footer={footer}
    >
      <Form {...form}>
        <form 
          id="task-form" 
          onSubmit={(e) => {
            console.log('Form submit triggered!');
            console.log('Form valid:', form.formState.isValid);
            console.log('Form errors:', form.formState.errors);
            form.handleSubmit(onSubmit)(e);
          }} 
          className="space-y-2"
        >
          <Accordion type="single" collapsible defaultValue="basic-info" className="w-full space-y-1">
            <AccordionItem value="basic-info" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Categoría de Rubro
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-1">
                {/* Rubro */}
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
                          {mainCategories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.code} - {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subrubro - Siempre visible */}
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
                        value={field.value || ''}
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

                {/* Elemento */}
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
                        value={field.value || ''}
                        disabled={!selectedSubcategoryId}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                            <SelectValue placeholder="Seleccionar elemento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                          {elementCategoriesFiltered.map((element) => (
                            <SelectItem key={element.id} value={String(element.id)}>
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

            <AccordionItem value="task" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  Tarea
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-1">
                {/* Acción */}
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">Acción</FormLabel>
                  <Select 
                    onValueChange={setSelectedActionId}
                    value={selectedActionId}
                  >
                    <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                      <SelectValue placeholder="Seleccionar acción" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                      {actions.map((action) => (
                        <SelectItem key={action.id} value={action.id}>
                          {action.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>

                {/* Elemento */}
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
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                            <SelectValue placeholder="Seleccionar elemento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                          {taskElements.map((element) => (
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

                {/* Nombre generado automáticamente */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Nombre de la Tarea (Generado)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Se genera automáticamente al seleccionar acción y elemento"
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm cursor-not-allowed"
                          readOnly
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pricing" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-primary" />
                  Unidad y Precios
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-1">
                {/* Campo de Unidad */}
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
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="unit_labor_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground">Precio Mano de Obra</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                            {...field}
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
                        <FormLabel className="text-xs font-medium text-foreground">Precio Materiales</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="materials" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Materiales
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-1">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                      <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                        <SelectValue placeholder="Material" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#d2d2d2] border-[#919191]/20">
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
                  </div>

                  <Button
                    type="button"
                    onClick={addMaterial}
                    disabled={!selectedMaterialId || !materialQuantity}
                    className="w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                  >
                    Agregar Material
                  </Button>
                </div>

                {taskMaterials.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-foreground">Materiales Agregados:</h4>
                    {taskMaterials.map((material, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#e8e8e8] p-2 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs font-medium">{material.material_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Cantidad: {material.quantity}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </Form>
    </ModernModal>
  );
}

export default AdminTasksModal;