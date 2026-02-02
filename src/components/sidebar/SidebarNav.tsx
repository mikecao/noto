import { NotebookPen, Plus, Settings, Star, Trash } from "lucide-react";
import { useNoteStore } from "../../store/noteStore";
import { useSettingsStore } from "../../store/settingsStore";

interface SidebarNavProps {
  onViewChange: (view: "notes" | "starred" | "trash") => void;
}

export function SidebarNav({ onViewChange }: SidebarNavProps) {
  const view = useNoteStore((state) => state.view);
  const createNote = useNoteStore((state) => state.createNote);
  const settingsOpen = useSettingsStore((state) => state.settingsOpen);
  const setSettingsOpen = useSettingsStore((state) => state.setSettingsOpen);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onViewChange("notes")}
          className={`p-1.5 rounded ${
            view === "notes"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <NotebookPen size={16} />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("starred")}
          className={`p-1.5 rounded ${
            view === "starred"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Star size={16} />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("trash")}
          className={`p-1.5 rounded ${
            view === "trash"
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Trash size={16} />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`p-1.5 rounded ${
            settingsOpen
              ? "text-gray-900 bg-gray-100"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings size={16} />
        </button>
      </div>
      {view === "notes" && (
        <button
          type="button"
          onClick={createNote}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}
