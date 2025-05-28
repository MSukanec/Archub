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
    staleTime: 0, // Sin cache para detectar cambios de plan inmediatamente
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
    const planName = userWithPlan?.plan?.name;
    if (!planName) return null;
    
    // Convertir a uppercase para coincidir con los tipos esperados
    return planName.toUpperCase() as PlanType;
  };

  const getPlanLimit = (limitName: string): number => {
    const planName = getCurrentPlan() || 'FREE';
    
    // Si no hay plan cargado desde la BD, usar límites por defecto
    if (!userWithPlan?.plan?.features) {
      const defaultLimits: Record<string, Record<string, number>> = {
        'FREE': { 'max_projects': 2 },
        'PRO': { 'max_projects': -1 }, // -1 = ilimitado
        'ENTERPRISE': { 'max_projects': -1 }
      };
      return defaultLimits[planName]?.[limitName] || 0;
    }
    
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
      userWithPlan: userWithPlan?.plan,
      fullUserData: userWithPlan
    });
    
    // Si el límite es -1, significa ilimitado (PRO/ENTERPRISE)
    if (limit === -1) {
      return {
        isLimited: false,
        limit: -1,
        remaining: -1,
        planName,
      };
    }
    
    // Para planes FREE con límites específicos
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