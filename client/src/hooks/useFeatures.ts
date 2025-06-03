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
  | 'multiple_organizations';

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
};

export function useUserPlan() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['/api/user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // Try using the new is_admin RPC function to avoid recursion
        const { data: isAdminResult, error: adminError } = await supabase
          .rpc('is_admin');
        
        if (!adminError && isAdminResult) {
          // User is admin, use RPC to get user data
          const { data: userData, error: userError } = await supabase
            .rpc('get_users_for_admin');
          
          if (!userError && userData && Array.isArray(userData)) {
            const currentUser = userData.find(u => u.auth_id === user.id);
            if (currentUser) {
              // Get plan data
              const { data: planData } = await supabase
                .from('plans')
                .select('*')
                .eq('id', currentUser.plan_id)
                .single();
              
              return {
                ...currentUser,
                plan: planData
              };
            }
          }
        }
        
        // For regular users or fallback
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            plan:plans(*)
          `)
          .eq('auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user plan:', error);
          return null;
        }
        return data;
      } catch (err) {
        console.error('Error in useUserPlan:', err);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
  });
}

export function useFeatures() {
  const { data: userWithPlan } = useUserPlan();

  const hasFeature = (featureName: FeatureName): boolean => {
    if (!userWithPlan?.plan?.features) return false;
    
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