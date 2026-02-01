import { useEffect, useState } from "react";
import {
  type Note,
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} from "./lib/database";

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const allNotes = await getAllNotes();
      setNotes(allNotes);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNote() {
    try {
      const note = await createNote({ title: "Untitled", content: "" });
      setNotes([note, ...notes]);
      setSelectedNote(note);
      setTitle(note.title);
      setContent(note.content);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }

  async function handleSaveNote() {
    if (!selectedNote) return;
    try {
      const updated = await updateNote(selectedNote.id, { title, content });
      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  }

  async function handleDeleteNote(id: number) {
    try {
      await deleteNote(id);
      setNotes(notes.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  function selectNote(note: Note) {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Noto</h1>
          <button
            type="button"
            onClick={handleCreateNote}
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

      <main className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <header className="p-4 border-b border-gray-200 flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="flex-1 text-xl font-bold bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Delete
              </button>
            </header>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              className="flex-1 p-4 resize-none outline-none bg-white"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">
              Select a note or create a new one
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
