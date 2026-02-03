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
  const starred = useNoteStore((state) => state.starred);
  const trash = useNoteStore((state) => state.trash);
  const view = useNoteStore((state) => state.view);
  const setView = useNoteStore((state) => state.setView);
  const loadStarred = useNoteStore((state) => state.loadStarred);
  const loadTrash = useNoteStore((state) => state.loadTrash);
  const sortBy = useSettingsStore((state) => state.sortBy);

  const [searchQuery, setSearchQuery] = useState("");
  const sidebarRef = useRef<HTMLElement>(null);

  const displayedNotes =
    view === "notes" ? notes : view === "starred" ? starred : trash;

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
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  function handleViewChange(newView: "notes" | "starred" | "trash") {
    if (newView === "starred") {
      loadStarred();
    } else if (newView === "trash") {
      loadTrash();
    }
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
