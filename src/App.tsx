import { useEffect } from "react";
import { Settings } from "lucide-react";
import { useNoteStore } from "./store/noteStore";
import { useSettingsStore } from "./store/settingsStore";
import { Sidebar } from "./components/Sidebar";
import { NoteEditor } from "./components/NoteEditor";
import { SettingsPanel } from "./components/SettingsPanel";

function App() {
  const loading = useNoteStore((state) => state.loading);
  const loadNotes = useNoteStore((state) => state.loadNotes);
  const settingsOpen = useSettingsStore((state) => state.settingsOpen);
  const setSettingsOpen = useSettingsStore((state) => state.setSettingsOpen);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-white">
        <NoteEditor />
      </main>
      <div className="flex flex-col bg-white">
        <div className="p-3">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-1.5 rounded ${
              settingsOpen
                ? "text-gray-900 bg-gray-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      {settingsOpen && <SettingsPanel />}
    </div>
  );
}

export default App;
