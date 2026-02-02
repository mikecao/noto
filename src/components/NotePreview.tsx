import { useState } from "react";
import { Star } from "lucide-react";
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
          className={`font-medium truncate leading-6 grid grid-cols-[16px_1fr] items-center gap-1 ${note.title ? "text-gray-900" : "text-gray-400"}`}
        >
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onToggleStar();
              }
            }}
            className={`flex justify-center cursor-pointer ${
              note.starred ? "" : "opacity-0 group-hover:opacity-30 hover:!opacity-100"
            }`}
          >
            <Star size={14} className="shrink-0" />
          </span>
          <span className="truncate">{note.title || "Untitled"}</span>
        </p>
        <p
          className={`text-xs truncate grid grid-cols-[16px_1fr] gap-1 ${note.content ? "text-gray-500" : "text-gray-400 italic"}`}
        >
          <span />
          <span className="truncate">{note.content || "No content"}</span>
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
