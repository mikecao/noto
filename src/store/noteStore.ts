import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note } from "../lib/storage/types";
import { getStorageCoordinator } from "../lib/storage/coordinator";

type View = "notes" | "starred" | "trash";

interface NoteStore {
  notes: Note[];
  view: View;
  selectedNote: Note | null;
  title: string;
  content: string;
  loading: boolean;

  loadNotes: () => Promise<void>;
  setView: (view: View) => void;
  createNote: () => Promise<void>;
  selectNote: (note: Note) => void;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  saveNote: () => Promise<void>;
  toggleStar: (note: Note) => Promise<void>;
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
  notes: [],
  view: "notes",
  selectedNote: null,
  title: "",
  content: "",
  loading: true,

  loadNotes: async () => {
    try {
      const storage = getStorageCoordinator();
      const allNotes = await storage.getAllNotesIncludingDeleted();
      set({ notes: allNotes });
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      set({ loading: false });
    }
  },

  setView: (view: View) => {
    set({ view, selectedNote: null, title: "", content: "" });
  },

  createNote: async () => {
    try {
      const storage = getStorageCoordinator();
      const note = await storage.createNote({ title: "", content: "" });
      set((state) => ({
        notes: [note, ...state.notes],
        selectedNote: note,
        title: "",
        content: "",
      }));
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  },

  selectNote: (note: Note) => {
    set({
      selectedNote: note,
      title: note.title,
      content: note.content,
    });
  },

  deleteNote: async (id: string) => {
    try {
      const storage = getStorageCoordinator();
      await storage.deleteNote(id);
      // Re-fetch to get the updated note with deleted_at timestamp
      const updatedNote = await storage.getNoteById(id);
      set((state) => ({
        notes: updatedNote
          ? state.notes.map((n) => n.id === id ? updatedNote : n)
          : state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        title: state.selectedNote?.id === id ? "" : state.title,
        content: state.selectedNote?.id === id ? "" : state.content,
      }));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  },

  restoreNote: async (id: string) => {
    try {
      const storage = getStorageCoordinator();
      const restored = await storage.restoreNote(id);
      set((state) => ({
        notes: state.notes.map((n) => n.id === id ? restored : n),
        selectedNote: null,
        title: "",
        content: "",
      }));
    } catch (err) {
      console.error("Failed to restore note:", err);
    }
  },

  permanentlyDeleteNote: async (id: string) => {
    try {
      const storage = getStorageCoordinator();
      await storage.permanentlyDeleteNote(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        title: state.selectedNote?.id === id ? "" : state.title,
        content: state.selectedNote?.id === id ? "" : state.content,
      }));
    } catch (err) {
      console.error("Failed to permanently delete note:", err);
    }
  },

  setTitle: (title: string) => {
    set({ title });
  },

  setContent: (content: string) => {
    set({ content });
  },

  saveNote: async () => {
    const { selectedNote, title, content } = get();
    if (!selectedNote) return;

    try {
      const storage = getStorageCoordinator();
      const updated = await storage.updateNote(selectedNote.id, { title, content });
      set((state) => ({
        notes: state.notes.map((n) => n.id === updated.id ? updated : n),
        selectedNote: updated,
      }));
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  },

  toggleStar: async (note: Note) => {
    try {
      const storage = getStorageCoordinator();
      const updated = await storage.updateNote(note.id, { starred: note.starred ? 0 : 1 });
      set((state) => ({
        notes: state.notes.map((n) => n.id === updated.id ? updated : n),
        selectedNote: state.selectedNote?.id === updated.id ? updated : state.selectedNote,
      }));
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  },
    }),
    {
      name: "noto-notes",
      partialize: (state) => ({
        view: state.view,
        selectedNote: state.selectedNote,
        title: state.title,
        content: state.content,
      }),
    }
  )
);
