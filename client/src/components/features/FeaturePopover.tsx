import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Crown, Rocket, Lock } from 'lucide-react';
import { useFeatures, FeatureName, PlanType } from '../../hooks/useFeatures';

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
  buttonBgColor: string;
  name: string;
}> = {
  PRO: {
    icon: Crown,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    buttonBgColor: 'bg-blue-600 hover:bg-blue-700',
    name: 'Profesional'
  },
  ENTERPRISE: {
    icon: Rocket,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    buttonBgColor: 'bg-purple-600 hover:bg-purple-700',
    name: 'Empresarial'
  },
  FREE: {
    icon: Lock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    buttonBgColor: 'bg-gray-600 hover:bg-gray-700',
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
  multiple_organizations: 'Gestiona múltiples organizaciones desde una cuenta',
  multiple_members: 'Agrega más miembros a tu equipo de trabajo',
};

export function FeaturePopover({ feature, children, asChild = false }: FeaturePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger 
        asChild={asChild}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 bg-[#141414] border-border/50 shadow-xl" 
        side="top" 
        align="center"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="bg-[#141414] p-3 rounded-t-lg border-b border-border/20">
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-full ${planConfig.bgColor}`}>
              <PlanIcon className={`h-4 w-4 ${planConfig.color}`} />
            </div>
            <span className="font-medium text-white text-sm">
              Función {planConfig.name}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {featureMessage}
          </p>
        </div>
        
        <div className="p-3 bg-[#141414]">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              Disponible en plan {planConfig.name}
            </span>
          </div>
          
          <Button 
            onClick={handleUpgrade}
            className={`w-full h-8 text-xs ${planConfig.buttonBgColor} border-0 shadow-md hover:shadow-lg transition-all duration-200`}
            size="sm"
          >
            Mejorar Plan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}