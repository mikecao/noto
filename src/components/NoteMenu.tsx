import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pin, RotateCcw, Trash2 } from "lucide-react";

interface NoteMenuProps {
  isTrash: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

export function NoteMenu({
  isTrash,
  isPinned,
  onTogglePin,
  onDelete,
  onRestore,
  onPermanentDelete,
}: NoteMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
      >
        <MoreHorizontal size={20} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[120px]">
          {isTrash ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onRestore();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Restore
              </button>
              <button
                type="button"
                onClick={() => {
                  onPermanentDelete();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete forever
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onTogglePin();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <Pin size={14} />
                {isPinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
