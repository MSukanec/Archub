import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Crown, Zap, Rocket } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useFeatures } from '@/hooks/useFeatures';

export default function ProfileSubscription() {
  const { setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { userPlan, getCurrentPlan } = useFeatures();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('profile-main');
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

  const currentPlanName = getCurrentPlan() || 'FREE';

  return (
    <div className="min-h-screen bg-surface-views p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Suscripción</h1>
            <p className="text-muted-foreground">
              Gestiona tu plan de suscripción y facturación
            </p>
          </div>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Plan Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {(() => {
                  const PlanIcon = getPlanIcon(currentPlanName);
                  return <PlanIcon className="w-6 h-6 text-primary" />;
                })()}
                <div>
                  <div className="font-semibold">Plan {currentPlanName}</div>
                  <div className="text-sm text-muted-foreground">
                    {userPlan ? `$${userPlan.price}/mes` : 'Gratis'}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Cambiar Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Planes Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => {
                const PlanIcon = getPlanIcon(plan.name);
                const isCurrentPlan = plan.name.toLowerCase() === currentPlanName.toLowerCase();
                
                return (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg ${
                      isCurrentPlan ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <PlanIcon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {plan.description}
                    </div>
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
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}