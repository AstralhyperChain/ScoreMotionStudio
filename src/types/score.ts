export type VisualTheme = 'solar-flare' | 'emerald-aurora' | 'cyber-lumen' | 'obsidian-gold';

export interface ScoreNote {
  id: string;
  pitch: number;          // MIDI pitch (e.g., 60 = C4)
  noteName: string;       // e.g., "C4", "G#5"
  startTime: number;      // Seconds
  duration: number;       // Seconds
  velocity: number;       // 0 to 127
  staff: 0 | 1;           // 0: Treble, 1: Bass
  voice?: number;         // 1, 2, 3...
  channel?: number;       // MIDI channel (0-15)
  trackIndex?: number;    // MIDI track index
  accidental?: 'sharp' | 'flat' | 'natural';
  tiedTo?: string;        // ID of tied note if any
  hasBeam?: boolean;      // True if part of beamed group
  beamSlope?: number;
}

export interface MeasureInfo {
  number: number;
  timeSignature: [number, number];
  startTime: number;
  duration: number;
}

export interface MidiTrackInfo {
  id: number;
  name: string;
  channel: number;
  instrument?: string;
  noteCount: number;
}

export interface ScoreData {
  title: string;
  composer: string;
  bpm: number;
  timeSignature: [number, number];
  keySignature: string;
  duration: number; // In seconds
  notes: ScoreNote[];
  measures: MeasureInfo[];
  tracks?: MidiTrackInfo[];
  fileName?: string;
  fileSize?: number;
}

export interface RecentProject {
  id: string;
  title: string;
  composer: string;
  duration: number;
  noteCount: number;
  bpm: number;
  lastOpened: number; // Timestamp
  isSample?: boolean;
  sampleKey?: 'bach' | 'lumen';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  glow: number;
}

export interface LumenThemeConfig {
  name: string;
  id: VisualTheme;
  description: string;
  primary: string;
  glowColor: string;
  secondary: string;
  accent: string;
  staffColor: string;
  backgroundGradient: [string, string];
}

export interface VisualSettings {
  cameraZoom: number;          // 0.7 to 1.5
  staffOpacity: number;        // 0.4 to 1.0
  activeNoteGlow: boolean;     // Highlight active notes in warm gold
  showMeasureNumbers: boolean;
  showStaves: boolean;
  horizontalScroll: boolean;
  
  // Optional backward-compatible fields
  theme?: VisualTheme;
  bloomIntensity?: number;
  particleCount?: number;
  stardustSpeed?: number;
  noteTrailLength?: number;
  waveRipples?: boolean;
  luminousPen?: boolean;
  penGlowIntensity?: number;
  staffLiveDrawing?: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  loop: boolean;
}
