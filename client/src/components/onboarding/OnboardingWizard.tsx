import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { useUserContextStore } from '../../stores/userContextStore';
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { OnboardingStep1 } from './steps/OnboardingStep1';
import { OnboardingStep2 } from './steps/OnboardingStep2';
import { OnboardingStep3 } from './steps/OnboardingStep3';
import { supabase } from '../../lib/supabase';

export function OnboardingWizard() {
  const { user } = useAuthStore();
  const { isOpen, currentStep, openModal, closeModal } = useOnboardingStore();

  // Check if user needs onboarding
  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.log('No user preferences found, onboarding needed');
        return { onboarding_completed: false };
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Auto-open modal if onboarding not completed
  useEffect(() => {
    if (userPreferences && !userPreferences.onboarding_completed && !isOpen) {
      openModal();
    }
  }, [userPreferences, isOpen, openModal]);

  // Development button to force open onboarding
  const handleForceOpen = () => {
    openModal();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingStep1 />;
      case 2:
        return <OnboardingStep2 />;
      case 3:
        return <OnboardingStep3 />;
      default:
        return <OnboardingStep1 />;
    }
  };

  return (
    <>
      {/* Development force-open button */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleForceOpen}
          className="fixed bottom-4 right-4 z-50 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          Open Onboarding
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogTitle className="sr-only">
            Configuración inicial - Paso {currentStep} de 3
          </DialogTitle>
          {renderStep()}
        </DialogContent>
      </Dialog>
    </>
  );
}