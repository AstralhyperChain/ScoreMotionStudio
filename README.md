# ScoreMotion Studio - LUMEN Engine

> Cinematic music visualization and animated sheet-music video creation studio for Windows.

---

## 🌟 Visual Style: The LUMEN Engine
The application features a cinematic, elegant, and futuristic aesthetic:
- **Pure Cosmic Obsidian Background:** `#050608` with subtle vignette depth.
- **Glowing Notation Palettes:**
  - **Solar Flare:** Radiant amber (`#f59e0b`), fiery orange (`#f97316`), and golden starlight (`#fbbf24`).
  - **Emerald Aurora:** Electric cyber emerald (`#10b981`), neon mint (`#34d399`), and lime gold (`#a3e635`).
  - **Cyber Lumen:** Multi-voice prismatic polyphony with voice-leading highlights.
  - **Obsidian Gold:** Minimalist monarch gold and platinum starlight.
- **Real-Time Physics & Particles:**
  - Ambient stardust and floating embers drifting across the staves.
  - Radiant note impact bursts when the laser playhead strikes notes.
  - Audio-reactive harmonic wave ripples across the base of the score.

---

## 🚀 Quick Start

### 1. Launch Dev Studio
Inside the `ScoreMotionStudio` folder:
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser or desktop window.

### 2. Desktop Mode (Tauri)
To run or build the standalone Windows `.exe` desktop application:
1. Ensure Rust is installed on Windows (`winget install Rustlang.Rustup` or from [rustup.rs](https://rustup.rs)).
2. Run:
```powershell
npm run tauri dev
```
To create a production `.exe` installer:
```powershell
npm run tauri build
```

---

## 🎼 Features Implemented in Milestone 1

1. **LUMEN Canvas Engine (`src/render/`):**
   - 60 FPS real-time rendering of the Grand Staff (Treble & Bass staves).
   - Slanted musical note heads, stems, beams, duration ribbons, and dynamic ledger lines.
   - Interactive scrub: click anywhere on the score to jump instantly to that timecode.
2. **Built-in Compositions:**
   - **J.S. Bach:** *Prelude in C Major (BWV 846)* with full arpeggiated polyphony.
   - **ScoreMotion:** *LUMEN Cinematic Overture* showcasing deep bass resonance and glowing high melodies.
3. **Audio Synthesis Preview (`src/playback/`):**
   - Web Audio synthesizer generating warm cinematic piano/bell tones synchronized to the playhead.
4. **Score Importer (`src/core/`):**
   - **MIDI Parser:** Standard MIDI files (Format 0 and Format 1).
   - **MusicXML Parser:** Standard `.musicxml` / `.xml` score files.
   - Drag-and-drop modal overlay (`src/ui/DropZone.tsx`).
5. **Video Export Bridge (`src/ui/ExportModal.tsx`):**
   - Pre-configured profiles: 1080p Full HD, 4K UHD, and 9:16 Vertical (Shorts / Reels / TikTok).
   - FFmpeg rendering commands and render progress simulation.
