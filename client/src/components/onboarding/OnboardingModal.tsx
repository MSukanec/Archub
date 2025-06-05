import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Wallet, Coins, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';

const onboardingSchema = z.object({
  organizationName: z.string().min(1, 'El nombre de la organización es obligatorio'),
  currencyId: z.string().min(1, 'Debe seleccionar una moneda'),
  walletId: z.string().min(1, 'Debe seleccionar una wallet'),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setUserContext } = useUserContextStore();

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: '',
      currencyId: '58c50aa7-b8b1-4035-b509-58028dd0e33f', // Default currency
      walletId: '2658c575-0fa8-4cf6-85d7-6430ded7e188', // Default wallet
    },
  });

  // Fetch currencies from Supabase
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase');
      
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching currencies:', error);
        throw new Error('Failed to fetch currencies');
      }
      
      return data || [];
    },
    enabled: isOpen,
  });

  // Fetch wallets from Supabase
  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase');
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching wallets:', error);
        throw new Error('Failed to fetch wallets');
      }
      
      return data || [];
    },
    enabled: isOpen,
  });

  // Create organization and complete onboarding
  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
      const { supabase } = await import('@/lib/supabase');
      
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      // 1. Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.organizationName,
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        throw new Error('Error al crear la organización');
      }

      // 2. Add user as organization member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error adding organization member:', memberError);
        throw new Error('Error al agregar miembro a la organización');
      }

      // 3. Link selected currency to organization
      const { error: currencyError } = await supabase
        .from('organization_currencies')
        .insert({
          organization_id: organization.id,
          currency_id: data.currencyId,
          is_default: true,
          is_active: true,
        });

      if (currencyError) {
        console.error('Error linking currency:', currencyError);
        throw new Error('Error al asignar moneda');
      }

      // 4. Link selected wallet to organization
      const { error: walletError } = await supabase
        .from('organization_wallets')
        .insert({
          organization_id: organization.id,
          wallet_id: data.walletId,
          is_default: true,
          is_active: true,
        });

      if (walletError) {
        console.error('Error linking wallet:', walletError);
        throw new Error('Error al asignar wallet');
      }

      // 5. Update user preferences to mark onboarding as completed
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .update({
          onboarding_completed: true,
          last_organization_id: organization.id,
        })
        .eq('user_id', user.id);

      if (preferencesError) {
        console.error('Error updating preferences:', preferencesError);
        throw new Error('Error al actualizar preferencias');
      }

      return organization;
    },
    onSuccess: (organization) => {
      toast({
        title: "¡Configuración completada!",
        description: "Tu organización ha sido creada exitosamente.",
      });
      
      // Update context with new organization
      setOrganizationId(organization.id);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      
      onClose();
    },
    onError: (error) => {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al completar la configuración",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingForm) => {
    onboardingMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            ¡Bienvenido a Archub!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configuremos tu organización para comenzar a gestionar tus proyectos de construcción
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Nombre de la Organización
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Constructora ABC"
                      {...field}
                      className="bg-background border-border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Moneda Principal
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name} ({currency.symbol})
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
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Wallet Principal
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Seleccionar wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} - {wallet.wallet_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={onboardingMutation.isPending}
              >
                {onboardingMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completar Configuración
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}