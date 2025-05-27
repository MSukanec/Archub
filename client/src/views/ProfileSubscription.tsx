import { Check, CreditCard, Calendar, Zap, Crown, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatures } from '@/hooks/useFeatures';
import { useQuery } from '@tanstack/react-query';
import { plansService } from '@/lib/plansService';

const plans = [
  {
    name: 'Básico',
    price: 'Gratis',
    description: 'Perfecto para empezar',
    icon: Zap,
    color: 'from-green-500 to-emerald-600',
    borderColor: 'border-green-500',
    features: [
      'Hasta 5 proyectos',
      'Gestión básica de presupuestos',
      'Bitácora de obra básica',
      'Soporte por email',
    ],
    current: true,
  },
  {
    name: 'Profesional',
    price: '$29/mes',
    description: 'Para equipos en crecimiento',
    icon: Crown,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500',
    features: [
      'Proyectos ilimitados',
      'Gestión avanzada de presupuestos',
      'Bitácora de obra completa',
      'Colaboración en equipo',
      'Reportes y análisis',
      'Soporte prioritario',
    ],
    current: false,
  },
  {
    name: 'Empresarial',
    price: '$99/mes',
    description: 'Para organizaciones grandes',
    icon: Rocket,
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500',
    features: [
      'Todo de Profesional',
      'API personalizada',
      'Integraciones avanzadas',
      'Gestión de múltiples organizaciones',
      'Soporte dedicado 24/7',
      'Entrenamiento personalizado',
    ],
    current: false,
  },
];

export default function Subscription() {
  const { getCurrentPlan, userPlan, isLoading } = useFeatures();
  
  // Fetch all available plans
  const { data: availablePlans = [] } = useQuery({
    queryKey: ['/api/plans'],
    queryFn: () => plansService.getAll(),
  });

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'free':
        return Zap;
      case 'pro':
        return Crown;
      case 'enterprise':
        return Rocket;
      default:
        return Zap;
    }
  };

  const currentPlanName = getCurrentPlan() || 'FREE';
  const currentPlan = userPlan || { name: 'FREE', price: '0' };

  if (isLoading) {
    return <div className="p-4">Cargando información del plan...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Suscripción
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu plan de suscripción y método de pago.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2" size={20} />
              Plan Actual
            </CardTitle>
            <Badge variant="default" className="bg-primary/10 text-primary">
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Plan {currentPlan.name}</h3>
            <p className="text-sm text-muted-foreground">
              {String(currentPlan.price) === '0' 
                ? 'Gratis para siempre • Hasta 5 proyectos'
                : `$${currentPlan.price}/mes • Proyectos ilimitados`}
            </p>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar size={16} className="mr-2" />
            {String(currentPlan.price) === '0' 
              ? 'Sin fecha de renovación'
              : 'Próxima renovación: Mensual'}
          </div>

          <div className="pt-4">
            <Button className="bg-primary hover:bg-primary/90">
              Actualizar Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Planes Disponibles
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const IconComponent = getPlanIcon(plan.name);
            const isCurrentPlan = plan.name === currentPlan.name;
            
            return (
              <Card 
                key={plan.id} 
                className={isCurrentPlan ? 'border-primary border-2' : 'hover:border-border/60 transition-colors'}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="flex items-center justify-center">
                    {plan.name}
                    {isCurrentPlan && (
                      <Badge variant="default" className="ml-2 bg-primary/10 text-primary">
                        Actual
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="py-4">
                    <span className="text-3xl font-bold text-foreground">
                      {String(plan.price) === '0' ? 'Gratis' : `$${plan.price}`}
                    </span>
                    {String(plan.price) !== '0' && (
                      <span className="text-muted-foreground">/mes</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.name === 'FREE' ? 'Perfecto para empezar' : 
                     plan.name === 'PRO' ? 'Para equipos en crecimiento' :
                     'Para empresas grandes'}
                  </p>
                </CardHeader>
              
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features && Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check size={16} className="mr-2 text-green-400 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      isCurrentPlan 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Sin método de pago configurado
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Configura un método de pago para actualizar tu plan.
            </p>
            <Button className="mt-4 bg-primary hover:bg-primary/90">
              Añadir Método de Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Uso Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Proyectos</span>
            <span className="text-sm font-medium text-foreground">0 / 5</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Tienes 5 proyectos disponibles en tu plan actual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
