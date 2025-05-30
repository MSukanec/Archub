import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ruler } from 'lucide-react';
import ModernModal from '@/components/ui/ModernModal';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { unitsService } from '@/lib/unitsService';

const unitFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
});

type UnitFormData = z.infer<typeof unitFormSchema>;

interface Unit {
  id: string;
  name: string;
  description: string;
}

interface AdminUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit?: Unit | null;
}

export default function AdminUnitsModal({ isOpen, onClose, unit }: AdminUnitsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (unit) {
      form.reset({
        name: unit.name,
        description: unit.description,
      });
    } else {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [unit, form]);

  const createMutation = useMutation({
    mutationFn: (data: UnitFormData) => unitsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/units'] });
      toast({
        title: "Unidad creada",
        description: "La unidad se ha creado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la unidad.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UnitFormData) => unitsService.update(unit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/units'] });
      toast({
        title: "Unidad actualizada",
        description: "La unidad se ha actualizado exitosamente.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la unidad.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: UnitFormData) => {
    setIsSubmitting(true);
    
    if (unit) {
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
        className="w-1/4 bg-transparent border-[#919191]/30 text-foreground hover:bg-[#d0d0d0] rounded-lg"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="unit-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (unit ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={unit ? 'Editar Unidad' : 'Crear Nueva Unidad'}
      subtitle="Gestiona las unidades de medida utilizadas en el proyecto"
      icon={Ruler}
      footer={footer}
    >
      <Form {...form}>
        <form id="unit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Símbolo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: m, kg, etc."
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Descripción</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Metro, Kilogramo, etc."
                    className="bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
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