import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { usersService, CreateUserData, User } from '@/lib/usersService';
import { plansService, Plan } from '@/lib/plansService';

const userFormSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  full_name: z.string().min(1, 'El nombre completo es requerido'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  role: z.string().min(1, 'El rol es requerido'),
  plan_id: z.string().min(1, 'El plan es requerido'),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null; // Para edición
}

export default function AdminUsersModal({ 
  isOpen, 
  onClose, 
  user 
}: AdminUsersModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch plans for the select
  const { data: plans = [] } = useQuery({
    queryKey: ['/api/plans'],
    queryFn: () => plansService.getAll(),
    enabled: isOpen, // Only fetch when modal is open
  });
  
  // Find the FREE plan ID
  const freePlan = plans.find(plan => plan.name.toLowerCase() === 'free' || plan.price === 0);
  const defaultPlanId = freePlan?.id || plans[0]?.id || '';

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      role: user?.role || 'user',
      plan_id: user?.plan_id || defaultPlanId,
    },
  });

  // Reset form when user changes (for editing)
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        full_name: user.full_name || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role,
        plan_id: user.plan_id || defaultPlanId,
      });
    } else {
      form.reset({
        email: '',
        full_name: '',
        first_name: '',
        last_name: '',
        role: 'user',
        plan_id: defaultPlanId,
      });
    }
  }, [user, form, defaultPlanId]);

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return usersService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Éxito',
        description: 'Usuario creado correctamente',
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el usuario',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      try {
        return await usersService.update(user!.id, data);
      } catch (error) {
        console.error('Update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Éxito',
        description: 'Usuario actualizado correctamente',
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el usuario',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (user) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {user ? 'Modifica los datos del usuario existente.' : 'Crea un nuevo usuario en el sistema.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="usuario@ejemplo.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre completo del usuario"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Apellido"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? (user ? 'Actualizando...' : 'Creando...') 
                  : (user ? 'Actualizar' : 'Crear')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}