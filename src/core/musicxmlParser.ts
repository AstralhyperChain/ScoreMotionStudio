import { ScoreData, ScoreNote, MeasureInfo } from '../types/score';

/**
 * Parses MusicXML XML string into LUMEN ScoreData
 */
export function parseMusicXml(xmlContent: string, fileName: string): ScoreData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid MusicXML format: XML parsing error');
  }

  const titleNode = xmlDoc.querySelector('work-title') || xmlDoc.querySelector('movement-title');
  const title = titleNode?.textContent || fileName.replace(/\.[^/.]+$/, '');
  const composer = xmlDoc.querySelector('creator[type="composer"]')?.textContent || 'Traditional';

  // Read divisions per quarter note
  const divisions = parseInt(xmlDoc.querySelector('divisions')?.textContent || '4', 10);
  
  // Read tempo (BPM)
  const soundNode = xmlDoc.querySelector('sound[tempo]');
  const bpm = soundNode ? parseFloat(soundNode.getAttribute('tempo') || '120') : 120;
  const secondsPerBeat = 60 / bpm;
  const secondsPerDivision = secondsPerBeat / divisions;

  const notes: ScoreNote[] = [];
  const measures: MeasureInfo[] = [];

  const measureNodes = xmlDoc.querySelectorAll('part measure');
  let currentMeasureTime = 0.5;
  let noteCounter = 0;

  const pitchStepToSemitone: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };

  measureNodes.forEach((measureNode, mIdx) => {
    const measureDuration = 4 * secondsPerBeat; // default fallback
    const measureNum = parseInt(measureNode.getAttribute('number') || `${mIdx + 1}`, 10);

    measures.push({
      number: measureNum,
      timeSignature: [4, 4],
      startTime: currentMeasureTime,
      duration: measureDuration,
    });

    let measureCursorTime = currentMeasureTime;
    const noteNodes = measureNode.querySelectorAll('note');

    noteNodes.forEach((nNode) => {
      const isRest = nNode.querySelector('rest') !== null;
      const durationDivs = parseInt(nNode.querySelector('duration')?.textContent || `${divisions}`, 10);
      const noteDuration = durationDivs * secondsPerDivision;

      if (!isRest) {
        const step = nNode.querySelector('pitch step')?.textContent || 'C';
        const octave = parseInt(nNode.querySelector('pitch octave')?.textContent || '4', 10);
        const alter = parseInt(nNode.querySelector('pitch alter')?.textContent || '0', 10);
        const voice = parseInt(nNode.querySelector('voice')?.textContent || '1', 10);
        const staff = parseInt(nNode.querySelector('staff')?.textContent || '1', 10);

        const midiPitch = (octave + 1) * 12 + (pitchStepToSemitone[step] || 0) + alter;
        const noteName = `${step}${alter > 0 ? '#' : alter < 0 ? 'b' : ''}${octave}`;

        notes.push({
          id: `xml_n_${noteCounter++}`,
          pitch: midiPitch,
          noteName,
          startTime: measureCursorTime,
          duration: Math.max(0.1, noteDuration * 0.95),
          velocity: 85,
          staff: (staff === 2 || midiPitch < 60) ? 1 : 0,
          voice,
        });
      }

      // Check if it's a chord note (shares start time with previous note)
      const isChord = nNode.querySelector('chord') !== null;
      if (!isChord) {
        measureCursorTime += noteDuration;
      }
    });

    currentMeasureTime += measureDuration;
  });

  return {
    title,
    composer,
    bpm,
    timeSignature: [4, 4],
    keySignature: 'C Major',
    duration: Math.max(5, currentMeasureTime + 1.5),
    notes,
    measures,
  };
}
