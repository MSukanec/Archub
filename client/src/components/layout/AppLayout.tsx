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
import Calendar from '@/views/Calendar';

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
  'calendar': Calendar,
  'list': Contacts,
  'schedule': Calendar,
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
    let mounted = true;
    
    const init = async () => {
      try {
        const { user } = await authService.getCurrentUser();
        if (!mounted) return;
        
        if (user) {
          const dbUser = await authService.getUserFromDatabase(user.id);
          if (!mounted) return;
          
          setUser({
            id: user.id,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            role: dbUser?.role || 'user',
          });
          
          if (mounted) {
            await initializeUserContext();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

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
