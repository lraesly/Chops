# Chops

A desktop app for musicians to track practice sessions and build skills over time.

![Chops Screenshot](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Practice Queue** - Build a session from your practice items and work through them
- **Session Timer** - Track total practice time and time per item
- **Practice History** - View past sessions and track your progress
- **Statistics** - See practice trends, streaks, and time breakdowns
- **30-Day Calendar** - Visual heatmap of your practice activity
- **Session Persistence** - Close the app mid-session and pick up where you left off
- **Categories & Tags** - Organize practice items (scales, repertoire, technique, etc.)
- **Color Themes** - Six musician-inspired themes (Purple Rain, Blue Note, Green Room, and more)
- **Data Portability** - Export/import your data, store in synced folders like Dropbox or iCloud

## Download

Get the latest release for your platform:

**[Download Chops](https://github.com/lraesly/Chops/releases/latest)**

- **macOS**: `.dmg` (Apple Silicon and Intel)
- **Windows**: `.msi` or `.exe`
- **Linux**: `.deb` or `.AppImage`

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/start/prerequisites/)

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Vite
- **Backend**: Tauri 2 (Rust)
- **Storage**: Local JSON files in user-selected directory

## License

MIT
