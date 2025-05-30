import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { Settings, Package, CheckSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const createTaskSchema = insertTaskSchema.extend({
  unit_labor_price: z.string().optional().or(z.literal('')),
  unit_material_price: z.string().optional().or(z.literal('')),
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
  id?: string;
  material_id: string;
  material_name: string;
  quantity: number;
  unit_cost: number;
}

export default function AdminTasksModal({ isOpen, onClose, task }: AdminTasksModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
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
        .select('id, name, code, parent_id, position')
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
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Filter categories by hierarchy
  const parentCategories = allCategories.filter(cat => cat.parent_id === null);
  const getSubcategories = (parentId: string) => 
    allCategories.filter(cat => cat.parent_id === parseInt(parentId));
  const getElementCategories = (subcategoryId: string) => 
    allCategories.filter(cat => cat.parent_id === parseInt(subcategoryId));

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: '',
      unit_labor_price: '',
      unit_material_price: '',
      category_id: null,
      subcategory_id: null,
      element_category_id: null,
    },
  });

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTaskMaterials([]);
      setSelectedMaterialId('');
      setMaterialQuantity('');
      setMaterialUnitCost('');
      
      if (task) {
        const categoryId = task.category_id?.toString() || '';
        const subcategoryId = task.subcategory_id?.toString() || '';
        
        setSelectedCategoryId(categoryId);
        setSelectedSubcategoryId(subcategoryId);
        
        form.reset({
          name: task.name || '',
          unit_labor_price: task.unit_labor_price?.toString() || '',
          unit_material_price: task.unit_material_price?.toString() || '',
          category_id: task.category_id,
          subcategory_id: task.subcategory_id,
          element_category_id: task.element_category_id,
        });
      } else {
        setSelectedCategoryId('');
        setSelectedSubcategoryId('');
        form.reset({
          name: '',
          unit_labor_price: '',
          unit_material_price: '',
          category_id: null,
          subcategory_id: null,
          element_category_id: null,
        });
      }
    }
  }, [isOpen, task, form]);

  // Add material to task
  const addMaterial = () => {
    if (!selectedMaterialId || !materialQuantity || !materialUnitCost) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos del material",
        variant: "destructive",
      });
      return;
    }

    const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
    if (!selectedMaterial) return;

    const newMaterial: TaskMaterial = {
      material_id: selectedMaterialId,
      material_name: selectedMaterial.name,
      quantity: parseFloat(materialQuantity),
      unit_cost: parseFloat(materialUnitCost),
    };

    setTaskMaterials(prev => [...prev, newMaterial]);
    setSelectedMaterialId('');
    setMaterialQuantity('');
    setMaterialUnitCost('');
  };

  // Remove material from task
  const removeMaterial = (index: number) => {
    setTaskMaterials(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate total material cost
  const getTotalMaterialCost = () => {
    return taskMaterials.reduce((total, material) => 
      total + (material.quantity * material.unit_cost), 0
    );
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setSelectedSubcategoryId('');
    form.setValue('category_id', value === 'none' ? null : parseInt(value));
    form.setValue('subcategory_id', null);
    form.setValue('element_category_id', null);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategoryId(value);
    form.setValue('subcategory_id', value === 'none' ? null : parseInt(value));
    form.setValue('element_category_id', null);
  };

  // Handle element category change
  const handleElementCategoryChange = (value: string) => {
    form.setValue('element_category_id', value === 'none' ? null : parseInt(value));
  };

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
    const taskData = {
      name: data.name,
      unit_labor_price: data.unit_labor_price ? parseFloat(data.unit_labor_price) : undefined,
      unit_material_price: data.unit_material_price ? parseFloat(data.unit_material_price) : undefined,
      category_id: data.category_id || undefined,
      subcategory_id: data.subcategory_id || undefined,
      element_category_id: data.element_category_id || undefined,
    };

    if (task) {
      updateMutation.mutate({ id: task.id, updates: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const subcategories = selectedCategoryId ? getSubcategories(selectedCategoryId) : [];
  const elementCategories = selectedSubcategoryId ? getElementCategories(selectedSubcategoryId) : [];

  const steps = [
    { title: 'Información Básica', icon: Settings },
    { title: 'Materiales', icon: Package }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    form.reset({
      name: '',
      unit_labor_price: '',
      unit_material_price: '',
      category_id: null,
      subcategory_id: null,
      element_category_id: null,
    });
    
    setCurrentStep(0);
    setSelectedCategoryId('');
    setSelectedSubcategoryId('');
    setTaskMaterials([]);
    setSelectedMaterialId('');
    setMaterialQuantity('');
    setMaterialUnitCost('');
    
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-hidden bg-[#e0e0e0] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8fc700] rounded-full flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[#333333]">
                {task ? 'Editar Tarea' : 'Nueva Tarea'}
              </DialogTitle>
              <DialogDescription className="text-[#666666]">
                Gestiona tareas de construcción y sus materiales asociados
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Navigation */}
        <div className="flex justify-between items-center py-4 border-b border-[#cccccc]">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setCurrentStep(index)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === currentStep ? 'bg-[#8fc700] text-white' : 
                  index < currentStep ? 'bg-[#d2d2d2] text-[#666666]' : 
                  'bg-[#f0f0f0] text-[#999999]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm ${
                  index === currentStep ? 'text-[#333333] font-medium' : 'text-[#666666]'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Step 0: Basic Information */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  {/* Rubro */}
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333]">Rubro <span className="text-[#8fc700]">*</span></FormLabel>
                        <Select
                          value={selectedCategoryId || ""}
                          onValueChange={handleCategoryChange}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                              <SelectValue placeholder="Seleccionar rubro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parentCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.code} {category.name}
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
                        <FormLabel className="text-[#333333]">Subrubro</FormLabel>
                        <Select
                          value={selectedSubcategoryId || ""}
                          onValueChange={handleSubcategoryChange}
                          disabled={!selectedCategoryId}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                              <SelectValue placeholder="Primero selecciona un rubro..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                {subcategory.code} {subcategory.name}
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
                        <FormLabel className="text-[#333333]">Elemento</FormLabel>
                        <Select
                          onValueChange={handleElementCategoryChange}
                          disabled={!selectedSubcategoryId}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                              <SelectValue placeholder="Seleccionar elemento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {elementCategories.map((element) => (
                              <SelectItem key={element.id} value={element.id.toString()}>
                                {element.code} {element.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nombre */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#333333]">
                          Nombre de la Tarea <span className="text-[#8fc700]">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ingresa el nombre de la tarea" 
                            className="bg-[#d2d2d2] border-[#cccccc]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Precio Mano de Obra */}
                    <FormField
                      control={form.control}
                      name="unit_labor_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#333333]">Precio Mano de Obra</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-[#d2d2d2] border-[#cccccc]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Precio Material */}
                    <FormField
                      control={form.control}
                      name="unit_material_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#333333]">Precio Material</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-[#d2d2d2] border-[#cccccc]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Materials */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Add Material Section */}
                  <div className="space-y-4 p-4 bg-[#f5f5f5] rounded-lg border border-[#ddd]">
                    <h4 className="text-sm font-medium text-[#333333]">Agregar Material</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Material</label>
                        <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                          <SelectTrigger className="bg-[#d2d2d2] border-[#cccccc]">
                            <SelectValue placeholder="Seleccionar material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Cantidad</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={materialQuantity}
                          onChange={(e) => setMaterialQuantity(e.target.value)}
                          className="bg-[#d2d2d2] border-[#cccccc]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Costo Unitario</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={materialUnitCost}
                          onChange={(e) => setMaterialUnitCost(e.target.value)}
                          className="bg-[#d2d2d2] border-[#cccccc]"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={addMaterial}
                      className="w-full bg-[#8fc700] hover:bg-[#7db600] text-white"
                    >
                      Agregar Material
                    </Button>
                  </div>

                  {/* Materials List */}
                  {taskMaterials.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-[#333333]">Materiales Agregados</h4>
                      {taskMaterials.map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#f9f9f9] rounded border border-[#ddd]">
                          <div className="flex-1">
                            <span className="font-medium text-[#333333]">{material.material_name}</span>
                            <div className="text-sm text-[#666666]">
                              Cantidad: {material.quantity} | Costo: ${material.unit_cost.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#8fc700]">
                              Total: ${(material.quantity * material.unit_cost).toFixed(2)}
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeMaterial(index)}
                              className="h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center p-3 bg-[#8fc700]/10 rounded border border-[#8fc700]/20">
                        <span className="font-medium text-[#333333]">Total de Materiales:</span>
                        <span className="font-bold text-[#8fc700]">
                          ${getTotalMaterialCost().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-[#cccccc] bg-[#e0e0e0]">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="bg-[#f0f0f0] border-[#cccccc] text-[#666666] hover:bg-[#e0e0e0]"
            >
              Anterior
            </Button>
            
            {currentStep < steps.length - 1 && (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-[#8fc700] hover:bg-[#7db600] text-white"
              >
                Siguiente
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="bg-[#f0f0f0] border-[#cccccc] text-[#666666] hover:bg-[#e0e0e0]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="bg-[#8fc700] hover:bg-[#7db600] text-white"
            >
              {isLoading
                ? 'Guardando...'
                : task
                ? 'Actualizar'
                : 'Crear'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}