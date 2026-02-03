# Noto - Project Instructions for Claude

## Overview

Noto is a simple notes app built with Tauri, React, and TypeScript.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Icons**: Lucide React
- **Desktop**: Tauri 2
- **Database**: SQLite (local via Tauri), Cloudflare D1 (cloud sync)
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
│   ├── settings/
│   │   └── CloudSettings.tsx  # D1 cloud sync configuration
│   ├── FindBar.tsx            # In-content search bar (Ctrl/Cmd+F)
│   ├── NoteEditor.tsx         # Main editor with title input and textarea
│   ├── NotePreview.tsx        # Note list item in sidebar
│   ├── Sidebar.tsx            # Note list with search and filtering
│   └── SyncStatus.tsx         # Cloud sync status indicator
├── lib/
│   ├── storage/
│   │   ├── types.ts           # Note, StorageProvider, D1Config interfaces
│   │   ├── sqlite.ts          # SQLiteProvider (local storage)
│   │   ├── d1.ts              # D1Provider (Cloudflare cloud storage)
│   │   └── coordinator.ts     # StorageCoordinator (routes local/cloud)
│   └── database.ts            # Re-exports for backward compatibility
├── store/
│   ├── noteStore.ts           # Notes state management
│   ├── settingsStore.ts       # App settings (cloud config, theme)
│   └── syncStore.ts           # Sync status and offline queue
├── App.tsx                    # Root layout component
├── main.tsx                   # Entry point
└── index.css                  # Tailwind CSS imports
```

## Key Features

- **Notes**: Create, edit, delete notes with auto-save (500ms debounce)
- **Search**: Filter notes by title/content in sidebar
- **Find in content**: Ctrl/Cmd+F opens FindBar for in-note search
- **Star**: Mark notes for quick access in starred view
- **Trash**: Soft delete with restore/permanent delete
- **Cloud Sync**: Optional Cloudflare D1 sync for cross-device access

## Storage Architecture

The app uses a local-first architecture with optional cloud sync:

- **StorageCoordinator**: Routes operations between local SQLite and cloud D1
- **SQLiteProvider**: Handles all local database operations
- **D1Provider**: Handles Cloudflare D1 REST API calls
- **Offline Queue**: Operations are queued when offline and synced when back online

Note IDs are UUIDs to prevent conflicts when syncing between devices.

## State Management

Zustand stores:

**noteStore.ts**:
- `notes[]`, `starred[]`, `trash[]` - Note collections
- `view` - Current view (notes/starred/trash)
- `selectedNote` - Currently selected note
- `title`, `content` - Editor state for selected note

**settingsStore.ts**:
- `cloudEnabled` - Whether cloud sync is active
- `d1Config` - Cloudflare D1 credentials (accountId, databaseId, apiToken)
- `connectionStatus` - D1 connection test result

**syncStore.ts**:
- `isOnline` - Network status
- `isSyncing` - Currently syncing to cloud
- `queue[]` - Pending operations for offline sync
- `lastSync` - Timestamp of last successful sync

## Styling Conventions

- Use Tailwind CSS classes
- Gray color palette: gray-100 for backgrounds, gray-500 for secondary text
- Rounded corners: rounded-lg for inputs, rounded for buttons
- Icons: 16px size for UI elements, Lucide React components
