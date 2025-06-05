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
        .maybeSingle();

      if (error) {
        console.error('Error fetching onboarding status:', error);
        return { needsOnboarding: true };
      }

      // If no preferences exist or onboarding_completed is false/null, user needs onboarding
      return { 
        needsOnboarding: !data || !data.onboarding_completed 
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}