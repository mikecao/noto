# Noto - Project Instructions for Claude

## Overview

Noto is a simple notes app built with Tauri, React, and TypeScript.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Icons**: Lucide React
- **Desktop**: Tauri 2
- **Database**: SQLite (via Tauri)
- **Linting/Formatting**: Biome

## Commands

- `pnpm install` - Install dependencies
- `pnpm build` - Build for production (runs tsc && vite build)
- `pnpm tauri dev` - Run Tauri app in development
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome

Do not run `pnpm dev` - assume a dev server is already running.

## Project Structure

```
src/
├── components/
│   ├── FindBar.tsx      # In-content search bar (Ctrl/Cmd+F)
│   ├── NoteEditor.tsx   # Main editor with title input and textarea
│   ├── NoteMenu.tsx     # Dropdown menu for note actions
│   ├── NotePreview.tsx  # Note list item in sidebar
│   └── Sidebar.tsx      # Note list with search and filtering
├── lib/
│   └── database.ts      # SQLite database operations
├── store/
│   └── noteStore.ts     # Zustand state management
├── App.tsx              # Root layout component
├── main.tsx             # Entry point
└── index.css            # Tailwind CSS imports
```

## Key Features

- **Notes**: Create, edit, delete notes with auto-save (500ms debounce)
- **Search**: Filter notes by title/content in sidebar
- **Find in content**: Ctrl/Cmd+F opens FindBar for in-note search
- **Pin**: Keep notes at top of list
- **Star**: Mark notes for quick access in starred view
- **Trash**: Soft delete with restore/permanent delete

## State Management

Zustand store (`noteStore.ts`) manages:
- `notes[]`, `starred[]`, `trash[]` - Note collections
- `view` - Current view (notes/starred/trash)
- `selectedNote` - Currently selected note
- `title`, `content` - Editor state for selected note

## Styling Conventions

- Use Tailwind CSS classes
- Gray color palette: gray-100 for backgrounds, gray-500 for secondary text
- Rounded corners: rounded-lg for inputs, rounded for buttons
- Icons: 16px size for UI elements, Lucide React components
