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
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
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

  const getPlanLimit = (limitName: string): number => {
    if (!userWithPlan?.plan?.features) return 0;
    
    const features = userWithPlan.plan.features as Record<string, any>;
    return features[limitName] || 0;
  };

  const checkLimit = (limitName: string, currentCount: number): { 
    isLimited: boolean; 
    limit: number; 
    remaining: number;
    planName: string;
  } => {
    const planName = getCurrentPlan() || 'FREE';
    const limit = getPlanLimit(limitName);
    
    // Debug logs para identificar el problema
    console.log('CheckLimit Debug:', {
      limitName,
      currentCount,
      planName,
      limit,
      userWithPlan: userWithPlan?.plan
    });
    
    // Si es plan PRO o ENTERPRISE y el límite es 0 o no existe, significa sin límite
    if ((planName === 'PRO' || planName === 'ENTERPRISE') && (limit === 0 || !limit)) {
      return {
        isLimited: false,
        limit: -1, // -1 indica ilimitado
        remaining: -1,
        planName,
      };
    }
    
    return {
      isLimited: limit > 0 && currentCount >= limit,
      limit,
      remaining: Math.max(0, limit - currentCount),
      planName,
    };
  };

  return {
    hasFeature,
    getRequiredPlan,
    getCurrentPlan,
    getPlanLimit,
    checkLimit,
    userPlan: userWithPlan?.plan,
    isLoading: !userWithPlan,
  };
}