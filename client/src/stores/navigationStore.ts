import { create } from 'zustand';

export type Section = 'dashboard' | 'projects' | 'contacts' | 'admin' | 'profile';
export type View = 
  | 'dashboard-main'
  | 'dashboard-activity'
  | 'projects-overview'
  | 'projects-list'
  | 'projects-sitelog'
  | 'projects-budgets'
  | 'projects-movements'
  | 'contacts'
  | 'admin-organizations'
  | 'admin-users'
  | 'admin-categories'
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
  dashboard: 'dashboard-main',
  projects: 'projects-overview',
  contacts: 'contacts',
  admin: 'admin-organizations',
  profile: 'profile-info',
};

export const useNavigationStore = create<NavigationState>((set) => ({
  currentSection: 'dashboard',
  currentView: 'dashboard-main',
  hoveredSection: null,
  setSection: (section) =>
    set({
      currentSection: section,
      currentView: sectionViewMap[section],
    }),
  setView: (view) => set({ currentView: view }),
  setHoveredSection: (section) => set({ hoveredSection: section }),
}));
