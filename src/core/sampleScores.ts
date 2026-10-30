import { ScoreData, ScoreNote, MeasureInfo } from '../types/score';

/**
 * Generates a note object with pitch name and accidental calculation
 */
function createNote(
  id: string,
  pitch: number,
  startTime: number,
  duration: number,
  velocity: number = 85,
  staff: 0 | 1 = 0,
  voice: number = 1
): ScoreNote {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const semitone = pitch % 12;
  const noteName = `${noteNames[semitone]}${Math.floor(pitch / 12) - 1}`;
  const accidental = [1, 3, 6, 8, 10].includes(semitone) ? ('sharp' as const) : undefined;

  return {
    id,
    pitch,
    noteName,
    startTime,
    duration,
    velocity,
    staff,
    voice,
    accidental,
  };
}

/**
 * 1. J.S. Bach - Prelude in C Major BWV 846 (First 8 measures)
 */
export function getBachPreludeScore(): ScoreData {
  const bpm = 68;
  const secondsPerBeat = 60 / bpm;
  const sixteenth = secondsPerBeat / 4;
  const notes: ScoreNote[] = [];
  const measures: MeasureInfo[] = [];

  const barChords: number[][] = [
    // Measure 1: C - E - G - c - e (C Major)
    [48, 52, 55, 60, 64],
    // Measure 2: C - D - A - d - f (Dm7/C)
    [48, 50, 57, 62, 65],
    // Measure 3: B - D - G - d - f (G7/B)
    [47, 50, 55, 62, 65],
    // Measure 4: C - E - G - c - e (C Major)
    [48, 52, 55, 60, 64],
    // Measure 5: C - E - A - e - a (Am/C)
    [48, 52, 57, 64, 69],
    // Measure 6: C - D - F# - c - d (D7/C) - contains F# accidental
    [48, 50, 54, 60, 62],
    // Measure 7: B - D - G - d - g (G Major/B)
    [47, 50, 55, 62, 67],
    // Measure 8: B - C - E - c - e (C/B)
    [47, 48, 52, 60, 64],
  ];

  let currentTime = 0.5;

  barChords.forEach((chord, barIdx) => {
    const barStart = currentTime;
    const [b1, b2, m1, h1, h2] = chord;

    measures.push({
      number: barIdx + 1,
      timeSignature: [4, 4],
      startTime: barStart,
      duration: sixteenth * 16,
    });

    for (let rep = 0; rep < 2; rep++) {
      const pattern = [
        { p: b1, dur: sixteenth * 2.5, staff: 1 as const, v: 1 },
        { p: b2, dur: sixteenth * 2.5, staff: 1 as const, v: 2 },
        { p: m1, dur: sixteenth * 1.2, staff: 0 as const, v: 3 },
        { p: h1, dur: sixteenth * 1.2, staff: 0 as const, v: 3 },
        { p: h2, dur: sixteenth * 1.2, staff: 0 as const, v: 3 },
        { p: m1, dur: sixteenth * 1.2, staff: 0 as const, v: 3 },
        { p: h1, dur: sixteenth * 1.2, staff: 0 as const, v: 3 },
        { p: h2, dur: sixteenth * 1.2, staff: 0 as const, v: 3 },
      ];

      let t = currentTime;
      pattern.forEach((item, noteIdx) => {
        notes.push(
          createNote(
            `m${barIdx + 1}_r${rep}_n${noteIdx}`,
            item.p,
            t,
            item.dur,
            item.staff === 1 ? 95 : 78,
            item.staff,
            item.v
          )
        );
        t += sixteenth;
      });

      currentTime += sixteenth * 8;
    }
  });

  return {
    title: 'Prelude in C Major (BWV 846)',
    composer: 'Johann Sebastian Bach',
    bpm,
    timeSignature: [4, 4],
    keySignature: 'C Major',
    duration: currentTime + 1.2,
    notes,
    measures,
  };
}

/**
 * 2. LUMEN Cinematic Overture (Atmospheric Amber/Orange theme)
 */
export function getLumenOvertureScore(): ScoreData {
  const bpm = 88;
  const beat = 60 / bpm;
  const notes: ScoreNote[] = [];
  const measures: MeasureInfo[] = [];

  const chords = [
    { bass: [36, 48], treble: [60, 63, 67, 72], name: 'C minor' },
    { bass: [34, 46], treble: [58, 62, 65, 70], name: 'Bb Major' },
    { bass: [32, 44], treble: [56, 60, 63, 68], name: 'Ab Major' },
    { bass: [31, 43], treble: [55, 59, 62, 67], name: 'G Major' },
  ];

  let currentTime = 0.5;

  chords.forEach((chord, i) => {
    measures.push({
      number: i + 1,
      timeSignature: [4, 4],
      startTime: currentTime,
      duration: beat * 4,
    });

    // Bass sustained notes
    chord.bass.forEach((p, idx) => {
      notes.push(createNote(`c${i}_b${idx}`, p, currentTime, beat * 3.8, 105, 1, 1));
    });

    // Arpeggiated melody line with subtle ties
    for (let step = 0; step < 8; step++) {
      const pitch = chord.treble[step % chord.treble.length] + (step >= 4 ? 12 : 0);
      const noteId = `c${i}_t${step}`;
      notes.push(
        createNote(
          noteId,
          pitch,
          currentTime + step * (beat / 2),
          (beat / 2) * 0.95,
          85 + (step % 2) * 20,
          0,
          2
        )
      );
    }

    currentTime += beat * 4;
  });

  return {
    title: 'LUMEN Cinematic Overture',
    composer: 'ScoreMotion Studio',
    bpm,
    timeSignature: [4, 4],
    keySignature: 'C Minor',
    duration: currentTime + 1.5,
    notes,
    measures,
  };
}
