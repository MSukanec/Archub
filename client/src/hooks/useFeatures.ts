import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Define feature types
export type FeatureName = 
  | 'export_pdf'
  | 'financial_module'
  | 'advanced_reports'
  | 'team_collaboration'
  | 'api_access'
  | 'custom_integrations'
  | 'unlimited_projects'
  | 'priority_support'
  | 'dedicated_support'
  | 'custom_training';

// Define plan types
export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

// Feature to plan mapping
const FEATURE_PLANS: Record<FeatureName, PlanType> = {
  export_pdf: 'PRO',
  financial_module: 'PRO',
  advanced_reports: 'PRO',
  team_collaboration: 'PRO',
  api_access: 'ENTERPRISE',
  custom_integrations: 'ENTERPRISE',
  unlimited_projects: 'PRO',
  priority_support: 'PRO',
  dedicated_support: 'ENTERPRISE',
  custom_training: 'ENTERPRISE',
};

export function useUserPlan() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['/api/user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('auth_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: true,
  });
}

export function useFeatures() {
  const { data: userWithPlan } = useUserPlan();

  const hasFeature = (featureName: FeatureName): boolean => {
    if (!userWithPlan?.plan?.features) return false;
    
    const planFeatures = userWithPlan.plan.features as string[];
    return planFeatures.includes(featureName);
  };

  const getRequiredPlan = (featureName: FeatureName): PlanType => {
    return FEATURE_PLANS[featureName] || 'PRO';
  };

  const getCurrentPlan = (): PlanType | null => {
    return userWithPlan?.plan?.name as PlanType || null;
  };

  return {
    hasFeature,
    getRequiredPlan,
    getCurrentPlan,
    userPlan: userWithPlan?.plan,
    isLoading: !userWithPlan,
  };
}