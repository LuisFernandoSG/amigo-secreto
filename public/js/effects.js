/**
 * Efectos Visuales Navideños Sutiles y Elegantes:
 * - Copos suaves en tonos champagne dorado / escarcha invernal
 * - Explosión de Confeti Navideño al abrir el regalo o realizar el sorteo
 */

class ChristmasEffects {
  constructor() {
    this.snowEnabled = localStorage.getItem('navidad_snow') !== 'false';
    this.canvas = null;
    this.ctx = null;
    this.flakes = [];
    this.confettiParticles = [];
    this.animId = null;
  }

  init() {
    this.canvas = document.getElementById('snow-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.createSnowflakes(45);
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createSnowflakes(count) {
    this.flakes = [];
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 800;
    const tones = [
      'rgba(217, 119, 6, 0.16)',   // Champagne cálido
      'rgba(22, 78, 53, 0.11)',    // Pino suave
      'rgba(185, 28, 28, 0.10)',   // Berry sutil
      'rgba(148, 163, 184, 0.22)', // Escarcha invernal
    ];
    for (let i = 0; i < count; i++) {
      this.flakes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.8 + 1.2,
        speedY: Math.random() * 0.65 + 0.25,
        speedX: (Math.random() - 0.5) * 0.35,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.015 + 0.005,
        color: tones[i % tones.length],
      });
    }
  }

  launchConfetti(intensity = 100) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const colors = ['#b91c1c', '#164e35', '#d97706', '#f59e0b', '#10b981', '#ef4444'];

    for (let i = 0; i < intensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 11 + 4;
      this.confettiParticles.push({
        x: w * 0.5 + (Math.random() - 0.5) * 180,
        y: h * 0.42 + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5.5,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        gravity: 0.22,
      });
    }
  }

  toggleSnow() {
    this.snowEnabled = !this.snowEnabled;
    localStorage.setItem('navidad_snow', String(this.snowEnabled));
    return this.snowEnabled;
  }

  animate() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.snowEnabled) {
      for (const f of this.flakes) {
        f.swing += f.swingSpeed;
        f.x += f.speedX + Math.sin(f.swing) * 0.3;
        f.y += f.speedY;

        if (f.y > h + 10) {
          f.y = -10;
          f.x = Math.random() * w;
        }
        if (f.x > w + 10) f.x = -10;
        if (f.x < -10) f.x = w + 10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
      }
    }

    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.009;

      if (p.opacity <= 0 || p.y > h + 40) {
        this.confettiParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

window.christmasEffects = new ChristmasEffects();
