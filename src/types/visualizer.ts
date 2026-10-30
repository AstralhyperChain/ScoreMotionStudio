export type VisualizationMode = '3d-piano' | 'midi-roll' | 'cinematic' | 'sheet-music';

export interface CameraConfig {
  pitch: number;      // Degrees: -90 (top down) to +15 (low angle)
  yaw: number;        // Degrees: -45 to +45
  distance: number;   // 400 to 1800
  height: number;     // Vertical offset
  fov: number;        // Field of View (45 to 90)
  perspective: number;// 0.2 to 1.8
}

export interface PianoConfig {
  showPiano: boolean;
  keyboardStyle: 'modern' | 'classic' | 'glass';
  keyHeight: number;        // Base key height
  keyDepression: number;    // How deep keys depress (0 to 14px)
  whiteKeyColor: string;
  blackKeyColor: string;
  activeKeyColor: string;
  activeBlackKeyColor: string;
  keyGlow: number;          // 0 to 2.5
  transparentKeys: boolean;
  keyOpacity: number;       // 0.2 to 1.0
  showKeyLabels: boolean;
}

export interface NotesConfig {
  colorMode: 'palette' | 'track' | 'pitch' | 'rainbow';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fallDurationSec: number;  // Time notes take to fall (1.0 to 5.0 seconds)
  noteWidth: number;        // Width scale (0.5 to 1.0)
  noteRadius: number;       // Corner radius (0 to 10px)
  noteGlow: number;         // Bloom radius
  noteOpacity: number;      // 0.5 to 1.0
  trails: boolean;          // Sustained trail
  trailLength: number;      // 0 to 1.0
  velocityScale: boolean;   // Velocity alters brightness/size
}

export interface BackgroundConfig {
  type: 'obsidian' | 'gradient' | 'horizon-grid' | 'stars' | 'image';
  color1: string;
  color2: string;
  gridOpacity: number;
  starDensity: number;
  bgImageUrl?: string;
}

export interface EffectsConfig {
  particlesOnHit: boolean;
  particleCount: number;
  particleColorMode: 'note' | 'gold' | 'rainbow';
  lightBars: boolean;
  lightBarIntensity: number;
  bloomIntensity: number;   // 0 to 2.5
  velocityBrightness: boolean;
  musicReactiveBg: boolean;
  motionTrails: boolean;
}

export interface VisualizerPreset {
  id: string;
  name: string;
  description: string;
  version: string;
  mode: VisualizationMode;
  camera: CameraConfig;
  piano: PianoConfig;
  notes: NotesConfig;
  background: BackgroundConfig;
  effects: EffectsConfig;
}

export interface RandomizerSettings {
  strength: number;         // 0.2 to 1.0
  lockCamera: boolean;
  lockColors: boolean;
  lockPiano: boolean;
  lockBackground: boolean;
  lockEffects: boolean;
}

export interface RemoteControlStatus {
  enabled: boolean;
  port: number;
  token: string;
  connectedClients: number;
  lastCommand?: string;
  logs: string[];
}

export interface VideoExportSettings {
  preset: '1080p' | '1440p' | '4k' | 'shorts_9_16' | 'square_1_1' | 'custom';
  width: number;
  height: number;
  fps: 30 | 60;
  bitrateMbps: number;
  includeWatermark: boolean;
  watermarkText: string;
  showTitleCard: boolean;
}
