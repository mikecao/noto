import { useEffect } from "react";
import { Settings, X } from "lucide-react";
import { useNoteStore } from "./store/noteStore";
import { useSettingsStore } from "./store/settingsStore";
import { getStorageCoordinator } from "./lib/storage/coordinator";
import { useSyncStore } from "./store/syncStore";

const SYNC_INTERVAL_MS = 30_000;
import { Sidebar } from "./components/Sidebar";
import { NoteEditor } from "./components/NoteEditor";
import { CloudSettings } from "./components/settings/CloudSettings";

function App() {
  const loading = useNoteStore((state) => state.loading);
  const loadNotes = useNoteStore((state) => state.loadNotes);
  const settingsOpen = useSettingsStore((state) => state.settingsOpen);
  const setSettingsOpen = useSettingsStore((state) => state.setSettingsOpen);
  const initSettings = useSettingsStore((state) => state.initSettings);
  const settingsHydrated = useSettingsStore((state) => state._hydrated);
  const cloudEnabled = useSettingsStore((state) => state.cloudEnabled);

  useEffect(() => {
    initSettings().then(() => loadNotes());
  }, [initSettings, loadNotes]);

  // Live sync: periodically pull remote changes while cloud sync is enabled,
  // and refresh when the window regains focus.
  useEffect(() => {
    if (!cloudEnabled || !settingsHydrated) return;

    let active = true;

    async function pullFromCloud() {
      if (!navigator.onLine) return;
      if (useSyncStore.getState().isSyncing) return;
      try {
        const coordinator = getStorageCoordinator();
        await coordinator.processQueue();
        await coordinator.syncFromCloud();
        if (active) {
          await loadNotes();
        }
      } catch (err) {
        // Background sync failures are non-fatal; next tick will retry
        console.error("Background sync failed:", err);
      }
    }

    const interval = setInterval(pullFromCloud, SYNC_INTERVAL_MS);
    window.addEventListener("focus", pullFromCloud);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", pullFromCloud);
    };
  }, [cloudEnabled, settingsHydrated, loadNotes]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen, setSettingsOpen]);

  if (loading || !settingsHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (settingsOpen) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-900">
              <Settings size={20} />
              <h1 className="text-lg font-medium">Settings</h1>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
          </div>
          <CloudSettings />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-white">
        <NoteEditor />
      </main>
    </div>
  );
}

export default App;
