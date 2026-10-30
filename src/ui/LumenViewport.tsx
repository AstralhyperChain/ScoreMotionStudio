import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ScoreData, VisualSettings } from '../types/score';
import { LumenScoreRenderer } from '../render/scoreRenderer';
import { ScoreSynthEngine } from '../playback/synthEngine';
import { Maximize, Minimize, Gauge } from 'lucide-react';

interface LumenViewportProps {
  score: ScoreData;
  settings: VisualSettings;
  synth: ScoreSynthEngine;
  loop: boolean;
  onEnded: () => void;
  onSeek: (time: number) => void;
}

export const LumenViewport: React.FC<LumenViewportProps> = ({
  score,
  settings,
  synth,
  loop,
  onEnded,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<LumenScoreRenderer>(new LumenScoreRenderer());
  const fpsTextRef = useRef<HTMLSpanElement>(null);
  const frameTimeTextRef = useRef<HTMLSpanElement>(null);
  const fpsIndicatorDotRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Cached viewport size tracked via ResizeObserver (Zero layout thrashing in RAF)
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 800,
    height: 600,
    dpr: window.devicePixelRatio || 1,
  });

  // Track loop prop in ref to prevent stale closures in RAF
  const loopRef = useRef<boolean>(loop);
  loopRef.current = loop;

  // Track settings in ref for hot parameter updates without rebuilding RAF loop
  const settingsRef = useRef<VisualSettings>(settings);
  settingsRef.current = settings;

  // Track score in ref
  const scoreRef = useRef<ScoreData>(score);
  scoreRef.current = score;

  // ResizeObserver for high-DPI scaling
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

  // Main 60 FPS Audio-Synchronized Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();
    let frameCounter = 0;
    let lastFpsReport = performance.now();
    let lastTimeNotify = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const loopStep = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // 1. Live FPS & Frame-time tracking (DOM ref update with 0 React re-renders)
      frameCounter++;
      if (timestamp - lastFpsReport >= 250) {
        const measuredFps = Math.min(144, Math.round((frameCounter * 1000) / (timestamp - lastFpsReport)));
        const measuredFrameMs = delta.toFixed(1);

        if (fpsTextRef.current) {
          fpsTextRef.current.innerText = `${measuredFps} FPS`;
        }
        if (frameTimeTextRef.current) {
          frameTimeTextRef.current.innerText = `${measuredFrameMs} ms`;
        }
        if (fpsIndicatorDotRef.current) {
          const color = measuredFps >= 55 ? '#10b981' : measuredFps >= 40 ? '#f59e0b' : '#ef4444';
          fpsIndicatorDotRef.current.style.backgroundColor = color;
        }

        frameCounter = 0;
        lastFpsReport = timestamp;
      }

      // 2. Query Master Hardware Audio Clock
      const curScoreTime = synth.getCurrentScoreTime();
      const currentScore = scoreRef.current;

      // 3. Audio Lookahead Scheduler
      if (synth.getStatus() === 'playing') {
        synth.updateScheduler(currentScore.notes);

        // Check if playback reached the end
        if (curScoreTime >= currentScore.duration) {
          if (loopRef.current) {
            synth.seek(0);
          } else {
            synth.pause();
            synth.seek(0);
            onEnded();
          }
        }
      }

      // 4. Notify UI subscribers at ~20 Hz to update timeline without choking main thread
      if (timestamp - lastTimeNotify >= 45) {
        synth.notifyTime(curScoreTime);
        lastTimeNotify = timestamp;
      }

      // 5. High-DPI Buffer Sizing without layout thrashing
      const { width, height, dpr } = sizeRef.current;
      const targetBufferW = Math.floor(width * dpr);
      const targetBufferH = Math.floor(height * dpr);

      if (canvas.width !== targetBufferW || canvas.height !== targetBufferH) {
        canvas.width = targetBufferW;
        canvas.height = targetBufferH;
      }

      // 6. Canvas Render Pass
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
  }, [synth, onEnded]);

  // Click on canvas to scrub
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const playheadX = rect.width * 0.32;
    const pixelsPerSecond = 140 * settingsRef.current.cameraZoom;

    const offsetSeconds = (clickX - playheadX) / pixelsPerSecond;
    const curTime = synth.getCurrentScoreTime();
    const targetTime = Math.max(0, Math.min(scoreRef.current.duration, curTime + offsetSeconds));
    
    synth.seek(targetTime);
    onSeek(targetTime);
  }, [synth, onSeek]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#040508',
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

      {/* Live 60 FPS & Diagnostics HUD */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        {/* Real Live FPS Counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(5, 7, 12, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(8px)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          <div
            ref={fpsIndicatorDotRef}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px currentColor',
              transition: 'background-color 0.2s ease',
            }}
          />
          <span ref={fpsTextRef} style={{ color: '#ffffff' }}>60 FPS</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>•</span>
          <span ref={frameTimeTextRef} style={{ color: 'var(--text-dim)', fontSize: '10px' }}>16.6 ms</span>
        </div>

        {/* Real-time Web Audio Engine Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'rgba(5, 7, 12, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#fbbf24',
        }}>
          <Gauge size={12} />
          <span>AUDIO SYNC CLOCK</span>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="btn-ghost"
          style={{
            pointerEvents: 'auto',
            padding: '5px 7px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
        </button>
      </div>
    </div>
  );
};
