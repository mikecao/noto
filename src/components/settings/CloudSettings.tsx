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
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [testPassed, setTestPassed] = useState(false);

  const canTest = accountId && databaseId && apiToken;
  const isConnected = cloudEnabled && d1Config && connectionStatus === "success";

  async function handleTestConnection() {
    if (!canTest) return;

    setConnectionStatus("testing");
    setTestPassed(false);

    try {
      const testProvider = new D1Provider({
        accountId,
        databaseId,
        apiToken,
      });
      const success = await testProvider.testConnection();
      setConnectionStatus(success ? "success" : "failed");
      setTestPassed(success);
    } catch {
      setConnectionStatus("failed");
      setTestPassed(false);
    }
  }

  async function handleToggleCloud(enabled: boolean) {
    if (enabled) {
      // Just enable to show config section
      setCloudEnabled(true);

      // If already has valid config, check for local notes
      if (!d1Config || connectionStatus !== "success") {
        return;
      }

      // Already configured, start syncing
      const coordinator = getStorageCoordinator();
      const hasLocal = await coordinator.hasLocalNotes();

      if (hasLocal) {
        setShowSyncDialog(true);
        return;
      }

      // No local notes, just enable and sync from cloud
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

  async function handleConnect() {
    if (!testPassed) return;

    // Save config first
    setD1Config({
      accountId,
      databaseId,
      apiToken,
    });
    getStorageCoordinator().resetD1();

    const coordinator = getStorageCoordinator();
    const hasLocal = await coordinator.hasLocalNotes();

    if (hasLocal) {
      setShowSyncDialog(true);
      return;
    }

    // No local notes, just sync from cloud
    setIsSyncing(true);
    setSyncError(null);

    try {
      await coordinator.initializeCloud();
      await coordinator.syncFromCloud();
      await loadNotes();
      setTestPassed(false); // Clear test state after successful connect
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncError(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncStrategyConfirm() {
    if (!syncStrategy) return;

    const coordinator = getStorageCoordinator();
    setShowSyncDialog(false);
    setIsSyncing(true);
    setSyncError(null);

    try {
      await coordinator.initializeCloud();

      if (syncStrategy === "merge") {
        await coordinator.pushLocalToCloud();
        await coordinator.syncFromCloud();
      } else {
        await coordinator.replaceLocalWithCloud();
      }

      await loadNotes();
      setTestPassed(false); // Clear test state after successful connect
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncError(error instanceof Error ? error.message : "Sync failed");
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

  function handleDisconnect() {
    setD1Config(null);
    setCloudEnabled(false);
    setConnectionStatus("untested");
    setTestPassed(false);
    setAccountId("");
    setDatabaseId("");
    setApiToken("");
    getStorageCoordinator().resetD1();
    setShowDisconnectDialog(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Cloud size={18} />
          <span className="font-medium">Cloud Sync</span>
        </div>
        <Switch
          checked={cloudEnabled}
          onCheckedChange={handleToggleCloud}
        />
      </div>

      {cloudEnabled && (
        <div className="space-y-3">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle size={14} />
                <span>Connected to Cloudflare D1</span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Account ID: </span>
                  <span className="text-gray-700">{d1Config?.accountId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Database ID: </span>
                  <span className="text-gray-700">{d1Config?.databaseId}</span>
                </div>
                <div>
                  <span className="text-gray-500">API Token: </span>
                  <span className="text-gray-700">••••••••</span>
                </div>
              </div>

              {isSyncing && (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-gray-500" />
                  <p className="text-xs text-gray-500">Syncing...</p>
                </div>
              )}

              {syncError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{syncError}</p>
                </div>
              )}

              {!isSyncing && queue.length > 0 && (
                <div className="flex items-center gap-2">
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

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="px-3 py-1.5 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Reset cloud database
                </button>
                <button
                  onClick={() => setShowDisconnectDialog(true)}
                  className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Connect to Cloudflare D1 to sync notes across devices.
              </p>

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

                {connectionStatus === "success" && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle size={14} />
                    Valid
                  </span>
                )}

                {testPassed && !isSyncing && (
                  <button
                    onClick={handleConnect}
                    className="px-3 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Connect
                  </button>
                )}

                {connectionStatus === "failed" && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle size={14} />
                    Failed
                  </span>
                )}
              </div>

              {isSyncing && (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-gray-500" />
                  <p className="text-xs text-gray-500">Connecting...</p>
                </div>
              )}

              {syncError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{syncError}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

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

      {showDisconnectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Cloud size={20} className="text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Disconnect Cloud Sync
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              This will remove your cloud credentials and disable syncing. Your local notes will remain on this device.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDisconnectDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
