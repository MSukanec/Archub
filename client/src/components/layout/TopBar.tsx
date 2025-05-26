import { Search, Bell, Plus, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CreateProjectModal from '@/components/modals/CreateProjectModal';

const viewBreadcrumbs = {
  'dashboard-main': 'Dashboard',
  'dashboard-activity': 'Actividad Reciente',
  'projects-overview': 'Resumen de Proyectos',
  'projects-list': 'Lista de Proyectos',
  'admin-organizations': 'Organizaciones',
  'admin-users': 'Usuarios',
  'admin-permissions': 'Permisos',
  'profile-info': 'Información del Perfil',
  'profile-subscription': 'Suscripción',
  'profile-notifications': 'Notificaciones',
};

export default function TopBar() {
  const { currentView } = useNavigationStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Metrik</span>
          <ChevronRight size={14} className="text-muted-foreground" />
          <span className="text-foreground">{viewBreadcrumbs[currentView]}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-background border-border pl-9"
            />
            <Search 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
          </Button>

          {/* Quick Actions */}
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Nuevo</span>
          </Button>
        </div>
      </header>

      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
