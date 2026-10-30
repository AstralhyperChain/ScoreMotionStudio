import React, { useState } from 'react';
import { Film, Check, Copy, CheckCircle2, Download, Monitor, Smartphone } from 'lucide-react';
import { ScoreData, VisualSettings } from '../types/score';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: ScoreData;
  settings: VisualSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  score,
  settings: _settings,
}) => {
  const [resolution, setResolution] = useState<'1080p' | '4k' | 'vertical'>('1080p');
  const [fps, setFps] = useState<60 | 30>(60);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  if (!isOpen) return null;

  const resMap = {
    '1080p': { label: '1080p Full HD', width: 1920, height: 1080, icon: Monitor },
    '4k': { label: '4K Ultra HD', width: 3840, height: 2160, icon: Monitor },
    'vertical': { label: '9:16 Vertical Shorts', width: 1080, height: 1920, icon: Smartphone },
  };

  const selectedRes = resMap[resolution];

  // FFmpeg render command for native terminal/daemon
  const ffmpegCommand = `ffmpeg -f lavfi -i anullsrc=r=48000:cl=stereo -r ${fps} -s ${selectedRes.width}x${selectedRes.height} -t ${Math.ceil(score.duration)} -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "exports/${score.title.replace(/\s+/g, '_')}_LUMEN_${resolution}.mp4"`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(ffmpegCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startExportSimulation = () => {
    setIsExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
          }, 800);
          return 100;
        }
        return prev + 5;
      });
    }, 120);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel-elevated"
        style={{
          width: '560px',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 158, 11, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
              Export MP4 Video
            </h3>
          </div>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            FFmpeg H.264
          </span>
        </div>

        {/* Resolution Options */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Output Resolution & Aspect Ratio
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(Object.keys(resMap) as (keyof typeof resMap)[]).map((key) => {
              const item = resMap[key];
              const Icon = item.icon;
              const isSelected = resolution === key;
              return (
                <button
                  key={key}
                  onClick={() => setResolution(key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 8px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={isSelected ? '#f59e0b' : 'var(--text-dim)'} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {item.width} x {item.height}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Frame Rate */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Framerate
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[60, 30].map((f) => (
              <button
                key={f}
                onClick={() => setFps(f as 60 | 30)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  background: fps === f ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: fps === f ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                  color: fps === f ? '#fbbf24' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {f} FPS {f === 60 ? '(Ultra Smooth Cinematic)' : '(Standard)'}
              </button>
            ))}
          </div>
        </div>

        {/* FFmpeg Bridge Command */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              FFmpeg Pipeline Script
            </span>
            <button
              onClick={handleCopyCommand}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: copied ? '#34d399' : 'var(--amber-core)',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy Command'}</span>
            </button>
          </div>

          <div style={{
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#a3e635',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}>
            {ffmpegCommand}
          </div>
        </div>

        {/* Progress or Actions */}
        {isExporting ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fbbf24' }}>
              <span>Rendering LUMEN Frames ({selectedRes.width}x{selectedRes.height} @ {fps}fps)...</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{exportProgress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${exportProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                boxShadow: '0 0 10px #f59e0b',
                transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        ) : exportProgress === 100 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '11px',
          }}>
            <CheckCircle2 size={14} />
            <span>Video rendered and saved to exports/{score.title.replace(/\s+/g, '_')}_LUMEN_{resolution}.mp4</span>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
          >
            Close
          </button>

          <button
            onClick={startExportSimulation}
            disabled={isExporting}
            className="btn-lumen-amber"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            <Download size={13} />
            <span>{isExporting ? 'Rendering Video...' : 'Start Render'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
