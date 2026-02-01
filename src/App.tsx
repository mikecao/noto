import { useCallback, useEffect, useRef, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<{ title: string; content: string } | null>(
    null
  );
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (editorRef.current && selectedNote) {
      editorRef.current.innerText = selectedNote.content;
    }
  }, [selectedNote?.id]);

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

  const saveNote = useCallback(
    async (noteId: number, noteTitle: string, noteContent: string) => {
      try {
        const updated = await updateNote(noteId, {
          title: noteTitle,
          content: noteContent,
        });
        setNotes((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n))
        );
        return updated;
      } catch (err) {
        console.error("Failed to save note:", err);
        return null;
      }
    },
    []
  );

  const debouncedSave = useCallback(
    (noteId: number, noteTitle: string, noteContent: string) => {
      pendingSaveRef.current = { title: noteTitle, content: noteContent };
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        saveNote(noteId, noteTitle, noteContent);
        pendingSaveRef.current = null;
      }, 500);
    },
    [saveNote]
  );

  async function handleCreateNote() {
    try {
      const note = await createNote({ title: "", content: "" });
      setNotes((prev) => [note, ...prev]);
      setSelectedNote(note);
      setTitle("");
      if (editorRef.current) {
        editorRef.current.innerText = "";
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }

  async function handleDeleteNote(id: number) {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setTitle("");
        if (editorRef.current) {
          editorRef.current.innerText = "";
        }
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  async function selectNote(note: Note) {
    if (selectedNote && pendingSaveRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      await saveNote(
        selectedNote.id,
        pendingSaveRef.current.title,
        pendingSaveRef.current.content
      );
      pendingSaveRef.current = null;
    }
    setSelectedNote(note);
    setTitle(note.title);
  }

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    if (selectedNote) {
      const content = editorRef.current?.innerText || "";
      debouncedSave(selectedNote.id, newTitle, content);
    }
  }

  function handleContentChange() {
    if (selectedNote && editorRef.current) {
      const content = editorRef.current.innerText || "";
      debouncedSave(selectedNote.id, title, content);
    }
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

      <main className="flex-1 flex flex-col bg-white">
        {selectedNote ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="flex-1 text-2xl font-bold bg-transparent outline-none text-gray-900"
              />
              <button
                type="button"
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="px-3 py-1 text-gray-400 hover:text-red-500 text-sm"
              >
                Delete
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentChange}
              data-placeholder="Start writing..."
              className="flex-1 p-4 outline-none text-gray-700 overflow-auto whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">Select a note or create a new one</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
