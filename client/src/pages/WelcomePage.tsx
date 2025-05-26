import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Building2, Users, FolderPlus, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function WelcomePage() {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: <Building2 className="w-8 h-8 text-primary" />,
      title: "Gestión de Proyectos",
      description: "Organiza y administra todos tus proyectos de construcción desde un solo lugar"
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Colaboración en Equipo",
      description: "Invita a tu equipo y trabajen juntos en tiempo real"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      title: "Seguimiento y Reportes",
      description: "Monitorea el progreso y genera reportes detallados de tus proyectos"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % features.length);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = () => {
    setLocation('/');
  };

  const organizationName = user?.firstName ? `${user.firstName} ${user.lastName}` : 'tu organización';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl text-primary mb-2">
            ¡Bienvenido a Metrik!
          </CardTitle>
          <CardDescription className="text-lg">
            Tu cuenta ha sido creada exitosamente para <span className="font-semibold text-foreground">{organizationName}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Features showcase */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">
              Descubre lo que puedes hacer con Metrik
            </h3>
            
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    index === currentStep
                      ? 'border-primary bg-primary/5 scale-105'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick start steps */}
          <div className="bg-muted/30 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <FolderPlus className="w-5 h-5 mr-2 text-primary" />
              Próximos pasos recomendados:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Crea tu primer proyecto</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Invita a miembros de tu equipo</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Explora las herramientas de presupuesto</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleGetStarted}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              Comenzar ahora
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="flex-1"
              size="lg"
            >
              Explorar la aplicación
            </Button>
          </div>

          {/* Tip */}
          <div className="text-center text-sm text-muted-foreground bg-muted/20 rounded-lg p-4">
            💡 <span className="font-medium">Tip:</span> Puedes acceder a la configuración de tu organización desde el menú de perfil en cualquier momento.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}