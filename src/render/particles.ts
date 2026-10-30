import { Particle } from '../types/score';

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private penTrailParticles: Particle[] = [];
  private rings: ShockwaveRing[] = [];
  private maxParticles: number = 350;

  constructor(maxParticles: number = 350) {
    this.maxParticles = maxParticles;
  }

  public setMaxParticles(count: number) {
    this.maxParticles = count;
  }

  /**
   * Spawn ambient floating stardust drifting gently across the staves
   */
  public spawnAmbient(width: number, height: number, color: string) {
    if (this.particles.length >= this.maxParticles) return;
    
    if (Math.random() < 0.45) {
      this.particles.push({
        x: Math.random() * width,
        y: height + 8,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(0.4 + Math.random() * 0.7),
        life: 0,
        maxLife: 160 + Math.random() * 150,
        size: 1.1 + Math.random() * 2.2,
        color,
        alpha: 0.15 + Math.random() * 0.35,
        glow: 0,
      });
    }
  }

  /**
   * Luminous Pen Ink Trail: Microscopic ink dust tracing the calligraphy stylus
   */
  public emitPenTrail(x: number, y: number, color: string) {
    if (this.penTrailParticles.length >= 80) return;

    this.penTrailParticles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.5 - 0.5,
      vy: (Math.random() - 0.5) * 0.4,
      life: 0,
      maxLife: 22 + Math.random() * 14,
      size: 1.2 + Math.random() * 1.6,
      color,
      alpha: 0.85,
      glow: 0,
    });
  }

  /**
   * Explode radiant sparks and an expanding shockwave ring when a note is struck
   */
  public emitNoteBurst(x: number, y: number, color: string, intensity: number = 1.0) {
    // 1. Expanding shockwave ring
    this.rings.push({
      x,
      y,
      radius: 4,
      maxRadius: 26 + 22 * Math.min(1.8, intensity),
      color,
      alpha: 0.85,
      lineWidth: 2.0,
    });

    // 2. High-speed spark particles
    const sparkCount = Math.floor(18 * Math.min(2.0, intensity));
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.5 + Math.random() * 4.4) * Math.min(1.8, intensity);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 26 + Math.random() * 24,
        size: 1.4 + Math.random() * 2.2,
        color,
        alpha: 0.95,
        glow: 0,
      });
    }
  }

  /**
   * Update particle & shockwave ring physics
   */
  public update(width: number, _height: number, speedMultiplier: number = 1.0) {
    // Update Ambient & Burst Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;

      p.vx *= 0.96;
      p.vy *= 0.96;

      if (p.life >= p.maxLife || p.y < -20 || p.x < -20 || p.x > width + 20) {
        this.particles.splice(i, 1);
      }
    }

    // Update Pen Trail Particles
    for (let i = this.penTrailParticles.length - 1; i >= 0; i--) {
      const p = this.penTrailParticles[i];
      p.life++;
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;

      if (p.life >= p.maxLife) {
        this.penTrailParticles.splice(i, 1);
      }
    }

    // Update Shockwave Rings
    for (let r = this.rings.length - 1; r >= 0; r--) {
      const ring = this.rings[r];
      ring.radius += 1.8 * speedMultiplier;
      ring.alpha -= 0.035 * speedMultiplier;
      if (ring.radius >= ring.maxRadius || ring.alpha <= 0) {
        this.rings.splice(r, 1);
      }
    }
  }

  /**
   * Render all particles using high-performance additive glow blending ('lighter')
   */
  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. Draw Shockwave Rings
    for (const ring of this.rings) {
      if (ring.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ring.alpha));
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.lineWidth;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Pen Trail Ink Embers
    for (const p of this.penTrailParticles) {
      const progress = p.life / p.maxLife;
      const alpha = (1 - progress) * p.alpha;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Ambient & Burst Particles
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      let alpha = p.alpha;
      if (progress < 0.15) {
        alpha = (progress / 0.15) * p.alpha;
      } else if (progress > 0.55) {
        alpha = ((1 - progress) / 0.45) * p.alpha;
      }
      alpha = Math.max(0, Math.min(1, alpha));

      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer soft aura
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Inner white-hot core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.penTrailParticles = [];
    this.rings = [];
  }
}
