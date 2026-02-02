import { useState } from "react";
import { Cloud, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { useSyncStore } from "../store/syncStore";
import { D1Provider } from "../lib/storage/d1";
import { getStorageCoordinator } from "../lib/storage/coordinator";
import { Switch } from "./ui/switch";

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

  const [accountId, setAccountId] = useState(d1Config?.accountId ?? "");
  const [databaseId, setDatabaseId] = useState(d1Config?.databaseId ?? "");
  const [apiToken, setApiToken] = useState(d1Config?.apiToken ?? "");

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
    setCloudEnabled(enabled);
    if (enabled) {
      const coordinator = getStorageCoordinator();
      // Process any pending operations first, then sync from cloud
      await coordinator.processQueue();
      await coordinator.syncFromCloud();
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

        {cloudEnabled && queue.length > 0 && (
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
    </div>
  );
}
