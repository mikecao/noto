import { useEffect } from "react";
import type { Note } from "../../lib/storage/types";
import { useNoteStore } from "../../store/noteStore";
import { NotePreview } from "../NotePreview";

interface NoteListProps {
  notes: Note[];
  searchQuery: string;
  sidebarRef: React.RefObject<HTMLElement | null>;
}

export function NoteList({ notes, searchQuery, sidebarRef }: NoteListProps) {
  const view = useNoteStore((state) => state.view);
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const selectNote = useNoteStore((state) => state.selectNote);
  const toggleStar = useNoteStore((state) => state.toggleStar);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const restoreNote = useNoteStore((state) => state.restoreNote);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      if (notes.length === 0) return;

      // Only handle when focus is within the sidebar
      if (!sidebarRef.current?.contains(document.activeElement)) {
        return;
      }

      e.preventDefault();
      const currentIndex = selectedNote
        ? notes.findIndex((n) => n.id === selectedNote.id)
        : -1;

      let nextIndex: number;
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < notes.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : notes.length - 1;
      }

      selectNote(notes[nextIndex]);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [notes, selectedNote, selectNote, sidebarRef]);

  const emptyMessage = searchQuery
    ? "No matching notes"
    : view === "notes"
      ? "No notes yet"
      : view === "starred"
        ? "No starred notes"
        : "Trash is empty";

  if (notes.length === 0) {
    return <p className="p-4 text-gray-500 text-sm">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {notes.map((note) => (
        <NotePreview
          key={note.id}
          note={note}
          isSelected={selectedNote?.id === note.id}
          isTrash={view === "trash"}
          onSelect={() => selectNote(note)}
          onToggleStar={() => toggleStar(note)}
          onDelete={() => deleteNote(note.id)}
          onRestore={() => restoreNote(note.id)}
        />
      ))}
    </ul>
  );
}
