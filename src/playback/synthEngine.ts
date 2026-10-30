import { ScoreNote } from '../types/score';
import { ScorePianoSampler, PianoSamplerStatus } from './pianoSampler';

export type PlaybackStatus = 'stopped' | 'playing' | 'paused';
export type TimeListener = (currentTime: number, progressRatio: number) => void;

/**
 * ScoreAudioEngine:
 * Unified Hardware Web Audio Engine with Realistic Sampled Acoustic Grand Piano,
 * MIDI CC64 Sustain Pedal Support, Polyphony & Drift-Free Master Clock for LUMEN.
 */
export class ScoreSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  // Acoustic Grand Piano Sampler Engine
  private pianoSampler: ScorePianoSampler | null = null;

  // Master Audio Clock State
  private status: PlaybackStatus = 'stopped';
  private startAudioTime: number = 0;
  private startScoreTime: number = 0;
  private playbackRate: number = 1.0;
  private scoreDuration: number = 30.0;

  // Scheduled notes tracking to avoid re-triggering
  private scheduledNoteIds: Set<string> = new Set();
  private activeOscillators: { stop: (time: number) => void }[] = [];

  // Lightweight time subscribers (avoids React re-renders)
  private timeListeners: Set<TimeListener> = new Set();

  constructor() {
    // Lazily initialized on first interaction
  }

  public initAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Initialize Acoustic Grand Piano Sampler
      this.pianoSampler = new ScorePianoSampler(this.ctx, this.masterGain);
      // Asynchronously begin preloading real acoustic grand piano samples
      this.pianoSampler.loadSamples().catch((err) => {
        console.warn('Piano sampler auto-load failed, using synthesis fallback:', err);
      });
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getPianoStatus(): PianoSamplerStatus {
    if (!this.pianoSampler) {
      return {
        isLoaded: false,
        isLoading: false,
        loadProgress: 0,
        sampleCount: 0,
        error: null,
      };
    }
    return this.pianoSampler.getStatus();
  }

  public subscribePianoStatus(listener: (status: PianoSamplerStatus) => void): () => void {
    if (!this.pianoSampler) {
      this.initAudioContext();
    }
    return this.pianoSampler!.subscribeStatus(listener);
  }

  public setScoreDuration(duration: number) {
    this.scoreDuration = Math.max(1, duration);
  }

  public subscribeTime(listener: TimeListener): () => void {
    this.timeListeners.add(listener);
    return () => this.timeListeners.delete(listener);
  }

  public notifyTime(curTime: number) {
    const ratio = Math.max(0, Math.min(1, curTime / this.scoreDuration));
    for (const listener of this.timeListeners) {
      listener(curTime, ratio);
    }
  }

  /**
   * Master Hardware-Synchronized Clock
   */
  public getCurrentScoreTime(): number {
    if (this.status !== 'playing' || !this.ctx) {
      return this.startScoreTime;
    }
    const elapsedAudio = this.ctx.currentTime - this.startAudioTime;
    const currentScoreTime = this.startScoreTime + (elapsedAudio * this.playbackRate);
    return Math.max(0, currentScoreTime);
  }

  public getStatus(): PlaybackStatus {
    return this.status;
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  /**
   * Start / Resume Playback synchronized to AudioContext hardware clock
   */
  public play(fromTime?: number, rate?: number) {
    const ctx = this.initAudioContext();
    if (rate !== undefined) this.playbackRate = rate;

    const startTime = fromTime !== undefined ? fromTime : this.startScoreTime;
    this.startScoreTime = Math.max(0, Math.min(this.scoreDuration, startTime));
    this.startAudioTime = ctx.currentTime;
    this.status = 'playing';

    // Clear notes scheduled past the current resume position
    this.scheduledNoteIds.clear();
  }

  /**
   * Pause Playback - captures exact frozen clock time
   */
  public pause() {
    if (this.status === 'playing') {
      this.startScoreTime = this.getCurrentScoreTime();
    }
    this.status = 'paused';
    this.stopAllActiveVoices();
    this.scheduledNoteIds.clear();
  }

  /**
   * Seek to new timecode without drift
   */
  public seek(targetTime: number) {
    const clampedTime = Math.max(0, Math.min(this.scoreDuration, targetTime));
    this.stopAllActiveVoices();
    this.scheduledNoteIds.clear();

    if (this.status === 'playing' && this.ctx) {
      this.startScoreTime = clampedTime;
      this.startAudioTime = this.ctx.currentTime;
    } else {
      this.startScoreTime = clampedTime;
    }

    this.notifyTime(clampedTime);
  }

  /**
   * Adjust Playback Rate (Tempo multiplier) with zero clock leap or drift
   */
  public setPlaybackRate(rate: number) {
    if (rate <= 0) return;
    if (this.status === 'playing' && this.ctx) {
      const currentScoreTime = this.getCurrentScoreTime();
      this.startScoreTime = currentScoreTime;
      this.startAudioTime = this.ctx.currentTime;
    }
    this.playbackRate = rate;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  /**
   * Sustain Pedal (MIDI CC 64)
   */
  public setSustainPedal(isDown: boolean) {
    if (this.pianoSampler) {
      this.pianoSampler.setSustainPedal(isDown);
    }
  }

  /**
   * High-Precision Audio Scheduler
   * Runs in the animation/audio loop with a 180ms lookahead window
   */
  public updateScheduler(notes: ScoreNote[]) {
    if (this.status !== 'playing' || !this.ctx || this.isMuted) return;

    const currentScoreTime = this.getCurrentScoreTime();
    const lookaheadSec = 0.18; // 180ms lookahead
    const windowEnd = currentScoreTime + (lookaheadSec * this.playbackRate);

    for (const note of notes) {
      if (
        note.startTime >= currentScoreTime - 0.05 &&
        note.startTime <= windowEnd &&
        !this.scheduledNoteIds.has(note.id)
      ) {
        this.scheduledNoteIds.add(note.id);

        // Calculate exact AudioContext schedule timestamp
        const timeUntilNote = (note.startTime - currentScoreTime) / this.playbackRate;
        const targetAudioTime = this.ctx.currentTime + Math.max(0, timeUntilNote);

        this.scheduleNoteAudio(note.pitch, note.velocity, note.duration / this.playbackRate, targetAudioTime, note.id);
      }
    }
  }

  /**
   * Schedules note playback using Acoustic Grand Piano Sampler (with Synth fallback)
   */
  private scheduleNoteAudio(
    pitch: number,
    velocity: number,
    duration: number,
    audioTimestamp: number,
    noteId: string
  ) {
    if (!this.ctx || !this.masterGain) return;

    // 1. Try Realistic Acoustic Grand Piano Sampler First
    if (this.pianoSampler && this.pianoSampler.getStatus().isLoaded) {
      const voice = this.pianoSampler.triggerNote(pitch, velocity, duration, audioTimestamp, noteId);
      if (voice) {
        this.activeOscillators.push(voice);
        return;
      }
    }

    // 2. High-Fidelity Synthesizer Fallback (Warm Dual Oscillator)
    this.scheduleFallbackSynthNote(pitch, velocity, duration, audioTimestamp);
  }

  /**
   * Fallback Sound Engine: Dual-oscillator warmth when piano samples are downloading or unavailable
   */
  private scheduleFallbackSynthNote(pitch: number, velocity: number, duration: number, audioTimestamp: number) {
    if (!this.ctx || !this.masterGain) return;

    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    const gainFactor = (velocity / 127) * 0.22;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, audioTimestamp);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.0, audioTimestamp);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(10000, freq * 3.5), audioTimestamp);

    noteGain.gain.setValueAtTime(0.0001, audioTimestamp);
    noteGain.gain.linearRampToValueAtTime(gainFactor, audioTimestamp + 0.012);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, audioTimestamp + Math.max(0.2, duration));

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(audioTimestamp);
    osc2.start(audioTimestamp);

    const stopTime = audioTimestamp + duration + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);

    const voice = {
      stop: (t: number) => {
        try {
          noteGain.gain.setValueAtTime(0.0001, t);
          osc1.stop(t);
          osc2.stop(t);
        } catch {
          // Already stopped
        }
      },
    };
    this.activeOscillators.push(voice);

    setTimeout(() => {
      const idx = this.activeOscillators.indexOf(voice);
      if (idx !== -1) this.activeOscillators.splice(idx, 1);
    }, (duration + 0.2) * 1000);
  }

  /**
   * Direct Note Trigger for testing/preview
   */
  public triggerNote(pitch: number, velocity: number = 80, duration: number = 0.5) {
    const ctx = this.initAudioContext();
    this.scheduleNoteAudio(pitch, velocity, duration, ctx.currentTime, `test_${Date.now()}`);
  }

  private stopAllActiveVoices() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const voice of this.activeOscillators) {
      voice.stop(now);
    }
    this.activeOscillators = [];
    if (this.pianoSampler) {
      this.pianoSampler.stopAll(now);
    }
  }

  public reset(duration: number) {
    this.pause();
    this.scoreDuration = Math.max(1, duration);
    this.startScoreTime = 0;
    this.notifyTime(0);
  }
}
