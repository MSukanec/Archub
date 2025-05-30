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
import { z } from 'zod';
import { CheckSquare, X, Info, FolderTree, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const createTaskSchema = insertTaskSchema.extend({
  unit_labor_price: z.string().optional().or(z.literal('')),
  unit_material_price: z.string().optional().or(z.literal('')),
  category_id: z.number().nullable().optional(),
  subcategory_id: z.number().nullable().optional(),
  element_category_id: z.number().nullable().optional(),
});

type FormData = z.infer<typeof createTaskSchema>;

interface AdminTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

interface TaskCategory {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
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

  // Fetch task categories from Supabase
  const { data: allCategories = [] } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('position');
      
      if (error) throw error;
      return data as TaskCategory[];
    },
    enabled: isOpen,
  });

  // Fetch materials from Supabase
  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, unit, cost');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch actions from Supabase
  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch task elements from Supabase
  const { data: taskElements = [] } = useQuery({
    queryKey: ['task-elements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_elements')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch units from Supabase
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: task?.name || '',
      unit_labor_price: task?.unit_labor_price?.toString() || '',
      unit_material_price: task?.unit_material_price?.toString() || '',
      category_id: task?.category_id || undefined,
      subcategory_id: task?.subcategory_id || undefined,
      element_category_id: task?.element_category_id || undefined,
    },
  });

  // Helper functions to filter categories
  const getMainCategories = () => allCategories.filter(cat => cat.parent_id === null);
  const getSubcategories = (parentId: string) => allCategories.filter(cat => cat.parent_id === parentId);
  const getElementCategories = (parentId: string) => allCategories.filter(cat => cat.parent_id === parentId);

  // Calculate filtered categories based on current selection
  const subcategoriesFiltered = selectedCategoryId ? getSubcategories(selectedCategoryId) : [];
  const elementCategoriesFiltered = selectedSubcategoryId ? getElementCategories(selectedSubcategoryId) : [];

  // Debug logs
  console.log('All categories:', allCategories);
  console.log('Selected category ID:', selectedCategoryId);
  console.log('Subcategories filtered:', subcategoriesFiltered);
  console.log('Selected subcategory ID:', selectedSubcategoryId);
  console.log('Element categories filtered:', elementCategoriesFiltered);

  // Generate task name from action and element
  const generateTaskName = (actionId: string, elementId: string) => {
    const action = actions.find(a => a.id === actionId);
    const element = taskElements.find(e => e.id === elementId);
    
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

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name || '',
        unit_labor_price: task.unit_labor_price?.toString() || '',
        unit_material_price: task.unit_material_price?.toString() || '',
        category_id: task.category_id || undefined,
        subcategory_id: task.subcategory_id || undefined,
        element_category_id: task.element_category_id || undefined,
      });
      
      if (task.category_id) {
        setSelectedCategoryId(task.category_id.toString());
      }
      if (task.subcategory_id) {
        setSelectedSubcategoryId(task.subcategory_id.toString());
      }
    } else {
      form.reset({
        name: '',
        unit_labor_price: '',
        unit_material_price: '',
        category_id: null,
        subcategory_id: null,
        element_category_id: null,
      });
      setSelectedCategoryId('');
      setSelectedSubcategoryId('');
    }
  }, [task, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskData) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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
    
    const taskData = {
      name: data.name,
      unit_labor_price: data.unit_labor_price ? parseFloat(data.unit_labor_price) : undefined,
      unit_material_price: data.unit_material_price ? parseFloat(data.unit_material_price) : undefined,
      category_id: data.category_id || undefined,
      subcategory_id: data.subcategory_id || undefined,
      element_category_id: data.element_category_id || undefined,
    };

    console.log('Task data to send:', taskData);

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
      category_id: undefined,
      subcategory_id: undefined,
      element_category_id: undefined,
    });
    
    setSelectedCategoryId('');
    setSelectedSubcategoryId('');
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
        <form id="task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <Accordion type="single" collapsible defaultValue="basic-info" className="w-full space-y-1">
            <AccordionItem value="basic-info" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Información Básica
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
                          field.onChange(value ? parseInt(value) : null);
                          form.setValue('subcategory_id', null);
                          form.setValue('element_category_id', null);
                        }} 
                        value={selectedCategoryId}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                            <SelectValue placeholder="Seleccionar rubro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                          {getMainCategories().map((category) => (
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
                          field.onChange(value ? parseInt(value) : null);
                          form.setValue('element_category_id', null);
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

                {/* Elemento - Siempre visible */}
                <FormField
                  control={form.control}
                  name="element_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Elemento</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          setSelectedElementCategoryId(value);
                          field.onChange(value ? parseInt(value) : null);
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

            <AccordionItem value="task" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
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
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">Elemento</FormLabel>
                  <Select 
                    onValueChange={setSelectedElementId}
                    value={selectedElementId}
                  >
                    <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                      <SelectValue placeholder="Seleccionar elemento" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                      {taskElements.map((element) => (
                        <SelectItem key={element.id} value={element.id}>
                          {element.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>

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
                  <FolderTree className="w-4 h-4" />
                  Unidad y Precios
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-1">
                {/* Campo de Unidad */}
                <FormItem>
                  <FormLabel className="text-xs font-medium text-foreground">Unidad</FormLabel>
                  <Select>
                    <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.symbol} {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>

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
                  <Package className="w-4 h-4" />
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