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
    // Check if user is stored in localStorage first
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setLoading(false);
        return;
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }

    // If no stored user, check auth state
    setLoading(true);
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
        localStorage.removeItem('auth_user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
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
