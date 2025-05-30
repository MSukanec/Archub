import { useQuery } from '@tanstack/react-query';
import { Building, Users, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Organizations() {
  const { data: organization, isLoading } = useQuery({
    queryKey: ['/api/organization'],
  });

  if (isLoading) {
    return <OrganizationSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Organizaciones
        </h1>
        <p className="text-muted-foreground">
          Gestiona la información de tu organización y configuraciones.
        </p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Building className="mr-2" size={20} />
              Información de la Organización
            </CardTitle>
            <Button variant="outline" size="sm">
              <Settings size={16} className="mr-2" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nombre</label>
            <p className="text-foreground font-medium">
              {organization?.name || 'Constructora ABC'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Descripción</label>
            <p className="text-foreground">
              {organization?.description || 'Empresa dedicada a la construcción y gestión de proyectos inmobiliarios.'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Estado</label>
            <div className="mt-1">
              <Badge variant="default" className="bg-green-500/10 text-green-400">
                Activa
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
            <p className="text-foreground">
              {organization?.createdAt 
                ? new Date(organization.createdAt).toLocaleDateString('es-ES')
                : 'Información no disponible'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Solo tú por ahora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Totales</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Sin proyectos creados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Básico</div>
            <p className="text-xs text-muted-foreground">
              Límite de 5 proyectos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Notificaciones por Email</h4>
              <p className="text-sm text-muted-foreground">
                Recibe notificaciones sobre la actividad de tus proyectos
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configurar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Zona Horaria</h4>
              <p className="text-sm text-muted-foreground">
                Configurar zona horaria para reportes y notificaciones
              </p>
            </div>
            <Button variant="outline" size="sm">
              Cambiar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Privacidad</h4>
              <p className="text-sm text-muted-foreground">
                Gestionar permisos y accesos a la información
              </p>
            </div>
            <Button variant="outline" size="sm">
              Gestionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-8 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
