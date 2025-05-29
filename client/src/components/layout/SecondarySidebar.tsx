import { Calendar, Shield } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAuthStore } from '@/stores/authStore';
import CircularButton from '@/components/ui/CircularButton';

export default function SecondarySidebar() {
  const { setView } = useNavigationStore();
  const { user } = useAuthStore();

  return (
    <div className="fixed top-0 right-0 w-16 h-screen bg-[#e1e1e1] z-40 flex flex-col justify-between">
      {/* Top spacer */}
      <div></div>
      
      {/* Bottom buttons section */}
      <div className="flex flex-col items-center space-y-2 pb-2.5 pr-2.5">
        {/* Timeline button */}
        <CircularButton
          icon={Calendar}
          isActive={false}
          onClick={() => setView('dashboard-timeline')}
          label="Timeline"
        />
        
        {/* Admin button - only for admin users */}
        {user?.role === 'admin' && (
          <CircularButton
            icon={Shield}
            isActive={false}
            onClick={() => setView('admin-organizations')}
            label="Administración"
          />
        )}
      </div>
    </div>
  );
}