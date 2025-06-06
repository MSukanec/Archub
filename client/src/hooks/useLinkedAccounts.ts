import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../hooks/use-toast';

export interface LinkedAccount {
  id: string;
  user_id: string;
  auth_id: string;
  provider: string;
  created_at: string;
}

export function useLinkedAccounts() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch linked accounts directly using auth_id
  const { data: linkedAccounts = [], isLoading, error } = useQuery({
    queryKey: ['linked-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching linked accounts for auth_id:', user.id);
      
      const { data, error } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('auth_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Linked accounts query result:', { data, error });

      if (error) {
        console.error('Error fetching linked accounts:', error);
        throw error;
      }

      return data as LinkedAccount[];
    },
    enabled: !!user?.id,
  });

  // Unlink account mutation
  const unlinkAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('linked_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-accounts'] });
      toast({
        title: 'Cuenta desvinculada',
        description: 'El método de inicio de sesión ha sido eliminado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error unlinking account:', error);
      toast({
        title: 'Error',
        description: 'No se pudo desvincular la cuenta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    },
  });

  // Link new account (Google OAuth)
  const linkGoogleAccount = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error linking Google account:', error);
      toast({
        title: 'Error',
        description: 'No se pudo vincular la cuenta de Google. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return {
    linkedAccounts,
    isLoading,
    error,
    unlinkAccount: unlinkAccountMutation.mutate,
    isUnlinking: unlinkAccountMutation.isPending,
    linkGoogleAccount,
    canUnlink: linkedAccounts.length > 1, // Only allow unlinking if more than one method exists
  };
}