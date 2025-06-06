import { ReactNode, useState } from 'react';
import { useFeatures } from '../../hooks/useFeatures';
import { Button } from "./components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Crown, Lock, Sparkles, Zap } from 'lucide-react';

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
    const [isChildrenOpen, setIsChildrenOpen] = useState(false);
    
    return (
      <div className={`relative ${className}`}>
        {children}
        <Popover open={isChildrenOpen} onOpenChange={setIsChildrenOpen}>
          <PopoverTrigger asChild>
            <div 
              className="absolute top-2 right-2 bg-background border border-border rounded-full p-1 shadow-lg cursor-help hover:bg-muted transition-colors"
              onMouseEnter={() => setIsChildrenOpen(true)}
              onMouseLeave={() => setIsChildrenOpen(false)}
            >
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-72 p-0 bg-surface-views border-border/50 shadow-xl" 
            side="top"
            onMouseEnter={() => setIsChildrenOpen(true)}
            onMouseLeave={() => setIsChildrenOpen(false)}
          >
            <div className="bg-surface-primary p-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-blue-500/10">
                  <Crown className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="font-medium text-sm text-foreground">Actualización Requerida</h3>
              </div>
            </div>
            <div className="p-3 bg-surface-views space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {upgradeMessage}
              </p>
              <Button 
                className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
                }}
              >
                <Crown className="h-3 w-3 mr-1" />
                Actualizar a PRO
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  const [isOpen, setIsOpen] = useState(false);

  // Solo badge sin children
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={`absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-background rounded-full p-1.5 shadow-lg cursor-help hover:from-blue-600 hover:to-blue-700 transition-all duration-300 z-10 hover:scale-110 ${className}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <Lock className="h-3 w-3 text-white" />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 border border-border/20 shadow-xl bg-background" 
        side="top"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Header premium con gradiente */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 p-4 rounded-t-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
          <div className="relative flex items-center gap-2">
            <div className="bg-white/20 rounded-full p-1.5">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">¡Desbloquea Premium!</h3>
              <p className="text-blue-100 text-xs opacity-90">Accede a proyectos ilimitados</p>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-surface-views p-3 space-y-3 rounded-b-lg">
          <div className="flex items-start gap-2">
            <div className="bg-primary/10 rounded-full p-1.5 mt-0.5">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {upgradeMessage}
              </p>
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-2 border border-primary/20">
            <p className="text-xs text-primary font-medium">✨ Con PRO obtienes:</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <li>• Proyectos ilimitados</li>
              <li>• Reportes avanzados</li>
              <li>• Soporte prioritario</li>
            </ul>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs h-8"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
            }}
          >
            <Crown className="h-3 w-3 mr-1" />
            Actualizar a PRO ahora
            <Sparkles className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}