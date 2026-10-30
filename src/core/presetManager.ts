import { VisualizerPreset, RandomizerSettings } from '../types/visualizer';

export const BUILTIN_PRESETS: VisualizerPreset[] = [
  {
    id: 'royale-gold',
    name: 'Royale Gold (Concert)',
    description: 'Refined 88-key grand piano with warm gold notes, dark obsidian floor, and starlight embers.',
    version: '1.0',
    mode: '3d-piano',
    camera: {
      pitch: -38,
      yaw: 0,
      distance: 980,
      height: 480,
      fov: 65,
      perspective: 1.15,
    },
    piano: {
      showPiano: true,
      keyboardStyle: 'classic',
      keyHeight: 120,
      keyDepression: 7,
      whiteKeyColor: '#f7f6f2',
      blackKeyColor: '#1a1917',
      activeKeyColor: '#e5b85c',
      activeBlackKeyColor: '#c59a3e',
      keyGlow: 1.2,
      transparentKeys: false,
      keyOpacity: 1.0,
      showKeyLabels: false,
    },
    notes: {
      colorMode: 'palette',
      primaryColor: '#e5b85c',
      secondaryColor: '#f3d995',
      accentColor: '#ffffff',
      fallDurationSec: 2.2,
      noteWidth: 0.92,
      noteRadius: 5,
      noteGlow: 1.2,
      noteOpacity: 0.95,
      trails: true,
      trailLength: 0.45,
      velocityScale: true,
    },
    background: {
      type: 'gradient',
      color1: '#0e0f13',
      color2: '#060709',
      gridOpacity: 0.08,
      starDensity: 120,
    },
    effects: {
      particlesOnHit: true,
      particleCount: 220,
      particleColorMode: 'gold',
      lightBars: true,
      lightBarIntensity: 0.8,
      bloomIntensity: 1.2,
      velocityBrightness: true,
      musicReactiveBg: true,
      motionTrails: true,
    },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon (Keysight Style)',
    description: 'Electric cyan and magenta notes over a glowing perspective grid with reactive light beams.',
    version: '1.0',
    mode: '3d-piano',
    camera: {
      pitch: -44,
      yaw: 0,
      distance: 950,
      height: 520,
      fov: 70,
      perspective: 1.25,
    },
    piano: {
      showPiano: true,
      keyboardStyle: 'glass',
      keyHeight: 110,
      keyDepression: 8,
      whiteKeyColor: '#d6e4ff',
      blackKeyColor: '#0a0d18',
      activeKeyColor: '#00f0ff',
      activeBlackKeyColor: '#ff007f',
      keyGlow: 1.8,
      transparentKeys: true,
      keyOpacity: 0.85,
      showKeyLabels: false,
    },
    notes: {
      colorMode: 'palette',
      primaryColor: '#00f0ff',
      secondaryColor: '#ff007f',
      accentColor: '#ffffff',
      fallDurationSec: 2.0,
      noteWidth: 0.90,
      noteRadius: 6,
      noteGlow: 1.8,
      noteOpacity: 0.95,
      trails: true,
      trailLength: 0.5,
      velocityScale: true,
    },
    background: {
      type: 'horizon-grid',
      color1: '#080512',
      color2: '#020108',
      gridOpacity: 0.28,
      starDensity: 150,
    },
    effects: {
      particlesOnHit: true,
      particleCount: 300,
      particleColorMode: 'rainbow',
      lightBars: true,
      lightBarIntensity: 1.4,
      bloomIntensity: 1.6,
      velocityBrightness: true,
      musicReactiveBg: true,
      motionTrails: true,
    },
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    description: 'Vibrant cyber emerald and mint notes cascading toward a dark obsidian keyboard.',
    version: '1.0',
    mode: '3d-piano',
    camera: {
      pitch: -36,
      yaw: 0,
      distance: 920,
      height: 460,
      fov: 65,
      perspective: 1.1,
    },
    piano: {
      showPiano: true,
      keyboardStyle: 'modern',
      keyHeight: 115,
      keyDepression: 6,
      whiteKeyColor: '#eef6f2',
      blackKeyColor: '#121915',
      activeKeyColor: '#10b981',
      activeBlackKeyColor: '#34d399',
      keyGlow: 1.4,
      transparentKeys: false,
      keyOpacity: 1.0,
      showKeyLabels: false,
    },
    notes: {
      colorMode: 'palette',
      primaryColor: '#10b981',
      secondaryColor: '#34d399',
      accentColor: '#a7f3d0',
      fallDurationSec: 2.3,
      noteWidth: 0.92,
      noteRadius: 4,
      noteGlow: 1.4,
      noteOpacity: 0.92,
      trails: true,
      trailLength: 0.4,
      velocityScale: true,
    },
    background: {
      type: 'stars',
      color1: '#040d08',
      color2: '#010402',
      gridOpacity: 0.06,
      starDensity: 180,
    },
    effects: {
      particlesOnHit: true,
      particleCount: 240,
      particleColorMode: 'note',
      lightBars: true,
      lightBarIntensity: 0.9,
      bloomIntensity: 1.3,
      velocityBrightness: true,
      musicReactiveBg: true,
      motionTrails: true,
    },
  },
  {
    id: 'sunset-flame',
    name: 'Sunset Flame',
    description: 'Fiery amber, warm gold and crimson trails with rich velocity-responsive lighting.',
    version: '1.0',
    mode: '3d-piano',
    camera: {
      pitch: -40,
      yaw: 0,
      distance: 960,
      height: 500,
      fov: 68,
      perspective: 1.2,
    },
    piano: {
      showPiano: true,
      keyboardStyle: 'modern',
      keyHeight: 115,
      keyDepression: 7,
      whiteKeyColor: '#fbf4ea',
      blackKeyColor: '#1b120c',
      activeKeyColor: '#f97316',
      activeBlackKeyColor: '#ea580c',
      keyGlow: 1.5,
      transparentKeys: false,
      keyOpacity: 1.0,
      showKeyLabels: false,
    },
    notes: {
      colorMode: 'palette',
      primaryColor: '#f97316',
      secondaryColor: '#fbbf24',
      accentColor: '#ef4444',
      fallDurationSec: 2.1,
      noteWidth: 0.92,
      noteRadius: 5,
      noteGlow: 1.5,
      noteOpacity: 0.95,
      trails: true,
      trailLength: 0.45,
      velocityScale: true,
    },
    background: {
      type: 'gradient',
      color1: '#120703',
      color2: '#050201',
      gridOpacity: 0.08,
      starDensity: 100,
    },
    effects: {
      particlesOnHit: true,
      particleCount: 260,
      particleColorMode: 'gold',
      lightBars: true,
      lightBarIntensity: 1.1,
      bloomIntensity: 1.4,
      velocityBrightness: true,
      musicReactiveBg: true,
      motionTrails: true,
    },
  },
  {
    id: 'chalk-slate',
    name: 'Chalk & Slate (Studio Minimalist)',
    description: 'High-contrast pure white notes over dark graphite slate with zero motion blur and crisp edges.',
    version: '1.0',
    mode: 'midi-roll',
    camera: {
      pitch: -65,
      yaw: 0,
      distance: 850,
      height: 600,
      fov: 60,
      perspective: 0.6,
    },
    piano: {
      showPiano: true,
      keyboardStyle: 'classic',
      keyHeight: 110,
      keyDepression: 4,
      whiteKeyColor: '#e8e8ea',
      blackKeyColor: '#1c1c20',
      activeKeyColor: '#ffffff',
      activeBlackKeyColor: '#888892',
      keyGlow: 0.4,
      transparentKeys: false,
      keyOpacity: 1.0,
      showKeyLabels: false,
    },
    notes: {
      colorMode: 'palette',
      primaryColor: '#ffffff',
      secondaryColor: '#d1d5db',
      accentColor: '#ffffff',
      fallDurationSec: 2.5,
      noteWidth: 0.95,
      noteRadius: 3,
      noteGlow: 0.3,
      noteOpacity: 1.0,
      trails: false,
      trailLength: 0.2,
      velocityScale: false,
    },
    background: {
      type: 'obsidian',
      color1: '#121316',
      color2: '#0e0f11',
      gridOpacity: 0.04,
      starDensity: 0,
    },
    effects: {
      particlesOnHit: false,
      particleCount: 0,
      particleColorMode: 'note',
      lightBars: false,
      lightBarIntensity: 0,
      bloomIntensity: 0.3,
      velocityBrightness: false,
      musicReactiveBg: false,
      motionTrails: false,
    },
  },
  {
    id: 'midnight-dream',
    name: 'Midnight Dream (Cinematic)',
    description: 'Deep sapphire blue and starlight silver with cinematic bloom and gentle particle drift.',
    version: '1.0',
    mode: 'cinematic',
    camera: {
      pitch: -32,
      yaw: 4,
      distance: 1050,
      height: 420,
      fov: 62,
      perspective: 1.1,
    },
    piano: {
      showPiano: true,
      keyboardStyle: 'modern',
      keyHeight: 120,
      keyDepression: 6,
      whiteKeyColor: '#e0e7ff',
      blackKeyColor: '#0f172a',
      activeKeyColor: '#38bdf8',
      activeBlackKeyColor: '#818cf8',
      keyGlow: 1.5,
      transparentKeys: false,
      keyOpacity: 1.0,
      showKeyLabels: false,
    },
    notes: {
      colorMode: 'palette',
      primaryColor: '#38bdf8',
      secondaryColor: '#818cf8',
      accentColor: '#ffffff',
      fallDurationSec: 2.4,
      noteWidth: 0.92,
      noteRadius: 5,
      noteGlow: 1.5,
      noteOpacity: 0.94,
      trails: true,
      trailLength: 0.45,
      velocityScale: true,
    },
    background: {
      type: 'stars',
      color1: '#040816',
      color2: '#01030a',
      gridOpacity: 0.08,
      starDensity: 220,
    },
    effects: {
      particlesOnHit: true,
      particleCount: 220,
      particleColorMode: 'note',
      lightBars: true,
      lightBarIntensity: 1.0,
      bloomIntensity: 1.4,
      velocityBrightness: true,
      musicReactiveBg: true,
      motionTrails: true,
    },
  },
];

/**
 * Storage & Preset Management
 */
export class VisualizerPresetManager {
  private static STORAGE_KEY = 'scoremotion_visualizer_presets';

  public static getAllPresets(): VisualizerPreset[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return [...BUILTIN_PRESETS];
    try {
      const parsed: VisualizerPreset[] = JSON.parse(saved);
      // Combine custom presets with built-in presets
      const customOnes = parsed.filter((p) => !BUILTIN_PRESETS.some((b) => b.id === p.id));
      return [...BUILTIN_PRESETS, ...customOnes];
    } catch {
      return [...BUILTIN_PRESETS];
    }
  }

  public static savePreset(preset: VisualizerPreset): void {
    const current = this.getAllPresets();
    const updated = current.filter((p) => p.id !== preset.id);
    updated.push(preset);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  public static deletePreset(id: string): boolean {
    if (BUILTIN_PRESETS.some((b) => b.id === id)) return false; // Don't delete built-in presets
    const current = this.getAllPresets().filter((p) => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
    return true;
  }

  /**
   * Export preset as downloadable .smspreset JSON file
   */
  public static exportPresetFile(preset: VisualizerPreset): void {
    const dataStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.smspreset`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate and import .smspreset JSON content
   */
  public static importPresetFile(jsonText: string): VisualizerPreset {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid preset: not a JSON object.');
    }
    if (!parsed.camera || !parsed.piano || !parsed.notes || !parsed.background || !parsed.effects) {
      throw new Error('Invalid .smspreset format: missing required configuration sections (camera, piano, notes, background, effects).');
    }

    const newPreset: VisualizerPreset = {
      ...parsed,
      id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: parsed.name ? `${parsed.name} (Imported)` : 'Imported Preset',
      version: parsed.version || '1.0',
    };

    this.savePreset(newPreset);
    return newPreset;
  }
}

/**
 * Smart Visual Style Randomizer
 * Generates harmonized visual palettes and settings with category locks
 */
export function randomizeVisualizerPreset(
  base: VisualizerPreset,
  settings: RandomizerSettings
): VisualizerPreset {
  const result: VisualizerPreset = JSON.parse(JSON.stringify(base));
  result.id = `rnd_${Date.now()}`;
  result.name = `Custom Remix ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Harmonized Palette Generators
  const palettes = [
    { name: 'Solar Amber', primary: '#f59e0b', secondary: '#f97316', accent: '#fbbf24', bg1: '#110903', bg2: '#040201' },
    { name: 'Cyber Neon', primary: '#00f0ff', secondary: '#ff007f', accent: '#ffffff', bg1: '#070414', bg2: '#010105' },
    { name: 'Aurora Mint', primary: '#10b981', secondary: '#34d399', accent: '#a7f3d0', bg1: '#030e07', bg2: '#010302' },
    { name: 'Monarch Gold', primary: '#e5b85c', secondary: '#c59a3e', accent: '#ffffff', bg1: '#100f0d', bg2: '#060504' },
    { name: 'Violet Nebula', primary: '#a855f7', secondary: '#ec4899', accent: '#c084fc', bg1: '#0d0417', bg2: '#030107' },
    { name: 'Deep Azure', primary: '#3b82f6', secondary: '#06b6d4', accent: '#93c5fd', bg1: '#040a17', bg2: '#010206' },
  ];

  if (!settings.lockColors) {
    const p = palettes[Math.floor(Math.random() * palettes.length)];
    result.notes.primaryColor = p.primary;
    result.notes.secondaryColor = p.secondary;
    result.notes.accentColor = p.accent;
    result.piano.activeKeyColor = p.primary;
    result.piano.activeBlackKeyColor = p.secondary;
    if (!settings.lockBackground) {
      result.background.color1 = p.bg1;
      result.background.color2 = p.bg2;
    }
  }

  if (!settings.lockCamera) {
    const pitches = [-32, -38, -44, -55, -65];
    const yaws = [-8, 0, 0, 0, 8];
    const distances = [850, 950, 1050];
    result.camera.pitch = pitches[Math.floor(Math.random() * pitches.length)];
    result.camera.yaw = yaws[Math.floor(Math.random() * yaws.length)];
    result.camera.distance = distances[Math.floor(Math.random() * distances.length)];
    result.camera.fov = 60 + Math.floor(Math.random() * 15);
  }

  if (!settings.lockPiano) {
    const styles: ('modern' | 'classic' | 'glass')[] = ['modern', 'classic', 'glass'];
    result.piano.keyboardStyle = styles[Math.floor(Math.random() * styles.length)];
    result.piano.transparentKeys = Math.random() < 0.4;
    result.piano.keyDepression = 5 + Math.floor(Math.random() * 5);
  }

  if (!settings.lockBackground) {
    const bgTypes: ('obsidian' | 'gradient' | 'horizon-grid' | 'stars')[] = ['gradient', 'horizon-grid', 'stars', 'obsidian'];
    result.background.type = bgTypes[Math.floor(Math.random() * bgTypes.length)];
    result.background.gridOpacity = 0.05 + Math.random() * 0.25;
    result.background.starDensity = Math.floor(Math.random() * 250);
  }

  if (!settings.lockEffects) {
    result.effects.particlesOnHit = Math.random() < 0.85;
    result.effects.lightBars = Math.random() < 0.75;
    result.effects.bloomIntensity = 0.8 + Math.random() * 0.9;
    result.effects.musicReactiveBg = true;
    result.notes.fallDurationSec = 1.8 + Math.random() * 1.0;
  }

  return result;
}
