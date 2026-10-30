import React, { useEffect, useState } from 'react';
import { Sparkles, Upload, Video, Music2, FolderOpen, Sun, Disc3 } from 'lucide-react';
import { ScoreData } from '../types/score';
import { ScoreSynthEngine } from '../playback/synthEngine';
import { PianoSamplerStatus } from '../playback/pianoSampler';

interface HeaderProps {
  score: ScoreData;
  synth: ScoreSynthEngine;
  onOpenSample: (sampleKey: 'bach' | 'lumen') => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  score,
  synth,
  onOpenSample,
  onOpenImport,
  onOpenExport,
}) => {
  const [pianoStatus, setPianoStatus] = useState<PianoSamplerStatus>(() => synth.getPianoStatus());

  useEffect(() => {
    const unsub = synth.subscribePianoStatus((st) => setPianoStatus(st));
    return () => unsub();
  }, [synth]);

  return (
    <header className="glass-panel" style={{
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      borderBottom: '1px solid var(--border-subtle)',
      zIndex: 20,
    }}>
      {/* Brand & Engine Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 800,
          letterSpacing: '0.12em',
          fontSize: '14px',
          color: '#ffffff',
          textTransform: 'uppercase',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(245, 158, 11, 0.45)',
          }}>
            <Music2 size={16} color="#ffffff" />
          </div>
          <span>ScoreMotion</span>
          <span style={{ color: 'var(--amber-core)', fontWeight: 600 }}>Studio</span>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}>
          <Sparkles size={11} />
          <span>LUMEN ENGINE</span>
        </div>

        {/* Real Acoustic Grand Piano Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 9px',
          borderRadius: '12px',
          background: pianoStatus.isLoaded ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: pianoStatus.isLoaded ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
          color: pianoStatus.isLoaded ? '#34d399' : '#fbbf24',
          fontSize: '10px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: pianoStatus.isLoaded ? '#10b981' : '#f59e0b',
            boxShadow: `0 0 6px ${pianoStatus.isLoaded ? '#10b981' : '#f59e0b'}`,
          }} />
          {pianoStatus.isLoaded ? (
            <span>Acoustic Grand Piano (FluidR3 • 88 Keys)</span>
          ) : pianoStatus.isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Disc3 size={11} className="spin" />
              <span>Loading Piano ({pianoStatus.loadProgress}%)</span>
            </span>
          ) : (
            <span>Fallback Synth</span>
          )}
        </div>
      </div>

      {/* Active Score Metadata */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '4px 14px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f3f4f6' }}>
          {score.title}
        </div>
        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-dim)' }} />
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {score.composer}
        </div>
        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-dim)' }} />
        <div style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          padding: '1px 6px',
          borderRadius: '4px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
        }}>
          {score.bpm} BPM
        </div>
        <div style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-dim)',
        }}>
          {score.notes.length} notes
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Sample Loaders */}
        <button
          onClick={() => onOpenSample('bach')}
          className="btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Load J.S. Bach - Prelude in C Major"
        >
          <FolderOpen size={13} />
          <span>Bach Prelude</span>
        </button>

        <button
          onClick={() => onOpenSample('lumen')}
          className="btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Load LUMEN Cinematic Overture"
        >
          <Sun size={13} />
          <span>Lumen Overture</span>
        </button>

        {/* Import MIDI / MusicXML */}
        <button
          onClick={onOpenImport}
          className="btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Upload size={13} />
          <span>Import Score</span>
        </button>

        {/* Export Video */}
        <button
          onClick={onOpenExport}
          className="btn-lumen-amber"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Video size={13} />
          <span>Export MP4</span>
        </button>
      </div>
    </header>
  );
};
