import { useState } from "react";
import type { Note } from "../lib/database";
import { NoteMenu } from "./NoteMenu";

interface NotePreviewProps {
  note: Note;
  isSelected: boolean;
  isTrash: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

export function NotePreview({
  note,
  isSelected,
  isTrash,
  onSelect,
  onToggleStar,
  onDelete,
  onRestore,
  onPermanentDelete,
}: NotePreviewProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left p-3 pr-10 rounded-lg hover:bg-gray-100 ${
          isSelected ? "bg-gray-100" : ""
        }`}
      >
        <p
          className={`font-medium truncate leading-6 ${note.title ? "text-gray-900" : "text-gray-400"}`}
        >
          {note.title || "Untitled"}
        </p>
        <p
          className={`text-xs truncate ${note.content ? "text-gray-500" : "text-gray-400 italic"}`}
        >
          {note.content || "No content"}
        </p>
      </button>
      <div
        className={`absolute right-2 top-3 ${
          menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <NoteMenu
          isTrash={isTrash}
          isStarred={!!note.starred}
          onToggleStar={onToggleStar}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          onOpenChange={setMenuOpen}
        />
      </div>
    </li>
  );
}
