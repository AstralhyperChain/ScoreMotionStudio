import React, { useRef, useState } from 'react';
import {
  Upload,
  FolderOpen,
  Music,
  Clock,
  Sparkles,
  Volume2,
  FileText,
  AlertCircle,
  Disc3,
  Sliders,
} from 'lucide-react';
import { ScoreData, RecentProject } from '../types/score';
import { parseMidiFile } from '../core/midiParser';
import { PianoSamplerStatus } from '../playback/pianoSampler';

interface HomePageProps {
  pianoStatus: PianoSamplerStatus;
  recentProjects: RecentProject[];
  onOpenScore: (score: ScoreData) => void;
  onOpenSample: (sampleKey: 'bach' | 'lumen') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  pianoStatus,
  recentProjects,
  onOpenScore,
  onOpenSample,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    try {
      setErrorMessage(null);
      setIsLoadingFile(true);
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext !== 'mid' && ext !== 'midi') {
        throw new Error('Please select a valid MIDI file (.mid or .midi).');
      }

      const buffer = await file.arrayBuffer();
      const parsedScore = parseMidiFile(buffer, file.name);

      setIsLoadingFile(false);
      onOpenScore(parsedScore);
    } catch (err: unknown) {
      setIsLoadingFile(false);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse MIDI file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#111215',
        color: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      }}
    >
      {/* Top Professional Header Bar */}
      <header style={{
        height: '60px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        backgroundColor: 'rgba(18, 19, 23, 0.85)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '6px',
            backgroundColor: '#d4af37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)',
          }}>
            <Music size={16} color="#111215" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}>
              ScoreMotion <span style={{ color: '#d4af37' }}>Studio</span>
            </div>
          </div>
        </div>

        {/* Acoustic Grand Piano Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '20px',
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
            <span>Concert Grand Piano (88 Keys Ready)</span>
          ) : pianoStatus.isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Disc3 size={11} className="spin" />
              <span>Loading Piano Samples ({pianoStatus.loadProgress}%)</span>
            </span>
          ) : (
            <span>Piano Engine Standby</span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        padding: '48px 32px 64px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '48px',
      }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', paddingTop: '16px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#ffffff',
            marginBottom: '10px',
            textTransform: 'uppercase',
          }}>
            ScoreMotion Studio
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#a0a3ad',
            fontWeight: 400,
            letterSpacing: '0.02em',
            marginBottom: '36px',
          }}>
            Your music. Your score. Your creativity.
          </p>

          {/* Central Action Buttons & Drop Target */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              padding: '36px 28px',
              borderRadius: '12px',
              backgroundColor: isDragging ? 'rgba(212, 175, 55, 0.08)' : 'rgba(24, 25, 30, 0.75)',
              border: isDragging ? '2px dashed #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* Large Central Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 36px',
                borderRadius: '8px',
                backgroundColor: '#d4af37',
                border: 'none',
                color: '#111215',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(212, 175, 55, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5c158')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d4af37')}
            >
              <Upload size={18} strokeWidth={2.4} />
              <span>IMPORT MIDI</span>
            </button>

            <div style={{ fontSize: '13px', color: '#888d9a' }}>
              Drag and drop any <strong style={{ color: '#d4af37' }}>.mid</strong> or <strong style={{ color: '#d4af37' }}>.midi</strong> file here, or click to browse
            </div>

            {/* Secondary Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSample('bach');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e4e6eb',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
              >
                <FolderOpen size={14} color="#d4af37" />
                <span>Open Bach Prelude Demo</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSample('lumen');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e4e6eb',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
              >
                <Sparkles size={14} color="#d4af37" />
                <span>Open Concert Overture Demo</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mid,.midi"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '10px 18px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoadingFile && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '10px 18px',
              borderRadius: '6px',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#e5c158',
              fontSize: '13px',
            }}>
              <Disc3 size={16} className="spin" />
              <span>Reading and analyzing MIDI tracks...</span>
            </div>
          )}
        </section>

        {/* Section: Recent Projects */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '8px',
          }}>
            <Clock size={16} color="#d4af37" />
            <h2 style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}>
              Recent Projects
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px',
          }}>
            {recentProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  if (proj.sampleKey) {
                    onOpenSample(proj.sampleKey);
                  }
                }}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(24, 25, 30, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(32, 34, 42, 0.85)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(24, 25, 30, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>
                    {proj.title}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    color: '#e5c158',
                  }}>
                    {proj.bpm} BPM
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#8c909e' }}>
                  {proj.composer}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '11px',
                  color: '#6c717e',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: '4px',
                }}>
                  <span>{formatDuration(proj.duration)}</span>
                  <span>•</span>
                  <span>{proj.noteCount} notes</span>
                  <span>•</span>
                  <span>Grand Piano</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Getting Started */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '8px',
          }}>
            <FileText size={16} color="#d4af37" />
            <h2 style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}>
              Getting Started
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {/* Guide Card 1 */}
            <div style={{
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: 'rgba(24, 25, 30, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#d4af37',
              }}>
                <Upload size={16} />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6', marginBottom: '6px' }}>
                1. Import Any MIDI Sequence
              </h3>
              <p style={{ fontSize: '12px', color: '#8c909e', lineHeight: 1.5 }}>
                Drag and drop your standard Format 0 or Format 1 MIDI file. Tracks, polyphony, tempo changes, and velocity dynamics are automatically detected.
              </p>
            </div>

            {/* Guide Card 2 */}
            <div style={{
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: 'rgba(24, 25, 30, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#34d399',
              }}>
                <Volume2 size={16} />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6', marginBottom: '6px' }}>
                2. Authentic Acoustic Grand Piano
              </h3>
              <p style={{ fontSize: '12px', color: '#8c909e', lineHeight: 1.5 }}>
                Hear your music through a genuine 88-key concert grand piano sample library with velocity sensitivity, natural damper release, and sustain pedal support.
              </p>
            </div>

            {/* Guide Card 3 */}
            <div style={{
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: 'rgba(24, 25, 30, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#60a5fa',
              }}>
                <Sliders size={16} />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6', marginBottom: '6px' }}>
                3. Classical Sheet Music View
              </h3>
              <p style={{ fontSize: '12px', color: '#8c909e', lineHeight: 1.5 }}>
                View your score on a traditional Grand Staff with smooth synchronized scrolling, elegant note tracking, and precise measure barlines.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        height: '42px',
        padding: '0 32px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#636875',
        backgroundColor: '#0e0f12',
      }}>
        <span>ScoreMotion Studio • Professional Sheet-Music & Acoustic Piano System</span>
        <span>FluidR3 Grand Piano Engine • Web Audio Hardware Clock</span>
      </footer>
    </div>
  );
};
