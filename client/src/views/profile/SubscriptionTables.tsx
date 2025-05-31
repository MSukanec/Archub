import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Zap, Crown, Rocket, ArrowRight } from 'lucide-react';
import { plansService } from '@/lib/plansService';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export default function SubscriptionTables() {
  const { user } = useAuthStore();
  
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['/api/plans'],
    queryFn: () => plansService.getAll(),
  });

  // Obtener el plan actual del usuario
  const { data: userPlan } = useQuery({
    queryKey: ['/api/user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          plan_id,
          plans (
            name,
            price
          )
        `)
        .eq('auth_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user plan:', error);
        return null;
      }
      
      return data?.plans || { name: 'free', price: 0 };
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
  });

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return <Zap className="h-8 w-8 text-muted-foreground" />;
      case 'pro':
        return <Crown className="h-8 w-8 text-primary" />;
      case 'enterprise':
        return <Rocket className="h-8 w-8 text-muted-foreground" />;
      default:
        return <Zap className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getPlanColor = (planName: string, isCurrentPlan: boolean) => {
    if (isCurrentPlan) {
      return 'border-primary bg-primary/10 shadow-lg shadow-primary/20';
    }
    
    switch (planName.toLowerCase()) {
      case 'free':
        return 'border-muted hover:border-muted-foreground/20';
      case 'pro':
        return 'border-primary bg-primary/5 shadow-lg shadow-primary/10';
      case 'enterprise':
        return 'border-muted hover:border-muted-foreground/20';
      default:
        return 'border-muted hover:border-muted-foreground/20';
    }
  };

  const isPopular = (planName: string) => {
    return planName.toLowerCase() === 'pro';
  };

  const getPlanFeatures = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return [
          'Hasta 2 proyectos',
          'Hasta 5 presupuestos por proyecto',
          'Bitácora de obra',
          'Calendario de obra',
          'Gestión de finanzas'
        ];
      case 'pro':
        return [
          'Todo lo de Free más:',
          'Proyectos ilimitados',
          'Presupuestos ilimitados',
          'Reportes avanzados'
        ];
      case 'enterprise':
        return [
          'Todo lo de Pro más:',
          'Colaboración en equipo',
          'Soporte prioritario',
          'Integraciones personalizadas'
        ];
      default:
        return [];
    }
  };

  const getNextPlan = (currentPlanName: string) => {
    const planOrder = ['free', 'pro', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlanName?.toLowerCase() || 'free');
    return currentIndex < planOrder.length - 1 ? planOrder[currentIndex + 1] : null;
  };

  const isCurrentPlan = (planName: string) => {
    if (!userPlan || typeof userPlan.name !== 'string') return false;
    return planName?.toLowerCase() === userPlan.name.toLowerCase();
  };

  const isUpgrade = (planName: string) => {
    if (!userPlan || typeof userPlan.name !== 'string') return false;
    const planOrder = ['free', 'pro', 'enterprise'];
    const currentIndex = planOrder.indexOf(userPlan.name.toLowerCase());
    const planIndex = planOrder.indexOf(planName.toLowerCase());
    return planIndex > currentIndex;
  };

  const faqs = [
    {
      question: "¿Puedo cambiar mi plan en cualquier momento?",
      answer: "Sí, puedes actualizar o degradar tu plan cuando lo necesites. Los cambios se aplicarán inmediatamente."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos todas las tarjetas de crédito principales, PayPal y transferencias bancarias para planes empresariales."
    },
    {
      question: "¿Hay descuentos por pago anual?",
      answer: "Sí, ofrecemos un 20% de descuento si pagas anualmente en lugar de mensualmente."
    },
    {
      question: "¿Puedo cancelar mi suscripción?",
      answer: "Por supuesto. Puedes cancelar tu suscripción en cualquier momento desde tu perfil, sin penalizaciones."
    },
    {
      question: "¿Qué sucede con mis datos si cancelo?",
      answer: "Tus datos permanecen seguros por 30 días después de la cancelación, dándote tiempo para reactivar tu cuenta."
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Planes de Suscripción</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elige el plan perfecto para tu organización y lleva tus proyectos de construcción al siguiente nivel
        </p>
        {userPlan && typeof userPlan.name === 'string' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20">
            <span className="text-sm font-medium">Plan Actual: {userPlan.name}</span>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const planIsCurrentPlan = isCurrentPlan(plan.name);
          const planIsUpgrade = isUpgrade(plan.name);
          
          return (
            <Card key={plan.id} className={`relative transition-all duration-300 ${getPlanColor(plan.name, planIsCurrentPlan)} ${isPopular(plan.name) && !planIsCurrentPlan ? 'scale-105' : 'hover:scale-105'}`}>
              {planIsCurrentPlan && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Plan Actual
                </Badge>
              )}
              {isPopular(plan.name) && !planIsCurrentPlan && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Más Popular
                </Badge>
              )}
              {planIsUpgrade && (
                <Badge className="absolute -top-2 right-4 bg-green-500 text-white">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Upgrade
                </Badge>
              )}
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  {getPlanIcon(plan.name)}
                </div>
                <div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    {plan.price > 0 && <span className="text-muted-foreground">/mes</span>}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {getPlanFeatures(plan.name).map((feature, index) => {
                    const isHeader = feature.includes('Todo lo de');
                    return (
                      <div key={index} className={`flex items-center gap-2 ${isHeader ? 'font-semibold text-primary mt-4 first:mt-0' : ''}`}>
                        <CheckCircle className={`h-5 w-5 ${isHeader ? 'text-primary' : 'text-primary'}`} />
                        <span className={isHeader ? 'text-sm' : ''}>{feature}</span>
                      </div>
                    );
                  })}
                </div>
                <Button 
                  className="w-full" 
                  variant={planIsCurrentPlan ? 'secondary' : planIsUpgrade ? 'default' : 'outline'}
                  disabled={planIsCurrentPlan}
                >
                  {planIsCurrentPlan 
                    ? 'Plan Actual' 
                    : planIsUpgrade 
                      ? `Actualizar a ${plan.name}` 
                      : plan.price === 0 ? 'Comenzar Gratis' : 'Elegir Plan'
                  }
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Preguntas Frecuentes</h2>
          <p className="text-muted-foreground">
            ¿Tienes dudas? Aquí están las respuestas a las preguntas más comunes
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">¿Necesitas ayuda para decidir?</CardTitle>
          <CardDescription>
            Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Contactar Ventas</Button>
        </CardContent>
      </Card>
    </div>
  );
}