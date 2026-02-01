import { useState } from "react";
import { Pin, Plus, Search, X } from "lucide-react";
import { useNoteStore } from "../store/noteStore";

export function Sidebar() {
  const notes = useNoteStore((state) => state.notes);
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const createNote = useNoteStore((state) => state.createNote);
  const selectNote = useNoteStore((state) => state.selectNote);
  const togglePin = useNoteStore((state) => state.togglePin);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">
            {searchQuery ? "No matching notes" : "No notes yet"}
          </p>
        ) : (
          <ul className="flex flex-col gap-1 p-2">
            {filteredNotes.map((note) => (
              <li key={note.id} className="group relative">
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(note);
                  }}
                  className={`absolute right-2 top-3 p-1 rounded hover:bg-gray-200 ${
                    note.pinned ? "text-gray-600" : "text-gray-400 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Pin size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
