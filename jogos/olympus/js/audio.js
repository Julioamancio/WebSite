/* audio.js — NES-style chiptune engine (2 pulse + triangle + noise) using Web Audio.
   All melodies are original compositions. */
(function (O) {
  'use strict';

  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(n) {
    const m = /^([A-G]#?)(\d)$/.exec(n);
    if (!m) return 0;
    return 440 * Math.pow(2, (SEMI[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
  }
  // "E4.2 -.4 k.2" -> events. Number after the dot = length in 16th notes.
  function parse(s) {
    const ev = [];
    let t = 0;
    s.trim().split(/\s+/).forEach((tok) => {
      const i = tok.lastIndexOf('.');
      const n = tok.slice(0, i), d = +tok.slice(i + 1) || 1;
      if (n !== '-') ev.push({ t, d, n });
      t += d;
    });
    return { ev, len: t };
  }
  const rep = (s, n) => (s.trim() + ' ').repeat(n);

  const SONGS = {
    title: { bpm: 120, loop: true, tracks: [
      { w: 'p25', v: 0.14, s: 'D4.4 A4.4 D5.6 C5.2 A#4.4 A4.4 G4.4 A4.4 F4.6 G4.2 A4.4 D4.4 E4.12 -.4 D4.4 A4.4 D5.6 E5.2 F5.4 E5.4 D5.4 C5.4 A#4.4 A4.4 G4.4 E4.4 D4.12 -.4' },
      { w: 'p12', v: 0.06, s: 'F4.16 D4.16 C4.16 C#4.16 F4.16 A4.16 D4.8 C#4.8 A3.16' },
      { w: 'tri', v: 0.28, s: rep('D2.2 D3.2', 4) + rep('A#1.2 A#2.2', 4) + rep('F2.2 F3.2', 4) + rep('A1.2 A2.2', 4) + rep('D2.2 D3.2', 4) + rep('F2.2 F3.2', 4) + rep('G2.2 G3.2', 2) + rep('A2.2 A3.2', 2) + rep('D2.2 D3.2', 4) },
      { w: 'noise', v: 0.1, s: rep('k.4 h.2 h.2 s.4 h.2 h.2', 8) }
    ] },
    village: { bpm: 100, loop: true, tracks: [
      { w: 'p25', v: 0.13, s: 'A4.2 C5.2 E5.4 D5.2 C5.2 B4.4 A4.2 B4.2 C5.2 D5.2 E5.8 G5.2 F#5.2 E5.4 D5.2 E5.2 C5.4 B4.12 -.4 A4.2 C5.2 E5.4 D5.2 C5.2 B4.4 C5.2 D5.2 E5.2 G5.2 A5.8 G5.2 E5.2 D5.4 C5.2 B4.2 G4.4 A4.12 -.4' },
      { w: 'p12', v: 0.05, s: 'E4.16 E4.16 F#4.16 G#4.16 E4.16 G4.16 D4.16 C4.16' },
      { w: 'tri', v: 0.26, s: rep('A2.2 E3.2 A3.2 E3.2', 2) + rep('C3.2 G3.2 C4.2 G3.2', 2) + rep('D3.2 A3.2 D4.2 A3.2', 2) + rep('E2.2 B2.2 E3.2 B2.2', 2) + rep('A2.2 E3.2 A3.2 E3.2', 2) + rep('C3.2 G3.2 C4.2 G3.2', 2) + rep('G2.2 D3.2 G3.2 D3.2', 2) + rep('A2.2 E3.2 A3.2 E3.2', 2) },
      { w: 'noise', v: 0.07, s: rep('k.8 h.4 h.4', 8) }
    ] },
    forest: { bpm: 140, loop: true, tracks: [
      { w: 'p25', v: 0.13, s: 'E4.2 F4.2 G#4.2 A4.2 B4.4 A4.2 G#4.2 A4.2 G#4.2 F4.2 E4.2 F4.8 E4.2 F4.2 G#4.2 A4.2 B4.2 C5.2 D5.2 C5.2 B4.4 C5.2 B4.2 A4.2 G#4.2 E4.4 E5.4 D5.2 C5.2 B4.4 A4.4 C5.4 B4.2 A4.2 G#4.8 A4.2 B4.2 C5.2 D5.2 E5.2 F5.2 E5.2 D5.2 E5.12 -.4' },
      { w: 'p12', v: 0.05, s: 'B3.16 C4.16 B3.16 G#3.16 C4.16 B3.16 A3.16 G#3.16' },
      { w: 'tri', v: 0.28, s: rep('E2.2 E3.2', 4) + rep('F2.2 F3.2', 4) + rep('E2.2 E3.2', 8) + rep('A2.2 A3.2', 4) + rep('E2.2 E3.2', 4) + rep('D2.2 D3.2', 4) + rep('E2.2 E3.2', 4) },
      { w: 'noise', v: 0.1, s: rep('k.2 h.2 s.2 h.2 k.2 k.2 s.2 h.2', 8) }
    ] },
    boss: { bpm: 160, loop: true, tracks: [
      { w: 'p25', v: 0.13, s: 'C4.2 C4.2 D#4.2 C4.2 F#4.2 C4.2 G4.2 F#4.2 D#4.2 D#4.2 F#4.2 D#4.2 A4.2 G4.2 F#4.2 D#4.2 C5.2 B4.2 A#4.2 A4.2 G#4.2 G4.2 F#4.2 F4.2 C4.4 G3.4 C4.4 -.4' },
      { w: 'p12', v: 0.06, s: 'G3.16 A#3.16 G#3.16 G3.16' },
      { w: 'tri', v: 0.3, s: rep('C2.2 C2.2 C3.2 C2.2', 6) + rep('G1.2 G2.2', 4) },
      { w: 'noise', v: 0.12, s: rep('k.2 h.2 s.2 h.2', 8) }
    ] },
    temple: { bpm: 80, loop: true, tracks: [
      { w: 'p50', v: 0.1, s: 'F4.4 A4.4 C5.8 A#4.4 A4.4 G4.8 A4.4 C5.4 F5.8 E5.4 D5.4 C5.8 D5.4 C5.4 A#4.4 A4.4 G4.16 A4.4 G4.4 F4.4 E4.4 F4.16' },
      { w: 'p12', v: 0.05, s: 'C4.16 D4.16 F4.16 G4.16 F4.16 E4.16 C4.16 A3.16' },
      { w: 'tri', v: 0.26, s: 'F2.16 A#1.16 F2.16 C2.16 A#1.16 C2.16 C2.16 F2.16' }
    ] },
    gameover: { bpm: 90, loop: false, tracks: [
      { w: 'p25', v: 0.14, s: 'D5.4 C#5.4 C5.4 B4.4 A#4.8 A4.16' },
      { w: 'tri', v: 0.28, s: 'D3.8 A2.8 F2.8 D2.16' }
    ] },
    fanfare: { bpm: 150, loop: false, tracks: [
      { w: 'p25', v: 0.15, s: 'C5.2 E5.2 G5.2 C6.6 G5.2 C6.8' },
      { w: 'p12', v: 0.07, s: 'E4.2 G4.2 C5.2 E5.6 D5.2 E5.8' },
      { w: 'tri', v: 0.3, s: 'C3.2 C3.2 C3.2 C3.6 G2.2 C3.8' }
    ] }
  };
  Object.keys(SONGS).forEach((k) => {
    const s = SONGS[k];
    s.tracks.forEach((t) => { const p = parse(t.s); t.ev = p.ev; t.len = p.len; });
    s.len = Math.max.apply(null, s.tracks.map((t) => t.len));
    s.step = 60 / s.bpm / 4;
  });

  const A = O.Audio = {
    ctx: null, muted: false, song: null, songName: null, pending: null,

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(c.destination);
      this.musicBus = c.createGain(); this.musicBus.gain.value = 0.8; this.musicBus.connect(this.master);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = 1; this.sfxBus.connect(this.master);
      this.waves = { p12: this.pulse(0.125), p25: this.pulse(0.25), p50: this.pulse(0.5) };
      const len = c.sampleRate;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      setInterval(() => this.tick(), 25);
      if (this.pending) { const p = this.pending; this.pending = null; this.play(p.name, p.next); }
    },

    pulse(duty) {
      const n = 64, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) {
        re[k] = Math.sin(2 * Math.PI * k * duty) / (Math.PI * k);
        im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k);
      }
      return this.ctx.createPeriodicWave(re, im);
    },

    osc(w, t) {
      const o = this.ctx.createOscillator();
      if (w === 'tri') o.type = 'triangle';
      else o.setPeriodicWave(this.waves[w] || this.waves.p50);
      return o;
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    },

    /* ---------- music ---------- */
    play(name, next) {
      if (!name) { this.stop(); return; }
      if (!this.ctx) { this.pending = { name, next }; this.songName = name; return; }
      if (this.songName === name && this.song && !next) return;
      this.stop();
      const def = SONGS[name];
      if (!def) return;
      const out = this.ctx.createGain();
      out.connect(this.musicBus);
      const start = this.ctx.currentTime + 0.06;
      this.song = {
        def, out, start, next: next || null, loop: def.loop, len: def.len, step: def.step,
        tracks: def.tracks.map((t) => ({ t, i: 0, base: start, done: t.ev.length === 0 }))
      };
      this.songName = name;
    },

    stop() {
      if (this.song && this.ctx) {
        const out = this.song.out, now = this.ctx.currentTime;
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + 0.05);
        setTimeout(() => out.disconnect(), 400);
      }
      this.song = null;
      this.songName = null;
      this.pending = null;
    },

    tick() {
      const s = this.song;
      if (!s || !this.ctx) return;
      const now = this.ctx.currentTime, ahead = now + 0.2;
      s.tracks.forEach((tr) => {
        while (!tr.done) {
          if (tr.i >= tr.t.ev.length) {
            if (s.loop) { tr.i = 0; tr.base += s.len * s.step; } else { tr.done = true; break; }
          }
          const e = tr.t.ev[tr.i];
          const at = tr.base + e.t * s.step;
          if (at > ahead) break;
          if (at >= now - 0.05) this.note(tr.t, e, at, e.d * s.step, s.out);
          tr.i++;
        }
      });
      if (!s.loop && now >= s.start + s.len * s.step) {
        const nx = s.next;
        this.song = null;
        this.songName = null;
        if (nx) this.play(nx);
      }
    },

    note(tr, e, t0, dur, out) {
      const c = this.ctx;
      if (tr.w === 'noise') { this.drum(e.n, t0, tr.v, out); return; }
      const f = hz(e.n);
      if (!f) return;
      const o = this.osc(tr.w);
      o.frequency.setValueAtTime(f, t0);
      const g = c.createGain();
      const end = t0 + dur * 0.95;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(tr.v, t0 + 0.005);
      if (tr.w === 'tri') {
        g.gain.setValueAtTime(tr.v, Math.max(t0 + 0.006, end - 0.01));
      } else {
        g.gain.exponentialRampToValueAtTime(tr.v * 0.55, t0 + Math.min(dur * 0.5, 0.2));
      }
      g.gain.linearRampToValueAtTime(0, end);
      o.connect(g).connect(out);
      o.start(t0);
      o.stop(end + 0.02);
    },

    drum(kind, t0, v, out) {
      const c = this.ctx;
      if (kind === 'k') {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(150, t0);
        o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
        g.gain.setValueAtTime(v * 2.5, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
        o.connect(g).connect(out);
        o.start(t0); o.stop(t0 + 0.16);
        return;
      }
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.noiseBuf;
      const hat = kind === 'h';
      f.type = hat ? 'highpass' : 'bandpass';
      f.frequency.value = hat ? 7000 : 1800;
      const len = hat ? 0.04 : 0.14;
      g.gain.setValueAtTime(hat ? v * 0.6 : v, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
      src.connect(f).connect(g).connect(out);
      src.start(t0, Math.random() * 0.5);
      src.stop(t0 + len + 0.02);
    },

    /* ---------- sound effects ---------- */
    beep(w, f0, f1, dur, vol, delay) {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const o = this.osc(w), g = c.createGain();
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g).connect(this.sfxBus);
      o.start(t); o.stop(t + dur + 0.02);
    },
    nz(dur, vol, type, freq, delay) {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.noiseBuf;
      f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f).connect(g).connect(this.sfxBus);
      src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
    },
    sfx(name) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const fx = SFX[name];
      if (fx) fx(this);
    }
  };

  const SFX = {
    jump: (a) => a.beep('p25', 280, 720, 0.14, 0.1),
    swing: (a) => a.nz(0.07, 0.2, 'highpass', 2500),
    hit: (a) => { a.beep('p50', 700, 180, 0.08, 0.1); a.nz(0.05, 0.15, 'bandpass', 3000); },
    kill: (a) => { a.nz(0.3, 0.2, 'lowpass', 1500); a.beep('p25', 500, 60, 0.25, 0.08); },
    hurt: (a) => a.beep('p50', 240, 90, 0.22, 0.14),
    olive: (a) => { a.beep('p25', 1319, 1319, 0.05, 0.08); a.beep('p25', 1976, 1976, 0.1, 0.08, 0.05); },
    life: (a) => [523, 659, 784, 1047].forEach((f, i) => a.beep('p25', f, f, 0.07, 0.08, i * 0.06)),
    blip: (a) => a.beep('p25', 900, 900, 0.02, 0.03),
    select: (a) => a.beep('p25', 660, 990, 0.06, 0.07),
    door: (a) => { a.beep('tri', 180, 60, 0.25, 0.3); a.nz(0.2, 0.08, 'lowpass', 600); },
    pause: (a) => [988, 784, 988].forEach((f, i) => a.beep('p25', f, f, 0.06, 0.08, i * 0.07)),
    roar: (a) => { a.nz(0.9, 0.3, 'lowpass', 500); a.beep('p50', 110, 55, 0.8, 0.1); },
    crash: (a) => { a.nz(0.45, 0.35, 'lowpass', 900); a.beep('tri', 120, 40, 0.3, 0.4); },
    rock: (a) => a.nz(0.12, 0.15, 'lowpass', 1200),
    die: (a) => [784, 659, 523, 392, 262].forEach((f, i) => a.beep('p50', f, f * 0.95, 0.12, 0.12, i * 0.12)),
    buy: (a) => [1047, 1319, 1568].forEach((f, i) => a.beep('p25', f, f, 0.06, 0.08, i * 0.05)),
    bat: (a) => a.beep('p12', 1400, 1800, 0.05, 0.04),
    bosshit: (a) => { a.beep('p50', 300, 80, 0.15, 0.14); a.nz(0.1, 0.2, 'lowpass', 2000); }
  };
})(window.OLY);
