import { Building, DollarSign, CheckSquare, Clock, Plus, Camera, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();

  // Simplified dashboard with static values to prevent freezing
  const totalProjects = 2;

  const statsData = [
    {
      title: 'Proyectos Activos',
      value: totalProjects.toString(),
      change: '+100%',
      icon: Building,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Presupuesto Total',
      value: '$0',
      change: '+0%',
      icon: DollarSign,
      color: 'bg-green-500/10 text-green-400',
    },
    {
      title: 'Tareas Completadas',
      value: '0',
      change: '--',
      icon: CheckSquare,
      color: 'bg-blue-500/10 text-blue-400',
    },
    {
      title: 'Días Promedio',
      value: '0',
      change: '--',
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bienvenido de vuelta, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de tus proyectos y actividad reciente.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="hover:border-border/60 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-xs text-green-400 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Proyectos Activos</h2>
                <Button variant="ghost" className="text-primary hover:text-primary/90">
                  Ver todos
                </Button>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No hay proyectos</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comienza creando tu primer proyecto de construcción.
                </p>
                <Button className="mt-4 bg-primary hover:bg-primary/90">
                  <Plus size={16} className="mr-2" />
                  Crear Proyecto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Actividad Reciente</h2>
            </div>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No hay actividad reciente
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Acciones Rápidas</h2>
            </div>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button className="w-full bg-primary hover:bg-primary/90 justify-center">
                  <Plus size={16} className="mr-2" />
                  Nuevo Proyecto
                </Button>
                
                <Button variant="outline" className="w-full justify-center">
                  <DollarSign size={16} className="mr-2" />
                  Crear Presupuesto
                </Button>
                
                <Button variant="outline" className="w-full justify-center">
                  <CheckSquare size={16} className="mr-2" />
                  Bitácora de Obra
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-border">
              <Skeleton className="h-6 w-40" />
            </div>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-border">
              <Skeleton className="h-6 w-32" />
            </div>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
