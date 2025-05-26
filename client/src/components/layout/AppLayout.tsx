import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { authService } from '@/lib/supabase';
import PrimarySidebar from './PrimarySidebar';
import SecondarySidebar from './SecondarySidebar';
import TopBar from './TopBar';
import Dashboard from '@/views/Dashboard';
import ProjectsOverview from '@/views/ProjectsOverview';
import ProjectsList from '@/views/ProjectsList';
import Organizations from '@/views/Organizations';
import AdminOrganizations from '@/views/AdminOrganizations';
import Users from '@/views/Users';
import ProfileInfo from '@/views/ProfileInfo';
import Subscription from '@/views/Subscription';
import { useNavigationStore } from '@/stores/navigationStore';

const viewComponents = {
  'dashboard-main': Dashboard,
  'dashboard-activity': Dashboard,
  'projects-overview': ProjectsOverview,
  'projects-list': ProjectsList,
  'admin-organizations': AdminOrganizations,
  'admin-users': Users,
  'admin-permissions': Users,
  'profile-info': ProfileInfo,
  'profile-subscription': Subscription,
  'profile-notifications': ProfileInfo,
};

export default function AppLayout() {
  const { setUser, setLoading } = useAuthStore();
  const { currentView } = useNavigationStore();
  const { setSecondarySidebarVisible } = useSidebarStore();

  useEffect(() => {
    // Check initial auth state
    authService.getCurrentUser().then(({ user }) => {
      console.log('Initial auth check:', user);
      if (user) {
        const authUser = {
          id: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          role: user.user_metadata?.role || 'admin', // Por defecto admin para usuarios existentes
        };
        console.log('Setting user:', authUser);
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      console.log('Auth state changed:', user);
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  const ViewComponent = viewComponents[currentView] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div 
        className="flex"
        onMouseEnter={() => setSecondarySidebarVisible(true)}
        onMouseLeave={() => setSecondarySidebarVisible(false)}
      >
        <PrimarySidebar />
        <SecondarySidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-auto p-6">
          <ViewComponent />
        </main>
      </div>
    </div>
  );
}
