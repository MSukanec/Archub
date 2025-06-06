import { Shield, Users, Library } from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { useAuthStore } from '../../stores/authStore';
import CircularButton from "../ui/CircularButton";

export default function SecondarySidebar() {
  const { setView, currentView } = useNavigationStore();
  const { user } = useAuthStore();

  // Only show secondary sidebar for admin users
  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="w-[55px] flex flex-col relative z-20">
      {/* Admin buttons section */}
      <div className="flex flex-col items-center space-y-2 pt-2.5 pr-2.5">
        {/* Admin Organizations button */}
        <CircularButton
          icon={Shield}
          isActive={currentView === 'admin-organizations'}
          onClick={() => setView('admin-organizations')}
          label="Admin Organizaciones"
          tooltipDirection="left"
        />

        {/* Library button */}
        <CircularButton
          icon={Library}
          isActive={currentView === 'admin-tasks' || currentView === 'admin-categories' || currentView === 'admin-material-categories' || currentView === 'admin-materials' || currentView === 'admin-units' || currentView === 'admin-elements' || currentView === 'admin-actions'}
          onClick={() => setView('admin-tasks')}
          label="Administración de Biblioteca"
          tooltipDirection="left"
        />
      </div>
    </div>
  );
}