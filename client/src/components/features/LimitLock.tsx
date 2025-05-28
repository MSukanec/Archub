import { ReactNode } from 'react';
import { useFeatures } from '@/hooks/useFeatures';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Crown, Lock } from 'lucide-react';

interface LimitLockProps {
  children?: ReactNode;
  limitName: string;
  currentCount: number;
  featureName: string;
  description?: string;
  className?: string;
}

export function LimitLock({ 
  children, 
  limitName, 
  currentCount, 
  featureName,
  description,
  className = '' 
}: LimitLockProps) {
  const { checkLimit, isLoading } = useFeatures();

  if (isLoading) {
    return children ? <>{children}</> : null;
  }

  const limitCheck = checkLimit(limitName, currentCount);

  if (!limitCheck.isLimited) {
    return children ? <>{children}</> : null;
  }

  const upgradeMessage = description || `Has alcanzado el límite de ${limitCheck.limit} ${featureName}${limitCheck.limit !== 1 ? 's' : ''} para el plan ${limitCheck.planName}. Actualiza tu plan para crear más ${featureName}s.`;

  // Si hay children, envolver con badge
  if (children) {
    return (
      <div className={`relative ${className}`}>
        {children}
        <Popover>
          <PopoverTrigger asChild>
            <div className="absolute top-2 right-2 bg-background border border-border rounded-full p-1 shadow-lg cursor-help hover:bg-muted transition-colors">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" side="top">
            <div className="p-4 border-b border-border bg-yellow-500/10 border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold text-sm">Actualización Requerida</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                {upgradeMessage}
              </p>
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
                }}
              >
                <Crown className="h-4 w-4 mr-2" />
                Actualizar a PRO
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Solo badge sin children
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={`absolute -top-1 -right-1 bg-red-500 border-2 border-background rounded-full p-1 shadow-lg cursor-help hover:bg-red-600 transition-colors z-10 ${className}`}
          onMouseEnter={(e) => {
            // Trigger popover on hover
            e.currentTarget.click();
          }}
        >
          <Lock className="h-3 w-3 text-white" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="top">
        <div className="p-4 border-b border-border bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold text-sm">Actualización Requerida</h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {upgradeMessage}
          </p>
          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
            }}
          >
            <Crown className="h-4 w-4 mr-2" />
            Actualizar a PRO
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}