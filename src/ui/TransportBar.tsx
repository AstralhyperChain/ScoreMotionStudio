import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PlaybackState } from '../types/score';
import { ScoreSynthEngine } from '../playback/synthEngine';

interface TransportBarProps {
  playback: PlaybackState;
  synth: ScoreSynthEngine;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onReset: () => void;
  onToggleLoop: () => void;
  onSpeedChange: (speed: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  playback,
  synth,
  onPlayPause,
  onSeek,
  onReset,
  onToggleLoop,
  onSpeedChange,
  onVolumeChange,
  onToggleMute,
}) => {
  const timeDisplayRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Subscribe directly to the high-precision audio clock
  // Updates the DOM elements with 0 React virtual DOM diffing / re-renders!
  useEffect(() => {
    const unsubscribe = synth.subscribeTime((curTime, ratio) => {
      if (timeDisplayRef.current) {
        timeDisplayRef.current.innerText = formatTime(curTime);
      }
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${ratio * 100}%`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.left = `calc(${ratio * 100}% - 6px)`;
      }
    });

    return () => unsubscribe();
  }, [synth]);

  return (
    <footer className="glass-panel" style={{
      height: '76px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '8px 20px',
      borderTop: '1px solid var(--border-subtle)',
      zIndex: 20,
    }}>
      {/* 1. Timeline Scrubber Progress Line */}
      <div
        style={{
          width: '100%',
          height: '10px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          const targetTime = ratio * playback.duration;
          onSeek(targetTime);
        }}
      >
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '2px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Progress fill */}
          <div
            ref={progressFillRef}
            style={{
              width: `${playback.duration > 0 ? (playback.currentTime / playback.duration) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
            }}
          />
        </div>

        {/* Thumb */}
        <div
          ref={thumbRef}
          style={{
            position: 'absolute',
            left: `calc(${playback.duration > 0 ? (playback.currentTime / playback.duration) * 100 : 0}% - 6px)`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 0 12px #f59e0b',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* 2. Controls Deck */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
        {/* Left: Timecode Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            ref={timeDisplayRef}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.04em',
            }}
          >
            {formatTime(playback.currentTime)}
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>/</span>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {formatTime(playback.duration)}
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onReset}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Reset to Beginning"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={() => onSeek(Math.max(0, synth.getCurrentScoreTime() - 5))}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Rewind 5s"
          >
            <SkipBack size={15} />
          </button>

          {/* Big Luminous Amber Play/Pause */}
          <button
            onClick={onPlayPause}
            className="btn-lumen-amber"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '1px solid rgba(245, 158, 11, 0.7)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(249, 115, 22, 0.25) 100%)',
              boxShadow: playback.isPlaying
                ? '0 0 24px rgba(245, 158, 11, 0.65)'
                : '0 0 14px rgba(245, 158, 11, 0.3)',
            }}
            title={playback.isPlaying ? 'Pause' : 'Play'}
          >
            {playback.isPlaying ? (
              <Pause size={18} color="#ffffff" />
            ) : (
              <Play size={18} color="#ffffff" style={{ marginLeft: '2px' }} />
            )}
          </button>

          <button
            onClick={() => onSeek(Math.min(playback.duration, synth.getCurrentScoreTime() + 5))}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Forward 5s"
          >
            <SkipForward size={15} />
          </button>

          <button
            onClick={onToggleLoop}
            className="btn-ghost"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: playback.loop ? '#fbbf24' : 'var(--text-dim)',
              borderColor: playback.loop ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)',
            }}
            title="Toggle Loop"
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* Right: Speed & Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Speed Preset Chips */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid var(--border-subtle)',
          }}>
            {[0.75, 1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeedChange(spd)}
                style={{
                  background: playback.playbackRate === spd ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  border: 'none',
                  color: playback.playbackRate === spd ? '#fbbf24' : 'var(--text-muted)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Volume Slider & Mute */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onToggleMute}
              className="btn-ghost"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={playback.isMuted ? 'Unmute' : 'Mute'}
            >
              {playback.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
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
  );
};
