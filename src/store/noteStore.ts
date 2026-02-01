import { create } from "zustand";
import {
  type Note,
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../lib/database";

interface NoteStore {
  notes: Note[];
  selectedNote: Note | null;
  title: string;
  content: string;
  loading: boolean;

  loadNotes: () => Promise<void>;
  createNote: () => Promise<void>;
  selectNote: (note: Note) => void;
  deleteNote: (id: number) => Promise<void>;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  saveNote: () => Promise<void>;
  togglePin: (note: Note) => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  selectedNote: null,
  title: "",
  content: "",
  loading: true,

  loadNotes: async () => {
    try {
      const allNotes = await getAllNotes();
      set({ notes: allNotes });
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      set({ loading: false });
    }
  },

  createNote: async () => {
    try {
      const note = await createNote({ title: "", content: "" });
      set((state) => {
        const pinnedNotes = state.notes.filter((n) => n.pinned);
        const unpinnedNotes = state.notes.filter((n) => !n.pinned);
        return {
          notes: [...pinnedNotes, note, ...unpinnedNotes],
          selectedNote: note,
          title: "",
          content: "",
        };
      });
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

  deleteNote: async (id: number) => {
    try {
      await deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        title: state.selectedNote?.id === id ? "" : state.title,
        content: state.selectedNote?.id === id ? "" : state.content,
      }));
    } catch (err) {
      console.error("Failed to delete note:", err);
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
      const updated = await updateNote(selectedNote.id, { title, content });
      set((state) => ({
        notes: [updated, ...state.notes.filter((n) => n.id !== updated.id)],
        selectedNote: updated,
      }));
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  },

  togglePin: async (note: Note) => {
    try {
      const updated = await updateNote(note.id, { pinned: note.pinned ? 0 : 1 });
      set((state) => {
        const otherNotes = state.notes.filter((n) => n.id !== updated.id);
        const pinnedNotes = otherNotes.filter((n) => n.pinned);
        const unpinnedNotes = otherNotes.filter((n) => !n.pinned);
        const newNotes = updated.pinned
          ? [updated, ...pinnedNotes, ...unpinnedNotes]
          : [...pinnedNotes, updated, ...unpinnedNotes];
        return {
          notes: newNotes,
          selectedNote: state.selectedNote?.id === updated.id ? updated : state.selectedNote,
        };
      });
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  },
}));
