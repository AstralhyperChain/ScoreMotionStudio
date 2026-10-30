/**
 * High-Fidelity Polyphonic Sampled Acoustic Grand Piano Engine
 *
 * Source: Fluid (R3) General MIDI SoundFont (Acoustic Grand Piano)
 * Recorded from concert grand piano, 88 chromatic keys (A0 to C8).
 * License: Fluid SoundFont License / Creative Commons Attribution 3.0 / MIT wrapper.
 */

export interface PianoSamplerStatus {
  isLoaded: boolean;
  isLoading: boolean;
  loadProgress: number; // 0 to 100
  sampleCount: number;
  error: string | null;
}

export class ScorePianoSampler {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private audioBuffers: Map<number, AudioBuffer> = new Map();
  private activeVoices: Map<number, { source: AudioBufferSourceNode; gainNode: GainNode; startTime: number; noteId: string }> = new Map();

  // Sustain Pedal (MIDI CC 64) State
  private isSustainPedalDown: boolean = false;
  private sustainedNotes: Set<number> = new Set();

  private status: PianoSamplerStatus = {
    isLoaded: false,
    isLoading: false,
    loadProgress: 0,
    sampleCount: 0,
    error: null,
  };

  private statusListeners: Set<(status: PianoSamplerStatus) => void> = new Set();

  constructor(ctx: AudioContext, masterGain: GainNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
  }

  public getStatus(): PianoSamplerStatus {
    return { ...this.status };
  }

  public subscribeStatus(listener: (status: PianoSamplerStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus() {
    const current = this.getStatus();
    for (const listener of this.statusListeners) {
      listener(current);
    }
  }

  /**
   * Converts MIDI pitch (21 to 108) to SoundFont note name (e.g. 60 -> "C4", 61 -> "Db4")
   */
  public static pitchToNoteName(pitch: number): string {
    const names = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const note = names[pitch % 12];
    return `${note}${octave}`;
  }

  /**
   * Converts SoundFont note name (e.g. "C4", "Db4", "F#4") to MIDI pitch
   */
  public static noteNameToPitch(name: string): number {
    const match = name.match(/^([A-Ga-g])([b#]?)(-?\d+)$/);
    if (!match) return 60;
    const [, letter, accidental, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const baseMap: Record<string, number> = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
    };
    let semitone = baseMap[letter.toUpperCase()] || 0;
    if (accidental === '#') semitone += 1;
    if (accidental === 'b') semitone -= 1;
    return (octave + 1) * 12 + semitone;
  }

  /**
   * Asynchronously loads the acoustic grand piano soundfont from /soundfonts/acoustic_grand_piano.json
   */
  public async loadSamples(): Promise<boolean> {
    if (this.status.isLoaded || this.status.isLoading) return this.status.isLoaded;

    this.status.isLoading = true;
    this.status.loadProgress = 5;
    this.status.error = null;
    this.notifyStatus();

    try {
      // 1. Fetch JSON dictionary containing 88 base64-encoded MP3 recordings
      const response = await fetch('/soundfonts/acoustic_grand_piano.json');
      if (!response.ok) {
        throw new Error(`Failed to load acoustic grand piano soundfont (HTTP ${response.status})`);
      }

      this.status.loadProgress = 25;
      this.notifyStatus();

      const soundfontData: Record<string, string> = await response.json();
      const keys = Object.keys(soundfontData);
      const totalKeys = keys.length;

      if (totalKeys === 0) {
        throw new Error('Acoustic piano soundfont data is empty');
      }

      // 2. Decode MP3 base64 strings into AudioBuffers
      let decodedCount = 0;

      for (const noteName of keys) {
        const pitch = ScorePianoSampler.noteNameToPitch(noteName);
        const dataUri = soundfontData[noteName];

        try {
          // Convert data URI to ArrayBuffer
          const base64Data = dataUri.replace(/^data:audio\/(?:mp3|ogg|wav);base64,/, '');
          const binaryString = atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Decode with AudioContext
          const audioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
          this.audioBuffers.set(pitch, audioBuffer);
        } catch (decodeErr) {
          console.warn(`Failed to decode piano sample for note ${noteName}:`, decodeErr);
        }

        decodedCount++;
        // Update progress every 10 notes
        if (decodedCount % 10 === 0 || decodedCount === totalKeys) {
          this.status.loadProgress = 25 + Math.floor((decodedCount / totalKeys) * 75);
          this.status.sampleCount = this.audioBuffers.size;
          this.notifyStatus();
        }
      }

      this.status.isLoaded = true;
      this.status.isLoading = false;
      this.status.loadProgress = 100;
      this.status.sampleCount = this.audioBuffers.size;
      this.notifyStatus();
      return true;
    } catch (err: unknown) {
      console.error('Error loading acoustic piano soundfont:', err);
      this.status.isLoading = false;
      this.status.error = err instanceof Error ? err.message : 'Unknown soundfont error';
      this.notifyStatus();
      return false;
    }
  }

  /**
   * Polyphonic Acoustic Note Trigger with Velocity & Natural Attack/Decay
   */
  public triggerNote(
    pitch: number,
    velocity: number,
    duration: number,
    audioTimestamp: number,
    noteId: string = ''
  ): { stop: (time: number) => void } | null {
    if (!this.status.isLoaded || this.audioBuffers.size === 0) {
      return null; // Fallback to synth if not loaded
    }

    // Find sample (direct match or pitch-shift from nearest available note)
    let buffer = this.audioBuffers.get(pitch);
    let playbackRate = 1.0;

    if (!buffer) {
      // Find closest loaded pitch
      let closestPitch = -1;
      let minDiff = 999;
      for (const p of this.audioBuffers.keys()) {
        const diff = Math.abs(p - pitch);
        if (diff < minDiff) {
          minDiff = diff;
          closestPitch = p;
        }
      }

      if (closestPitch !== -1) {
        buffer = this.audioBuffers.get(closestPitch);
        playbackRate = Math.pow(2, (pitch - closestPitch) / 12);
      }
    }

    if (!buffer) return null;

    // 1. Create Buffer Source
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, audioTimestamp);

    // 2. Natural Acoustic Velocity & Dynamic Gain
    const gainNode = this.ctx.createGain();
    // Non-linear acoustic velocity curve (human ear piano loudness perception)
    const normalizedVel = Math.max(0.1, Math.min(1.0, velocity / 127));
    const dynamicGain = Math.pow(normalizedVel, 1.35) * 0.95;

    gainNode.gain.setValueAtTime(dynamicGain, audioTimestamp);

    // 3. Connect to master
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // 4. Start playback at precise hardware time
    source.start(audioTimestamp);

    // 5. Natural Piano Damper Release Envelope
    // Piano notes don't cut off abruptly; when key is released, damper felt touches string (takes 80-140ms)
    const noteEndTime = audioTimestamp + duration;
    
    // If sustain pedal is NOT down, release damper at noteEndTime
    if (!this.isSustainPedalDown) {
      gainNode.gain.setValueAtTime(dynamicGain, noteEndTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEndTime + 0.12);
      source.stop(noteEndTime + 0.15);
    } else {
      // With sustain pedal, string rings out naturally (up to sample buffer duration)
      this.sustainedNotes.add(pitch);
    }

    const voice = {
      source,
      gainNode,
      startTime: audioTimestamp,
      noteId,
    };
    this.activeVoices.set(pitch, voice);

    const stopController = {
      stop: (stopTime: number) => {
        try {
          if (!this.isSustainPedalDown) {
            gainNode.gain.setValueAtTime(gainNode.gain.value, stopTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.10);
            source.stop(stopTime + 0.12);
          }
        } catch {
          // Ignore if already stopped
        }
      },
    };

    return stopController;
  }

  /**
   * Set Sustain / Damper Pedal (MIDI CC 64)
   */
  public setSustainPedal(isDown: boolean, audioTimestamp?: number) {
    this.isSustainPedalDown = isDown;
    const now = audioTimestamp ?? this.ctx.currentTime;

    // When sustain pedal is released, all ringing sustained notes are damped
    if (!isDown) {
      for (const pitch of this.sustainedNotes) {
        const voice = this.activeVoices.get(pitch);
        if (voice) {
          try {
            voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
            voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
            voice.source.stop(now + 0.16);
          } catch {
            // Ignore if already stopped
          }
          this.activeVoices.delete(pitch);
        }
      }
      this.sustainedNotes.clear();
    }
  }

  public stopAll(audioTimestamp?: number) {
    const now = audioTimestamp ?? this.ctx.currentTime;
    for (const voice of this.activeVoices.values()) {
      try {
        voice.gainNode.gain.setValueAtTime(0.0001, now);
        voice.source.stop(now + 0.05);
      } catch {
        // Already stopped
      }
    }
    this.activeVoices.clear();
    this.sustainedNotes.clear();
  }
}
