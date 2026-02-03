// Re-export types from storage
export type {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
} from "./storage/types";

// Re-export functions using SQLiteProvider for backward compatibility
import { getSQLiteProvider } from "./storage/sqlite";
import type { CreateNoteInput, UpdateNoteInput, Note } from "./storage/types";

const provider = getSQLiteProvider();

export async function getAllNotes(): Promise<Note[]> {
  return provider.getAllNotes();
}

export async function getDeletedNotes(): Promise<Note[]> {
  return provider.getDeletedNotes();
}

export async function getStarredNotes(): Promise<Note[]> {
  return provider.getStarredNotes();
}

export async function getNoteById(id: string): Promise<Note | null> {
  return provider.getNoteById(id);
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  return provider.createNote(input);
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput
): Promise<Note> {
  return provider.updateNote(id, input);
}

export async function deleteNote(id: string): Promise<void> {
  return provider.deleteNote(id);
}

export async function restoreNote(id: string): Promise<Note> {
  return provider.restoreNote(id);
}

export async function permanentlyDeleteNote(id: string): Promise<void> {
  return provider.permanentlyDeleteNote(id);
}
