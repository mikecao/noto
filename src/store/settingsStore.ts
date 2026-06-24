import { create } from "zustand";
import type { D1Config } from "../lib/storage/types";
import { getSQLiteProvider } from "../lib/storage/sqlite";

export type SortBy = "updated" | "created" | "title";

interface SettingsStore {
  sortBy: SortBy;
  showPreview: boolean;
  showDate: boolean;
  settingsOpen: boolean;
  _hydrated: boolean;

  // Cloud settings
  cloudEnabled: boolean;
  d1Config: D1Config | null;
  connectionStatus: "untested" | "testing" | "success" | "failed";

  initSettings: () => Promise<void>;
  setSortBy: (sortBy: SortBy) => void;
  setShowPreview: (show: boolean) => void;
  setShowDate: (show: boolean) => void;
  setSettingsOpen: (open: boolean) => void;

  // Cloud settings actions
  setCloudEnabled: (enabled: boolean) => void;
  setD1Config: (config: D1Config | null) => void;
  setConnectionStatus: (status: "untested" | "testing" | "success" | "failed") => void;
}

function saveSetting(key: string, value: unknown) {
  getSQLiteProvider().setSetting(key, JSON.stringify(value));
}

export const useSettingsStore = create<SettingsStore>()((set) => ({
  sortBy: "updated",
  showPreview: true,
  showDate: false,
  settingsOpen: false,
  _hydrated: false,

  // Cloud settings defaults
  cloudEnabled: false,
  d1Config: null,
  connectionStatus: "untested",

  initSettings: async () => {
    const db = getSQLiteProvider();
    let settings = await db.getAllSettings();

    // Migrate from localStorage if SQLite is empty
    if (Object.keys(settings).length === 0) {
      const raw = localStorage.getItem("noto-settings");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const state = parsed.state ?? parsed;
          const migrations: Record<string, unknown> = {};
          if (state.sortBy !== undefined) migrations.sortBy = state.sortBy;
          if (state.showPreview !== undefined) migrations.showPreview = state.showPreview;
          if (state.showDate !== undefined) migrations.showDate = state.showDate;
          if (state.cloudEnabled !== undefined) migrations.cloudEnabled = state.cloudEnabled;
          if (state.d1Config !== undefined) migrations.d1Config = state.d1Config;

          for (const [key, value] of Object.entries(migrations)) {
            await db.setSetting(key, JSON.stringify(value));
          }
          settings = await db.getAllSettings();
          localStorage.removeItem("noto-settings");
        } catch {
          // Ignore corrupt localStorage data
        }
      }
    }

    const parse = <T>(key: string, fallback: T): T => {
      if (key in settings) {
        try {
          return JSON.parse(settings[key]) as T;
        } catch {
          return fallback;
        }
      }
      return fallback;
    };

    const hydrated = {
      sortBy: parse<SortBy>("sortBy", "updated"),
      showPreview: parse<boolean>("showPreview", true),
      showDate: parse<boolean>("showDate", false),
      cloudEnabled: parse<boolean>("cloudEnabled", false),
      d1Config: parse<D1Config | null>("d1Config", null),
    };

    set({
      ...hydrated,
      connectionStatus: hydrated.cloudEnabled && hydrated.d1Config ? "success" : "untested",
      _hydrated: true,
    });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    saveSetting("sortBy", sortBy);
  },
  setShowPreview: (showPreview) => {
    set({ showPreview });
    saveSetting("showPreview", showPreview);
  },
  setShowDate: (showDate) => {
    set({ showDate });
    saveSetting("showDate", showDate);
  },
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  // Cloud settings actions
  setCloudEnabled: (cloudEnabled) => {
    set({ cloudEnabled });
    saveSetting("cloudEnabled", cloudEnabled);
  },
  setD1Config: (d1Config) => {
    set({ d1Config, connectionStatus: "untested" });
    saveSetting("d1Config", d1Config);
  },
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
}));
