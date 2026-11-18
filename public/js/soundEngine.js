/**
 * Motor de Audio Navideño Sintetizado (Web Audio API)
 * 100% autónomo (sin archivos MP3 externos que puedan fallar), incluye:
 * - Campanillas de trineo al hacer clic
 * - Redoble de tambores + Fanfarria mágica al abrir el regalo del Amigo Secreto
 * - Ruleta musical durante el sorteo aleatorio
 * - Caja de música navideña ambiental (Jingle Bells / We Wish You a Merry Christmas)
 */

class ChristmasSoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = localStorage.getItem('navidad_sfx') !== 'false';
    this.musicEnabled = localStorage.getItem('navidad_music') === 'true';
    this.musicTimer = null;
    this.noteIndex = 0;

    // Melodía de caja de música navideña (Jingle Bells + We Wish You a Merry Christmas)
    // Frecuencias en Hz y duración en ms
    this.melody = [
      // Jingle Bells
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 700 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 700 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 783.99, d: 350 }, // G5
      { f: 523.25, d: 500 }, // C5
      { f: 587.33, d: 200 }, // D5
      { f: 659.25, d: 1100 }, // E5
      { f: 698.46, d: 350 }, // F5
      { f: 698.46, d: 350 }, // F5
      { f: 698.46, d: 500 }, // F5
      { f: 698.46, d: 200 }, // F5
      { f: 698.46, d: 350 }, // F5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 200 }, // E5
      { f: 659.25, d: 200 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 587.33, d: 350 }, // D5
      { f: 587.33, d: 350 }, // D5
      { f: 659.25, d: 350 }, // E5
      { f: 587.33, d: 700 }, // D5
      { f: 783.99, d: 700 }, // G5
      // Repetición final hacia C
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 700 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 700 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 783.99, d: 350 }, // G5
      { f: 523.25, d: 500 }, // C5
      { f: 587.33, d: 200 }, // D5
      { f: 659.25, d: 1100 }, // E5
      { f: 698.46, d: 350 }, // F5
      { f: 698.46, d: 350 }, // F5
      { f: 698.46, d: 500 }, // F5
      { f: 698.46, d: 200 }, // F5
      { f: 698.46, d: 350 }, // F5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 659.25, d: 350 }, // E5
      { f: 783.99, d: 350 }, // G5
      { f: 783.99, d: 350 }, // G5
      { f: 698.46, d: 350 }, // F5
      { f: 587.33, d: 350 }, // D5
      { f: 523.25, d: 1200 }, // C5
    ];
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq, duration = 0.25, type = 'sine', volume = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Sonido suave de campanilla al interactuar
  playClick() {
    if (!this.sfxEnabled) return;
    this.playTone(1046.5, 0.12, 'sine', 0.04, 0); // C6
    this.playTone(1318.5, 0.16, 'triangle', 0.03, 0.03); // E6
  }

  // Sonido de cascabeles navideños
  playSleighBells() {
    if (!this.sfxEnabled) return;
    const freqs = [1567.98, 2093.0, 2637.02, 3135.96];
    freqs.forEach((f, idx) => {
      this.playTone(f, 0.22, 'sine', 0.035, idx * 0.045);
      this.playTone(f * 1.25, 0.18, 'triangle', 0.02, idx * 0.045 + 0.08);
    });
  }

  // Acorde mágico de éxito (al agregar deseo, crear familia, guardar ajustes)
  playSuccess() {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C5, E5, G5, B5, C6
    notes.forEach((n, i) => {
      this.playTone(n, 0.45, 'triangle', 0.065, i * 0.065);
      this.playTone(n * 2, 0.35, 'sine', 0.025, i * 0.065 + 0.02);
    });
  }

  // Sonido de alerta / error suave
  playError() {
    if (!this.sfxEnabled) return;
    this.playTone(311.13, 0.2, 'sawtooth', 0.04, 0);
    this.playTone(261.63, 0.3, 'sawtooth', 0.04, 0.15);
  }

  // Sonido de ruleta girando durante el sorteo del Amigo Secreto
  playDrawRoulette() {
    if (!this.sfxEnabled) return;
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    for (let i = 0; i < 16; i++) {
      const note = scale[i % scale.length];
      this.playTone(note, 0.1, 'triangle', 0.05, i * 0.075);
    }
    // Acorde triunfal final
    setTimeout(() => {
      this.playSuccess();
    }, 1250);
  }

  // Redoble y Fanfarria al abrir la caja de regalo del Amigo Secreto
  playGiftRevealFanfare() {
    if (!this.sfxEnabled) return;
    // Redoble ascendente
    for (let i = 0; i < 14; i++) {
      const freq = 220 + i * 22;
      this.playTone(freq, 0.08, 'triangle', 0.05, i * 0.06);
    }

    // Explosión mágica de campanas y fanfarria
    const baseDelay = 0.9;
    const fanfare = [
      { f: 523.25, d: 0.2, t: 0 },     // C5
      { f: 659.25, d: 0.2, t: 0.14 },  // E5
      { f: 783.99, d: 0.2, t: 0.28 },  // G5
      { f: 1046.5, d: 0.75, t: 0.42 }, // C6
      { f: 783.99, d: 0.2, t: 0.95 },  // G5
      { f: 1046.5, d: 1.1, t: 1.12 },  // C6
    ];

    fanfare.forEach((n) => {
      this.playTone(n.f, n.d, 'triangle', 0.09, baseDelay + n.t);
      this.playTone(n.f * 0.5, n.d, 'sine', 0.06, baseDelay + n.t);
      this.playTone(n.f * 2, n.d * 0.8, 'sine', 0.03, baseDelay + n.t + 0.02);
    });
  }

  // Caja de música navideña de fondo
  startMusicBox() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    if (!this.musicEnabled) return;

    const playNextNote = () => {
      if (!this.musicEnabled) return;
      const item = this.melody[this.noteIndex % this.melody.length];
      this.noteIndex++;

      // Sonido tipo celesta / caja de música suave
      this.playTone(item.f, (item.d / 1000) * 1.4, 'sine', 0.03, 0);
      this.playTone(item.f * 2, (item.d / 1000) * 0.8, 'triangle', 0.01, 0.01);
      // Bajo suave cada 4 notas
      if (this.noteIndex % 4 === 1) {
        this.playTone(item.f * 0.5, 0.8, 'sine', 0.02, 0);
      }

      this.musicTimer = setTimeout(playNextNote, item.d);
    };

    playNextNote();
  }

  stopMusicBox() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('navidad_sfx', String(this.sfxEnabled));
    if (this.sfxEnabled) {
      this.playSleighBells();
    }
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.ensureContext();
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('navidad_music', String(this.musicEnabled));
    if (this.musicEnabled) {
      this.startMusicBox();
    } else {
      this.stopMusicBox();
    }
    return this.musicEnabled;
  }
}

window.soundEngine = new ChristmasSoundEngine();
