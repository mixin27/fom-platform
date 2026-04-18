"use client"

import { create } from "zustand"

type PortalUiState = {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
}

export const usePortalUiStore = create<PortalUiState>((set) => ({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
}))
