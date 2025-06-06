import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Building2, 
  Calculator, 
  FileText, 
  Users, 
  TrendingUp, 
  Shield,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Clock,
  Target
} from 'lucide-react';
import { Link } from 'wouter';

export default function LandingPage() {
  const features = [
    {
      icon: Building2,
      title: "Gestión de Proyectos",
      description: "Administra múltiples proyectos de construcción con seguimiento en tiempo real"
    },
    {
      icon: Calculator,
      title: "Control de Presupuestos",
      description: "Gestiona presupuestos detallados y controla gastos con precisión"
    },
    {
      icon: BarChart3,
      title: "Reportes Financieros",
      description: "Análisis financiero completo con gráficos y métricas detalladas"
    },
    {
      icon: Users,
      title: "Gestión de Equipos",
      description: "Coordina equipos de trabajo y asigna responsabilidades"
    },
    {
      icon: FileText,
      title: "Documentación",
      description: "Centraliza documentos, planos y especificaciones del proyecto"
    },
    {
      icon: Shield,
      title: "Seguridad",
      description: "Datos protegidos con los más altos estándares de seguridad"
    }
  ];

  const benefits = [
    "Aumenta la eficiencia del proyecto hasta un 40%",
    "Reduce costos operativos y administrativos",
    "Mejora la comunicación entre equipos",
    "Control total sobre presupuestos y gastos",
    "Acceso desde cualquier dispositivo",
    "Reportes automáticos y análisis detallados"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Archub</span>
            </div>
            <Link href="/auth">
              <Button className="bg-primary hover:bg-primary/90">
                Iniciar Sesión
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              La Plataforma Definitiva para
              <span className="text-primary block mt-2">Proyectos de Construcción</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Transforma la gestión de tus proyectos de construcción con herramientas profesionales 
              para presupuestos, equipos, cronogramas y análisis financiero en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-4 h-auto">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
                Ver Demo
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">40%</div>
              <div className="text-muted-foreground">Mayor Eficiencia</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">25%</div>
              <div className="text-muted-foreground">Reducción de Costos</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">50%</div>
              <div className="text-muted-foreground">Menos Tiempo Administrativo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas potentes diseñadas específicamente para la industria de la construcción
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Por qué elegir Archub?
            </h2>
            <p className="text-xl text-muted-foreground">
              Únete a cientos de empresas constructoras que ya confían en nosotros
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <span className="text-lg text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Comienza a transformar tus proyectos hoy
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a la revolución digital en la construcción. Sin compromisos, cancela cuando quieras.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-4 h-auto">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
              Hablar con Ventas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Archub</span>
            </div>
            <div className="text-muted-foreground">
              © 2025 Archub. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}