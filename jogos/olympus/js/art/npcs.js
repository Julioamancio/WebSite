/* art/npcs.js — NPCs, gods and dialogue portraits (modern pixel art, refinement round 2).
   Portraits: hand-authored per-character face maps (eyes, brows, nose and mouth drawn pixel by pixel),
   hair and beards built from shaded bezier locks (S-shaped clusters, 3-4 clean tones, no noise),
   cloth shaded as a cylinder with explicit fold strokes, flat banded backgrounds.
   Sprites: hand-authored 3/4-view pixel maps with per-frame animation operators (breathing bob,
   lagging hem/hair sway, blinking, flames, wings, sparks). Light always comes from the upper-left. */
(function (O) {
  'use strict';
  const OUT = (O.PAL5 && O.PAL5.outline) || '#1b1426';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- ramps (0 = highlight .. 4 = deepest shadow) ---------------- */
  const R = {
    skin: ['#ffe6cc', '#f4bf92', '#d98f66', '#a65c4c', '#5e2f40'],
    skinF: ['#fff0e2', '#f9d2b4', '#e6a488', '#b86e66', '#6a3a4c'],
    skinTan: ['#f8d0a4', '#e0a070', '#bb7650', '#8a4a44', '#4e2838'],
    skinOld: ['#fbe4cf', '#ecbf9c', '#cc9072', '#95605c', '#553648'],
    skinGod: ['#fff0d4', '#f6cf9c', '#dca06e', '#a86850', '#603844'],
    skinHades: ['#eee8fa', '#c6bde2', '#978bc2', '#675a96', '#382f62'],
    auburn: ['#ffb877', '#dc7438', '#a8462a', '#6e2a24', '#3c1420'],
    blond: ['#fff0a0', '#f2c85a', '#d8963a', '#a8603a', '#6a3a3a'],
    white: ['#ffffff', '#e8e6f4', '#c8c0e0', '#9a90c0', '#6a6098'],
    darkHair: ['#8a6a96', '#5c4270', '#3c2a4e', '#261a36', '#140e20'],
    hadesHair: ['#5a4a86', '#3a2e5e', '#261e40', '#17122a', '#0c0a18'],
    chestnut: ['#d99a64', '#a8643c', '#743e2c', '#4a2428', '#28141c'],
    cloth: ['#ffffff', '#f0ecf8', '#cfc8e4', '#9c94c4', '#625a8e'],
    ivory: ['#fffaf0', '#f4e8d4', '#dccab4', '#a898a8', '#6a5a7a'],
    wool: ['#e0ae78', '#b07448', '#7e4c36', '#533036', '#2e1a26'],
    sky: ['#e4f6ff', '#9ed4f6', '#62a4e2', '#4270b8', '#2a4280'],
    corn: ['#b4d4ff', '#7aa6ec', '#4f7fd0', '#34479a', '#222a66'],
    royal: ['#8ab4ff', '#4a74e0', '#3048b0', '#22307e', '#16194a'],
    pink: ['#ffe4ee', '#f9a8c6', '#e06c9c', '#a8447c', '#5e2656'],
    ochre: ['#ffe29a', '#f0b44a', '#d0842c', '#94502a', '#5a2c24'],
    violet: ['#a898d8', '#6a58a8', '#463880', '#2c2256', '#171230'],
    iron: ['#b8b6cc', '#807e9a', '#56546e', '#36344a', '#1c1a2c'],
    wood: ['#e0b27e', '#aa7850', '#7a5038', '#4e3129', '#2b1b1c'],
    leather: ['#e2a870', '#b47444', '#83502e', '#553222', '#2f1c17'],
    clay: ['#ffba8c', '#ee7c48', '#c04c30', '#80302c', '#481a22'],
    gold: ['#fff8c4', '#ffd75a', '#e8a024', '#aa641e', '#603418'],
    red: ['#ff9f7d', '#f0513b', '#c02a32', '#801b31', '#461027'],
    leaf: ['#e2f59a', '#9ccf5a', '#5d9b44', '#35663c', '#1c3a2c'],
    snake: ['#d8ec8c', '#98bc50', '#5e8a3c', '#35583a', '#1c3028'],
    feather: ['#ffffff', '#e8eefa', '#b4c2e4', '#7a88bc', '#4c5688'],
    flame: ['#ffffff', '#b8f8ff', '#6ad8ff', '#8a6af0', '#4a34b0'],
    bolt: ['#ffffff', '#fff8c8', '#ffd84a', '#ff9a2a', '#c4501c'],
    silver: ['#ffffff', '#dfe6f2', '#a9b2cc', '#6f7699', '#3e4466'],
    cloud: ['#ffffff', '#eef2ff', '#c8d2f2', '#96a2d4', '#6a74a8']
  };
  O.NPC_RAMPS = R;

  /* ================================================================
     PIXEL TOOLKIT
     ================================================================ */
  // Legend builder: LG({ch: '#hex'}, ['abcde', ramp], ...) -> {ch: colour}
  function LG(fixed) {
    const lg = Object.assign({ o: OUT }, fixed || {});
    for (let k = 1; k < arguments.length; k++) {
      const [chars, ramp] = arguments[k];
      for (let i = 0; i < chars.length; i++) lg[chars[i]] = ramp[Math.min(i, ramp.length - 1)];
    }
    return lg;
  }
  // ASCII-art block: rows drawn at (x0, y0). '.'/' ' = skip, '_' = erase.
  function art(p, x0, y0, rows, lg, tag) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        if (ch === '_') { p.set(x0 + i, y0 + j, null); continue; }
        const c = lg[ch];
        if (c === undefined) throw new Error('npcs.js legend missing "' + ch + '" in ' + tag);
        p.set(x0 + i, y0 + j, c);
      }
    });
    return p;
  }
  // Sparse pixel list: [[x, y, ch], ...]
  function dots(p, list, lg, ox, oy) { list.forEach(([x, y, ch]) => { const c = lg[ch] || ch; p.set(x + (ox || 0), y + (oy || 0), c); }); return p; }
  // Scanline polygon fill with a per-pixel colour function fn(x, y, L, R) (or a colour).
  function fillPoly(p, pts, fn) {
    let y0 = Infinity, y1 = -Infinity;
    pts.forEach((q) => { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) xs.push(a[0] + ((y + 0.5 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const L = Math.round(xs[k]), Rr = Math.round(xs[k + 1]);
        for (let x = L; x < Rr; x++) { const c = typeof fn === 'function' ? fn(x, y, L, Rr) : fn; if (c) p.set(x, y, c); }
      }
    }
    return p;
  }
  function ell(p, cx, cy, rx, ry, col) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) { const c = typeof col === 'function' ? col(x, y, dx, dy) : col; if (c) p.set(x, y, c); }
    }
    return p;
  }
  // Bresenham polyline with a callback.
  function pline(p, pts, fn) {
    for (let k = 0; k + 1 < pts.length; k++) {
      let [x0, y0] = pts[k].map(Math.round), [x1, y1] = pts[k + 1].map(Math.round);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        fn(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
  }
  // Sel-out outline: transparent pixels touching the figure get the outline colour.
  function outline(p, col, diag) {
    const add = [];
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (p.get(x, y)) continue;
      let hit = p.get(x - 1, y) || p.get(x + 1, y) || p.get(x, y - 1) || p.get(x, y + 1);
      if (!hit && diag) hit = p.get(x - 1, y - 1) || p.get(x + 1, y - 1) || p.get(x - 1, y + 1) || p.get(x + 1, y + 1);
      if (hit) add.push(x, y);
    }
    for (let i = 0; i < add.length; i += 2) p.set(add[i], add[i + 1], col || OUT);
    return p;
  }
  // Rim light: figure pixels on the right-hand silhouette edge get tinted towards `col`.
  function rim(p, col, amt, y0, y1, skip) {
    const hits = [];
    for (let y = y0 || 0; y < (y1 || p.h); y++) for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y);
      if (!c || p.get(x + 1, y) || (skip && skip[c])) continue;
      hits.push(x, y, O.mix(c, col, amt));
    }
    for (let i = 0; i < hits.length; i += 3) p.set(hits[i], hits[i + 1], hits[i + 2]);
    return p;
  }
  function copyPix(src) { const p = new O.Pix(src.w, src.h); for (let i = 0; i < src.d.length; i++) p.d[i] = src.d[i]; return p; }
  // Composite a layer; where it overlaps existing pixels its own edge becomes an inner contour
  // coloured `line` (a darker tone of the material underneath looks best).
  function comp(dst, L, line) {
    if (line) {
      const add = [];
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        if (L.get(x, y) || !dst.get(x, y)) continue;
        if (L.get(x - 1, y) || L.get(x + 1, y) || L.get(x, y - 1) || L.get(x, y + 1)) add.push(x, y);
      }
      for (let i = 0; i < add.length; i += 2) dst.set(add[i], add[i + 1], typeof line === 'function' ? line(dst.get(add[i], add[i + 1])) : line);
    }
    dst.blit(L, 0, 0);
    return dst;
  }
  // Orphan-pixel cleanup: a pixel of a ramp whose 4 neighbours are all other tones of the same
  // ramp is replaced by the most common neighbour (kills "noise" in skin, hair and cloth).
  function clean(p, ramps, passes) {
    const id = {};
    ramps.forEach((r, k) => r.forEach((c) => { id[c] = k; }));
    for (let pass = 0; pass < (passes || 2); pass++) {
      const ch = [];
      for (let y = 1; y < p.h - 1; y++) for (let x = 1; x < p.w - 1; x++) {
        const c = p.get(x, y);
        if (!c || id[c] === undefined) continue;
        const n = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)];
        if (n.some((q) => q === c || !q || id[q] !== id[c])) continue;
        const cnt = {};
        n.forEach((q) => { cnt[q] = (cnt[q] || 0) + 1; });
        let best = n[0];
        Object.keys(cnt).forEach((q) => { if (cnt[q] > cnt[best]) best = q; });
        ch.push(x, y, best);
      }
      for (let i = 0; i < ch.length; i += 3) p.set(ch[i], ch[i + 1], ch[i + 2]);
    }
    return p;
  }

  /* ---------- curves ---------- */
  function bez(P, t) {
    const u = 1 - t;
    if (P.length === 3) return [u * u * P[0][0] + 2 * u * t * P[1][0] + t * t * P[2][0], u * u * P[0][1] + 2 * u * t * P[1][1] + t * t * P[2][1]];
    if (P.length === 2) return [lerp(P[0][0], P[1][0], t), lerp(P[0][1], P[1][1], t)];
    return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]];
  }
  function samples(P, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = bez(P, Math.max(0, t - 0.01)), b = bez(P, Math.min(1, t + 0.01)), c = bez(P, t);
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      out.push({ x: c[0], y: c[1], tx, ty, nx: -ty, ny: tx, t });
    }
    return out;
  }
  // Generic swept stroke: for every pixel within the stroke, fn(t along 0..1, s across -1..1, sample) -> colour.
  // width(t) -> full width in px.
  function sweep(p, P, width, fn) {
    const S = samples(P, 64);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, wm = 0;
    S.forEach((q) => { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); wm = Math.max(wm, width(q.t)); });
    const pad = wm / 2 + 1;
    for (let y = Math.floor(y0 - pad); y <= Math.ceil(y1 + pad); y++) for (let x = Math.floor(x0 - pad); x <= Math.ceil(x1 + pad); x++) {
      const px = x + 0.5, py = y + 0.5;
      let best = null, bd = 1e9;
      for (let i = 0; i < S.length; i++) { const q = S[i], d = (px - q.x) ** 2 + (py - q.y) ** 2; if (d < bd) { bd = d; best = q; } }
      const ox = px - best.x, oy = py - best.y;
      const along = ox * best.tx + oy * best.ty;
      if ((best.t === 0 && along < -0.3) || (best.t === 1 && along > 0.3)) continue;
      const hw = width(best.t) / 2;
      if (hw <= 0) continue;
      const s = (ox * best.nx + oy * best.ny) / hw;
      if (Math.abs(s) > 1) continue;
      const c = fn(best.t, s, best);
      if (c) p.set(x, y, c);
    }
    return p;
  }
  const LIGHT = (() => { const l = Math.hypot(0.55, 0.7, 0.5); return [-0.55 / l, -0.7 / l, 0.5 / l]; })();
  // Shaded lock of hair / beard / flame: a tapered tube lit from the upper-left, clean tone bands,
  // dark separation on the shadowed edge. o: {w0, w1, pow (taper curve), th: [4 thresholds], dark, edge, tipDark, hiMax}
  function lock(p, P, ramp, o) {
    const n = ramp.length, th = o.th || [0.8, 0.5, 0.12, -0.3];
    const width = (t) => lerp(o.w0, o.w1 === undefined ? 0.6 : o.w1, Math.pow(t, o.pow || 1.6));
    return sweep(p, P, width, (t, s, q) => {
      const nx = q.nx * s, ny = q.ny * s, nz = Math.sqrt(Math.max(0, 1 - s * s));
      const v = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      let tone = v > th[0] ? 0 : v > th[1] ? 1 : v > th[2] ? 2 : v > th[3] ? 3 : 4;
      const litSide = q.nx * s * LIGHT[0] + q.ny * s * LIGHT[1] > 0;
      if (o.edge !== false && !litSide && Math.abs(s) > (o.edgeAt || 0.72)) tone = Math.max(tone, o.edgeTone || 3);
      if (o.tipDark && t > 1 - o.tipDark) tone += 1;
      if (o.rootDark && t < o.rootDark) tone += 1;
      if (o.hiMax !== undefined && tone < o.hiMax) tone = o.hiMax;
      if (o.hiT && tone === 0 && (t < o.hiT[0] || t > o.hiT[1])) tone = 1;
      tone += o.dark || 0;
      return ramp[clamp(tone, o.min || 0, n - 1)];
    });
  }
  // Tone-map cloth: fill region, shade as a cylinder (lit left), then carve folds.
  function Cloth(w, h, ramp) { this.w = w; this.h = h; this.ramp = ramp; this.t = new Int8Array(w * h).fill(-1); }
  Cloth.prototype.fill = function (pts, fn) {
    const self = this;
    fillPoly({ set(x, y, c) { if (x >= 0 && y >= 0 && x < self.w && y < self.h) self.t[y * self.w + x] = c; } }, pts, (x, y, L, Rr) => {
      const u = Rr - L > 1 ? (x - L) / (Rr - L - 1) : 0.5;
      return clamp(Math.round(fn(x, y, u)), 0, self.ramp.length - 1) + 0;
    });
    // fillPoly skips falsy colours: tone 0 needs a marker
    return this;
  };
  Cloth.prototype.fillT = function (pts, fn) {
    // same as fill but tolerant to tone 0
    const self = this;
    let y0 = Infinity, y1 = -Infinity;
    pts.forEach((q) => { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) xs.push(a[0] + ((y + 0.5 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const L = Math.round(xs[k]), Rr = Math.round(xs[k + 1]);
        for (let x = L; x < Rr; x++) {
          if (x < 0 || y < 0 || x >= self.w || y >= self.h) continue;
          const u = Rr - L > 1 ? (x - L) / (Rr - L - 1) : 0.5;
          const v = fn(x, y, u);
          if (v === null) continue;
          self.t[y * self.w + x] = clamp(Math.round(v), 0, self.ramp.length - 1);
        }
      }
    }
    return this;
  };
  Cloth.prototype.get = function (x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : this.t[y * this.w + x]; };
  Cloth.prototype.set = function (x, y, v) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && this.t[y * this.w + x] >= 0) this.t[y * this.w + x] = clamp(v, 0, this.ramp.length - 1); };
  // Fold: a valley (darker) swept along a curve, tapering, with a 1-px lit ridge on its upper-left side.
  Cloth.prototype.fold = function (P, w0, w1, depth, ridge) {
    const mark = new Map(), self = this;
    sweep({ set(x, y) { mark.set(x + ',' + y, 1); } }, P, (t) => lerp(w0, w1, t), () => 1);
    mark.forEach((_, k) => { const [x, y] = k.split(',').map(Number); const v = self.get(x, y); if (v >= 0) self.set(x, y, v + (depth || 1)); });
    if (ridge !== false) {
      mark.forEach((_, k) => {
        const [x, y] = k.split(',').map(Number);
        [[x - 1, y], [x, y - 1]].forEach(([a, b]) => { if (!mark.has(a + ',' + b)) { const v = self.get(a, b); if (v > 0 && !self._r) self.set(a, b, v - (ridge || 1)); } });
      });
    }
    return this;
  };
  Cloth.prototype.paint = function (p) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const v = this.t[y * this.w + x]; if (v >= 0) p.set(x, y, this.ramp[v]); } return p; };

  // Flat concentric background bands (light behind the head, darker towards the corners); the only
  // dithering is a 2-px checker strip at each band edge.
  function bgBands(cols, cx, cy, rx, ry, extra) {
    const p = new O.Pix(48, 48), n = cols.length;
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
      let k = Math.floor(d), f = d - k;
      k = clamp(k, 0, n - 1);
      const edge = 1.6 / Math.min(rx, ry);
      if (k < n - 1 && f > 1 - edge && ((x + y) & 1)) k++;
      p.set(x, y, cols[k]);
    }
    if (extra) extra(p);
    return p;
  }
  // Glow: additively brighten background pixels near a path (quantised, dithered only at the fringe).
  function glow(bg, path, col, rad, amt) {
    const pts = [];
    pline(bg, path, (x, y) => pts.push([x, y]));
    const cache = {};
    for (let y = 0; y < bg.h; y++) for (let x = 0; x < bg.w; x++) {
      let d = 1e9;
      for (let i = 0; i < pts.length; i++) { const q = pts[i], dd = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (dd < d) d = dd; }
      d = Math.sqrt(d) / rad;
      if (d >= 1) continue;
      const a = (1 - d) * amt * 3;
      let lvl = Math.floor(a);
      if (a - lvl > 0.5 && ((x + y) & 1)) lvl++;
      if (lvl <= 0) continue;
      const base = bg.get(x, y) || '#000000', key = base + lvl;
      if (!cache[key]) { const A = O.hexToRgb(base), C = O.hexToRgb(col), k = lvl * 0.16; cache[key] = O.rgbToHex(A[0] + C[0] * k, A[1] + C[1] * k, A[2] + C[2] * k); }
      bg.set(x, y, cache[key]);
    }
  }
  // Several locks, each composited with a contour against what is already there (clump separation).
  function locks(fig, list, ramp, base, line) {
    list.forEach((l) => { const q = new O.Pix(fig.w, fig.h); lock(q, l[0], ramp, Object.assign({}, base, l[1] || {})); comp(fig, q, line === undefined ? ramp[3] : line); });
    return fig;
  }
  O.NPCPaint = { LG, art, dots, fillPoly, ell, pline, outline, rim, comp, clean, bez, sweep, lock, Cloth, bgBands, glow };

  /* ================================================================
     PORTRAITS (48x48 busts facing right)
     Legend shared by the face maps: 1-5 skin (light..dark), A-E hair, L lid line, w sclera,
     * catchlight, i/j iris light/dark, p pupil, m mouth line, r lip, k blush, t tooth.
     ================================================================ */
  function faceLG(skin, hair, eye, extra) {
    return Object.assign(LG({ w: eye.w || '#f7f1f2', '*': '#ffffff', i: eye.i, j: eye.j, p: eye.p || '#1c1426', L: eye.L, m: eye.m || '#8a3440', r: eye.r || '#d27a6e', k: eye.k || '#f0a090', t: '#fffaf4' },
      ['12345', skin], ['ABCDE', hair]), extra || {});
  }
  function finishPortrait(fig, bg, rimCol, rimAmt, outCol) {
    if (rimCol) rim(fig, rimCol, rimAmt || 0.4);
    outline(fig, outCol || OUT);
    bg.blit(fig, 0, 0);
    return bg;
  }

  /* ---------- ORPHEUS ---------- */
  function portraitOrpheus() {
    const SK = R.skin, HR = R.auburn;
    const lg = faceLG(SK, HR, { i: '#72a860', j: '#2f5a3c', L: '#4e2230' });
    const fig = new O.Pix(48, 48);
    // ---- body: white chiton (cylinder shading + folds from the brooch), red cloak on the near shoulder
    const ch = new Cloth(48, 48, R.cloth);
    ch.fillT([[10, 48], [11, 41], [16, 37.5], [22, 36], [30, 36], [37, 37.5], [42, 40], [45, 44], [46, 48]], (x, y, u) => 1 + u * 1.9 + (y < 40 && x > 19 && x < 31 ? 0.8 : 0));
    ch.fold([[17, 40], [24, 42], [30, 45], [33, 48]], 1.6, 1, 1);
    ch.fold([[18, 38.5], [27, 40], [35, 43], [39, 48]], 1.4, 1, 1);
    ch.fold([[31, 38], [34, 41], [37, 45], [38, 48]], 1.2, 1, 1);
    ch.fold([[22, 44], [24, 48]], 1.2, 1, 1);
    ch.paint(fig);
    // neckline trim
    sweep(fig, [[20, 36.5], [25, 40.5], [31, 36.5]], () => 2, (t, s) => (s < 0 ? R.gold[1] : R.gold[3]));
    // cloak
    const ck = new Cloth(48, 48, R.red);
    ck.fillT([[0, 48], [0, 40], [4, 36], [11, 34.5], [17, 36], [20, 39], [19, 43], [16, 48]], (x, y, u) => 0.6 + u * 2 + (y > 44 ? 0.5 : 0));
    ck.fold([[4, 38], [3, 43], [3, 48]], 1.4, 1, 1);
    ck.fold([[11, 37], [10, 42], [9, 48]], 1.6, 1, 1);
    ck.fold([[16, 39], [15, 44], [14, 48]], 1.2, 1, 1);
    const cl = new O.Pix(48, 48); ck.paint(cl);
    comp(fig, cl, R.cloth[4]);
    // ---- hair behind (nape) : dark mass + locks
    const hb = new O.Pix(48, 48);
    fillPoly(hb, [[9, 6], [15, 1.5], [25, 0], [33, 2], [37, 7], [37, 12], [22, 13], [21, 19], [20, 26], [17, 33], [8, 34], [3, 29], [3, 15]], HR[3]);
    const TH = { th: [0.88, 0.6, 0.2, -0.25] };
    locks(hb, [
      [[[12, 10], [4, 15], [1, 24], [6, 32]], { w0: 6, w1: 1.5 }],
      [[[16, 13], [9, 19], [7, 27], [11, 34]], { w0: 6, w1: 1.5 }],
      [[[20, 16], [15, 22], [14, 29], [18, 33]], { w0: 5, w1: 1.2 }]
    ], HR, TH);
    comp(fig, hb, null);
    // ---- face
    art(fig, 14, 8, [
      '......22222222222222....',
      '.....2222222222222222...',
      '.....2222211111222222...',
      '....22222111111122222...',
      '....22222111111122222...',
      '....22222211111222222...',
      '....222222222222222222..',
      '....222222222222222222..',
      '....22222CDDD22222DDD2..',
      '....222222DDDDDE2DE22...',
      '....2222222222233223....',
      '....22222LLLLLL31LLLL...',
      '....22222Lww*jw31w*j2...',
      '....222222wwipw21wip22..',
      '....2222223wii3213i3222.',
      '....221111233322212222..',
      '....2211112222222212222.',
      '....221112222222223533..',
      '....33222222222322222...',
      '....3332222222223mmmm2..',
      '....3333222222223rrr2...',
      '....3333422222222333....',
      '....3344444222221122....',
      '....334444444333333.....',
      '....334444444443........',
      '.....23344444433........',
      '......2333444433........',
      '......2233334433........',
      '......2223333333........'
    ], lg, 'orpheus-face');
    // ear
    dots(fig, [[18, 18, '3'], [19, 18, '2'], [17, 19, '3'], [18, 19, '2'], [19, 19, '1'], [20, 19, '3'], [17, 20, '3'], [18, 20, '4'], [19, 20, '2'], [20, 20, '3'],
      [17, 21, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [17, 22, '3'], [18, 22, '3'], [19, 22, '2'], [20, 22, '3'], [18, 23, '3'], [19, 23, '4']], lg);
    // ---- hair on top: wavy locks sweeping back from the hairline, band, fringe curls
    const ht = new O.Pix(48, 48);
    locks(ht, [
      [[[24, 3], [16, -1], [7, 4], [5, 14]], { w0: 6, w1: 2 }],
      [[[18, 9], [12, 7], [8, 12], [9, 19]], { w0: 4.5, w1: 1.2 }],
      [[[30, 2], [22, 0], [13, 4], [11, 13]], { w0: 5.5, w1: 2 }],
      [[[35, 5], [28, 1], [19, 5], [16, 12]], { w0: 5, w1: 1.8 }],
      [[[37, 10], [33, 4], [25, 5], [21, 11]], { w0: 4.5, w1: 1.6 }]
    ], HR, TH);
    comp(fig, ht, HR[4]);
    // fringe under the band
    const fr = new O.Pix(48, 48);
    locks(fr, [
      [[[19, 12], [21, 14], [21, 17], [19, 19]], { w0: 3.6, w1: 1 }],
      [[[20, 15], [20, 18], [19, 22], [20, 25]], { w0: 3, w1: 0.8, dark: 1 }],
      [[[33, 11], [36, 12], [36, 15], [35, 16]], { w0: 3, w1: 1 }]
    ], HR, TH);
    comp(fig, fr, HR[4]);
    // headband (red, knotted at the back) with two short tails
    const band = new O.Pix(48, 48), RD = R.red;
    lock(band, [[8, 17], [5, 21], [3, 27]], RD, { w0: 3, w1: 1.2, th: [0.9, 0.4, 0, -0.4] });
    lock(band, [[9, 18], [9, 23], [7, 28]], RD, { w0: 2.6, w1: 1, th: [0.9, 0.4, 0, -0.4], dark: 1 });
    sweep(band, [[8, 16.5], [15, 12], [26, 10.5], [37, 12]], () => 3.2, (t, s) => (s < -0.4 ? (t > 0.45 && t < 0.8 ? RD[0] : RD[1]) : s < 0.35 ? RD[2] : RD[3]));
    ell(band, 8.5, 16.5, 2, 2, (x, y) => (x + y < 24 ? RD[1] : RD[2]));
    comp(fig, band, OUT);
    // two curls spilling over the band
    const fc = new O.Pix(48, 48);
    locks(fc, [
      [[[27, 9], [30, 10], [31, 13], [29, 15.5]], { w0: 3, w1: 1 }]
    ], HR, TH);
    comp(fig, fc, OUT);
    // brooch
    art(fig, 15, 38, ['.gGg.', 'gGyGq', 'GyYGq', 'qGGqQ', '.qQQ.'], LG({ Y: '#ffffff' }, ['ygGqQ', R.gold]), 'brooch');
    clean(fig, [SK, HR, R.cloth, R.red], 2);
    const bg = bgBands(['#8a4e58', '#6e3c4e', '#552e44', '#3e2238'], 24, 16, 20, 20);
    return finishPortrait(fig, bg, '#ffd9b0', 0.35);
  }

  /* ---------- shared female face (x14.., y8..): soft jaw, lashes, small nose, full lips ---------- */
  const FACE_EURY = [
    '......22222222222222....',
    '.....2222222222222222...',
    '.....2222211111222222...',
    '....22222111111122222...',
    '....22222111111122222...',
    '....22222211111222222...',
    '....222222222222222222..',
    '....222222222222222222..',
    '....2222222CDDD2222DD2..',
    '....222222D222222222D...',
    '....2222L22222233223....',
    '....2222LLLLLLL31LLLLL..',
    '....22222Lww*jw31w*jL...',
    '....222222wwipw21wip2...',
    '....2222223wii3213i32...',
    '....221111233322212222..',
    '....2211kk22222222122...',
    '....22112222222222353...',
    '....3322222222232222....',
    '....3332222222223mmm2...',
    '....3333222222223rr2....',
    '....333342222222233.....',
    '....33444442222112......',
    '....3344444443333.......',
    '......444444443.........',
    '......2344444433........',
    '......2233344433........',
    '......2223333333........',
    '......2223333333........'
  ];
  function eurydicePortrait(ghost) {
    const SK = ghost ? ['#ffffff', '#e8f8ff', '#bfe4f4', '#86b4d8', '#50709e'] : R.skinF;
    const HR = ghost ? ['#ffffff', '#d4fbff', '#8fe4f6', '#4fa6d6', '#2d5c9c'] : R.blond;
    const CL = ghost ? ['#ffffff', '#e2fbff', '#a8e6f6', '#6fb2dc', '#4474b0'] : R.cloth;
    const lg = faceLG(SK, HR, { i: ghost ? '#8fe4f6' : '#68a8ec', j: ghost ? '#4fa6d6' : '#2e5aa8', L: ghost ? '#2d4f86' : '#4a2436', r: ghost ? '#bfe8f6' : '#e27e7a', m: ghost ? '#6fa8d0' : '#a84452', k: ghost ? '#d8f4ff' : '#f4a494' });
    const fig = new O.Pix(48, 48);
    const TH = { th: [0.86, 0.55, 0.18, -0.25], edgeTone: 2, edgeAt: 0.8 };
    // long hair falling down the back
    const hb = new O.Pix(48, 48);
    fillPoly(hb, [[9, 6], [16, 2], [26, 1], [30, 4], [22, 14], [22, 30], [18, 48], [1, 48], [2, 30], [4, 14]], HR[2]);
    locks(hb, [
      [[[15, 5], [5, 12], [5, 30], [1, 48]], { w0: 7, w1: 3.5, pow: 1 }],
      [[[18, 8], [10, 16], [11, 32], [7, 48]], { w0: 7, w1: 3.5, pow: 1 }],
      [[[21, 12], [15, 22], [17, 36], [13, 48]], { w0: 6, w1: 3, pow: 1 }],
      [[[22, 18], [19, 28], [21, 38], [18, 48]], { w0: 4, w1: 2, pow: 1 }]
    ], HR, TH, HR[2]);
    comp(fig, hb, null);
    // dress
    const ch = new Cloth(48, 48, CL);
    ch.fillT([[8, 48], [9, 41], [15, 37.5], [22, 36], [30, 36], [37, 37.5], [42, 40], [45, 44], [46, 48]], (x, y, u) => 1 + u * 1.9 + (y < 40 && x > 19 && x < 31 ? 0.8 : 0));
    ch.fold([[16, 40], [22, 43], [27, 48]], 1.5, 1, 1);
    ch.fold([[30, 39], [33, 43], [34, 48]], 1.4, 1, 1);
    ch.fold([[36, 39], [39, 43], [41, 48]], 1.3, 1, 1);
    ch.fold([[12, 42], [13, 48]], 1.2, 1, 1);
    const dr = new O.Pix(48, 48); ch.paint(dr);
    sweep(dr, [[19, 36.5], [25, 40.5], [32, 36.5]], () => 2, (t, s) => (s < 0 ? R.gold[1] : R.gold[3]));
    comp(fig, dr, HR[4]);
    art(fig, 14, 8, FACE_EURY, lg, 'eury-face');
    dots(fig, [[18, 19, '3'], [19, 19, '2'], [18, 20, '3'], [19, 20, '1'], [20, 20, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [18, 22, '3'], [19, 22, '2'], [19, 23, '3']], lg);
    // gold earring
    dots(fig, [[19, 24, R.gold[1]], [19, 25, R.gold[3]]], lg);
    // hair on top + side-swept fringe
    const ht = new O.Pix(48, 48);
    locks(ht, [
      [[[28, 3], [20, -1], [10, 4], [7, 15]], { w0: 6.5, w1: 3 }],
      [[[32, 5], [24, 1], [15, 5], [12, 16]], { w0: 6, w1: 2.6 }],
      [[[35, 9], [29, 4], [21, 6], [17, 14]], { w0: 5.5, w1: 2.4 }],
      [[[27, 4], [32, 5], [36, 9], [36, 15]], { w0: 5, w1: 1.2 }],
      [[[25, 6], [28, 9], [30, 12], [29, 15]], { w0: 4, w1: 1 }]
    ], HR, TH);
    comp(fig, ht, HR[4]);
    // lock framing the face, falling over the near shoulder
    const fl = new O.Pix(48, 48);
    locks(fl, [
      [[[20, 10], [17, 20], [22, 30], [19, 45]], { w0: 5, w1: 2.2, pow: 1 }],
      [[[22, 12], [21, 20], [24, 28], [23, 38]], { w0: 3, w1: 1.2, pow: 1 }]
    ], HR, TH);
    comp(fig, fl, HR[4]);
    // flower crown: leafy wreath with blossoms
    const fw = new O.Pix(48, 48);
    const LF = ghost ? ['#e6fff8', '#a8f0e0', '#6fc8c4', '#3f8a9c'] : ['#d8f59a', '#8ccf5a', '#4e9b44', '#2c5e3a'];
    const PT = ghost ? [['#ffffff', '#d4f8ff', '#8fd0f0'], ['#ffffff', '#e2fbff', '#a8e6f6']] : [['#ffffff', '#ffd0e0', '#e888aa'], ['#ffffff', '#f4ecff', '#c8b8e0']];
    const cen = ghost ? '#bff4ff' : '#ffd75a';
    [[8, 15, 0], [11, 10, 1], [15, 6.5, 0], [21, 4, 1], [27, 3.5, 0], [33, 5.5, 1]].forEach(([x, y, k], i) => {
      // leaves
      fw.set(x - 2, y + 1, LF[2]); fw.set(x - 3, y + 1, LF[3]); fw.set(x + 2, y - 1 + (i % 2), LF[1]); fw.set(x + 3, y + (i % 2), LF[2]);
      const P = PT[k];
      art(fw, x - 1, y - 1, ['.a.', 'aYb', '.bc'], { a: P[0], b: P[1], c: P[2], Y: cen }, 'flower');
    });
    comp(fig, fw, OUT);
    clean(fig, [SK, HR, CL], 2);
    const bg = ghost ? bgBands(['#5a86c0', '#466ea8', '#35578c', '#26426e'], 24, 16, 20, 20)
      : bgBands(['#8cb4c4', '#6e98b0', '#557c98', '#40607c'], 24, 16, 20, 20);
    return finishPortrait(fig, bg, ghost ? '#ffffff' : '#fff0c8', 0.35, ghost ? '#1d2f5c' : OUT);
  }

  /* ---------- ZEUS ---------- */
  // Bold classic zig-zag bolt polygon (white core, gold mid, orange edge) with a soft glow.
  function boltShape(p, pts, w, cols) {
    // pts: centre-line polyline; draw 3 nested strokes (edge, mid, core)
    const S = (r, c) => { for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); for (let i = 0; i <= n; i++) { const t = i / n; ell(p, lerp(a[0], b[0], t), lerp(a[1], b[1], t), r, r, c); } } };
    S(w / 2 + 0.6, cols[2]); S(w / 2, cols[1]); S(Math.max(0.5, w / 2 - 1), cols[0]);
  }
  function laurelBand(p, pts, G, glint) {
    // wreath: a dark-gold stem with pairs of shaded leaves pointing back (left), up and down
    const S = samples(pts, 48);
    const leaves = new O.Pix(p.w, p.h);
    for (let i = 3; i < S.length - 1; i += 6) {
      const q = S[i];
      [-1, 1].forEach((side) => {
        const tx = -q.tx, ty = -q.ty, nx = q.nx * side, ny = q.ny * side;
        const x0 = q.x + nx * 0.6, y0 = q.y + ny * 0.6;
        lock(leaves, [[x0, y0], [x0 + tx * 1.5 + nx * 1.4, y0 + ty * 1.5 + ny * 1.4], [x0 + tx * 3.2 + nx * 2.2, y0 + ty * 3.2 + ny * 2.2]], G, { w0: 2.4, w1: 1, pow: 1.2, th: [0.7, 0.25, -0.2, -0.6], edge: false });
      });
    }
    for (let i = 0; i < S.length; i++) p.set(Math.round(S[i].x), Math.round(S[i].y), G[3]);
    comp(p, leaves, null);
    for (let i = 0; i < S.length; i++) { const x = Math.round(S[i].x), y = Math.round(S[i].y) + 1; if (!p.get(x, y)) p.set(x, y, G[4]); }
    if (glint) p.set(glint[0], glint[1], '#ffffff');
  }
  function portraitZeus() {
    const SK = R.skinGod, HR = R.white;
    const lg = faceLG(SK, HR, { i: '#9fe6ff', j: '#3f86d8', L: '#4a2a36', p: '#16223f' });
    const fig = new O.Pix(48, 48);
    const TH = { th: [0.8, 0.45, 0.05, -0.35] };
    // ---- hair behind
    const hb = new O.Pix(48, 48);
    fillPoly(hb, [[10, 6], [16, 2.5], [26, 1.5], [33, 4], [36, 9], [22, 13], [21, 26], [18, 38], [6, 38], [3, 26], [4, 14]], HR[3]);
    locks(hb, [
      [[[14, 8], [5, 13], [4, 26], [3, 38]], { w0: 6, w1: 2.5, pow: 1 }],
      [[[17, 10], [10, 17], [11, 28], [8, 39]], { w0: 6, w1: 2.5, pow: 1 }],
      [[[20, 13], [15, 21], [17, 30], [14, 39]], { w0: 5, w1: 2, pow: 1 }]
    ], HR, TH);
    comp(fig, hb, null);
    // ---- body: ivory chiton + royal-blue himation with a gold border over the near shoulder
    const ch = new Cloth(48, 48, R.ivory);
    ch.fillT([[4, 48], [6, 41], [13, 37], [22, 35.5], [31, 35.5], [38, 37], [43, 40], [46, 44], [47, 48]], (x, y, u) => 1 + u * 2.2);
    ch.fold([[33, 38], [36, 42], [38, 48]], 1.4, 1, 1);
    ch.fold([[39, 39], [42, 43], [44, 48]], 1.2, 1, 1);
    ch.paint(fig);
    const hm = new Cloth(48, 48, R.royal);
    hm.fillT([[0, 48], [0, 40], [5, 36], [12, 34.5], [19, 36], [26, 42], [31, 48]], (x, y, u) => 0.8 + u * 1.8);
    hm.fold([[8, 38], [12, 42], [15, 48]], 1.6, 1, 1);
    hm.fold([[15, 38], [19, 43], [22, 48]], 1.4, 1, 1);
    hm.fold([[4, 40], [5, 44], [6, 48]], 1.2, 1, 1);
    const hl = new O.Pix(48, 48); hm.paint(hl);
    sweep(hl, [[18, 36], [24, 41], [31, 48]], () => 2.2, (t, s) => (s < -0.2 ? R.gold[1] : s < 0.5 ? R.gold[2] : R.gold[3]));
    comp(fig, hl, R.ivory[4]);
    // ---- face
    art(fig, 14, 8, [
      '......22222222222222....',
      '.....2222222222222222...',
      '.....2222211111222222...',
      '....22222111111122222...',
      '....22222111111122222...',
      '....22222233333222222...',
      '....222222222222222222..',
      '....2222ABB2222222AB22..',
      '....2222BBBBCC22222BB2..',
      '....2222222CCDDD2DCB2...',
      '....2222233333332332....',
      '....22222LLLLLL31LLLL...',
      '....22222Lww*jw31w*j2...',
      '....222222wwipw21wip22..',
      '....2223223wii3213i3222.',
      '....221111233322212222..',
      '....2211112222222212222.',
      '....221112222222223533..',
      '....33222222222222222...',
      '....3332222222222222....',
      '....333322222222222.....',
      '....33334222222222......',
      '....334444422222........'
    ], lg, 'zeus-face');
    dots(fig, [[18, 18, '3'], [19, 18, '2'], [17, 19, '3'], [18, 19, '2'], [19, 19, '1'], [20, 19, '3'], [17, 20, '3'], [18, 20, '4'], [19, 20, '2'], [20, 20, '3'],
      [17, 21, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [17, 22, '3'], [18, 22, '3'], [19, 22, '2'], [18, 23, '3']], lg);
    // ---- hair on top (reduced mass) + side locks over the temple
    const ht = new O.Pix(48, 48);
    locks(ht, [
      [[[27, 3], [19, 0], [10, 5], [8, 15]], { w0: 6, w1: 2.5 }],
      [[[32, 5], [24, 2], [16, 6], [13, 15]], { w0: 5.5, w1: 2.2 }],
      [[[35, 9], [30, 5], [22, 7], [18, 13]], { w0: 5, w1: 2 }],
      [[[21, 12], [20, 16], [21, 20], [20, 25]], { w0: 3, w1: 2, pow: 1 }]
    ], HR, TH);
    comp(fig, ht, HR[4]);
    // ---- beard: long wavy S-locks + moustache
    const bd = new O.Pix(48, 48);
    const BTH = { th: [0.72, 0.3, -0.12, -0.45], edgeAt: 0.6 };
    locks(bd, [
      [[[20, 24], [17, 31], [21, 38], [18, 46]], { w0: 4.5, w1: 2, pow: 1 }],
      [[[23, 27], [21, 34], [25, 40], [22, 47]], { w0: 5.5, w1: 2, pow: 1 }],
      [[[27, 29], [26, 36], [30, 41], [27, 47]], { w0: 5.5, w1: 2, pow: 1 }],
      [[[31, 29], [31, 36], [35, 40], [32, 46]], { w0: 5, w1: 2, pow: 1 }],
      [[[35, 28], [37, 33], [38, 38], [35, 43]], { w0: 4, w1: 1.5, pow: 1 }],
      [[[29, 30], [28, 35], [31, 40], [29, 45]], { w0: 3.6, w1: 1.4, pow: 1 }]
    ], HR, BTH);
    comp(fig, bd, HR[4]);
    const ms = new O.Pix(48, 48);
    locks(ms, [
      [[[32, 25.5], [29, 26.5], [26, 28.5], [25, 32]], { w0: 3.6, w1: 1 }],
      [[[33, 25.5], [35, 26.5], [37, 28.5], [37, 31]], { w0: 3, w1: 1 }]
    ], HR, BTH);
    comp(fig, ms, HR[4]);
    dots(fig, [[31, 28, lg.m], [32, 28, lg.m], [33, 28, lg.r]], lg);
    // ---- golden laurel crown resting on the brow
    const lc = new O.Pix(48, 48);
    laurelBand(lc, [[8, 17], [14, 12.5], [24, 10.5], [35, 12]], R.gold, [26, 8]);
    comp(fig, lc, OUT);
    // gold shoulder clasp
    art(fig, 14, 36, ['.gGg.', 'gGyGq', 'GyYGq', 'qGGqQ', '.qQQ.'], LG({ Y: '#ffffff' }, ['ygGqQ', R.gold]), 'clasp');
    clean(fig, [SK, HR, R.ivory, R.royal], 2);
    const bg = bgBands(['#5a5aa8', '#46448e', '#343274', '#24225a'], 22, 18, 20, 20);
    const bp = [[45, -1], [38, 10], [43, 12], [36, 24], [41, 26], [34, 40]];
    glow(bg, bp, '#ffe98a', 10, 0.55);
    const bolt = new O.Pix(48, 48);
    boltShape(bolt, bp, 3, ['#ffffff', R.bolt[2], R.bolt[3]]);
    bg.blit(bolt, 0, 0);
    return finishPortrait(fig, bg, '#ffe9a0', 0.45);
  }

  /* ---------- HERMES ---------- */
  function feather(p, x0, y0, x1, y1, w, F) {
    lock(p, [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 - 0.5], [x1, y1]], F, { w0: w, w1: 0.8, pow: 1.3, th: [0.55, 0.1, -0.3, -0.7], edgeTone: 2 });
  }
  function caduceus(p, x, y0, y1, big, hLen) {
    const G = R.gold, SN = R.snake;
    // staff (shaded side on the right)
    for (let y = y0; y <= y1; y++) { p.set(x, y, G[1]); p.set(x + 1, y, G[3]); if (big) p.set(x - 1, y, G[0]); }
    // double helix: two snakes crossing; the one in front at each height is lit, the other dark
    const top = y0 + (big ? 6 : 4), bot = hLen ? top + hLen : y1 - (big ? 4 : 2), per = big ? 13 : 7, amp = big ? 2.8 : 1.6;
    const W = big ? 2 : 1;
    const put = (xx, y, front) => { for (let i = 0; i < W; i++) p.set(xx + i, y, front ? SN[i === 0 ? 1 : 2] : SN[i === 0 ? 3 : 4]); };
    let pa = null, pb = null;
    for (let y = top; y <= bot; y++) {
      const t = ((y - top) / per) * Math.PI * 2;
      const a = Math.round(x + 0.5 - W / 2 + Math.sin(t) * amp), b = Math.round(x + 0.5 - W / 2 - Math.sin(t) * amp);
      const aFront = Math.cos(t) > 0;
      const span = (from, to, yy, front) => { const s0 = Math.min(from, to), s1 = Math.max(from, to); for (let xx = s0; xx <= s1; xx++) put(xx, yy, front); };
      if (aFront) { span(pb === null ? b : pb, b, y, false); span(pa === null ? a : pa, a, y, true); }
      else { span(pa === null ? a : pa, a, y, false); span(pb === null ? b : pb, b, y, true); }
      pa = a; pb = b;
    }
    // heads facing each other under the wings
    p.set(x - 2, top - 1, SN[1]); p.set(x - 1, top - 2, SN[1]); p.set(x - 2, top - 2, SN[2]);
    p.set(x + 2, top - 1, SN[2]); p.set(x + 2, top - 2, SN[1]); p.set(x + 3, top - 2, SN[3]);
    p.set(x - 1, top - 2, '#ffe04a');
    // winged knob
    ell(p, x + 0.5, y0 - 0.5, 1.4, 1.4, (xx, yy) => (xx + yy < x + y0 ? G[0] : G[2]));
    const F = R.feather;
    feather(p, x - 0.5, y0 + 0.5, x - (big ? 6 : 4), y0 - (big ? 3 : 2), big ? 2.4 : 1.8, F);
    feather(p, x + 1.5, y0 + 0.5, x + (big ? 7 : 5), y0 - (big ? 3 : 2), big ? 2.4 : 1.8, F);
  }
  function portraitHermes() {
    const SK = R.skin, HR = R.chestnut, G = R.gold;
    const lg = faceLG(SK, HR, { i: '#b0703a', j: '#5a3218', L: '#3e1e26', p: '#1c1016' });
    const fig = new O.Pix(48, 48);
    const TH = { th: [0.86, 0.5, 0.1, -0.3] };
    // caduceus behind the far shoulder
    const cd = new O.Pix(48, 48);
    caduceus(cd, 42, 12, 47, true);
    // curls at the nape
    const hb = new O.Pix(48, 48);
    fillPoly(hb, [[10, 9], [22, 10], [21, 22], [19, 29], [11, 30], [7, 24], [7, 14]], HR[3]);
    locks(hb, [
      [[[13, 12], [8, 16], [7, 22], [10, 25]], { w0: 5, w1: 1.4 }],
      [[[17, 14], [12, 19], [12, 25], [15, 29]], { w0: 5, w1: 1.4 }],
      [[[20, 17], [17, 22], [18, 27], [20, 29]], { w0: 4, w1: 1.2 }]
    ], HR, TH);
    comp(fig, hb, null);
    // body: light-blue chiton, honey chlamys over the near shoulder
    const ch = new Cloth(48, 48, R.sky);
    ch.fillT([[6, 48], [8, 41], [15, 37.5], [22, 36], [30, 36], [37, 37.5], [42, 40], [45, 44], [46, 48]], (x, y, u) => 1 + u * 2 + (y < 40 && x > 19 && x < 31 ? 0.7 : 0));
    ch.fold([[29, 39], [32, 43], [34, 48]], 1.4, 1, 1);
    ch.fold([[36, 39], [39, 43], [41, 48]], 1.3, 1, 1);
    ch.paint(fig);
    sweep(fig, [[20, 36.5], [25, 40], [31, 36.5]], () => 2, (t, s) => (s < 0 ? G[1] : G[3]));
    const cm = new Cloth(48, 48, R.ochre);
    cm.fillT([[0, 48], [0, 41], [5, 37], [12, 35], [18, 36], [22, 40], [21, 44], [18, 48]], (x, y, u) => 0.8 + u * 2);
    cm.fold([[6, 39], [5, 44], [5, 48]], 1.4, 1, 1);
    cm.fold([[13, 38], [12, 43], [11, 48]], 1.6, 1, 1);
    cm.fold([[19, 40], [17, 44], [16, 48]], 1.2, 1, 1);
    const cml = new O.Pix(48, 48); cm.paint(cml);
    comp(fig, cml, R.sky[4]);
    art(fig, 15, 37, ['.gGg.', 'gGyGq', 'GyYGq', 'qGGqQ', '.qQQ.'], LG({ Y: '#ffffff' }, ['ygGqQ', G]), 'brooch');
    // face: raised near brow, eyes glancing at the viewer, lopsided smirk with one tooth highlight
    art(fig, 14, 8, [
      '......22222222222222....',
      '.....2222222222222222...',
      '.....2222211111222222...',
      '....22222111111122222...',
      '....22222111111122222...',
      '....22222211111222222...',
      '....222222222222222222..',
      '....222222CCDD22222222..',
      '....22222D2222D2222222..',
      '....2222222222222DDD2...',
      '....2222222222233223....',
      '....22222LLLLLL31LLLL...',
      '....22222L*jwww31*jw2...',
      '....222222ipwww21ipw22..',
      '....222222iiw3221i33222.',
      '....221111233322212222..',
      '....2211112222222212222.',
      '....221112222222223533..',
      '....33222222223m22222...',
      '....3332222222222mttm2..',
      '....3333222222223rr2....',
      '....3333422222222333....',
      '....3344444222221122....',
      '....334444444333333.....',
      '....334444444443........',
      '.....23344444433........',
      '......2333444433........',
      '......2233334433........',
      '......2223333333........'
    ], lg, 'hermes-face');
    dots(fig, [[18, 18, '3'], [19, 18, '2'], [17, 19, '3'], [18, 19, '2'], [19, 19, '1'], [20, 19, '3'], [17, 20, '3'], [18, 20, '4'], [19, 20, '2'], [20, 20, '3'],
      [17, 21, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [17, 22, '3'], [18, 22, '3'], [19, 22, '2'], [20, 22, '3'], [18, 23, '3'], [19, 23, '4']], lg);
    // curls peeking under the helmet brim over the forehead and temple
    const fr = new O.Pix(48, 48);
    locks(fr, [
      [[[20, 12], [21, 15], [20, 18], [21, 21]], { w0: 3.4, w1: 1 }],
      [[[24, 12], [26, 13], [27, 15], [26, 16]], { w0: 3, w1: 1 }],
      [[[29, 12], [31, 13], [32, 15], [31, 16]], { w0: 2.6, w1: 1 }]
    ], HR, TH);
    comp(fig, fr, HR[4]);
    // far wing (behind the dome)
    const wf = new O.Pix(48, 48), F = R.feather;
    feather(wf, 31, 7, 36, -1, 2.6, F); feather(wf, 32, 8, 39, 2, 2.4, F);
    comp(fig, wf, OUT);
    // winged petasos: gold dome + brim
    const hm = new O.Pix(48, 48);
    ell(hm, 22.5, 10, 12.5, 8.5, (x, y, dx, dy) => { if (y > 11) return null; const v = -(dx * 0.6 + dy * 0.8) + Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) * 0.4; return G[v > 0.75 ? 0 : v > 0.3 ? 1 : v > -0.2 ? 2 : 3]; });
    sweep(hm, [[8, 13], [20, 11.2], [36, 12.2]], () => 2.4, (t, s) => (s < -0.2 ? G[1] : s < 0.5 ? G[2] : G[3]));
    comp(fig, hm, OUT);
    dots(fig, [[17, 4, '#ffffff'], [18, 4, G[0]], [16, 5, G[0]]], lg);
    // near wing sprouting from the side of the helmet, sweeping up and back
    const wn = new O.Pix(48, 48);
    feather(wn, 15, 9, 3, 2, 3.4, F);
    feather(wn, 15, 8, 5, -1, 3.2, F);
    feather(wn, 16, 8, 9, -2, 3, F);
    feather(wn, 15, 10, 2, 7, 3, F);
    comp(fig, wn, OUT);
    ell(fig, 16, 9.5, 2, 2, (x, y) => (x + y < 25 ? G[1] : G[3]));
    clean(fig, [SK, HR, R.sky, R.ochre], 2);
    outline(cd, OUT);
    const bg = bgBands(['#9cc8e8', '#78aad6', '#5a8cc0', '#436fa4'], 24, 16, 20, 20);
    bg.blit(cd, 0, 0);
    return finishPortrait(fig, bg, '#e6f4ff', 0.4);
  }

  /* ---------- HADES ---------- */
  // Ghost-flame tongue: tapered teardrop that curls to the upper-right; white-cyan core, cyan mid, violet tip.
  // Ghost-flame tongue: round bulb at the base, tapering tip that curls to the upper-right.
  // White-cyan core, cyan mid, violet rim/tip. (x0, y0) = base centre, h = height, w = max width.
  function ghostFlame(p, x0, y0, h, w, lean, ph) {
    const F = R.flame;
    for (let y = Math.floor(y0 - h); y <= Math.ceil(y0 + 2); y++) {
      const v = (y0 - (y + 0.5)) / h;          // 0 at the bulb centre, 1 at the tip
      let hw;
      if (v < 0) hw = (w / 2) * Math.sqrt(Math.max(0, 1 - (v * h / 2.2) ** 2));
      else hw = (w / 2) * (1 - Math.pow(v, 1.5)) + (v < 0.92 ? 0.2 : 0);
      if (hw < 0.3) continue;
      const vv = Math.max(0, v);
      const xc = x0 + lean * (vv * vv * 3.2) + Math.sin(vv * 4.4 + (ph || 0)) * 0.9 * vv;
      for (let x = Math.floor(xc - hw - 1); x <= Math.ceil(xc + hw + 1); x++) {
        const d = Math.abs(x + 0.5 - xc) / hw;
        if (d > 1) continue;
        let c;
        if (d > 0.74 || v > 0.76) c = F[3];
        else if (d < 0.4 && v < 0.42) c = F[0];
        else if (d < 0.6 && v < 0.62) c = F[1];
        else c = F[2];
        p.set(x, y, c);
      }
    }
  }
  function portraitHades() {
    const SK = R.skinHades, HR = R.hadesHair;
    const lg = faceLG(SK, HR, { w: '#dff8ff', i: '#8ff0ff', j: '#3ac8f0', p: '#ffffff', L: '#241a3c', m: '#3a2448', r: '#8a78a8' }, { g: '#a8e8f8' });
    const fig = new O.Pix(48, 48);
    const TH = { th: [0.9, 0.62, 0.25, -0.2] };
    // long straight hair behind
    const hb = new O.Pix(48, 48);
    fillPoly(hb, [[10, 7], [16, 4], [26, 3], [32, 5], [22, 14], [22, 30], [20, 44], [4, 44], [4, 26], [5, 13]], HR[3]);
    locks(hb, [
      [[[15, 7], [7, 12], [6, 28], [4, 44]], { w0: 7, w1: 3, pow: 1 }],
      [[[18, 9], [12, 16], [12, 30], [10, 45]], { w0: 7, w1: 3, pow: 1 }],
      [[[21, 12], [17, 20], [18, 32], [16, 45]], { w0: 6, w1: 2.5, pow: 1 }]
    ], HR, TH, HR[4]);
    comp(fig, hb, null);
    // robe with a tall stiff collar, silver edged
    const rb = new Cloth(48, 48, R.violet);
    rb.fillT([[2, 48], [4, 41], [11, 37], [21, 35.5], [31, 35.5], [38, 37], [43, 40], [46, 44], [47, 48]], (x, y, u) => 1 + u * 2.4);
    rb.fold([[28, 39], [31, 43], [32, 48]], 1.4, 1, 1);
    rb.fold([[36, 39], [39, 43], [41, 48]], 1.3, 1, 1);
    rb.fold([[9, 41], [8, 48]], 1.3, 1, 1);
    rb.paint(fig);
    const col = new Cloth(48, 48, R.violet);
    col.fillT([[10, 40], [12, 29], [15, 25], [20, 31], [23, 39], [18, 43]], (x, y, u) => 0.5 + u * 2.4);
    col.fillT([[31, 39], [33, 31], [37, 26], [39, 29], [39, 36], [35, 41]], (x, y, u) => 1.8 + u * 1.6);
    const cl = new O.Pix(48, 48); col.paint(cl);
    pline(cl, [[12, 29], [15, 25], [20, 31], [23, 39]], (x, y) => cl.set(x, y, R.silver[1]));
    pline(cl, [[33, 31], [37, 26], [39, 29]], (x, y) => cl.set(x, y, R.silver[2]));
    // face
    art(fig, 14, 8, [
      '......22222222222222....',
      '.....2222222222222222...',
      '.....2222211111222222...',
      '....22222111111122222...',
      '....22222111111122222...',
      '....22222211111222222...',
      '....222222222222222222..',
      '....222222222222222222..',
      '....2222CD2222222222D2..',
      '....222222DDD22222DD2...',
      '....222222223DDE2E23....',
      '....22222LLLLLL31LLLL...',
      '....22222Lwpijw31pij2...',
      '....222222444442144422..',
      '....2222223gg33213g3222.',
      '....221111233322212222..',
      '....2211112222222212222.',
      '....223333222222223533..',
      '....332332222222232222..',
      '....3332222222222mmmm2..',
      '....3333222222223rr2....',
      '....3333422222222DDD....',
      '....3344444222222DDE....',
      '....334444444333DDE.....',
      '....334444444443.DE.....',
      '......2344444433..E.....',
      '......2233344433........',
      '......2223333333........',
      '......2223333333........'
    ], lg, 'hades-face');
    dots(fig, [[18, 18, '3'], [19, 18, '3'], [17, 19, '3'], [18, 19, '2'], [19, 19, '2'], [20, 19, '3'], [17, 20, '3'], [18, 20, '4'], [19, 20, '2'], [20, 20, '3'],
      [17, 21, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [17, 22, '3'], [18, 22, '3'], [19, 22, '3'], [18, 23, '4']], lg);
    comp(fig, cl, R.violet[4]);
    // hair: centre-parted, long locks framing the face (cyan rim on the back edge)
    const ht = new O.Pix(48, 48);
    locks(ht, [
      [[[26, 5], [18, 3], [11, 7], [8, 16]], { w0: 6, w1: 3 }],
      [[[31, 7], [25, 4], [17, 8], [14, 16]], { w0: 5.5, w1: 2.6 }],
      [[[34, 11], [30, 6], [24, 8], [21, 14]], { w0: 4.5, w1: 2 }],
      [[[21, 12], [19, 20], [20, 30], [18, 40]], { w0: 3.4, w1: 2, pow: 1 }]
    ], HR, TH, HR[4]);
    comp(fig, ht, HR[4]);
    // iron crown seated on the hair (shadow line beneath)
    const cr = new O.Pix(48, 48), IR = R.iron;
    sweep(cr, [[9, 13], [16, 9], [26, 7.5], [35, 9.5]], () => 3, (t, s) => (s < -0.35 ? IR[1] : s < 0.4 ? IR[2] : IR[3]));
    [[12, 10], [17.5, 7.5], [23.5, 6.2], [29.5, 6.2], [34, 7.8]].forEach(([x, y], k) => {
      fillPoly(cr, [[x - 1.6, y + 1], [x, y - 3 - (k % 2)], [x + 1.6, y + 1]], (xx) => (xx < x ? IR[1] : IR[3]));
    });
    dots(cr, [[23, 7, R.flame[2]], [29, 7, R.flame[2]], [17, 8, R.flame[3]]], lg);
    outline(cr, OUT);
    pline(fig, [[10, 14], [16, 10.5], [26, 9], [34, 11]], (x, y) => { const c = fig.get(x, y); if (c && Object.values(HR).indexOf(c) >= 0) fig.set(x, y, HR[4]); });
    clean(fig, [SK, HR, R.violet], 2);
    rim(fig, '#6ad8ff', 0.5, 0, 40, { [OUT]: 1 });
    outline(fig, '#0c0a16');
    // background with a cold glow, flames on top of everything
    const D = 3;   // the figure sits lower to leave room for the flames
    const bg = bgBands(['#2e4a86', '#243a6e', '#1a2a54', '#121c3c'], 24, 12, 18, 20);
    glow(bg, [[10, 6], [36, 4]], '#6cc4ff', 10, 0.45);
    glow(bg, [[24, 20 + D], [34, 20 + D]], '#38c8e8', 5, 0.3);
    bg.blit(fig, 0, D);
    const fl = new O.Pix(48, 48);
    [[11.5, 10, 8, 5.4, 1.6, 0], [34.5, 8.5, 7, 4.6, 1.4, 2], [29, 6.5, 11, 6, 2, 1], [17, 7.5, 13, 6.4, 2.2, 3], [23.5, 6, 8, 5, 1.4, 4]].forEach(([x, y, h, w, l, ph]) => ghostFlame(fl, x, y + D, h, w, l, ph));
    bg.blit(fl, 0, 0);
    bg.blit(cr, 0, D);
    [[25, 0], [37, 2], [18, 4], [40, 7]].forEach(([x, y]) => bg.set(x, y, R.flame[3]));
    bg.set(26, 1, R.flame[2]);
    return bg;
  }

  /* ---------- ELDER (village sage) ---------- */
  function portraitElder() {
    const SK = R.skinOld, HR = R.white;
    const lg = faceLG(SK, HR, { i: '#7aa0c0', j: '#3e5a7c', L: '#4a2a36', p: '#1e1a2a' });
    const fig = new O.Pix(48, 48);
    const TH = { th: [0.8, 0.45, 0.05, -0.35] };
    // gnarled staff behind the far shoulder
    const st = new O.Pix(48, 48), WD = R.wood;
    lock(st, [[42, 48], [41, 30], [43, 20], [41, 11]], WD, { w0: 3.4, w1: 3, pow: 1, th: [0.9, 0.35, -0.1, -0.5] });
    ell(st, 41.5, 9.5, 2.8, 2.6, (x, y, dx, dy) => WD[dx + dy < -0.6 ? 0 : dx + dy < 0.3 ? 1 : dx + dy < 0.9 ? 2 : 3]);
    dots(st, [[42, 22, WD[3]], [43, 22, WD[3]], [41, 32, WD[3]], [40, 10, WD[3]], [41, 10, WD[4]]], lg);
    outline(st, OUT);
    // white hair at the back of the head, falling behind the neck
    const hb = new O.Pix(48, 48);
    fillPoly(hb, [[9, 14], [16, 12], [21, 16], [21, 28], [18, 38], [8, 38], [6, 26]], HR[3]);
    locks(hb, [
      [[[12, 13], [7, 19], [8, 29], [6, 38]], { w0: 5, w1: 2, pow: 1 }],
      [[[16, 14], [11, 21], [13, 30], [11, 39]], { w0: 5, w1: 2, pow: 1 }],
      [[[19, 17], [16, 24], [18, 32], [16, 39]], { w0: 4, w1: 1.8, pow: 1 }]
    ], HR, TH);
    comp(fig, hb, null);
    // brown wool himation over a pale chiton
    const ch = new Cloth(48, 48, R.ivory);
    ch.fillT([[16, 48], [18, 38], [24, 35.5], [31, 35.5], [34, 40], [32, 48]], (x, y, u) => 1 + u * 1.8);
    ch.paint(fig);
    const hm = new Cloth(48, 48, R.wool);
    hm.fillT([[0, 48], [1, 41], [6, 37], [14, 35], [19, 36], [24, 42], [28, 48]], (x, y, u) => 0.7 + u * 1.8);
    hm.fillT([[31, 48], [33, 40], [37, 37], [42, 39], [45, 43], [47, 48]], (x, y, u) => 1.4 + u * 1.6);
    hm.fold([[7, 39], [9, 43], [11, 48]], 1.6, 1, 1);
    hm.fold([[14, 38], [17, 42], [20, 48]], 1.5, 1, 1);
    hm.fold([[3, 42], [3, 48]], 1.2, 1, 1);
    hm.fold([[38, 40], [40, 44], [41, 48]], 1.3, 1, 1);
    const hl = new O.Pix(48, 48); hm.paint(hl);
    pline(hl, [[19, 36], [24, 42], [28, 48]], (x, y) => { if (hl.get(x, y)) hl.set(x, y, R.wool[4]); });
    comp(fig, hl, R.ivory[4]);
    // bald dome: sphere in 3 clean bands with a small 2x1 highlight
    ell(fig, 23, 13.5, 12, 11, (x, y, dx, dy) => { const v = -(dx * 0.45 + dy * 0.9); return SK[v > 0.62 ? 0 : v > -0.05 ? 1 : 2]; });
    art(fig, 14, 12, [
      '....22222111111122222...',
      '....22223333322222222...',
      '....222222222222222222..',
      '....222222333333222222..',
      '....22222AAAB22222AA22..',
      '....2222BCCCC2222222C2..',
      '....2222223333222332....',
      '....222322LLLL231LL2....',
      '....22222Lw*jwL21*jL2...',
      '....2223223ip3221ip322..',
      '....2222222332221332222.',
      '....221111222222212222..',
      '....2211112222223212222.',
      '....221112222222323533..',
      '....33222222222222222...',
      '....3332222222222222....',
      '....333322222222222.....',
      '....33334222222222......',
      '....334444422222........',
      '....33444444433.........',
      '....33444444443.........',
      '.....23344444433........',
      '......2333444433........',
      '......2233334433........'
    ], lg, 'elder-face');
    dots(fig, [[17, 10, '#fffaf2'], [18, 10, '#fffaf2'], [16, 11, SK[0]]], lg);
    dots(fig, [[18, 18, '3'], [19, 18, '2'], [17, 19, '3'], [18, 19, '2'], [19, 19, '1'], [20, 19, '3'], [17, 20, '3'], [18, 20, '4'], [19, 20, '2'], [20, 20, '3'],
      [17, 21, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [17, 22, '3'], [18, 22, '3'], [19, 22, '2'], [18, 23, '3'], [18, 24, '3']], lg);
    // temple tufts sweeping back behind the ear
    const tf = new O.Pix(48, 48);
    locks(tf, [
      [[[20, 16], [17, 14], [14, 15], [12, 19]], { w0: 3.2, w1: 1.4 }],
      [[[20, 18], [17, 17.5], [15, 19], [14, 23]], { w0: 2.4, w1: 1 }]
    ], HR, TH);
    comp(fig, tf, HR[4]);
    // long white beard + drooping moustache
    const bd = new O.Pix(48, 48);
    const BTH = { th: [0.72, 0.3, -0.12, -0.45], edgeAt: 0.6 };
    locks(bd, [
      [[[21, 25], [19, 31], [23, 37], [21, 44]], { w0: 4.5, w1: 1.6, pow: 1 }],
      [[[24, 28], [22, 34], [26, 40], [24, 47]], { w0: 5.5, w1: 1.8, pow: 1 }],
      [[[28, 29], [27, 36], [31, 41], [28, 47]], { w0: 5.5, w1: 1.8, pow: 1 }],
      [[[32, 29], [32, 35], [35, 39], [33, 44]], { w0: 5, w1: 1.6, pow: 1 }],
      [[[35, 28], [37, 32], [37, 36], [35, 39]], { w0: 3.6, w1: 1.4, pow: 1 }]
    ], HR, BTH);
    comp(fig, bd, HR[4]);
    const ms = new O.Pix(48, 48);
    locks(ms, [
      [[[32, 25.5], [29, 26.5], [27, 29], [27, 32]], { w0: 3.4, w1: 1 }],
      [[[33, 25.5], [35, 26.5], [36, 29], [36, 31]], { w0: 2.8, w1: 1 }]
    ], HR, BTH);
    comp(fig, ms, HR[4]);
    dots(fig, [[31, 28, lg.m], [32, 28, lg.m], [33, 28, lg.r]], lg);
    clean(fig, [SK, HR, R.wool, R.ivory], 2);
    const bg = bgBands(['#b48a5e', '#96704c', '#7a5840', '#5e4234'], 24, 16, 20, 20);
    bg.blit(st, 0, 0);
    return finishPortrait(fig, bg, '#ffe3b8', 0.4);
  }

  /* ---------- MERCHANT (older market woman, ochre headscarf, ambrosia jar) ---------- */
  function portraitMerchant() {
    const SK = R.skinTan, HR = R.chestnut, SC = R.ochre;
    const lg = faceLG(SK, HR, { i: '#b07a3a', j: '#5a3418', L: '#3e1e26', p: '#1c1016', k: '#e88a70', r: '#c8665c', m: '#8a3440' });
    const fig = new O.Pix(48, 48);
    const TH = { th: [0.86, 0.5, 0.1, -0.3] };
    // scarf tail hanging behind the neck
    const tl = new O.Pix(48, 48);
    lock(tl, [[12, 18], [9, 26], [12, 33], [10, 40]], SC, { w0: 7, w1: 4, pow: 1, th: [0.85, 0.4, 0, -0.4] });
    lock(tl, [[16, 20], [15, 27], [17, 33], [16, 38]], SC, { w0: 5, w1: 3, pow: 1, th: [0.85, 0.4, 0, -0.4], dark: 1 });
    comp(fig, tl, null);
    // cornflower dress with a cream apron bib
    const ch = new Cloth(48, 48, R.corn);
    ch.fillT([[6, 48], [8, 41], [15, 37.5], [22, 36], [30, 36], [37, 37.5], [42, 40], [45, 44], [46, 48]], (x, y, u) => 0.9 + u * 2.2);
    ch.fold([[33, 39], [36, 43], [38, 48]], 1.4, 1, 1);
    ch.fold([[39, 40], [42, 44], [43, 48]], 1.2, 1, 1);
    ch.paint(fig);
    const ap = new Cloth(48, 48, R.ivory);
    ap.fillT([[21, 48], [22, 40], [31, 40], [33, 48]], (x, y, u) => 0.8 + u * 1.6);
    ap.fold([[26, 42], [25, 48]], 1.2, 1, 1);
    const apl = new O.Pix(48, 48); ap.paint(apl);
    comp(fig, apl, R.corn[4]);
    sweep(fig, [[20, 36.5], [25.5, 39.5], [31, 36.5]], () => 2, (t, s) => (s < 0 ? R.ivory[1] : R.ivory[3]));
    art(fig, 14, 8, [
      '......22222222222222....',
      '.....2222222222222222...',
      '.....2222211111222222...',
      '....22222111111122222...',
      '....22222111111122222...',
      '....22222211111222222...',
      '....222222222222222222..',
      '....222222222222222222..',
      '....222222222222222222..',
      '....2222222DDDD222DD2...',
      '....222222D222233223....',
      '....222222LLLLL31LLL2...',
      '....222222L*jw321*jL2...',
      '....222222wipw321ip322..',
      '....2222222332221332222.',
      '....211111122222212222..',
      '....211kk1222222212222..',
      '....22112222222223253...',
      '....33222222222232222...',
      '....33322222222222mmm2..',
      '....33332222222222rr2...',
      '....33332222222222222...',
      '....33344422222222211...',
      '....3344444442222222....',
      '....33444444444333......',
      '.....2334444443.........',
      '......2333444433........',
      '......2233334433........',
      '......2223333333........'
    ], lg, 'merchant-face');
    dots(fig, [[16, 26, 'm']], lg);
    dots(fig, [[18, 19, '3'], [19, 19, '2'], [18, 20, '2'], [19, 20, '1'], [20, 20, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [18, 22, '3'], [19, 22, '2'], [19, 23, '3']], lg);
    // gold hoop earring
    dots(fig, [[18, 24, R.gold[1]], [18, 25, R.gold[2]], [19, 26, R.gold[3]], [20, 25, R.gold[2]]], lg);
    // chestnut hair peeking under the scarf edge
    const hr = new O.Pix(48, 48);
    locks(hr, [[[[33, 12], [29, 13], [25, 14], [21, 17]], { w0: 3, w1: 2 }], [[[21, 14], [20, 17], [20, 20]], { w0: 2.6, w1: 1.4 }]], HR, TH);
    comp(fig, hr, HR[4]);
    // slim headscarf hugging the skull, folds radiating from the knot at the nape, knot
    const sc = new O.Pix(48, 48);
    ell(sc, 22, 12.5, 12.8, 10.5, (x, y, dx, dy) => {
      if (x > 19 && y > 12 - (x - 19) * 0.12 + (x > 30 ? (x - 30) * 0.3 : 0)) return null;
      if (x <= 19 && y > 19) return null;
      const v = -(dx * 0.5 + dy * 0.85) + Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) * 0.35;
      return SC[v > 0.75 ? 0 : v > 0.25 ? 1 : v > -0.25 ? 2 : 3];
    });
    [[[12, 17], [18, 8], [28, 4]], [[13, 18], [22, 11], [33, 9]]].forEach((P) => sweep(sc, P, () => 1, () => 'F'));
    for (let i = 0; i < sc.d.length; i++) if (sc.d[i] === 'F') { const x = i % 48, y = (i / 48) | 0; sc.d[i] = null; const u = fig.get(x, y); sc.d[i] = SC[3]; if (sc.get(x - 1, y - 1) && sc.get(x - 1, y - 1) !== SC[3]) sc.set(x - 1, y - 1, SC[0]); }
    // hem band along the face edge
    sweep(sc, [[19, 18.5], [25, 12.5], [34, 11.5]], () => 2, (t, s) => (s < 0 ? SC[1] : SC[3]));
    ell(sc, 12, 18.5, 2.6, 2.3, (x, y, dx, dy) => SC[dx + dy < -0.5 ? 1 : dx + dy < 0.5 ? 2 : 3]);
    comp(fig, sc, OUT);
    // clay amphora of ambrosia on the near shoulder, a hand underneath
    const jar = new O.Pix(48, 48), CL = R.clay;
    ell(jar, 7, 33, 6.8, 8.6, (x, y, dx, dy) => { const v = -(dx * 0.7 + dy * 0.6) + Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) * 0.5; return CL[v > 0.85 ? 0 : v > 0.35 ? 1 : v > -0.2 ? 2 : 3]; });
    fillPoly(jar, [[4, 20.5], [10, 20.5], [9.5, 25], [4.5, 25]], (x) => CL[x < 6 ? 1 : x < 9 ? 2 : 3]);
    art(jar, 3, 19, ['sssssst', 'tuuuuuv'], LG({}, ['stuv', [CL[1], CL[2], CL[3], CL[4]]]), 'rim');
    pline(jar, [[1, 30], [13, 30]], (x, y) => { if (jar.get(x, y)) jar.set(x, y, '#f6d27a'); });
    pline(jar, [[1, 31], [13, 31]], (x, y) => { if (jar.get(x, y)) jar.set(x, y, CL[3]); });
    sweep(jar, [[11, 22], [14.5, 24], [13.5, 28]], () => 1.6, (t, s) => (s < 0 ? CL[2] : CL[3]));
    dots(jar, [[4, 27, '#fff0d8'], [4, 28, CL[0]], [5, 26, CL[0]]], lg);
    art(jar, 5, 41, ['.1122', '11223', '.2233'], LG({}, ['123', [SK[0], SK[1], SK[2]]]), 'hand');
    outline(jar, OUT);
    clean(fig, [SK, HR, R.corn, SC, R.ivory], 2);
    const bg = bgBands(['#e0a870', '#c48c5a', '#a4704a', '#80543c'], 24, 16, 20, 20);
    finishPortrait(fig, bg, '#fff0d0', 0.35);
    bg.blit(jar, 0, 0);
    return bg;
  }

  /* ---------- VILLAGER (young woman, pink dress, flower in dark hair) ---------- */
  function portraitVillager() {
    const SK = R.skin, HR = R.darkHair;
    const lg = faceLG(SK, HR, { i: '#8a5a3a', j: '#42261a', L: '#2a1420', p: '#140c10', k: '#f29a92', r: '#e07a86', m: '#9a3a52' });
    const fig = new O.Pix(48, 48);
    const TH = { th: [0.86, 0.55, 0.15, -0.28] };
    // bun at the back of the head + nape hair
    const hb = new O.Pix(48, 48);
    fillPoly(hb, [[9, 8], [16, 3], [26, 2], [31, 5], [22, 14], [22, 24], [18, 30], [11, 29], [7, 20]], HR[3]);
    locks(hb, [
      [[[15, 12], [10, 18], [11, 25], [15, 30]], { w0: 5, w1: 2 }],
      [[[19, 15], [16, 21], [18, 27], [20, 30]], { w0: 4, w1: 1.6 }]
    ], HR, TH);
    const bun = new O.Pix(48, 48);
    locks(bun, [
      [[[10, 5], [4, 7], [3, 13], [8, 16]], { w0: 5, w1: 2.4 }],
      [[[5, 13], [8, 17], [13, 15], [12, 9]], { w0: 4.4, w1: 2 }],
      [[[11, 8], [8, 9], [7, 12], [9, 14]], { w0: 3, w1: 1.4 }]
    ], HR, TH);
    comp(hb, bun, HR[4]);
    comp(fig, hb, null);
    // pink dress
    const ch = new Cloth(48, 48, R.pink);
    ch.fillT([[6, 48], [8, 41], [15, 37.5], [22, 36], [30, 36], [37, 37.5], [42, 40], [45, 44], [46, 48]], (x, y, u) => 1 + u * 2.1);
    ch.fold([[15, 40], [20, 43], [24, 48]], 1.5, 1, 1);
    ch.fold([[31, 39], [34, 43], [36, 48]], 1.4, 1, 1);
    ch.fold([[38, 40], [41, 44], [42, 48]], 1.2, 1, 1);
    ch.fold([[10, 43], [11, 48]], 1.2, 1, 1);
    ch.paint(fig);
    sweep(fig, [[19, 36.5], [25.5, 40.5], [32, 36.5]], () => 2, (t, s) => (s < 0 ? '#ffffff' : '#e0d0e0'));
    art(fig, 14, 8, [
      '......22222222222222....',
      '.....2222222222222222...',
      '.....2222211111222222...',
      '....22222111111122222...',
      '....22222111111122222...',
      '....22222211111222222...',
      '....222222222222222222..',
      '....222222222222222222..',
      '....2222222CDDD2222DD2..',
      '....222222D222222222D...',
      '....2222L22222233223....',
      '....2222LLLLLLL31LLLLL..',
      '....22222Lw*jww31*jw2...',
      '....222222wipww21ipw22..',
      '....2222223iiw321i32222.',
      '....221111233322212222..',
      '....2211kk22222222122...',
      '....22112222222222353...',
      '....3322222222223222....',
      '....3332222222222mm2....',
      '....33332222222222r2....',
      '....333342222222223.....',
      '....3344444222221.......',
      '....334444444333........',
      '......444444443.........',
      '......2344444433........',
      '......2233344433........',
      '......2223333333........',
      '......2223333333........'
    ], lg, 'villager-face');
    dots(fig, [[18, 19, '3'], [19, 19, '2'], [18, 20, '3'], [19, 20, '1'], [20, 20, '3'], [18, 21, '4'], [19, 21, '2'], [20, 21, '3'], [18, 22, '3'], [19, 22, '2'], [19, 23, '3']], lg);
    // hair on top: side-swept fringe, loose lock by the cheek
    const ht = new O.Pix(48, 48);
    locks(ht, [
      [[[27, 3], [19, 1], [11, 5], [9, 12]], { w0: 6, w1: 3 }],
      [[[32, 5], [24, 2], [16, 6], [13, 13]], { w0: 5.5, w1: 2.6 }],
      [[[26, 4], [31, 6], [35, 10], [36, 15]], { w0: 5, w1: 1.2 }],
      [[[23, 6], [26, 9], [28, 12], [27, 15]], { w0: 3.6, w1: 1 }],
      [[[21, 11], [19, 17], [21, 23], [20, 29]], { w0: 3, w1: 1.2, pow: 1 }]
    ], HR, TH);
    comp(fig, ht, HR[4]);
    // hibiscus flower behind the ear
    art(fig, 12, 9, [
      '..BB.B..',
      '.BBBBBB.',
      'BBBDYBBB',
      'BBDYYDBB',
      '.BBDYBBL',
      '.LBBDBLL',
      'LLDBD.L.',
      '.L......'
    ], { B: '#ff86b0', D: '#c83a78', Y: '#ffd75a', L: '#5ca84a' }, 'hibiscus');
    dots(fig, [[14, 10, '#ffd0e0'], [13, 11, '#ffd0e0'], [15, 10, '#ffffff']], lg);
    clean(fig, [SK, HR, R.pink], 2);
    const bg = bgBands(['#a8d090', '#88b878', '#6c9c64', '#548254'], 24, 16, 20, 20);
    return finishPortrait(fig, bg, '#fff0e6', 0.35);
  }

  /* ================================================================
     IN-GAME NPC SPRITES — 3/4 view facing right, idle loops of 4 frames (12 ticks each)
     plus an extra "_blink" frame. Bodies: cloth shaded as a cylinder with diagonal fold strokes,
     limbs as shaded capsules on their own layer (inner contour where they overlap), heads are
     hand-authored maps. Secondary motion (hem, hair, beard, cape) lags one frame behind the bob.
     ================================================================ */
  const BOB = [0, 0, 1, 1];          // breathing: upper body sinks on frames 2-3
  const LAG = [1, 0, 0, 1];          // follow-through: hem / hair / beard, one frame behind
  // Shaded limb capsule (2-3 px wide): lit tone on the upper-left side, shadow on the other.
  function limb(p, P, w0, w1, ramp, o) {
    return lock(p, P, ramp, Object.assign({ w0, w1, pow: 1, th: [0.95, 0.35, -0.15, -0.6], edge: false }, o || {}));
  }
  // Solid cloth region: cylinder shading + fold strokes; returns a Pix layer.
  function clothLayer(W, H, ramp, poly, shade, folds, extra) {
    const c = new Cloth(W, H, ramp);
    c.fillT(poly, shade);
    (folds || []).forEach((f) => c.fold(f[0], f[1] || 1.2, f[2] || 0.8, f[3] || 1, f[4]));
    if (extra) extra(c);
    const q = new O.Pix(W, H); c.paint(q);
    return q;
  }
  function headArt(p, rows, lg, x, y, tag) { art(p, x, y, rows, lg, tag); }
  // Build the 4 idle frames + blink; draw(f, blink) returns a Pix. Outline is applied here.
  function idleFrames(draw, outCol) {
    const out = [];
    for (let f = 0; f < 5; f++) { const p = f < 4 ? draw(f, false) : draw(0, true); outline(p, outCol || OUT); out.push(p); }
    return out;
  }

  /* ---------- EURYDICE (and her ghost) ---------- */
  const EURY_HEAD = [
    '....DCCCD....',
    '..DCBAABBCD..',
    '.DCBAABBAABC.',
    'DCBpBlfBlpBC.',
    'CBABCB2112BC.',
    'BABCC3221DD2.',
    'ABCB32222WK2.',
    'ABCB432222K22',
    'ABCBC432r222.',
    'ABCBCD4322m2.',
    'BCDCD..4332..',
    'CDCDC..43....'
  ];
  function eurydiceFrames(ghost) {
    const W = 26, H = 40;
    const SK = ghost ? ['#ffffff', '#e8f8ff', '#bfe4f4', '#86b4d8', '#50709e'] : R.skinF;
    const HR = ghost ? ['#ffffff', '#d4fbff', '#8fe4f6', '#4fa6d6', '#2d5c9c'] : R.blond;
    const CL = ghost ? ['#ffffff', '#e2fbff', '#a8e6f6', '#6fb2dc', '#4474b0'] : R.cloth;
    const GD = ghost ? ['#ffffff', '#d4f8ff', '#8fd0f0', '#5a9ccc', '#3a6aa0'] : R.gold;
    const lg = LG({ W: '#ffffff', K: ghost ? '#2d4f86' : '#2a2040', m: ghost ? '#6fa8d0' : '#c05a60', r: ghost ? '#d8f4ff' : '#f4a494',
      p: ghost ? '#d4f8ff' : '#ff9cc0', f: '#ffffff', l: ghost ? '#a8f0e0' : '#6cc04a' }, ['1234', SK], ['ABCDE', HR]);
    const out = idleFrames((f, blink) => {
      const p = new O.Pix(W, H), b = BOB[f], s = LAG[f];
      // long hair down the back (behind everything), tips sway
      const hb = new O.Pix(W, H);
      fillPoly(hb, [[7, 4 + b], [12, 4 + b], [12, 14 + b], [11, 22 + b], [6 + s, 24], [4 + s, 18], [5, 8 + b]], HR[3]);
      locks(hb, [
        [[[8, 5 + b], [5, 11 + b], [6, 18], [4 + s, 24]], { w0: 4.5, w1: 2, pow: 1 }],
        [[[10, 6 + b], [8, 13 + b], [9, 19], [7 + s, 24]], { w0: 4, w1: 1.6, pow: 1 }]
      ], HR, { th: [0.8, 0.45, 0.05, -0.3] });
      comp(p, hb, null);
      // skirt: flares from the high waist to a 14-px hem, diagonal folds from the sash, hem sways
      p.blit(clothLayer(W, H, CL, [[10, 20], [17, 20], [18.5 + s * 0.3, 27], [20 + s, 36], [6 + s, 36], [8, 27]], (x, y, u) => 0.8 + u * 2.2 + (y > 34 ? 1 : 0),
        [[[[12, 21], [10, 28], [8 + s, 35]], 1.2, 1], [[[15, 21], [16.5, 28], [18 + s, 35]], 1.2, 1], [[[13.5, 26], [13 + s, 35]], 1, 1]]), 0, 0);
      // sandals
      art(p, 8, 36, ['ss.', 'SSs'], { s: R.leather[1], S: R.leather[3] }, 'sandal');
      art(p, 14, 36, ['.ss.', 'sSSs'], { s: R.leather[1], S: R.leather[3] }, 'sandal');
      dots(p, [[9, 36, SK[2]], [15, 36, SK[1]], [16, 36, SK[2]]], lg);
      // bodice + gold sash (moves with the breath)
      const up = new O.Pix(W, H);
      up.blit(clothLayer(W, H, CL, [[9, 13 + b], [18, 13 + b], [18, 15 + b], [17, 20 + b], [10, 20 + b], [9, 15 + b]], (x, y, u) => 0.8 + u * 2.2, [[[[12, 14 + b], [14, 18 + b]], 1, 1]]), 0, 0);
      sweep(up, [[9.5, 13.5 + b], [13.5, 15 + b], [17.5, 13.5 + b]], () => 1.4, () => SK[1]);
      pline(up, [[10, 19 + b], [17, 19 + b]], (x, y) => up.set(x, y, x < 13 ? GD[1] : x < 16 ? GD[2] : GD[3]));
      up.set(14, 20 + b, GD[2]); up.set(14, 21 + b, GD[3]);
      comp(p, up, CL[4]);
      // head
      const hd = new O.Pix(W, H);
      const rows = EURY_HEAD.slice();
      if (blink) { rows[6] = 'ABCB32222DD2.'; rows[7] = 'ABCB432222222'.slice(0, 13); }
      headArt(hd, rows, lg, 6, 1 + b, 'eury-head');
      comp(p, hd, null);
      // near arm: shoulder -> elbow -> hands clasped in front of the waist (own contour)
      const ar = new O.Pix(W, H);
      limb(ar, [[16, 14.5 + b], [16, 18 + b]], 2.6, 2.2, SK);
      limb(ar, [[16, 18 + b], [18, 19.5 + b]], 2.2, 2, SK);
      art(ar, 17, 18 + b, ['.12', '122', '.23'], lg, 'hands');
      comp(p, ar, CL[4]);
      return p;
    }, ghost ? '#2e5a98' : OUT);
    if (ghost) {
      // spectral: the lower body dissolves into 3 wispy flame-like strands, mist rises
      out.forEach((p, f) => {
        const q = new O.Pix(p.w, p.h);
        for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.get(x, y); if (c && y < 29) q.set(x, y, c); }
        const sw = [0, 1, 0, -1, 0][f];
        const G = ['#ffffff', '#e2fbff', '#a8e6f6', '#6fb2dc', '#4474b0'];
        [[9, 29, 7, -1.5, 4], [13, 29, 9, 0.5, 4.5], [17, 29, 6, 2, 3.5]].forEach(([x, y, len, dx, w], k) => {
          sweep(q, [[x, y], [x + dx * 0.5 + sw, y + len * 0.5], [x + dx + sw * (k === 1 ? -1 : 1), y + len]], (t) => w * (1 - t * 0.85), (t, s2) => (t > 0.7 && ((Math.round(x + s2 * 3 + t * 9)) & 1) ? null : G[Math.abs(s2) < 0.35 ? 1 : Math.abs(s2) < 0.75 ? 2 : 3]));
        });
        // brighten the core (face and chest) so she glows
        for (let y = 0; y < 22; y++) for (let x = 0; x < p.w; x++) { const c = q.get(x, y); if (c === G[2]) q.set(x, y, G[1]); }
        outline(q, '#2e5a98');
        [[5, 20 - f * 3], [20, 24 - f * 2], [11, 34 - f * 3]].forEach(([x, y]) => { if (y > 0) q.set(x, y, G[1]); });
        out[f] = q;
      });
    }
    return out;
  }

  /* ---------- village women: shared 3/4 body, own head, dress, props ---------- */
  // o: {skin, hair, dress, head(blink) -> rows, lg, back(p, f, b, s), apron, belt, props(p, f, b, s, lg), armIn}
  function womanFrames(o) {
    const W = 26, H = 40, SK = o.skin, CL = o.dress;
    const lg = Object.assign(LG({ W: '#ffffff', K: '#2a1830', m: '#b04a56', r: '#f09a8c' }, ['1234', SK], ['ABCDE', o.hair]), o.lg || {});
    return idleFrames((f, blink) => {
      const p = new O.Pix(W, H), b = BOB[f], s = LAG[f];
      if (o.back) o.back(p, f, b, s, lg);
      // skirt with a contrapposto hem (near side forward), diagonal folds from the belt
      p.blit(clothLayer(W, H, CL, [[10, 20], [17, 20], [18.5 + s * 0.3, 27], [20 + s, 35.5], [6 + s, 35.5], [8, 27]], (x, y, u) => 0.8 + u * 2.3 + (y > 34 ? 1 : 0),
        [[[[12, 21], [10, 28], [8 + s, 35]], 1.2, 1], [[[15, 21], [16.5, 28], [18 + s, 35]], 1.2, 1], [[[13.5, 27], [13 + s, 35]], 1, 1]]), 0, 0);
      if (o.apron) comp(p, clothLayer(W, H, o.apron, [[13, 20], [17, 20], [18.5 + s * 0.3, 32], [13 + s * 0.5, 33]], (x, y, u) => 0.8 + u * 1.8, [[[[15, 22], [15.5 + s * 0.5, 32]], 1, 1]]), CL[4]);
      art(p, 8, 36, ['ss.', 'SSs'], { s: R.leather[1], S: R.leather[3] }, 'sandal');
      art(p, 14, 36, ['.ss.', 'sSSs'], { s: R.leather[1], S: R.leather[3] }, 'sandal');
      dots(p, [[9, 36, SK[2]], [15, 36, SK[1]], [16, 36, SK[2]]], lg);
      // bodice + belt
      const up = new O.Pix(W, H);
      up.blit(clothLayer(W, H, CL, [[9, 13 + b], [18, 13 + b], [18, 15 + b], [17, 20 + b], [10, 20 + b], [9, 15 + b]], (x, y, u) => 0.8 + u * 2.3, [[[[12, 14 + b], [14, 18 + b]], 1, 1]]), 0, 0);
      sweep(up, [[9.5, 13.5 + b], [13.5, 15 + b], [17.5, 13.5 + b]], () => 1.4, () => SK[1]);
      const BL = o.belt;
      pline(up, [[10, 19 + b], [17, 19 + b]], (x, y) => up.set(x, y, x < 13 ? BL[0] : x < 16 ? BL[1] : BL[2]));
      comp(p, up, CL[4]);
      const hd = new O.Pix(W, H);
      art(hd, 6, 1 + b, o.head(blink, f), lg, 'woman-head');
      comp(p, hd, null);
      if (o.props) o.props(p, f, b, s, lg);
      return p;
    });
  }
  const FACE_ROWS_F = (blink) => blink ? ['32222DD2.', '432222222'] : ['32222WK2.', '432222K22'];
  function merchantFrames() {
    const SC = R.ochre;
    return womanFrames({
      skin: R.skinTan, hair: R.chestnut, dress: R.corn, apron: R.ivory, belt: [R.ivory[1], R.ivory[2], R.ivory[3]],
      lg: LG({ Z: '#b4482c' }, ['STUV', [SC[0], SC[1], SC[2], SC[3]]], ['X', [SC[4]]]),
      back: (p, f, b, s) => {
        // scarf tail hanging from the knot at the nape
        const t = new O.Pix(26, 40);
        lock(t, [[9, 9 + b], [6, 14 + b], [7 + s * 0.5, 18], [6 + s, 21]], SC, { w0: 4.4, w1: 2, pow: 1, th: [0.85, 0.4, 0, -0.4] });
        comp(p, t, null);
      },
      head: (blink) => {
        const e = FACE_ROWS_F(blink);
        return [
          '....VUUUV....',
          '..VUTSSTUV...',
          '.VUSSTSSTTUV.',
          'VUSTSSTTTTUUV',
          'UTSTTZZZZZZV.',
          'TSTTU32213D2.',
          'STTU' + e[0],
          'STTU' + e[1],
          'STXUV432r222.',
          'TUXVV4322mm2.',
          '.VVV..43322..',
          '......443....'
        ];
      },
      props: (p, f, b, s, lg) => {
        // clay jar of ambrosia resting on the hip, the near arm wrapped around it
        const CL = R.clay, j = new O.Pix(26, 40);
        ell(j, 18.5, 20.5 + b, 3.3, 3.8, (x, y, dx, dy) => { const v = -(dx * 0.7 + dy * 0.6) + Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) * 0.5; return CL[v > 0.9 ? 0 : v > 0.35 ? 1 : v > -0.25 ? 2 : 3]; });
        art(j, 17, 15 + b, ['stu', '.u.'], LG({}, ['stu', [CL[1], CL[2], CL[3]]]), 'neck');
        pline(j, [[15.5, 20 + b], [21.5, 20 + b]], (x, y) => { if (j.get(x, y)) j.set(x, y, '#f6d27a'); });
        j.set(17, 18 + b, '#fff0d8');
        comp(p, j, R.corn[4]);
        const ar = new O.Pix(26, 40), SK = R.skinTan;
        limb(ar, [[16, 14.5 + b], [15.5, 18.5 + b]], 2.6, 2.2, R.corn);
        limb(ar, [[15.5, 18.5 + b], [19, 23 + b]], 2.2, 2, SK);
        art(ar, 18, 22 + b, ['122', '.23'], lg, 'hand');
        comp(p, ar, R.corn[4]);
      }
    });
  }
  function villagerFrames() {
    return womanFrames({
      skin: R.skin, hair: R.darkHair, dress: R.pink, belt: ['#ffffff', '#e8dcea', '#b8a8c4'],
      lg: { p: '#ff86b0', q: '#c83a78', Y: '#ffd75a', l: '#5ca84a' },
      back: (p, f, b, s) => {
        const t = new O.Pix(26, 40), HR = R.darkHair;
        locks(t, [
          [[[9, 3 + b], [5, 3 + b], [4, 7 + b], [7, 9 + b]], { w0: 4.2, w1: 2.4 }],
          [[[8, 8 + b], [6, 11 + b], [7 + s * 0.5, 14]], { w0: 3, w1: 1.4 }]
        ], HR, { th: [0.86, 0.55, 0.15, -0.28] });
        comp(p, t, null);
      },
      head: (blink) => {
        const e = FACE_ROWS_F(blink);
        return [
          '....DCCCD....',
          '..DCBAABBCD..',
          '.DCBAABBAABC.',
          'DCBBACBBBBBBC',
          'CBpqpB2112BC.',
          'BpYYpC221DD2.',
          'ABqpl' + e[0].slice(1),
          'ABCl' + e[1],
          'ABCBC432r222.',
          'ABCBCD4322m2.',
          '.CDC...432...',
          '.......43....'
        ];
      },
      props: (p, f, b, s, lg) => {
        // wicker basket of red apples hanging from the bent forearm
        const WK = ['#f2cf8a', '#d4a05a', '#a8713c', '#6e4428'], q = new O.Pix(26, 40);
        fillPoly(q, [[15.5, 20 + b], [22, 20 + b], [21, 24.5 + b], [16.5, 24.5 + b]], (x, y) => ((x + y) & 1 ? WK[1] : WK[2]));
        pline(q, [[16, 20 + b], [21.5, 20 + b]], (x, y) => q.set(x, y, WK[0]));
        pline(q, [[17, 24 + b], [21, 24 + b]], (x, y) => q.set(x, y, WK[3]));
        art(q, 16, 18 + b, ['.rR.rR', 'rRRgRR'], { r: '#ff8a6a', R: '#e0403a', g: '#7cc05a' }, 'apples');
        pline(q, [[16.5, 19 + b], [18.5, 16 + b], [20.5, 16 + b], [21.5, 19 + b]], (x, y) => { if (!q.get(x, y)) q.set(x, y, WK[2]); });
        comp(p, q, R.pink[4]);
        const ar = new O.Pix(26, 40), SK = R.skin;
        limb(ar, [[16, 14.5 + b], [16, 18 + b]], 2.6, 2.2, SK);
        limb(ar, [[16, 18 + b], [19, 16.5 + b]], 2.2, 2, SK);
        art(ar, 18, 15 + b, ['12', '23'], lg, 'hand');
        comp(p, ar, R.pink[4]);
      }
    });
  }

  /* ---------- ELDER (stooped sage, staff, long beard) ---------- */
  function elderFrames() {
    const W = 28, H = 43, SK = R.skinOld, WH = R.white, WO = R.wool, WD = R.wood;
    const lg = LG({ W: '#ffffff', K: '#2a1f33', r: '#e89a88' }, ['1234', SK], ['ABCDE', WH]);
    return idleFrames((f, blink) => {
      const p = new O.Pix(W, H), b = BOB[f], s = LAG[f];
      // staff (static, planted on the ground) — drawn first, the hand grips it in front
      const st = new O.Pix(W, H);
      for (let y = 4; y <= 40; y++) { const x = 23 + (y < 12 ? 0 : y < 26 ? 0 : 0); st.set(x, y, WD[1]); st.set(x + 1, y, WD[3]); }
      ell(st, 23.5, 3, 2, 2, (x, y, dx, dy) => WD[dx + dy < -0.4 ? 0 : dx + dy < 0.5 ? 1 : 3]);
      dots(st, [[23, 14, WD[3]], [24, 27, WD[4]], [22, 2, WD[3]]], lg);
      // pale chiton showing at the front hem
      p.blit(clothLayer(W, H, R.ivory, [[14, 28], [20, 28], [21.5 + s * 0.4, 39], [13, 39]], (x, y, u) => 1 + u * 1.8), 0, 0);
      // wool himation: hunched back, draped diagonally from the near shoulder, lifted hem fold
      p.blit(clothLayer(W, H, WO, [[8, 15 + b], [13, 13 + b], [18, 14 + b], [20, 19 + b], [19, 27], [17 + s * 0.4, 36], [16 + s, 39], [6 + s, 39], [6, 29], [5, 21]],
        (x, y, u) => 0.6 + u * 2.2 + (y > 37 ? 1 : 0),
        [[[[17, 16 + b], [12, 23], [8, 30]], 1.4, 1], [[[18, 22], [13, 30], [11 + s, 38]], 1.3, 1], [[[9, 32], [8 + s, 38]], 1.1, 1]],
        (c) => { for (let x = 6; x < 17; x++) c.set(x + s, 37, 3); }), 0, 0);
      art(p, 9, 39, ['.ss', 'SSs'], { s: R.leather[1], S: R.leather[3] }, 'sandal');
      art(p, 15, 39, ['.ss.', 'sSSs'], { s: R.leather[1], S: R.leather[3] }, 'sandal');
      comp(p, st, WO[4]);
      // head thrust forward (stoop): bald dome, white hair at the back, kind eye under bushy brow
      const hd = new O.Pix(W, H);
      art(hd, 9, 3 + b, [
        '....32223....',
        '..322211122..',
        '.32221111222.',
        'AB32221112223',
        'BAB3222222223',
        'ABBC322AAAB2.',
        'BCB4322' + (blink ? '2BB' : '2WK') + '22.',
        'BCB432222' + (blink ? '2' : 'K') + '222',
        'CBC4432r22222',
        'CC.44322AAAA.',
        '..444.4AABAA.',
        '......4ABBA..'
      ], lg, 'elder-head');
      comp(p, hd, null);
      // near arm: wool sleeve, gnarled hand gripping the staff at chest height
      const ar = new O.Pix(W, H);
      limb(ar, [[14.5, 15.5 + b], [16.5, 20 + b]], 3, 2.6, WO);
      limb(ar, [[16.5, 20 + b], [21.5, 19 + b]], 2.4, 2.2, WO);
      art(ar, 21, 17 + b, ['.1', '12', '23', '.3'], lg, 'hand');
      comp(p, ar, WO[4]);
      // long beard over the chest; the tip sways one frame behind
      const bd = new O.Pix(W, H);
      art(bd, 15, 14 + b, ['ABAABA', 'ABBABB', 'ABCBBC', '.BCBBC', '.BCBC.'], lg, 'beard');
      art(bd, 15 + s, 19 + b, ['.BCBC', '..CBD', '..CD.'], lg, 'beard-tip');
      comp(p, bd, WH[3]);
      return p;
    });
  }

  /* ---------- ZEUS (46 px, on a cloud, thunderbolt raised in a hero pose) ---------- */
  function cloudPuffs(p, cx, cy, f) {
    const C = R.cloud;
    [[-7, 1, 4.2, 2.4], [-2.5, -0.5, 4.8, 3], [3, 0, 4.6, 2.8], [7.5, 1.2, 3.8, 2.2], [-4, 2.4, 5, 2], [3, 2.6, 5.4, 2]].forEach(([dx, dy, rx, ry], k) => {
      const x = cx + dx + ((f + k) % 2 ? 0.4 : -0.4), y = cy + dy;
      ell(p, x, y, rx, ry, (xx, yy, ex, ey) => { const v = -(ex * 0.5 + ey * 0.9); return C[v > 0.5 ? 0 : v > -0.1 ? 1 : v > -0.6 ? 2 : 3]; });
    });
  }
  function zeusFrames() {
    const W = 42, H = 62, SK = ['#f8dcb4', '#e8b688', '#c8845c', '#8e5248', '#56303e'], WH = ['#ffffff', '#d6d0ea', '#a498c8', '#6e62a0', '#443a74'], G = R.gold;
    const RB = ['#fffaf0', '#f0e4d0', '#cdbccc', '#8a78b0', '#5a4a86'];   // chiton: shadows pushed to violet
    const lg = LG({ W: '#ffffff', K: '#16223f', y: G[0], Y: G[1], G: G[2], g: G[3], m: '#8a3a44' }, ['1234', SK], ['ABCDE', WH]);
    return idleFrames((f, blink) => {
      const p = new O.Pix(W, H), b = BOB[f], s = LAG[f];
      cloudPuffs(p, 20, 53, f);
      // hair falling behind the shoulders
      const hb = new O.Pix(W, H);
      locks(hb, [
        [[[15, 8 + b], [11, 13 + b], [12, 19 + b], [11 + s * 0.5, 23 + b]], { w0: 5, w1: 2.4, pow: 1 }],
        [[[17, 9 + b], [15, 15 + b], [16, 20 + b], [15 + s * 0.5, 23 + b]], { w0: 4, w1: 2, pow: 1 }]
      ], WH, { th: [0.8, 0.45, 0.05, -0.35] });
      comp(p, hb, null);
      // far arm hanging at the side, hand at the hip
      const fa = new O.Pix(W, H);
      limb(fa, [[12, 19 + b], [10.5, 26 + b], [12, 31 + b]], 3, 2.4, SK, { dark: 1 });
      comp(p, fa, null);
      // chiton: broad shoulders, tapering waist, flared hem (triangle silhouette), hem sways
      p.blit(clothLayer(W, H, RB, [[10, 17 + b], [28, 17 + b], [27, 24 + b], [25, 31], [29 + s * 0.5, 42], [32 + s, 50], [8 + s, 50], [12 + s * 0.5, 42], [14, 31], [11, 24 + b]],
        (x, y, u) => 0.7 + u * 2.6 + (y > 48 ? 1 : 0),
        [[[[17, 32], [14, 41], [12 + s, 49]], 1.4, 1], [[[21, 32], [21.5, 41], [22 + s, 49]], 1.2, 1], [[[24, 32], [27, 41], [29 + s, 49]], 1.4, 1]]), 0, 0);
      pline(p, [[8 + s, 49], [32 + s, 49]], (x, y) => { if (p.get(x, y)) { p.set(x, y, G[1]); p.set(x, y + 1, G[3]); } });
      // sandalled feet on the cloud
      art(p, 13, 50, ['.ss.', 'sSSs'], { s: G[2], S: G[3] }, 'foot');
      art(p, 22, 50, ['.ss..', 'sSSss'], { s: G[2], S: G[3] }, 'foot');
      dots(p, [[14, 50, SK[2]], [23, 50, SK[1]], [24, 50, SK[2]]], lg);
      // royal-blue himation: over the far shoulder, diagonally across the chest to the near hip
      const hm = clothLayer(W, H, R.royal, [[9, 18 + b], [15, 16 + b], [19, 17 + b], [28, 30 + b], [27, 35], [21, 34], [15, 45], [9 + s * 0.5, 46], [10, 30]],
        (x, y, u) => 0.6 + u * 2.2, [[[[14, 22 + b], [12, 34], [11 + s * 0.5, 44]], 1.3, 1], [[[20, 24 + b], [17, 33]], 1.2, 1]]);
      pline(hm, [[19, 17 + b], [28, 30 + b]], (x, y) => { if (hm.get(x, y)) hm.set(x, y, G[1]); if (hm.get(x - 1, y + 1)) hm.set(x - 1, y + 1, G[3]); });
      comp(p, hm, RB[4]);
      // gold belt
      pline(p, [[14, 31], [25, 31]], (x, y) => { if (p.get(x, y) && !hm.get(x, y)) { p.set(x, y, G[1]); p.set(x, y + 1, G[3]); } });
      // head: white curls, gold laurel on the brow, stern brows, glowing eyes
      const hd = new O.Pix(W, H);
      art(hd, 14, 4 + b, [
        '...ABAABA....',
        '.ABAABBAAB...',
        'ABBAyYGyYGyg.',
        'BACBB3221122.',
        'ACBC322AAAB2.',
        'BCB4322' + (blink ? '2BB' : '2WK') + '22.',
        'BCB432222' + (blink ? '2' : 'K') + '222',
        'CBC4432AAAAA.',
        'CBC44AABABBA.',
        'BCC.ABBABBAB.',
        '.C..ABCBBCBA.',
        '....ABCBBCB..'
      ], lg, 'zeus-head');
      comp(p, hd, null);
      // beard tip over the chest (sways)
      const bd = new O.Pix(W, H);
      art(bd, 18 + s, 16 + b, ['ABCBBCB', '.BCBBC.', '.BCBC..', '..CC...'], lg, 'zeus-beard');
      comp(p, bd, WH[3]);
      // near arm raised high, elbow break, fist around the bolt
      const ar = new O.Pix(W, H);
      limb(ar, [[25.5, 19 + b], [31, 17 + b]], 3.4, 3, SK);
      limb(ar, [[31, 17 + b], [34, 11.5 + b]], 3, 2.6, SK);
      dots(ar, [[31, 18 + b, SK[3]], [32, 18 + b, SK[3]]], lg);
      pline(ar, [[31.5, 14 + b], [34.5, 15 + b]], (x, y) => { if (ar.get(x, y)) ar.set(x, y, G[1]); });
      comp(p, ar, SK[3]);
      // thunderbolt: bold 3-px zig-zag (white core, gold mid, orange edge); only sparks + halo animate
      const bl = new O.Pix(W, H), BP = [[39, 0 + b], [35, 4 + b], [38.5, 6 + b], [34, 11 + b], [36, 15 + b]];
      boltShape(bl, BP, 2, ['#ffffff', R.bolt[2], R.bolt[3]]);
      if (f % 2 === 0) { const q = new O.Pix(W, H); for (let i = 0; i < bl.d.length; i++) if (bl.d[i]) q.d[i] = 1; outline(q, 'x'); for (let i = 0; i < q.d.length; i++) if (q.d[i] === 'x' && !p.d[i]) p.d[i] = '#8ff0ff'; }
      comp(p, bl, R.bolt[4]);
      ell(p, 34.5, 10.5 + b, 1.8, 1.6, (x, y) => (x + y < 44 + b ? SK[1] : SK[2]));
      const SP = [[[41, 3], [32, 7]], [[33, 2], [40, 11]], [[40, 8], [32, 4]], [[36, 0], [38, 14]]][f];
      SP.forEach(([x, y]) => { p.set(x, y + b, '#ffffff'); p.set(x + 1, y + b, R.bolt[2]); });
      rim(p, '#fff2b0', 0.25, 0, 50, { '#ffffff': 1, [R.bolt[2]]: 1 });
      return p;
    });
  }

  /* ---------- HERMES (hovering, fluttering wings, caduceus) ---------- */
  function hermesFrames() {
    const W = 38, H = 52, SK = R.skin, G = R.gold, F = R.feather;
    const lg = LG({ W: '#ffffff', K: '#2a1a14', y: G[0], Y: G[1], G: G[2], g: G[3], m: '#7e3440' }, ['1234', SK], ['ABCDE', R.chestnut]);
    const FL = [0, 1, 2, 1];     // wing flutter phase
    return idleFrames((f, blink) => {
      const p = new O.Pix(W, H), b = BOB[f], s = LAG[f], fl = FL[f];
      // chlamys streaming back, two fold bands, the tip flutters one frame behind
      p.blit(clothLayer(W, H, R.ochre, [[13, 16 + b], [18, 16 + b], [16, 22 + b], [11, 30 + b], [5 - s, 33 + s], [3 - s, 30], [8, 22 + b]], (x, y, u) => 0.8 + u * 2.2,
        [[[[13, 19 + b], [8, 26 + b], [5 - s, 31]], 1.3, 1], [[[15, 20 + b], [11, 28 + b]], 1.1, 1]]), 0, 0);
      // far leg hanging straight and slightly back, toes pointing down
      const lf = new O.Pix(W, H);
      limb(lf, [[15, 30 + b], [13.5, 37 + b]], 3, 2.6, SK, { dark: 1 });
      limb(lf, [[13.5, 37 + b], [12.5, 43 + b]], 2.6, 2, SK, { dark: 1 });
      art(lf, 11, 42 + b, ['sS', 'ss', '.s'], { s: G[2], S: G[3] }, 'sole');
      comp(p, lf, null);
      // near leg: knee raised forward and bent, shin angled back, toes down
      const ln = new O.Pix(W, H);
      limb(ln, [[18, 28 + b], [24, 32 + b]], 3.6, 3.2, SK);
      limb(ln, [[24, 32 + b], [22, 39 + b]], 3, 2.4, SK);
      art(ln, 21, 38 + b, ['sS', 'ss', '.s'], { s: G[1], S: G[3] }, 'sole');
      comp(p, ln, SK[3]);
      // sandal wings at the ankles (flutter)
      const wg = new O.Pix(W, H);
      [[12, 41 + b], [22, 37 + b]].forEach(([x, y], k) => {
        feather(wg, x - 0.5, y, x - 4, y - 2.5 - fl * 0.7, 1.9, F);
        feather(wg, x - 0.5, y + 1, x - 4.2, y - 0.2 - fl * 0.4, 1.7, F);
      });
      comp(p, wg, OUT);
      // short light-blue chiton with a leather belt
      p.blit(clothLayer(W, H, R.sky, [[12, 16 + b], [21, 16 + b], [22, 23 + b], [23 + s * 0.5, 30 + b], [11 + s * 0.5, 30 + b], [12, 23 + b]], (x, y, u) => 0.6 + u * 2.4,
        [[[[15, 25 + b], [14 + s * 0.5, 29 + b]], 1.1, 1], [[[19, 25 + b], [20 + s * 0.5, 29 + b]], 1.1, 1]]), 0, 0);
      pline(p, [[12, 24 + b], [22, 24 + b]], (x, y) => { p.set(x, y, R.leather[1]); p.set(x, y + 1, R.leather[3]); });
      // caduceus (behind the hand)
      caduceus(p, 29, 7 + b, 42 + b, false, 13);
      // head: winged petasos, dark curls, youthful grin
      const hd = new O.Pix(W, H);
      art(hd, 12, 3 + b, [
        '...gGGGGg....',
        '..gYYyYYGg...',
        '.gYyyYYYYGg..',
        'gGGGGGGGGGGGg',
        'DBCBB3221122.',
        'BCBC32222DD2.',
        'CBC43222' + (blink ? '2DD' : '2WK') + '2.',
        'BCD432222' + (blink ? '2' : 'K') + '222',
        'CDC4432222222',
        '.DC.4322mWm2.',
        '.....4332....',
        '......43.....'
      ], lg, 'hermes-head');
      comp(p, hd, null);
      // helmet wings (flutter)
      const hw = new O.Pix(W, H);
      [[-2.3, 7.5], [-2.0, 6.5], [-2.65, 6.5]].forEach(([a, L]) => { const aa = a - fl * 0.12; feather(hw, 14, 5 + b, 14 + Math.cos(aa) * L, 5 + b + Math.sin(aa) * L, 2.4, F); });
      comp(p, hw, OUT);
      // near arm forward, hand around the caduceus
      const ar = new O.Pix(W, H);
      limb(ar, [[20, 17 + b], [23, 22 + b]], 3, 2.6, SK);
      limb(ar, [[23, 22 + b], [28, 20 + b]], 2.6, 2.2, SK);
      art(ar, 28, 18 + b, ['12', '22', '23'], lg, 'fist');
      comp(p, ar, SK[3]);
      rim(p, '#e6f4ff', 0.3, 0, H, { '#ffffff': 1 });
      return p;
    });
  }

  /* ---------- HADES (44 px, ghost-flame iron crown, glowing eyes, bident) ---------- */
  function rimLeft(p, col, amt, y0, y1) {
    const hits = [];
    for (let y = y0; y < y1; y++) for (let x = 1; x < p.w; x++) { const c = p.get(x, y); if (c && !p.get(x - 1, y)) hits.push(x, y, O.mix(c, col, amt)); }
    for (let i = 0; i < hits.length; i += 3) p.set(hits[i], hits[i + 1], hits[i + 2]);
  }
  function hadesFrames() {
    const W = 36, H = 60, SK = R.skinHades, HR = R.hadesHair, IR = R.iron, VI = R.violet;
    const lg = LG({ n: '#8ff0ff', N: '#ffffff', g: '#a8d8f0', m: '#3a2448', i: IR[1], I: IR[2], Q: IR[3] }, ['1234', SK], ['ABCDE', HR]);
    const FH = [[5, 8, 4, 7], [7, 5, 7, 5], [4, 7, 5, 8], [6, 6, 8, 4]];
    const FL = [[0.8, 1.4, 1, 1.6], [1.4, 0.8, 1.6, 1], [1, 1.6, 0.8, 1.4], [1.6, 1, 1.4, 0.8]];
    const Y = 6;
    return idleFrames((f, blink) => {
      const p = new O.Pix(W, H), b = BOB[f] + Y, s = LAG[f];
      // ghost flames rising from the crown (behind the crown band), flicker by swapping heights/leans
      const fl = new O.Pix(W, H);
      [13, 16, 19, 22].forEach((x, k) => ghostFlame(fl, x, 3 + b, FH[f][k], 3.2, FL[f][k] * 0.8, k + f));
      [[15, 0 + b - 8 + (f % 2)], [21, b - 9 + ((f + 1) % 2)]].forEach(([x, y]) => { if (y >= 0 && !fl.get(x, y)) fl.set(x, y, R.flame[3]); });
      p.blit(fl, 0, 0);
      // long black hair behind, cool violet highlights, tips sway
      const hb = new O.Pix(W, H);
      locks(hb, [
        [[[13, 5 + b], [10, 11 + b], [11, 19 + b], [9 + s, 27 + b]], { w0: 5, w1: 2.6, pow: 1 }],
        [[[15, 6 + b], [13, 13 + b], [14, 20 + b], [13 + s, 26 + b]], { w0: 4, w1: 2, pow: 1 }]
      ], HR, { th: [0.9, 0.62, 0.25, -0.2] }, HR[4]);
      comp(p, hb, null);
      // bident (static, planted)
      const bd = new O.Pix(W, H);
      for (let y = 5 + Y; y <= 55; y++) { bd.set(28, y, IR[1]); bd.set(29, y, IR[3]); }
      art(bd, 25, Y, ['i....i', 'i....i', 'Ii..iI', '.IiiI.', '..QQ..'], lg, 'bident');
      // robe: broad dark-violet robe, brightened lit tone, flaring hem that sways
      p.blit(clothLayer(W, H, VI, [[11, 14 + b], [24, 14 + b], [25, 24 + b], [24, 34], [27 + s * 0.5, 46], [29 + s, 55], [6 + s, 55], [8 + s * 0.5, 46], [10, 34], [10, 24 + b]],
        (x, y, u) => 0.6 + u * 2.4 + (y > 53 ? 1 : 0),
        [[[[14, 27 + b], [12, 38], [10 + s, 53]], 1.3, 1], [[[18, 27 + b], [18.5, 40], [19 + s, 53]], 1.2, 1], [[[22, 28 + b], [24, 40], [26 + s, 53]], 1.3, 1]]), 0, 0);
      pline(p, [[21, 15 + b], [22, 26 + b], [24, 38], [27 + s, 54]], (x, y) => { if (p.get(x, y)) p.set(x, y, R.silver[3]); });
      pline(p, [[10, 25 + b], [24, 25 + b]], (x, y) => { p.set(x, y, IR[2]); p.set(x, y + 1, IR[3]); });
      dots(p, [[16, 25 + b, '#8ff0ff'], [16, 24 + b, IR[1]], [15, 25 + b, IR[1]], [17, 25 + b, IR[1]]], lg);
      comp(p, bd, VI[4]);
      // iron pauldron + high collar
      const pa = new O.Pix(W, H);
      ell(pa, 13, 15.5 + b, 3.6, 2.6, (x, y, dx, dy) => IR[dx + dy < -0.5 ? 1 : dx + dy < 0.4 ? 2 : 3]);
      art(pa, 19, 12 + b, ['.ii', 'iIQ', 'IQ.'], lg, 'collar');
      comp(p, pa, OUT);
      // head: iron crown, black hair framing a gaunt pale face, glowing eyes (2 px) with glow bleed, goatee
      const hd = new O.Pix(W, H);
      art(hd, 11, 0 + b, [
        '..i.i.i.i.i..',
        '.iIiIiIiIiIQ.',
        'DQQQQQQQQQQD.',
        'DCBCD3222212.',
        'CBCD43222EE2.',
        'BCD4322' + (blink ? 'EE' : 'nn') + '222.',
        'BCD43222' + (blink ? '2' : 'g') + '2222',
        'BCD443222m22.',
        'BCDC.4322EE2.',
        'CDC..443EE...',
        'DCD...4.E....',
        'CD...........'
      ], lg, 'hades-head');
      comp(p, hd, null);
      // near arm in a dark sleeve, pale hand on the bident
      const ar = new O.Pix(W, H);
      limb(ar, [[22, 16 + b], [24, 23 + b]], 3.4, 3, VI);
      limb(ar, [[24, 23 + b], [27.5, 21 + b]], 3, 2.6, VI);
      art(ar, 27, 19 + b, ['12', '22', '23'], lg, 'hand');
      comp(p, ar, VI[4]);
      rimLeft(p, '#6ad8ff', 0.45, 10 + b, 55);
      rim(p, '#8a74d0', 0.25, 12, 55, { [IR[1]]: 1, [IR[3]]: 1 });
      if (!blink) { p.set(19, 5 + b, '#8ff0ff'); }
      return p;
    }, '#0c0a16');
  }
  /* ---------- divine aura behind the gods (engine hook) ---------- */
  const auraCache = {};
  function auraCanvas(kind, k) {
    const key = kind + k;
    if (auraCache[key]) return auraCache[key];
    const W = 76, H = 88, c = O.makeCanvas(W, H), g = c.getContext('2d');
    const col = kind === 'zeus' ? [255, 206, 96] : [150, 222, 255];
    const rx = 27 + k * 2, ry = 36 + k * 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x + 0.5 - W / 2) / rx, (y + 0.5 - H / 2) / ry);
      if (d >= 1) continue;
      const lvl = Math.floor(Math.pow(1 - d, 1.4) * 3.2 + O.bayer(x, y) * 0.95);
      if (lvl <= 0) continue;
      g.fillStyle = 'rgba(' + col.join(',') + ',' + (lvl * (kind === 'zeus' ? 0.035 : 0.06)).toFixed(3) + ')';
      g.fillRect(x, y, 1, 1);
    }
    return (auraCache[key] = c);
  }
  O.drawNPCAura = function (ctx, game, npc, bob) {
    const cx = Math.round(npc.x + npc.w / 2 - game.cam), feet = Math.round(npc.y + npc.h + (bob || 0)) + O.VIEW_Y;
    const cy = feet - 24, t = npc.t || 0, zeus = npc.kind === 'zeus';
    const a = auraCanvas(zeus ? 'zeus' : 'hermes', (t >> 5) & 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(a, cx - (a.width >> 1), cy - (a.height >> 1));
    ctx.restore();
    // orbiting motes of light (gold for Zeus, sky-white for Hermes)
    const c1 = zeus ? '#fff6c8' : '#ffffff', c2 = zeus ? '#ffc23a' : '#8fd8ff';
    for (let i = 0; i < 6; i++) {
      const ang = t * (zeus ? 0.025 : 0.04) + i * Math.PI / 3;
      const px = Math.round(cx + Math.cos(ang) * 19), py = Math.round(cy + Math.sin(ang) * 9 + Math.sin(t * 0.05 + i) * 12);
      const tw = (t + i * 11) % 36;
      if (tw > 26) continue;
      ctx.fillStyle = c2;
      if (tw < 12) { ctx.fillRect(px - 1, py, 3, 1); ctx.fillRect(px, py - 1, 1, 3); }
      ctx.fillStyle = c1;
      ctx.fillRect(px, py, 1, 1);
    }
  };


  /* ================================================================ */
  O.ART_INITS.push(function () {
    const reg = (name, pix, ax, ay) => O.registerSprite(name, pix, { ax, ay });
    const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[npcs.js ' + name + ']', e); } };
    safe('eurydice', () => {
      eurydiceFrames(false).forEach((p, f) => reg(f < 4 ? 'eurydice_idle_' + f : 'eurydice_blink', p, 13, 38));
      eurydiceFrames(true).forEach((p, f) => reg(f < 4 ? 'eurydice_ghost_' + f : 'eurydice_ghost_blink', p, 13, 38));
    });
    safe('merchant', () => merchantFrames().forEach((p, f) => reg(f < 4 ? 'merchant_idle_' + f : 'merchant_blink', p, 13, 38)));
    safe('villager', () => villagerFrames().forEach((p, f) => reg(f < 4 ? 'villager_idle_' + f : 'villager_blink', p, 13, 38)));
    safe('elder', () => elderFrames().forEach((p, f) => reg(f < 4 ? 'elder_idle_' + f : 'elder_blink', p, 13, 41)));
    safe('zeus', () => zeusFrames().forEach((p, f) => reg(f < 4 ? 'zeus_idle_' + f : 'zeus_blink', p, 20, 51)));
    safe('hermes', () => hermesFrames().forEach((p, f) => reg(f < 4 ? 'hermes_idle_' + f : 'hermes_blink', p, 17, 42)));
    safe('hades', () => hadesFrames().forEach((p, f) => reg(f < 4 ? 'hades_idle_' + f : 'hades_blink', p, 18, 56)));
    safe('portraits', () => {
      reg('portrait_orpheus', portraitOrpheus(), 24, 47);
      reg('portrait_eurydice', eurydicePortrait(false), 24, 47);
      reg('portrait_zeus', portraitZeus(), 24, 47);
      reg('portrait_hermes', portraitHermes(), 24, 47);
      reg('portrait_hades', portraitHades(), 24, 47);
      reg('portrait_elder', portraitElder(), 24, 47);
      reg('portrait_merchant', portraitMerchant(), 24, 47);
      reg('portrait_villager', portraitVillager(), 24, 47);
    });
  });
})(window.OLY);
