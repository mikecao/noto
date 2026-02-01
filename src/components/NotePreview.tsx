import { Pin, Star } from "lucide-react";
import type { Note } from "../lib/database";

interface NotePreviewProps {
  note: Note;
  isSelected: boolean;
  showActions: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
  onTogglePin: () => void;
}

export function NotePreview({
  note,
  isSelected,
  showActions,
  onSelect,
  onToggleStar,
  onTogglePin,
}: NotePreviewProps) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 ${
          isSelected ? "bg-gray-100" : ""
        }`}
      >
        <p
          className={`font-medium truncate ${note.title ? "text-gray-900" : "text-gray-400"}`}
        >
          {note.title || "Untitled"}
        </p>
        <p
          className={`text-xs truncate ${note.content ? "text-gray-500" : "text-gray-400 italic"}`}
        >
          {note.content || "No content"}
        </p>
      </button>
      {showActions && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
            className={`absolute right-9 top-3 p-1 rounded hover:bg-gray-200 ${
              note.starred
                ? "text-gray-600"
                : "text-gray-400 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`absolute right-2 top-3 p-1 rounded hover:bg-gray-200 ${
              note.pinned
                ? "text-gray-600"
                : "text-gray-400 opacity-0 group-hover:opacity-100"
            }`}
          >
            <Pin size={16} />
          </button>
        </>
      )}
    </li>
  );
}
