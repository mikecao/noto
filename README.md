# Noto

A simple notes app built with Tauri, React, and TypeScript.

## Features

- Create, edit, and delete notes
- Search notes by title or content
- Find within note content (Ctrl/Cmd+F)
- Star notes for quick access
- Auto-save as you type
- Local SQLite database storage
- Optional cloud sync with Cloudflare D1

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Desktop**: Tauri 2
- **Database**: SQLite (local), Cloudflare D1 (cloud)
- **Linting/Formatting**: Biome

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm tauri dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm tauri dev` | Run Tauri app in development |
| `pnpm tauri build` | Build Tauri app for distribution |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |

## Data Storage

Notes are stored in a local SQLite database at:

- **macOS**: `~/Library/Application Support/com.mikecao.noto/noto.db`
- **Windows**: `%APPDATA%\com.mikecao.noto\noto.db`
- **Linux**: `~/.local/share/com.mikecao.noto/noto.db`

## Cloud Sync (Optional)

Noto supports syncing notes to Cloudflare D1 for cross-device access.

### Setup

1. Create a D1 database in your [Cloudflare dashboard](https://dash.cloudflare.com/)
2. Create an API token with D1 read/write permissions
3. Open Settings in Noto and enter your Account ID, Database ID, and API Token
4. Click "Test Connection" then "Save"
5. Enable cloud sync

The database schema is created automatically when you first connect.

### Sync Behavior

- **Local-first**: Changes are saved locally immediately for fast, responsive UI
- **Background sync**: Changes are pushed to the cloud asynchronously
- **Offline support**: Operations are queued when offline and synced when back online
- **Merge strategy**: When enabling sync with existing local notes, you can choose to merge with cloud or replace local with cloud data

## License

MIT
