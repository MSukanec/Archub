import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Crown, Zap, Rocket, Check, Calendar, Receipt } from 'lucide-react';
import { useNavigationStore } from '../stores/navigationStore';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { supabase } from '../lib/supabase';
import { useFeatures } from '../hooks/useFeatures';

export default function ProfileSubscription() {
  const { setSection, setView } = useNavigationStore();
  const { user } = useAuthStore();
  const { userPlan, getCurrentPlan } = useFeatures();
  const [isAnnual, setIsAnnual] = useState(false);

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('profile-subscription');
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

  const getRemainingTime = () => {
    // Mock data - this would come from subscription info
    return "28 días restantes";
  };

  // Mock payment history - this would come from API
  const paymentHistory = [
    { id: 1, date: '2024-11-01', amount: 20, status: 'Completado', method: 'Tarjeta terminada en 4242' },
    { id: 2, date: '2024-10-01', amount: 20, status: 'Completado', method: 'Tarjeta terminada en 4242' },
    { id: 3, date: '2024-09-01', amount: 20, status: 'Completado', method: 'Tarjeta terminada en 4242' },
  ];

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
                  {currentPlanName !== 'FREE' && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {getRemainingTime()}
                    </div>
                  )}
                </div>
              </div>
              <Button 
                size="sm"
                onClick={() => {
                  setSection('profile');
                  setView('subscription-tables');
                }}
              >
                Cambiar Plan
              </Button>
            </div>
          </CardContent>
        </Card>



        {/* Payment History Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Historial de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">${payment.amount}</div>
                      <div className="text-sm text-muted-foreground">{payment.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">{payment.status}</div>
                    <div className="text-xs text-muted-foreground">{payment.method}</div>
                  </div>
                </div>
              ))}
              {paymentHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay historial de pagos disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}