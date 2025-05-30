import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { authService } from '@/lib/supabase';
import PrimarySidebar from './PrimarySidebar';
import SecondarySidebar from './SecondarySidebar';
import FloatingHeader from './FloatingHeader';

import Dashboard from '@/views/Dashboard';
import DashboardTimeline from '@/views/DashboardTimeline';

import Organization from '@/views/Organization';
import OrganizationTeam from '@/views/OrganizationTeam';
import ProjectsList from '@/views/ProjectsList';
import SiteLogs from '@/views/SiteLogs';
import Budgets from '@/views/Budgets';
import BudgetTasks from '@/views/BudgetTasks';
import BudgetMaterials from '@/views/BudgetMaterials';
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

import FloatingProjectButton from '@/components/ui/FloatingProjectButton';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { useNavigationStore } from '@/stores/navigationStore';
import { useState } from 'react';

const viewComponents = {
  'dashboard-main': Dashboard,
  'dashboard-timeline': DashboardTimeline,

  'organization-overview': Organization,
  'organization-team': OrganizationTeam,
  'organization-activity': Organization,
  'projects-overview': ProjectsList,
  'projects-list': ProjectsList,
  'budgets-list': Budgets,
  'budgets-tasks': BudgetTasks,
  'budgets-materials': BudgetMaterials,
  'sitelog-main': SiteLogs,
  'movements-main': Movements,
  'transactions': Movements,
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let isInitialized = false;
    
    // Check initial auth state
    authService.getCurrentUser().then(async ({ user }) => {
      if (isInitialized) return; // Prevent double initialization
      isInitialized = true;
      
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
      // Always set loading to false after processing
      setLoading(false);
    }).catch((error) => {
      console.error('Error during initial auth check:', error);
      setLoading(false); // Ensure loading is set to false even on error
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      console.log('Auth state changed:', user);
      setUser(user);
    });

    return () => {
      subscription.unsubscribe();
      isInitialized = true; // Mark as cleanup
    };
  }, []); // Remove dependencies to prevent re-runs

  // Listen for create project modal event
  useEffect(() => {
    const handleOpenCreateProjectModal = () => {
      setIsCreateModalOpen(true);
    };

    const handleNavigateToSubscriptionTables = () => {
      // Use navigation store to change view
      const { setView } = useNavigationStore.getState();
      setView('subscription-tables');
    };

    window.addEventListener('openCreateProjectModal', handleOpenCreateProjectModal);
    window.addEventListener('navigate-to-subscription-tables', handleNavigateToSubscriptionTables);
    
    return () => {
      window.removeEventListener('openCreateProjectModal', handleOpenCreateProjectModal);
      window.removeEventListener('navigate-to-subscription-tables', handleNavigateToSubscriptionTables);
    };
  }, []);

  const ViewComponent = viewComponents[currentView] || Dashboard;

  // Removemos la renderización sin layout para dashboard-timeline

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PrimarySidebar />
      
      {/* Floating Header */}
      <FloatingHeader />
      
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '0px', marginRight: '56px' }}>
        <main className="flex-1 overflow-auto relative">
          <div className="mx-auto" style={{ maxWidth: 'calc(100vw - 112px)', paddingTop: '64px', paddingLeft: '56px', paddingRight: '56px', paddingBottom: '37px' }}>
            <ViewComponent />
          </div>
        </main>
      </div>
      
      <SecondarySidebar />
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
