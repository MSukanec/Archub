import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ModernModal from '../ui/ModernModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useToast } from '../../hooks/use-toast';
import { usersService, CreateUserData, User } from '../../lib/usersService';
import { plansService, Plan } from '../../lib/plansService';
import { Users } from 'lucide-react';

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
  user?: User | null;
}

export default function AdminUsersModal({ 
  isOpen, 
  onClose, 
  user 
}: AdminUsersModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch plans for the select
  const { data: plans = [] } = useQuery({
    queryKey: ['/api/plans'],
    queryFn: () => plansService.getAll(),
    enabled: isOpen,
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

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        email: user?.email || '',
        full_name: user?.full_name || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        role: user?.role || 'user',
        plan_id: user?.plan_id || defaultPlanId,
      });
    }
  }, [user, isOpen, form, defaultPlanId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersService.update(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado correctamente.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario.",
        variant: "destructive",
      });
    },
    onSettled: () => setIsSubmitting(false),
  });

  const onSubmit = (data: UserFormData) => {
    setIsSubmitting(true);
    
    if (user) {
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
        form="user-form"
        disabled={isSubmitting}
        className="w-3/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      >
        {isSubmitting ? 'Guardando...' : (user ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title={user ? 'Editar Usuario' : 'Nuevo Usuario'}
      subtitle="Gestiona los usuarios del sistema"
      icon={Users}
      footer={footer}
    >
      <Form {...form}>
        <form id="user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="usuario@ejemplo.com"
                    type="email"
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
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Nombre completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nombre completo del usuario"
                    className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
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
                  <FormLabel className="text-sm font-medium text-foreground">Nombre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre"
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
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Apellido</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Apellido"
                      className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg"
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
                <FormLabel className="text-sm font-medium text-foreground">Rol</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-primary border-input">
                    <SelectItem value="user">Usuario</SelectItem>
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
                <FormLabel className="text-sm font-medium text-foreground">Plan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-surface-primary border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg">
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-surface-primary border-input">
                    {plans.map((plan: Plan) => (
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
        </form>
      </Form>
    </ModernModal>
  );
}