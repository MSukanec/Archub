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
import { Wrench, DollarSign, Package } from 'lucide-react';

// Schema for form validation
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

type TaskWithNewFields = {
  id: string;
  name: string;
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
  task?: TaskWithNewFields | null;
}

export default function AdminTasksModal({ isOpen, onClose, task }: AdminTasksModalProps) {
  const { organizationId } = useUserContextStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedElementId, setSelectedElementId] = useState<string>('');
  const isEditing = !!task;

  // Use hierarchical concepts hook for task categories (same as MovementModal)
  const { data: taskCategoriesStructure, isLoading: taskCategoriesLoading } = useHierarchicalConcepts('task_categories');

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
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

  // Get hierarchical categories (same as MovementModal)
  const mainCategories = taskCategoriesStructure?.getRootConcepts() || [];
  const subcategoriesFiltered = taskCategoriesStructure?.getChildConcepts(selectedCategoryId) || [];
  const elementCategoriesFiltered = taskCategoriesStructure?.getChildConcepts(form.watch('subcategory_id')) || [];

  // Initialize form when modal opens (exact same logic as MovementModal)
  useEffect(() => {
    if (isOpen && taskCategoriesStructure) {
      if (task && isEditing) {
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
          
          setSelectedActionId(task.action_id || '');
          
          // Set element_id with proper timing to ensure UI synchronization
          setTimeout(() => {
            form.setValue('element_id', task.element_id || '');
            setSelectedElementId(task.element_id || '');
            console.log('Synced element_id after delay:', task.element_id);
          }, 20);
        }
      } else {
        // Creating new task - reset everything (same as MovementModal)
        setSelectedCategoryId('');
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
  }, [task, isOpen, taskCategoriesStructure, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const taskData = {
        name: data.name,
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

      if (isEditing && task) {
        const { data: result, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (error) throw error;
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
    createMutation.mutate(data);
  };

  return (
    <ModernModal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Tarea" : "Crear Tarea"}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Accordion type="multiple" defaultValue={["category", "task", "pricing"]} className="w-full">
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
                      <FormLabel className="text-xs font-medium text-foreground">Rubro</FormLabel>
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
                      <FormLabel className="text-xs font-medium text-foreground">Subrubro</FormLabel>
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
                      <FormLabel className="text-xs font-medium text-foreground">Elemento</FormLabel>
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
                      <FormLabel className="text-xs font-medium text-foreground">Nombre de la Tarea</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la tarea"
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
                      <FormLabel className="text-xs font-medium text-foreground">Unidad</FormLabel>
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
          </Accordion>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="text-sm"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="text-sm bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Form>
    </ModernModal>
  );
}