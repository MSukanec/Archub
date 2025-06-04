import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ClipboardList, Calendar, FileText, Plus, Edit, Trash2, CheckCircle2, Users, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import SiteLogModal from '@/components/modals/SiteLogModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

// Types
interface SiteLog {
  id: string;
  project_id: string;
  author_id: string | null;
  log_date: string;
  comments: string | null;
  weather: string | null;
  created_at: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

export default function SiteLogs() {
  const { projectId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSiteLog, setSelectedSiteLog] = useState<SiteLog | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [siteLogToDelete, setSiteLogToDelete] = useState<SiteLog | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('budgets');
    setView('sitelog-main');
  }, [setSection, setView]);

  // Query para obtener site logs
  const { data: siteLogs = [], isLoading, error: siteLogsError } = useQuery({
    queryKey: ['site-logs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('site_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Query para obtener tareas de cada site log
  const { data: siteLogTasks = [] } = useQuery({
    queryKey: ['site-log-tasks-all', projectId],
    queryFn: async () => {
      if (!projectId || !siteLogs.length) return [];
      
      const siteLogIds = siteLogs.map(log => log.id);
      
      const { data, error } = await supabase
        .from('site_log_tasks')
        .select(`
          *,
          tasks (
            name,
            description
          )
        `)
        .in('site_log_id', siteLogIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && siteLogs.length > 0,
  });

  // Query para obtener asistentes de cada site log
  const { data: siteLogAttendees = [] } = useQuery({
    queryKey: ['site-log-attendees-all', projectId],
    queryFn: async () => {
      if (!projectId || !siteLogs.length) return [];
      
      const siteLogIds = siteLogs.map(log => log.id);
      
      const { data, error } = await supabase
        .from('site_log_attendees')
        .select(`
          *,
          contacts (
            first_name,
            last_name,
            company_name
          )
        `)
        .in('log_id', siteLogIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && siteLogs.length > 0,
  });

  // Query para obtener usuarios
  const { data: users = [], error: projectsError } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation para eliminar site log
  const deleteMutation = useMutation({
    mutationFn: async (siteLogId: string) => {
      const { error } = await supabase
        .from('site_logs')
        .delete()
        .eq('id', siteLogId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      toast({
        title: 'Registro eliminado',
        description: 'El registro de bitácora ha sido eliminado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al eliminar',
        description: error.message || 'No se pudo eliminar el registro.',
        variant: 'destructive',
      });
    },
  });

  // Event listener para abrir modal desde otros componentes
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

  const handleCreateNew = () => {
    setSelectedSiteLog(null);
    setIsModalOpen(true);
  };

  const handleEditSiteLog = (siteLog: SiteLog) => {
    setSelectedSiteLog(siteLog);
    setIsModalOpen(true);
  };

  const handleDeleteSiteLog = (siteLog: SiteLog) => {
    setSiteLogToDelete(siteLog);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (siteLogToDelete) {
      deleteMutation.mutate(siteLogToDelete.id);
      setIsDeleteModalOpen(false);
      setSiteLogToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSiteLogToDelete(null);
  };

  const getWeatherIcon = (weather?: string) => {
    if (!weather) return null;
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('sol')) return '☀️';
    if (weatherLower.includes('nublado')) return '☁️';
    if (weatherLower.includes('lluvia')) return '🌧️';
    return '🌤️';
  };

  const getUserById = (userId: string | null): User | null => {
    if (!userId) return null;
    return users.find(user => user.id === userId) || null;
  };

  const getUserInitials = (user: User | null): string => {
    if (!user) return 'AN';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Sin proyecto activo</h3>
          <p className="text-muted-foreground">
            Selecciona un proyecto para ver su bitácora de obra
          </p>
        </div>
      </div>
    );
  }

  if (siteLogsError || projectsError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Bitácora de Obra</h3>
          <p className="text-muted-foreground">
            No se pudieron cargar los registros. Intenta nuevamente más tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 p-6 md:p-6 p-3 space-y-6 md:space-y-6 space-y-3">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Bitácora de Obra
              </h1>
              <p className="text-sm text-muted-foreground">
                Registro diario de actividades y progreso de obra
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Bitácora
          </Button>
        </div>

        {/* Cards de estadísticas - Responsive: inline en mobile */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 mb-6">
          <div className="rounded-2xl shadow-md bg-surface-secondary p-4 md:p-6 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total de Registros</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{siteLogs.length}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl shadow-md bg-surface-secondary p-4 md:p-6 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Registros Este Mes</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">
                  {siteLogs.filter(log => {
                    const logDate = new Date(log.log_date);
                    const currentDate = new Date();
                    return logDate.getMonth() === currentDate.getMonth() && 
                           logDate.getFullYear() === currentDate.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              placeholder="Buscar registros..."
              className="pl-10 h-10 bg-surface-primary border-input rounded-xl shadow-lg hover:shadow-xl w-full px-3 text-sm"
            />
          </div>
        </div>

        {/* Content - Responsive Timeline */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </div>
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
            <div className="space-y-4 md:space-y-6">
              {siteLogs.map((siteLog, index) => {
                const logDate = siteLog.log_date ? new Date(siteLog.log_date + 'T00:00:00') : new Date();
                const isToday = format(logDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isLast = index === siteLogs.length - 1;
                const author = getUserById(siteLog.author_id);
                
                return (
                  <div key={siteLog.id} className="group">
                    {/* Desktop Layout - Timeline with Avatar */}
                    <div className="hidden md:flex gap-6">
                      {/* Timeline Node with Avatar */}
                      <div className="flex flex-col items-center">
                        <div className="relative z-10 transition-all group-hover:scale-110">
                          <Avatar className="h-12 w-12 shadow-lg">
                            <AvatarImage src={author?.avatar_url || undefined} />
                            <AvatarFallback className={`text-sm font-medium ${
                              isToday 
                                ? 'bg-primary text-white' 
                                : 'bg-surface-secondary text-muted-foreground'
                            }`}>
                              {getUserInitials(author)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        {/* Connecting Line */}
                        {!isLast && (
                          <div className="w-0.5 h-20 bg-gradient-to-b from-border to-transparent mt-4" />
                        )}
                      </div>
                      
                      {/* Content Card */}
                      <div className="flex-1 pb-12">
                        <div className={`rounded-2xl shadow-md bg-surface-secondary p-6 border-0 transition-all hover:shadow-lg group-hover:shadow-xl ${
                          isToday ? 'ring-2 ring-primary/20' : ''
                        }`}>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {format(logDate, 'dd MMMM yyyy', { locale: es })} • {format(new Date(siteLog.created_at), 'HH:mm', { locale: es })}
                                  {isToday && (
                                    <Badge variant="default" className="text-xs">
                                      Hoy
                                    </Badge>
                                  )}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  {siteLog.weather && (
                                    <>
                                      <span className="text-base">{getWeatherIcon(siteLog.weather)}</span>
                                      <span>{siteLog.weather}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditSiteLog(siteLog)}
                                className="h-8 w-8 p-0 hover:bg-primary/10"
                              >
                                <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteSiteLog(siteLog)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="space-y-3">
                            <div className="bg-muted/30 rounded-xl p-4">
                              <p className="text-white dark:text-white leading-relaxed">
                                {siteLog.comments || 'Sin comentarios registrados para este día.'}
                              </p>
                            </div>
                            
                            {/* Tareas Realizadas */}
                            {(() => {
                              const logTasks = siteLogTasks.filter(task => task.site_log_id === siteLog.id);
                              return logTasks.length > 0 && (
                                <div className="bg-muted/20 rounded-xl p-4 border-l-4 border-primary">
                                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Tareas Realizadas ({logTasks.length})
                                  </h4>
                                  <div className="grid gap-2">
                                    {logTasks.map((task: any, index: number) => (
                                      <div key={index} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-border">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                          <CheckCircle2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-foreground">
                                            {task.tasks?.name || 'Tarea sin nombre'}
                                          </p>
                                          {task.notes && (
                                            <p className="text-xs text-muted-foreground">
                                              {task.notes}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                            {task.progress_percentage}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Asistentes */}
                            {(() => {
                              const logAttendees = siteLogAttendees.filter(attendee => attendee.log_id === siteLog.id);
                              return logAttendees.length > 0 && (
                                <div className="bg-muted/20 rounded-xl p-4 border-l-4 border-blue-500">
                                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    Asistentes ({logAttendees.length})
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {logAttendees.map((attendee: any, index: number) => (
                                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm">{attendee.contacts ? `${attendee.contacts.first_name} ${attendee.contacts.last_name || ''}`.trim() : 'Sin nombre'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Layout - Simple Cards */}
                    <div className="md:hidden">
                      <div className={`rounded-2xl shadow-md bg-surface-secondary p-4 border-0 transition-all hover:shadow-lg ${
                        isToday ? 'ring-2 ring-primary/20' : ''
                      }`}>
                        {/* Header with Author Info */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shadow-lg">
                              <AvatarImage src={author?.avatar_url || undefined} />
                              <AvatarFallback className={`text-sm font-medium ${
                                isToday 
                                  ? 'bg-primary text-white' 
                                  : 'bg-surface-secondary text-muted-foreground'
                              }`}>
                                {getUserInitials(author)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {format(logDate, 'dd MMM yyyy', { locale: es })} • {format(new Date(siteLog.created_at), 'HH:mm', { locale: es })}
                                {isToday && (
                                  <Badge variant="default" className="text-xs">
                                    Hoy
                                  </Badge>
                                )}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {siteLog.weather && (
                                  <>
                                    <span className="text-sm">{getWeatherIcon(siteLog.weather)}</span>
                                    <span>{siteLog.weather}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditSiteLog(siteLog)}
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteSiteLog(siteLog)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-3">
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-white dark:text-white leading-relaxed text-sm">
                              {siteLog.comments || 'Sin comentarios registrados para este día.'}
                            </p>
                          </div>
                          
                          {/* Tareas Realizadas */}
                          {(() => {
                            const logTasks = siteLogTasks.filter(task => task.site_log_id === siteLog.id);
                            return logTasks.length > 0 && (
                              <div className="bg-muted/20 rounded-xl p-3 border-l-4 border-primary">
                                <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                  Tareas Realizadas ({logTasks.length})
                                </h4>
                                <div className="grid gap-2">
                                  {logTasks.map((task: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-surface-secondary rounded-lg border border-border">
                                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-xs font-medium text-foreground">
                                          {task.tasks?.name || 'Tarea sin nombre'}
                                        </p>
                                        {task.notes && (
                                          <p className="text-xs text-muted-foreground">
                                            {task.notes}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                          {task.progress_percentage}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Asistentes */}
                          {(() => {
                            const logAttendees = siteLogAttendees.filter(attendee => attendee.log_id === siteLog.id);
                            return logAttendees.length > 0 && (
                              <div className="bg-muted/20 rounded-xl p-3 border-l-4 border-blue-500">
                                <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                                  <Users className="h-3 w-3 text-blue-500" />
                                  Asistentes ({logAttendees.length})
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {logAttendees.map((attendee: any, index: number) => (
                                    <div key={index} className="flex items-center gap-1 p-1 bg-blue-500/10 text-blue-500 rounded text-xs">
                                      <User className="h-3 w-3" />
                                      <span>{attendee.contacts ? `${attendee.contacts.first_name} ${attendee.contacts.last_name || ''}`.trim() : 'Sin nombre'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modals */}
        <SiteLogModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          siteLog={selectedSiteLog}
          projectId={projectId}
        />
        
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="¿Eliminar registro de bitácora?"
          description={`¿Estás seguro de que quieres eliminar el registro del ${siteLogToDelete ? new Date(siteLogToDelete.log_date + 'T00:00:00').toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }) : ''}? Esta acción no se puede deshacer.`}
          isLoading={deleteMutation.isPending}
        />
      </div>

      {/* Floating Action Button for Mobile and Tablet */}
      <Button
        onClick={handleCreateNew}
        className="fixed bottom-6 right-6 z-50 md:hidden w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 p-0"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  );
}