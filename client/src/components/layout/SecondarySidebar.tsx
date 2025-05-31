import { Calendar, Shield, Users } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import CircularButton from '@/components/ui/CircularButton';

export default function SecondarySidebar() {
  const { setView, currentView } = useNavigationStore();
  const { user } = useAuthStore();

  // Only show secondary sidebar for admin users
  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="w-14 h-screen bg-white border-r border-border relative z-10 flex flex-col">
      {/* Admin buttons section */}
      <div className="flex flex-col items-center space-y-4 pt-4 pl-2.5">
        {/* Dashboard button (old dashboard for admin) */}
        <CircularButton
          icon={Calendar}
          isActive={currentView === 'dashboard-timeline'}
          onClick={() => setView('dashboard-timeline')}
          label="Dashboard Timeline"
        />

        {/* Admin Organizations button */}
        <CircularButton
          icon={Shield}
          isActive={currentView === 'admin-organizations'}
          onClick={() => setView('admin-organizations')}
          label="Admin Organizaciones"
        />

        {/* Admin Users button */}
        <CircularButton
          icon={Users}
          isActive={currentView === 'admin-users'}
          onClick={() => setView('admin-users')}
          label="Admin Usuarios"
        />
      </div>
    </div>
  );
}