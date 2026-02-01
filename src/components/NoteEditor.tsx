import { useEffect, useRef } from "react";
import { useNoteStore } from "../store/noteStore";

export function NoteEditor() {
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const title = useNoteStore((state) => state.title);
  const content = useNoteStore((state) => state.content);
  const setTitle = useNoteStore((state) => state.setTitle);
  const setContent = useNoteStore((state) => state.setContent);
  const saveNote = useNoteStore((state) => state.saveNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);

  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    debouncedSave();
  }

  function handleContentChange(newContent: string) {
    setContent(newContent);
    debouncedSave();
  }

  function debouncedSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNote();
    }, 500);
  }

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Select a note or create a new one</p>
      </div>
    );
  }

  return (
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
          onClick={() => deleteNote(selectedNote.id)}
          className="px-3 py-1 text-gray-400 hover:text-red-500 text-sm"
        >
          Delete
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start writing..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1 p-4 resize-none outline-none text-gray-700"
      />
    </>
  );
}
