import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Calendar, Users, CheckSquare, FileText, Camera, Video, File, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { siteLogsService } from '@/lib/siteLogsService';
import { useUserContext } from '@/stores/userContextStore';
import SiteLogModal from '@/components/modals/SiteLogModal';
import type { SiteLog } from '@shared/schema';

export default function SiteLogs() {
  const { currentProject } = useUserContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSiteLog, setSelectedSiteLog] = useState<SiteLog | null>(null);

  const { data: siteLogs = [], isLoading } = useQuery({
    queryKey: ['/api/site-logs', currentProject?.id],
    queryFn: () => currentProject ? siteLogsService.getSiteLogsByProject(currentProject.id) : Promise.resolve([]),
    enabled: !!currentProject,
  });

  const handleCreateNew = () => {
    setSelectedSiteLog(null);
    setIsModalOpen(true);
  };

  const handleEditSiteLog = (siteLog: SiteLog) => {
    setSelectedSiteLog(siteLog);
    setIsModalOpen(true);
  };

  const getWeatherIcon = (weather?: string) => {
    if (!weather) return null;
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('sol')) return '☀️';
    if (weatherLower.includes('nublado')) return '☁️';
    if (weatherLower.includes('lluvia')) return '🌧️';
    return '🌤️';
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Sin proyecto activo</h3>
          <p className="text-muted-foreground">
            Selecciona un proyecto para ver su bitácora de obra
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bitácora de Obra</h1>
          <p className="text-muted-foreground mt-1">
            Registro diario de actividades - {currentProject.name}
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo registro
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline - Left side */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : siteLogs.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Sin registros</h3>
                <p className="text-muted-foreground mb-4">
                  Aún no hay entradas en la bitácora de obra
                </p>
                <Button onClick={handleCreateNew} variant="outline">
                  Crear primer registro
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>
                
                <div className="space-y-6">
                  {siteLogs.map((siteLog, index) => {
                    const logDate = new Date(siteLog.date);
                    const isToday = format(logDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <div key={siteLog.id} className="relative flex gap-3">
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isToday 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'bg-background border-border text-muted-foreground'
                        }`}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        
                        {/* Date and weather */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <time className="text-sm font-medium text-foreground">
                              {format(logDate, 'dd MMM', { locale: es })}
                            </time>
                            {siteLog.weather && (
                              <span className="text-sm">
                                {getWeatherIcon(siteLog.weather)} {siteLog.weather}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(logDate, 'EEEE', { locale: es })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cards - Right side */}
        <div className="lg:col-span-8 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : siteLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">
                Comienza tu bitácora de obra
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Registra las actividades diarias, tareas completadas, asistentes y archivos multimedia para mantener un control detallado del progreso.
              </p>
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear primer registro
              </Button>
            </div>
          ) : (
            siteLogs.map((siteLog) => {
              const logDate = new Date(siteLog.date);
              const isToday = format(logDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <Card 
                  key={siteLog.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isToday ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleEditSiteLog(siteLog)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {format(logDate, 'dd MMMM yyyy', { locale: es })}
                        {isToday && <Badge variant="default">Hoy</Badge>}
                      </CardTitle>
                      {siteLog.weather && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>{getWeatherIcon(siteLog.weather)}</span>
                          <span>{siteLog.weather}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Comments */}
                    {siteLog.comments && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Comentarios
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {siteLog.comments}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Tareas</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">0</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Asistentes</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">0</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Archivos</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      <SiteLogModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        siteLog={selectedSiteLog}
        projectId={currentProject?.id}
      />
    </div>
  );
}