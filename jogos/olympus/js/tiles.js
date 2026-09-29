/* tiles.js — procedural pixel-art tiles (with variations), decorations and parallax backgrounds */
(function (O) {
  'use strict';

  const K = '#000000';
  const THEMES = {
    village: {
      grass: ['#b8f070', '#58c030', '#2c7818'], grassD: '#185010',
      dirt: ['#d8a060', '#a86830', '#6c3c18'], dirtD: '#3c1c08',
      stone: ['#fcfcfc', '#dcd8e4', '#a8a0b8'], mortar: '#686078', moss: null, rocky: false,
      plat: 'marble', inner: ['#c8c0d8', '#a098b8', '#686080']
    },
    forest: {
      grass: ['#98e050', '#3c9c20', '#1c6410'], grassD: '#0c3c08',
      dirt: ['#b07040', '#784020', '#401c0c'], dirtD: '#200c04',
      stone: ['#c8c8c0', '#8c8c88', '#4c4c50'], mortar: '#2c2c34', moss: ['#88d048', '#3c9020'], rocky: false,
      plat: 'log', inner: ['#583020', '#3c2014', '#1c0c06']
    },
    cave: {
      grass: ['#98e050', '#3c9c20', '#1c6410'], grassD: '#0c3c08',
      dirt: ['#b07048', '#784028', '#40200c'], dirtD: '#200c04',
      stone: ['#b87850', '#7c4428', '#40200c'], mortar: '#1c0c04', moss: null, rocky: true,
      plat: 'rock', inner: ['#4c2c1c', '#341c10', '#180c06']
    },
    temple: {
      grass: ['#b8f070', '#58c030', '#2c7818'], grassD: '#185010',
      dirt: ['#d8a060', '#a86830', '#6c3c18'], dirtD: '#3c1c08',
      stone: ['#fcfcfc', '#dcd8e4', '#a8a0b8'], mortar: '#686078', moss: null, rocky: false,
      plat: 'marble', inner: ['#c8c0d8', '#a098b8', '#686080']
    }
  };
  const MARBLE = ['#fcfcfc', '#dcd8e4', '#a8a0b8', '#686078'];
  const TERRA = ['#fca070', '#d86030', '#903010', '#581808'];
  const DOOR = ['#78b0fc', '#2868d0', '#10388c'];

  const hash = (x, y, s) => {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  };
  O.hash = hash;

  function bevel(p, x, y, w, h, ramp, mortar) {
    p.rect(x, y, w, h, ramp[1]);
    p.rect(x, y, w, 1, ramp[0]); p.rect(x, y, 1, h, ramp[0]);
    p.rect(x, y + h - 1, w, 1, ramp[2]); p.rect(x + w - 1, y, 1, h, ramp[2]);
    if (mortar) { p.rect(x, y + h, w + 1, 1, mortar); p.rect(x + w, y, 1, h + 1, mortar); }
  }
  function veins(p, r, x0, y0, w, h, c, n) {
    for (let i = 0; i < n; i++) {
      let x = x0 + ((r() * w) | 0), y = y0 + ((r() * h) | 0);
      for (let k = 0; k < 6; k++) { p.set(x, y, c); x += r() < 0.5 ? 1 : 0; y += r() < 0.6 ? 1 : 0; if (x >= x0 + w || y >= y0 + h) break; }
    }
  }
  function pebble(p, x, y, ramp) {
    p.set(x, y, ramp[0]); p.set(x + 1, y, ramp[1]); p.set(x, y + 1, ramp[1]); p.set(x + 1, y + 1, ramp[2]);
  }

  /* ---------------- tile painters (16x16) ---------------- */
  const PAINT = {
    D(p, T, r) {
      const d = T.dirt;
      p.rect(0, 0, 16, 16, d[1]);
      for (let i = 0; i < 14; i++) p.set((r() * 16) | 0, (r() * 16) | 0, i % 3 ? d[2] : d[0]);
      for (let i = 0; i < 2; i++) pebble(p, (r() * 14) | 0, (r() * 14) | 0, [T.dirt[0], T.dirt[0], T.dirt[2]]);
      if (r() < 0.5) { const y = (r() * 12) | 0; p.rect((r() * 10) | 0, y, 4, 1, d[2]); }
    },
    q(p, T, r) {
      const d = [T.dirt[1], T.dirt[2], T.dirtD];
      p.rect(0, 0, 16, 16, d[1]);
      for (let i = 0; i < 14; i++) p.set((r() * 16) | 0, (r() * 16) | 0, i % 3 ? d[2] : d[0]);
      for (let i = 0; i < 2; i++) pebble(p, (r() * 14) | 0, (r() * 14) | 0, [d[0], d[0], d[2]]);
    },
    G(p, T, r) {
      PAINT.D(p, T, r);
      const g = T.grass;
      for (let x = 0; x < 16; x++) {
        const depth = 4 + ((r() * 3) | 0);
        p.rect(x, 0, 1, depth, g[1]);
        p.set(x, depth, T.grassD);
        if (r() < 0.25) p.set(x, depth + 1, T.grassD);
        p.set(x, 0, r() < 0.7 ? g[0] : g[1]);
        if (r() < 0.3) p.set(x, 1, g[0]);
        if (r() < 0.2) p.set(x, depth - 1, g[2]);
      }
    },
    B(p, T, r) {
      const s = T.stone;
      if (T.rocky) {
        p.rect(0, 0, 16, 16, s[2]);
        const n = 3 + ((r() * 2) | 0);
        for (let i = 0; i < n; i++) p.ball(2 + r() * 12, 2 + r() * 12, 3 + r() * 3, 3 + r() * 2, s);
        for (let i = 0; i < 6; i++) p.set((r() * 16) | 0, (r() * 16) | 0, T.mortar);
        return;
      }
      p.rect(0, 0, 16, 16, T.mortar);
      const split = r() < 0.5 ? 7 : 9;
      bevel(p, 0, 0, split, 7, s, null);
      bevel(p, split + 1, 0, 15 - split, 7, s, null);
      const s2 = r() < 0.5 ? 4 : 11;
      bevel(p, 0, 8, s2, 7, s, null);
      bevel(p, s2 + 1, 8, 15 - s2, 7, s, null);
      veins(p, r, 1, 1, 14, 14, s[2], 2);
      if (T.moss) {
        for (let x = 0; x < 16; x++) {
          if (r() < 0.55) { p.set(x, 0, T.moss[0]); if (r() < 0.5) p.set(x, 1, T.moss[1]); if (r() < 0.2) p.set(x, 2, T.moss[1]); }
        }
      }
    },
    P(p, T, r) {
      if (T.plat === 'log') {
        const b = ['#d89858', '#a06028', '#5c3010'];
        p.rect(0, 1, 16, 6, b[1]);
        p.rect(0, 1, 16, 1, b[0]); p.rect(0, 6, 16, 1, b[2]);
        for (let x = 1; x < 16; x += 4) p.rect(x + ((r() * 2) | 0), 3 + ((r() * 2) | 0), 2, 1, b[2]);
        p.rect(0, 0, 16, 1, K); p.rect(0, 7, 16, 1, K);
        p.set(3, 8, '#3c8c20'); p.set(3, 9, '#3c8c20'); p.set(11, 8, '#3c8c20');
        return;
      }
      const s = T.plat === 'rock' ? T.stone : MARBLE;
      p.rect(0, 0, 16, 7, K);
      bevel(p, 0, 1, 16, 5, s, null);
      p.rect(0, 6, 16, 1, s[2]);
      veins(p, r, 1, 2, 14, 3, s[2], 1);
    },
    C(p) { column(p, 0, 16); },
    c(p) {
      column(p, 8, 16);
      p.rect(0, 0, 16, 3, MARBLE[0]); p.rect(0, 3, 16, 1, MARBLE[3]);
      p.rect(0, 0, 16, 1, MARBLE[2]);
      p.rect(1, 4, 14, 4, MARBLE[1]);
      [[2, 6], [13, 6]].forEach((v) => { p.ball(v[0], v[1], 2.2, 2.2, MARBLE); p.set(v[0], v[1], MARBLE[3]); });
      p.rect(4, 7, 8, 1, MARBLE[2]);
    },
    b(p) {
      column(p, 0, 10);
      p.rect(1, 10, 14, 2, MARBLE[0]); p.rect(1, 11, 14, 1, MARBLE[2]);
      p.rect(0, 12, 16, 4, MARBLE[1]); p.rect(0, 12, 16, 1, MARBLE[0]); p.rect(0, 15, 16, 1, MARBLE[3]);
    },
    E(p) {
      p.rect(0, 0, 16, 16, MARBLE[1]);
      p.rect(0, 0, 16, 1, MARBLE[3]); p.rect(0, 1, 16, 1, MARBLE[0]);
      p.rect(0, 3, 16, 1, MARBLE[2]);
      meander(p, 0, 5, MARBLE[3], MARBLE[1]);
      p.rect(0, 11, 16, 1, MARBLE[3]);
      for (let x = 0; x < 16; x += 4) { p.rect(x + 1, 12, 2, 3, MARBLE[0]); p.set(x + 2, 14, MARBLE[2]); }
      p.rect(0, 15, 16, 1, MARBLE[3]);
    },
    M(p, T, r) { p.rect(0, 0, 16, 16, MARBLE[1]); veins(p, r, 0, 0, 16, 16, MARBLE[2], 1); for (let i = 0; i < 4; i++) p.set((r() * 16) | 0, (r() * 16) | 0, MARBLE[0]); },
    '<'(p) { for (let y = 0; y < 16; y++) { p.rect(15 - y, y, y + 1, 1, MARBLE[1]); p.set(15 - y, y, MARBLE[0]); if (y > 0) p.set(16 - y, y, MARBLE[0]); p.set(14 - y, y, K); } },
    '>'(p) { for (let y = 0; y < 16; y++) { p.rect(0, y, y + 1, 1, MARBLE[1]); p.set(y, y, MARBLE[2]); if (y > 0) p.set(y - 1, y, MARBLE[3]); p.set(y + 1, y, K); } },
    m(p, T, r, v) {
      const s = T.inner;
      p.rect(0, 0, 16, 16, s[2]);
      const off = v % 2 ? 8 : 0;
      [[0, 0], [1, 8]].forEach((row) => {
        const y = row[1], o = (off + row[0] * 8) % 16;
        [[o - 16, 15], [o, 15]].forEach((b) => {
          const x0 = Math.max(0, b[0]), x1 = Math.min(16, b[0] + b[1]);
          if (x1 <= x0) return;
          p.rect(x0, y, x1 - x0, 7, s[1]);
          p.rect(x0, y, x1 - x0, 1, s[0]);
          if (b[0] >= 0) p.rect(x0, y, 1, 7, s[0]);
        });
      });
      if (r() < 0.6) veins(p, r, 1, 1, 14, 14, s[0], 1);
      if (r() < 0.3) p.set((r() * 14 + 1) | 0, (r() * 14 + 1) | 0, s[2]);
    },
    n(p) { p.rect(0, 0, 16, 16, '#000000'); },
    H(p, T, r) {
      p.rect(0, 0, 16, 16, '#f4f0f8');
      for (let i = 0; i < 14; i++) p.set((r() * 16) | 0, (r() * 16) | 0, i % 2 ? '#dcd8e8' : '#fcfcfc');
      if (r() < 0.4) { const x = (r() * 12) | 0, y = (r() * 12) | 0; p.rect(x, y, 3, 2, '#e4e0ec'); }
    },
    w(p, T, r) {
      PAINT.H(p, T, r);
      p.rect(4, 3, 8, 9, K);
      p.rect(5, 4, 6, 7, '#f8d078'); p.rect(5, 4, 6, 2, '#fcf0a8'); p.rect(7, 4, 2, 7, '#c88830'); p.rect(5, 7, 6, 1, '#c88830');
      p.rect(1, 3, 3, 9, DOOR[1]); p.rect(12, 3, 3, 9, DOOR[1]);
      p.rect(1, 3, 1, 9, DOOR[0]); p.rect(12, 3, 1, 9, DOOR[0]); p.rect(3, 3, 1, 9, DOOR[2]); p.rect(14, 3, 1, 9, DOOR[2]);
      for (let y = 5; y < 12; y += 2) { p.rect(2, y, 1, 1, DOOR[2]); p.rect(13, y, 1, 1, DOOR[2]); }
      p.rect(3, 12, 10, 3, TERRA[1]); p.rect(3, 12, 10, 1, TERRA[0]); p.rect(3, 14, 10, 1, TERRA[2]);
      [[4, 11], [6, 10], [8, 11], [10, 10], [11, 11]].forEach((f, i) => { p.set(f[0], f[1], i % 2 ? '#f070b8' : '#fc3800'); p.set(f[0], f[1] + 1, '#38a818'); });
    },
    d(p, T, r, v, top) {
      p.rect(0, 0, 16, 16, '#f4f0f8');
      p.rect(2, top ? 2 : 0, 12, top ? 14 : 16, K);
      p.rect(3, top ? 3 : 0, 10, top ? 13 : 16, DOOR[1]);
      for (let x = 3; x < 13; x += 3) p.rect(x, top ? 3 : 0, 1, 16, DOOR[2]);
      p.rect(4, top ? 3 : 0, 1, 16, DOOR[0]);
      if (top) { p.rect(1, 0, 14, 2, MARBLE[1]); p.rect(1, 0, 14, 1, MARBLE[0]); p.rect(1, 2, 14, 1, MARBLE[3]); }
      else { p.rect(10, 3, 2, 2, '#f8b800'); p.set(10, 3, '#fcf088'); }
    },
    r(p) {
      p.rect(0, 0, 16, 16, TERRA[2]);
      for (let row = 0; row < 4; row++) {
        const off = row % 2 ? 2 : 0;
        for (let x = -4 + off; x < 16; x += 4) {
          p.rect(x, row * 4, 4, 3, TERRA[1]);
          p.rect(x, row * 4, 4, 1, TERRA[0]);
          p.set(x + 3, row * 4 + 1, TERRA[2]); p.set(x + 3, row * 4 + 2, TERRA[2]);
          p.rect(x, row * 4 + 3, 4, 1, TERRA[3]);
        }
      }
    },
    '('(p) { for (let y = 0; y < 16; y++) { for (let x = 15 - y; x < 16; x++) p.set(x, y, ((x + (y >> 2)) & 3) === 3 ? TERRA[2] : (y & 3) === 0 ? TERRA[0] : TERRA[1]); p.set(15 - y, y, K); if (y < 15) p.set(14 - y, y + 1, K); } },
    ')'(p) { for (let y = 0; y < 16; y++) { for (let x = 0; x <= y; x++) p.set(x, y, ((x + (y >> 2)) & 3) === 3 ? TERRA[2] : (y & 3) === 0 ? TERRA[0] : TERRA[1]); p.set(y, y, K); if (y < 15) p.set(y + 1, y + 1, K); } },
    X(p) {
      const Xr = ['#fcfcfc', '#b8c0d0', '#687088'];
      for (let s = 0; s < 4; s++) {
        const bx = s * 4;
        for (let y = 0; y < 10; y++) {
          const w = Math.max(1, Math.min(4, 1 + Math.floor(y / 3)));
          const x0 = bx + 2 - Math.ceil(w / 2);
          for (let i = 0; i < w; i++) p.set(x0 + i, 5 + y, i === 0 ? Xr[0] : i === w - 1 ? Xr[2] : Xr[1]);
        }
      }
      p.rect(0, 14, 16, 2, '#584848'); p.rect(0, 14, 16, 1, '#8c7878');
    },
    k(p, T, r) {
      const s = T.inner;
      p.rect(0, 0, 16, 16, s[2]);
      for (let i = 0; i < 4; i++) p.ball(r() * 16, r() * 16, 3 + r() * 3, 2 + r() * 3, s);
      for (let i = 0; i < 3; i++) p.set((r() * 16) | 0, (r() * 16) | 0, s[0]);
    }
  };
  function column(p, y0, y1) {
    const tones = [K, '#a8a0b8', '#dcd8e4', '#fcfcfc', '#fcfcfc', '#ece8f0', '#dcd8e4', '#d0c8dc', '#c0b8cc', '#a8a0b8', '#8880a0', '#686078', '#686078', K];
    for (let x = 1; x <= 14; x++) p.rect(x, y0, 1, y1 - y0, tones[x - 1]);
    [4, 7, 10].forEach((x) => { for (let y = y0; y < y1; y++) p.set(x, y, tones[x] === '#fcfcfc' ? '#c8c0d4' : '#8880a0'); });
  }
  const KEY = ['XXXXX.', '....X.', 'XXX.X.', 'X.X.X.', 'X...X.', 'XXXXX.'];
  function meander(p, x0, y0, c, bg) {
    for (let x = 0; x < 16; x++) for (let y = 0; y < 6; y++) p.set(x0 + x, y0 + y, KEY[y][(x + 16) % 6] === 'X' ? c : bg);
  }
  O.KEY = KEY;

  /* ---------------- decorations ---------------- */
  const OLIVE_LEAF = ['#a8cc80', '#78a058', '#446c34', '#d0e8a8'];
  const TRUNK = ['#b8ac90', '#847860', '#4c4434'];
  const OAK = ['#3c8c50', '#1c5c38', '#0c3020', '#68b070'];
  const CYP = ['#58a048', '#2c7030', '#144020'];
  const BUSH = ['#80d050', '#3c9c28', '#1c5c18', '#b8f080'];

  function canopy(p, cx, cy, rx, ry, n, rMin, rMax, ramp, r) {
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      blobs.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rMin + r() * (rMax - rMin)]);
    }
    blobs.sort((a, b) => a[1] - b[1]);
    blobs.forEach((b) => p.ball(b[0], b[1], b[2], b[2] * 0.85, [ramp[1], ramp[1], ramp[2]]));
    blobs.forEach((b) => p.ball(b[0] - 0.8, b[1] - 1, b[2] * 0.75, b[2] * 0.6, [ramp[3] || ramp[0], ramp[0], ramp[1]]));
  }

  const DECOR = {
    olive(r) {
      const p = new O.Pix(52, 58);
      p.stroke(26, 57, 24, 44, 2.6, TRUNK[1]);
      p.stroke(24, 44, 28, 34, 2.2, TRUNK[1]);
      p.stroke(28, 34, 20, 24, 1.6, TRUNK[1]);
      p.stroke(27, 36, 36, 26, 1.4, TRUNK[1]);
      p.stroke(24, 46, 14, 34, 1.2, TRUNK[1]);
      for (let y = 30; y < 58; y++) for (let x = 0; x < 52; x++) if (p.get(x, y) === TRUNK[1] && p.get(x - 1, y) === null) p.set(x, y, TRUNK[0]);
      for (let y = 30; y < 58; y++) for (let x = 51; x >= 0; x--) if (p.get(x, y) === TRUNK[1] && p.get(x + 1, y) === null) p.set(x, y, TRUNK[2]);
      canopy(p, 26, 20, 19, 12, 16, 5, 8, OLIVE_LEAF, r);
      for (let i = 0; i < 10; i++) p.set(8 + r() * 36, 10 + r() * 20, '#3c1c48');
      p.outline('#1c2c14');
      return p;
    },
    cypress(r) {
      const p = new O.Pix(16, 64);
      for (let y = 2; y < 60; y++) {
        const t = (y - 2) / 58;
        const w = Math.max(1, Math.round(Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) * 6.5));
        for (let x = 8 - w; x <= 7 + w; x++) {
          const rel = (x - (8 - w)) / (2 * w);
          let c = rel < 0.3 ? CYP[0] : rel > 0.72 ? CYP[2] : CYP[1];
          if (O.bayer(x, y) < 0.25 && ((x + y * 3) % 5 === 0)) c = rel < 0.5 ? CYP[0] : CYP[2];
          p.set(x, y, c);
        }
      }
      p.rect(7, 59, 2, 5, TRUNK[2]);
      p.outline('#0c200c');
      void r;
      return p;
    },
    oak(r) {
      const p = new O.Pix(68, 80);
      const bark = ['#7c5838', '#4c3420', '#281a0e'];
      p.stroke(34, 79, 33, 40, 4.5, bark[1]);
      p.stroke(34, 78, 26, 80, 2, bark[1]); p.stroke(34, 78, 43, 80, 2, bark[1]);
      p.stroke(33, 50, 20, 34, 2.2, bark[1]); p.stroke(34, 46, 48, 32, 2, bark[1]);
      for (let y = 30; y < 80; y++) for (let x = 0; x < 68; x++) {
        if (p.get(x, y) === bark[1]) {
          if (p.get(x - 1, y) === null) p.set(x, y, bark[0]);
          else if (p.get(x + 1, y) === null || p.get(x + 2, y) === null) p.set(x, y, bark[2]);
          else if (((x * 7 + y * 3) % 11) === 0) p.set(x, y, bark[2]);
        }
      }
      canopy(p, 34, 26, 28, 18, 22, 7, 11, OAK, r);
      p.outline('#040c08');
      return p;
    },
    bush(r) {
      const p = new O.Pix(30, 16);
      for (let i = 0; i < 5; i++) p.ball(5 + i * 5 + r() * 2, 9 + r() * 2, 5 + r() * 2, 5, BUSH);
      const fl = ['#fc3800', '#f070b8', '#fcf088', '#fcfcfc'];
      for (let i = 0; i < 6; i++) { const x = 3 + r() * 24, y = 4 + r() * 8; if (p.get(x | 0, y | 0)) p.set(x, y, fl[(r() * 4) | 0]); }
      p.outline('#0c300c');
      return p;
    },
    grass(r) {
      const p = new O.Pix(16, 10);
      const g = ['#b8f070', '#58c030', '#2c7818'];
      for (let x = 0; x < 16; x++) {
        const h = 3 + ((r() * 7) | 0), lean = r() < 0.5 ? -1 : 1;
        for (let y = 0; y < h; y++) p.set(x + (y > h * 0.6 ? lean : 0), 9 - y, y > h - 2 ? g[0] : y < 2 ? g[2] : g[1]);
      }
      if (r() < 0.7) { const x = 2 + r() * 12; p.set(x, 2, '#fcf088'); p.set(x + 1, 3, '#fcfcfc'); }
      return p;
    },
    flowers(r) {
      const p = new O.Pix(16, 8);
      const cols = ['#fc3800', '#f070b8', '#fcf088', '#9878f8', '#fcfcfc'];
      for (let i = 0; i < 6; i++) {
        const x = 1 + ((r() * 14) | 0), h = 2 + ((r() * 4) | 0);
        p.rect(x, 8 - h, 1, h, '#38a818');
        const c = cols[(r() * cols.length) | 0];
        p.set(x, 7 - h, c); p.set(x - 1, 8 - h, c); p.set(x + 1, 8 - h, c); p.set(x, 8 - h, '#fcf088');
      }
      return p;
    },
    amphora() {
      const p = new O.Pix(14, 22);
      p.ball(7, 12, 6, 7, TERRA);
      p.rect(5, 2, 4, 5, TERRA[1]); p.rect(5, 2, 1, 5, TERRA[0]);
      p.rect(4, 1, 6, 2, TERRA[0]); p.rect(4, 2, 6, 1, TERRA[2]);
      p.line(3, 4, 2, 8, TERRA[2]); p.line(10, 4, 11, 8, TERRA[2]);
      p.rect(2, 11, 11, 3, '#201008');
      for (let x = 2; x < 13; x++) if (x % 3 === 0) p.set(x, 12, TERRA[1]);
      p.rect(5, 19, 4, 2, TERRA[2]);
      p.outline(K);
      return p;
    },
    rocks(r) {
      const p = new O.Pix(26, 12);
      const s = ['#c8c8d0', '#8c8c9c', '#4c4c5c', '#e8e8f0'];
      p.ball(8, 7, 7, 5, s); p.ball(18, 8, 6, 4, s); p.ball(13, 5, 4, 4, s);
      for (let i = 0; i < 3; i++) p.set(4 + r() * 18, 9 + r() * 2, '#58a038');
      p.outline(K);
      return p;
    },
    fence() {
      const p = new O.Pix(18, 14);
      const b = ['#d89858', '#a06028', '#5c3010'];
      [1, 8, 15].forEach((x) => { p.rect(x, 1, 2, 13, b[1]); p.set(x, 1, b[0]); p.rect(x + 1, 2, 1, 12, b[2]); });
      [4, 9].forEach((y) => { p.rect(0, y, 18, 2, b[1]); p.rect(0, y, 18, 1, b[0]); });
      p.outline(K);
      return p;
    },
    mushrooms(r) {
      const p = new O.Pix(14, 9);
      [[3, 5, 3], [9, 4, 4]].forEach((m) => {
        p.rect(m[0] - 1, m[1], 2, 9 - m[1], '#e8dcb0');
        p.ball(m[0], m[1], m[2], m[2] * 0.7, ['#fc7050', '#d82800', '#881000']);
        p.set(m[0] - 1, m[1] - 1, '#fcfcfc'); p.set(m[0] + 1, m[1], '#fcfcfc');
      });
      void r;
      p.outline(K);
      return p;
    },
    curtain() {
      const p = new O.Pix(22, 70);
      const R = ['#fc7050', '#d82800', '#881000'];
      for (let y = 4; y < 70; y++) {
        const pinch = y > 34 && y < 42 ? 3 : 0;
        const w = 20 - pinch * 2 - Math.max(0, (y - 42) * 0.05);
        for (let x = 0; x < w; x++) {
          const f = (x + (y > 42 ? (y - 42) * 0.1 : 0)) % 5;
          p.set(1 + x + pinch, y, f < 1.2 ? R[0] : f > 3.5 ? R[2] : R[1]);
        }
      }
      p.rect(0, 0, 22, 5, '#f8b800'); p.rect(0, 0, 22, 1, '#fcf088'); p.rect(0, 4, 22, 1, '#a86000');
      p.rect(3, 36, 16, 3, '#f8b800'); p.rect(3, 36, 16, 1, '#fcf088');
      p.outline(K);
      return p;
    },
    window() {
      const p = new O.Pix(34, 50);
      const s = MARBLE;
      p.ellipse(17, 16, 16, 16, s[1]); p.rect(1, 16, 32, 34, s[1]);
      p.ellipse(17, 16, 12, 12, '#0c1848'); p.rect(5, 16, 24, 30, '#0c1848');
      O.bands(p, 5, 4, 24, 42, ['#08082c', '#0c1848', '#18286c', '#283c8c']);
      for (let y = 0; y < 50; y++) for (let x = 0; x < 34; x++) {
        const dx = x - 17, dy = y - 16;
        const inArch = y >= 16 ? x >= 5 && x < 29 && y < 46 : dx * dx + dy * dy <= 144;
        const inFrame = y >= 16 ? x >= 1 && x < 33 : dx * dx + dy * dy <= 256;
        if (!inFrame) p.set(x, y, null);
        else if (!inArch) p.set(x, y, s[1]);
      }
      [[9, 10], [22, 8], [14, 22], [25, 30], [8, 34]].forEach((q) => p.set(q[0], q[1], '#fcfcfc'));
      p.ball(22, 20, 4, 4, ['#fcfcf0', '#f0e8c8', '#c8c0a0']);
      p.rect(16, 4, 2, 42, s[1]); p.rect(5, 26, 24, 2, s[1]);
      p.rect(1, 46, 32, 4, s[0]); p.rect(1, 49, 32, 1, s[3]);
      p.outline(K);
      return p;
    },
    stalactite(r) {
      const p = new O.Pix(18, 24);
      const s = ['#b87850', '#7c4428', '#40200c'];
      [[4, 14], [9, 22], [14, 10]].forEach((q) => {
        for (let y = 0; y < q[1]; y++) {
          const w = Math.max(0, Math.round((1 - y / q[1]) * 3));
          for (let x = -w; x <= w; x++) p.set(q[0] + x, y, x < 0 ? s[0] : x > 0 ? s[2] : s[1]);
        }
      });
      void r;
      p.outline(K);
      return p;
    },
    crystals(r) {
      const p = new O.Pix(20, 18);
      const C = ['#e0fcfc', '#40d8e0', '#087080'];
      [[5, 7, 3], [10, 2, 3], [15, 8, 2]].forEach((q) => {
        for (let y = q[1]; y < 18; y++) {
          const w = y < q[1] + q[2] ? Math.round((y - q[1] + 1) * q[2] / q[2]) : q[2];
          for (let x = -w; x <= w; x++) p.set(q[0] + x, y, x < 0 ? C[0] : x > 0 ? C[2] : C[1]);
        }
      });
      void r;
      p.outline('#041c20');
      return p;
    },
    pedestal() {
      const p = new O.Pix(22, 12);
      bevel(p, 1, 0, 20, 3, MARBLE, null);
      bevel(p, 3, 3, 16, 6, MARBLE, null);
      bevel(p, 0, 9, 22, 3, MARBLE, null);
      p.outline(K);
      return p;
    }
  };

  const tileCache = {};
  const decorCache = {};
  const bgCache = {};

  O.Tiles = {
    THEMES,
    theme(name) { return THEMES[name] || THEMES.village; },
    // variant: small integer used to pick among random variations; top: door top piece
    get(theme, ch, variant, extra) {
      const key = theme + ':' + ch + ':' + (variant || 0) + ':' + (extra ? 1 : 0);
      if (tileCache[key] !== undefined) return tileCache[key];
      const fn = PAINT[ch];
      if (!fn) { tileCache[key] = null; return null; }
      const p = new O.Pix(16, 16);
      fn(p, O.Tiles.theme(theme), O.rng(hash(ch.charCodeAt(0), variant || 0, theme.length) || 1), variant || 0, extra);
      tileCache[key] = p.canvas();
      return tileCache[key];
    },
    decor(type, seed) {
      const key = type + ':' + (seed || 0);
      if (decorCache[key]) return decorCache[key];
      const fn = DECOR[type];
      if (!fn) return null;
      const pix = fn(O.rng(hash(type.length, seed || 0, 7) || 1));
      decorCache[key] = { c: pix.canvas(), w: pix.w, h: pix.h };
      return decorCache[key];
    },
    // Dither overlay used to darken deep dirt rows.
    shade(level) {
      const key = 'shade:' + level;
      if (tileCache[key]) return tileCache[key];
      const p = new O.Pix(16, 16);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (O.bayer(x, y) < level) p.set(x, y, '#000000');
      tileCache[key] = p.canvas();
      return tileCache[key];
    },
    tuft(theme, v) {
      const key = 'tuft:' + theme + ':' + v;
      if (tileCache[key]) return tileCache[key];
      const g = O.Tiles.theme(theme).grass;
      const r = O.rng(hash(v, 3, 9) || 1);
      const p = new O.Pix(16, 4);
      for (let x = 0; x < 16; x++) {
        const h = r() < 0.45 ? (r() < 0.3 ? 3 : r() < 0.6 ? 2 : 1) : 0;
        for (let y = 0; y < h; y++) p.set(x, 3 - y, y === h - 1 ? g[0] : g[1]);
      }
      tileCache[key] = p.canvas();
      return tileCache[key];
    },
    // Parallax: { sky: canvas(256x208), layers: [{c, f}] } — layers are 512 wide and repeat.
    background(theme) {
      if (bgCache[theme]) return bgCache[theme];
      const bg = BG[theme] ? BG[theme]() : BG.temple();
      bgCache[theme] = bg;
      return bg;
    },
    KEY
  };

  /* ---------------- backgrounds ---------------- */
  const H = 208, LW = 512;
  function ridge(p, base, amp, freqs, ramp, snow, seed) {
    const r = O.rng(seed);
    const ph = freqs.map(() => r() * Math.PI * 2);
    const hAt = (x) => base + freqs.reduce((s, f, i) => s + Math.sin((x / LW) * Math.PI * 2 * f[0] + ph[i]) * f[1], 0) * amp;
    for (let x = 0; x < LW; x++) {
      const h = Math.round(hAt(x)), slope = hAt(x + 1) - hAt(x - 1);
      for (let y = H - h; y < H; y++) {
        let c = slope > 0.25 ? ramp[0] : slope < -0.25 ? ramp[2] : ramp[1];
        if (Math.abs(slope) <= 0.25 && O.bayer(x, y) < 0.5) c = slope > 0 ? ramp[0] : ramp[2];
        if (snow && y < H - snow.at) c = slope > -0.1 ? snow.c[0] : snow.c[1];
        else if (snow && y < H - snow.at + 3 && O.bayer(x, y) < 0.5) c = snow.c[1];
        p.set(x, y, c);
      }
    }
    return hAt;
  }
  function cloud(p, x, y, w, ramp) {
    for (let i = 0; i < w / 6; i++) p.ball(x + i * 6, y + Math.sin(i * 1.7) * 2, 6 + (i % 3) * 2, 4 + (i % 2) * 2, ramp);
    for (let i = 0; i < w / 6; i++) { p.ball(x + i * 6 + 1, y + 3, 6, 3, [ramp[1], ramp[1], ramp[2]]); }
  }
  function layer(fn) { const p = new O.Pix(LW, H); fn(p); return p.canvas(); }
  function sky(colors, extra) {
    const p = new O.Pix(256, H);
    O.bands(p, 0, 0, 256, H, colors);
    if (extra) extra(p);
    return p.canvas();
  }
  function stars(p, n, maxY, r) {
    for (let i = 0; i < n; i++) p.set(r() * p.w, r() * maxY, i % 5 ? '#8888c8' : '#fcfcfc');
  }

  const BG = {
    village() {
      const r = O.rng(11);
      return {
        sky: sky(['#3868f0', '#4478f4', '#5088f8', '#6098fc', '#78acfc', '#94c0fc', '#b4d4fc', '#d4e8fc'], (p) => {
          for (let y = 0; y < 60; y++) for (let x = 170; x < 240; x++) {
            const d = Math.hypot(x - 205, y - 30);
            if (d < 9) p.set(x, y, '#fcfcf0');
            else if (d < 12) p.set(x, y, '#fcf4c8');
            else if (d < 18 && O.bayer(x, y) < (18 - d) / 12) p.set(x, y, '#fcf4c8');
          }
        }),
        layers: [
          { f: 0.06, c: layer((p) => {
            const peaks = [[40, 70, 0.9], [150, 128, 0.85], [205, 96, 1], [300, 82, 0.8], [380, 110, 0.9], [470, 74, 0.95]];
            const hAt = (x) => {
              let h = 40;
              peaks.forEach((k) => { for (const o of [-LW, 0, LW]) h = Math.max(h, k[1] - Math.abs(x - k[0] - o) * k[2]); });
              return h + Math.sin(x * 0.2) * 1.5 + Math.sin(x * 0.07) * 3;
            };
            const rock = ['#c8c8f4', '#9498dc', '#6468b0'], snow = ['#fcfcfc', '#d0d8f8'];
            for (let x = 0; x < LW; x++) {
              const h = Math.round(hAt(x)), sl = hAt(x + 1) - hAt(x - 1);
              for (let y = H - h; y < H; y++) {
                const alt = H - y;
                const lit = sl < -0.2;
                let c = lit ? rock[0] : sl > 0.2 ? rock[2] : rock[1];
                if (Math.abs(sl) <= 0.2 && O.bayer(x, y) < 0.5) c = rock[1];
                if (alt > 78 + Math.sin(x * 0.3) * 4) c = lit ? snow[0] : snow[1];
                else if (alt > 72 && O.bayer(x, y) < (alt - 72) / 8) c = lit ? snow[0] : snow[1];
                p.set(x, y, c);
              }
            }
            const px = 150, py = H - Math.round(hAt(px));
            p.rect(px - 5, py - 6, 11, 2, '#f8b800'); p.rect(px - 6, py - 7, 13, 1, '#fcf088');
            for (let x = px - 5; x <= px + 5; x += 2) p.rect(x, py - 4, 1, 4, '#fcf088');
            cloud(p, 20, 120, 90, ['#fcfcfc', '#e8f0fc', '#b8c8f0']);
            cloud(p, 240, 112, 70, ['#fcfcfc', '#e8f0fc', '#b8c8f0']);
            cloud(p, 380, 126, 110, ['#fcfcfc', '#e8f0fc', '#b8c8f0']);
          }) },
          { f: 0.22, c: layer((p) => {
            const hAt = ridge(p, 52, 1, [[2, 10], [5, 5], [9, 3]], ['#9cd868', '#6cb448', '#48903c'], null, 5);
            for (let i = 0; i < 22; i++) {
              const x = (r() * LW) | 0, top = H - Math.round(hAt(x));
              const hh = 10 + ((r() * 12) | 0);
              for (let y = 0; y < hh; y++) {
                const w = Math.max(0, Math.round(Math.sin((y / hh) * Math.PI * 0.8) * 2));
                for (let k = -w; k <= w; k++) p.set(x + k, top - hh + y + 2, k < 0 ? '#3c8840' : '#205c2c');
              }
            }
            for (let i = 0; i < 8; i++) {
              const x = (r() * LW) | 0, top = H - Math.round(hAt(x));
              p.rect(x, top - 3, 6, 4, '#f4f0f8'); p.rect(x, top - 4, 6, 1, '#d86030'); p.set(x + 2, top - 2, '#2868d0');
            }
          }) },
          { f: 0.45, c: layer((p) => {
            for (let x = 0; x < LW; x += 9) {
              const y = 172 + Math.sin(x * 0.05) * 4;
              p.ball(x + r() * 4, y, 7 + r() * 5, 6 + r() * 3, ['#a8d078', '#78a850', '#4c7c38']);
            }
            p.rect(0, 184, LW, 24, '#4c7c38');
          }) }
        ]
      };
    },
    forest() {
      const r = O.rng(21);
      return {
        sky: sky(['#080820', '#0c1038', '#141850', '#241e68', '#3a2678', '#583084', '#7c3c88', '#a45088', '#c86c80', '#e49078'], (p) => {
          stars(p, 60, 90, r);
          p.ball(58, 38, 15, 15, ['#fcfcf0', '#f0e8c8', '#c8bc98', '#fcfcfc']);
          [[52, 34, 3], [63, 44, 2], [60, 30, 2]].forEach((c) => p.ball(c[0], c[1], c[2], c[2], ['#d8d0b0', '#c8bc98', '#a89c78']));
          for (let y = 14; y < 64; y++) for (let x = 30; x < 88; x++) {
            const d = Math.hypot(x - 58, y - 38);
            if (d > 16 && d < 24 && O.bayer(x, y) < (24 - d) / 16) p.set(x, y, '#3a3480');
          }
        }),
        layers: [
          { f: 0.08, c: layer((p) => { ridge(p, 96, 1, [[2, 14], [5, 8], [11, 3]], ['#3c2c6c', '#2c2058', '#1c1440'], null, 8); }) },
          { f: 0.25, c: layer((p) => {
            for (let x = -20; x < LW + 20; x += 26 + ((r() * 10) | 0)) {
              const top = 70 + r() * 30;
              p.rect(x + 8, top + 20, 5, H - top, '#101c2c');
              for (let i = 0; i < 6; i++) p.ball(x + 10 + (r() - 0.5) * 26, top + r() * 26, 10 + r() * 6, 9 + r() * 5, ['#24405c', '#16283c', '#0c1824']);
            }
            p.rect(0, 180, LW, 28, '#0c1824');
          }) },
          { f: 0.5, c: layer((p) => {
            for (let x = 0; x < LW; x += 12) p.ball(x + r() * 6, 186 + r() * 6, 10 + r() * 6, 8 + r() * 4, ['#183c24', '#0c2818', '#04140c']);
            p.rect(0, 194, LW, 14, '#04140c');
          }) }
        ]
      };
    },
    cave() {
      const r = O.rng(31);
      return {
        sky: sky(['#0c0604', '#140a06', '#1c0e08', '#24140c', '#1c0e08']),
        layers: [
          { f: 0.15, c: layer((p) => {
            for (let x = 0; x < LW; x += 18 + ((r() * 14) | 0)) {
              const len = 20 + r() * 60, w = 4 + r() * 8;
              for (let y = 0; y < len; y++) { const ww = w * (1 - y / len); p.rect(x - ww, y, ww * 2, 1, '#2c1810'); }
              const up = 16 + r() * 40, uw = 5 + r() * 8;
              for (let y = 0; y < up; y++) { const ww = uw * (1 - y / up); p.rect(x + 8 - ww, H - y, ww * 2, 1, '#2c1810'); }
            }
            for (let i = 0; i < 14; i++) { const x = r() * LW, y = 60 + r() * 100; p.set(x, y, '#40d8e0'); p.set(x + 1, y + 1, '#087080'); }
          }) },
          { f: 0.35, c: layer((p) => {
            for (let x = 0; x < LW; x += 60 + ((r() * 40) | 0)) {
              const w = 10 + r() * 10;
              for (let y = 0; y < H; y++) {
                const ww = w + Math.sin(y * 0.08 + x) * 3;
                for (let k = -ww; k <= ww; k++) p.set(x + k, y, k < -ww + 2 ? '#5c3824' : k > ww - 3 ? '#1c0e08' : '#3c2418');
              }
            }
          }) }
        ]
      };
    },
    temple() {
      const r = O.rng(41);
      return { sky: sky(['#080820', '#0c1038', '#141850'], (p) => stars(p, 50, 200, r)), layers: [] };
    }
  };
})(window.OLY);
