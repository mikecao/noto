import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { D1Config } from "../lib/storage/types";

export type SortBy = "updated" | "created" | "title";

interface SettingsStore {
  sortBy: SortBy;
  showPreview: boolean;
  showDate: boolean;
  settingsOpen: boolean;

  // Cloud settings
  cloudEnabled: boolean;
  d1Config: D1Config | null;
  connectionStatus: "untested" | "testing" | "success" | "failed";

  setSortBy: (sortBy: SortBy) => void;
  setShowPreview: (show: boolean) => void;
  setShowDate: (show: boolean) => void;
  setSettingsOpen: (open: boolean) => void;

  // Cloud settings actions
  setCloudEnabled: (enabled: boolean) => void;
  setD1Config: (config: D1Config | null) => void;
  setConnectionStatus: (status: "untested" | "testing" | "success" | "failed") => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      sortBy: "updated",
      showPreview: true,
      showDate: false,
      settingsOpen: false,

      // Cloud settings defaults
      cloudEnabled: false,
      d1Config: null,
      connectionStatus: "untested",

      setSortBy: (sortBy) => set({ sortBy }),
      setShowPreview: (showPreview) => set({ showPreview }),
      setShowDate: (showDate) => set({ showDate }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

      // Cloud settings actions
      setCloudEnabled: (cloudEnabled) => set({ cloudEnabled }),
      setD1Config: (d1Config) => set({ d1Config, connectionStatus: "untested" }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
    }),
    {
      name: "noto-settings",
      partialize: (state) => ({
        sortBy: state.sortBy,
        showPreview: state.showPreview,
        showDate: state.showDate,
        // Persist cloud settings
        cloudEnabled: state.cloudEnabled,
        d1Config: state.d1Config,
      }),
    }
  )
);
