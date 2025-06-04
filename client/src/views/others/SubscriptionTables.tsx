import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Zap, Rocket, Check } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useFeatures } from '@/hooks/useFeatures';

export default function SubscriptionTables() {
  const { setView, setSection } = useNavigationStore();
  const { user } = useAuthStore();
  const { getCurrentPlan } = useFeatures();
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    setSection('profile');
    setView('subscription-tables');
  }, [setSection, setView]);

  // Fetch all available plans
  const { data: availablePlans = [] } = useQuery({
    queryKey: ['/api/plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price');
      if (error) throw error;
      return data;
    }
  });

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'free': return Zap;
      case 'pro': return Crown;
      case 'enterprise': return Rocket;
      default: return Zap;
    }
  };

  const getPlanFeatures = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'free':
        return [
          '1 usuario',
          '2 proyectos',
          'Presupuestos',
          'Bitácora',
          'Finanzas',
          'Agenda',
          'Contactos',
          'Comunidad Discord'
        ];
      case 'pro':
        return [
          'Todo lo FREE más:',
          'Proyectos ilimitados',
          'PDFs personalizados',
          'Asesor IA',
          'Soporte 24/7'
        ];
      case 'enterprise':
        return [
          'Todo lo PRO más:',
          'Trabajos en equipo',
          'Integraciones API'
        ];
      default:
        return [];
    }
  };

  const calculatePrice = (basePrice: number) => {
    if (isAnnual) {
      return Math.round(basePrice * 12 * 0.8); // 20% discount for annual
    }
    return basePrice;
  };

  const currentPlanName = getCurrentPlan() || 'FREE';

  return (
    <div className="min-h-screen bg-surface-views p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Planes de Suscripción</h1>
            <p className="text-muted-foreground">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Planes Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-muted rounded-lg">
              <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
                Mensual
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
                Anual
              </span>
              {isAnnual && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  20% descuento
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => {
                const PlanIcon = getPlanIcon(plan.name);
                const isCurrentPlan = plan.name.toLowerCase() === currentPlanName.toLowerCase();
                const price = calculatePrice(plan.price);
                const features = getPlanFeatures(plan.name);
                
                return (
                  <div
                    key={plan.id}
                    className={`p-6 border rounded-lg flex flex-col ${
                      isCurrentPlan ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <PlanIcon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-lg">{plan.name}</span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-3xl font-bold">
                        ${price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{isAnnual ? 'año' : 'mes'}
                        </span>
                      </div>
                      {isAnnual && plan.price > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          ${plan.price * 12}/año
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-6 flex-grow">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className={feature.startsWith('Todo lo') ? 'font-medium' : ''}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto">
                      {isCurrentPlan ? (
                        <Button variant="outline" size="sm" disabled className="w-full">
                          Plan Actual
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full">
                          Seleccionar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}