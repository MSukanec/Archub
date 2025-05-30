import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { materialsService, type Material, type CreateMaterialData } from '@/lib/materialsService';
import { unitsService } from '@/lib/unitsService';

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {material ? 'Editar Material' : 'Crear Nuevo Material'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Material</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ladrillo Visto" {...field} />
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
                  <FormLabel>Unidad de Medida</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                  <FormLabel>Costo (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : material ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}