# Chops

A desktop app for musicians to track practice sessions and build skills over time.

![Chops Screenshot](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Practice Queue & Timers** - Build a session from your items; time the whole session and each item, and correct item times after the fact
- **Audio Recording** - Record yourself during practice and play takes back per item
- **Video Recording** - Record camera plus any audio input (e.g. a Loopback mix of your rig and backing track), with count-in, pause, and open-in-QuickTime for trimming
- **Metronome** - Pop-up metronome with tempo presets and keyboard control
- **Practice Notes** - Rich-text notes saved with each session
- **Items, Categories & Tags** - Organize your library, attach links and PDFs, archive what you're done with
- **To Do** - Park ideas to practice later, with notes, links and labels, and promote them to items; other tools can add to-dos through an inbox folder
- **Notes** - Free-form notes that save as you type: questions for your teacher, songs to learn, ideas
- **Templates** - Save a queue (warm-up, set list) and reload it in one click
- **History** - Every session with notes, item times and recordings; copy a session back into the queue
- **Statistics** - Totals, streaks, a 30-day calendar, and time by category, item and tag
- **Session Persistence** - Close the app mid-session and pick up where you left off
- **Your Data, Your Folder** - Plain JSON in a folder you choose (synced folders work), with backup/restore; deleted recordings go to the Trash
- **Color Themes** - Six musician-inspired themes plus light and dark mode

See the **[User Guide](docs/USER-GUIDE.md)** for how everything works, or press **?** in the app.

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

# Build for production (signed, not notarized)
npm run tauri:build

# Build, sign, notarize and staple for macOS
npm run release:mac
```

### macOS notarization

`npm run release:mac` notarizes with a `notarytool` Keychain profile, so no credentials live in the repo. Create it once (Apple prompts for an [app-specific password](https://account.apple.com)):

```bash
xcrun notarytool store-credentials chops-notary --apple-id <your Apple ID> --team-id A52FG8L4Z8
```

Pushing a `v*` tag (for example `v0.6.0`) runs the GitHub Actions workflow in `.github/workflows/build.yml`, which builds, signs and notarizes release installers for every platform using the repository's secrets.

### Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Vite
- **Backend**: Tauri 2 (Rust)
- **Storage**: A JSON data file in a user-selected folder; videos in a user-chosen video folder; audio recordings in the app's data folder

## License

MIT
