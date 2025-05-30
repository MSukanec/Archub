import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { materialsService, type Material, type CreateMaterialData } from '@/lib/materialsService';
import { unitsService } from '@/lib/unitsService';
import { materialCategoriesService } from '@/lib/materialCategoriesService';

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  unit_id: z.string({
    required_error: 'Debes seleccionar una unidad',
    invalid_type_error: 'Debes seleccionar una unidad',
  }).min(1, 'La unidad es obligatoria'),
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
      cost: 0,
    },
  });

  // Fetch units for the select dropdown
  const { data: units = [] } = useQuery({
    queryKey: ['/api/units'],
    queryFn: () => unitsService.getAll(),
  });

  // Set form values when editing
  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        unit_id: material.unit_id,
        cost: material.cost || 0,
      });
    } else {
      form.reset({
        name: '',
        unit_id: '',
        cost: 0,
      });
    }
  }, [material, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialData) => materialsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({ title: 'Material creado exitosamente' });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error al crear material',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateMaterialData) => materialsService.update(material!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      toast({ title: 'Material actualizado exitosamente' });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error al actualizar material',
        description: error.message,
        variant: 'destructive',
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogOverlay className="fixed inset-0 z-50 modal-backdrop" />
      <DialogContent className="fixed right-0 top-0 h-screen w-[400px] max-w-none rounded-none border-l border-border bg-[#e0e0e0] p-6 shadow-2xl data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right z-50 flex flex-col">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {material ? 'Editar Material' : 'Crear Nuevo Material'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Nombre del Material</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Ladrillo Visto" 
                        className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
                      />
                    </FormControl>
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
                        <SelectTrigger className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#d2d2d2] border-[#919191]/20">
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} {unit.description && `(${unit.description})`}
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
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Costo (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00" 
                        className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="border-t border-[#919191]/20 pt-6 mt-6">
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="bg-transparent border-[#919191] text-[#919191] hover:bg-[#919191]/10 rounded-lg"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? 'Guardando...' : material ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}