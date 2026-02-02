import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

interface FindBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentMatch: number;
  totalMatches: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function FindBar({
  searchTerm,
  onSearchChange,
  currentMatch,
  totalMatches,
  onNext,
  onPrevious,
  onClose,
}: FindBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 px-4 py-2">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-40 px-3 py-1.5 text-sm bg-gray-100 rounded-lg outline-none"
      />
      <span className="text-sm text-gray-500 min-w-[80px]">
        {totalMatches > 0 ? `${currentMatch} of ${totalMatches}` : "No results"}
      </span>
      <button
        type="button"
        onClick={onPrevious}
        disabled={totalMatches === 0}
        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={totalMatches === 0}
        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronDown size={16} />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
      >
        <X size={16} />
      </button>
    </div>
  );
}
