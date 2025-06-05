import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUserContextStore } from '@/stores/userContextStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { authService } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/useMediaQuery';
import PrimarySidebar from './PrimarySidebar';
import FloatingHeader from './FloatingHeader';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawerFixed';
import ArchubDashboard from '@/views/dashboard/ArchubDashboard';
import CalendarView from '@/views/dashboard/Calendar';

import Organization from '@/views/organization/Organization';
import OrganizationTeam from '@/views/organization/OrganizationTeam';
import OrganizationSettings from '@/views/organization/OrganizationSettings';
import ProjectsList from '@/views/project/ProjectsList';

import SiteBudgets from '@/views/site/SiteBudgets';
import SiteMaterials from '@/views/site/SiteMaterials';
import SiteLogs from '@/views/site/SiteLogs';
import FinancesMovements from '@/views/finances/FinancesMovements';
import FinancesDashboard from '@/views/finances/FinancesDashboard';
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
import ProfileSecurity from '@/views/profile/ProfileSecurity';
import ProfileSubscription from '@/views/profile/ProfileSubscription';
import SubscriptionTables from '@/views/others/SubscriptionTables';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { useNavigationStore } from '@/stores/navigationStore';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';


const viewComponents = {
  'dashboard-main': ArchubDashboard,
  'dashboard-timeline': ArchubDashboard,

  'organization-overview': Organization,
  'organization-team': OrganizationTeam,
  'organization-settings': OrganizationSettings,
  'organization-activity': Organization,
  'projects-overview': ProjectsList,
  'projects-list': ProjectsList,
  'budgets-list': SiteBudgets,
  'budgets-tasks': SiteBudgets,
  'budgets-tasks-multiple': SiteBudgets,
  'budgets-materials': SiteMaterials,
  'sitelog-main': SiteLogs,
  'movements-main': FinancesMovements,
  'movements-dashboard': FinancesDashboard,
  'transactions': FinancesMovements,
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
  'profile-main': Profile,
  'profile-security': ProfileSecurity,
  'profile-subscription': ProfileSubscription,
  'subscription-tables': SubscriptionTables,
};

export default function AppLayout() {
  const { setUser, setLoading } = useAuthStore();
  const { currentView } = useNavigationStore();
  const { setSecondarySidebarVisible } = useSidebarStore();
  const { initializeUserContext, userId } = useUserContextStore();
  const { initializeTheme } = useThemeStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Onboarding tour functionality
  const { showTour, isFirstVisit, completeTour, skipTour } = useOnboardingTour();

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();
  }, [initializeTheme]);

  // Initialize theme when user context is ready
  useEffect(() => {
    if (userId) {
      initializeTheme();
    }
  }, [userId, initializeTheme]);

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

  const ViewComponent = viewComponents[currentView] || (() => <div>Vista no encontrada</div>);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-views">
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
            <main className="flex-1 overflow-auto relative bg-surface-views">
              <div className="mx-auto px-1 py-1">
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
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto relative bg-surface-views">
              <div className="w-full p-10">
                <ViewComponent />
              </div>
            </main>
          </div>
          

        </>
      )}
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      {/* Onboarding Tour */}
      <OnboardingTour
        isVisible={showTour}
        onComplete={completeTour}
        onSkip={skipTour}
      />
    </div>
  );
}
