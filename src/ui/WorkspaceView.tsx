import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Sliders,
  ZoomIn,
  ZoomOut,
  Disc3,
} from 'lucide-react';
import { ScoreData, VisualSettings, PlaybackState } from '../types/score';
import { ScoreMotionRenderer } from '../render/scoreRenderer';
import { ScoreSynthEngine } from '../playback/synthEngine';
import { PianoSamplerStatus } from '../playback/pianoSampler';

interface WorkspaceViewProps {
  score: ScoreData;
  settings: VisualSettings;
  playback: PlaybackState;
  synth: ScoreSynthEngine;
  onBackToHome: () => void;
  onOpenImport: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onReset: () => void;
  onToggleLoop: () => void;
  onSpeedChange: (speed: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onUpdateSettings: (newSettings: Partial<VisualSettings>) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  score,
  settings,
  playback,
  synth,
  onBackToHome,
  onOpenImport,
  onPlayPause,
  onStop,
  onSeek,
  onReset,
  onToggleLoop,
  onSpeedChange,
  onVolumeChange,
  onToggleMute,
  onUpdateSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ScoreMotionRenderer>(new ScoreMotionRenderer());

  const timeDisplayRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [pianoStatus, setPianoStatus] = useState<PianoSamplerStatus>(() => synth.getPianoStatus());
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Cached viewport size tracked via ResizeObserver (Zero layout thrashing in RAF)
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 800,
    height: 600,
    dpr: window.devicePixelRatio || 1,
  });

  const loopRef = useRef<boolean>(playback.loop);
  loopRef.current = playback.loop;

  const settingsRef = useRef<VisualSettings>(settings);
  settingsRef.current = settings;

  const scoreRef = useRef<ScoreData>(score);
  scoreRef.current = score;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Subscribe to Piano Sampler Status
  useEffect(() => {
    const unsub = synth.subscribePianoStatus((st) => setPianoStatus(st));
    return () => unsub();
  }, [synth]);

  // Subscribe to Master Audio Hardware Clock
  useEffect(() => {
    const unsubscribe = synth.subscribeTime((curTime, ratio) => {
      if (timeDisplayRef.current) {
        timeDisplayRef.current.innerText = formatTime(curTime);
      }
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${ratio * 100}%`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.left = `calc(${ratio * 100}% - 5px)`;
      }
    });

    return () => unsubscribe();
  }, [synth]);

  // ResizeObserver for canvas buffer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        sizeRef.current = {
          width: Math.max(100, Math.floor(width)),
          height: Math.max(100, Math.floor(height)),
          dpr: window.devicePixelRatio || 1,
        };
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTimeNotify = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const loopStep = (timestamp: number) => {
      const curScoreTime = synth.getCurrentScoreTime();
      const currentScore = scoreRef.current;

      // Hardware Audio Lookahead Scheduler
      if (synth.getStatus() === 'playing') {
        synth.updateScheduler(currentScore.notes);

        // Check if track reached end
        if (curScoreTime >= currentScore.duration) {
          if (loopRef.current) {
            synth.seek(0);
          } else {
            onStop();
          }
        }
      }

      // Notify timecode listeners at ~20 Hz
      if (timestamp - lastTimeNotify >= 45) {
        synth.notifyTime(curScoreTime);
        lastTimeNotify = timestamp;
      }

      // Buffer sizing
      const { width, height, dpr } = sizeRef.current;
      const targetBufferW = Math.floor(width * dpr);
      const targetBufferH = Math.floor(height * dpr);

      if (canvas.width !== targetBufferW || canvas.height !== targetBufferH) {
        canvas.width = targetBufferW;
        canvas.height = targetBufferH;
      }

      // Render score pass
      ctx.save();
      ctx.scale(dpr, dpr);

      rendererRef.current.render(
        ctx,
        width,
        height,
        currentScore,
        curScoreTime,
        settingsRef.current
      );

      ctx.restore();

      animId = requestAnimationFrame(loopStep);
    };

    animId = requestAnimationFrame(loopStep);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [synth, onStop]);

  // Click on Canvas to Seek
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const playheadX = rect.width * 0.28;
    const pixelsPerSecond = 130 * (settingsRef.current.cameraZoom || 1.0);

    const offsetSeconds = (clickX - playheadX) / pixelsPerSecond;
    const curTime = synth.getCurrentScoreTime();
    const targetTime = Math.max(0, Math.min(scoreRef.current.duration, curTime + offsetSeconds));

    synth.seek(targetTime);
    onSeek(targetTime);
  }, [synth, onSeek]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#121317',
      color: '#f3f4f6',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
    }}>
      {/* 1. Top Professional Toolbar */}
      <header style={{
        height: '56px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#18191e',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 20,
      }}>
        {/* Left: Back to Home & Score Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBackToHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f3f4f6',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.09)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            title="Return to Home Screen"
          >
            <ArrowLeft size={14} color="#d4af37" />
            <span>Home</span>
          </button>

          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Imported Score Details */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
              {score.title}
            </div>
            <div style={{ fontSize: '11px', color: '#8c909e', display: 'flex', gap: '8px' }}>
              <span>{score.composer}</span>
              <span>•</span>
              <span style={{ color: '#d4af37', fontFamily: "'JetBrains Mono', monospace" }}>{score.bpm} BPM</span>
              <span>•</span>
              <span>{score.keySignature}</span>
              <span>•</span>
              <span>{score.notes.length} notes</span>
              {score.tracks && score.tracks.length > 1 && (
                <>
                  <span>•</span>
                  <span>{score.tracks.length} tracks</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Piano Status & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Acoustic Grand Piano Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '16px',
            backgroundColor: pianoStatus.isLoaded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)',
            border: pianoStatus.isLoaded ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
            fontSize: '11px',
            fontWeight: 600,
            color: pianoStatus.isLoaded ? '#34d399' : '#e5c158',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: pianoStatus.isLoaded ? '#10b981' : '#e5c158',
              boxShadow: `0 0 6px ${pianoStatus.isLoaded ? '#10b981' : '#e5c158'}`,
            }} />
            {pianoStatus.isLoaded ? (
              <span>Acoustic Grand Piano</span>
            ) : pianoStatus.isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Disc3 size={11} className="spin" />
                <span>Loading Piano ({pianoStatus.loadProgress}%)</span>
              </span>
            ) : (
              <span>Synth Standby</span>
            )}
          </div>

          {/* Import New MIDI */}
          <button
            onClick={onOpenImport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              color: '#e5c158',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={13} />
            <span>Import MIDI</span>
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: showSettingsDrawer ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Score Display Options"
          >
            <Sliders size={14} />
          </button>
        </div>
      </header>

      {/* 2. Central Area: Clean Sheet Music Viewport */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
      }}>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#121317',
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              cursor: 'crosshair',
            }}
          />

          {/* Minimalist Floating Zoom & View Controls */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 6px',
            borderRadius: '6px',
            backgroundColor: 'rgba(18, 19, 23, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
          }}>
            <button
              onClick={() => onUpdateSettings({ cameraZoom: Math.max(0.7, (settings.cameraZoom || 1.0) - 0.1) })}
              style={{ background: 'none', border: 'none', color: '#a0a3ad', cursor: 'pointer', padding: '4px' }}
              title="Zoom Out Score"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#e5c158' }}>
              {Math.round((settings.cameraZoom || 1.0) * 100)}%
            </span>
            <button
              onClick={() => onUpdateSettings({ cameraZoom: Math.min(1.5, (settings.cameraZoom || 1.0) + 0.1) })}
              style={{ background: 'none', border: 'none', color: '#a0a3ad', cursor: 'pointer', padding: '4px' }}
              title="Zoom In Score"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>

        {/* Collapsible View Options Drawer */}
        {showSettingsDrawer && (
          <aside style={{
            width: '260px',
            height: '100%',
            backgroundColor: '#17181d',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            zIndex: 15,
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#d4af37' }}>
              Score View Options
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#e4e6eb', cursor: 'pointer' }}>
                <span>Highlight Playing Notes</span>
                <input
                  type="checkbox"
                  checked={settings.activeNoteGlow}
                  onChange={(e) => onUpdateSettings({ activeNoteGlow: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#e4e6eb', cursor: 'pointer' }}>
                <span>Show Measure Numbers</span>
                <input
                  type="checkbox"
                  checked={settings.showMeasureNumbers}
                  onChange={(e) => onUpdateSettings({ showMeasureNumbers: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#e4e6eb', cursor: 'pointer' }}>
                <span>Show Grand Staves</span>
                <input
                  type="checkbox"
                  checked={settings.showStaves}
                  onChange={(e) => onUpdateSettings({ showStaves: e.target.checked })}
                />
              </label>
            </div>

            {score.tracks && score.tracks.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#8c909e', textTransform: 'uppercase', marginBottom: '8px' }}>
                  MIDI Tracks ({score.tracks.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {score.tracks.map((tr) => (
                    <div key={tr.id} style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      fontSize: '11px',
                    }}>
                      <div style={{ color: '#f3f4f6', fontWeight: 500 }}>{tr.name}</div>
                      <div style={{ color: '#6c717e', fontSize: '10px' }}>
                        {tr.instrument ? `${tr.instrument} • ` : ''}{tr.noteCount} notes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 3. Bottom Transport Bar */}
      <footer style={{
        height: '74px',
        backgroundColor: '#18191e',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 20,
      }}>
        {/* Timeline Progress Scrubber */}
        <div
          style={{
            width: '100%',
            height: '8px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            onSeek(ratio * playback.duration);
          }}
        >
          <div style={{
            width: '100%',
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div
              ref={progressFillRef}
              style={{
                width: `${playback.duration > 0 ? (playback.currentTime / playback.duration) * 100 : 0}%`,
                height: '100%',
                backgroundColor: '#d4af37',
              }}
            />
          </div>

          <div
            ref={thumbRef}
            style={{
              position: 'absolute',
              left: `calc(${playback.duration > 0 ? (playback.currentTime / playback.duration) * 100 : 0}% - 5px)`,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 6px #d4af37',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Timecode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              ref={timeDisplayRef}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '0.04em',
              }}
            >
              {formatTime(playback.currentTime)}
            </div>
            <span style={{ color: '#555866', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>/</span>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#8c909e',
            }}>
              {formatTime(playback.duration)}
            </div>
          </div>

          {/* Central Controls: Play, Pause, Stop, Seek */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={onReset}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e6eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Return to Start"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={() => onSeek(Math.max(0, synth.getCurrentScoreTime() - 5))}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e6eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Rewind 5s"
            >
              <SkipBack size={15} />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={onPlayPause}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#d4af37',
                border: 'none',
                color: '#111215',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 14px rgba(212, 175, 55, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c158')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d4af37')}
              title={playback.isPlaying ? 'Pause' : 'Play'}
            >
              {playback.isPlaying ? (
                <Pause size={18} fill="#111215" strokeWidth={0} />
              ) : (
                <Play size={18} fill="#111215" strokeWidth={0} style={{ marginLeft: '2px' }} />
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={onStop}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e6eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Stop Playback"
            >
              <Square size={13} fill="#e4e6eb" strokeWidth={0} />
            </button>

            <button
              onClick={() => onSeek(Math.min(playback.duration, synth.getCurrentScoreTime() + 5))}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e6eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Forward 5s"
            >
              <SkipForward size={15} />
            </button>

            <button
              onClick={onToggleLoop}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: playback.loop ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: playback.loop ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                color: playback.loop ? '#d4af37' : '#8c909e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Toggle Loop"
            >
              <Repeat size={14} />
            </button>
          </div>

          {/* Right: Tempo & Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Speed Presets */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              {[0.75, 1.0, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onSpeedChange(spd)}
                  style={{
                    backgroundColor: playback.playbackRate === spd ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                    border: 'none',
                    color: playback.playbackRate === spd ? '#e5c158' : '#8c909e',
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    padding: '3px 7px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={onToggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a0a3ad',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={playback.isMuted ? 'Unmute' : 'Mute'}
              >
                {playback.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={playback.isMuted ? 0 : playback.volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                style={{ width: '70px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
