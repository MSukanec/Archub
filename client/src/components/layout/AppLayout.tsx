import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { authService } from '@/lib/supabase';
import PrimarySidebar from './PrimarySidebar';
import SecondarySidebar from './SecondarySidebar';

import Dashboard from '@/views/Dashboard';
import Organization from '@/views/Organization';
import ProjectsOverview from '@/views/ProjectsOverview';
import ProjectsList from '@/views/ProjectsList';
import SiteLogs from '@/views/SiteLogs';
import Budgets from '@/views/Budgets';
import Movements from '@/views/Movements';
import Contacts from '@/views/Contacts';
import Organizations from '@/views/Organizations';
import AdminOrganizations from '@/views/AdminOrganizations';
import AdminUnits from '@/views/AdminUnits';
import AdminElements from '@/views/AdminElements';
import AdminActions from '@/views/AdminActions';
import AdminUsers from '@/views/AdminUsers';
import AdminCategories from '@/views/AdminCategories';
import AdminMaterials from '@/views/AdminMaterials';
import AdminTasks from '@/views/AdminTasks';

import ProfileInfo from '@/views/ProfileInfo';
import ProfileSubscription from '@/views/ProfileSubscription';
import SubscriptionTables from '@/views/SubscriptionTables';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { useNavigationStore } from '@/stores/navigationStore';

const viewComponents = {
  'dashboard-main': Dashboard,
  'organization-overview': Organization,
  'organization-activity': Organization,
  'projects-overview': ProjectsOverview,
  'projects-list': ProjectsList,
  'budgets-list': Budgets,
  'budgets-tasks': Budgets,
  'budgets-materials': Budgets,
  'sitelog-main': SiteLogs,
  'movements-main': Movements,
  'contacts': Contacts,
  'admin-organizations': AdminOrganizations,
  'admin-users': AdminUsers,
  'admin-categories': AdminCategories,
  'admin-materials': AdminMaterials,
  'admin-units': AdminUnits,
  'admin-elements': AdminElements,
  'admin-actions': AdminActions,
  'admin-tasks': AdminTasks,
  'admin-permissions': AdminActions, // Temporarily using actions view
  'profile-info': ProfileInfo,
  'profile-subscription': ProfileSubscription,
  'profile-notifications': ProfileInfo,
  'subscription-tables': SubscriptionTables,
};

export default function AppLayout() {
  const { setUser, setLoading } = useAuthStore();
  const { currentView } = useNavigationStore();
  const { setSecondarySidebarVisible } = useSidebarStore();
  const { initializeUserContext } = useUserContextStore();

  useEffect(() => {
    // Check initial auth state
    authService.getCurrentUser().then(async ({ user }) => {
      console.log('Initial auth check:', user);
      if (user) {
        // Get user data from database table
        const dbUser = await authService.getUserFromDatabase(user.id);
        
        const authUser = {
          id: user.id,
          email: user.email || '',
          firstName: user.user_metadata?.first_name || '',
          lastName: user.user_metadata?.last_name || '',
          role: dbUser?.role || 'user', // Use role from database table
        };
        console.log('User from database on init:', dbUser);
        console.log('Setting user:', authUser);
        setUser(authUser);
        
        // Initialize user context after setting user
        await initializeUserContext();
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
        <main className="flex-1 overflow-auto p-6 relative">
          <ViewComponent />
          <FloatingActionButton />
        </main>
      </div>
    </div>
  );
}
