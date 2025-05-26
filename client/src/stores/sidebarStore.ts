import { create } from 'zustand';

interface SidebarState {
  isSecondarySidebarVisible: boolean;
  setSecondarySidebarVisible: (visible: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isSecondarySidebarVisible: true,
  setSecondarySidebarVisible: (visible) => set({ isSecondarySidebarVisible: visible }),
}));