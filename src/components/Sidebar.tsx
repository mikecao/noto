import { useState } from "react";
import { NotebookPen, Plus, Search, Star, Trash, X } from "lucide-react";
import { useNoteStore } from "../store/noteStore";
import { NotePreview } from "./NotePreview";

export function Sidebar() {
  const notes = useNoteStore((state) => state.notes);
  const starred = useNoteStore((state) => state.starred);
  const trash = useNoteStore((state) => state.trash);
  const view = useNoteStore((state) => state.view);
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const createNote = useNoteStore((state) => state.createNote);
  const selectNote = useNoteStore((state) => state.selectNote);
  const toggleStar = useNoteStore((state) => state.toggleStar);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const restoreNote = useNoteStore((state) => state.restoreNote);
  const permanentlyDeleteNote = useNoteStore(
    (state) => state.permanentlyDeleteNote
  );
  const setView = useNoteStore((state) => state.setView);
  const loadStarred = useNoteStore((state) => state.loadStarred);
  const loadTrash = useNoteStore((state) => state.loadTrash);
  const [searchQuery, setSearchQuery] = useState("");

  const displayedNotes =
    view === "notes" ? notes : view === "starred" ? starred : trash;
  const filteredNotes = displayedNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleViewChange(newView: "notes" | "starred" | "trash") {
    if (newView === "starred") {
      loadStarred();
    } else if (newView === "trash") {
      loadTrash();
    }
    setView(newView);
    setSearchQuery("");
  }

  return (
    <aside className="w-64 bg-white flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleViewChange("notes")}
            className={`p-1.5 rounded ${
              view === "notes"
                ? "text-gray-900 bg-gray-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <NotebookPen size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("starred")}
            className={`p-1.5 rounded ${
              view === "starred"
                ? "text-gray-900 bg-gray-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Star size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("trash")}
            className={`p-1.5 rounded ${
              view === "trash"
                ? "text-gray-900 bg-gray-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Trash size={16} />
          </button>
        </div>
        {view === "notes" && (
          <button
            type="button"
            onClick={createNote}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      <div className="px-2">
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
            {searchQuery
              ? "No matching notes"
              : view === "notes"
                ? "No notes yet"
                : view === "starred"
                  ? "No starred notes"
                  : "Trash is empty"}
          </p>
        ) : (
          <ul className="flex flex-col gap-1 p-2">
            {filteredNotes.map((note) => (
              <NotePreview
                key={note.id}
                note={note}
                isSelected={selectedNote?.id === note.id}
                isTrash={view === "trash"}
                onSelect={() => selectNote(note)}
                onToggleStar={() => toggleStar(note)}
                onDelete={() => deleteNote(note.id)}
                onRestore={() => restoreNote(note.id)}
                onPermanentDelete={() => permanentlyDeleteNote(note.id)}
              />
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
