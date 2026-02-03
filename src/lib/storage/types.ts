// Note interface - matches SQLite schema
export interface Note {
  id: string;
  title: string;
  content: string;
  starred: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export type CreateNoteInput = Pick<Note, "title" | "content">;
export type UpdateNoteInput = Partial<Pick<Note, "title" | "content" | "starred">>;

// Storage provider interface - both SQLite and D1 implement this
export interface StorageProvider {
  getAllNotes(): Promise<Note[]>;
  getDeletedNotes(): Promise<Note[]>;
  getStarredNotes(): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | null>;
  createNote(input: CreateNoteInput): Promise<Note>;
  updateNote(id: string, input: UpdateNoteInput): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  restoreNote(id: string): Promise<Note>;
  permanentlyDeleteNote(id: string): Promise<void>;
  // For sync operations
  upsertNote(note: Note): Promise<Note>;
  getAllNotesIncludingDeleted(): Promise<Note[]>;
}

// D1 configuration stored in settings
export interface D1Config {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

// Offline operation queue item
export interface QueuedOperation {
  id: string;
  type: "create" | "update" | "delete" | "restore" | "permanentDelete";
  noteId: string;
  payload?: CreateNoteInput | UpdateNoteInput;
  timestamp: number;
  retryCount: number;
}

// D1 API response types
export interface D1QueryResult<T> {
  results: T[];
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}

export interface D1Response<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: D1QueryResult<T>[];
}
