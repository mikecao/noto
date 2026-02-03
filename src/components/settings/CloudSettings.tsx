import { useState } from "react";
import { Cloud, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useSettingsStore } from "../../store/settingsStore";
import { useSyncStore } from "../../store/syncStore";
import { useNoteStore } from "../../store/noteStore";
import { D1Provider } from "../../lib/storage/d1";
import { getStorageCoordinator } from "../../lib/storage/coordinator";
import { Switch } from "../ui/switch";

type SyncStrategy = "merge" | "replace" | null;

export function CloudSettings() {
  const {
    cloudEnabled,
    d1Config,
    connectionStatus,
    setCloudEnabled,
    setD1Config,
    setConnectionStatus,
  } = useSettingsStore();

  const { queue } = useSyncStore();

  const { loadNotes } = useNoteStore();

  const [accountId, setAccountId] = useState(d1Config?.accountId ?? "");
  const [databaseId, setDatabaseId] = useState(d1Config?.databaseId ?? "");
  const [apiToken, setApiToken] = useState(d1Config?.apiToken ?? "");
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncStrategy, setSyncStrategy] = useState<SyncStrategy>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const hasChanges =
    accountId !== (d1Config?.accountId ?? "") ||
    databaseId !== (d1Config?.databaseId ?? "") ||
    apiToken !== (d1Config?.apiToken ?? "");

  const canTest = accountId && databaseId && apiToken;

  async function handleTestConnection() {
    if (!canTest) return;

    setConnectionStatus("testing");

    try {
      const testProvider = new D1Provider({
        accountId,
        databaseId,
        apiToken,
      });
      const success = await testProvider.testConnection();
      setConnectionStatus(success ? "success" : "failed");
    } catch {
      setConnectionStatus("failed");
    }
  }

  function handleSaveConfig() {
    if (!canTest) return;

    setD1Config({
      accountId,
      databaseId,
      apiToken,
    });

    // Reset the coordinator so it picks up new config
    getStorageCoordinator().resetD1();
  }

  async function handleToggleCloud(enabled: boolean) {
    if (enabled && !d1Config) {
      // Don't enable without config
      return;
    }

    if (enabled) {
      const coordinator = getStorageCoordinator();
      const hasLocal = await coordinator.hasLocalNotes();

      if (hasLocal) {
        // Show dialog to choose sync strategy
        setShowSyncDialog(true);
        return;
      }

      // No local notes, just enable and sync from cloud
      setCloudEnabled(true);
      setIsSyncing(true);
      setSyncError(null);

      try {
        await coordinator.initializeCloud();
        await coordinator.syncFromCloud();
        await loadNotes();
      } catch (error) {
        console.error("Sync failed:", error);
        setSyncError(error instanceof Error ? error.message : "Sync failed");
        setCloudEnabled(false);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setCloudEnabled(false);
    }
  }

  async function handleSyncStrategyConfirm() {
    if (!syncStrategy) return;

    const coordinator = getStorageCoordinator();
    setShowSyncDialog(false);
    setCloudEnabled(true);
    setIsSyncing(true);
    setSyncError(null);

    try {
      await coordinator.initializeCloud();

      if (syncStrategy === "merge") {
        // Push all local notes to cloud, then pull cloud notes
        await coordinator.pushLocalToCloud();
        await coordinator.syncFromCloud();
      } else {
        // Replace: discard local, pull cloud only
        await coordinator.replaceLocalWithCloud();
      }

      // Refresh note stores after sync
      await loadNotes();
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncError(error instanceof Error ? error.message : "Sync failed");
      // Disable cloud sync if it failed
      setCloudEnabled(false);
    } finally {
      setIsSyncing(false);
      setSyncStrategy(null);
    }
  }

  function handleSyncDialogCancel() {
    setShowSyncDialog(false);
    setSyncStrategy(null);
  }

  async function handleResetCloud() {
    if (!d1Config) return;

    setIsResetting(true);
    setSyncError(null);

    try {
      const provider = new D1Provider(d1Config);
      await provider.resetDatabase();
      setShowResetDialog(false);
      setConnectionStatus("success");
    } catch (error) {
      console.error("Reset failed:", error);
      setSyncError(error instanceof Error ? error.message : "Reset failed");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Cloud size={18} />
        <span className="font-medium">Cloudflare D1 Sync</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Account ID</label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Your Cloudflare account ID"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Database ID</label>
          <input
            type="text"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="Your D1 database ID"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">API Token</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Your Cloudflare API token"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={!canTest || connectionStatus === "testing"}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {connectionStatus === "testing" ? (
              <span className="flex items-center gap-1">
                <Loader2 size={14} className="animate-spin" />
                Testing...
              </span>
            ) : (
              "Test Connection"
            )}
          </button>

          {hasChanges && (
            <button
              onClick={handleSaveConfig}
              disabled={!canTest}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Save
            </button>
          )}

          {connectionStatus === "success" && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle size={14} />
              Connected
            </span>
          )}

          {connectionStatus === "failed" && (
            <span className="flex items-center gap-1 text-sm text-red-600">
              <XCircle size={14} />
              Failed
            </span>
          )}
        </div>

        {d1Config && connectionStatus === "success" && (
          <button
            onClick={() => setShowResetDialog(true)}
            className="text-xs text-red-600 hover:text-red-700 underline"
          >
            Reset cloud database
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-700">Enable Cloud Sync</span>
            {!d1Config && (
              <p className="text-xs text-gray-500">Save config first</p>
            )}
          </div>
          <Switch
            checked={cloudEnabled}
            onCheckedChange={handleToggleCloud}
          />
        </div>

        {isSyncing && (
          <div className="mt-2 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-gray-500" />
            <p className="text-xs text-gray-500">Syncing...</p>
          </div>
        )}

        {syncError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{syncError}</p>
          </div>
        )}

        {cloudEnabled && !isSyncing && queue.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-gray-500">
              {queue.length} pending operation{queue.length !== 1 && "s"} to sync
            </p>
            <button
              onClick={() => getStorageCoordinator().processQueue()}
              className="text-xs text-gray-600 hover:text-gray-900 underline"
            >
              Sync now
            </button>
          </div>
        )}
      </div>

      {showSyncDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Local Notes Detected
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              You have notes on this device. How would you like to handle them when enabling cloud sync?
            </p>

            <div className="space-y-2 mb-6">
              <label
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  syncStrategy === "merge"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="syncStrategy"
                  value="merge"
                  checked={syncStrategy === "merge"}
                  onChange={() => setSyncStrategy("merge")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-gray-900">Merge</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Keep local notes and sync them to the cloud. Cloud notes will also be downloaded.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  syncStrategy === "replace"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="syncStrategy"
                  value="replace"
                  checked={syncStrategy === "replace"}
                  onChange={() => setSyncStrategy("replace")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-gray-900">Replace local with cloud</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Delete all local notes and download only cloud notes. Local notes will be permanently lost.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSyncDialogCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSyncStrategyConfirm}
                disabled={!syncStrategy}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Reset Cloud Database
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              This will delete all notes in the cloud database and recreate the schema. This action cannot be undone.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetDialog(false)}
                disabled={isResetting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetCloud}
                disabled={isResetting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResetting ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Database"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
