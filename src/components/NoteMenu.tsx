import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, RotateCcw, Star, Trash, X } from "lucide-react";

interface NoteMenuProps {
  isTrash: boolean;
  isStarred: boolean;
  onToggleStar: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function NoteMenu({
  isTrash,
  isStarred,
  onToggleStar,
  onDelete,
  onRestore,
  onPermanentDelete,
  onOpenChange,
}: NoteMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function updateMenuOpen(open: boolean) {
    setMenuOpen(open);
    onOpenChange?.(open);
  }
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        updateMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => updateMenuOpen(!menuOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
      >
        <MoreHorizontal size={16} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[150px] z-50">
          {isTrash ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onRestore();
                  updateMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <RotateCcw size={16} className="shrink-0" />
                Restore
              </button>
              <button
                type="button"
                onClick={() => {
                  onPermanentDelete();
                  updateMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <X size={16} className="shrink-0" />
                Delete forever
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onToggleStar();
                  updateMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <Star size={16} className="shrink-0" />
                {isStarred ? "Unstar" : "Star"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  updateMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <Trash size={16} className="shrink-0" />
                Move to trash
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
