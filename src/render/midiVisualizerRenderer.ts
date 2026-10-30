import { ScoreData, ScoreNote } from '../types/score';
import { VisualizerPreset } from '../types/visualizer';

interface ParticleSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

interface KeyGeometry {
  pitch: number;
  isBlack: boolean;
  whiteIndex: number; // 0 to 51
  left: number;       // Normalized 0 to 1
  right: number;      // Normalized 0 to 1
  center: number;
}

/**
 * 3D / 2D MIDI Visualizer Engine for ScoreMotion Studio
 * Full 88-key physical piano model, perspective falling notes, camera orbit,
 * velocity lighting, light bars, and reactive particle physics.
 */
export class MidiVisualizerRenderer {
  private keys: KeyGeometry[] = [];
  private particles: ParticleSpark[] = [];
  private activeNoteIds: Set<string> = new Set();
  private prevTime: number = -1;

  // Starlight field
  private stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];

  constructor() {
    this.init88KeyGeometry();
    this.initStars(250);
  }

  /**
   * Pre-calculates physical proportions of all 88 keys on a concert grand piano (A0 to C8)
   */
  private init88KeyGeometry() {
    const isBlackMap = [
      false, true, false, false, true, false, true, false, false, true, false, true, // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    ];

    let whiteCount = 0;
    // Count white keys from A0 (21) to C8 (108)
    for (let p = 21; p <= 108; p++) {
      if (!isBlackMap[p % 12]) whiteCount++;
    }

    const whiteKeyWidth = 1.0 / whiteCount; // Normalized width
    const blackKeyWidth = whiteKeyWidth * 0.58;

    let currentWhiteIndex = 0;
    const tempWhiteKeys: { pitch: number; left: number; right: number; center: number }[] = [];

    // First pass: white keys
    for (let p = 21; p <= 108; p++) {
      const isBlack = isBlackMap[p % 12];
      if (!isBlack) {
        const left = currentWhiteIndex * whiteKeyWidth;
        const right = left + whiteKeyWidth;
        tempWhiteKeys.push({ pitch: p, left, right, center: (left + right) / 2 });
        this.keys.push({
          pitch: p,
          isBlack: false,
          whiteIndex: currentWhiteIndex,
          left,
          right,
          center: (left + right) / 2,
        });
        currentWhiteIndex++;
      }
    }

    // Second pass: black keys positioned between their adjacent white keys
    for (let p = 21; p <= 108; p++) {
      const isBlack = isBlackMap[p % 12];
      if (isBlack) {
        // Find previous and next white key
        const prevWhite = tempWhiteKeys.filter((w) => w.pitch < p).pop();
        if (prevWhite) {
          const center = prevWhite.right;
          const left = center - blackKeyWidth / 2;
          const right = center + blackKeyWidth / 2;
          this.keys.push({
            pitch: p,
            isBlack: true,
            whiteIndex: prevWhite.pitch,
            left,
            right,
            center,
          });
        }
      }
    }

    // Sort by pitch
    this.keys.sort((a, b) => a.pitch - b.pitch);
  }

  private initStars(count: number) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.2 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2.0,
      });
    }
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
    preset: VisualizerPreset
  ) {
    // Detect timeline backward seek/jump
    if (currentTime < this.prevTime - 0.2 || currentTime > this.prevTime + 1.0) {
      this.activeNoteIds.clear();
      this.particles = [];
    }
    this.prevTime = currentTime;

    // 1. Draw Background (Gradient / Horizon Grid / Stars)
    this.drawBackground(ctx, width, height, preset, currentTime);

    // 2. Identify active notes currently ringing
    const activeNotes = new Map<number, ScoreNote>();
    for (const note of score.notes) {
      if (currentTime >= note.startTime && currentTime <= (note.startTime + note.duration)) {
        activeNotes.set(note.pitch, note);

        // Spawn impact particle burst on first strike
        if (!this.activeNoteIds.has(note.id) && preset.effects.particlesOnHit) {
          this.emitNoteImpactParticles(note, width, height, preset);
          this.activeNoteIds.add(note.id);
        }
      }
    }

    // 3. 3D Camera / Perspective Math
    const cam = preset.camera;
    const is3D = preset.mode === '3d-piano' || preset.mode === 'cinematic';
    const pitchRad = (cam.pitch * Math.PI) / 180;
    const yawRad = (cam.yaw * Math.PI) / 180;

    // 4. Draw Horizon Grid if enabled
    if (preset.background.type === 'horizon-grid') {
      this.drawPerspectiveGrid(ctx, width, height, pitchRad, yawRad, preset.background.gridOpacity);
    }

    // 5. Draw Falling MIDI Notes Corridor
    this.drawFallingNotes(
      ctx,
      width,
      height,
      score.notes,
      currentTime,
      preset,
      is3D,
      pitchRad,
      yawRad
    );

    // 6. Draw Light Bars (Beams shooting up from active keys)
    if (preset.effects.lightBars && activeNotes.size > 0) {
      this.drawLightBars(ctx, width, height, activeNotes, preset, is3D, pitchRad);
    }

    // 7. Draw 88-Key Piano Keyboard
    if (preset.piano.showPiano) {
      this.drawPianoKeyboard(
        ctx,
        width,
        height,
        activeNotes,
        preset,
        is3D,
        pitchRad
      );
    }

    // 8. Draw Music-Reactive Particle Bursts & Sparks
    if (preset.effects.particlesOnHit) {
      this.updateAndDrawParticles(ctx);
    }
  }

  /**
   * Draws background (Obsidian / Linear Gradient / Perspective Horizon / Stars)
   */
  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    preset: VisualizerPreset,
    time: number
  ) {
    const bg = preset.background;

    if (bg.type === 'gradient' || bg.type === 'horizon-grid') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, bg.color1);
      grad.addColorStop(1, bg.color2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = bg.color1;
      ctx.fillRect(0, 0, width, height);
    }

    // Starfield twinkle
    if (bg.starDensity > 0) {
      ctx.save();
      const numStars = Math.min(this.stars.length, bg.starDensity);
      for (let i = 0; i < numStars; i++) {
        const s = this.stars[i];
        const twinkle = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + i);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = s.alpha * twinkle * 0.7;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height * 0.7, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /**
   * Draws perspective horizon grid (Synthwave / Keysight floor)
   */
  private drawPerspectiveGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pitchRad: number,
    _yawRad: number,
    opacity: number
  ) {
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1.0;

    const horizonY = height * 0.25 + Math.sin(pitchRad + Math.PI / 4) * 80;
    const bottomY = height;
    const centerX = width / 2;

    // Perspective vanishing rays
    ctx.beginPath();
    for (let x = -width * 0.5; x <= width * 1.5; x += width * 0.08) {
      ctx.moveTo(x, bottomY);
      ctx.lineTo(centerX + (x - centerX) * 0.15, horizonY);
    }

    // Horizontal receding lines
    for (let yRatio = 0; yRatio <= 1.0; yRatio += 0.08) {
      const curvedRatio = Math.pow(yRatio, 2.2);
      const y = horizonY + (bottomY - horizonY) * curvedRatio;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draws Falling MIDI Notes with 3D perspective or orthographic roll
   */
  private drawFallingNotes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    notes: ScoreNote[],
    currentTime: number,
    preset: VisualizerPreset,
    is3D: boolean,
    _pitchRad: number,
    _yawRad: number
  ) {
    const keyboardY = height - (preset.piano.showPiano ? preset.piano.keyHeight : 0);
    const fallDuration = preset.notes.fallDurationSec || 2.2;
    const keyMap = new Map<number, KeyGeometry>(this.keys.map((k) => [k.pitch, k]));

    // Lateral keyboard padding
    const pianoWidth = width * 0.94;
    const pianoLeft = (width - pianoWidth) / 2;
    const corridorHeight = keyboardY - (is3D ? height * 0.12 : 20);

    ctx.save();

    for (const note of notes) {
      // Notes falling: note.startTime is when note touches keyboard
      // Bottom of bar touches key at note.startTime
      // Top of bar touches key at note.startTime + note.duration
      const timeToHit = note.startTime - currentTime;
      const timeToRelease = (note.startTime + note.duration) - currentTime;

      // Cull notes outside falling window
      if (timeToHit > fallDuration || timeToRelease < -0.1) {
        continue;
      }

      const keyGeom = keyMap.get(note.pitch);
      if (!keyGeom) continue;

      // Horizontal note bounds on keyboard
      const baseNoteLeft = pianoLeft + keyGeom.left * pianoWidth;
      const baseNoteRight = pianoLeft + keyGeom.right * pianoWidth;
      const noteW = (baseNoteRight - baseNoteLeft) * preset.notes.noteWidth;
      const noteX = baseNoteLeft + ((baseNoteRight - baseNoteLeft) - noteW) / 2;

      // Vertical coordinates along falling path (0 = at key, 1 = at top spawn horizon)
      const hitProgress = Math.max(0, timeToHit / fallDuration);
      const releaseProgress = Math.max(0, timeToRelease / fallDuration);

      let bottomY: number;
      let topY: number;

      if (is3D) {
        // Perspective non-linear foreshortening: notes accelerate as they near the camera
        const perspBottom = 1.0 - Math.pow(hitProgress, 1.25);
        const perspTop = 1.0 - Math.pow(releaseProgress, 1.25);

        bottomY = keyboardY - (corridorHeight * perspBottom);
        topY = keyboardY - (corridorHeight * perspTop);
      } else {
        // Orthographic linear falling roll
        bottomY = keyboardY - (corridorHeight * (1.0 - hitProgress));
        topY = keyboardY - (corridorHeight * (1.0 - releaseProgress));
      }

      const barHeight = Math.max(4, Math.abs(bottomY - topY));
      const drawY = Math.min(topY, bottomY);

      // Determine note color
      let noteColor = preset.notes.primaryColor;
      if (preset.notes.colorMode === 'track' && note.trackIndex !== undefined) {
        const trackColors = [preset.notes.primaryColor, preset.notes.secondaryColor, preset.notes.accentColor, '#ec4899', '#8b5cf6', '#06b6d4'];
        noteColor = trackColors[note.trackIndex % trackColors.length];
      } else if (preset.notes.colorMode === 'pitch') {
        const hue = ((note.pitch - 21) / 88) * 320;
        noteColor = `hsl(${hue}, 85%, 60%)`;
      } else if (keyGeom.isBlack) {
        noteColor = preset.notes.secondaryColor;
      }

      // Velocity scaling
      let alpha = preset.notes.noteOpacity;
      if (preset.notes.velocityScale) {
        alpha *= Math.max(0.65, (note.velocity / 127) * 1.15);
      }

      // Draw Note Bar
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, alpha);

      // Bloom glow on note bar
      if (preset.notes.noteGlow > 0.5) {
        ctx.shadowColor = noteColor;
        ctx.shadowBlur = 8 * preset.notes.noteGlow;
      }

      // Gradient fill (radiant leading cap, fading tail)
      const barGrad = ctx.createLinearGradient(0, drawY + barHeight, 0, drawY);
      barGrad.addColorStop(0, '#ffffff');
      barGrad.addColorStop(0.18, noteColor);
      barGrad.addColorStop(1, noteColor);

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(noteX, drawY, noteW, barHeight, preset.notes.noteRadius);
      ctx.fill();

      // Sharp white leading strike cap
      if (timeToHit <= 0.05 && timeToRelease >= 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(noteX, keyboardY - 3, noteW, 6, 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draws vertical Light Bars shooting upward from active depressed keys
   */
  private drawLightBars(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    activeNotes: Map<number, ScoreNote>,
    preset: VisualizerPreset,
    _is3D: boolean,
    _pitchRad: number
  ) {
    const keyboardY = height - (preset.piano.showPiano ? preset.piano.keyHeight : 0);
    const pianoWidth = width * 0.94;
    const pianoLeft = (width - pianoWidth) / 2;
    const keyMap = new Map<number, KeyGeometry>(this.keys.map((k) => [k.pitch, k]));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const [pitch, note] of activeNotes.entries()) {
      const keyGeom = keyMap.get(pitch);
      if (!keyGeom) continue;

      const baseNoteLeft = pianoLeft + keyGeom.left * pianoWidth;
      const baseNoteRight = pianoLeft + keyGeom.right * pianoWidth;
      const noteW = baseNoteRight - baseNoteLeft;
      const barCenterX = (baseNoteLeft + baseNoteRight) / 2;

      const velRatio = (note.velocity || 85) / 127;
      const beamHeight = height * 0.65 * velRatio;
      const beamColor = keyGeom.isBlack ? preset.notes.secondaryColor : preset.notes.primaryColor;

      const beamGrad = ctx.createLinearGradient(0, keyboardY, 0, keyboardY - beamHeight);
      beamGrad.addColorStop(0, beamColor);
      beamGrad.addColorStop(0.4, beamColor);
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.globalAlpha = 0.35 * preset.effects.lightBarIntensity * velRatio;
      ctx.beginPath();
      ctx.rect(barCenterX - noteW * 1.5, keyboardY - beamHeight, noteW * 3.0, beamHeight);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draws 88-Key Piano Keyboard with 3D Depression and Velocity Key Glow
   */
  private drawPianoKeyboard(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    activeNotes: Map<number, ScoreNote>,
    preset: VisualizerPreset,
    _is3D: boolean,
    _pitchRad: number
  ) {
    const pianoHeight = preset.piano.keyHeight;
    const pianoY = height - pianoHeight;
    const pianoWidth = width * 0.94;
    const pianoLeft = (width - pianoWidth) / 2;

    const whiteKeys = this.keys.filter((k) => !k.isBlack);
    const blackKeys = this.keys.filter((k) => k.isBlack);

    ctx.save();

    // 1. Piano Keyboard Base / Keybed shadow
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(pianoLeft - 8, pianoY - 4, pianoWidth + 16, pianoHeight + 8);

    // Subtle golden/brass fallboard strip along the top edge of the piano
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(pianoLeft - 4, pianoY - 3, pianoWidth + 8, 3);

    // 2. Render 52 White Keys
    for (const key of whiteKeys) {
      const active = activeNotes.get(key.pitch);
      const isDepressed = !!active;
      const depressY = isDepressed ? preset.piano.keyDepression : 0;

      const kLeft = pianoLeft + key.left * pianoWidth;
      const kW = (key.right - key.left) * pianoWidth;
      const kTop = pianoY + depressY;
      const kH = pianoHeight - depressY;

      // Color
      ctx.fillStyle = isDepressed ? preset.piano.activeKeyColor : preset.piano.whiteKeyColor;
      if (preset.piano.transparentKeys) {
        ctx.globalAlpha = preset.piano.keyOpacity;
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.beginPath();
      ctx.roundRect(kLeft + 0.5, kTop, kW - 1, kH, [0, 0, 3, 3]);
      ctx.fill();

      // Bevel / shadow edge
      ctx.strokeStyle = isDepressed ? '#ffffff' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Active key bloom aura
      if (isDepressed && preset.piano.keyGlow > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = preset.piano.activeKeyColor;
        ctx.globalAlpha = 0.45 * preset.piano.keyGlow;
        ctx.fillRect(kLeft, kTop, kW, kH);
        ctx.restore();
      }
    }

    // 3. Render 36 Black Keys (Drawn on top of white keys)
    const blackKeyH = pianoHeight * 0.62;

    for (const key of blackKeys) {
      const active = activeNotes.get(key.pitch);
      const isDepressed = !!active;
      const depressY = isDepressed ? preset.piano.keyDepression * 0.75 : 0;

      const kLeft = pianoLeft + key.left * pianoWidth;
      const kW = (key.right - key.left) * pianoWidth;
      const kTop = pianoY + depressY;
      const kH = blackKeyH - depressY;

      ctx.fillStyle = isDepressed ? preset.piano.activeBlackKeyColor : preset.piano.blackKeyColor;
      ctx.globalAlpha = 1.0;

      // Front 3D bevel for realistic black key body
      ctx.beginPath();
      ctx.roundRect(kLeft, kTop, kW, kH, [0, 0, 2, 2]);
      ctx.fill();

      // Top matte cap
      ctx.fillStyle = isDepressed ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(kLeft + 1, kTop + 1, kW - 2, 4);

      // Active black key glow
      if (isDepressed && preset.piano.keyGlow > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = preset.piano.activeBlackKeyColor;
        ctx.globalAlpha = 0.5 * preset.piano.keyGlow;
        ctx.fillRect(kLeft, kTop, kW, kH);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  /**
   * Spawns radiant particle sparks on note impact
   */
  private emitNoteImpactParticles(
    note: ScoreNote,
    width: number,
    height: number,
    preset: VisualizerPreset
  ) {
    const keyMap = new Map<number, KeyGeometry>(this.keys.map((k) => [k.pitch, k]));
    const keyGeom = keyMap.get(note.pitch);
    if (!keyGeom) return;

    const keyboardY = height - (preset.piano.showPiano ? preset.piano.keyHeight : 0);
    const pianoWidth = width * 0.94;
    const pianoLeft = (width - pianoWidth) / 2;
    const impactX = pianoLeft + keyGeom.center * pianoWidth;

    const velRatio = (note.velocity || 85) / 127;
    const sparkCount = Math.floor(16 * velRatio);

    const color = preset.effects.particleColorMode === 'gold'
      ? '#e5b85c'
      : preset.effects.particleColorMode === 'rainbow'
      ? `hsl(${Math.random() * 360}, 90%, 65%)`
      : preset.notes.primaryColor;

    for (let i = 0; i < sparkCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = (2.0 + Math.random() * 4.5) * velRatio;
      this.particles.push({
        x: impactX,
        y: keyboardY - 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 24 + Math.random() * 20,
        size: 1.2 + Math.random() * 2.2,
        color,
        alpha: 0.95,
      });
    }
  }

  /**
   * Updates and draws sparks using additive blending
   */
  private updateAndDrawParticles(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gravity
      p.vx *= 0.96; // Air resistance

      const progress = p.life / p.maxLife;
      const alpha = (1 - progress) * p.alpha;

      if (progress >= 1.0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.activeNoteIds.clear();
    this.prevTime = -1;
  }
}
