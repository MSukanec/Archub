import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { authService } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/useMediaQuery';
import PrimarySidebar from './PrimarySidebar';
import SecondarySidebar from './SecondarySidebar';
import FloatingHeader from './FloatingHeader';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';
import Dashboard from '@/views/dashboard/Dashboard';
import DashboardTimeline from '@/views/dashboard/DashboardTimeline';
import CalendarView from '@/views/dashboard/Calendar';

import Organization from '@/views/organization/Organization';
import OrganizationTeam from '@/views/organization/OrganizationTeam';
import OrganizationPDF from '@/views/organization/OrganizationPDF';
import OrganizationSettings from '@/views/organization/OrganizationSettings';
import ProjectsList from '@/views/project/ProjectsList';

import SiteBudgets from '@/views/site/SiteBudgets';
import SiteMaterials from '@/views/site/SiteMaterials';
import SiteLogs from '@/views/site/SiteLogs';
import Movements from '@/views/movements/Movements';
import Contacts from '@/views/contacts/Contacts';

import AdminOrganizations from '@/views/admin/AdminOrganizations';
import AdminUnits from '@/views/admin/AdminUnits';
import AdminElements from '@/views/admin/AdminElements';
import AdminActions from '@/views/admin/AdminActions';
import AdminUsers from '@/views/admin/AdminUsers';
import AdminCategories from '@/views/admin/AdminCategories';
import AdminMaterialCategories from '@/views/admin/AdminMaterialCategories';
import AdminMaterials from '@/views/admin/AdminMaterials';
import AdminTasks from '@/views/admin/AdminTasks';
import Calendar from '@/views/dashboard/Calendar';

import Profile from '@/views/profile/Profile';
import ProfileInfo from '@/views/profile/ProfileInfo';
import ProfileSecurity from '@/views/profile/ProfileSecurity';
import ProfileSubscription from '@/views/profile/ProfileSubscription';
import SubscriptionTables from '@/views/others/SubscriptionTables';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { useNavigationStore } from '@/stores/navigationStore';


const viewComponents = {
  'dashboard-main': Dashboard,
  'dashboard-timeline': DashboardTimeline,

  'organization-overview': Organization,
  'organization-team': OrganizationTeam,
  'organization-pdf': OrganizationPDF,
  'organization-settings': OrganizationSettings,
  'organization-activity': Organization,
  'projects-overview': ProjectsList,
  'projects-list': ProjectsList,
  'budgets-list': SiteBudgets,
  'budgets-tasks': SiteBudgets,
  'budgets-tasks-multiple': SiteBudgets,
  'budgets-materials': SiteMaterials,
  'sitelog-main': SiteLogs,
  'movements-main': Movements,
  'transactions': Movements,
  'contacts': Contacts,
  'calendar': CalendarView,
  'admin-organizations': AdminOrganizations,
  'admin-users': AdminUsers,
  'admin-categories': AdminCategories,
  'admin-material-categories': AdminMaterialCategories,
  'admin-materials': AdminMaterials,
  'admin-units': AdminUnits,
  'admin-elements': AdminElements,
  'admin-actions': AdminActions,
  'admin-tasks': AdminTasks,
  'admin-permissions': AdminActions, // Temporarily using actions view
  'profile-info': ProfileInfo,
  'profile-security': ProfileSecurity,
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

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
      {isMobile ? (
        // Mobile Layout
        <>
          {/* Mobile Header */}
          <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
          
          {/* Mobile Drawer */}
          <MobileDrawer 
            isOpen={isMobileDrawerOpen} 
            onClose={() => setIsMobileDrawerOpen(false)} 
          />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden pt-14">
            <main className="flex-1 overflow-auto relative">
              <div className="mx-auto p-4">
                <ViewComponent />
              </div>
            </main>
          </div>
          


        </>
      ) : (
        // Desktop Layout
        <>
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
          

        </>
      )}
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
