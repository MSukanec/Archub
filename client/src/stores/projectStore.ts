import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@shared/schema';

interface ProjectState {
  currentProject: Project | null;
  lastProjectId: number | null;
  setCurrentProject: (project: Project | null) => void;
  setLastProjectId: (id: number | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      lastProjectId: null,
      setCurrentProject: (project) => set({ currentProject: project }),
      setLastProjectId: (id) => set({ lastProjectId: id }),
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({ lastProjectId: state.lastProjectId }),
    }
  )
);
