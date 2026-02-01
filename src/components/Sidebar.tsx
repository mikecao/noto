import { Plus } from "lucide-react";
import { useNoteStore } from "../store/noteStore";

export function Sidebar() {
  const notes = useNoteStore((state) => state.notes);
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const createNote = useNoteStore((state) => state.createNote);
  const selectNote = useNoteStore((state) => state.selectNote);

  return (
    <aside className="w-64 bg-white flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Noto</h1>
        <button
          type="button"
          onClick={createNote}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <Plus size={20} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">No notes yet</p>
        ) : (
          <ul className="flex flex-col gap-1 p-2">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => selectNote(note)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 ${
                    selectedNote?.id === note.id ? "bg-gray-100" : ""
                  }`}
                >
                  <p className="font-medium text-gray-900 truncate">
                    {note.title || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {note.content || "No content"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
