import { useState, useRef } from "react";
import { useNoteStore } from "../store/noteStore";
import { useSettingsStore } from "../store/settingsStore";
import { SyncStatus } from "./SyncStatus";
import { SidebarNav } from "./sidebar/SidebarNav";
import { SearchInput } from "./sidebar/SearchInput";
import { SortMenu } from "./sidebar/SortMenu";
import { NoteList } from "./sidebar/NoteList";

export function Sidebar() {
  const notes = useNoteStore((state) => state.notes);
  const view = useNoteStore((state) => state.view);
  const setView = useNoteStore((state) => state.setView);
  const sortBy = useSettingsStore((state) => state.sortBy);

  const [searchQuery, setSearchQuery] = useState("");
  const sidebarRef = useRef<HTMLElement>(null);

  // Filter notes based on current view
  const displayedNotes = notes.filter((note) => {
    if (view === "trash") return note.deleted_at !== null;
    if (view === "starred") return note.starred && !note.deleted_at;
    return !note.deleted_at; // "notes" view
  });

  const filteredNotes = displayedNotes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "created") {
        return b.created_at - a.created_at;
      }
      return b.updated_at - a.updated_at;
    });

  function handleViewChange(newView: "notes" | "starred" | "trash") {
    setView(newView);
    setSearchQuery("");
  }

  return (
    <aside ref={sidebarRef} className="w-96 bg-white flex flex-col">
      <div className="p-3 flex flex-col gap-3 max-h-screen">
        <SidebarNav onViewChange={handleViewChange} />
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center gap-2 pl-1 text-sm">
            <span>{filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}</span>
            <SyncStatus />
          </div>
          <SortMenu />
        </div>
        <nav className="flex-1 overflow-y-auto">
          <NoteList
            notes={filteredNotes}
            searchQuery={searchQuery}
            sidebarRef={sidebarRef}
          />
        </nav>
      </div>
    </aside>
  );
}
