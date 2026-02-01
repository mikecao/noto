import { useEffect } from "react";
import { useNoteStore } from "./store/noteStore";
import { Sidebar } from "./components/Sidebar";
import { NoteEditor } from "./components/NoteEditor";

function App() {
  const loading = useNoteStore((state) => state.loading);
  const loadNotes = useNoteStore((state) => state.loadNotes);

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
    </div>
  );
}

export default App;
