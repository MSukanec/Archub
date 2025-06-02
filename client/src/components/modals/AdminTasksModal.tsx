import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useUserContextStore } from '@/stores/userContextStore';
import { supabase } from '@/lib/supabase';
import { useHierarchicalConcepts, setHierarchicalFormValues } from '@/hooks/useHierarchicalConcepts';

import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Wrench, DollarSign, Package, CheckSquare, Search, X } from 'lucide-react';

// Schema for form validation
const createTaskSchema = z.object({
  name: z.string().min(1, "Nombre es requerido").trim(),
  description: z.string().optional().or(z.literal('')),
  unit_labor_price: z.string().optional().or(z.literal('')),
  unit_material_price: z.string().optional().or(z.literal('')),
  category_id: z.string().min(1, "Rubro es requerido"),
  subcategory_id: z.string().min(1, "Subrubro es requerido"),
  element_category_id: z.string().min(1, "Elemento es requerido"),
  unit_id: z.string().min(1, "Unidad es requerida"),
  action_id: z.string().optional().or(z.literal('')),
  element_id: z.string().optional(),
});

type FormData = z.infer<typeof createTaskSchema>;

type TaskWithNewFields = {
  id: string;
  name: string;
  description?: string | null;
  organization_id: string;
  category_id: string;
  subcategory_id: string;
  element_category_id: string;
  unit_id: string;
  unit_labor_price?: number | null;
  unit_material_price?: number | null;
  created_at: string;
  action_id?: string | null;
  element_id?: string | null;
};

interface AdminTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
  task?: TaskWithNewFields | null;
  taskToEdit?: TaskWithNewFields | null;
}

export default function AdminTasksModal({ isOpen, onClose, onOpenChange, task, taskToEdit }: AdminTasksModalProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedElementId, setSelectedElementId] = useState<string>('');
  const [materialSearchTerm, setMaterialSearchTerm] = useState<string>('');
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{
    material_id: string;
    material_name: string;
    amount: string;
  }>>([]);
  // Use taskToEdit if provided, otherwise fall back to task
  const editingTask = taskToEdit || task;
  const isEditing = !!editingTask;

  // Use hierarchical concepts hook for task categories (same as MovementModal)
  const { data: taskCategoriesStructure, isLoading: taskCategoriesLoading } = useHierarchicalConcepts('task_categories');

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      description: '',
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

  // Fetch actions
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

  // Fetch task elements
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

  // Fetch materials for search (only when search term is >= 3 characters)
  const { data: materials = [] } = useQuery({
    queryKey: ['materials-search', materialSearchTerm],
    queryFn: async () => {
      if (materialSearchTerm.length < 3) return [];
      
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, units(name)')
        .ilike('name', `%${materialSearchTerm}%`)
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && materialSearchTerm.length >= 3,
  });

  // Fetch existing materials for the task when editing
  const { data: existingTaskMaterials = [] } = useQuery({
    queryKey: ['task-materials', editingTask?.id],
    queryFn: async () => {
      if (!editingTask?.id) return [];
      
      console.log('Fetching materials for task:', editingTask.id);
      
      const { data, error } = await supabase
        .from('task_materials')
        .select(`
          material_id,
          amount,
          materials(id, name)
        `)
        .eq('task_id', editingTask.id);
      
      if (error) {
        console.error('Error fetching task materials:', error);
        throw error;
      }
      
      console.log('Raw task materials data:', data);
      
      const mappedData = data.map(item => ({
        material_id: item.material_id,
        material_name: item.materials?.name || '',
        amount: item.amount.toString()
      }));
      
      console.log('Mapped task materials:', mappedData);
      return mappedData;
    },
    enabled: isOpen && isEditing && !!editingTask?.id,
  });

  // Fetch units
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
      form.setValue('name', name);
    } else {
      form.setValue('name', '');
    }
  }, [selectedActionId, selectedElementId, actions, taskElements, form]);

  // Get hierarchical categories (same as MovementModal)
  const mainCategories = taskCategoriesStructure?.getRootConcepts() || [];
  const subcategoriesFiltered = taskCategoriesStructure?.getChildConcepts(selectedCategoryId) || [];
  const elementCategoriesFiltered = taskCategoriesStructure?.getChildConcepts(form.watch('subcategory_id')) || [];

  // Initialize form when modal opens (exact same logic as MovementModal)
  useEffect(() => {
    if (isOpen && taskCategoriesStructure && actions.length > 0 && taskElements.length > 0 && units.length > 0) {
      if (editingTask && isEditing) {
        const elementCategoryId = editingTask.element_category_id || '';
        
        if (elementCategoryId && taskCategoriesStructure) {
          // Use hierarchical path to set category, subcategory and element (exact same as MovementModal)
          const conceptPath = taskCategoriesStructure.getConceptPath(elementCategoryId);
          const categoryId = conceptPath.length >= 1 ? conceptPath[0] : '';
          
          console.log('Editing task with hierarchical path:', { 
            element_category_id: elementCategoryId, 
            conceptPath, 
            categoryId,
            editingTask 
          });
          
          // Set the selected category FIRST for dependent selects (same as MovementModal)
          setSelectedCategoryId(categoryId);
          
          // Then use hierarchical form setter with a small delay to ensure UI is ready (same as MovementModal)
          setTimeout(() => {
            setHierarchicalFormValues(form, conceptPath, ['category_id', 'subcategory_id', 'element_category_id']);
          }, 10);
          
          // Set other form values (same as MovementModal)
          form.setValue('name', editingTask.name || '');
          form.setValue('description', editingTask.description || '');
          form.setValue('unit_labor_price', editingTask.unit_labor_price?.toString() || '');
          form.setValue('unit_material_price', editingTask.unit_material_price?.toString() || '');
          form.setValue('unit_id', editingTask.unit_id || '');
          form.setValue('action_id', editingTask.action_id || '');
          
          setSelectedActionId(editingTask.action_id || '');
          
          // Set element_id with proper timing to ensure UI synchronization
          setTimeout(() => {
            form.setValue('element_id', editingTask.element_id || '');
            setSelectedElementId(editingTask.element_id || '');
            console.log('Synced element_id after delay:', editingTask.element_id);
          }, 20);
        }
      } else {
        // Creating new task - reset everything (same as MovementModal)
        setSelectedCategoryId('');
        setSelectedActionId('');
        setSelectedElementId('');
        setMaterialSearchTerm('');
        setSelectedMaterials([]);
        
        form.reset({
          name: '',
          description: '',
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
  }, [editingTask, isOpen, taskCategoriesStructure, isEditing, form, actions, taskElements, units]);

  // Load existing materials when editing a task
  useEffect(() => {
    console.log('Material loading effect triggered:', { 
      isOpen, 
      isEditing, 
      editingTaskId: editingTask?.id,
      existingTaskMaterialsLength: existingTaskMaterials?.length || 0,
      existingTaskMaterials 
    });
    
    if (isOpen && isEditing && editingTask?.id) {
      if (existingTaskMaterials && existingTaskMaterials.length > 0) {
        console.log('Setting selected materials for task:', editingTask.id, existingTaskMaterials);
        setSelectedMaterials([...existingTaskMaterials]);
      } else {
        console.log('No materials found for task:', editingTask.id);
        setSelectedMaterials([]);
      }
    } else if (isOpen && !isEditing) {
      console.log('Clearing materials for new task');
      setSelectedMaterials([]);
    } else if (!isOpen) {
      console.log('Modal closed, clearing materials');
      setSelectedMaterials([]);
    }
  }, [isOpen, isEditing, editingTask?.id, existingTaskMaterials]);

  // Functions to handle materials
  const addMaterial = async (material: any) => {
    // Verify the material exists in the database before adding
    const { data: existingMaterial, error } = await supabase
      .from('materials')
      .select('id, name')
      .eq('id', material.id)
      .single();

    if (error || !existingMaterial) {
      toast({
        title: "Error",
        description: "Este material no está disponible en la base de datos",
        variant: "destructive",
      });
      return;
    }

    const isAlreadySelected = selectedMaterials.some(m => m.material_id === material.id);
    if (!isAlreadySelected) {
      setSelectedMaterials(prev => [...prev, {
        material_id: material.id,
        material_name: material.name,
        amount: '1'
      }]);
    }
    setMaterialSearchTerm('');
  };

  const removeMaterial = (materialId: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.material_id !== materialId));
  };

  const updateMaterialAmount = (materialId: string, amount: string) => {
    setSelectedMaterials(prev => prev.map(m => 
      m.material_id === materialId ? { ...m, amount } : m
    ));
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let taskName = data.name;
      
      // Check if task name already exists and generate unique name if needed
      if (!isEditing) {
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('name')
          .eq('organization_id', organizationId)
          .like('name', `${taskName}%`);

        if (existingTasks && existingTasks.length > 0) {
          const existingNames = existingTasks.map(t => t.name);
          let counter = 1;
          let uniqueName = taskName;
          
          while (existingNames.includes(uniqueName)) {
            uniqueName = `${taskName} (${counter})`;
            counter++;
          }
          
          taskName = uniqueName;
        }
      }

      const taskData = {
        name: taskName,
        description: data.description || null,
        organization_id: organizationId,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        element_category_id: data.element_category_id,
        unit_id: data.unit_id,
        unit_labor_price: data.unit_labor_price ? parseFloat(data.unit_labor_price) : null,
        unit_material_price: data.unit_material_price ? parseFloat(data.unit_material_price) : null,
        action_id: data.action_id || null,
        element_id: data.element_id || null,
      };

      if (isEditing && editingTask) {
        const { data: result, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id)
          .select()
          .single();

        if (error) throw error;

        // Update task materials - first delete existing ones
        await supabase
          .from('task_materials')
          .delete()
          .eq('task_id', editingTask.id);

        // Insert new materials if any
        if (selectedMaterials.length > 0) {
          const taskMaterialsData = selectedMaterials.map(material => ({
            task_id: result.id,
            material_id: material.material_id,
            amount: parseFloat(material.amount) || 0,
          }));

          const { error: materialsError } = await supabase
            .from('task_materials')
            .insert(taskMaterialsData);

          if (materialsError) throw materialsError;
        }

        return result;
      } else {
        const { data: result, error } = await supabase
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (error) throw error;

        // Insert task materials if any
        if (selectedMaterials.length > 0) {
          // First verify that all materials exist
          const materialIds = selectedMaterials.map(m => m.material_id);
          const { data: existingMaterials, error: checkError } = await supabase
            .from('materials')
            .select('id')
            .in('id', materialIds);

          if (checkError) {
            console.error('Error checking materials:', checkError);
            throw checkError;
          }

          const existingIds = existingMaterials?.map(m => m.id) || [];
          const missingIds = materialIds.filter(id => !existingIds.includes(id));
          
          if (missingIds.length > 0) {
            throw new Error(`Los siguientes materiales no existen: ${missingIds.join(', ')}`);
          }

          const taskMaterialsData = selectedMaterials.map(material => ({
            task_id: result.id,
            material_id: material.material_id,
            amount: parseFloat(material.amount) || 0,
          }));

          console.log('Inserting task materials:', taskMaterialsData);

          const { error: materialsError } = await supabase
            .from('task_materials')
            .insert(taskMaterialsData);

          if (materialsError) {
            console.error('Task materials error:', materialsError);
            throw materialsError;
          }
        }

        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      toast({
        title: isEditing ? "Tarea actualizada" : "Tarea creada",
        description: isEditing ? "La tarea se ha actualizado correctamente." : "La tarea se ha creado correctamente.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la tarea",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submission data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Name field value:', data.name);
    console.log('Name field length:', data.name?.length);
    
    createMutation.mutate(data);
  };

  // Check for form errors to display summary
  const formErrors = form.formState.errors;
  const hasErrors = Object.keys(formErrors).length > 0;

  const footer = (
    <div className="space-y-3">
      {/* Error summary */}
      {hasErrors && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-sm font-medium text-primary mb-2">Por favor completa los siguientes campos:</p>
          <ul className="text-sm text-primary/80 space-y-1">
            {formErrors.name && <li>• Nombre de la Tarea</li>}
            {formErrors.category_id && <li>• Categoría de Rubro</li>}
            {formErrors.subcategory_id && <li>• Subrubro</li>}
            {formErrors.element_category_id && <li>• Elemento</li>}
            {formErrors.unit_id && <li>• Unidad</li>}
          </ul>
        </div>
      )}
      
      {/* Buttons */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-background border-border text-foreground hover:bg-muted rounded-xl flex-[1]"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="task-form"
          disabled={createMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex-[3]"
        >
          {createMutation.isPending && (
            <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
          )}
          {isEditing ? 'Actualizar Tarea' : 'Crear Tarea'}
        </Button>
      </div>
    </div>
  );

  return (
    <ModernModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Editar Tarea" : "Crear Nueva Tarea"}
      subtitle={isEditing ? "Modifica los datos de la tarea existente" : "Crea una nueva tarea para el sistema"}
      icon={CheckSquare}
      footer={footer}
    >
      <Form {...form}>
        <form id="task-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <Accordion type="single" defaultValue="category" className="w-full flex-1 flex flex-col">
            {/* Category Section */}
            <AccordionItem value="category" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  Categoría de Rubro
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {/* Rubro */}
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Rubro *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          setSelectedCategoryId(value);
                          field.onChange(value);
                          form.setValue('subcategory_id', '');
                          form.setValue('element_category_id', '');
                        }}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                            <SelectValue placeholder="Seleccionar rubro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                          {mainCategories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.code} - {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subrubro */}
                <FormField
                  control={form.control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Subrubro *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
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
                      <FormLabel className="text-xs font-medium text-foreground">Elemento *</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={!form.watch('subcategory_id')}
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

            {/* Task Section */}
            <AccordionItem value="task" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  Tarea
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {/* Acción */}
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
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm">
                            <SelectValue placeholder="Seleccionar acción" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#d2d2d2] border-[#919191]/20 z-[10000]">
                          {actions.map((action) => (
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
                      <FormLabel className="text-xs font-medium text-foreground">Nombre de la Tarea *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la tarea"
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                          {...field}
                          readOnly
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Descripción</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Descripción opcional de la tarea"
                          className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Pricing Section */}
            <AccordionItem value="pricing" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Unidad y Precios
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {/* Unidad */}
                <FormField
                  control={form.control}
                  name="unit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground">Unidad *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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

            {/* Materials Section */}
            <AccordionItem value="materials" className="border-[#919191]/20">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Materiales
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {/* Material Search */}
                <div className="space-y-2">
                  <FormLabel className="text-xs font-medium text-foreground">Buscar Material</FormLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Escriba al menos 3 caracteres para buscar..."
                      value={materialSearchTerm}
                      onChange={(e) => setMaterialSearchTerm(e.target.value)}
                      className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm pl-10"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {materialSearchTerm.length >= 3 && materials.length > 0 && (
                    <div className="max-h-32 overflow-y-auto border border-[#919191]/20 rounded-lg bg-[#d2d2d2]">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          onClick={() => addMaterial(material)}
                          className="p-2 hover:bg-[#c2c2c2] cursor-pointer border-b border-[#919191]/10 last:border-b-0 flex items-center justify-between"
                        >
                          <div className="text-sm">{material.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {material.units?.name || 'Sin unidad'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {materialSearchTerm.length >= 3 && materials.length === 0 && (
                    <div className="text-xs text-muted-foreground p-2 border border-[#919191]/20 rounded-lg bg-[#d2d2d2]">
                      No se encontraron materiales
                    </div>
                  )}
                </div>

                {/* Selected Materials */}
                {selectedMaterials.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel className="text-xs font-medium text-foreground">Materiales Seleccionados</FormLabel>
                    {selectedMaterials.map((material) => (
                      <div key={material.material_id} className="flex items-center gap-2 p-2 border border-[#919191]/20 rounded-lg bg-[#d2d2d2]">
                        <div className="flex-1">
                          <div className="text-xs font-medium">{material.material_name}</div>
                        </div>
                        <div className="w-16">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Cant."
                            value={material.amount}
                            onChange={(e) => updateMaterialAmount(material.material_id, e.target.value)}
                            className="bg-white border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded text-xs h-7"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterial(material.material_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-5 w-5 p-0"
                        >
                          <X className="w-4 h-4" />
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