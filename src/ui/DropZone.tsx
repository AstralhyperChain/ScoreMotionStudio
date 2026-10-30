import React, { useRef, useState } from 'react';
import { UploadCloud, Music, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseMidiFile } from '../core/midiParser';
import { parseMusicXml } from '../core/musicxmlParser';
import { ScoreData } from '../types/score';

interface DropZoneProps {
  isOpen: boolean;
  onClose: () => void;
  onScoreLoaded: (score: ScoreData) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  isOpen,
  onClose,
  onScoreLoaded,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    try {
      setIsError(false);
      setStatusMessage(`Processing ${file.name}...`);
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'mid' || ext === 'midi') {
        const buffer = await file.arrayBuffer();
        const score = parseMidiFile(buffer, file.name);
        setStatusMessage(`Successfully loaded ${score.notes.length} notes from ${file.name}`);
        setTimeout(() => {
          onScoreLoaded(score);
          onClose();
        }, 600);
      } else if (ext === 'musicxml' || ext === 'xml') {
        const text = await file.text();
        const score = parseMusicXml(text, file.name);
        setStatusMessage(`Successfully loaded ${score.notes.length} notes from ${file.name}`);
        setTimeout(() => {
          onScoreLoaded(score);
          onClose();
        }, 600);
      } else {
        throw new Error('Unsupported format. Please select a .mid, .midi, or .musicxml file.');
      }
    } catch (err: unknown) {
      setIsError(true);
      setStatusMessage(err instanceof Error ? err.message : 'Error reading score file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
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
          width: '540px',
          borderRadius: '14px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 158, 11, 0.15)',
        }}
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            padding: '36px 20px',
            border: isDragging ? '2px dashed #f59e0b' : '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            backgroundColor: isDragging ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(245, 158, 11, 0.4)',
          }}>
            <UploadCloud size={24} color="#f59e0b" />
          </div>

          <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
            Import Musical Score
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: 1.5 }}>
            Drag and drop your <span style={{ color: '#fbbf24' }}>MIDI (.mid)</span> or <span style={{ color: '#34d399' }}>MusicXML (.musicxml)</span> file here, or click to browse
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi,.xml,.musicxml"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
              <Music size={13} color="#f59e0b" />
              <span>Standard MIDI 0/1</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
              <FileCode size={13} color="#10b981" />
              <span>MusicXML Sheet</span>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            padding: '8px 14px',
            borderRadius: '6px',
            background: isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            color: isError ? '#f87171' : '#34d399',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}>
            {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{statusMessage}</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-ghost"
          style={{
            marginTop: '16px',
            padding: '6px 18px',
            borderRadius: '6px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
