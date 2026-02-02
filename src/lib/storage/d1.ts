import { fetch } from "@tauri-apps/plugin-http";
import type {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  StorageProvider,
  D1Config,
  D1Response,
} from "./types";

export class D1Provider implements StorageProvider {
  constructor(private config: D1Config) {}

  private async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/d1/database/${this.config.databaseId}/query`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`D1 API error: ${response.status} - ${text}`);
    }

    const data: D1Response<T> = await response.json();

    if (!data.success) {
      const errorMsg = data.errors?.map((e) => e.message).join(", ") || "Unknown error";
      throw new Error(`D1 query failed: ${errorMsg}`);
    }

    return data.result[0]?.results ?? [];
  }

  private async execute(sql: string, params: unknown[] = []): Promise<{ lastInsertId?: number; changes: number }> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/d1/database/${this.config.databaseId}/query`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`D1 API error: ${response.status} - ${text}`);
    }

    const data: D1Response<unknown> = await response.json();

    if (!data.success) {
      const errorMsg = data.errors?.map((e) => e.message).join(", ") || "Unknown error";
      throw new Error(`D1 execute failed: ${errorMsg}`);
    }

    const meta = data.result[0]?.meta;
    return {
      lastInsertId: meta?.last_row_id,
      changes: meta?.changes ?? 0,
    };
  }

  async getAllNotes(): Promise<Note[]> {
    return this.query<Note>(
      "SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC"
    );
  }

  async getDeletedNotes(): Promise<Note[]> {
    return this.query<Note>(
      "SELECT * FROM notes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
  }

  async getStarredNotes(): Promise<Note[]> {
    return this.query<Note>(
      "SELECT * FROM notes WHERE starred = 1 AND deleted_at IS NULL ORDER BY updated_at DESC"
    );
  }

  async getNoteById(id: number): Promise<Note | null> {
    const results = await this.query<Note>(
      "SELECT * FROM notes WHERE id = ?1",
      [id]
    );
    return results[0] ?? null;
  }

  async createNote(input: CreateNoteInput): Promise<Note> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.execute(
      "INSERT INTO notes (title, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
      [input.title, input.content, now, now]
    );
    if (result.lastInsertId === undefined) {
      throw new Error("Failed to get insert ID from D1");
    }
    const note = await this.getNoteById(result.lastInsertId);
    if (!note) throw new Error("Failed to create note in D1");
    return note;
  }

  async updateNote(id: number, input: UpdateNoteInput): Promise<Note> {
    const now = Math.floor(Date.now() / 1000);
    const existing = await this.getNoteById(id);
    if (!existing) throw new Error("Note not found in D1");

    const title = input.title ?? existing.title;
    const content = input.content ?? existing.content;
    const starred = input.starred ?? existing.starred;

    await this.execute(
      "UPDATE notes SET title = ?1, content = ?2, starred = ?3, updated_at = ?4 WHERE id = ?5",
      [title, content, starred, now, id]
    );

    const updated = await this.getNoteById(id);
    if (!updated) throw new Error("Failed to update note in D1");
    return updated;
  }

  async deleteNote(id: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.execute("UPDATE notes SET deleted_at = ?1 WHERE id = ?2", [
      now,
      id,
    ]);
  }

  async restoreNote(id: number): Promise<Note> {
    await this.execute("UPDATE notes SET deleted_at = NULL WHERE id = ?1", [
      id,
    ]);
    const note = await this.getNoteById(id);
    if (!note) throw new Error("Failed to restore note in D1");
    return note;
  }

  async permanentlyDeleteNote(id: number): Promise<void> {
    await this.execute("DELETE FROM notes WHERE id = ?1", [id]);
  }

  async upsertNote(note: Note): Promise<Note> {
    await this.execute(
      `INSERT INTO notes (id, title, content, starred, created_at, updated_at, deleted_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         content = excluded.content,
         starred = excluded.starred,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at`,
      [
        note.id,
        note.title,
        note.content,
        note.starred,
        note.created_at,
        note.updated_at,
        note.deleted_at,
      ]
    );
    const upserted = await this.getNoteById(note.id);
    if (!upserted) throw new Error("Failed to upsert note in D1");
    return upserted;
  }

  async getAllNotesIncludingDeleted(): Promise<Note[]> {
    return this.query<Note>("SELECT * FROM notes ORDER BY updated_at DESC");
  }

  // Test connection by running a simple query
  async testConnection(): Promise<boolean> {
    try {
      await this.query<{ count: number }>("SELECT COUNT(*) as count FROM notes");
      return true;
    } catch {
      return false;
    }
  }
}
