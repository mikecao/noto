import type {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  StorageProvider,
  QueuedOperation,
} from "./types";
import { SQLiteProvider, getSQLiteProvider } from "./sqlite";
import { D1Provider } from "./d1";
import { useSettingsStore } from "../../store/settingsStore";
import { useSyncStore } from "../../store/syncStore";

function generateId(): string {
  return crypto.randomUUID();
}

function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export class StorageCoordinator implements StorageProvider {
  private sqlite: SQLiteProvider;
  private d1: D1Provider | null = null;
  private initialized = false;

  constructor() {
    this.sqlite = getSQLiteProvider();
  }

  private getD1(): D1Provider | null {
    const { cloudEnabled, d1Config } = useSettingsStore.getState();
    if (cloudEnabled && d1Config) {
      if (!this.d1) {
        this.d1 = new D1Provider(d1Config);
      }
      return this.d1;
    }
    return null;
  }

  private enqueue(operation: Omit<QueuedOperation, "id" | "timestamp" | "retryCount">) {
    useSyncStore.getState().enqueue({
      ...operation,
      id: generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    } as QueuedOperation);
  }

  // Initialize network listeners
  init() {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        useSyncStore.getState().setOnline(true);
        this.processQueue();
      });

      window.addEventListener("offline", () => {
        useSyncStore.getState().setOnline(false);
      });
    }
  }

  // Process queued operations when back online
  async processQueue(): Promise<void> {
    const d1 = this.getD1();
    if (!d1 || !isOnline()) return;

    const { queue, dequeue, setSyncing, setError, setLastSync, updateRetryCount } =
      useSyncStore.getState();

    if (queue.length === 0) return;

    setSyncing(true);

    for (const operation of queue) {
      try {
        switch (operation.type) {
          case "create": {
            const localNote = await this.sqlite.getNoteById(operation.noteId);
            if (localNote) {
              await d1.upsertNote(localNote);
            }
            break;
          }
          case "update": {
            const note = await this.sqlite.getNoteById(operation.noteId);
            if (note) {
              await d1.upsertNote(note);
            }
            break;
          }
          case "delete": {
            await d1.deleteNote(operation.noteId);
            break;
          }
          case "restore": {
            await d1.restoreNote(operation.noteId);
            break;
          }
          case "permanentDelete": {
            await d1.permanentlyDeleteNote(operation.noteId);
            break;
          }
        }
        dequeue(operation.id);
      } catch (error) {
        console.error("Failed to sync operation:", operation, error);
        if (operation.retryCount >= 5) {
          setError(`Failed to sync after 5 retries: ${operation.type}`);
          dequeue(operation.id); // Remove failed operation
        } else {
          updateRetryCount(operation.id);
        }
      }
    }

    setLastSync(Date.now());
    setSyncing(false);
  }

  // Sync all notes from cloud to local
  async syncFromCloud(): Promise<void> {
    const d1 = this.getD1();
    if (!d1 || !isOnline()) return;

    const { setSyncing, setError, setLastSync } = useSyncStore.getState();
    setSyncing(true);

    try {
      const cloudNotes = await d1.getAllNotesIncludingDeleted();
      const localNotes = await this.sqlite.getAllNotesIncludingDeleted();
      const localMap = new Map(localNotes.map((n) => [n.id, n]));

      for (const cloudNote of cloudNotes) {
        const localNote = localMap.get(cloudNote.id);
        if (!localNote || cloudNote.updated_at > localNote.updated_at) {
          await this.sqlite.upsertNote(cloudNote);
        }
      }

      setLastSync(Date.now());
      setError(null);
    } catch (error) {
      console.error("Failed to sync from cloud:", error);
      setError("Failed to sync from cloud");
    } finally {
      setSyncing(false);
    }
  }

  // StorageProvider implementation

  async getAllNotes(): Promise<Note[]> {
    const d1 = this.getD1();

    if (d1 && isOnline()) {
      try {
        const notes = await d1.getAllNotes();
        // Cache locally
        for (const note of notes) {
          await this.sqlite.upsertNote(note);
        }
        return notes;
      } catch (error) {
        console.error("D1 getAllNotes failed, using local:", error);
      }
    }

    return this.sqlite.getAllNotes();
  }

  async getDeletedNotes(): Promise<Note[]> {
    const d1 = this.getD1();

    if (d1 && isOnline()) {
      try {
        return await d1.getDeletedNotes();
      } catch (error) {
        console.error("D1 getDeletedNotes failed, using local:", error);
      }
    }

    return this.sqlite.getDeletedNotes();
  }

  async getStarredNotes(): Promise<Note[]> {
    const d1 = this.getD1();

    if (d1 && isOnline()) {
      try {
        return await d1.getStarredNotes();
      } catch (error) {
        console.error("D1 getStarredNotes failed, using local:", error);
      }
    }

    return this.sqlite.getStarredNotes();
  }

  async getNoteById(id: number): Promise<Note | null> {
    const d1 = this.getD1();

    if (d1 && isOnline()) {
      try {
        return await d1.getNoteById(id);
      } catch (error) {
        console.error("D1 getNoteById failed, using local:", error);
      }
    }

    return this.sqlite.getNoteById(id);
  }

  async createNote(input: CreateNoteInput): Promise<Note> {
    // Local-first: write to SQLite immediately for responsive UI
    const note = await this.sqlite.createNote(input);

    // Queue cloud sync (non-blocking)
    if (this.getD1()) {
      this.enqueue({ type: "create", noteId: note.id });
      this.processQueue(); // Fire and forget
    }
    return note;
  }

  async updateNote(id: number, input: UpdateNoteInput): Promise<Note> {
    // Local-first: write to SQLite immediately for responsive UI
    const note = await this.sqlite.updateNote(id, input);

    // Queue cloud sync (non-blocking)
    if (this.getD1()) {
      this.enqueue({ type: "update", noteId: id, payload: input });
      this.processQueue(); // Fire and forget
    }
    return note;
  }

  async deleteNote(id: number): Promise<void> {
    // Local-first: write to SQLite immediately for responsive UI
    await this.sqlite.deleteNote(id);

    // Queue cloud sync (non-blocking)
    if (this.getD1()) {
      this.enqueue({ type: "delete", noteId: id });
      this.processQueue(); // Fire and forget
    }
  }

  async restoreNote(id: number): Promise<Note> {
    // Local-first: write to SQLite immediately for responsive UI
    const note = await this.sqlite.restoreNote(id);

    // Queue cloud sync (non-blocking)
    if (this.getD1()) {
      this.enqueue({ type: "restore", noteId: id });
      this.processQueue(); // Fire and forget
    }
    return note;
  }

  async permanentlyDeleteNote(id: number): Promise<void> {
    // Local-first: write to SQLite immediately for responsive UI
    await this.sqlite.permanentlyDeleteNote(id);

    // Queue cloud sync (non-blocking)
    if (this.getD1()) {
      this.enqueue({ type: "permanentDelete", noteId: id });
      this.processQueue(); // Fire and forget
    }
  }

  async upsertNote(note: Note): Promise<Note> {
    const d1 = this.getD1();

    if (d1 && isOnline()) {
      try {
        const upserted = await d1.upsertNote(note);
        await this.sqlite.upsertNote(upserted);
        return upserted;
      } catch (error) {
        console.error("D1 upsertNote failed, using local:", error);
      }
    }

    return this.sqlite.upsertNote(note);
  }

  async getAllNotesIncludingDeleted(): Promise<Note[]> {
    const d1 = this.getD1();

    if (d1 && isOnline()) {
      try {
        return await d1.getAllNotesIncludingDeleted();
      } catch (error) {
        console.error("D1 getAllNotesIncludingDeleted failed, using local:", error);
      }
    }

    return this.sqlite.getAllNotesIncludingDeleted();
  }

  // Reset D1 provider (called when config changes)
  resetD1(): void {
    this.d1 = null;
  }
}

// Singleton instance
let coordinator: StorageCoordinator | null = null;

export function getStorageCoordinator(): StorageCoordinator {
  if (!coordinator) {
    coordinator = new StorageCoordinator();
    coordinator.init();
  }
  return coordinator;
}
