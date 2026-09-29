/* core.js — namespace, NES palette, utilities and bitmap font */
window.OLY = window.OLY || {};
(function (O) {
  'use strict';

  // Modern widescreen pixel resolution (16:9, scales x5 to 1080p).
  // The world (13 rows of 16px tiles = 208px) is drawn 8px below the top; the HUD overlays it.
  O.W = 384;
  O.H = 216;
  O.TILE = 16;
  O.HUD_H = 8; // world Y offset on screen (kept under this name for compatibility)
  O.VIEW_Y = 8;
  O.ROWS = 13;

  // Character -> color map used by every pixel-art string in sprites.js.
  // Values come from the NES (2C02) palette.
  O.PAL = {
    K: '#000000', W: '#fcfcfc', w: '#bcbcbc', A: '#7c7c7c',
    S: '#fca044', s: '#e45c10', H: '#881400', h: '#503000', B: '#ac7c00',
    R: '#d82800', r: '#a81000', Y: '#f8b800', y: '#fce0a8',
    G: '#00a800', E: '#005800', L: '#58d854',
    P: '#6844fc', p: '#4428bc', U: '#0058f8', u: '#3cbcfc',
    Z: '#f878f8', C: '#00e8d8', V: '#9878f8'
  };

  O.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  O.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  O.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').imageSmoothingEnabled = false;
    return c;
  };
  // Deterministic xorshift RNG (tiles and backgrounds look the same every run).
  O.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  };
  // Log an error only once per key (art modules must never crash the game loop).
  const logged = {};
  O.logOnce = function (key, err) { if (logged[key]) return; logged[key] = 1; console.error('[' + key + ']', err); };
  O.pad = (n, len) => String(Math.max(0, n | 0)).padStart(len, '0');

  /* ---------- 5x7 bitmap font inside 8x8 cells ---------- */
  const GLYPHS = {
    A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14],
    D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
    G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14],
    J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
    M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
    P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
    S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14],
    V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
    Y: [17, 17, 17, 10, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
    0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31],
    3: [31, 2, 4, 2, 1, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14],
    6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
    9: [14, 17, 17, 15, 1, 2, 12],
    '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], '!': [4, 4, 4, 4, 4, 0, 4],
    '?': [14, 17, 1, 2, 4, 0, 4], "'": [4, 4, 8, 0, 0, 0, 0], '-': [0, 0, 0, 31, 0, 0, 0],
    ':': [0, 12, 12, 0, 12, 12, 0], '/': [1, 1, 2, 4, 8, 16, 16], '(': [2, 4, 8, 8, 8, 4, 2],
    ')': [8, 4, 2, 2, 2, 4, 8], '"': [10, 10, 0, 0, 0, 0, 0], '>': [8, 4, 2, 1, 2, 4, 8],
    '<': [2, 4, 8, 16, 8, 4, 2], '+': [0, 4, 4, 31, 4, 4, 0], '=': [0, 0, 31, 0, 31, 0, 0],
    '*': [0, 10, 31, 31, 14, 4, 0], '^': [4, 10, 17, 0, 0, 0, 0]
  };
  const CHARS = Object.keys(GLYPHS);
  const INDEX = {};
  CHARS.forEach((ch, i) => { INDEX[ch] = i; });
  const atlases = {};

  function atlas(color) {
    if (atlases[color]) return atlases[color];
    const c = O.makeCanvas(CHARS.length * 8, 8);
    const g = c.getContext('2d');
    g.fillStyle = color;
    CHARS.forEach((ch, i) => {
      const rows = GLYPHS[ch];
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 5; x++) {
          if (rows[y] & (16 >> x)) g.fillRect(i * 8 + 1 + x, y, 1, 1);
        }
      }
    });
    atlases[color] = c;
    return c;
  }

  O.text = function (ctx, str, x, y, color, scale) {
    const a = atlas(color || '#fcfcfc');
    const s = scale || 1;
    const t = String(str).toUpperCase();
    for (let i = 0; i < t.length; i++) {
      const k = INDEX[t[i]];
      if (k !== undefined) ctx.drawImage(a, k * 8, 0, 8, 8, Math.round(x + i * 8 * s), Math.round(y), 8 * s, 8 * s);
    }
  };
  O.textCenter = function (ctx, str, y, color, scale) {
    const s = scale || 1;
    O.text(ctx, str, Math.round((O.W - String(str).length * 8 * s) / 2), y, color, s);
  };
  O.textShadow = function (ctx, str, x, y, color, shadow, scale) {
    O.text(ctx, str, x + (scale || 1), y + (scale || 1), shadow, scale);
    O.text(ctx, str, x, y, color, scale);
  };

  // Word-wrap text to lines of at most `max` characters.
  O.wrap = function (text, max) {
    const words = String(text).toUpperCase().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach((w) => {
      if (!line.length) line = w;
      else if (line.length + 1 + w.length <= max) line += ' ' + w;
      else { lines.push(line); line = w; }
    });
    if (line.length) lines.push(line);
    return lines;
  };
})(window.OLY);
