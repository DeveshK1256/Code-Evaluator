import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SIDEBAR_STORAGE_KEY } from "@/constants";

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  toggleCollapse: () => void;
  setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      isCollapsed: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: SIDEBAR_STORAGE_KEY,
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);
