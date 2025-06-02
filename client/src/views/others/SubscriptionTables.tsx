import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Users, Building, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { plansService } from '@/lib/plansService';

export default function SubscriptionTables() {
  const { user } = useAuthStore();
  const { setSection, setView } = useNavigationStore();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('subscription-tables');
  }, [setSection, setView]);

  // Fetch plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansService.getAll,
  });

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'free':
        return Zap;
      case 'pro':
        return Users;
      case 'enterprise':
        return Building;
      default:
        return Crown;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes de Suscripción
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan perfecto para tu organización y lleva tus proyectos de construcción al siguiente nivel
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full p-1 shadow-lg">
            <div className="flex">
              <Button
                variant="ghost"
                className="rounded-full px-6 py-2 bg-gray-900 text-white"
              >
                Mensual
              </Button>
              <Button
                variant="ghost"
                className="rounded-full px-6 py-2 text-gray-600"
              >
                Anual
                <Badge className="ml-2 bg-green-100 text-green-700">
                  Ahorra 20%
                </Badge>
              </Button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plansLoading ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">Cargando planes disponibles...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">No hay planes disponibles en este momento.</p>
            </div>
          ) : (
            plans.map((plan, index) => {
              const IconComponent = getPlanIcon(plan.name);
              const isPopular = index === 1;
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                    isPopular ? 'ring-2 ring-blue-500 transform scale-105' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Más Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <IconComponent className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {String(plan.price) === '0' ? 'Gratis' : `US$${plan.price}`}
                      </span>
                      {String(plan.price) !== '0' && (
                        <span className="text-gray-500">/mes</span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {plan.name === 'FREE' ? 'Perfecto para empezar' : 
                       plan.name === 'PRO' ? 'Para equipos en crecimiento' :
                       'Para empresas grandes'}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features && Array.isArray(plan.features) && plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="ml-3 text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full py-3 rounded-xl font-semibold ${
                      isPopular
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    Elegir Plan
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Preguntas Frecuentes
          </h2>
          <p className="text-center text-gray-600">
            ¿Tienes dudas? Aquí están las respuestas a las preguntas más comunes
          </p>
        </div>
      </div>
    </div>
  );
}