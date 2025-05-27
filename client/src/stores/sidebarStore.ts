import { create } from 'zustand';

interface SidebarState {
  isSecondarySidebarVisible: boolean;
  setSecondarySidebarVisible: (visible: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isSecondarySidebarVisible: false,
  setSecondarySidebarVisible: (visible) => set({ isSecondarySidebarVisible: visible }),
}));