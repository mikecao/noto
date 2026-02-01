import { useNoteStore } from "../store/noteStore";

export function Sidebar() {
  const notes = useNoteStore((state) => state.notes);
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const createNote = useNoteStore((state) => state.createNote);
  const selectNote = useNoteStore((state) => state.selectNote);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Noto</h1>
        <button
          type="button"
          onClick={createNote}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          New
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">No notes yet</p>
        ) : (
          <ul>
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => selectNote(note)}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 ${
                    selectedNote?.id === note.id ? "bg-blue-50" : ""
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
