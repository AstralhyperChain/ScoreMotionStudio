import { ScoreData, VisualSettings, ScoreNote } from '../types/score';

/**
 * Professional Classical Sheet-Music Renderer for ScoreMotion Studio
 *
 * Designed for clarity, elegance, and musical accuracy:
 * - Traditional Grand Staff (Treble & Bass)
 * - Classical noteheads, stems, ledger lines, accidentals, and measures
 * - Refined warm gold note illumination synchronized with acoustic piano playback
 * - Smooth horizontal score scrolling
 * - Clean, non-distracting notation without flashy cartoon particles or neon blur
 */
export class ScoreMotionRenderer {
  /**
   * Converts MIDI pitch (21 to 108) to vertical Y pixel on the Grand Staff
   */
  public pitchToY(pitch: number, staffCenterY: number, lineSpacing: number): { y: number; staff: 0 | 1; ledgerLines: number[] } {
    const semitonesFromC4 = pitch - 60;
    const diatonicStep = Math.round(semitonesFromC4 * (7 / 12));

    const trebleStaffY = staffCenterY - 80;
    const bassStaffY = staffCenterY + 80;

    let y: number;
    let staff: 0 | 1 = 0;
    const ledgerLines: number[] = [];

    if (pitch >= 60) {
      staff = 0;
      const stepOffsetFromB4 = diatonicStep - 6; // B4 is middle line
      y = trebleStaffY - (stepOffsetFromB4 * (lineSpacing / 2));

      // Ledger lines for Treble
      if (pitch === 60) {
        ledgerLines.push(trebleStaffY + 3 * lineSpacing); // Middle C
      } else if (pitch > 79) { // Above G5
        const highestLine = trebleStaffY - 2 * lineSpacing;
        for (let ly = highestLine - lineSpacing; ly >= y - 1; ly -= lineSpacing) {
          ledgerLines.push(ly);
        }
      }
    } else {
      staff = 1;
      const stepOffsetFromD3 = diatonicStep - (-5); // D3 is middle line
      y = bassStaffY - (stepOffsetFromD3 * (lineSpacing / 2));

      // Ledger lines for Bass
      if (pitch < 43) { // Below G2
        const lowestLine = bassStaffY + 2 * lineSpacing;
        for (let ly = lowestLine + lineSpacing; ly <= y + 1; ly += lineSpacing) {
          ledgerLines.push(ly);
        }
      }
    }

    return { y, staff, ledgerLines };
  }

  /**
   * Main Render Pass
   */
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    score: ScoreData,
    currentTime: number,
    settings: VisualSettings
  ) {
    const zoom = settings.cameraZoom || 1.0;
    const lineSpacing = 13 * zoom;
    const pixelsPerSecond = 130 * zoom;
    const playheadX = width * 0.28;
    const staffCenterY = height / 2;

    // 1. Dark Charcoal Slate Concert Hall Background
    ctx.fillStyle = '#121317';
    ctx.fillRect(0, 0, width, height);

    // Subtle center parchment shading for depth
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.3,
      width / 2, height / 2, Math.max(width, height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(26, 28, 35, 0.4)');
    vignette.addColorStop(1, 'rgba(10, 11, 14, 0.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 2. Grand Staff (Treble and Bass lines)
    if (settings.showStaves) {
      this.drawGrandStaff(ctx, width, staffCenterY, lineSpacing, settings.staffOpacity);
    }

    // 3. Measure Barlines & Numbers
    this.drawMeasures(
      ctx,
      width,
      height,
      score,
      currentTime,
      pixelsPerSecond,
      playheadX,
      staffCenterY,
      lineSpacing,
      settings.showMeasureNumbers
    );

    // 4. Classical Notes, Stems, Accidentals, and Highlighting
    this.drawClassicalNotes(
      ctx,
      score.notes,
      currentTime,
      pixelsPerSecond,
      playheadX,
      staffCenterY,
      lineSpacing,
      settings.activeNoteGlow
    );

    // 5. Refined Thin Playhead Needle
    this.drawRefinedPlayhead(ctx, playheadX, staffCenterY, lineSpacing);
  }

  /**
   * Draws the traditional 5-line Treble and 5-line Bass staves
   */
  private drawGrandStaff(
    ctx: CanvasRenderingContext2D,
    width: number,
    staffCenterY: number,
    lineSpacing: number,
    opacity: number
  ) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * opacity})`;
    ctx.lineWidth = 1.0;

    const trebleCenter = staffCenterY - 80;
    const bassCenter = staffCenterY + 80;

    ctx.beginPath();
    // Treble 5 lines
    for (let i = -2; i <= 2; i++) {
      const y = trebleCenter + i * lineSpacing;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    // Bass 5 lines
    for (let i = -2; i <= 2; i++) {
      const y = bassCenter + i * lineSpacing;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Initial system brace line on the left
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)'; // subtle gold brace
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(28, trebleCenter - 2 * lineSpacing);
    ctx.lineTo(28, bassCenter + 2 * lineSpacing);
    ctx.stroke();

    // Traditional Clef glyphs
    ctx.fillStyle = 'rgba(240, 236, 228, 0.65)';
    ctx.font = '34px "JetBrains Mono", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝄞', 48, trebleCenter);
    ctx.fillText('𝄢', 48, bassCenter);

    ctx.restore();
  }

  /**
   * Draws measure barlines and measure numbers
   */
  private drawMeasures(
    ctx: CanvasRenderingContext2D,
    width: number,
    _height: number,
    score: ScoreData,
    currentTime: number,
    pixelsPerSecond: number,
    playheadX: number,
    staffCenterY: number,
    lineSpacing: number,
    showNumbers: boolean
  ) {
    if (!score.measures || score.measures.length === 0) return;

    const trebleCenter = staffCenterY - 80;
    const bassCenter = staffCenterY + 80;
    const topY = trebleCenter - 2 * lineSpacing;
    const bottomY = bassCenter + 2 * lineSpacing;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.0;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.55)'; // subtle gold for measure numbers
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';

    ctx.beginPath();
    for (const m of score.measures) {
      const mX = playheadX + (m.startTime - currentTime) * pixelsPerSecond;
      if (mX >= -30 && mX <= width + 30) {
        ctx.moveTo(mX, topY);
        ctx.lineTo(mX, bottomY);

        if (showNumbers) {
          ctx.fillText(`${m.number}`, mX + 5, topY - 8);
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws traditional classical sheet music notes with elegant audio synchronization
   */
  private drawClassicalNotes(
    ctx: CanvasRenderingContext2D,
    notes: ScoreNote[],
    currentTime: number,
    pixelsPerSecond: number,
    playheadX: number,
    staffCenterY: number,
    lineSpacing: number,
    activeHighlight: boolean
  ) {
    const defaultNoteColor = '#e8e4dc'; // Crisp warm ivory
    const activeGold = '#e5b85c';        // Warm concert gold for active notes
    const pastNoteColor = '#9e998e';     // Refined soft slate for past notes

    for (const note of notes) {
      const noteX = playheadX + (note.startTime - currentTime) * pixelsPerSecond;
      const noteDurationWidth = Math.max(12, note.duration * pixelsPerSecond);

      // Culling outside screen
      if (noteX + noteDurationWidth < -60 || noteX > ctx.canvas.width + 60) {
        continue;
      }

      const { y: noteY, ledgerLines } = this.pitchToY(note.pitch, staffCenterY, lineSpacing);
      const isCurrentlyPlaying = currentTime >= note.startTime && currentTime <= (note.startTime + note.duration);
      const isPast = currentTime > (note.startTime + note.duration);

      // Notehead color: active warm gold vs resting ivory vs past soft slate
      const noteColor = isCurrentlyPlaying && activeHighlight
        ? activeGold
        : isPast
        ? pastNoteColor
        : defaultNoteColor;

      ctx.save();

      // 1. Ledger Lines
      if (ledgerLines.length > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const ly of ledgerLines) {
          ctx.moveTo(noteX - 11, ly);
          ctx.lineTo(noteX + 11, ly);
        }
        ctx.stroke();
      }

      // 2. Accidental Glyphs (♯, ♭, ♮)
      if (note.accidental) {
        ctx.fillStyle = noteColor;
        ctx.font = '14px "JetBrains Mono", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbol = note.accidental === 'sharp' ? '♯' : note.accidental === 'flat' ? '♭' : '♮';
        ctx.fillText(symbol, noteX - 15, noteY);
      }

      // 3. Elegant Duration Tail (Subtle horizontal tone ribbon)
      if (note.duration > 0.25) {
        ctx.fillStyle = isCurrentlyPlaying
          ? 'rgba(229, 184, 92, 0.22)'
          : 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(noteX + 4, noteY - 2.5, noteDurationWidth - 4, 5, 2);
        ctx.fill();
      }

      // 4. Active Note Subtle Bloom (Gentle, non-flashy illumination)
      if (isCurrentlyPlaying && activeHighlight) {
        ctx.save();
        ctx.fillStyle = 'rgba(229, 184, 92, 0.25)';
        ctx.beginPath();
        ctx.arc(noteX, noteY, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Classical Elliptical Notehead
      ctx.save();
      ctx.translate(noteX, noteY);
      ctx.rotate(-0.32); // Traditional music engraving angle

      ctx.fillStyle = noteColor;
      ctx.beginPath();
      // Hollow notehead for half notes and whole notes
      const isHollow = note.duration >= 1.5;
      if (isHollow) {
        ctx.strokeStyle = noteColor;
        ctx.lineWidth = 1.8;
        ctx.ellipse(0, 0, 7.2, 5.0, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.ellipse(0, 0, 7.2, 5.0, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 6. Classical Stem
      const stemUp = note.pitch < 71;
      const stemLength = lineSpacing * 3.2;
      const stemOriginX = stemUp ? noteX + 6.2 : noteX - 6.2;
      const stemEndY = stemUp ? noteY - stemLength : noteY + stemLength;

      ctx.strokeStyle = noteColor;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(stemOriginX, noteY);
      ctx.lineTo(stemOriginX, stemEndY);
      ctx.stroke();

      // 7. Flag on eighth notes (dur < 0.6s)
      if (note.duration < 0.55 && !note.hasBeam) {
        ctx.beginPath();
        const flagStartY = stemEndY;
        const flagWaveY = stemUp ? flagStartY + 11 : flagStartY - 11;
        ctx.moveTo(stemOriginX, flagStartY);
        ctx.quadraticCurveTo(stemOriginX + 8, flagStartY + (stemUp ? 4 : -4), stemOriginX + 5, flagWaveY);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Refined Thin Playhead Needle (Subtle warm gold hairline)
   */
  private drawRefinedPlayhead(
    ctx: CanvasRenderingContext2D,
    x: number,
    staffCenterY: number,
    _lineSpacing?: number
  ) {
    const topY = staffCenterY - 140;
    const bottomY = staffCenterY + 140;

    ctx.save();

    // 1. Thin hairline needle
    const lineGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
    lineGrad.addColorStop(0, 'rgba(212, 175, 55, 0.05)');
    lineGrad.addColorStop(0.2, 'rgba(212, 175, 55, 0.85)');
    lineGrad.addColorStop(0.8, 'rgba(212, 175, 55, 0.85)');
    lineGrad.addColorStop(1, 'rgba(212, 175, 55, 0.05)');

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.stroke();

    // 2. Small elegant diamond cursor on top and bottom
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(x, topY + 4);
    ctx.lineTo(x + 3, topY + 8);
    ctx.lineTo(x, topY + 12);
    ctx.lineTo(x - 3, topY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export { ScoreMotionRenderer as LumenScoreRenderer };

