# Noto

A simple notes app built with Tauri, React, and TypeScript.

## Features

- Create, edit, and delete notes
- Search notes by title or content
- Pin notes to keep them at the top
- Auto-save as you type
- Local SQLite database storage

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Desktop**: Tauri 2
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

## License

MIT
