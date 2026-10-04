# Mosaic RSS Reader

A desktop RSS reader with a customizable mosaic tile interface, built with Tauri and React.

## Prerequisites

Before setting up the project, you'll need to install:

### 1. Node.js
- Download from: https://nodejs.org/
- Install the LTS version (recommended)
- Verify installation: `node --version` and `npm --version`

### 2. Rust
- Install from: https://rustup.rs/
- On Windows, run: `winget install Rustlang.Rustup` or download the installer
- Verify installation: `rustc --version` and `cargo --version`

### 3. Tauri Prerequisites (Windows)
- Install Microsoft C++ Build Tools
- Install WebView2 (usually pre-installed on Windows 10/11)

## Quick Setup (After Prerequisites)

Once you have Node.js and Rust installed:

```bash
# Install Tauri CLI
npm install -g @tauri-apps/cli

# Initialize Tauri project with React
npm create tauri-app@latest . --template react-ts

# Install dependencies
npm install

# Start development server
npm run tauri dev
```

## Project Structure

```
mosaic-rss/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Main Tauri app
│   │   └── lib.rs      # RSS parsing logic
│   └── Cargo.toml      # Rust dependencies
├── src/                # React frontend
│   ├── components/     # UI components
│   │   ├── MosaicTile.tsx
│   │   ├── FeedManager.tsx
│   │   └── TileGrid.tsx
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # State management
│   └── App.tsx
├── public/             # Static assets
└── package.json        # Node.js dependencies
```

## Features Roadmap

- [x] Project setup
- [ ] RSS feed parsing (Rust backend)
- [ ] Mosaic tile system (React frontend)
- [ ] Drag & drop tile arrangement
- [ ] Feed subscription management
- [ ] Real-time feed updates
- [ ] Desktop features (system tray, shortcuts)
- [ ] Mobile compatibility preparation

## Development Commands

- `npm run tauri dev` - Start development server
- `npm run tauri build` - Build production app
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Mobile Port Preparation

The app is designed with mobile portability in mind:
- Responsive tile grid system
- Touch-friendly interactions
- Shared Rust backend logic
- Cross-platform UI components