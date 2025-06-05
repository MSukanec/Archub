import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

export function useOnboardingStatus() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { needsOnboarding: false };
      }

      const { supabase } = await import('@/lib/supabase');
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching onboarding status:', error);
        // If no preferences exist, user needs onboarding
        return { needsOnboarding: true };
      }

      return { 
        needsOnboarding: !data?.onboarding_completed 
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}