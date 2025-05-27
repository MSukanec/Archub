import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Crown, Rocket, Lock } from 'lucide-react';
import { useFeatures, FeatureName, PlanType } from '@/hooks/useFeatures';

interface FeaturePopoverProps {
  feature: FeatureName;
  children?: React.ReactNode;
  asChild?: boolean;
}

const PLAN_CONFIG: Record<PlanType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  name: string;
}> = {
  PRO: {
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    name: 'Profesional'
  },
  ENTERPRISE: {
    icon: Rocket,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    name: 'Empresarial'
  },
  FREE: {
    icon: Lock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    name: 'Gratuito'
  }
};

const FEATURE_MESSAGES: Record<FeatureName, string> = {
  export_pdf: 'Exporta tus reportes y presupuestos en formato PDF profesional',
  financial_module: 'Accede al módulo financiero completo con análisis avanzados',
  advanced_reports: 'Genera reportes avanzados con métricas detalladas',
  team_collaboration: 'Colabora en tiempo real con tu equipo',
  api_access: 'Conecta con APIs externas y automatiza procesos',
  custom_integrations: 'Integra con sistemas personalizados de tu empresa',
  unlimited_projects: 'Crea proyectos ilimitados sin restricciones',
  priority_support: 'Recibe soporte prioritario de nuestro equipo',
  dedicated_support: 'Soporte dedicado 24/7 para tu organización',
  custom_training: 'Entrenamiento personalizado para tu equipo',
};

export function FeaturePopover({ feature, children, asChild = false }: FeaturePopoverProps) {
  const { getRequiredPlan } = useFeatures();
  const requiredPlan = getRequiredPlan(feature);
  const planConfig = PLAN_CONFIG[requiredPlan];
  const PlanIcon = planConfig.icon;
  const featureMessage = FEATURE_MESSAGES[feature];

  const handleUpgrade = () => {
    // Trigger navigation to subscription page
    window.dispatchEvent(new CustomEvent('navigate-to-subscription-tables'));
  };

  const trigger = children || (
    <div className="inline-flex items-center gap-1 text-muted-foreground">
      <Lock size={16} />
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className={`w-80 p-0 border ${planConfig.borderColor}`} side="top" align="center">
        <div className={`${planConfig.bgColor} p-4 rounded-t-lg border-b ${planConfig.borderColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <PlanIcon className={`h-5 w-5 ${planConfig.color}`} />
            <span className="font-semibold text-foreground">
              Función {planConfig.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {featureMessage}
          </p>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Disponible en plan {planConfig.name}
            </span>
          </div>
          
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-primary hover:bg-primary/90"
            size="sm"
          >
            Mejorar Plan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}