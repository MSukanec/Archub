import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModernModal from '../ui/ModernModal';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { materialsService, type Material, type CreateMaterialData } from '../../lib/materialsService';
import { unitsService } from '../../lib/unitsService';
import { materialCategoriesService } from '../../lib/materialCategoriesService';
import { Package } from 'lucide-react';

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  unit_id: z.string({
    required_error: 'Debes seleccionar una unidad',
    invalid_type_error: 'Debes seleccionar una unidad',
  }).min(1, 'La unidad es obligatoria'),
  category_id: z.string({
    required_error: 'Debes seleccionar una categoría',
    invalid_type_error: 'Debes seleccionar una categoría',
  }).min(1, 'La categoría es obligatoria'),
  cost: z.coerce.number().min(0, 'El costo debe ser mayor o igual a 0').optional(),
});

interface AdminMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  material?: Material | null;
}

export default function AdminMaterialsModal({ isOpen, onClose, material }: AdminMaterialsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateMaterialData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      unit_id: '',
      category_id: '',
      cost: 0,
    },
  });

  // Fetch units for the select dropdown
  const { data: units = [] } = useQuery({
    queryKey: ['/api/units'],
    queryFn: () => unitsService.getAll(),
  });

  // Fetch material categories for the select dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/material-categories'],
    queryFn: () => materialCategoriesService.getAll(),
  });

  // Set form values when editing
  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        unit_id: material.unit_id,
        category_id: material.category_id || '',
        cost: material.cost || 0,
      });
    } else {
      form.reset({
        name: '',
        unit_id: '',
        category_id: '',
        cost: 0,
      });
    }
  }, [material, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialData) => materialsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Material creado",
        description: "El material se ha creado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el material.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateMaterialData) => materialsService.update(material!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({
        title: "Material actualizado",
        description: "El material se ha actualizado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el material.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: CreateMaterialData) => {
    setIsSubmitting(true);
    
    if (material) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  const footer = (
    <div className="flex gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isSubmitting}
        className="w-1/4 bg-transparent border-input text-foreground hover:bg-surface-secondary rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="material-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (material ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={material ? 'Editar Material' : 'Crear Nuevo Material'}
      subtitle="Gestiona los materiales de construcción del sistema"
      icon={Package}
      footer={footer}
    >
      <Form {...form}>
        <form id="material-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Nombre del Material</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Ladrillo Visto" 
                    className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-foreground">Categoría <span className="text-primary">*</span></FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-primary border-input z-[10000]">
                    {categories
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Unidad de Medida</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-primary border-input z-[10000]">
                    {units
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)}>
                          {unit.name} {unit.description && `(${unit.description})`}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Precio (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00" 
                    className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ModernModal>
  );
}