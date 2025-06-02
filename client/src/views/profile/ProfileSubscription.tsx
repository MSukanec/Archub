import { useState, useEffect } from 'react';
import { Check, CreditCard, Calendar, Zap, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatures } from '@/hooks/useFeatures';
import { useNavigationStore } from '@/stores/navigationStore';
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
  const { setSection, setView } = useNavigationStore();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('profile-subscription');
  }, [setSection, setView]);
  
  // Fetch all available plans with error handling
  const { data: availablePlans = [], isLoading: plansLoading, error } = useQuery({
    queryKey: ['/api/plans'],
    queryFn: () => plansService.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    refetchOnWindowFocus: false,
    retry: 1,
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

  if (isLoading || plansLoading) {
    return <div className="p-4">Cargando información del plan...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium text-foreground mb-2">Suscripción</h3>
        <p className="text-muted-foreground">
          No se pudieron cargar los planes. Mostrando información básica.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Suscripción
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu plan de suscripción y método de pago
            </p>
          </div>
        </div>
      </div>

      {/* Plan Actual */}
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Plan Actual</h3>
          <Badge variant="default" className="bg-primary/10 text-primary ml-auto">
            {currentPlan.name}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground">Plan {currentPlan.name}</h4>
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

          <Button className="bg-primary hover:bg-primary/90 rounded-xl">
            Actualizar Plan
          </Button>
        </div>
      </div>

      {/* Planes Disponibles */}
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Planes Disponibles</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansLoading ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-muted-foreground">Cargando planes disponibles...</p>
            </div>
          ) : availablePlans.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-muted-foreground">No hay planes disponibles en este momento.</p>
            </div>
          ) : (
            availablePlans.map((plan) => {
              const IconComponent = getPlanIcon(plan.name);
              const isCurrentPlan = plan.name === currentPlan.name;
            
              return (
                <div 
                  key={plan.id} 
                  className={`rounded-xl p-6 border-2 transition-colors ${
                    isCurrentPlan ? 'border-primary bg-primary/5' : 'border-border hover:border-border/60 bg-card'
                  }`}
                >
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-foreground">{plan.name}</h4>
                      {isCurrentPlan && (
                        <Badge variant="default" className="bg-primary/10 text-primary">
                          Actual
                        </Badge>
                      )}
                    </div>
                    <div className="py-2">
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
                  </div>
                
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features && Array.isArray(plan.features) && plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check size={16} className="mr-2 text-green-400 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full rounded-xl ${
                        isCurrentPlan 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Información de Facturación */}
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Información de Facturación</h3>
        </div>
        
        <div className="text-center py-8">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
          <h4 className="mt-4 text-lg font-medium text-foreground">
            Sin método de pago configurado
          </h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Configura un método de pago para actualizar tu plan.
          </p>
          <Button className="mt-4 bg-primary hover:bg-primary/90 rounded-xl">
            Añadir Método de Pago
          </Button>
        </div>
      </div>

      {/* Estadísticas de Uso */}
      <div className="rounded-2xl shadow-md bg-card p-6 border-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Uso Actual</h3>
        </div>
        
        <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
}
