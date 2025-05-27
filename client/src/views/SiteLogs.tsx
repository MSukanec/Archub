import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { Plus, Calendar, Users, CheckSquare, FileText, Camera, Video, File, Clock, MapPin, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { siteLogsService } from '@/lib/siteLogsService';
import { projectsService } from '@/lib/projectsService';
import { useUserContextStore } from '@/stores/userContextStore';
import SiteLogModal from '@/components/modals/SiteLogModal';
import type { SiteLog } from '@shared/schema';

export default function SiteLogs() {
  const { projectId } = useUserContextStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSiteLog, setSelectedSiteLog] = useState<SiteLog | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateSiteLogModal = () => {
      setSelectedSiteLog(null);
      setIsModalOpen(true);
    };

    window.addEventListener('openCreateSiteLogModal', handleOpenCreateSiteLogModal);
    return () => {
      window.removeEventListener('openCreateSiteLogModal', handleOpenCreateSiteLogModal);
    };
  }, []);

  // Get projects to find current project name
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => projectsService.getAll(),
  });

  const currentProject = projects.find((p: any) => p.id === projectId);

  const { data: siteLogs = [], isLoading } = useQuery({
    queryKey: ['/api/site-logs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      try {
        console.log('Fetching site logs for project:', projectId);
        const { data, error } = await supabase
          .from('site_logs')
          .select('*')
          .eq('project_id', String(projectId))
          .order('log_date', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching site logs:', error);
        return [];
      }
    },
    enabled: !!projectId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (siteLogId: string) => siteLogsService.deleteSiteLog(siteLogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-logs'] });
      toast({
        title: 'Registro eliminado',
        description: 'El registro de obra ha sido eliminado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error deleting site log:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el registro de obra.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateNew = () => {
    setSelectedSiteLog(null);
    setIsModalOpen(true);
  };

  const handleEditSiteLog = (siteLog: SiteLog) => {
    setSelectedSiteLog(siteLog);
    setIsModalOpen(true);
  };

  const handleDeleteSiteLog = (siteLogId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(siteLogId);
    }
  };

  const getWeatherIcon = (weather?: string) => {
    if (!weather) return null;
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('sol')) return '☀️';
    if (weatherLower.includes('nublado')) return '☁️';
    if (weatherLower.includes('lluvia')) return '🌧️';
    return '🌤️';
  };

  if (!projectId) {
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
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bitácora de Obra</h1>
          <p className="text-muted-foreground mt-1">
            Registro diario de actividades - {currentProject?.name || 'Cargando...'}
          </p>
        </div>
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
                    const logDate = siteLog.log_date ? new Date(siteLog.log_date + 'T00:00:00') : new Date();
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
              const logDate = siteLog.log_date ? new Date(siteLog.log_date + 'T00:00:00') : new Date();
              const isToday = format(logDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <Card 
                  key={siteLog.id} 
                  className={`transition-all hover:shadow-md ${
                    isToday ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => handleEditSiteLog(siteLog)}>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {format(logDate, 'dd MMMM yyyy', { locale: es })}
                          {isToday && <Badge variant="default">Hoy</Badge>}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {siteLog.weather && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <span>{getWeatherIcon(siteLog.weather)}</span>
                            <span>{siteLog.weather}</span>
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSiteLog(siteLog)}>
                              Editar registro
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSiteLog(siteLog.id.toString())}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
        projectId={projectId}
      />
    </div>
  );
}