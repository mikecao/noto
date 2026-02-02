import { useEffect, useRef, useState } from "react";
import { useNoteStore } from "../store/noteStore";
import { NoteMenu } from "./NoteMenu";
import { FindBar } from "./FindBar";

function findAllMatches(content: string, term: string): number[] {
  if (!term) return [];
  const indices: number[] = [];
  const lowerContent = content.toLowerCase();
  const lowerTerm = term.toLowerCase();
  let index = 0;
  while ((index = lowerContent.indexOf(lowerTerm, index)) !== -1) {
    indices.push(index);
    index += 1;
  }
  return indices;
}

export function NoteEditor() {
  const selectedNote = useNoteStore((state) => state.selectedNote);
  const view = useNoteStore((state) => state.view);
  const title = useNoteStore((state) => state.title);
  const content = useNoteStore((state) => state.content);
  const setTitle = useNoteStore((state) => state.setTitle);
  const setContent = useNoteStore((state) => state.setContent);
  const saveNote = useNoteStore((state) => state.saveNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const togglePin = useNoteStore((state) => state.togglePin);
  const toggleStar = useNoteStore((state) => state.toggleStar);
  const restoreNote = useNoteStore((state) => state.restoreNote);
  const permanentlyDeleteNote = useNoteStore(
    (state) => state.permanentlyDeleteNote
  );

  const isTrash = view === "trash";

  const saveTimeoutRef = useRef<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [findOpen, setFindOpen] = useState(false);
  const [findTerm, setFindTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedNote && !selectedNote.title && !selectedNote.content) {
      titleInputRef.current?.focus();
    }
  }, [selectedNote]);

  // Keyboard shortcut for find
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setFindOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Recalculate matches when search term or content changes
  useEffect(() => {
    const newMatches = findAllMatches(content, findTerm);
    setMatches(newMatches);
    setCurrentMatchIndex(0);
  }, [findTerm, content]);

  function highlightMatch(index: number) {
    if (matches.length === 0 || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = matches[index];
    const end = start + findTerm.length;

    // Set selection and focus
    textarea.focus();
    textarea.setSelectionRange(start, end);

    // Calculate scroll position to show the match
    const textBeforeMatch = content.substring(0, start);
    const lineNumber = textBeforeMatch.split("\n").length - 1;
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight =
      parseFloat(computedStyle.lineHeight) ||
      parseFloat(computedStyle.fontSize) * 1.2 ||
      20;

    // Scroll to center the match in the visible area
    const scrollTarget =
      lineNumber * lineHeight - textarea.clientHeight / 2 + lineHeight;
    textarea.scrollTop = Math.max(0, scrollTarget);
  }

  // Reset find state when note changes
  useEffect(() => {
    setFindOpen(false);
    setFindTerm("");
    setMatches([]);
    setCurrentMatchIndex(0);
  }, [selectedNote?.id]);

  function goToNextMatch() {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    highlightMatch(nextIndex);
  }

  function goToPreviousMatch() {
    if (matches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIndex);
    highlightMatch(prevIndex);
  }

  function closeFindBar() {
    setFindOpen(false);
    setFindTerm("");
    setMatches([]);
    setCurrentMatchIndex(0);
    textareaRef.current?.focus();
  }

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    debouncedSave();
  }

  function handleContentChange(newContent: string) {
    setContent(newContent);
    debouncedSave();
  }

  function debouncedSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNote();
    }, 500);
  }

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">
          {isTrash ? "Select a note to restore or delete" : "Select a note or create a new one"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 flex items-center justify-between">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={isTrash}
          className="flex-1 text-2xl font-bold bg-transparent outline-none text-gray-900"
        />
        <NoteMenu
          isTrash={isTrash}
          isPinned={!!selectedNote.pinned}
          isStarred={!!selectedNote.starred}
          onTogglePin={() => togglePin(selectedNote)}
          onToggleStar={() => toggleStar(selectedNote)}
          onDelete={() => deleteNote(selectedNote.id)}
          onRestore={() => restoreNote(selectedNote.id)}
          onPermanentDelete={() => permanentlyDeleteNote(selectedNote.id)}
        />
      </div>
      {findOpen && (
        <FindBar
          searchTerm={findTerm}
          onSearchChange={setFindTerm}
          currentMatch={matches.length > 0 ? currentMatchIndex + 1 : 0}
          totalMatches={matches.length}
          onNext={goToNextMatch}
          onPrevious={goToPreviousMatch}
          onClose={closeFindBar}
        />
      )}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start writing..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        readOnly={isTrash}
        className="flex-1 p-4 resize-none outline-none text-gray-700 overflow-y-auto"
      />
    </>
  );
}
