import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Calculator, 
  FileText, 
  Users, 
  TrendingUp, 
  Shield,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Link } from 'wouter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Metrik</span>
          </div>
          <Link href="/auth">
            <Button className="bg-primary hover:bg-primary/90">
              Iniciar Sesión
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Gestión de Proyectos de
            <span className="text-primary block">Construcción</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La plataforma profesional que necesitas para administrar presupuestos, proyectos y 
            equipos de construcción de manera eficiente y organizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Herramientas potentes diseñadas específicamente para la industria de la construcción
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow border-muted">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Presupuestos Inteligentes</h3>
              <p className="text-muted-foreground">
                Crea y gestiona presupuestos detallados con elementos, unidades y costos actualizados en tiempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-muted">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Gestión de Proyectos</h3>
              <p className="text-muted-foreground">
                Organiza todos tus proyectos de construcción con información de clientes, ubicaciones y estados.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-muted">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bitácora de Obra</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Registra el progreso diario con fotos, videos, asistencia del personal y tareas completadas.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Colaboración en Equipo</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Trabaja con tu equipo y organizaciones con roles y permisos personalizados.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reportes y Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Visualiza métricas importantes y genera reportes detallados de tus proyectos.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguridad Avanzada</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tus datos están protegidos con autenticación segura y almacenamiento encriptado.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                ¿Por qué elegir Metrik?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Ahorra tiempo y dinero</h3>
                    <p className="text-gray-600 dark:text-gray-300">Automatiza procesos repetitivos y reduce errores costosos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Fácil de usar</h3>
                    <p className="text-gray-600 dark:text-gray-300">Interfaz intuitiva diseñada para profesionales de la construcción</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Escalable</h3>
                    <p className="text-gray-600 dark:text-gray-300">Crece con tu negocio, desde proyectos pequeños hasta grandes obras</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Soporte especializado</h3>
                    <p className="text-gray-600 dark:text-gray-300">Equipo de expertos en construcción y tecnología</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Comienza tu prueba gratuita
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Descubre cómo Metrik puede transformar la gestión de tus proyectos de construcción.
              </p>
              <Link href="/auth">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  Crear cuenta gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Sin tarjeta de crédito requerida
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Metrik</span>
              </div>
              <p className="text-gray-400">
                La plataforma líder para la gestión profesional de proyectos de construcción.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <div className="space-y-2 text-gray-400">
                <p>Presupuestos</p>
                <p>Proyectos</p>
                <p>Bitácora</p>
                <p>Reportes</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <div className="space-y-2 text-gray-400">
                <p>Acerca de</p>
                <p>Contacto</p>
                <p>Soporte</p>
                <p>Blog</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-gray-400">
                <p>Privacidad</p>
                <p>Términos</p>
                <p>Cookies</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Metrik. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}