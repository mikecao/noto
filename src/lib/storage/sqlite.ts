import Database from "@tauri-apps/plugin-sql";
import type {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  StorageProvider,
} from "./types";

export class SQLiteProvider implements StorageProvider {
  private db: Database | null = null;

  private async getDb(): Promise<Database> {
    if (!this.db) {
      this.db = await Database.load("sqlite:noto.db");
    }
    return this.db;
  }

  async getAllNotes(): Promise<Note[]> {
    const database = await this.getDb();
    return database.select<Note[]>(
      "SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC"
    );
  }

  async getDeletedNotes(): Promise<Note[]> {
    const database = await this.getDb();
    return database.select<Note[]>(
      "SELECT * FROM notes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
  }

  async getStarredNotes(): Promise<Note[]> {
    const database = await this.getDb();
    return database.select<Note[]>(
      "SELECT * FROM notes WHERE starred = 1 AND deleted_at IS NULL ORDER BY updated_at DESC"
    );
  }

  async getNoteById(id: number): Promise<Note | null> {
    const database = await this.getDb();
    const results = await database.select<Note[]>(
      "SELECT * FROM notes WHERE id = $1",
      [id]
    );
    return results[0] ?? null;
  }

  async createNote(input: CreateNoteInput): Promise<Note> {
    const database = await this.getDb();
    const now = Math.floor(Date.now() / 1000);
    const result = await database.execute(
      "INSERT INTO notes (title, content, created_at, updated_at) VALUES ($1, $2, $3, $4)",
      [input.title, input.content, now, now]
    );
    if (result.lastInsertId === undefined) {
      throw new Error("Failed to get insert ID");
    }
    const note = await this.getNoteById(result.lastInsertId);
    if (!note) throw new Error("Failed to create note");
    return note;
  }

  async updateNote(id: number, input: UpdateNoteInput): Promise<Note> {
    const database = await this.getDb();
    const now = Math.floor(Date.now() / 1000);
    const existing = await this.getNoteById(id);
    if (!existing) throw new Error("Note not found");

    const title = input.title ?? existing.title;
    const content = input.content ?? existing.content;
    const starred = input.starred ?? existing.starred;

    await database.execute(
      "UPDATE notes SET title = $1, content = $2, starred = $3, updated_at = $4 WHERE id = $5",
      [title, content, starred, now, id]
    );

    const updated = await this.getNoteById(id);
    if (!updated) throw new Error("Failed to update note");
    return updated;
  }

  async deleteNote(id: number): Promise<void> {
    const database = await this.getDb();
    const now = Math.floor(Date.now() / 1000);
    await database.execute("UPDATE notes SET deleted_at = $1 WHERE id = $2", [
      now,
      id,
    ]);
  }

  async restoreNote(id: number): Promise<Note> {
    const database = await this.getDb();
    await database.execute("UPDATE notes SET deleted_at = NULL WHERE id = $1", [
      id,
    ]);
    const note = await this.getNoteById(id);
    if (!note) throw new Error("Failed to restore note");
    return note;
  }

  async permanentlyDeleteNote(id: number): Promise<void> {
    const database = await this.getDb();
    await database.execute("DELETE FROM notes WHERE id = $1", [id]);
  }

  // Sync operations

  async upsertNote(note: Note): Promise<Note> {
    const database = await this.getDb();
    await database.execute(
      `INSERT INTO notes (id, title, content, pinned, starred, created_at, updated_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         content = excluded.content,
         pinned = excluded.pinned,
         starred = excluded.starred,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at`,
      [
        note.id,
        note.title,
        note.content,
        note.pinned,
        note.starred,
        note.created_at,
        note.updated_at,
        note.deleted_at,
      ]
    );
    const upserted = await this.getNoteById(note.id);
    if (!upserted) throw new Error("Failed to upsert note");
    return upserted;
  }

  async getAllNotesIncludingDeleted(): Promise<Note[]> {
    const database = await this.getDb();
    return database.select<Note[]>(
      "SELECT * FROM notes ORDER BY updated_at DESC"
    );
  }
}

// Singleton instance
let instance: SQLiteProvider | null = null;

export function getSQLiteProvider(): SQLiteProvider {
  if (!instance) {
    instance = new SQLiteProvider();
  }
  return instance;
}
