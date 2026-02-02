import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QueuedOperation } from "../lib/storage/types";

interface SyncStore {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  error: string | null;
  queue: QueuedOperation[];

  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (timestamp: number) => void;
  setError: (error: string | null) => void;
  enqueue: (operation: QueuedOperation) => void;
  dequeue: (id: string) => void;
  clearQueue: () => void;
  updateRetryCount: (id: string) => void;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      isSyncing: false,
      lastSyncAt: null,
      error: null,
      queue: [],

      setOnline: (isOnline) => set({ isOnline }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastSync: (lastSyncAt) => set({ lastSyncAt }),
      setError: (error) => set({ error }),

      enqueue: (operation) =>
        set((state) => ({
          queue: [...state.queue, operation],
        })),

      dequeue: (id) =>
        set((state) => ({
          queue: state.queue.filter((op) => op.id !== id),
        })),

      clearQueue: () => set({ queue: [] }),

      updateRetryCount: (id) =>
        set((state) => ({
          queue: state.queue.map((op) =>
            op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
          ),
        })),
    }),
    {
      name: "noto-sync",
      partialize: (state) => ({
        queue: state.queue,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
