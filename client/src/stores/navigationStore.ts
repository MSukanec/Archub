import { create } from 'zustand';

export type Section = 'dashboard' | 'projects' | 'admin' | 'profile';
export type View = 
  | 'dashboard-main'
  | 'dashboard-activity'
  | 'projects-overview'
  | 'projects-list'
  | 'admin-organizations'
  | 'admin-users'
  | 'admin-units'
  | 'admin-elements'
  | 'admin-actions'
  | 'admin-permissions'
  | 'profile-info'
  | 'profile-subscription'
  | 'profile-notifications';

interface NavigationState {
  currentSection: Section;
  currentView: View;
  setSection: (section: Section) => void;
  setView: (view: View) => void;
}

const sectionViewMap: Record<Section, View> = {
  dashboard: 'dashboard-main',
  projects: 'projects-overview',
  admin: 'admin-organizations',
  profile: 'profile-info',
};

export const useNavigationStore = create<NavigationState>((set) => ({
  currentSection: 'dashboard',
  currentView: 'dashboard-main',
  setSection: (section) =>
    set({
      currentSection: section,
      currentView: sectionViewMap[section],
    }),
  setView: (view) => set({ currentView: view }),
}));
