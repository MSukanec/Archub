import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ClipboardList, Calendar, FileText, Plus, FileDown, Edit, Trash2, MoreHorizontal, MapPin, User } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
      
      console.log('Fetching site logs for project:', projectId);
      const { data, error } = await supabase
        .from('site_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      console.log('Site logs fetched:', data);
      return data || [];
    },
    enabled: !!projectId,
  });

  // Query para obtener proyectos (para verificar si existe el proyecto)
  const { error: projectsError } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch users for avatars
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Mutación para eliminar site log
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
        title: "Registro eliminado",
        description: "El registro de bitácora ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar registro",
        description: "No se pudo eliminar el registro. Intenta nuevamente.",
        variant: "destructive",
      });
      console.error('Error deleting site log:', error);
    },
  });

  // Event listeners para floating action button
  useEffect(() => {
    const handleOpenCreateSiteLogModal = () => {
      console.log('Received openCreateSiteLogModal event');
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
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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



        {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Registros</p>
              <p className="text-2xl font-bold text-foreground">{siteLogs.length}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registros Este Mes</p>
              <p className="text-2xl font-bold text-foreground">
                {siteLogs.filter(log => {
                  const logDate = new Date(log.log_date);
                  const currentDate = new Date();
                  return logDate.getMonth() === currentDate.getMonth() && 
                         logDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-500" />
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

      {/* Content - Unified Timeline */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  {i < 2 && <div className="w-0.5 h-20 bg-border mt-4" />}
                </div>
                <div className="flex-1">
                  <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
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
          <div className="relative">
            {siteLogs.map((siteLog, index) => {
              const logDate = siteLog.log_date ? new Date(siteLog.log_date + 'T00:00:00') : new Date();
              const isToday = format(logDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isLast = index === siteLogs.length - 1;
              const author = getUserById(siteLog.author_id);
              
              return (
                <div key={siteLog.id} className="flex gap-6 group">
                  {/* Timeline Node with Avatar */}
                  <div className="flex flex-col items-center">
                    <div className={`relative z-10 transition-all group-hover:scale-110 ${
                      isToday ? 'ring-2 ring-primary/50' : ''
                    }`}>
                      <Avatar className="h-12 w-12 border-2 border-border hover:border-primary/50 shadow-lg">
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
                              {format(logDate, 'dd MMMM yyyy', { locale: es })}
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
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSiteLog(siteLog)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSiteLog(siteLog)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-3">
                        <div className="bg-muted/30 rounded-xl p-4">
                          <p className="text-foreground leading-relaxed">
                            {siteLog.comments || 'Sin comentarios registrados para este día.'}
                          </p>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditSiteLog(siteLog)}
                            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar registro
                          </Button>
                        </div>
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