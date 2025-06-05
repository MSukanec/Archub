import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

export default function WelcomeButton() {
  const { startTour, resetOnboarding } = useOnboardingTour();

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={startTour}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30"
      >
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-blue-700 dark:text-blue-300">Tour de Bienvenida</span>
      </Button>
      
      <Button
        onClick={resetOnboarding}
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Reiniciar
      </Button>
    </div>
  );
}