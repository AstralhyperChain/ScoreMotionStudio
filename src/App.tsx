import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScoreData, VisualSettings, PlaybackState, RecentProject } from './types/score';
import { getBachPreludeScore, getLumenOvertureScore } from './core/sampleScores';
import { ScoreSynthEngine } from './playback/synthEngine';
import { PianoSamplerStatus } from './playback/pianoSampler';
import { HomePage } from './ui/HomePage';
import { WorkspaceView } from './ui/WorkspaceView';
import { DropZone } from './ui/DropZone';

export const App: React.FC = () => {
  // Master Synthesizer & Hardware Audio Clock (Acoustic Grand Piano Sampler)
  const synthRef = useRef<ScoreSynthEngine>(new ScoreSynthEngine());

  // Navigation View: 'home' | 'workspace' (starts on professional Home screen)
  const [currentView, setCurrentView] = useState<'home' | 'workspace'>('home');

  // Active Score
  const [score, setScore] = useState<ScoreData>(() => getBachPreludeScore());

  // Piano Sampler Status
  const [pianoStatus, setPianoStatus] = useState<PianoSamplerStatus>(() => synthRef.current.getPianoStatus());

  // Recent Projects List (persisted in localStorage)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => {
    const defaultRecents: RecentProject[] = [
      {
        id: 'sample_bach',
        title: 'Prelude in C Major (BWV 846)',
        composer: 'Johann Sebastian Bach',
        duration: 35.8,
        noteCount: 128,
        bpm: 68,
        lastOpened: Date.now() - 3600000,
        isSample: true,
        sampleKey: 'bach',
      },
      {
        id: 'sample_lumen',
        title: 'Concert Overture in C Minor',
        composer: 'ScoreMotion Studio',
        duration: 23.5,
        noteCount: 88,
        bpm: 88,
        lastOpened: Date.now() - 7200000,
        isSample: true,
        sampleKey: 'lumen',
      },
    ];

    try {
      const saved = localStorage.getItem('scoremotion_recent_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return defaultRecents;
  });

  // Playback State
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: score.duration,
    playbackRate: 1.0,
    volume: 0.85,
    isMuted: false,
    loop: false,
  });

  // Visual Settings: Classical Sheet-Music Scoring
  const [settings, setSettings] = useState<VisualSettings>({
    cameraZoom: 1.0,
    staffOpacity: 0.85,
    activeNoteGlow: true,
    showMeasureNumbers: true,
    showStaves: true,
    horizontalScroll: true,
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Initialize and subscribe to Piano Sampler status
  useEffect(() => {
    synthRef.current.initAudioContext();
    const unsub = synthRef.current.subscribePianoStatus((st) => setPianoStatus(st));
    return () => unsub();
  }, []);

  // Keep synth duration in sync with score
  useEffect(() => {
    synthRef.current.setScoreDuration(score.duration);
  }, [score]);

  // Save Recent Projects to localStorage
  const saveRecentProject = useCallback((newScore: ScoreData, isSample: boolean = false, sampleKey?: 'bach' | 'lumen') => {
    setRecentProjects((prev) => {
      const filtered = prev.filter((p) => p.title !== newScore.title);
      const newEntry: RecentProject = {
        id: `proj_${Date.now()}`,
        title: newScore.title,
        composer: newScore.composer,
        duration: newScore.duration,
        noteCount: newScore.notes.length,
        bpm: newScore.bpm,
        lastOpened: Date.now(),
        isSample,
        sampleKey,
      };
      const updated = [newEntry, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('scoremotion_recent_projects', JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  // Open Score into Workspace
  const handleOpenScore = useCallback((newScore: ScoreData, isSample: boolean = false, sampleKey?: 'bach' | 'lumen') => {
    synthRef.current.reset(newScore.duration);
    setScore(newScore);
    setPlayback((prev) => ({
      ...prev,
      currentTime: 0,
      duration: newScore.duration,
      isPlaying: false,
    }));
    saveRecentProject(newScore, isSample, sampleKey);
    setCurrentView('workspace');
  }, [saveRecentProject]);

  // Load Built-in Demo Samples
  const handleOpenSample = useCallback((key: 'bach' | 'lumen') => {
    const sample = key === 'bach' ? getBachPreludeScore() : getLumenOvertureScore();
    handleOpenScore(sample, true, key);
  }, [handleOpenScore]);

  // Transport: Play / Pause
  const handlePlayPause = useCallback(() => {
    setPlayback((prev) => {
      const willPlay = !prev.isPlaying;
      if (willPlay) {
        synthRef.current.play(prev.currentTime, prev.playbackRate);
      } else {
        synthRef.current.pause();
      }
      return { ...prev, isPlaying: willPlay };
    });
  }, []);

  // Transport: Stop (resets to start and pauses)
  const handleStop = useCallback(() => {
    synthRef.current.seek(0);
    synthRef.current.pause();
    setPlayback((prev) => ({ ...prev, currentTime: 0, isPlaying: false }));
  }, []);

  // Transport: Seek
  const handleSeek = useCallback((time: number) => {
    synthRef.current.seek(time);
    setPlayback((prev) => ({ ...prev, currentTime: time }));
  }, []);

  // Transport: Reset to 0
  const handleReset = useCallback(() => {
    synthRef.current.seek(0);
    setPlayback((prev) => ({ ...prev, currentTime: 0 }));
  }, []);

  // Transport: Speed (Tempo multiplier)
  const handleSpeedChange = useCallback((speed: number) => {
    synthRef.current.setPlaybackRate(speed);
    setPlayback((prev) => ({ ...prev, playbackRate: speed }));
  }, []);

  // Transport: Volume
  const handleVolumeChange = useCallback((vol: number) => {
    synthRef.current.setVolume(vol);
    setPlayback((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  // Transport: Mute
  const handleToggleMute = useCallback(() => {
    setPlayback((prev) => {
      const nextMute = !prev.isMuted;
      synthRef.current.setMute(nextMute);
      return { ...prev, isMuted: nextMute };
    });
  }, []);

  // Transport: Loop
  const handleToggleLoop = useCallback(() => {
    setPlayback((prev) => ({ ...prev, loop: !prev.loop }));
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<VisualSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#111215',
    }}>
      {currentView === 'home' ? (
        <HomePage
          pianoStatus={pianoStatus}
          recentProjects={recentProjects}
          onOpenScore={(s) => handleOpenScore(s, false)}
          onOpenSample={handleOpenSample}
        />
      ) : (
        <WorkspaceView
          score={score}
          settings={settings}
          playback={playback}
          synth={synthRef.current}
          onBackToHome={() => setCurrentView('home')}
          onOpenImport={() => setIsImportModalOpen(true)}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onSeek={handleSeek}
          onReset={handleReset}
          onToggleLoop={handleToggleLoop}
          onSpeedChange={handleSpeedChange}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Floating Drag-and-Drop / Import Modal for Workspace */}
      <DropZone
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onScoreLoaded={(newScore) => {
          handleOpenScore(newScore, false);
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
};
