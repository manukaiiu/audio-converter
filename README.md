# Audio Converter

A web-based FLAC to M4A converter with real-time progress tracking.

## Features

- **FLAC to M4A conversion** - AAC codec @ 256kbps
- **Metadata preservation** - Artist, album, title, track number
- **Album art preservation** - Embedded cover images are kept
- **Incremental conversion** - Skips already-converted files
- **Real-time progress** - Per-file and overall progress via WebSocket
- **Folder reorganization** - Moves flat FLAC files into `flac/` subfolder
- **Purple-themed UI** - Clean Vue 3 interface

## Requirements

- Node.js 18+
- ffmpeg (must be in system PATH)

## Quick Start

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run build
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. Enter the path to an album folder containing FLAC files
2. Click **Scan** to discover files
3. If the folder has a flat structure, optionally **Reorganize** it
4. Click **Convert** to start conversion
5. Watch real-time progress as files are converted

## Folder Structure

The converter expects/creates this structure:

```
Artist/
└── Album/
    ├── flac/
    │   ├── 01-track.flac
    │   └── 02-track.flac
    ├── m4a/
    │   ├── 01-track.m4a
    │   └── 02-track.m4a
    └── cover.jpg (preserved)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check ffmpeg availability |
| `/api/scan` | POST | Scan folder for FLAC files |
| `/api/convert` | POST | Start conversion |
| `/api/cancel` | POST | Cancel current conversion |
| `/api/status` | GET | Get conversion status |
| `/api/reorganize` | POST | Move FLACs into `flac/` subfolder |

## WebSocket Events

Connect to `ws://localhost:3001` for real-time updates:

- `progress` - Per-file conversion progress with ETA
- `file-complete` - Individual file completion
- `job-complete` - All files finished
- `error` - Conversion error

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, WebSocket (ws)
- **Frontend**: Vue 3, Vite, TypeScript
- **Conversion**: ffmpeg/ffprobe

## Project Structure

```
source/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── routes/api.ts      # REST endpoints
│   │   ├── services/
│   │   │   ├── scanner.ts     # FLAC file discovery
│   │   │   ├── converter.ts   # Conversion queue
│   │   │   └── reorganizer.ts # Folder restructuring
│   │   ├── utils/ffmpeg.ts    # ffmpeg wrapper
│   │   └── websocket/progress.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.vue
    │   ├── components/
    │   │   ├── FolderSelector.vue
    │   │   ├── SettingsPanel.vue
    │   │   ├── ReorganizePanel.vue
    │   │   ├── ConvertButton.vue
    │   │   ├── ProgressPanel.vue
    │   │   └── FileList.vue
    │   ├── composables/useWebSocket.ts
    │   └── styles/main.css
    └── package.json
```
