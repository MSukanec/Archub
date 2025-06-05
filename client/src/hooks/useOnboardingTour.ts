import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

const ONBOARDING_STORAGE_KEY = 'archub-onboarding-completed';

export function useOnboardingTour() {
  const { user } = useAuthStore();
  const [showTour, setShowTour] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`);
    
    if (!hasCompletedOnboarding) {
      setIsFirstVisit(true);
      // Show tour after a brief delay to let the app load
      setTimeout(() => {
        setShowTour(true);
      }, 1500);
    }
  }, [user?.id]);

  const completeTour = () => {
    if (user?.id) {
      localStorage.setItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`, 'true');
    }
    setShowTour(false);
    setIsFirstVisit(false);
  };

  const skipTour = () => {
    if (user?.id) {
      localStorage.setItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`, 'skipped');
    }
    setShowTour(false);
    setIsFirstVisit(false);
  };

  const startTour = () => {
    setShowTour(true);
  };

  const resetOnboarding = () => {
    if (user?.id) {
      localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`);
    }
    setIsFirstVisit(true);
    setShowTour(true);
  };

  return {
    showTour,
    isFirstVisit,
    completeTour,
    skipTour,
    startTour,
    resetOnboarding
  };
}