import { create } from 'zustand';

export type Section = 'dashboard' | 'organization' | 'projects' | 'budgets' | 'movements' | 'contacts' | 'calendar' | 'admin-community' | 'admin-library' | 'profile';
export type View = 
  | 'dashboard-main'
  | 'dashboard-timeline'
  | 'organization-overview'
  | 'organization-team'
  | 'organization-activity'
  | 'projects-overview'
  | 'projects-list'
  | 'budgets-list'
  | 'budgets-tasks'
  | 'budgets-tasks-multiple'
  | 'budgets-materials'
  | 'sitelog-main'
  | 'movements-main'
  | 'transactions'
  | 'contacts'
  | 'calendar'
  | 'admin-organizations'
  | 'admin-users'
  | 'admin-categories'
  | 'admin-material-categories'
  | 'admin-materials'
  | 'admin-units'
  | 'admin-elements'
  | 'admin-actions'
  | 'admin-tasks'
  | 'admin-permissions'
  | 'profile-info'
  | 'profile-subscription'
  | 'profile-notifications'
  | 'subscription-tables';

interface NavigationState {
  currentSection: Section;
  currentView: View;
  hoveredSection: Section | null;
  setSection: (section: Section) => void;
  setView: (view: View) => void;
  setHoveredSection: (section: Section | null) => void;
}

const sectionViewMap: Record<Section, View> = {
  dashboard: 'dashboard-timeline',
  organization: 'organization-overview',
  projects: 'projects-list',
  budgets: 'budgets-tasks-multiple',
  movements: 'movements-main',
  contacts: 'contacts',
  calendar: 'calendar',
  'admin-community': 'admin-organizations',
  'admin-library': 'admin-tasks',
  profile: 'profile-info',
};

// Helper function to get section from view
const getSectionFromView = (view: View): Section => {
  if (view.startsWith('dashboard-')) return 'dashboard';
  if (view.startsWith('organization-')) return 'organization';
  if (view.startsWith('projects-')) return 'projects';
  if (view.startsWith('budgets-')) return 'budgets';
  if (view.startsWith('sitelog-')) return 'budgets';
  if (view.startsWith('movements-') || view === 'transactions') return 'movements';
  if (view === 'contacts') return 'contacts';
  if (view === 'calendar') return 'calendar';
  if (view === 'admin-organizations' || view === 'admin-users') return 'admin-community';
  if (view.startsWith('admin-') && view !== 'admin-organizations' && view !== 'admin-users') return 'admin-library';
  if (view.startsWith('profile-') || view === 'subscription-tables') return 'profile';
  return 'dashboard';
};

export const useNavigationStore = create<NavigationState>((set) => ({
  currentSection: 'dashboard',
  currentView: 'dashboard-timeline',
  hoveredSection: null,
  setSection: (section) =>
    set((state) => {
      let view = sectionViewMap[section];
      return {
        currentSection: section,
        currentView: view,
      };
    }),
  setView: (view) => 
    set({ 
      currentView: view,
      currentSection: getSectionFromView(view)
    }),
  setHoveredSection: (section) => set({ hoveredSection: section }),
}));
