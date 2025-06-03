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
  | 'custom_training'
  | 'multiple_organizations'
  | 'multiple_members';

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
  multiple_organizations: 'ENTERPRISE',
  multiple_members: 'ENTERPRISE',
};

export function useUserPlan() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['/api/user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        console.log('Starting useUserPlan query for user:', user.id);
        
        // Direct approach - get user data from user context which already has plan_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, plan:plans(*)')
          .eq('auth_id', user.id)
          .single();
        
        console.log('Direct user query result:', userData);
        console.log('Direct user query error:', userError);
        
        if (userData && userData.plan) {
          console.log('Found user with plan:', userData);
          return userData;
        }

        // Fallback: Get user and plan separately
        const [usersResult, plansResult] = await Promise.all([
          supabase.from('users').select('*').eq('auth_id', user.id).single(),
          supabase.from('plans').select('*')
        ]);
        
        console.log('Fallback users result:', usersResult);
        console.log('Fallback plans result:', plansResult);
        
        if (usersResult.data && plansResult.data) {
          const userPlan = plansResult.data.find((p: any) => p.id === usersResult.data.plan_id);
          console.log('Found plan for user:', userPlan);
          
          const result = {
            ...usersResult.data,
            plan: userPlan || null
          };
          
          console.log('Final fallback result:', result);
          return result;
        }

        return null;
      } catch (err) {
        console.error('Error in useUserPlan:', err);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });
}

export function useFeatures() {
  const { data: userWithPlan, isLoading, error } = useUserPlan();
  
  console.log('useFeatures - userWithPlan:', userWithPlan);
  console.log('useFeatures - isLoading:', isLoading);
  console.log('useFeatures - error:', error);

  const hasFeature = (featureName: FeatureName): boolean => {
    console.log('hasFeature called with:', featureName);
    console.log('userWithPlan?.plan:', userWithPlan?.plan);
    
    if (!userWithPlan?.plan?.features) {
      console.log('No plan features found, returning false');
      return false;
    }
    
    const planFeatures = userWithPlan.plan.features;
    
    // Handle specific feature checks based on plan features structure
    if (typeof planFeatures === 'object' && planFeatures !== null) {
      // For multiple_organizations, check max_organizations limit AND plan type
      if (featureName === 'multiple_organizations') {
        const planName = getCurrentPlan();
        const maxOrgs = planFeatures.max_organizations || 1;
        // Only Enterprise plans can have multiple organizations
        return planName === 'ENTERPRISE' && maxOrgs > 1;
      }
      
      // For export_pdf, check export_pdf_custom
      if (featureName === 'export_pdf') {
        return planFeatures.export_pdf_custom === true;
      }
      
      // For other features, check if they exist as properties
      return featureName in planFeatures || planFeatures[featureName] === true;
    }
    
    // Handle array format for backwards compatibility
    if (Array.isArray(planFeatures)) {
      return planFeatures.includes(featureName);
    }
    
    return false;
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
    
    // Clean implementation without debug logs
    
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