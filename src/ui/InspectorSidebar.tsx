import React from 'react';
import {
  Sliders,
  Palette,
  Sparkles,
  Maximize2,
  Film,
  Eye,
  Activity,
  Layers,
  PenTool,
  Volume2,
} from 'lucide-react';
import { VisualSettings, VisualTheme } from '../types/score';
import { THEME_PRESETS } from '../render/themePresets';

interface InspectorSidebarProps {
  settings: VisualSettings;
  onUpdateSettings: (newSettings: Partial<VisualSettings>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  settings,
  onUpdateSettings,
  isOpen,
  onToggle,
}) => {
  const themes: VisualTheme[] = ['solar-flare', 'emerald-aurora', 'cyber-lumen', 'obsidian-gold'];

  return (
    <aside
      className="glass-panel"
      style={{
        width: isOpen ? '290px' : '0px',
        height: '100%',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        borderLeft: isOpen ? '1px solid var(--border-subtle)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 15,
      }}
    >
      <div style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={15} color="var(--amber-core)" />
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            LUMEN Studio
          </span>
        </div>
        <button
          onClick={onToggle}
          className="btn-ghost"
          style={{ padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
          title="Collapse Panel"
        >
          <Maximize2 size={12} />
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* 1. Visual Theme Presets */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Palette size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Color Preset
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {themes.map((th) => {
              const config = THEME_PRESETS[th];
              const isSelected = settings.theme === th;
              return (
                <button
                  key={th}
                  onClick={() => onUpdateSettings({ theme: th })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                    }}>
                      {config.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {th === 'solar-flare' ? 'Amber & Orange Glow' :
                       th === 'emerald-aurora' ? 'Cyber Emerald & Mint' :
                       th === 'cyber-lumen' ? 'Prismatic Polyphony' : 'Velvet Gold'}
                    </div>
                  </div>

                  {/* Color dots preview */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.primary }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.secondary }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.accent }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Luminous Pen Handwritten Motion Graphics */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <PenTool size={13} color="var(--amber-core)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber-core)', textTransform: 'uppercase' }}>
              Handwritten Score Graphics
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Luminous Pen Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '11px', color: 'var(--text-main)' }}>
              <span>Luminous Pen Cursor</span>
              <input
                type="checkbox"
                checked={settings.luminousPen}
                onChange={(e) => onUpdateSettings({ luminousPen: e.target.checked })}
              />
            </label>

            {/* Progressive Staff Drawing */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '11px', color: 'var(--text-main)' }}>
              <span>Live Staff Inking</span>
              <input
                type="checkbox"
                checked={settings.staffLiveDrawing}
                onChange={(e) => onUpdateSettings({ staffLiveDrawing: e.target.checked })}
              />
            </label>

            {/* Pen Glow Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pen Glow Intensity</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-core)' }}>
                  {(settings.penGlowIntensity || 1.4).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={settings.penGlowIntensity || 1.4}
                onChange={(e) => onUpdateSettings({ penGlowIntensity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </section>

        {/* 3. Cinematic Lighting & Particles */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Sparkles size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cinematic Lighting
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Bloom Intensity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bloom Intensity</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-core)' }}>
                  {(settings.bloomIntensity || 1.3).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={settings.bloomIntensity || 1.3}
                onChange={(e) => onUpdateSettings({ bloomIntensity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Particle Density */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Stardust Particles</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-core)' }}>
                  {settings.particleCount || 200}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={settings.particleCount || 200}
                onChange={(e) => onUpdateSettings({ particleCount: parseInt(e.target.value, 10) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Note Trail Length */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Motion Trail</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-core)' }}>
                  {Math.round((settings.noteTrailLength || 0.6) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.noteTrailLength || 0.6}
                onChange={(e) => onUpdateSettings({ noteTrailLength: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Camera Zoom */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Camera Scale</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-core)' }}>
                  {settings.cameraZoom.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.05"
                value={settings.cameraZoom}
                onChange={(e) => onUpdateSettings({ cameraZoom: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </section>

        {/* 4. Notation Overlays */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Eye size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Notation Display
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Wave Ripples */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={12} />
                <span>Harmonic Ripples</span>
              </div>
              <input
                type="checkbox"
                checked={settings.waveRipples}
                onChange={(e) => onUpdateSettings({ waveRipples: e.target.checked })}
              />
            </label>

            {/* Staves */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={12} />
                <span>Show Staves</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showStaves}
                onChange={(e) => onUpdateSettings({ showStaves: e.target.checked })}
              />
            </label>

            {/* Measure Numbers */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Film size={12} />
                <span>Measure Numbers</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showMeasureNumbers}
                onChange={(e) => onUpdateSettings({ showMeasureNumbers: e.target.checked })}
              />
            </label>
          </div>
        </section>

        {/* 5. Audio & Video Engine Specs */}
        <section style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Studio Engines
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={12} color="#10b981" />
              <span>Audio</span>
            </span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Acoustic Piano 88K</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Sample Bank</span>
            <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>FluidR3 Grand</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Sustain Pedal</span>
            <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>MIDI CC64 Ready</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Video Renderer</span>
            <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>1080p60 MP4</span>
          </div>
        </section>
      </div>
    </aside>
  );
};
