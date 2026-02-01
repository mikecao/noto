import Database from "@tauri-apps/plugin-sql";

export interface Note {
  id: number;
  title: string;
  content: string;
  pinned: number;
  created_at: number;
  updated_at: number;
}

export type CreateNoteInput = Pick<Note, "title" | "content">;
export type UpdateNoteInput = Partial<Pick<Note, "title" | "content" | "pinned">>;

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:noto.db");
  }
  return db;
}

export async function getAllNotes(): Promise<Note[]> {
  const database = await getDb();
  return database.select<Note[]>(
    "SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC"
  );
}

export async function getNoteById(id: number): Promise<Note | null> {
  const database = await getDb();
  const results = await database.select<Note[]>(
    "SELECT * FROM notes WHERE id = $1",
    [id]
  );
  return results[0] ?? null;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const database = await getDb();
  const now = Math.floor(Date.now() / 1000);
  const result = await database.execute(
    "INSERT INTO notes (title, content, created_at, updated_at) VALUES ($1, $2, $3, $4)",
    [input.title, input.content, now, now]
  );
  if (result.lastInsertId === undefined) {
    throw new Error("Failed to get insert ID");
  }
  const note = await getNoteById(result.lastInsertId);
  if (!note) throw new Error("Failed to create note");
  return note;
}

export async function updateNote(
  id: number,
  input: UpdateNoteInput
): Promise<Note> {
  const database = await getDb();
  const now = Math.floor(Date.now() / 1000);
  const existing = await getNoteById(id);
  if (!existing) throw new Error("Note not found");

  const title = input.title ?? existing.title;
  const content = input.content ?? existing.content;
  const pinned = input.pinned ?? existing.pinned;

  await database.execute(
    "UPDATE notes SET title = $1, content = $2, pinned = $3, updated_at = $4 WHERE id = $5",
    [title, content, pinned, now, id]
  );

  const updated = await getNoteById(id);
  if (!updated) throw new Error("Failed to update note");
  return updated;
}

export async function deleteNote(id: number): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM notes WHERE id = $1", [id]);
}
