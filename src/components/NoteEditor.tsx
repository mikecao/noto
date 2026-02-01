import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useNoteStore } from "../store/noteStore";

export function NoteEditor() {
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const title = useNoteStore((state) => state.title);
  const content = useNoteStore((state) => state.content);
  const setTitle = useNoteStore((state) => state.setTitle);
  const setContent = useNoteStore((state) => state.setContent);
  const saveNote = useNoteStore((state) => state.saveNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);

  const [menuOpen, setMenuOpen] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedNote && !selectedNote.title && !selectedNote.content) {
      titleInputRef.current?.focus();
    }
  }, [selectedNote]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

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
      <div className="p-4 flex items-center justify-between">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 text-2xl font-bold bg-transparent outline-none text-gray-900"
        />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[120px]">
              <button
                type="button"
                onClick={() => {
                  deleteNote(selectedNote.id);
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start writing..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1 p-4 resize-none outline-none text-gray-700 overflow-y-auto"
      />
    </>
  );
}
