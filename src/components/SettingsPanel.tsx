import { X } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { CloudSettings } from "./CloudSettings";

export function SettingsPanel() {
  const setSettingsOpen = useSettingsStore((state) => state.setSettingsOpen);

  return (
    <aside className="w-80 bg-white flex flex-col">
      <div className="p-3 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Settings</h2>
        <button
          type="button"
          onClick={() => setSettingsOpen(false)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <CloudSettings />
      </div>
    </aside>
  );
}
