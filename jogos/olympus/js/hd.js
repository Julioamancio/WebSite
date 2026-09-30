/* hd.js — HD layer (1920x1080 = the 384x216 game units drawn at x5).
   Loads the 2.5D art (AutoSprite sheets listed in assets/web/sprites/manifest.js + Flow scenery),
   registers the HD frames into O.SPR under the engine's frame names (they replace the procedural ones),
   draws the Flow backgrounds, rooms and building facades, and tells renderLevel which tiles the art replaces.
   If anything fails to load the game keeps the procedural art. */
(function (O) {
  'use strict';
  const S = O.S = 5;
  const T = O.TILE, VY = O.VIEW_Y, W = O.W, H = O.H, FLOOR = 11 * O.TILE + O.VIEW_Y;
  const BASE = 'assets/web/';
  const HD = O.HD = { on: false, img: {}, sheets: {} };
  O.px = (v) => Math.round(v * S) / S; // snap to one device pixel

  // Height of each character in game units, feet to top of head (ORPHEUS_MEMORIA_COMPLETA 7.5).
  const HEIGHT = { orpheus: 40, lyre: 40, eurydice: 37, elder: 36, merchant: 37, villager: 36, zeus: 48, hermes: 46, hades: 46,
    boar: 48, satyr: 44, bat: 15, snake: 10 };
  const charOf = (sheet) => (sheet.indexOf('orpheus_lyre') === 0 ? 'lyre' : sheet.split('_')[0]);

  function loadImg(src) {
    return new Promise((ok) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => { console.warn('[hd] faltou', src); ok(null); };
      i.src = src;
    });
  }

  /* ---------- HD frames ---------- */
  function bake(e, w, h, flip, white) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (flip) { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(e.img, e.sx, 0, e.sw, e.sh, 0, 0, c.width, c.height);
    if (white) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); }
    return c;
  }
  function hdFrame(img, sx, m, k) {
    const e = { hd: true, img, sx, sw: m.w, sh: m.h, k, w: m.w * k, h: m.h * k, ax: m.ax * k, ay: m.ay * k };
    const cache = {};
    // Legacy code may draw s.n / s.f directly at 1:1 in game units: give it unit-sized canvases.
    ['n', 'f', 'wn', 'wf'].forEach((key) => Object.defineProperty(e, key, {
      get() { return cache[key] || (cache[key] = bake(e, e.w, e.h, key === 'f' || key === 'wf', key[0] === 'w')); }
    }));
    e.white = (flip) => cache['W' + flip] || (cache['W' + flip] = bake(e, e.w * S, e.h * S, flip, true));
    return e;
  }
  HD.drawFrame = function (ctx, e, x, y, flip, white, alpha) {
    const sx = O.px(flip ? x - (e.w - e.ax) : x - e.ax), sy = O.px(y - e.ay);
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha *= alpha;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (white) ctx.drawImage(e.white(!!flip), sx, sy, e.w, e.h);
    else if (flip) { ctx.translate(sx + e.w, sy); ctx.scale(-1, 1); ctx.drawImage(e.img, e.sx, 0, e.sw, e.sh, 0, 0, e.w, e.h); }
    else ctx.drawImage(e.img, e.sx, 0, e.sw, e.sh, sx, sy, e.w, e.h);
    ctx.restore();
    return { sx, sy, s: e };
  };

  function registerSheets() {
    const M = window.OLY_SPRITES || {};
    // Each character takes its scale from one reference sheet, so every animation keeps the same size.
    const ref = {}, PRIO = ['_idle', '_walk', '_move', '_fly'];
    Object.keys(M).forEach((n) => {
      const c = charOf(n);
      if (c === 'lyre') { if (n === 'orpheus_lyre_play') ref.lyre = M[n].body; return; }
      const cand = PRIO.map((suf) => M[c + suf]).find(Boolean);
      if (cand) ref[c] = cand.body;
    });
    Object.keys(M).forEach((n) => {
      const m = M[n], img = HD.sheets[n], c = charOf(n);
      if (!img) return;
      const k = (HEIGHT[c] || 40) / (ref[c] || m.body);
      Object.keys(m.frames).forEach((fname) => { O.SPR[fname] = hdFrame(img, m.frames[fname], m, k); });
    });
  }

  /* ---------- scenery ---------- */
  // Outdoor levels: sky + parallax layers (bottom-aligned just under the grass line). Rooms: one Flow image whose
  // floor line (fraction of its height) sits on the collision floor. Facades replace the tile buildings.
  const SCENES = {
    village: { sky: 'day', layers: [['vila_longe', 0.06, 200], ['vila_meio', 0.18, 198], ['vila_perto', 0.4, 196]],
      facades: [['casa_anciao', 1.2, 8.8], ['casa_vila', 14.4, 21.6], ['barraca_mercadora', 22.9, 27.4], ['templo_zeus_fachada', 30.4, 42.6]],
      hide: 'Hrw()dmnCcbEM<>', hideB: [30, 42], plinth: [30, 43, 10] },
    forest: { sky: 'floresta_ceu', layers: [['floresta_longe', 0.06, 202], ['floresta_meio', 0.2, 200], ['floresta_perto', 0.42, 204]],
      facades: [['entrada_caverna', 101.6, 112.4]], hide: 'n', hideB: [104, 111] },
    zeus: { room: 'templo_zeus', floor: 0.93, hide: 'mkEMCcbB', door: [0, 7, 2, 4] },
    hermes: { room: 'santuario_hermes', floor: 0.86, hide: 'mkEMCcbB', door: [0, 7, 2, 4] },
    den: { room: 'caverna_fundo', floor: 0.81, hide: 'mkEMCcbB', door: [1, 8, 2, 3] }
  };
  HD.scene = (lvl) => (HD.on && lvl && SCENES[lvl.id]) || null;

  // renderLevel asks this before drawing a tile: true = the HD art already shows it (collision is unchanged).
  HD.hideTile = function (lvl, ch, x, y) {
    const sc = HD.scene(lvl);
    if (!sc) return false;
    if (sc.room) return 'mkEMCcbBn'.indexOf(ch) >= 0;
    if ('GDBPX'.indexOf(ch) >= 0) return true; // HD ground, stones, planks and spikes (drawGround)
    return sc.hide.indexOf(ch) >= 0;
  };

  /* ---------- HD ground (grass + earth), drawn live for the visible columns ---------- */
  const GROUND = {
    village: { grass: ['#9ccc55', '#76a83e', '#557f2c'], tip: '#c8ec86', dirt: ['#9b7651', '#7d5b3b', '#5f432b'], peb: ['#c2a282', '#6b4d33'] },
    forest: { grass: ['#3a7a70', '#2a5d57', '#1d423f'], tip: '#5fae9c', dirt: ['#2f3242', '#232534', '#181a26'], peb: ['#454a5e', '#14151d'] }
  };
  const groundCache = {};
  function seeded(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
  function groundTile(theme, kind, v) {
    const key = theme + kind + v;
    if (groundCache[key]) return groundCache[key];
    const P = GROUND[theme] || GROUND.village, U = S, TOP = kind === 'G' ? 7 : 0;
    const c = document.createElement('canvas'); c.width = T * U; c.height = (T + TOP) * U;
    const g = c.getContext('2d'), r = seeded(v * 7 + (kind === 'G' ? 3 : 1) + theme.length);
    const y0 = TOP * U;
    g.fillStyle = P.dirt[1]; g.fillRect(0, y0, c.width, c.height - y0); // flat: depth shading is one continuous gradient per column
    for (let i = 0; i < 26; i++) { // pebbles and soil specks
      const x = r() * c.width, y = y0 + r() * (c.height - y0), rr = (0.5 + r() * 1.6) * U * 0.6;
      g.fillStyle = i % 3 ? P.peb[1] : P.peb[0]; g.globalAlpha = 0.35 + r() * 0.35;
      g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    if (kind === 'G') {
      const gb = y0 + 4 * U, gg = g.createLinearGradient(0, y0 - 2 * U, 0, gb);
      gg.addColorStop(0, P.grass[0]); gg.addColorStop(0.6, P.grass[1]); gg.addColorStop(1, P.grass[2]);
      g.fillStyle = gg;
      g.beginPath(); g.moveTo(0, gb);
      for (let x = 0; x <= c.width; x += U * 1.6) g.lineTo(x, y0 + (r() - 0.5) * U * 1.4);
      g.lineTo(c.width, gb);
      // soft lip where the grass meets the earth
      g.quadraticCurveTo(c.width / 2, gb + U * 1.4, 0, gb); g.fill();
      for (let i = 0; i < 22; i++) { // blades
        const x = r() * c.width, h = (2.5 + r() * 4.5) * U, lean = (r() - 0.5) * U * 2.2, w = U * (0.35 + r() * 0.35);
        const bg = g.createLinearGradient(0, y0 + U - h, 0, y0 + U);
        bg.addColorStop(0, P.tip); bg.addColorStop(1, P.grass[1]);
        g.fillStyle = bg;
        g.beginPath(); g.moveTo(x - w, y0 + U * 1.5); g.quadraticCurveTo(x + lean * 0.3, y0 + U - h * 0.5, x + lean, y0 + U - h);
        g.quadraticCurveTo(x + lean * 0.4 + w * 0.4, y0 + U - h * 0.4, x + w, y0 + U * 1.5); g.fill();
      }
    }
    groundCache[key] = { c, top: TOP };
    return groundCache[key];
  }
  HD.drawGround = function (c, g) {
    const sc = HD.scene(g.lvl);
    if (!sc || sc.room) return;
    const lvl = g.lvl, cam = g.cam, theme = lvl.theme === 'forest' ? 'forest' : 'village';
    const solid = (x, y) => { const ch = lvl.tile(x, y); return ch === 'G' || ch === 'D' || ch === 'B'; };
    const x0 = Math.max(0, Math.floor(cam / T) - 1), x1 = Math.min(lvl.w - 1, Math.ceil((cam + W) / T) + 1);
    const earth = (x, y) => { const ch = lvl.tile(x, y); return ch === 'G' || ch === 'D'; };
    c.save();
    c.imageSmoothingEnabled = true;
    // 1) earth, then one continuous darkening per column (no seam between rows)
    for (let x = x0; x <= x1; x++) {
      const sx = O.px(x * T - cam);
      for (let y = 0; y < lvl.h; y++) {
        if (!earth(x, y) || (lvl.tile(x, y) === 'G' && !solid(x, y - 1))) continue;
        c.drawImage(groundTile(theme, 'D', (x * 7 + y * 3) % 4).c, sx, y * T + VY, T, T);
      }
      let top = -1;
      for (let y = 0; y < lvl.h; y++) if (earth(x, y)) { top = y; break; }
      if (top < 0) { // a pit: fade into darkness instead of showing the bottom of the scenery
        const py = 11 * T + VY - 6, pg = c.createLinearGradient(0, py, 0, H);
        pg.addColorStop(0, 'rgba(4,5,12,0)'); pg.addColorStop(0.35, 'rgba(4,5,12,0.85)'); pg.addColorStop(1, 'rgba(2,2,6,1)');
        c.fillStyle = pg; c.fillRect(sx, py, T + 0.5, H - py);
        continue;
      }
      const y0 = top * T + VY + 3, gr = c.createLinearGradient(0, y0, 0, H);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.25, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = gr; c.fillRect(sx, y0, T, H - y0);
    }
    // 2) grass caps (their blades overhang the tile above) + shaded exposed sides
    for (let y = 0; y < lvl.h; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!earth(x, y)) continue;
        const cap = lvl.tile(x, y) === 'G' && !solid(x, y - 1), sx = O.px(x * T - cam);
        if (cap) { const tl = groundTile(theme, 'G', (x * 7 + y * 3) % 4); c.drawImage(tl.c, sx, y * T + VY - tl.top, T, T + tl.top); }
        [[-1, 0], [1, T - 6]].forEach(([dx, ox]) => {
          if (solid(x + dx, y)) return;
          const gr = c.createLinearGradient(sx + (dx < 0 ? 0 : T), 0, sx + (dx < 0 ? 6 : T - 6), 0);
          gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gr; c.fillRect(sx + ox, y * T + VY + (cap ? 3 : 0), 6, T - (cap ? 3 : 0));
        });
      }
    }
    // 3) stone blocks, one-way wooden platforms and spikes
    for (let y = 0; y < lvl.h; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = lvl.tile(x, y), sx = O.px(x * T - cam), sy = y * T + VY;
        if (ch === 'B' && !(sc.hideB && x >= sc.hideB[0] && x <= sc.hideB[1])) stone(c, sx, sy, theme, !solid(x, y - 1), !solid(x - 1, y), !solid(x + 1, y), x * 3 + y);
        else if (ch === 'P') plank(c, sx, sy, theme, lvl.tile(x - 1, y) !== 'P', lvl.tile(x + 1, y) !== 'P');
        else if (ch === 'X') spikes(c, sx, sy, g.t);
      }
    }
    c.restore();
  };
  function stone(c, x, y, theme, top, left, right, seed) {
    const night = theme === 'forest', gr = c.createLinearGradient(0, y, 0, y + T);
    gr.addColorStop(0, night ? '#6d7488' : '#c9c0ae'); gr.addColorStop(1, night ? '#3b4052' : '#8f8573');
    c.fillStyle = gr;
    const r = 3, x1 = x + T, y1 = y + T;
    c.beginPath();
    c.moveTo(x + (left && top ? r : 0), y);
    c.lineTo(x1 - (right && top ? r : 0), y); if (right && top) c.quadraticCurveTo(x1, y, x1, y + r);
    c.lineTo(x1, y1); c.lineTo(x, y1);
    c.lineTo(x, y + (left && top ? r : 0)); if (left && top) c.quadraticCurveTo(x, y, x + r, y);
    c.fill();
    if (top) { c.fillStyle = night ? 'rgba(170,190,220,0.35)' : 'rgba(255,255,245,0.55)'; c.fillRect(x + (left ? 2 : 0), y, T - (left ? 2 : 0) - (right ? 2 : 0), 0.8); }
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.4;
    c.beginPath(); const k = (seed % 3) * 3 + 4; c.moveTo(x + k, y + 3); c.lineTo(x + k + 2, y + 8); c.lineTo(x + k + 1, y + 12); c.stroke();
    c.fillStyle = 'rgba(0,0,0,0.18)'; if (left) c.fillRect(x, y, 1, T); if (right) c.fillRect(x1 - 1, y, 1, T);
  }
  function plank(c, x, y, theme, l, r) {
    const night = theme === 'forest', gr = c.createLinearGradient(0, y, 0, y + 6);
    gr.addColorStop(0, night ? '#8a6a4c' : '#c08a58'); gr.addColorStop(1, night ? '#4a3626' : '#7a5234');
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + (l ? 1 : 0), y + 5.5, T - (l ? 1 : 0) - (r ? 1 : 0), 1.2);
    c.fillStyle = gr;
    c.beginPath(); c.moveTo(x + (l ? 1.5 : 0), y); c.lineTo(x + T - (r ? 1.5 : 0), y); c.lineTo(x + T - (r ? 0.5 : 0), y + 5.5); c.lineTo(x + (l ? 0.5 : 0), y + 5.5); c.fill();
    c.fillStyle = 'rgba(255,230,190,0.35)'; c.fillRect(x + (l ? 1.5 : 0), y, T - (l ? 1.5 : 0) - (r ? 1.5 : 0), 0.7);
    c.fillStyle = 'rgba(40,24,12,0.6)'; c.beginPath(); c.arc(x + 3, y + 2.8, 0.55, 0, 7); c.arc(x + T - 3, y + 2.8, 0.55, 0, 7); c.fill();
  }
  function spikes(c, x, y, t) {
    const base = y + T;
    for (let i = 0; i < 4; i++) {
      const sx = x + i * 4, tip = base - 11 - (i % 2) * 2;
      const gr = c.createLinearGradient(sx, 0, sx + 4, 0);
      gr.addColorStop(0, '#f4f6fa'); gr.addColorStop(0.5, '#b8bfcc'); gr.addColorStop(1, '#6c7384');
      c.fillStyle = gr; c.strokeStyle = 'rgba(20,16,24,0.85)'; c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(sx, base); c.lineTo(sx + 2, tip); c.lineTo(sx + 4, base); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(220,40,40,' + (0.55 + Math.sin(t * 0.08 + i) * 0.2) + ')';
      c.beginPath(); c.moveTo(sx + 1.3, tip + 2.4); c.lineTo(sx + 2, tip); c.lineTo(sx + 2.7, tip + 2.4); c.fill();
    }
  }
  HD.hideDecor = function (lvl, d) {
    const sc = HD.scene(lvl);
    if (!sc) return false;
    return true; // the Flow scenery replaces every pixel prop (trees, grass tufts, curtains...)
  };
  HD.hideStatues = (lvl) => !!HD.scene(lvl);
  HD.hideLights = (lvl) => !!HD.scene(lvl); // the Flow art is already lit: no pixel light/grade passes

  let daySky = null;
  function buildDaySky() {
    const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, c.height);
    gr.addColorStop(0, '#6fa8dc'); gr.addColorStop(0.45, '#a9d2ee'); gr.addColorStop(0.8, '#f3e3c3'); gr.addColorStop(1, '#f7d9a6');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    const sun = g.createRadialGradient(c.width * 0.78, c.height * 0.22, 10, c.width * 0.78, c.height * 0.22, c.height * 0.55);
    sun.addColorStop(0, 'rgba(255,248,220,0.95)'); sun.addColorStop(0.12, 'rgba(255,240,200,0.55)'); sun.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = sun; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function clouds(ctx, t, cam) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 6; i++) {
      const x = ((i * 97 + t * 0.03 - cam * 0.03) % (W + 140)) - 70, y = 30 + (i % 3) * 16;
      const gr = ctx.createRadialGradient(x, y, 2, x, y, 38);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  HD.drawBackground = function (c, g) {
    const sc = HD.scene(g.lvl);
    if (!sc) return false;
    const cam = g.cam, I = HD.img;
    c.save();
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (sc.room) {
      const im = I[sc.room];
      c.fillStyle = '#0b0a12'; c.fillRect(0, 0, W, H);
      if (im) { const s = W / im.width, h = im.height * s; c.drawImage(im, -cam * 0, FLOOR - sc.floor * h, W, h); }
    } else {
      if (sc.sky === 'day') { if (!daySky) daySky = buildDaySky(); c.drawImage(daySky, 0, 0, W, H); clouds(c, g.t, cam); }
      else if (I[sc.sky]) { const im = I[sc.sky], s = W / im.width; c.drawImage(im, 0, -30, W, im.height * s); }
      sc.layers.forEach(([name, f, bottom]) => {
        const im = I[name];
        if (!im) return;
        const s = 1 / S, w = im.width * s, h = im.height * s, sx = cam * f, first = Math.floor(sx / w);
        for (let i = first; i * w - sx < W; i++) {
          const x = O.px(i * w - sx), mir = ((i % 2) + 2) % 2 === 1; // mirror every other copy: no seam
          c.save(); c.translate(x + (mir ? w : 0), bottom - h); if (mir) c.scale(-1, 1);
          c.drawImage(im, 0, 0, w, h); c.restore();
        }
      });
    }
    c.restore();
    return true;
  };

  // Drawn right after the (tile) level canvas: building facades, the temple plinth, the HD doorway of rooms.
  HD.drawSet = function (c, g) {
    const sc = HD.scene(g.lvl);
    if (!sc) return;
    const cam = g.cam, I = HD.img;
    c.save();
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    (sc.facades || []).forEach(([name, x0, x1]) => {
      const im = I[name];
      if (!im) return;
      const w = (x1 - x0) * T, h = im.height * (w / im.width), x = x0 * T - cam;
      if (x > W || x + w < 0) return;
      c.drawImage(im, O.px(x), 11 * T + VY - h, w, h);
    });
    if (sc.plinth) {
      const [a, b, row] = sc.plinth, x = a * T - cam, w = (b - a) * T, y = row * T + VY;
      if (x < W && x + w > 0) { // three marble steps, wider toward the ground
        for (let k = 0; k < 3; k++) {
          const inset = (2 - k) * 3, sy = y + k * (T / 3), sh = T / 3;
          const gr = c.createLinearGradient(0, sy, 0, sy + sh);
          gr.addColorStop(0, '#fbf8f1'); gr.addColorStop(0.35, '#e4ddcf'); gr.addColorStop(1, '#b3a996');
          c.fillStyle = gr; c.fillRect(x + inset, sy, w - inset * 2, sh);
          c.fillStyle = 'rgba(90,70,40,0.28)'; c.fillRect(x + inset, sy + sh - 0.5, w - inset * 2, 0.5);
          c.fillStyle = 'rgba(214,170,80,0.55)'; c.fillRect(x + inset, sy + 0.5, w - inset * 2, 0.35);
        }
      }
    }
    if (sc.door) {
      const [tx, ty, tw, th] = sc.door, x = tx * T - cam, y = ty * T + VY, w = tw * T, h = th * T;
      const gr = c.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.7, 'rgba(8,6,12,0.85)'); gr.addColorStop(1, 'rgba(8,6,12,0)');
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + 6); c.quadraticCurveTo(x + w / 2, y - 4, x + w, y + 6); c.lineTo(x + w, y + h); c.fill();
    }
    c.restore();
    HD.drawGround(c, g);
  };

  /* ---------- characters: contact shadow, god glow, talk animation ---------- */
  function wrapDraws() {
    const oldAura = O.drawNPCAura;
    O.drawNPCAura = function (c, g, npc, bob) {
      if (!(O.SPR[npc.kind + '_idle_0'] || {}).hd) return oldAura && oldAura(c, g, npc, bob);
      const x = npc.x + npc.w / 2 - g.cam, y = npc.y + npc.h + VY + bob - npc.h * 0.55, t = g.t;
      const col = npc.kind === 'hermes' ? '170,215,255' : '255,214,130', R = npc.h * (0.9 + Math.sin(t * 0.04) * 0.05);
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(x, y, 2, x, y, R);
      gr.addColorStop(0, 'rgba(' + col + ',0.45)'); gr.addColorStop(0.5, 'rgba(' + col + ',0.14)'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
      c.restore();
    };
    const npcDraw = O.NPC.prototype.draw;
    O.NPC.prototype.draw = function (c, g) {
      if (!this.float && (O.SPR[this.kind + '_idle_0'] || {}).hd) HD.shadow(c, this.x + this.w / 2 - g.cam, this.y + this.h + VY, 12, 0.3);
      return npcDraw.call(this, c, g);
    };
    // Ambient particles in HD: glowing fireflies, drifting leaves, embers and cave drips (units: game px).
    const oldAmb = O.AmbDraw;
    O.AmbDraw = function (c, p, x, y, g) {
      if (!HD.scene(g.lvl)) return oldAmb ? oldAmb(c, p, x, y, g) : false;
      c.save();
      if (p.k === 'fly') {
        const a = Math.max(0, Math.sin((p.t % 150) / 150 * Math.PI)) * 0.9;
        const gr = c.createRadialGradient(x, y, 0, x, y, 5);
        gr.addColorStop(0, 'rgba(236,255,160,' + a + ')'); gr.addColorStop(0.35, 'rgba(190,255,120,' + a * 0.4 + ')'); gr.addColorStop(1, 'rgba(160,255,120,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill();
      } else if (p.k === 'leaf') {
        c.translate(x, y); c.rotate(Math.sin(p.t * 0.05) * 1.2);
        c.fillStyle = (p.t >> 5) & 1 ? '#a9c95a' : '#6f9a3a'; c.beginPath(); c.ellipse(0, 0, 1.8, 0.8, 0, 0, 7); c.fill();
      } else if (p.k === 'ember') {
        const a = Math.max(0, 1 - p.t / 70), gr = c.createRadialGradient(x, y, 0, x, y, 2.5);
        gr.addColorStop(0, 'rgba(255,230,150,' + a + ')'); gr.addColorStop(1, 'rgba(255,120,40,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill();
      } else if (p.k === 'drip') {
        c.fillStyle = 'rgba(170,215,255,0.85)'; c.beginPath(); c.ellipse(x, y, 0.6, 1.3, 0, 0, 7); c.fill();
      }
      c.restore();
      return true;
    };
    // Title and ending screens over the Flow key art.
    const GP = O.Game.prototype, oldTitle = GP.drawTitle, oldEnding = GP.drawEnding;
    GP.drawTitle = function (c) {
      if (!HD.img.titulo || !(O.SPR.lyre_play_0 || {}).hd) return oldTitle.call(this, c);
      const t = this.t, MX = W * 0.64;
      keyArt(c, t, 0);
      logo(c, 'ORPHEUS', 'SONG OF OLYMPUS', 30, t);
      if (this.state === 'press') {
        const a = 0.55 + Math.sin(t * 0.07) * 0.45;
        label(c, 'PRESS START', MX, 158, 8, 'rgba(255,244,214,' + a + ')');
      } else {
        ['NEW GAME', 'CONTINUE'].forEach((o, i) => {
          const on = this.sel === i, en = i === 0 || this.hasSave, y = 158 + i * 14;
          if (on) {
            const gr = c.createLinearGradient(MX - 60, 0, MX + 60, 0);
            gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(20,10,30,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = gr; c.fillRect(MX - 60, y - 6, 120, 12);
            label(c, '❦', MX - 44 + Math.sin(t * 0.15), y, 7, '#f0c050');
          }
          label(c, o, MX, y, 8, !en ? 'rgba(170,160,190,0.6)' : on ? '#ffe9a8' : '#f4ecdc');
        });
      }
      label(c, 'Z: ATTACK   X: JUMP   ↑: TALK   ENTER: START   M: MUTE', W / 2, 200, 4.4, 'rgba(255,240,220,0.8)');
      label(c, 'A FAN TRIBUTE - 2026', W / 2, 209, 3.8, 'rgba(230,210,240,0.55)');
    };
    GP.drawEnding = function (c) {
      if (!HD.img.titulo) return oldEnding.call(this, c);
      keyArt(c, this.t, 0.55);
      logo(c, 'ORPHEUS', 'THE FIRST STRING', 20, this.t);
      O.ENDING.forEach((l, i) => {
        if (this.endT > i * 40) label(c, l.t, W / 2, 74 + i * 11, 6, '#fff3d6', Math.min(1, (this.endT - i * 40) / 30));
      });
      if (this.endT > O.ENDING.length * 40 + 60) label(c, 'PRESS START', W / 2, 200, 7, 'rgba(255,244,214,' + (0.55 + Math.sin(this.t * 0.07) * 0.45) + ')');
    };
    const heroDraw = O.Player.prototype.draw;
    O.Player.prototype.draw = function (c, g) {
      if ((O.SPR.hero_idle_0 || {}).hd && this.onGround) HD.shadow(c, this.x + this.w / 2 - g.cam, this.y + this.h + VY, 11, 0.32);
      return heroDraw.call(this, c, g);
    };
  }

  /* ---------- HD dialogue portraits: the head of each character's idle frame on a soft backdrop ---------- */
  const PORTRAIT_BG = { zeus: ['#3a2a58', '#a47b3a'], hermes: ['#2c4a70', '#9cc6e8'], hades: ['#150e22', '#3d5a78'], eurydice: ['#3c2f55', '#e9c9a2'] };
  function buildPortraits() {
    const M = window.OLY_SPRITES || {};
    ['orpheus', 'eurydice', 'elder', 'merchant', 'villager', 'zeus', 'hermes', 'hades'].forEach((k) => {
      const m = M[k + '_idle'] || M[k + '_walk'], img = HD.sheets[k + '_idle'] || HD.sheets[k + '_walk'];
      if (!m || !img) return;
      const f0 = m.frames[Object.keys(m.frames)[0]], side = m.body * 0.3, top = m.ay - m.body - side * 0.1;
      const cx = f0 + m.ax + side * 0.12, P = 240, c = document.createElement('canvas');
      c.width = c.height = P;
      const g = c.getContext('2d'), bg = PORTRAIT_BG[k] || ['#2f2a48', '#d9b98a'];
      const gr = g.createRadialGradient(P * 0.55, P * 0.35, 10, P * 0.5, P * 0.5, P * 0.75);
      gr.addColorStop(0, bg[1]); gr.addColorStop(1, bg[0]);
      g.fillStyle = gr; g.fillRect(0, 0, P, P);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(img, cx - side / 2, top, side, side, 0, 0, P, P);
      const v = g.createRadialGradient(P / 2, P / 2, P * 0.35, P / 2, P / 2, P * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
      g.fillStyle = v; g.fillRect(0, 0, P, P);
      const old = O.SPR['portrait_' + k] || {};
      O.SPR['portrait_' + k] = Object.assign({}, old, { hdc: c, w: 48, h: 48, n: old.n || c, f: old.f || c, ax: 24, ay: 47 });
    });
  }

  /* ---------- title helpers ---------- */
  function label(c, s, x, y, size, color, alpha) {
    c.save();
    c.font = '600 ' + size + 'px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (alpha !== undefined) c.globalAlpha = alpha;
    c.fillStyle = 'rgba(10,4,20,0.75)'; c.fillText(s, x + size * 0.08, y + size * 0.1);
    c.fillStyle = color; c.fillText(s, x, y);
    c.restore();
  }
  function logo(c, title, sub, y, t) {
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 30px Georgia, "Times New Roman", serif';
    const gr = c.createLinearGradient(0, y - 15, 0, y + 15);
    gr.addColorStop(0, '#fffbe6'); gr.addColorStop(0.35, '#ffd86a'); gr.addColorStop(0.7, '#e09a26'); gr.addColorStop(1, '#8a4e10');
    c.fillStyle = 'rgba(40,10,20,0.6)'; c.fillText(title, W / 2 + 1.2, y + 1.5);
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(70,24,8,0.9)'; c.strokeText(title, W / 2, y);
    c.fillStyle = gr; c.fillText(title, W / 2, y);
    c.globalCompositeOperation = 'source-over';
    c.font = 'italic 600 8px Georgia, "Times New Roman", serif';
    const sw = c.measureText(sub).width;
    c.fillStyle = 'rgba(20,6,20,0.7)'; c.fillText(sub, W / 2 + 0.5, y + 22.5);
    c.fillStyle = '#fff1d0'; c.fillText(sub, W / 2, y + 22);
    c.fillStyle = 'rgba(240,192,80,0.85)';
    c.fillRect(W / 2 - sw / 2 - 40, y + 22, 32, 0.7); c.fillRect(W / 2 + sw / 2 + 8, y + 22, 32, 0.7);
    c.restore();
  }
  const notesT = [];
  function keyArt(c, t, dim) {
    const im = HD.img.titulo, z = 1.2 + Math.sin(t * 0.002) * 0.03, s = (W / im.width) * z;
    const hw = W / 2 / s / im.width, cx = Math.max(hw, 0.36 + Math.sin(t * 0.0015) * 0.02), cy = 0.535 - 64 / (W * z);
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(im, W / 2 - cx * im.width * s, H / 2 - cy * im.height * s, im.width * s, im.height * s);
    const px = W / 2 + (0.25 - cx) * im.width * s, py = H / 2 + (0.535 - cy) * im.height * s;
    const e = O.SPR['lyre_play_' + (Math.floor(t / 9) % 8)];
    if (e) { HD.shadow(c, px, py, 9, 0.3); c.save(); c.translate(px, py); c.scale(0.85, 0.85); HD.drawFrame(c, e, 0, 0, false, false); c.restore(); }
    if (t % 28 === 0) notesT.push({ t0: t, x: px + 6, y: py - 28, ch: Math.random() < 0.5 ? '♪' : '♫', dx: 0.12 + Math.random() * 0.1 });
    while (notesT.length && t - notesT[0].t0 > 200) notesT.shift();
    notesT.forEach((n) => {
      const a = n.t0 > t ? 0 : t - n.t0, al = Math.min(1, a / 20, (200 - a) / 40);
      const x = n.x + a * n.dx + Math.sin(a * 0.05) * 3, y = n.y - a * 0.22;
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(x, y, 0, x, y, 6); g.addColorStop(0, 'rgba(255,220,120,' + 0.45 * al + ')'); g.addColorStop(1, 'rgba(255,220,120,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
      c.globalCompositeOperation = 'source-over'; c.font = '7px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,226,140,' + al + ')'; c.fillText(n.ch, x, y);
    });
    const v = c.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, 'rgba(20,6,30,0.45)'); v.addColorStop(0.3, 'rgba(20,6,30,0)'); v.addColorStop(0.75, 'rgba(10,4,20,0)'); v.addColorStop(1, 'rgba(10,4,20,0.65)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    if (dim) { c.fillStyle = 'rgba(8,4,20,' + dim + ')'; c.fillRect(0, 0, W, H); }
    c.restore();
  }

  // After the entities: a soft vignette (cooler and deeper at night and in the cave).
  const vig = {};
  HD.post = function (c, g) {
    const sc = HD.scene(g.lvl);
    if (!sc) return;
    const dark = g.lvl.theme === 'forest' || g.lvl.id === 'den', key = dark ? 'd' : 'l';
    if (!vig[key]) {
      const cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
      const x = cv.getContext('2d'), gr = x.createRadialGradient(cv.width / 2, cv.height * 0.55, cv.height * 0.35, cv.width / 2, cv.height * 0.55, cv.width * 0.62);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, dark ? 'rgba(4,6,20,0.55)' : 'rgba(30,20,10,0.28)');
      x.fillStyle = gr; x.fillRect(0, 0, cv.width, cv.height);
      vig[key] = cv;
    }
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(vig[key], 0, 0, W, H); c.restore();
  };

  // Soft contact shadow under a body standing at feet point (x, y) in screen units.
  HD.shadow = function (c, x, y, r, a) {
    c.save();
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,0,' + (a || 0.35) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, r, r * 0.28, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  };

  /* ---------- boot ---------- */
  const SCENERY = ['vila_longe', 'vila_meio', 'vila_perto', 'floresta_ceu', 'floresta_longe', 'floresta_meio', 'floresta_perto',
    'templo_zeus', 'santuario_hermes', 'caverna_fundo', 'casa_vila', 'casa_anciao', 'barraca_mercadora', 'templo_zeus_fachada',
    'entrada_caverna', 'titulo', 'historia_casamento', 'historia_serpente', 'historia_juramento', 'submundo'];
  HD.load = function () {
    const M = window.OLY_SPRITES || {};
    const jobs = SCENERY.map((n) => loadImg(BASE + n + '.webp').then((i) => { if (i) HD.img[n] = i; }))
      .concat(Object.keys(M).map((n) => loadImg(BASE + M[n].img).then((i) => { if (i) HD.sheets[n] = i; })));
    const timeout = new Promise((ok) => setTimeout(ok, 15000));
    return Promise.race([Promise.all(jobs), timeout]).then(() => {
      try { registerSheets(); wrapDraws(); buildPortraits(); HD.on = true; } catch (e) { console.error('[hd] registro falhou', e); }
    });
  };
})(window.OLY);
