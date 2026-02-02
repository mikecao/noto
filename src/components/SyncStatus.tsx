import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { useSyncStore } from "../store/syncStore";

export function SyncStatus() {
  const cloudEnabled = useSettingsStore((s) => s.cloudEnabled);
  const { isOnline, isSyncing, queue, error } = useSyncStore();

  if (!cloudEnabled) {
    return null;
  }

  const pendingCount = queue.length;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      {isSyncing ? (
        <Loader2 size={14} className="animate-spin text-gray-600" />
      ) : isOnline ? (
        <Cloud size={14} className="text-gray-500" />
      ) : (
        <CloudOff size={14} className="text-gray-400" />
      )}

      {isSyncing && <span>Syncing...</span>}

      {!isSyncing && pendingCount > 0 && (
        <span>{pendingCount} pending</span>
      )}

      {error && (
        <span className="flex items-center gap-1 text-red-500">
          <AlertCircle size={12} />
          Error
        </span>
      )}
    </div>
  );
}
