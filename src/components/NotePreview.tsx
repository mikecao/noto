import { RotateCcw, Star, Trash, X } from "lucide-react";
import type { Note } from "../lib/database";

interface NotePreviewProps {
  note: Note;
  isSelected: boolean;
  isTrash: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
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
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left px-3 py-2 pr-10 rounded-lg hover:bg-gray-100 ${
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
      {isTrash ? (
        <div className="absolute right-2 top-3 flex gap-1 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRestore?.();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Restore"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPermanentDelete?.();
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete forever"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-3 p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100"
        >
          <Trash size={14} />
        </button>
      )}
    </li>
  );
}
