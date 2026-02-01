import { useEffect, useRef } from "react";
import { useNoteStore } from "../store/noteStore";
import { NoteMenu } from "./NoteMenu";

export function NoteEditor() {
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const title = useNoteStore((state) => state.title);
  const content = useNoteStore((state) => state.content);
  const setTitle = useNoteStore((state) => state.setTitle);
  const setContent = useNoteStore((state) => state.setContent);
  const saveNote = useNoteStore((state) => state.saveNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const togglePin = useNoteStore((state) => state.togglePin);

  const saveTimeoutRef = useRef<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
        <NoteMenu
          isPinned={!!selectedNote.pinned}
          onTogglePin={() => togglePin(selectedNote)}
          onDelete={() => deleteNote(selectedNote.id)}
        />
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
