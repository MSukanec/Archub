import { ReactNode, useState } from 'react';
import { useFeatures } from '@/hooks/useFeatures';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
        className="w-96 p-0 border-0 shadow-2xl backdrop-blur-sm" 
        side="top"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Header premium con gradiente */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 p-6 rounded-t-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
          <div className="relative flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Crown className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">¡Desbloquea Premium!</h3>
              <p className="text-blue-100 text-sm opacity-90">Accede a proyectos ilimitados</p>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-gradient-to-b from-slate-50 to-white p-6 space-y-4 rounded-b-lg">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2 mt-1">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {upgradeMessage}
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">✨ Con PRO obtienes:</p>
            <ul className="text-xs text-blue-600 mt-1 space-y-1">
              <li>• Proyectos ilimitados</li>
              <li>• Reportes avanzados</li>
              <li>• Soporte prioritario</li>
            </ul>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
            }}
          >
            <Crown className="h-4 w-4 mr-2" />
            Actualizar a PRO ahora
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}