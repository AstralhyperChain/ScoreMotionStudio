import { ScoreData, ScoreNote, MeasureInfo, MidiTrackInfo } from '../types/score';

/**
 * Professional Pure TypeScript MIDI (SMF 0 & 1) Parser for ScoreMotion Studio
 * Supports multi-track preservation, instrument metadata, CC 64 (Damper/Sustain),
 * tempo changes, velocity sensitivity, and key signatures.
 */
export function parseMidiFile(arrayBuffer: ArrayBuffer, fileName: string): ScoreData {
  if (!arrayBuffer || arrayBuffer.byteLength < 14) {
    throw new Error('The selected file is empty or too small to be a valid MIDI file.');
  }

  const data = new DataView(arrayBuffer);
  let offset = 0;

  // Verify 'MThd' header
  const headerTag = String.fromCharCode(
    data.getUint8(offset++),
    data.getUint8(offset++),
    data.getUint8(offset++),
    data.getUint8(offset++)
  );

  if (headerTag !== 'MThd') {
    throw new Error('Invalid MIDI format: "MThd" header chunk was not found. Please ensure this is a standard .mid or .midi file.');
  }

  const headerLength = data.getUint32(offset);
  offset += 4;
  offset += 2; // skip format (0, 1, or 2)
  const numTracks = data.getUint16(offset);
  offset += 2;
  const timeDivision = data.getUint16(offset);
  offset += 2;

  // Skip any extra header bytes if length > 6
  if (headerLength > 6) {
    offset += (headerLength - 6);
  }

  let microsecondsPerQuarter = 500000; // Default 120 BPM
  let currentBpm = 120;
  let timeSignature: [number, number] = [4, 4];
  let keySignatureName = 'C Major';

  const rawNotes: {
    pitch: number;
    startTick: number;
    endTick: number;
    velocity: number;
    channel: number;
    trackIndex: number;
  }[] = [];

  const trackMetadataList: {
    name: string;
    instrument?: string;
    channel: number;
    noteCount: number;
  }[] = [];

  const pedalEvents: { tick: number; isDown: boolean }[] = [];

  // Parse each track
  for (let t = 0; t < numTracks && offset < data.byteLength; t++) {
    if (offset + 8 > data.byteLength) break;

    const trackTag = String.fromCharCode(
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++)
    );

    if (trackTag !== 'MTrk') {
      // Seek forward if there are unknown chunks
      break;
    }

    const trackLength = data.getUint32(offset);
    offset += 4;
    const trackEnd = Math.min(data.byteLength, offset + trackLength);

    let currentTick = 0;
    let runningStatus = 0;
    let trackName = `Track ${t + 1}`;
    let trackInstrument: string | undefined;
    let trackChannel = 0;
    let trackNoteCount = 0;

    const activeNoteMap = new Map<number, { pitch: number; startTick: number; velocity: number; channel: number }>();

    while (offset < trackEnd) {
      // Read variable-length delta time
      let deltaTime = 0;
      let byte = 0;
      let iterations = 0;
      do {
        if (offset >= data.byteLength) break;
        byte = data.getUint8(offset++);
        deltaTime = (deltaTime << 7) | (byte & 0x7F);
        iterations++;
      } while ((byte & 0x80) && iterations < 5);

      currentTick += deltaTime;
      if (offset >= data.byteLength) break;

      let status = data.getUint8(offset);
      if (status >= 0x80) {
        offset++;
        runningStatus = status;
      } else {
        status = runningStatus;
      }

      const eventType = status & 0xF0;
      const channel = status & 0x0F;
      trackChannel = channel;

      if (eventType === 0x90) {
        // Note On
        if (offset + 1 >= data.byteLength) break;
        const pitch = data.getUint8(offset++);
        const velocity = data.getUint8(offset++);
        const noteKey = (channel << 8) | pitch;

        if (velocity > 0) {
          activeNoteMap.set(noteKey, { pitch, startTick: currentTick, velocity, channel });
        } else {
          // Note on with vel 0 is Note Off
          const active = activeNoteMap.get(noteKey);
          if (active) {
            rawNotes.push({ ...active, endTick: currentTick, trackIndex: t });
            trackNoteCount++;
            activeNoteMap.delete(noteKey);
          }
        }
      } else if (eventType === 0x80) {
        // Note Off
        if (offset + 1 >= data.byteLength) break;
        const pitch = data.getUint8(offset++);
        data.getUint8(offset++);
        const noteKey = (channel << 8) | pitch;
        const active = activeNoteMap.get(noteKey);
        if (active) {
          rawNotes.push({ ...active, endTick: currentTick, trackIndex: t });
          trackNoteCount++;
          activeNoteMap.delete(noteKey);
        }
      } else if (eventType === 0xB0) {
        // Control Change
        if (offset + 1 >= data.byteLength) break;
        const controller = data.getUint8(offset++);
        const value = data.getUint8(offset++);

        // CC 64 = Damper / Sustain Pedal
        if (controller === 64) {
          pedalEvents.push({ tick: currentTick, isDown: value >= 64 });
        }
      } else if (eventType === 0xC0) {
        // Program Change (Instrument)
        if (offset >= data.byteLength) break;
        const program = data.getUint8(offset++);
        const gmInstruments = [
          'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano', 'Honky-tonk Piano',
          'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavi',
          'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone', 'Marimba', 'Xylophone',
        ];
        trackInstrument = gmInstruments[program] || `Instrument ${program + 1}`;
      } else if (eventType === 0xD0) {
        if (offset >= data.byteLength) break;
        offset += 1;
      } else if (eventType === 0xA0 || eventType === 0xE0) {
        if (offset + 1 >= data.byteLength) break;
        offset += 2;
      } else if (status === 0xFF) {
        // Meta Events
        if (offset >= data.byteLength) break;
        const metaType = data.getUint8(offset++);
        let metaLength = 0;
        let mByte = 0;
        do {
          if (offset >= data.byteLength) break;
          mByte = data.getUint8(offset++);
          metaLength = (metaLength << 7) | (mByte & 0x7F);
        } while (mByte & 0x80);

        const metaEnd = Math.min(data.byteLength, offset + metaLength);

        if (metaType === 0x03) {
          // Track Name
          let name = '';
          for (let i = offset; i < metaEnd; i++) {
            name += String.fromCharCode(data.getUint8(i));
          }
          if (name.trim()) trackName = name.trim();
        } else if (metaType === 0x04) {
          // Instrument Name
          let inst = '';
          for (let i = offset; i < metaEnd; i++) {
            inst += String.fromCharCode(data.getUint8(i));
          }
          if (inst.trim()) trackInstrument = inst.trim();
        } else if (metaType === 0x51 && metaLength === 3) {
          // Set Tempo
          const b1 = data.getUint8(offset);
          const b2 = data.getUint8(offset + 1);
          const b3 = data.getUint8(offset + 2);
          microsecondsPerQuarter = (b1 << 16) | (b2 << 8) | b3;
          currentBpm = Math.round(60000000 / microsecondsPerQuarter);
        } else if (metaType === 0x58 && metaLength >= 2) {
          // Time Signature (numerator, denominator as 2^den)
          const num = data.getUint8(offset);
          const den = Math.pow(2, data.getUint8(offset + 1));
          timeSignature = [num, den];
        } else if (metaType === 0x59 && metaLength >= 2) {
          // Key signature (sf: -7 to +7, mi: 0=major, 1=minor)
          const sf = data.getInt8(offset);
          const mi = data.getUint8(offset + 1);
          const majorKeys = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
          const minorKeys = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];
          const keyTable = mi === 1 ? minorKeys : majorKeys;
          const idx = sf + 7;
          keySignatureName = `${keyTable[Math.max(0, Math.min(keyTable.length - 1, idx))]} ${mi === 1 ? 'Minor' : 'Major'}`;
        }

        offset = metaEnd;
      } else if (status === 0xF0 || status === 0xF7) {
        // SysEx
        let sysexLength = 0;
        let sByte = 0;
        do {
          if (offset >= data.byteLength) break;
          sByte = data.getUint8(offset++);
          sysexLength = (sysexLength << 7) | (sByte & 0x7F);
        } while (sByte & 0x80);
        offset = Math.min(data.byteLength, offset + sysexLength);
      }
    }

    // Flush any still-active notes
    for (const active of activeNoteMap.values()) {
      rawNotes.push({ ...active, endTick: currentTick, trackIndex: t });
      trackNoteCount++;
    }

    if (trackNoteCount > 0 || t === 0) {
      trackMetadataList.push({
        name: trackName,
        instrument: trackInstrument,
        channel: trackChannel,
        noteCount: trackNoteCount,
      });
    }
  }

  if (rawNotes.length === 0) {
    throw new Error('No musical notes were found in this MIDI file. It may be an empty sequence or contain only non-note control tracks.');
  }

  // Convert ticks to seconds
  const ticksPerQuarter = (timeDivision & 0x8000) ? 480 : Math.max(24, timeDivision);
  const secondsPerTick = (microsecondsPerQuarter / 1000000) / ticksPerQuarter;

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const sharpSemitones = new Set([1, 3, 6, 8, 10]);
  let maxDuration = 0;

  // Sort notes chronologically
  rawNotes.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);

  const notes: ScoreNote[] = rawNotes.map((rn, idx) => {
    const startTime = rn.startTick * secondsPerTick;
    let duration = Math.max(0.12, (rn.endTick - rn.startTick) * secondsPerTick);

    // If pedal was down during note release, naturally sustain note
    const activePedal = pedalEvents.find((p) => p.tick >= rn.startTick && p.tick <= rn.endTick && p.isDown);
    if (activePedal) {
      duration = Math.max(duration, duration * 1.35);
    }

    if (startTime + duration > maxDuration) {
      maxDuration = startTime + duration;
    }

    const semitone = rn.pitch % 12;
    const noteName = `${noteNames[semitone]}${Math.floor(rn.pitch / 12) - 1}`;
    const accidental = sharpSemitones.has(semitone) ? ('sharp' as const) : undefined;

    return {
      id: `m_${rn.trackIndex}_${idx}`,
      pitch: rn.pitch,
      noteName,
      startTime,
      duration,
      velocity: rn.velocity,
      staff: rn.pitch >= 60 ? 0 : 1,
      voice: (rn.channel % 4) + 1,
      channel: rn.channel,
      trackIndex: rn.trackIndex,
      accidental,
    };
  });

  // Calculate measure markers based on time signature
  const secondsPerBeat = 60 / currentBpm;
  const beatsPerMeasure = timeSignature[0] || 4;
  const secondsPerMeasure = secondsPerBeat * beatsPerMeasure;
  const measures: MeasureInfo[] = [];
  const totalMeasures = Math.ceil(maxDuration / secondsPerMeasure) + 1;

  for (let m = 0; m < totalMeasures; m++) {
    measures.push({
      number: m + 1,
      timeSignature,
      startTime: m * secondsPerMeasure,
      duration: secondsPerMeasure,
    });
  }

  const cleanTitle = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ')
    .trim();

  const tracks: MidiTrackInfo[] = trackMetadataList.map((tm, idx) => ({
    id: idx,
    name: tm.name,
    channel: tm.channel,
    instrument: tm.instrument,
    noteCount: tm.noteCount,
  }));

  return {
    title: cleanTitle,
    composer: 'Imported MIDI Sequence',
    bpm: currentBpm,
    timeSignature,
    keySignature: keySignatureName,
    duration: Math.max(5, maxDuration + 1.5),
    notes,
    measures,
    tracks,
    fileName,
    fileSize: arrayBuffer.byteLength,
  };
}
