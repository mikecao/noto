# Noto

A simple notes app built with Tauri, React, and TypeScript.

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

## License

MIT
