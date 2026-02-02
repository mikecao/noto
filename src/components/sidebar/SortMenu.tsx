import { useState, useRef, useEffect } from "react";
import { ArrowDownUp, Check } from "lucide-react";
import { useSettingsStore, type SortBy } from "../../store/settingsStore";

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "updated", label: "Modified" },
  { value: "created", label: "Created" },
  { value: "title", label: "Title" },
];

export function SortMenu() {
  const sortBy = useSettingsStore((state) => state.sortBy);
  const setSortBy = useSettingsStore((state) => state.setSortBy);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
      >
        <ArrowDownUp size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-28">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSortBy(option.value);
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
            >
              {option.label}
              {sortBy === option.value && <Check size={14} className="text-gray-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
