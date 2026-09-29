/* art/world.js — modern pixel-art world: autotiled terrain painted in world space (continuous textures,
   neighbour-aware edges, rounded corners, depth shading), architecture (stucco houses, terracotta roofs,
   marble temples with gold), decorations, the statue sprite and animated light props.
   Owner: world artist. Plain browser JS on window.OLY. */
(function (O) {
  'use strict';
  const T = 16;
  const OUT = '#1b1426';

  /* =====================================================================================
     Small utilities
     ===================================================================================== */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function hh(x, y, s) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 1442695041)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const a = hh(xi, yi, s), b = hh(xi + 1, yi, s), c = hh(xi, yi + 1, s), d = hh(xi + 1, yi + 1, s);
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  const bay = (x, y) => O.bayer(x, y);
  const rngOf = (s) => O.rng((Math.floor(hh(s, 77, 5) * 4294967296) >>> 0) || 1);
  // Memoised hue-shifting shade (negative = darker/cooler, positive = lighter/warmer).
  const SHC = {};
  function sh(c, a) { const k = c + a; let v = SHC[k]; if (!v) v = SHC[k] = O.shift(c, a); return v; }
  const MXC = {};
  function mx(a, b, t) { const k = a + b + t; let v = MXC[k]; if (!v) v = MXC[k] = O.mix(a, b, t); return v; }

  // Packed-colour pixel buffer (much faster than string grids for whole-level painting).
  const PK = Object.create(null);
  function pk(c) {
    let v = PK[c];
    if (v === undefined) { const n = parseInt(c.slice(1), 16); v = PK[c] = ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | ((n >> 16) & 255)) >>> 0; }
    return v;
  }
  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
    set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c ? pk(c) : 0; }
    has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.d[y * this.w + x] !== 0; }
    rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); }
    pix(p, ox, oy) { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.d[y * p.w + x]; if (c) this.set(ox + x, oy + y, c); } }
    canvas() {
      const cv = O.makeCanvas(this.w, this.h), g = cv.getContext('2d');
      const img = g.createImageData(this.w, this.h);
      new Uint32Array(img.data.buffer).set(this.d);
      g.putImageData(img, 0, 0);
      return cv;
    }
  }

  /* =====================================================================================
     Palettes (index 0 = brightest; hue-shifted: warm highlights, violet shadows)
     ===================================================================================== */
  const MARBLE = ['#ffffff', '#f3eff7', '#ddd5e8', '#bfb3d2', '#9a8cb2', '#6c6089'];
  const GOLD = ['#fff6b8', '#fbd35a', '#dc9a2c', '#9f6024', '#5e3420'];
  const STUCCO = ['#efe7da', '#e6ddd2', '#dcd3cc', '#cfc8d6', '#aea6bd', '#817997'];
  const BLUE = ['#a4dcff', '#56aaf0', '#3278cf', '#24539f', '#1b366b', '#141f42'];
  const TERRA = ['#ffc8a0', '#f49058', '#d8683f', '#aa4a35', '#77322f', '#4a1f28'];
  const POMP = ['#d8625a', '#b04444', '#8a3340', '#632434'];
  const PAL = {
    village: {
      grass: ['#f2f7a4', '#bde366', '#80c64f', '#529d47', '#347248', '#224b3f'],
      dirt: ['#f0b886', '#d08e5a', '#ac6b45', '#844c3a', '#5b3435', '#3c2330'],
      peb: ['#ecd2b4', '#c4a68c', '#967a70', '#6a5260'],
      out: '#2c1b2b', rad: 4,
      flowers: ['#ffffff', '#ffe066', '#ff7aa8', '#a58bff', '#ff5a3c']
    },
    forest: {
      grass: ['#d4f08c', '#8fd06c', '#58a864', '#3b7f5f', '#285b54', '#1a3b42'],
      dirt: ['#b78a73', '#916858', '#6e4c4f', '#503748', '#372739', '#23192b'],
      peb: ['#b8a2a0', '#8c767c', '#665463', '#46364a'],
      stone: ['#e0e4d9', '#b6bdb6', '#8c949d', '#666d80', '#494e64', '#2e3147'],
      moss: ['#d5f290', '#98cf60', '#62a254', '#3e734b', '#284f40'],
      out: '#1c1426', rad: 4,
      flowers: ['#e8f4ff', '#9fe3ff', '#c7a4ff', '#ffe28a', '#ff9ec4']
    },
    cave: {
      rock: ['#e0c2a4', '#b39a86', '#9d847b', '#8a7070', '#735d67', '#5e4a58', '#3a2c40'],
      back: ['#4a4052', '#3b3345', '#302a3a', '#262130', '#1d1925', '#15111b'],
      out: '#1c1119', rad: 6
    },
    temple: { out: '#1b1426', rad: 3 }
  };
  // Engine-facing theme colours (O.Tiles.theme(name).dirt must stay a 3-colour array).
  const DIRT3 = {
    village: ['#d08e5a', '#ac6b45', '#844c3a'], forest: ['#916858', '#6e4c4f', '#503748'],
    cave: ['#9d847b', '#8a7070', '#5e4a58'], temple: ['#ddd5e8', '#bfb3d2', '#9a8cb2']
  };

  /* =====================================================================================
     World builder: paints a whole level (or a mini scene) at once so that textures flow
     across tile borders; getCtx() then hands out 16x16 slices.
     ===================================================================================== */
  const SOLID = { G: 1, D: 1, B: 1 };
  const WALLISH = { m: 1, C: 1, c: 1, b: 1, n: 1 };
  const HOUSE = { H: 1, w: 1, d: 1 };

  function makeWorld(theme, tw, th, tileAt, def) {
    const w = tw * T, h = th * T, N = w * h;
    const W = { theme, tw, th, w, h, P: PAL[theme] || PAL.village };
    // arched niches behind statues standing against temple walls
    W.niches = ((def && def.statues) || []).map((st) => ({ cx: st.tx * T + 8, y1: st.row * T - (st.lift || 0), y0: st.row * T - (st.lift || 0) - 50, hw: 13 }));
    W.tl = (x, y) => tileAt(x < 0 ? 0 : x >= tw ? tw - 1 : x, y < 0 ? 0 : y >= th ? th - 1 : y);
    W.tp = (x, y) => W.tl(Math.floor(x / T), Math.floor(y / T));
    W.solidT = (x, y) => SOLID[W.tl(x, y)] === 1;
    W.stoneStyle = theme === 'forest' ? 'ruin' : theme === 'cave' ? 'rock' : theme === 'temple' ? 'floor' : 'stylo';

    /* ---- solid mask with rounded / stepped corners ---- */
    const mask = new Uint8Array(N);
    W.mask = mask;
    const open = (x, y) => !W.solidT(x, y);
    for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
      const ch = tileAt(tx, ty);
      if (!SOLID[ch]) continue;
      for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) mask[(ty * T + py) * w + tx * T + px] = 1;
      let rad = W.P.rad;
      if (ch === 'B' && W.stoneStyle !== 'rock') rad = 2;
      const cut = (cx, cy, fx, fy) => {
        for (let py = 0; py < rad; py++) for (let px = 0; px < rad; px++) {
          const dx = rad - px - 0.5, dy = rad - py - 0.5;
          if (dx * dx + dy * dy > rad * rad) mask[(ty * T + (fy ? 15 - py : py)) * w + tx * T + (fx ? 15 - px : px)] = 0;
        }
        void cx; void cy;
      };
      const oL = open(tx - 1, ty), oR = open(tx + 1, ty), oU = open(tx, ty - 1), oD = open(tx, ty + 1);
      if (oL && oU && open(tx - 1, ty - 1)) cut(0, 0, false, false);
      if (oR && oU && open(tx + 1, ty - 1)) cut(0, 0, true, false);
      if (oL && oD && open(tx - 1, ty + 1)) cut(0, 0, false, true);
      if (oR && oD && open(tx + 1, ty + 1)) cut(0, 0, true, true);
      // Marble stylobate: the upper course is stepped back at the ends (reads as steps).
      if (ch === 'B' && W.stoneStyle === 'stylo' && oU) {
        if (oL) for (let py = 0; py < 8; py++) for (let px = 0; px < 4; px++) mask[(ty * T + py) * w + tx * T + px] = 0;
        if (oR) for (let py = 0; py < 8; py++) for (let px = 12; px < 16; px++) mask[(ty * T + py) * w + tx * T + px] = 0;
      }
      // Earth cliffs: the exposed side faces are eroded by 0-2 px in runs of 3-5 rows (no ruler-straight cuts).
      if ((ch === 'G' || ch === 'D') && (oL || oR)) {
        for (let py = 0; py < T; py++) {
          const Y = ty * T + py;
          if (oU && py < 7) continue; // keep the grass lip / rounded corner intact
          [[oL, 0], [oR, 1]].forEach(([o, side]) => {
            if (!o) return;
            const seg = Math.floor((Y + vnoise(Y * 0.19, tx * 3 + side, 5) * 6) / 4);
            const v = hh(seg, tx * 2 + side, 17);
            const j = v < 0.38 ? 0 : v < 0.8 ? 1 : 2;
            for (let k = 0; k < j; k++) mask[Y * w + tx * T + (side ? 15 - k : k)] = 0;
          });
        }
      }
    }

    // Organic cave rock: bumpy floors, ragged ceilings and walls (visual only, collision is per tile).
    if (W.stoneStyle === 'rock') {
      for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
        if (tileAt(tx, ty) !== 'B') continue;
        const X0 = tx * T, Y0 = ty * T;
        for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
          const x = X0 + px, y = Y0 + py;
          let cut = false;
          if (open(tx, ty - 1) && py < Math.floor(vnoise(x * 0.16, ty, 3) * 2.4 + vnoise(x * 0.5, ty, 2) * 0.59)) cut = true;
          if (open(tx, ty + 1) && 15 - py < Math.floor(vnoise(x * 0.18, ty, 4) * 5)) cut = true;
          if (open(tx - 1, ty) && px < Math.floor(vnoise(y * 0.2, tx, 5) * 4)) cut = true;
          if (open(tx + 1, ty) && 15 - px < Math.floor(vnoise(y * 0.2, tx, 6) * 4)) cut = true;
          if (cut) mask[y * w + x] = 0;
        }
      }
    }
    // Cave: irregular rock bulges hang from the ceiling and jut out of the side walls into the back-wall
    // area, so the arena is not a framed rectangle (visual only; collision stays per tile).
    if (W.stoneStyle === 'rock') {
      const bumps = (len, seed, maxD) => {
        const out = [];
        for (let s0 = 0; s0 < len; s0 += 44) {
          if (hh(s0, 1, seed) < 0.3) continue;
          out.push({ c: s0 + 6 + hh(s0, 2, seed) * 32, hw: 7 + hh(s0, 3, seed) * 15, d: 4 + hh(s0, 4, seed) * (maxD - 4) });
        }
        return (t) => {
          let v = 0;
          for (const b of out) { const q = (t + 0.5 - b.c) / b.hw; if (q > -1 && q < 1) v = Math.max(v, b.d * Math.pow(1 - q * q, 0.6)); }
          return v > 0 ? v + (vnoise(t * 0.3, 0.5, seed) - 0.5) * 2.2 : 0;
        };
      };
      const ceil = bumps(w, 171, 13), wallL = bumps(h, 173, 12), wallR = bumps(h, 175, 12);
      for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
        if (tileAt(tx, ty) !== 'k') continue;
        for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
          const x = tx * T + px, y = ty * T + py;
          let on = false;
          // hanging from the ceiling: find the rock above
          for (let s = 1; s <= 14 && !on; s++) if (mask[(y - s) * w + x] && W.solidT(tx, Math.floor((y - s) / T))) { if (s <= ceil(x)) { on = true; for (let q = 1; q < s; q++) mask[(y - q) * w + x] = 1; } break; }
          if (!on && y < 7 * T) {
            for (let s = 1; s <= 13 && !on; s++) if (x - s >= 0 && mask[y * w + x - s] && W.solidT(Math.floor((x - s) / T), ty)) { if (s <= wallL(y)) { on = true; for (let q = 1; q < s; q++) mask[y * w + x - q] = 1; } break; }
            for (let s = 1; s <= 13 && !on; s++) if (x + s < w && mask[y * w + x + s] && W.solidT(Math.floor((x + s) / T), ty)) { if (s <= wallR(y)) { on = true; for (let q = 1; q < s; q++) mask[y * w + x + q] = 1; } break; }
          }
          if (on) mask[y * w + x] = 1;
        }
      }
    }
    // Ruins: crumbling top edge (some top blocks are broken lower, corners chipped).
    if (W.stoneStyle === 'ruin') {
      for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
        if (tileAt(tx, ty) !== 'B' || !open(tx, ty - 1)) continue;
        for (let px = 0; px < T; px++) {
          const x = tx * T + px, b = block(W, x, ty * T, 10, 8, 24, 41);
          const r = hh(b.id, 9, 9);
          let cutD = r < 0.14 ? 10 : r < 0.3 ? 2 + Math.floor(r * 8) : 0;
          if (b.lx === 0 || b.lx === b.bw - 1) cutD = Math.max(cutD, 1);
          if (r > 0.85 && b.lx < 3) cutD = Math.max(cutD, 3 - b.lx);
          for (let py = 0; py < cutD; py++) mask[(ty * T + py) * w + x] = 0;
        }
      }
    }

    // Forest ruins: a doorway cut into the wall is part of the wall mass (no seams around the arch).
    if (W.stoneStyle === 'ruin') {
      for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
        if (tileAt(tx, ty) !== 'n') continue;
        for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) mask[(ty * T + py) * w + tx * T + px] = 1;
      }
    }

    /* ---- distance fields ---- */
    const dUp = new Uint8Array(N), dDn = new Uint8Array(N), dL = new Uint8Array(N), dR = new Uint8Array(N);
    const outsideSolid = (tx, ty) => SOLID[W.tl(tx, ty)] === 1;
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        dUp[i] = y === 0 ? (outsideSolid(x >> 4, -1) ? 60 : 0) : mask[i - w] ? Math.min(255, dUp[i - w] + 1) : 0;
      }
      for (let y = h - 1; y >= 0; y--) {
        const i = y * w + x;
        if (!mask[i]) continue;
        dDn[i] = y === h - 1 ? 60 : mask[i + w] ? Math.min(255, dDn[i + w] + 1) : 0;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        dL[i] = x === 0 ? 60 : mask[i - 1] ? Math.min(255, dL[i - 1] + 1) : 0;
      }
      for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x;
        if (!mask[i]) continue;
        dR[i] = x === w - 1 ? 60 : mask[i + 1] ? Math.min(255, dR[i + 1] + 1) : 0;
      }
    }
    W.dUp = dUp; W.dDn = dDn; W.dL = dL; W.dR = dR;
    // Depth inside earth only (so dirt under a stone block starts fresh).
    const eUp = new Uint8Array(N);
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      const ch = W.tl(x >> 4, y >> 4);
      if (ch !== 'G' && ch !== 'D') continue;
      const ab = y > 0 ? W.tl(x >> 4, (y - 1) >> 4) : ch;
      eUp[i] = y === 0 ? 60 : (mask[i - w] && (ab === 'G' || ab === 'D')) ? Math.min(255, eUp[i - w] + 1) : 0;
    }
    W.eUp = eUp;
    // Chamfer distance: inside solids to open space (depth), and in open space to solids (AO).
    function chamfer(src, inv) {
      const D = new Float32Array(N);
      for (let i = 0; i < N; i++) D[i] = (inv ? !src[i] : src[i]) ? 999 : 0;
      const A = 1, B = 1.41;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; let v = D[i]; if (!v) continue;
        if (x > 0) v = Math.min(v, D[i - 1] + A);
        if (y > 0) { v = Math.min(v, D[i - w] + A); if (x > 0) v = Math.min(v, D[i - w - 1] + B); if (x < w - 1) v = Math.min(v, D[i - w + 1] + B); }
        D[i] = v;
      }
      for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x; let v = D[i]; if (!v) continue;
        if (x < w - 1) v = Math.min(v, D[i + 1] + A);
        if (y < h - 1) { v = Math.min(v, D[i + w] + A); if (x < w - 1) v = Math.min(v, D[i + w + 1] + B); if (x > 0) v = Math.min(v, D[i + w - 1] + B); }
        D[i] = v;
      }
      return D;
    }
    W.dist = chamfer(mask, false);
    W.dS = chamfer(mask, true);
    W.solidPx = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? outsideSolid(Math.floor(x / T), Math.floor(y / T)) : mask[y * w + x] === 1;

    /* ---- components (roofs, pediments, doors, doorways) ---- */
    const compId = new Int32Array(tw * th).fill(-1);
    const comps = [];
    const GROUPS = { r: 'roof', '(': 'roof', ')': 'roof', '<': 'ped', '>': 'ped', M: 'ped', d: 'door', n: 'gap', H: 'house', w: 'house' };
    for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
      const grp = GROUPS[tileAt(tx, ty)];
      if (!grp || compId[ty * tw + tx] >= 0) continue;
      const c = { grp, x0: tx, x1: tx, y0: ty, y1: ty, id: comps.length };
      const st = [[tx, ty]]; compId[ty * tw + tx] = c.id;
      while (st.length) {
        const [x, y] = st.pop();
        c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= tw || ny >= th || compId[ny * tw + nx] >= 0) return;
          const g2 = GROUPS[tileAt(nx, ny)];
          if (g2 === grp || (grp === 'house' && tileAt(nx, ny) === 'd')) { compId[ny * tw + nx] = c.id; st.push([nx, ny]); }
        });
      }
      comps.push(c);
    }
    W.comp = (tx, ty) => { const id = compId[ty * tw + tx]; return id >= 0 ? comps[id] : null; };
    W.comps = comps;
    // Floor below a wall tile (pixel y of the first solid tile underneath).
    const floorMemo = {};
    W.floorY = (tx, ty) => {
      const k = tx + ',' + ty;
      if (floorMemo[k] !== undefined) return floorMemo[k];
      let y = ty;
      while (y < th && !SOLID[W.tl(tx, y)] && W.tl(tx, y) !== 'P') y++;
      return (floorMemo[k] = y * T);
    };
    const ceilMemo = {};
    W.ceilY = (tx, ty) => {
      const k = tx + ',' + ty;
      if (ceilMemo[k] !== undefined) return ceilMemo[k];
      let y = ty;
      while (y >= 0 && (WALLISH[W.tl(tx, y)] || W.tl(tx, y) === 'k')) y--;
      return (ceilMemo[k] = (y + 1) * T);
    };

    /* ---- paint ---- */
    W.base = new Buf(w, h);
    W.over = new Buf(w, h);
    W.front = new Buf(w, h);
    for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
      const ch = tileAt(tx, ty), fn = PX[ch];
      if (!fn) continue;
      const solid = !!SOLID[ch];
      for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
        const x = tx * T + px, y = ty * T + py;
        if (solid && !mask[y * w + x]) continue;
        const c = fn(W, x, y, tx, ty, px, py, ch);
        if (c) W.base.d[y * w + x] = pk(c);
      }
    }
    POST.forEach((f) => f(W));
    return W;
  }

  /* =====================================================================================
     Pixel painters — PX[ch](W, x, y, tx, ty, px, py) -> colour | null
     ===================================================================================== */
  const PX = {};
  const POST = [];

  // Grass depth for a column (wavy lower edge with occasional long drips).
  function grassThick(x, theme) {
    const base = 4;
    return base + Math.floor(vnoise(x * 0.31, 0.5, 5) * 3.2) + (hh(x, 0, 8) < 0.13 ? 2 : 0) + (hh(x >> 1, 0, 9) < 0.08 ? 1 : 0);
  }

  function earthPx(W, x, y) {
    const i = y * W.w + x, P = W.P, g = P.grass, d = P.dirt;
    const u = W.eUp[i], l = W.dL[i], r = W.dR[i], dn = W.dDn[i];
    const capped = u < 60 && y - u > 0 && W.mask[(y - u - 1) * W.w + x] === 1; // under a stone block
    const grassy = u < 60 && !capped && W.tp(x, y - u) === 'G';
    const gt = grassy ? grassThick(x, W.theme) : 0;
    if (capped && u < 3) return u === 0 ? d[5] : d[4];
    // Silhouette: right / bottom edges get the dark sel-out.
    if (r === 0 || dn === 0) return P.out;
    if (grassy && u < gt) {
      let k;
      if (u === 0) k = hh(x, 1, 3) < 0.82 ? 0 : 1;
      else if (u === 1) k = hh(x, y, 4) < 0.35 ? 0 : 1;
      else if (u >= gt - 1) k = 4;
      else {
        const n = vnoise(x * 0.42, y * 0.7, 11);
        k = n > 0.64 ? 3 : n < 0.3 ? 1 : 2;
        if ((x + (u >> 1)) % 5 === 0 && u > 2) k = Math.min(4, k + 1);
      }
      if (l === 0) k = u < 2 ? 1 : Math.max(k, 2);
      if (r === 1) k = 5; else if (r < 3) k = Math.min(5, k + 1);
      return g[k];
    }
    // Shadow cast by the grass mat onto the soil just below it.
    if (grassy && u === gt) return r === 1 ? d[5] : d[4];
    if (grassy && u === gt + 1) return r === 1 ? d[5] : d[3];
    // Soil: flat depth bands measured only from the open air above (never a 2D blob).
    const dd = u - gt;
    const wob = Math.floor(vnoise(x * 0.05, 0.5, 61) * 5);
    let k = dd < 9 + wob ? 1 : dd < 21 + wob ? 2 : dd < 37 + wob ? 3 : 4;
    // clustered texture: horizontal clods (darker) and clay flecks (lighter), 2-4 px each
    const n = vnoise(x * 0.19, y * 0.34, 71) * 0.8 + vnoise(x * 0.5, y * 0.7, 72) * 0.2;
    if (n > 0.74) k++;
    else if (n < 0.2 && k > 1) k--;
    // broken strata ledges: dark seam with a lit lip beneath
    const sy = y + vnoise(x * 0.035, 0.5, 77) * 7;
    const sl = Math.floor(sy) % 11;
    if (dd > 5 && vnoise(x * 0.09, Math.floor(sy / 11) * 1.7, 78) > 0.68) {
      if (sl === 0) k++;
      else if (sl === 1 && k > 1) k--;
    }
    // side faces: lit left rim, shaded right face, darker at the bottom
    if (l === 0) return d[clamp(k - 1, 0, 3)];
    if (r === 1) return d[5];
    if (r < 4) k++;
    if (dn < 3) k++;
    return d[clamp(k, 0, 5)];
  }
  PX.G = earthPx;
  PX.D = earthPx;

  /* ---- masonry helper: running-bond courses with random block widths ---- */
  function courseStarts(W, key, ch, minW, maxW, seed) {
    W.courses = W.courses || {};
    const K = key + ':' + ch;
    if (W.courses[K]) return W.courses[K];
    const arr = new Int16Array(W.w + 64);
    const ids = new Int32Array(W.w + 64);
    let x = -Math.floor(hh(ch, seed, 3) * maxW), n = 0;
    while (x < W.w) {
      const bw = minW + Math.floor(hh(ch, n, seed) * (maxW - minW + 1));
      for (let k = Math.max(0, x); k < Math.min(W.w, x + bw); k++) { arr[k] = x < 0 ? x : x; ids[k] = n; }
      // store width in the high part through a second array
      for (let k = Math.max(0, x); k < Math.min(W.w, x + bw); k++) ids[k] = n * 256 + bw;
      x += bw; n++;
    }
    return (W.courses[K] = { start: arr, ids });
  }
  function block(W, x, y, courseH, minW, maxW, seed, yOff) {
    const yy = y + (yOff || 0);
    const ci = Math.floor(yy / courseH);
    const cs = courseStarts(W, seed, ci, minW, maxW, seed);
    const st = cs.start[x], idw = cs.ids[x];
    return { lx: x - st, ly: yy - ci * courseH, bw: idw & 255, bh: courseH, id: (idw >> 8) * 131 + ci * 7919, ci };
  }

  /* ---- stone: forest ruins (big weathered blocks, moss on the tops, dark joints) ---- */
  function ruinPx(W, x, y, face) {
    const i = y * W.w + x, P = W.P, s = P.stone, m = P.moss;
    const u = face ? 99 : W.dUp[i], l = face ? 99 : W.dL[i], r = face ? 99 : W.dR[i], dn = face ? 99 : W.dDn[i];
    if (r === 0 || dn === 0) return P.out;
    const b = block(W, x, y, 10, 8, 24, 41);
    const tone = hh(b.id, 1, 2);
    let k = tone < 0.45 ? 1 : 2;
    // soft weathering clusters inside each block
    const tex = vnoise(x * 0.16, y * 0.2, (b.id & 1023) + 7);
    if (tex > 0.74) k++;
    // rain streaks running down from the joints
    if (hh(x, b.ci, 49) < 0.06 && b.ly > 1) k++;
    // bevel: lit top edge, shaded bottom, dark joint
    if (b.ly === 0) k = Math.max(0, k - 1);
    if (b.ly === b.bh - 2 && b.lx < b.bw - 1) k++;
    let c = s[clamp(k, 0, 4)];
    if (b.ly === b.bh - 1 || b.lx === b.bw - 1) c = s[4];
    // chipped block corners
    if ((b.lx <= 1 && b.ly <= 1 && hh(b.id, 2, 3) < 0.4) || (b.lx >= b.bw - 3 && b.ly >= b.bh - 3 && hh(b.id, 4, 3) < 0.3)) c = s[4];
    // moss: cap on exposed tops, creeping into a few joints
    const mt = 2 + Math.floor(vnoise(x * 0.3, 1, 51) * 3);
    if (u < mt) return m[u === 0 ? (hh(x, 0, 5) < 0.75 ? 0 : 1) : u === mt - 1 ? 3 : 1 + (hh(x, y, 6) < 0.3 ? 1 : 0)];
    if (u < mt + 7 && b.lx === b.bw - 1 && hh(b.id, 5, 55) < 0.45) return m[3];
    const mossy = vnoise(x * 0.07, y * 0.09, 53);
    if (b.ly <= 1 && mossy > 0.7 && hh(x >> 1, y, 57) < 0.7) return m[b.ly === 0 ? 2 : 3];
    if (l === 0) return s[3];
    if (l < 2 && c !== s[5]) return sh(c, 0.12);
    if (r < 3) return sh(c, -0.2);
    return c;
  }

  /* ---- stone: village temple stylobate (white marble steps) ---- */
  function styloPx(W, x, y) {
    const i = y * W.w + x, P = W.P, M = MARBLE;
    const u = W.dUp[i], l = W.dL[i], r = W.dR[i], dn = W.dDn[i];
    if (r === 0 || dn === 0) return OUT;
    if (u === 0) return M[0];
    const b = block(W, x, y, 8, 18, 30, 61);
    let k = 1 + (hh(b.id, 3, 1) < 0.3 ? 1 : 0);
    if (b.ly === 0) k = 0;
    if (b.ly === b.bh - 1) return M[4];
    if (b.lx === b.bw - 1) return M[3];
    if (b.lx === 0) k = 0;
    if (b.ly === b.bh - 2) k = 3;
    // veins
    const v = Math.abs(vnoise(x * 0.18 + y * 0.1, y * 0.25, 63) - 0.5);
    if (v < 0.03 && k < 3) k = 3;
    if (l === 0) return M[3];
    if (r < 3) k = Math.min(4, k + 1);
    void P;
    return M[k];
  }

  /* ---- stone: temple floor (polished marble with a gold inlay and a Greek-key band) ---- */
  function floorPx(W, x, y) {
    const i = y * W.w + x, M = MARBLE;
    const u = W.dUp[i];
    if (u === 0) return M[0];
    if (u === 1) return M[1];
    if (u === 2) return M[2];
    if (u === 3) return GOLD[1];
    if (u === 4) return GOLD[3];
    if (u === 5) return M[4];
    if (u < 16) {
      const b = block(W, x, y, 10, 22, 34, 71, 4);
      if (b.lx === b.bw - 1) return M[4];
      if (b.lx === 0) return M[1];
      let k = hh(b.id, 5, 2) < 0.5 ? 2 : 3;
      const v = Math.abs(vnoise(x * 0.12 + y * 0.2, y * 0.3, 73 + (b.id & 7)) - 0.5);
      if (v < 0.035) k = 4; else if (v < 0.06) k = Math.min(4, k + 1);
      if (u === 6) k = Math.min(k, 1);
      if (u === 15) k = 4;
      return M[k];
    }
    // lower course: deep lapis band with a gold meander
    const ly = u - 16;
    if (ly === 0) return GOLD[2];
    if (ly >= 1 && ly <= 6) {
      const on = O.KEY[ly - 1][((x % 6) + 6) % 6] === 'X';
      if (on) return ly === 1 || (x % 6) === 0 ? GOLD[1] : GOLD[2];
      return ly === 6 ? '#1c2551' : '#27346c';
    }
    if (ly === 7) return GOLD[3];
    return M[5];
  }

  /* ---- stone: cave rock (voronoi boulders, lit tops, deep shadows) ---- */
  function voro(x, y, cw, chh, seed) {
    const gx = Math.floor(x / cw), gy = Math.floor(y / chh);
    let d1 = 1e9, d2 = 1e9, bx = 0, by = 0, bid = 0;
    for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const cx = gx + k, cy = gy + j;
      const fx = (cx + 0.15 + hh(cx, cy, seed) * 0.7) * cw, fy = (cy + 0.15 + hh(cx, cy, seed + 1) * 0.7) * chh;
      const dx = x + 0.5 - fx, dy = (y + 0.5 - fy) * 1.15, d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; d1 = d; bx = fx; by = fy; bid = cx * 977 + cy * 131; } else if (d < d2) d2 = d;
    }
    return { e: Math.sqrt(d2) - Math.sqrt(d1), cx: bx, cy: by, id: bid };
  }
  // Sedimentary strata. Every bedding plane is its own curve y_k(x) = spacing*k + fold(x) + own(k, x):
  // a big shared fold (~20 px over ~60 px) plus an independent wander per plane. Planes are forced to stay
  // ordered, so where one dives into the next the course between them pinches out to nothing.
  function strataCols(W) {
    if (W.strC) return W.strC;
    const NK = Math.ceil((W.h + 80) / 7) + 2, cols = new Float32Array(W.w * NK);
    for (let x = 0; x < W.w; x++) {
      const fold = (vnoise(x / 62, 0.5, 881) - 0.5) * 22 + (vnoise(x / 23, 1.5, 882) - 0.5) * 6;
      let prev = -1e9;
      for (let k = 0; k < NK; k++) {
        const sp = 5 + hh(k, 3, 883) * 5;                                  // nominal course height 5-10 px
        let y = -40 + k * 7 + (sp - 7) * 0.5 + fold + (vnoise(x / (18 + (k % 3) * 9) + k * 7.31, k, 884) - 0.5) * 11;
        if (y < prev) y = prev;
        cols[x * NK + k] = y; prev = y;
      }
    }
    return (W.strC = { cols, NK });
  }
  function strata(W, x, y) {
    const S = strataCols(W), b = x * S.NK;
    let lo = 0, hi = S.NK - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S.cols[b + m] <= y + 0.5) lo = m; else hi = m - 1; }
    const y0 = S.cols[b + lo], y1 = lo + 1 < S.NK ? S.cols[b + lo + 1] : y0 + 7;
    return { ci: lo, ly: y + 0.5 - y0, ch: y1 - y0 };
  }
  // Cave rock ramp: desaturated, drifting to grey-violet in the shadows; warmth only on the lit lip.
  const CAVE_R = ['#cdb39c', '#b39a86', '#9d847b', '#8a7070', '#735d67', '#5e4a58', '#3a2c40'];
  const LIP_C = ['#ecc293', '#cf9f78', '#a47c6c'];
  function rockPx(W, x, y) {
    const i = y * W.w + x, P = W.P, R = CAVE_R;
    const u = W.dUp[i], l = W.dL[i], r = W.dR[i], dn = W.dDn[i];
    if (r === 0 || dn === 0) return P.out;
    // warm lit lip on every floor / ledge top
    if (u === 0) return l === 0 ? LIP_C[1] : LIP_C[0];
    if (u === 1) return l === 0 ? LIP_C[2] : (hh(x, y, 5) < 0.3 ? LIP_C[0] : LIP_C[1]);
    if (u === 2) return hh(x >> 1, y, 6) < 0.25 ? LIP_C[1] : LIP_C[2];
    const s = strata(W, x, y);
    const ct = hh(s.ci, 1, 3);
    let k = ct < 0.2 ? 1 : ct < 0.55 ? 2 : ct < 0.85 ? 3 : 4;
    // gentle wide value drift along the layers (never round blobs)
    const drift = vnoise(x / 70, s.ci * 0.37, 889);
    if (drift > 0.72) k++; else if (drift < 0.2) k--;
    // bedding planes: drawn only in stretches, as stepped diagonal runs following the warped curve
    const frHere = vnoise(x / 26, (s.ci + 1) * 1.9, 887) > 0.42 && s.ch > 1.5;
    const frAbove = vnoise(x / 26, s.ci * 1.9, 887) > 0.42;
    if (s.ch < 1.2) k = 5;                                         // pinched-out course: just a seam
    else if (s.ly < 1 && frAbove) k = 6;                          // the fracture itself (1 px)
    else if (s.ly < 2 && frAbove) k--;                            // lit lip of the slab below it
    else if (s.ly > s.ch - 1.6 && frHere) k++;                    // the slab's underside in shade
    // a rare short diagonal joint (at most ~1 per 64 px, 2-3 px long)
    const jx = Math.floor(x / 64), jc = hh(jx, s.ci, 891);
    if (jc < 0.35) {
      const jx0 = jx * 64 + 8 + Math.floor(hh(jx, s.ci, 892) * 48), d = x - jx0 - Math.floor(s.ly);
      if (d === 0 && s.ly > 1 && s.ly < Math.min(4, s.ch - 1)) k = 6;
    }
    // chert nodules: small dark lenses with a lit top-left pixel, sitting in the layers
    const nx = Math.floor(x / 11), nq = hh(nx, s.ci, 893);
    if (nq < 0.09 && s.ch > 3.5) {
      const ncx = nx * 11 + 3 + Math.floor(hh(nx, s.ci, 894) * 5), ncy = s.ch / 2, ddx = x - ncx, ddy = s.ly - ncy;
      if (Math.abs(ddx) <= 1 + (nq < 0.04 ? 1 : 0) && Math.abs(ddy) < 1.2) k = (ddx < 0 && ddy < 0) ? 2 : 5;
    }
    // form: the walkable slab is lit from above, deep interior a band darker, lit left / shaded right,
    // and overhangs darken progressively towards their underside
    if (u === 3) k = Math.max(k, 3);
    else if (u < 10 && dn > 8) k--;
    if (u > 14 && dn > 8) k++;
    if (l === 0) k = Math.min(k, 2); else if (l < 3) k--;
    if (r < 4) k++;
    if (dn < 2) k = 6;
    else if (dn < 4) k = Math.max(k + 1, 5);
    else if (dn < 9) k = Math.max(k, 4);
    return R[clamp(k, 1, 6)];
  }

  PX.B = function (W, x, y) {
    switch (W.stoneStyle) {
      case 'ruin': return ruinPx(W, x, y);
      case 'rock': return rockPx(W, x, y);
      case 'floor': return floorPx(W, x, y);
      default: return styloPx(W, x, y);
    }
  };

  /* ---- one-way platforms ---- */
  PX.P = function (W, x, y, tx, ty, px, py) {
    const left = W.tl(tx - 1, ty) !== 'P', right = W.tl(tx + 1, ty) !== 'P';
    if (W.theme === 'forest') {
      // mossy log: grooved bark, knots, rounded far end, cut end showing the rings
      if (py > 10) return null;
      const LH = 10, cyl = (py + 0.5) / LH; // 0 top .. 1 bottom
      if (left && px < 3) { const dy = py + 0.5 - LH / 2; if (Math.abs(dy) > [3, 4.2, 4.8][px]) return null; }
      const bark = ['#d2a67c', '#a67b58', '#7d5845', '#5a3e3a', '#3c2a31', OUT];
      if (right && px >= 11) {
        const dx = (px + 0.5 - 11) * 1.25, dy = py + 0.5 - LH / 2, rr = Math.sqrt(dx * dx + dy * dy);
        if (px >= 11 && dx < 0.8 && Math.abs(dy) <= 5) { /* bark rim before the face */ }
        if (rr > 5.2) return null;
        if (rr > 4.3) return dx + dy < 0 ? bark[2] : OUT;
        if (rr > 3.4) return '#9a6a48';
        return Math.floor(rr * 1.4) % 2 ? '#ecc796' : (rr < 0.9 ? '#b98552' : '#d4a472');
      }
      if (py === LH) return OUT;
      if (py === 0) return hh(x, 0, 3) < 0.55 ? PAL.forest.moss[1] : bark[2];
      if (py === 1 && hh(x, 1, 3) < 0.4) return PAL.forest.moss[2];
      let k = cyl < 0.22 ? 0 : cyl < 0.42 ? 1 : cyl < 0.65 ? 2 : cyl < 0.85 ? 3 : 4;
      if (vnoise(x * 0.18, py * 1.1, 7) > 0.62 && py > 1) k = Math.min(5, k + 1);
      // knot
      const kx = tx * T + 3 + Math.floor(hh(tx, ty, 9) * 8);
      if (hh(tx, ty, 8) < 0.45) {
        const dx = x - kx, dy = py - 5;
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return (dx === 0 && dy === 0) ? bark[5] : (dx + dy < 0 ? bark[0] : bark[3]);
      }
      if (left && px < 3) k = Math.max(0, k - 1);
      return bark[clamp(k, 0, 5)];
    }
    // marble / rock slab with rounded ends
    const S = W.theme === 'cave' ? W.P.rock : MARBLE;
    if (py > 7) return null;
    if (left && ((px === 0 && (py === 0 || py >= 5)) || (px === 1 && py === 7))) return null;
    if (right && ((px === 15 && (py === 0 || py >= 5)) || (px === 14 && py === 7))) return null;
    if (py === 0) return S[4];
    if (py === 1) return S[0];
    if (py === 2) return S[1];
    if (py === 3) return (x % 8 === 0) ? S[3] : S[1];
    if (py === 4) return GOLD[2];
    if (py === 5) return S[3];
    if (py === 6) return S[4];
    return OUT;
  };

  /* ---- spikes: 3-4 forged iron stakes of varied height on a broken, blood-stained footing (drawn in POST) ---- */
  PX.X = function () { return null; };
  const STEEL = ['#fbfcff', '#d8dce8', '#aeb0c8', '#7f7c9c', '#5a5470', '#3a3450'];
  POST.push(function spikes(W) {
    for (let ty = 0; ty < W.th; ty++) for (let tx = 0; tx < W.tw; tx++) {
      if (W.tl(tx, ty) !== 'X') continue;
      const p = new O.Pix(18, 16), X0 = tx * T - 1, Y0 = ty * T;
      const n = hh(tx, ty, 601) < 0.5 ? 3 : 4;
      const xs = n === 3 ? [3.5, 8.5, 13.5] : [2.5, 6.5, 10.5, 14.5];
      // footing: chunky broken stone/iron base with an irregular top
      const BASE = ['#9a8fa6', '#6f6680', '#4e4560', '#342c42'];
      for (let x = 0; x < 18; x++) {
        const bt = 12 + (hh((tx * 16 + x) >> 1, ty, 602) < 0.4 ? 1 : 0) + (x < 2 || x > 15 ? 1 : 0);
        for (let y = bt; y < 16; y++) {
          const joint = hh((tx * 16 + x) >> 2, y >> 1, 611) < 0.18 && y > bt;
          p.set(x, y, joint ? BASE[3] : y === bt ? BASE[0] : y === bt + 1 ? BASE[1] : BASE[2]);
        }
      }
      // spikes: lit left face (2 tones), dark right face, bright tip
      xs.forEach((cx, k) => {
        cx += Math.round((hh(tx, k, 604) - 0.5) * 1.4);
        const hgt = 7 + Math.floor(hh(tx * 5 + k, ty, 605) * 6), hw = hh(tx, k, 606) < 0.5 ? 2.6 : 3.1;
        const top = 12 - hgt, lean = (hh(tx, k, 607) - 0.5) * 1.2;
        for (let y = top; y < 13; y++) {
          const t = (y - top + 0.5) / hgt, c = cx + lean * (1 - t), half = Math.max(0.5, hw * Math.pow(t, 0.8));
          for (let x = Math.floor(c - half); x <= Math.ceil(c + half); x++) {
            const dx = x + 0.5 - c;
            if (Math.abs(dx) > half + 0.05) continue;
            let col;
            if (y <= top + 1) col = STEEL[0];
            else if (dx < -half * 0.45) col = STEEL[1];
            else if (dx < 0.1) col = STEEL[2];
            else if (dx < half * 0.6) col = STEEL[4];
            else col = STEEL[5];
            p.set(x, y, col);
          }
        }
        // dried blood running down from the tip on some stakes
        if (k === Math.floor(hh(tx, ty, 608) * 6)) for (let y = top + 3; y < top + 3 + Math.floor(hgt * 0.45); y++) { const x = Math.round(cx + lean * (1 - (y - top) / hgt) - 0.3); if (p.get(x, y)) p.set(x, y, y % 3 ? '#8a2a38' : '#b43a3e'); }
      });
      // rust / blood stain on the footing
      for (let x = 2; x < 16; x++) if (hh(tx * 16 + x, ty, 609) < 0.3) { const y = p.get(x, 12) ? 12 : 13; p.set(x, y, '#7a2f3a'); if (hh(x, ty, 610) < 0.5) p.set(x, y + 1, '#5a2232'); }
      p.selout(OUT);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 18; x++) { const c = p.get(x, y); if (c) W.over.set(X0 + x, Y0 + y, c); }
    }
  });

  /* ---- background: whitewashed stucco ---- */
  function stuccoBase(W, x, y) {
    const n = vnoise(x * 0.06, y * 0.08, 41), n2 = vnoise(x * 0.25, y * 0.3, 43);
    let k = 1;
    if (n > 0.64) k = 2;
    if (n > 0.64 && n2 > 0.7) k = 3;
    if (n < 0.28 && n2 > 0.55) k = 0;
    return k;
  }
  PX.H = function (W, x, y, tx, ty, px, py) {
    const S = STUCCO;
    let k = stuccoBase(W, x, y);
    const c = W.comp(tx, ty);
    const x0 = c ? c.x0 * T : tx * T, x1 = c ? c.x1 * T + 15 : tx * T + 15;
    const y1 = c ? c.y1 * T + 15 : ty * T + 15;
    const above = W.tl(tx, ty - 1);
    // flat 3 px cast shadow under the eaves
    if (above === 'r' || above === '(' || above === ')') {
      if (py < 2) return S[5];
      if (py < 3) return S[4];
      if (py < 4) k = Math.max(k, 3);
    }
    // hairline crack
    if (hh(x >> 2, y, 47) < 0.01) k = 3;
    // blue-grey painted plinth at the base
    if (y1 - y < 4 && W.solidT(tx, c ? c.y1 + 1 : ty + 1)) {
      const q = y1 - y;
      k = -1;
      const pl = ['#4f587a', '#66759a', '#8fa2c2', '#b9c8dc'];
      let col = pl[q];
      if (x === x0 && q > 1) col = '#a9bcd6';
      if (x >= x1 - 1) col = q > 1 ? '#6d7c9e' : '#454d6c';
      return col;
    }
    // corners of the house: lit left edge, shaded right edge
    if (x === x0) return S[3];
    if (x === x0 + 1) k = 0;
    if (x === x1) return OUT;
    if (x >= x1 - 2) k = Math.max(k, 4);
    else if (x >= x1 - 4) k = Math.max(k, 3);
    return S[clamp(k, 0, 5)];
  };

  // Wall details that break up the long whitewashed facades: a small arched niche with a painted plate
  // and a wrought-iron wall lantern beside the door.
  function houseExtras(W, c, r) {
    const O2 = W.over, S = STUCCO;
    let door = -1;
    for (let tx = c.x0; tx <= c.x1; tx++) if (W.tl(tx, c.y1) === 'd') door = tx;
    const yB = (c.y1 + 1) * T;
    if (door >= 0) {
      // lantern: bracket from the wall, hanging lamp with warm glass
      const lx = door * T + 20, ly = yB - 30;
      for (let k = 0; k < 5; k++) O2.set(lx + k, ly, k === 0 ? '#2a2438' : '#3a3448');
      O2.set(lx + 1, ly - 1, '#3a3448'); O2.set(lx + 2, ly - 2, '#3a3448'); O2.set(lx, ly + 1, '#2a2438');
      O2.set(lx + 4, ly + 1, '#3a3448');
      const L = ['#2a2438', '#fff0b0', '#ffc860', '#d98a3a'];
      for (let y = 0; y < 7; y++) for (let x = -2; x <= 2; x++) {
        const w2 = y === 0 || y === 6 ? 1 : 2;
        if (Math.abs(x) > w2) continue;
        let col = Math.abs(x) === w2 || y === 0 || y === 6 ? L[0] : y < 3 ? L[1] : x < 1 ? L[2] : L[3];
        if (y === 1 && x === 0) col = L[0];
        O2.set(lx + 4 + x, ly + 2 + y, col);
      }
      O2.set(lx + 4, ly + 9, L[0]);
      for (let y = ly + 3; y < ly + 8; y++) O2.set(lx + 7, y, S[3]); // soft shadow on the wall
    }
    // arched niche with a blue-and-white plate (on the house's left bay, away from the door)
    const nx = c.x0 * T + 10, ny = c.y0 * T + 38;
    if (door >= 0 && door * T > nx + 8) {
      for (let y = 0; y < 11; y++) for (let x = 0; x < 8; x++) {
        const dx = x + 0.5 - 4, top = y < 4 ? Math.sqrt(Math.max(0, 16 - (4 - y - 0.5) * (4 - y - 0.5))) : 4;
        if (Math.abs(dx) > top) continue;
        const edgeL = Math.abs(dx - 1) > top || (y > 0 && Math.abs(dx) > (y - 1 < 4 ? Math.sqrt(Math.max(0, 16 - (5 - y - 0.5) * (5 - y - 0.5))) : 4));
        let col = y === 10 ? S[0] : x < 2 || y < 2 ? S[4] : x > 5 ? S[2] : S[3];
        if (edgeL && y < 10) col = S[5];
        O2.set(nx + x, ny + y, col);
      }
      // plate
      const PL = ['#f4f1f6', '#3a64b8', '#24468c'];
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const d = Math.hypot(x - 2, y - 2);
        if (d > 2.4) continue;
        O2.set(nx + 2 + x - 0, ny + 3 + y, d > 1.6 ? PL[1] : d > 0.7 ? PL[0] : PL[2]);
      }
    }
    void r;
  }
  // Village window (drawn into the overlay so it can spill over the neighbouring wall tiles):
  // 10x12 opening with a white frame and cross mullion, dark interior with a warm lamp hint,
  // open slatted blue shutters with hinges, stone sill and a terracotta box spilling geraniums.
  function drawVillageWindow(W, tx, ty) {
    const B = BLUE, S = STUCCO, p = new O.Pix(26, 24), ox = tx * T - 5, oy = ty * T - 1;
    const P0 = (x, y, c) => p.set(x + 5, y + 1, c); // tile-local coords
    // shutters (open, flat against the wall); left one lit, right one in shade
    const shutter = (x0, lit) => {
      const fr = lit ? B[3] : B[4], a = lit ? B[1] : B[2], b = lit ? B[2] : B[3];
      for (let y = 1; y <= 12; y++) for (let x = x0; x < x0 + 5; x++) {
        let c = (x === x0 || x === x0 + 4 || y === 1 || y === 12 || y === 6) ? fr : ((y & 1) ? a : b);
        if (lit && x === x0 + 1 && y > 1 && y < 12 && y !== 6) c = (y & 1) ? B[0] : B[1];
        P0(x, y, c);
      }
      const hx = lit ? x0 + 4 : x0;
      P0(hx, 3, '#2a2438'); P0(hx, 10, '#2a2438');
    };
    shutter(-3, true); shutter(14, false);
    // cast shadow of the right shutter onto the wall
    for (let y = 2; y <= 13; y++) P0(19, y, S[4]);
    // reveal and frame
    for (let y = 0; y <= 13; y++) for (let x = 2; x <= 13; x++) {
      const edge = x === 2 || x === 13 || y === 0 || y === 13;
      if (edge) { P0(x, y, y === 0 ? S[1] : y === 13 ? S[4] : x === 2 ? S[3] : S[2]); continue; }
      if (x === 3 || y === 1) { P0(x, y, x === 3 && y > 1 ? '#bdb5c8' : '#f4f0f4'); continue; }       // lit frame
      if (x === 12 || y === 12) { P0(x, y, '#a49cb4'); continue; }                                    // shaded frame
      if (x === 8 || y === 6) { P0(x, y, y === 6 && x !== 8 ? '#d9d3e0' : '#ece8ef'); continue; }     // cross mullion
      // glass: dark room; deep shadow along the top/left of each pane (reveal depth), warm lamp low right
      const pl = x < 8 ? 4 : 9, pt = y < 6 ? 2 : 7;
      let c = '#2e2744';
      if (x === pl || y === pt) c = '#1f1a31';
      if (x > 8 && y > 8) c = y === 11 ? '#7a4e46' : '#4c3444';
      if (x === 10 && y === 10) c = '#e0a060';
      if (x === 11 && y === 10) c = '#b87848';
      if ((x - pl) + (y - pt) === 3 && x < 8 && y < 6) c = '#57608c';                                   // glint
      P0(x, y, c);
    }
    // stone sill
    for (let x = 1; x <= 14; x++) { P0(x, 14, x === 1 ? S[1] : S[0]); P0(x, 15, x === 14 ? S[5] : S[4]); }
    // flower box
    for (let y = 16; y <= 19; y++) for (let x = 2; x <= 13; x++) P0(x, y, y === 16 ? TERRA[1] : y === 19 ? TERRA[4] : x === 2 ? TERRA[1] : x >= 12 ? TERRA[3] : TERRA[2]);
    for (let x = 4; x <= 11; x += 3) P0(x, 17, TERRA[0]);
    // geraniums: leaves first (spilling over the box edge), then 4-5 red/pink flower clusters
    const LV = ['#6fb34f', '#4a8f44', '#2f6a3c'], rr = rngOf(tx * 97 + ty * 13);
    for (let k = 0; k < 34; k++) {
      const x = 2 + Math.floor(rr() * 12), y = 12 + Math.floor(rr() * 5);
      P0(x, y, LV[y < 14 ? (x < 8 ? 0 : 1) : 2]);
    }
    [[3, 18], [3, 19], [3, 20], [12, 18], [12, 19], [7, 18], [7, 19], [10, 18], [4, 21]].forEach(([x, y]) => P0(x, y, LV[y > 19 ? 2 : 1]));
    const FL = [['#ff6f78', '#e8384a', '#a8263e'], ['#ffa3c2', '#ea6a98', '#b04272']];
    const nfl = 4 + (rr() < 0.5 ? 1 : 0);
    for (let k = 0; k < nfl; k++) {
      const cx = 3 + Math.round(k * (10 / (nfl - 1))), cy = 12 + Math.floor(rr() * 2), f = FL[k % 3 === 1 ? 1 : 0];
      P0(cx, cy, f[0]); P0(cx + 1, cy, f[1]); P0(cx - 1, cy + 1, f[1]); P0(cx, cy + 1, f[1]); P0(cx + 1, cy + 1, f[2]); P0(cx, cy - 1, f[0]);
    }
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.get(x, y); if (c) W.over.set(ox + x, oy + y, c); }
  }
  PX.w = function (W, x, y, tx, ty, px, py) { return PX.H(W, x, y, tx, ty, px, py); };

  PX.d = function (W, x, y, tx, ty, px, py) {
    const S = STUCCO, B = BLUE;
    let y0 = ty; while (W.tl(tx, y0 - 1) === 'd') y0--;
    let y1 = ty; while (W.tl(tx, y1 + 1) === 'd') y1++;
    const ly = y - y0 * T, hgt = (y1 - y0 + 1) * T;
    const top = 4, r = 6;
    // stone surround (arched), then reveal, then the door leaves
    const cx = 7.5, cy = top + r;
    const inArch = (xx, yy, rad) => (yy >= cy ? Math.abs(xx - cx) <= rad : (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy) <= rad * rad);
    if (ly >= hgt - 2) {
      // threshold step
      if (px < 1 || px > 14) return PX.H(W, x, y, tx, ty, px, py);
      return ly === hgt - 2 ? '#d7d0dc' : '#8d87a0';
    }
    if (!inArch(px, ly, r + 1.6)) return PX.H(W, x, y, tx, ty, px, py);
    if (!inArch(px, ly, r + 0.6)) return ly < cy ? S[0] : (px < cx ? S[0] : S[3]);
    if (!inArch(px, ly, r - 0.4)) return OUT;
    // inside: deep reveal on the left/top (shadow), leaves
    const ix = px - (cx - r) - 1;
    if (ix <= 0 || (ly < cy && !inArch(px, ly, r - 1.4))) return B[5];
    // planks
    const plank = (px - 2) % 3;
    let k = plank === 0 ? 3 : plank === 1 ? 1 : 2;
    if (px === 3) k = 0;
    if (ly === 13 || ly === 24) k = 4;
    if (ly === 12 || ly === 23) k = Math.max(1, k - 1);
    if ((ly === 14 || ly === 25) && k < 4) k = Math.min(4, k + 1);
    if ((ly === 13 || ly === 24) && px % 3 === 1) return '#9aa3b8';
    // gold ring handle
    if ((px === 10 || px === 11) && (ly === 17 || ly === 19)) return GOLD[1];
    if ((px === 9 || px === 12) && ly === 18) return GOLD[2];
    if (px >= 12) k = Math.min(5, k + 1);
    return B[k];
  };

  // terracotta barrel-tile roof (hipped, 45 degree ends), ridge caps on top
  function roofPx(W, x, y, tx, ty, px, py, ch) {
    if (ch === '(' && px + py < 15) return null;
    if (ch === ')' && px > py) return null;
    const c = W.comp(tx, ty);
    const x0 = c.x0 * T, y0 = c.y0 * T, y1 = c.y1 * T + 15;
    const R = TERRA;
    // distance to the sloped edge (for the plaster trim)
    let edge = 99;
    if (ch === '(') edge = px + py - 15;
    if (ch === ')') edge = py - px;
    if (edge === 0) return OUT;
    if (edge === 1) return ch === '(' ? STUCCO[1] : STUCCO[3];
    if (edge === 2) return ch === '(' ? STUCCO[3] : STUCCO[4];
    const ry = y - y0;
    if (ry === 0 && ch === 'r') return OUT;
    if (ry <= 3 && ch === 'r' && W.tl(tx, ty - 1) !== 'r') {
      // ridge caps
      const ph = (x - x0) % 6;
      if (ry === 1) return ph === 0 ? R[3] : R[1];
      if (ry === 2) return ph === 0 ? R[4] : ph < 3 ? R[1] : R[2];
      return R[4];
    }
    if (y === y1) return R[5];
    if (y === y1 - 1) return ((x - x0) % 6 < 4) ? R[3] : R[5];
    // pan-and-cover barrel tiles: continuous convex covers, dark pans, rounded lips at each course
    const cp = (x - x0 + 1) % 6, rp = (y - y0 - 4 + 50) % 6;
    const col = Math.floor((x - x0 + 1) / 6), course = Math.floor((y - y0 - 4 + 50) / 6);
    const age = hh(col, course, 17);
    let k;
    if (cp < 4) {
      k = [2, 0, 1, 2][cp];
      if (cp === 3) k = 3;
      if (rp === 5) k = cp === 0 ? 3 : cp === 3 ? 4 : 1;       // lit rounded lip
      else if (rp === 0) k = cp === 3 ? 5 : 4;                  // shadow under the lip
      else if (rp === 1 && cp > 0) k = Math.min(5, k + 1);
      if (age < 0.12 && rp > 1 && rp < 5) k = Math.min(5, k + 1); // older, darker tile
    } else {
      k = rp === 0 || rp === 1 ? 5 : 4;
    }
    if (edge === 3) k = Math.max(k, 4);
    if (ch === ')') k = Math.min(5, k + 1);
    // a few lichen spots
    if (cp > 0 && cp < 3 && age > 0.93 && rp === 3) return '#c9c07a';
    return R[clamp(k, 0, 5)];
  }
  PX.r = roofPx; PX['('] = roofPx; PX[')'] = roofPx;

  /* ---- marble architecture ---- */
  // wall behind columns / inside temples: ashlar marble above, Pompeian red dado below
  function wallPx(W, x, y, tx, ty) {
    const floor = W.floorY(tx, ty), ceil = W.ceilY(tx, ty);
    const hf = floor - 1 - y; // 0 = row just above the floor
    const hc = y - ceil;
    const Wl = ['#d2c6d0', '#bfb1bf', '#ae9fb0', '#978a9f', '#77698a', '#554a68'];
    if (hf < 0) return Wl[3];
    if (hf < 3) return hf === 0 ? '#3d3450' : hf === 1 ? '#5a4f6c' : '#766a86'; // skirting
    if (hf < 20) {
      const ly = hf - 3;
      if (ly === 16) return GOLD[3];
      if (ly === 15) return GOLD[1];
      if (ly === 14) return GOLD[2];
      // Pompeian red panels framed by thin gold lines
      const pw = 40, lx = ((x % pw) + pw) % pw;
      if (lx === 0) return POMP[3];
      if ((ly === 3 || ly === 11) && lx > 3 && lx < pw - 3) return GOLD[3];
      if ((lx === 4 || lx === pw - 4) && ly > 3 && ly < 11) return GOLD[3];
      let k = 1;
      if (ly < 2) k = 3;
      if (vnoise(x * 0.1, y * 0.2, 7) > 0.7) k = 2;
      return POMP[k];
    }
    if (hf < 22) return hf === 20 ? Wl[5] : Wl[4];
    if (hc >= 0 && hc < 2) return hc === 0 ? Wl[5] : Wl[4];
    // large ashlar blocks: faint joints, lit top lip, gentle veining in some blocks
    const b = block(W, x, y, 16, 34, 52, 101, 5);
    let k = hh(b.id, 7, 1) < 0.5 ? 2 : 1;
    if (b.ly === b.bh - 1 || b.lx === b.bw - 1) k = 3;
    else if (b.ly === 0) k = Math.max(0, k - 1);
    else if (hh(b.id, 8, 1) < 0.4) {
      const v = Math.abs(vnoise(x * 0.07 + y * 0.12, y * 0.14, 103 + (b.id & 3)) - 0.5);
      if (v < 0.022) k = Math.min(3, k + 1);
    }
    if (hc < 7) k = Math.min(4, k + 1); // plain darker band under the frieze
    return Wl[k];
  }
  function nichePx(W, x, y) {
    for (const n of W.niches) {
      const dx = x + 0.5 - n.cx, top = n.y0 + n.hw;
      if (y >= n.y1 || y < n.y0 - 3 || Math.abs(dx) > n.hw + 3) continue;
      const inside = (xx, yy, e) => { const ddx = xx + 0.5 - n.cx; return yy >= top ? Math.abs(ddx) <= n.hw - e : ddx * ddx + (yy + 0.5 - top) * (yy + 0.5 - top) <= (n.hw - e) * (n.hw - e); };
      if (!inside(x, y, -3)) continue;
      if (!inside(x, y, 0)) {
        // marble frame around the niche (lit upper-left)
        return dx < 0 || y < top - 6 ? MARBLE[1] : MARBLE[3];
      }
      if (!inside(x, y, 1)) return OUT;
      // recess: shadow falls on the upper-left inside, the lower-right inside catches light
      const e2 = inside(x - 3, y - 3, 1);
      const deep = ['#5b4f6e', '#6c6082', '#83779a', '#9a8faf'];
      let k = e2 ? 1 : 0;
      if (!inside(x + 2, y, 1)) k = 3;
      else if (!inside(x + 4, y, 1)) k = 2;
      // scallop-shell hood in the arch
      if (y < top) { const a = Math.atan2(y + 0.5 - top, dx); if (Math.floor((a + Math.PI) / 0.4) % 2 === 0) k = Math.min(3, k + 1); }
      return deep[k];
    }
    return null;
  }
  PX.m = function (W, x, y, tx, ty) {
    let c = (W.niches.length && nichePx(W, x, y)) || wallPx(W, x, y, tx, ty);
    // cast shadow from columns / solids (light from upper-left)
    for (let s = 1; s <= 3; s++) {
      const t2 = W.tp(x - s, y);
      if (t2 === 'C' || t2 === 'c' || t2 === 'b') {
        const lx = (x - s) % T;
        if (lx >= 3 && lx <= 12) { c = sh(c, -0.22); break; }
      }
    }
    return c;
  };

  const SHAFT = [MARBLE[4], MARBLE[1], MARBLE[0], MARBLE[0], MARBLE[1], MARBLE[1], MARBLE[2], MARBLE[2], MARBLE[3], MARBLE[5]];
  function shaftPx(W, x, y, px) {
    if (px < 3 || px > 12) return null;
    let k = px - 3;
    let c = SHAFT[k];
    if (px === 5 || px === 8 || px === 10) c = sh(c, -0.12);
    if (hh(x, y >> 2, 111) < 0.05 && px > 3 && px < 11) c = MARBLE[3];
    return c;
  }
  function behindColumn(W, x, y, tx, ty) {
    const lt = W.tl(tx - 1, ty), rt = W.tl(tx + 1, ty);
    if (lt === 'm' || rt === 'm' || lt === 'n' || rt === 'n') return PX.m(W, x, y, tx, ty);
    return null;
  }
  PX.C = function (W, x, y, tx, ty, px) {
    return shaftPx(W, x, y, px) || behindColumn(W, x, y, tx, ty);
  };
  PX.c = function (W, x, y, tx, ty, px, py) {
    const M = MARBLE;
    if (py <= 2) {
      if (px === 15 && py > 0) return OUT;
      return py === 0 ? M[0] : py === 1 ? (px === 0 ? M[0] : px > 12 ? M[3] : M[1]) : M[4];
    }
    // volutes
    const vol = (cx) => {
      const dx = px - cx, dy = py - 5.5, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 2.9) return null;
      if (d < 1.1) return GOLD[1];
      if (d < 1.9) return M[4];
      return (dx + dy < 0) ? M[0] : M[2];
    };
    const v = vol(2.5) || vol(12.5);
    if (v) return v;
    if (py >= 3 && py <= 6 && px >= 4 && px <= 11) {
      // egg-and-dart echinus
      const ph = (px - 4) % 3;
      if (py === 3) return M[1];
      if (ph === 2) return M[4];
      return ph === 0 ? M[0] : M[2];
    }
    if (py === 7 && px >= 3 && px <= 12) return M[4];
    if (py === 8 && px >= 3 && px <= 12) return (px % 2) ? GOLD[2] : GOLD[1];
    if (py === 9 && px >= 3 && px <= 12) return GOLD[3];
    return shaftPx(W, x, y, px) || behindColumn(W, x, y, tx, ty);
  };
  PX.b = function (W, x, y, tx, ty, px, py) {
    const M = MARBLE;
    if (py === 9 && px >= 2 && px <= 13) return px === 13 ? M[4] : GOLD[2];
    if (py >= 10 && py <= 11 && px >= 1 && px <= 14) return px === 14 ? OUT : py === 10 ? (px < 9 ? M[0] : M[2]) : M[3];
    if (py === 12 && px >= 2 && px <= 13) return M[5];
    if (py >= 13 && py <= 14) return px === 15 ? OUT : py === 13 ? (px < 10 ? M[0] : M[2]) : M[3];
    if (py === 15) return OUT;
    return shaftPx(W, x, y, px) || behindColumn(W, x, y, tx, ty);
  };

  // Entablature: cornice, dentils, lapis frieze with a gold meander, architrave.
  PX.E = function (W, x, y, tx, ty, px, py) {
    const M = MARBLE;
    const endL = W.tl(tx - 1, ty) !== 'E', endR = W.tl(tx + 1, ty) !== 'E';
    if (endR && px === 15) return OUT;
    if (endL && px === 0) return M[3];
    if (py === 0) return M[0];
    if (py === 1) return M[1];
    if (py === 2) return M[4];
    if (py === 3) return (x % 3 === 0) ? M[5] : M[1];
    if (py >= 4 && py <= 9) {
      const on = O.KEY[py - 4][((x % 6) + 6) % 6] === 'X';
      if (on) return (py === 4 || x % 6 === 0) ? GOLD[1] : GOLD[2];
      return py === 9 ? '#1c2551' : '#27346c';
    }
    if (py === 10) return M[4];
    if (py === 11) return M[0];
    if (py === 12) return M[2];
    if (py === 13) return M[1];
    if (py === 14) return M[3];
    return M[5];
  };

  // Pediment: one triangle drawn over the whole {<, M, >} component, with a gilded sun disc.
  function pedPx(W, x, y, tx, ty) {
    const c = W.comp(tx, ty);
    const x0 = c.x0 * T, x1 = (c.x1 + 1) * T - 1, y0 = c.y0 * T + 2, y1 = (c.y1 + 1) * T - 1;
    const cx = (x0 + x1) / 2, half = (x1 - x0) / 2, H = y1 - y0;
    const yTop = y1 - (1 - Math.abs(x + 0.5 - cx) / half) * H;
    const e = Math.floor(y - yTop);
    if (e < 0) return null;
    const left = x < cx, M = MARBLE;
    if (e === 0) return left ? M[3] : OUT;
    if (e === 1) return left ? M[0] : M[1];
    if (e === 2) return left ? M[1] : M[2];
    if (e === 3) return M[3];
    if (e === 4) return (x % 3 === 0) ? M[5] : M[2];
    if (e === 5) return M[5];
    if (y >= y1 - 1) return y === y1 ? M[4] : M[1];
    // tympanum (recessed) with a sun disc relief
    // gilded sun disc with eight straight rays
    const dx = x + 0.5 - cx, dy = y + 0.5 - (y1 - 7), d = Math.sqrt(dx * dx + dy * dy);
    if (d < 3.6) return d < 1.6 ? GOLD[0] : (dx + dy < 0 ? GOLD[1] : GOLD[2]);
    if (d < 3.9) return GOLD[3];
    if (d < 7 && dy < 4.5) {
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax < 0.6 || ay < 0.6 || Math.abs(ax - ay) < 0.6) return d < 5.5 ? GOLD[2] : GOLD[3];
    }
    if (e === 6) return M[4];
    return (vnoise(x * 0.2, y * 0.3, 9) > 0.7) ? M[3] : '#c7bdd8';
  }
  PX['<'] = pedPx; PX['>'] = pedPx; PX.M = pedPx;

  // Dark doorway / tunnel; arched in caves and ruins, framed in temples.
  PX.n = function (W, x, y, tx, ty, px, py) {
    const c = W.comp(tx, ty);
    const x0 = c.x0 * T, x1 = (c.x1 + 1) * T - 1, y0 = c.y0 * T, y1 = (c.y1 + 1) * T - 1;
    const wdt = x1 - x0 + 1, hgt = y1 - y0 + 1;
    // surrounding material (what the doorway was cut into)
    const nb = [W.tl(c.x0 - 1, c.y1), W.tl(c.x1 + 1, c.y1), W.tl(c.x0, c.y0 - 1)];
    const inRock = nb.includes('B') || nb.includes('k');
    const lx = x - x0, ly = y - y0;
    const touchesEdge = c.x0 === 0 || c.x1 === W.tw - 1;
    if (inRock) {
      // arched cave mouth with a rough rim
      const rx = wdt / 2, cx = x0 + rx, cy = y0 + Math.min(rx, hgt * 0.45) + 1;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / Math.min(rx, hgt * 0.45);
      const rough = (vnoise(x * 0.35, y * 0.35, 7) - 0.5) * 0.25;
      const outside = y < cy && dx * dx + dy * dy > 1 + rough - 0.15;
      const sideRough = Math.abs(dx) > 0.93 + rough;
      if (outside || (sideRough && !touchesEdge)) {
        const mat = W.tl(c.x0, c.y0 - 1) === 'k' || nb[0] === 'k' ? 'k' : 'B';
        if (mat === 'k') {
          const ed = Math.sqrt(dx * dx + dy * dy);
          if (y < cy + 1 && ed < 1.16 + rough * 0.3) return dx + dy < -0.3 ? W.P.back[0] : dx + dy < 0.4 ? W.P.back[1] : W.P.back[2];
          if (y >= cy && Math.abs(dx) < 1.12 + rough && Math.abs(dx) > 0.9) return dx < 0 ? W.P.back[1] : W.P.back[3];
          return PX.k(W, x, y, tx, ty);
        }
        if (W.theme === 'forest') {
          // voussoir ring around the arch with a keystone
          const ed = Math.sqrt(dx * dx + dy * dy);
          if (y < cy + 2 && ed < 1.28 + rough * 0.3) {
            const ang = Math.atan2(dy, dx), seg = Math.floor((ang + Math.PI) / 0.33);
            const aj = ((ang + Math.PI) / 0.33) % 1;
            if (ed > 1.25) return W.P.stone[4];
            if (aj < 0.14) return W.P.stone[4];
            const key = Math.abs(ang + Math.PI / 2) < 0.2;
            let kk = (dx + dy * 1.2 < -0.2) ? 1 : 2;
            if (hh(seg, 3, 5) < 0.3) kk++;
            if (key) kk = 0;
            return W.P.stone[kk];
          }
          return ruinPx(W, x, y, true);
        }
        return rockPx(W, x, y);
      }
      // rim shading inside the mouth
      const edge = y < cy ? 1 - Math.sqrt(dx * dx + dy * dy) : 1 - Math.abs(dx);
      if (edge < 0.08) return OUT;
      const g = ['#3a2a3a', '#2a1f2e', '#1f1724', '#17111c', '#110c16'];
      let k = Math.min(4, Math.floor(edge * 7 + (1 - ly / hgt) * 1.5 + 0.4));
      if (dx > 0.6 && edge < 0.3 && y > cy) k = 0;
      return g[k];
    }
    // temple / architectural doorway: marble lintel with a gold fillet, jambs, lit right reveal
    const M = MARBLE;
    const frameL = !touchesEdge || c.x0 > 0, frameR = c.x1 < W.tw - 1;
    if (ly < 6) return [M[0], M[1], GOLD[1], GOLD[3], M[2], OUT][ly];
    if (frameL && lx < 4) return [M[1], M[0], M[2], OUT][lx];
    if (frameR && lx > wdt - 5) return [OUT, M[3], M[1], M[0], M[3]][lx - (wdt - 5)];
    // reveals: the right one faces the light
    if (frameR && lx > wdt - 8) return lx === wdt - 6 ? '#8f86a8' : lx === wdt - 7 ? '#6d6488' : '#4d4666';
    if (ly < 8) return ly === 6 ? '#0c0913' : '#141020';
    // dark cella in flat bands (no dithering): deepest under the lintel, a little light on the floor
    const g = ['#2e2440', '#241c33', '#1b1528', '#140f1f', '#0f0b18'];
    const fy = hgt - 2; // floor line
    let k = ly < 12 ? 4 : ly < fy - 14 ? 3 : 2;
    if (frameL && lx < 7) k = 4;
    if (ly >= fy) return ly === hgt - 1 ? '#3b3350' : '#2a2338';
    if (!touchesEdge) {
      // a shaft of warm light falling from the top of the door, in 3 flat steps, onto a cult statue
      const cx = x0 + wdt / 2, dx = Math.abs(x + 0.5 - cx), wv = wdt * 0.2 + (ly - 8) * 0.16;
      const inFig = (sx, sy) => Math.hypot(sx, (sy - 20.5) * 1.1) < 2.5 ||                         // head
        (sy >= 18 && sy < 19 && Math.abs(sx) < 1.2) ||                                                  // neck
        (sy >= 4 && sy < 18 && Math.abs(sx) < (sy > 14 ? 3.6 : 2.6 + (sy - 4) * 0.06)) ||                // robed body, shoulders
        (sy >= 0 && sy < 4 && Math.abs(sx) < 5);                                                          // plinth
      const sx = x + 0.5 - cx, sy = fy - 1 - ly;
      if (inFig(sx, sy)) {
        const plinth = sy < 4;
        if (!inFig(sx, sy + 1)) return plinth ? '#b07a52' : '#e0a468';                               // lit top edges
        if (plinth) return sy === 3 ? '#7a5446' : '#3a2a34';
        if (!inFig(sx - 1, sy) || !inFig(sx - 1, sy + 1)) return '#8a5c48';                          // warm rim on the left
        return sx > 1 ? '#1f1726' : '#2a1e2c';
      }
      if (ly >= 8 && dx < wv) {
        const t = dx / wv;
        if (t < 0.4 && ly > 16) return '#7a5244';
        if (t < 0.72 && ly > 11) return '#573c3a';
        return '#3a2a34';
      }
      if (ly >= fy - 3 && dx < wv + 4) return '#2e2236';
    }
    return g[k];
  };

  // Cave back wall: big bulging rock masses (40-90 px) from a low-frequency height field, each lit from the
  // upper-left (light rim top-left, two tones darker bottom-right), rare cracks along the valleys between
  // masses, flowstone drapes under the ceiling, flat occlusion bands along the floor, ceiling and walls.
  const BACKH = (x, y) => vnoise(x * 0.013, y * 0.017, 131) * 0.7 + vnoise(x * 0.032, y * 0.038, 132) * 0.3;
  // Big overlapping rock masses (40-90 px). Front masses cast a flat shadow on the ones behind.
  const MGX = 52, MGY = 40;
  function massAt(i, j) {
    const r = (a) => hh(i, j, 170 + a);
    return { x: (i + 0.5) * MGX + (r(1) - 0.5) * 30, y: (j + 0.5) * MGY + (r(2) - 0.5) * 18, rx: 28 + r(3) * 24, ry: 15 + r(4) * 11, z: r(5), id: i * 977 + j * 131 };
  }
  function massOwner(x, y) {
    const gi = Math.floor(x / MGX), gj = Math.floor(y / MGY);
    let best = null, bz = -1, bdx = 0, bdy = 0;
    for (let j = gj - 1; j <= gj + 1; j++) for (let i = gi - 1; i <= gi + 1; i++) {
      const m = massAt(i, j), dx = (x + 0.5 - m.x) / m.rx, dy = (y + 0.5 - m.y) / m.ry;
      const a = Math.atan2(dy, dx), wob = 1 + (vnoise(a * 1.6 + m.id, 0.5, 177) - 0.5) * 0.35;
      if (dx * dx + dy * dy > wob * wob) continue;
      if (m.z > bz) { bz = m.z; best = m; bdx = dx / wob; bdy = dy / wob; }
    }
    return best ? { m: best, dx: bdx, dy: bdy } : null;
  }
  function backFacet(x, y) {
    const o = massOwner(x, y);
    if (!o) return { k: 4, edge: false };
    // chiselled shelf: flat lit top plane, a front face lit on its left, a shaded right flank and underside
    const d2 = o.dx * o.dx + o.dy * o.dy, jag = (vnoise(x * 0.11, y * 0.2, 178) - 0.5) * 0.3;
    let k;
    if (o.dy < -0.5 + jag + o.dx * 0.15) k = 1;
    else if (o.dy > 0.62 + jag) k = 4;
    else k = o.dx + jag < -0.2 ? 2 : o.dx + jag < 0.55 ? 3 : 4;
    if (k === 1 && o.dx > 0.55) k = 2;
    if (d2 > 0.86 && k < 3) k++;
    // cast shadow from a mass in front (up-left of here), and the crevice right at the border
    const a = massOwner(x - 1, y), b = massOwner(x, y - 1);
    const edge = (a && a.m !== o.m && a.m.z > o.m.z) || (b && b.m !== o.m && b.m.z > o.m.z);
    if (edge) return { k: 5, edge: true };
    const c = massOwner(x - 3, y - 3);
    if (c && c.m !== o.m && c.m.z > o.m.z) k = Math.max(k, 4);
    return { k, edge: false };
  }
  function drapes(W) {
    if (W.drapes) return W.drapes;
    const list = [];
    for (let x = 12; x < W.w - 12; x += 12) {
      if (hh(x, 1, 151) > 0.32) continue;
      const cx = x + Math.floor(hh(x, 2, 152) * 8), cy = W.ceilY(Math.floor(cx / T), 5);
      list.push({ cx, y0: cy - 2, len: 16 + Math.floor(hh(x, 3, 153) * 30), hw: 2.2 + hh(x, 4, 154) * 1.8 });
    }
    return (W.drapes = list);
  }
  PX.k = function (W, x, y) {
    const R = W.P.back || PAL.cave.back;
    if (W.mask[y * W.w + x]) return rockPx(W, x, y);            // rock bulging out of the ceiling / walls
    // chiselled facets: a warped triangle grid whose vertex heights sample the big mass field, so each
    // mass is made of a few flat planes, each one lit as a whole
    let k = backFacet(x, y).k;
    // faint bedding cracks crossing the masses (same strata as the solid rock, only in stretches)
    const st = strata(W, x, y);
    if (st.ly < 1 && k < 4 && vnoise(x / 30, st.ci * 2.3, 179) > 0.62) k++;
    // flowstone drapes hanging from the ceiling: rippled curtains, lit left edge, growth rings
    for (const d of drapes(W)) {
      const t = (y - d.y0) / d.len;
      if (t < -0.2 || t > 1) continue;
      const wv = Math.sin(y * 0.3 + d.cx) * 0.7, hw = d.hw * (t < 0.7 ? 1 : Math.sqrt(Math.max(0, 1 - (t - 0.7) / 0.3))) + (vnoise(y * 0.4, d.cx, 157) - 0.5) * 1.2;
      const dx = x + 0.5 - (d.cx + wv);
      if (hw < 0.4 || Math.abs(dx) > hw + 0.7) continue;
      if (Math.abs(dx) > hw - 0.3) { k = dx > 0 ? 5 : 4; break; }
      k = dx < -hw + 1.2 ? 0 : dx < 0.3 ? 1 : dx < hw - 1 ? 2 : 3;
      if ((y + Math.floor(d.cx)) % 7 === 0 && dx > -hw + 1.2) k = Math.min(4, k + 1);
      break;
    }
    // flat shadow bands: above the floor and under the ceiling / next to the side walls
    let below = 0;
    for (let s = 1; s <= 4; s++) if (W.solidPx(x, y + s)) { below = s; break; }
    if (below) k = Math.max(k, below <= 2 ? 5 : 4);
    if (W.solidPx(x, y - 1) || W.solidPx(x, y - 2)) k = Math.max(k, 5);
    else if (W.solidPx(x, y - 5) || W.solidPx(x - 3, y)) k = Math.max(k, 4);
    if (W.solidPx(x + 2, y)) k = Math.max(k, 4);
    // rare crystal glints embedded in the wall
    if (hh(x, y, 141) < 0.00016 && k < 4) return '#6fd6e8';
    return R[clamp(k, 0, 5)];
  };

  /* =====================================================================================
     Post passes: pebbles, cracks, overlay details (grass blades, lips, roots, eaves...)
     ===================================================================================== */
  // Pebbles embedded in earth: small groups of 2-4 stones lying along a stratum line (not confetti).
  POST.push(function pebbles(W) {
    if (W.theme !== 'village' && W.theme !== 'forest') return;
    const P = W.P, pe = P.peb;
    const stone = (x, y, rx, ry, dark) => {
      for (let yy = Math.floor(y - ry - 1); yy <= Math.ceil(y + ry + 1); yy++) for (let xx = Math.floor(x - rx - 1); xx <= Math.ceil(x + rx + 1); xx++) {
        const j = yy * W.w + xx;
        if (xx < 0 || yy < 0 || xx >= W.w || yy >= W.h || !W.mask[j] || W.dL[j] < 2 || W.dR[j] < 3 || W.dDn[j] < 2) continue;
        const dx = (xx + 0.5 - x) / rx, dy = (yy + 0.5 - y) / ry, d = dx * dx + dy * dy;
        let c = null;
        if (d <= 1) {
          const n = -(dx * 0.6 + dy * 0.8);
          c = n > 0.3 ? pe[0] : n < -0.3 ? pe[2] : pe[1];
          if (d > 0.6 && dx + dy > 0.7) c = pe[3];
        } else {
          const dx2 = (xx - 0.5 - x) / rx, dy2 = (yy - 0.5 - y) / ry;
          if (dx2 * dx2 + dy2 * dy2 <= 1) c = P.dirt[5];
        }
        if (c) W.base.set(xx, yy, dark ? mx(c, P.dirt[4], 0.45) : c);
      }
    };
    for (let cx = 0; cx < W.w; cx += 22) for (let cy = 0; cy < W.h; cy += 11) {
      if (hh(cx, cy, 201) > 0.13) continue;
      let x = cx + Math.floor(hh(cx, cy, 202) * 14);
      // snap to the local stratum line used by the soil painter
      let y = cy + 1;
      for (let k = 0; k < 11; k++) { const yy = cy + k, sy = yy + vnoise(x * 0.035, 0.5, 77) * 7; if (Math.floor(sy) % 11 === 0) { y = yy; break; } }
      const i = y * W.w + x;
      if (!W.mask[i]) continue;
      const ch = W.tp(x, y);
      if (ch !== 'G' && ch !== 'D') continue;
      if (W.eUp[i] < grassThick(x, W.theme) + 5) continue;
      const n = 1 + Math.floor(hh(cx, cy, 203) * 3), dark = W.eUp[i] > 30;
      for (let k = 0; k < n; k++) {
        const big = k === 0 && hh(cx, cy, 206) < 0.5;
        const rx = big ? 2.8 + hh(cx, k, 204) * 0.9 : 1.5 + hh(cx + k, cy, 204) * 0.8;
        const ry = Math.max(1.2, rx * (0.6 + hh(cx, cy + k, 205) * 0.15));
        stone(x, y - (big ? 1 : 0) + (hh(k, cx, 207) < 0.5 ? 0 : 1), rx, big ? ry + 0.4 : ry, dark);
        x += Math.ceil(rx) + 1 + Math.floor(hh(cx, k, 208) * 3);
      }
    }
  });

  // Roots in dirt (forest) and a few in the village.
  POST.push(function roots(W) {
    if (W.theme !== 'village' && W.theme !== 'forest') return;
    const P = W.P, n = W.theme === 'forest' ? 0.14 : 0.025;
    for (let x = 2; x < W.w - 2; x += 3) {
      if (hh(x, 7, 211) > n) continue;
      // find surface
      for (let y = 1; y < W.h; y++) {
        const i = y * W.w + x;
        if (!W.mask[i] || W.dUp[i] !== 0) continue;
        if (W.tp(x, y) !== 'G') break;
        let xx = x, yy = y + grassThick(x, W.theme) - 1;
        const len = 6 + Math.floor(hh(x, y, 212) * 12);
        const RT = W.theme === 'forest' ? ['#b8927f', '#8f6b60', '#664a4c'] : ['#e2b58f', '#b98663', '#8a5c45'];
        for (let k = 0; k < len; k++) {
          const j = yy * W.w + xx;
          if (!W.mask[j] || W.dist[j] < 2) break;
          const t = k / len;
          if (t < 0.4) { W.base.set(xx - 1, yy, RT[0]); W.base.set(xx, yy, RT[1]); W.base.set(xx + 1, yy, RT[2]); }
          else W.base.set(xx, yy, t < 0.8 ? RT[1] : RT[2]);
          // rootlet
          if (k > 2 && hh(xx, yy, 214) < 0.18) { const sd = hh(xx, yy, 215) < 0.5 ? -1 : 1; W.base.set(xx + sd * 2, yy + 1, RT[2]); W.base.set(xx + sd * 3, yy + 2, RT[2]); }
          yy++;
          const r = hh(xx, yy, 213);
          if (r < 0.22) xx--; else if (r > 0.78) xx++;
        }
        break;
      }
    }
  });

  // Cracks in rock and ruins.
  POST.push(function cracks(W) {
    if (W.stoneStyle !== 'ruin') return;
    const dark = W.stoneStyle === 'rock' ? W.P.rock[6] : W.P.stone[5];
    for (let cy = 0; cy < W.h; cy += 12) for (let cx = 0; cx < W.w; cx += 14) {
      if (hh(cx, cy, 221) > 0.1) continue;
      let x = cx + Math.floor(hh(cx, cy, 222) * 12), y = cy + Math.floor(hh(cx, cy, 223) * 8);
      if (W.tp(x, y) !== 'B' || !W.mask[y * W.w + x] || W.dist[y * W.w + x] < 3) continue;
      const len = 4 + Math.floor(hh(cx, cy, 224) * 7);
      for (let k = 0; k < len; k++) {
        const j = y * W.w + x;
        if (!W.mask[j] || W.dist[j] < 2) break;
        W.base.set(x, y, dark);
        y++;
        const r = hh(x, y, 225);
        if (r < 0.35) x--; else if (r > 0.65) x++;
      }
    }
  });

  // Overlay: grass blades on top of grassy surfaces, lips over cliff edges, flowers.
  POST.push(function grassOver(W) {
    if (W.theme !== 'village' && W.theme !== 'forest') return;
    const P = W.P, g = P.grass, O2 = W.over;
    for (let x = 0; x < W.w; x++) {
      for (let y = 1; y < W.h; y++) {
        const i = y * W.w + x;
        if (!W.mask[i] || W.dUp[i] !== 0 || W.mask[i - W.w]) continue;
        if (W.tp(x, y) !== 'G') continue;
        const above = W.tp(x, y - 1);
        if (above === 'X' || above === 'P' || HOUSE[above]) continue;
        const n = vnoise(x * 0.23, y, 231);
        let hgt = n > 0.55 ? 1 + Math.floor((n - 0.55) * 9) : (hh(x, y, 232) < 0.3 ? 1 : 0);
        if (hh(x, y, 233) < 0.06) hgt += 2;
        hgt = Math.min(hgt, 5);
        const lean = hh(x >> 1, y, 234) < 0.5 ? -1 : 1;
        for (let k = 1; k <= hgt; k++) {
          const xx = x + (k === hgt && hgt > 2 ? lean : 0);
          if (W.solidPx(xx, y - k)) break;
          O2.set(xx, y - k, k === hgt ? g[0] : k === 1 ? g[1] : (lean > 0 ? g[1] : g[2]));
        }
        // flowers
        if (P.flowers && hh(x, y, 235) < (W.theme === 'village' ? 0.035 : 0.02) && hgt >= 1) {
          const fc = P.flowers[Math.floor(hh(x, y, 236) * P.flowers.length)];
          const fy = y - hgt - 1;
          O2.set(x, fy, fc); O2.set(x - 1, fy + 1, fc); O2.set(x + 1, fy + 1, fc); O2.set(x, fy + 1, '#ffe98a');
          O2.set(x, fy + 2, g[3]);
        }
        break;
      }
    }
    // half-buried stones (village) and ferns (forest) along the surface
    for (let x = 6; x < W.w - 6; x++) {
      if (hh(x, 11, 251) > 0.011) continue;
      let y = -1;
      for (let yy = 1; yy < W.h; yy++) { const i = yy * W.w + x; if (W.mask[i] && W.dUp[i] === 0 && !W.mask[i - W.w]) { y = yy; break; } }
      if (y < 0 || W.tp(x, y) !== 'G' || W.dL[y * W.w + x] < 8 || W.dR[y * W.w + x] < 8) continue;
      const ab = W.tp(x, y - 1);
      if (ab === 'X' || HOUSE[ab] || ab === 'P') continue;
      if (W.theme === 'forest' && hh(x, 12, 252) < 0.6) {
        // fern: arching fronds
        const m = W.P.grass;
        [[-1, 1], [1, 1]].forEach(([dir]) => {
          for (let k = 0; k < 6; k++) {
            const fx = x + dir * k, fy = y - 1 - Math.round(4 * Math.sin((k / 6) * Math.PI * 0.9));
            O2.set(fx, fy, k > 3 ? m[0] : m[1]);
            if (k % 2 === 0 && k > 0) O2.set(fx, fy + 1, m[2]);
          }
        });
        O2.set(x, y - 1, m[3]); O2.set(x, y - 2, m[2]);
        continue;
      }
      const pe = P.peb, rx = 2 + Math.floor(hh(x, 13, 253) * 3), ry = 2;
      for (let yy = -ry - 1; yy <= 1; yy++) for (let xx = -rx - 1; xx <= rx + 1; xx++) {
        const dx = (xx + 0.5) / rx, dy = (yy + 0.5) / ry, d = dx * dx + dy * dy;
        if (d > 1.35) continue;
        const px = x + xx, py = y + yy;
        if (d > 1) { if (xx >= 0 || yy >= 0) O2.set(px, py, P.out); continue; }
        const n = -(dx * 0.6 + dy * 0.8);
        O2.set(px, py, n > 0.35 ? pe[0] : n < -0.3 ? pe[2] : pe[1]);
      }
      // grass creeping around the stone's foot
      for (let xx = -rx - 1; xx <= rx + 1; xx++) if (hh(x + xx, y, 254) < 0.5) O2.set(x + xx, y, g[1]);
    }
    // Cliff edges: the grass mat curls over the rim, strands and roots hang down the face,
    // and now and then a stone juts out of the soil (all drawn outward-facing = right, mirrored for left).
    const LIP = [
      // [dx (outward from the edge column), dy (from the tile top), tone]
      [-3, -1, 0], [-1, -1, 0], [1, -1, 1],
      [-3, 0, 0], [-2, 0, 0], [-1, 0, 0], [0, 0, 0], [1, 0, 1],
      [-2, 1, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [2, 1, 2],
      [-1, 2, 2], [0, 2, 2], [1, 2, 2], [2, 2, 2], [3, 2, 3],
      [0, 3, 3], [1, 3, 3], [2, 3, 3], [3, 3, 4],
      [0, 4, 4], [1, 4, 4], [2, 4, 4],
      [1, 5, 4], [2, 5, 5]
    ];
    const RTC = W.theme === 'forest' ? ['#a4807a', '#76595c', '#523e48'] : ['#c99a74', '#9a6c52', '#6d4a3e'];
    for (let ty = 0; ty < W.th; ty++) for (let tx = 0; tx < W.tw; tx++) {
      const ch = W.tl(tx, ty);
      if (ch !== 'G' && ch !== 'D') continue;
      [-1, 1].forEach((side) => {
        if (W.solidT(tx + side, ty)) return;
        const E = side < 0 ? tx * T : tx * T + 15, yT = ty * T;
        const tmp = new O.Pix(16, 26), ox = 8; // tmp x = ox + dx (outward), y = dy + 1
        const put = (dx, dy, c) => tmp.set(ox + dx, dy, c);
        const top = ch === 'G' && !W.solidT(tx, ty - 1);
        if (top) {
          LIP.forEach(([dx, dy, k]) => put(dx, dy + 1, g[Math.min(5, k + (side > 0 && dy > 0 ? 1 : 0))]));
          // hanging strands (2-4) of 2-6 px, darker towards the tips
          const ns = 2 + Math.floor(hh(tx, ty + side, 241) * 3);
          for (let s = 0; s < ns; s++) {
            const dx = [1, 0, 2, -1][s], len = 2 + Math.floor(hh(tx * 3 + s, ty, 242 + side) * 5);
            for (let k = 0; k < len; k++) put(dx + (k > 3 && s === 2 ? 1 : 0), 7 + k, g[k >= len - 2 ? 5 : 3 + (side > 0 ? 1 : 0)]);
          }
          // a root or two dangling below the grass (forest mostly)
          if (hh(tx, ty, 246 + side) < (W.theme === 'forest' ? 0.7 : 0.3)) {
            const len = 4 + Math.floor(hh(tx, ty, 247) * 7);
            let dx = 0;
            for (let k = 0; k < len; k++) { if (k === 3 || k === 7) dx++; put(dx, 7 + k, RTC[k < len - 2 ? 1 : 2]); if (k < 3) put(dx - 1, 6 + k, RTC[0]); }
          }
        }
        // stone jutting out of the face
        if (hh(tx, ty, 249 + side) < 0.4) {
          const sy = (top ? 10 : 3) + Math.floor(hh(tx, ty, 250) * (top ? 3 : 9)), pe = P.peb, sw = 3 + Math.floor(hh(tx, ty, 251) * 2);
          for (let yy = 0; yy < 3; yy++) for (let xx = -1; xx < sw - 1; xx++) {
            if ((yy === 0 || yy === 2) && (xx === -1 || xx === sw - 2)) continue;
            put(xx, sy + yy, yy === 0 ? pe[0] : yy === 1 ? (xx < 1 ? pe[1] : pe[2]) : pe[3]);
          }
        }
        // outline the outer silhouette of what was added
        const lit = [];
        for (let y = 0; y < tmp.h; y++) for (let x = 0; x < tmp.w; x++) if (tmp.get(x, y)) lit.push([x, y]);
        if (!lit.length) return;
        tmp.selout(P.out);
        for (let y = 0; y < tmp.h; y++) for (let x = 0; x < tmp.w; x++) {
          const c = tmp.get(x, y);
          if (!c) continue;
          const wx = E + side * (x - ox), wy = yT + y - 1;
          if (wx < 0 || wy < 0 || wx >= W.w || wy >= W.h) continue;
          const solid = W.mask[wy * W.w + wx];
          if (c === P.out && solid) continue;       // never outline over the soil itself
          O2.set(wx, wy, c);
        }
      });
    }
  });

  // Forest ruins: ivy - curving stems with 2x2 leaf clusters in two greens.
  POST.push(function vines(W) {
    if (W.stoneStyle !== 'ruin') return;
    const m = W.P.moss, O2 = W.over;
    for (let x = 1; x < W.w - 1; x++) {
      if (hh(x, 3, 401) > 0.035) continue;
      let y0 = -1;
      for (let y = 1; y < W.h; y++) { const i = y * W.w + x; if (W.mask[i] && W.dUp[i] === 0 && W.tp(x, y) === 'B') { y0 = y; break; } }
      if (y0 < 0) continue;
      const len = 14 + Math.floor(hh(x, 4, 402) * 40), amp = 1.5 + hh(x, 5, 404) * 2.5, fq = 0.12 + hh(x, 6, 405) * 0.1;
      let px = x;
      for (let k = 0; k < len; k++) {
        const yy = y0 + 1 + k;
        if (yy >= W.h || !W.solidPx(px, yy) || W.tp(px, yy) === 'G' || W.tp(px, yy) === 'n') break;
        const xx = x + Math.round(Math.sin(k * fq + x) * amp);
        // keep the stem connected when it steps sideways
        if (Math.abs(xx - px) > 0) O2.set(px, yy, m[4]);
        O2.set(xx, yy, m[3]);
        px = xx;
        if (k % 4 === 2 && k < len - 2) {
          const sd = (k >> 2) % 2 ? 1 : -1, lx = xx + (sd > 0 ? 1 : -2), ly = yy - 1;
          O2.set(lx, ly, m[1]); O2.set(lx + 1, ly, m[sd > 0 ? 2 : 1]); O2.set(lx, ly + 1, m[2]); O2.set(lx + 1, ly + 1, m[3]);
        }
      }
    }
  });

  // Forest logs: hanging moss beneath and a sprouting leaf or two on top.
  POST.push(function logMoss(W) {
    if (W.theme !== 'forest') return;
    const m = W.P.moss, O2 = W.over;
    for (let ty = 0; ty < W.th; ty++) for (let tx = 0; tx < W.tw; tx++) {
      if (W.tl(tx, ty) !== 'P') continue;
      for (let px = 1; px < 12; px++) {
        const x = tx * T + px;
        if (hh(x, ty, 501) < 0.22) {
          const len = 1 + Math.floor(hh(x, ty, 502) * 5);
          for (let k = 0; k < len; k++) O2.set(x, ty * T + 10 + k, k === len - 1 ? m[4] : m[2 + (k & 1)]);
        }
      }
      if (hh(tx, ty, 503) < 0.5) {
        const x = tx * T + 4 + Math.floor(hh(tx, ty, 504) * 7), y = ty * T - 1;
        O2.set(x, y, m[2]); O2.set(x, y - 1, m[1]); O2.set(x - 1, y - 2, m[0]); O2.set(x + 1, y - 2, m[1]); O2.set(x - 2, y - 2, m[2]);
      }
    }
  });

  // Village extras: roof eaves overhang, pediment acroteria, bougainvillea, potted plants.
  POST.push(function archOver(W) {
    const O2 = W.over;
    W.comps.forEach((c) => {
      if (c.grp === 'roof') {
        const x0 = c.x0 * T, x1 = (c.x1 + 1) * T - 1, yb = (c.y1 + 1) * T - 1;
        for (let k = 1; k <= 3; k++) {
          [x0 - k, x1 + k].forEach((xx, si) => {
            O2.set(xx, yb - 2, k === 3 ? OUT : TERRA[si ? 3 : 1]);
            O2.set(xx, yb - 1, k === 3 ? OUT : TERRA[si ? 4 : 3]);
            O2.set(xx, yb, OUT);
            if (k < 3) O2.set(xx, yb - 3, OUT);
          });
        }
      }
      if (c.grp === 'ped') {
        const x0 = c.x0 * T, x1 = (c.x1 + 1) * T - 1, y0 = c.y0 * T + 2, cx = Math.round((x0 + x1) / 2);
        // gold palmette on the apex and the corners
        const palm = (px, py) => {
          const pts = [[0, -4, 0], [-1, -3, 1], [1, -3, 2], [0, -3, 0], [-2, -2, 1], [2, -2, 2], [-1, -2, 1], [0, -2, 1], [1, -2, 2], [-1, -1, 2], [0, -1, 1], [1, -1, 3], [0, 0, 3]];
          pts.forEach(([dx, dy, k]) => O2.set(px + dx, py + dy, GOLD[k]));
          O2.set(px - 2, py - 3, OUT); O2.set(px + 2, py - 3, OUT); O2.set(px, py - 5, OUT);
        };
        palm(cx, y0 + 1);
        palm(x0 + 3, (c.y1 + 1) * T - 1);
        palm(x1 - 3, (c.y1 + 1) * T - 1);
      }
      if (c.grp === 'house') {
        const x0 = c.x0 * T, x1 = (c.x1 + 1) * T - 1, yT = c.y0 * T, yB = (c.y1 + 1) * T;
        const r = rngOf(c.id * 31 + c.x0);
        for (let ty = c.y0; ty <= c.y1; ty++) for (let tx = c.x0; tx <= c.x1; tx++) if (W.tl(tx, ty) === 'w') drawVillageWindow(W, tx, ty);
        houseExtras(W, c, r);
        // bougainvillea draping from the eave on one corner (blobby shaded clusters)
        const right = (c.x0 % 2 === 1) !== (r() < 0.2);
        const fl = ['#ffb3e6', '#ff6fc8', '#e0409c', '#a82577', '#6e1a55'];
        const lv = ['#86cf52', '#4f9c43', '#2c6a3c'];
        const blobs = [];
        const bx0 = right ? x1 - 4 : x0 + 4, dir = right ? -1 : 1;
        for (let k = 0; k < 9; k++) {
          const along = k < 5 ? k * 4.5 : 3 + r() * 5;
          const down = k < 5 ? r() * 3 : 6 + (k - 5) * 5 + r() * 3;
          blobs.push([bx0 + dir * along + (r() - 0.5) * 2, yT + 3 + down, 2.2 + r() * 1.6]);
        }
        const tmp = new O.Pix(40, 44), ox = right ? x1 - 30 : x0 - 6, oy = yT - 2;
        blobs.forEach(([bx, by, br]) => {
          for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) {
            const dx = xx / br, dy = yy / (br * 0.85), d = dx * dx + dy * dy;
            if (d > 1 + (hh(Math.round(bx) + xx, Math.round(by) + yy, 7) - 0.5) * 0.5) continue;
            const n = -(dx * 0.6 + dy * 0.8) + (1 - d) * 0.3;
            const c = n > 0.45 ? fl[0] : n > 0.05 ? fl[1] : n > -0.35 ? fl[2] : fl[3];
            tmp.set(Math.round(bx - ox + xx), Math.round(by - oy + yy), c);
          }
        });
        for (let k = 0; k < 18; k++) {
          const [bx, by, br] = blobs[Math.floor(r() * blobs.length)];
          const xx = Math.round(bx - ox + (r() - 0.5) * br * 2.4), yy = Math.round(by - oy + (r() - 0.3) * br * 2);
          tmp.set(xx, yy, lv[Math.floor(r() * 3)]); if (r() < 0.5) tmp.set(xx + 1, yy, lv[2]);
        }
        // woody vine stem down the corner
        for (let yy = 4; yy < 36; yy++) { const xx = Math.round(bx0 - ox + Math.sin(yy * 0.5) * 1.2); if (!tmp.get(xx, yy)) tmp.set(xx, yy, yy % 5 ? '#6b4a3a' : '#8a6448'); }
        tmp.selout(fl[4]);
        O2.pix(tmp, ox, oy);
        // one patch of fallen plaster exposing the stones beneath
        if (r() < 0.75) {
          const pw = 9 + Math.floor(r() * 5), ph = 5 + Math.floor(r() * 3);
          let px0 = x0 + 6 + Math.floor(r() * (x1 - x0 - 12 - pw));
          const py0 = yT + 14 + Math.floor(r() * Math.max(1, yB - yT - 34));
          let ok = true;
          for (let yy = py0 - 1; yy < py0 + ph + 1; yy++) for (let xx = px0 - 1; xx < px0 + pw + 1; xx++) if (W.tp(xx, yy) !== 'H') ok = false;
          if (ok) {
            const inP = (xx, yy) => { const dx = (xx + 0.5 - px0 - pw / 2) / (pw / 2), dy = (yy + 0.5 - py0 - ph / 2) / (ph / 2); return dx * dx + dy * dy + (hh(xx, yy, 71) - 0.5) * 0.35 < 1; };
            for (let yy = py0 - 1; yy <= py0 + ph; yy++) for (let xx = px0 - 1; xx <= px0 + pw; xx++) {
              if (!inP(xx, yy)) { if (inP(xx - 1, yy - 1)) O2.set(xx, yy, STUCCO[0]); continue; }
              if (!inP(xx - 1, yy) || !inP(xx, yy - 1)) { O2.set(xx, yy, '#a8958f'); continue; }
              const row = Math.floor((yy - py0) / 3), sx = (xx - px0 + (row % 2) * 2) % 5, sy = (yy - py0) % 3;
              O2.set(xx, yy, sy === 2 || sx === 4 ? '#9a847c' : sy === 0 && sx < 2 ? '#ead6bb' : (row + Math.floor((xx - px0) / 5)) % 3 ? '#d1b797' : '#c2a386');
            }
          }
        }
        // terracotta pot with a basil/geranium plant beside the door
        let dx = -1;
        for (let tx = c.x0; tx <= c.x1; tx++) if (W.tl(tx, c.y1) === 'd') dx = tx;
        if (dx >= 0) {
          const px = dx * T + 18, py = yB - 1;
          for (let yy = 0; yy < 6; yy++) for (let xx = -3; xx <= 3; xx++) {
            const wdt = yy < 1 ? 3 : yy < 5 ? 3 - (yy > 3 ? 1 : 0) : 2;
            if (Math.abs(xx) > wdt) continue;
            let col = xx < -1 ? TERRA[1] : xx < 2 ? TERRA[2] : TERRA[3];
            if (yy === 0) col = TERRA[0];
            if (yy === 1) col = TERRA[4];
            if (Math.abs(xx) === wdt) col = OUT;
            O2.set(px + xx, py - 5 + yy, col);
          }
          O2.set(px - 2, py, OUT); O2.set(px + 2, py, OUT);
          for (let k = 0; k < 26; k++) {
            const a = r() * Math.PI, d = r() * 5;
            const xx = Math.round(px + Math.cos(a) * d * 1.1), yy = Math.round(py - 7 - Math.sin(a) * d);
            O2.set(xx, yy, k % 5 === 0 ? '#ff4d5e' : lv[xx < px ? 0 : 1]);
          }
        }
      }
    });
  });

  // Cave: pebbles and rubble on the lit floor lip, small tapered stalactites under the ceiling.
  POST.push(function caveOver(W) {
    if (W.theme !== 'cave') return;
    const R = W.P.rock, O2 = W.over;
    for (let x = 0; x < W.w; x++) {
      // floor: find the lip
      for (let y = 1; y < W.h; y++) {
        const i = y * W.w + x;
        if (!W.mask[i] || W.dUp[i] !== 0 || W.mask[i - W.w]) continue;
        if (y < W.h / 2) break;
        const nearWall = W.solidPx(x - 10, y - 6) || W.solidPx(x + 10, y - 6);
        if (hh(x, y, 301) < (nearWall ? 0.16 : 0.035)) {
          const big = hh(x, y, 302) < (nearWall ? 0.6 : 0.3), rw = big ? 4 : 2, rh = big ? 3 : 2;
          const p = new O.Pix(rw + 2, rh + 2);
          for (let yy = 0; yy < rh; yy++) for (let xx = 0; xx < rw; xx++) {
            if (big && yy === 0 && (xx === 0 || xx === rw - 1)) continue;
            p.set(1 + xx, 1 + yy, yy === 0 ? LIP_C[0] : xx < rw / 2 ? LIP_C[1] : R[3]);
          }
          p.selout(W.P.out);
          for (let yy = 0; yy < p.h; yy++) for (let xx = 0; xx < p.w; xx++) {
            const c = p.get(xx, yy), wx = x + xx - 1, wy = y - rh + yy - (big ? 0 : 1) + 1;
            if (c && !(c === W.P.out && W.solidPx(wx, wy))) O2.set(wx, wy, c);
          }
          x += rw;
        }
        break;
      }
      // ceiling: tiny tapered stalactites
      for (let y = W.h - 2; y > 0; y--) {
        const i = y * W.w + x;
        if (!W.mask[i] || W.dDn[i] !== 0 || W.mask[i + W.w]) continue;
        if (y > W.h / 2) break;
        if (hh(x, y, 311) < 0.07) {
          const len = 3 + Math.floor(hh(x, y, 312) * 6);
          for (let k = 0; k < len; k++) {
            const wdt = k < len * 0.35 ? 3 : k < len * 0.75 ? 2 : 1;
            for (let j = 0; j < wdt; j++) O2.set(x + j, y + 1 + k, wdt === 1 ? R[2] : j === 0 ? R[2] : j === wdt - 1 ? R[5] : R[4]);
            O2.set(x + wdt, y + 1 + k, W.P.out);
            if (k === len - 1) O2.set(x, y + 2 + k, W.P.out);
          }
          x += 3;
        }
        break;
      }
    }
  });

  /* =====================================================================================
     Level cache + O.Tiles integration
     ===================================================================================== */
  const worldCache = [];
  function worldFor(theme, lvl) {
    const sig = theme + '|' + (lvl.id || '') + '|' + lvl.w + '|' + lvl.tiles.map((r) => r.join('')).join('');
    for (let i = 0; i < worldCache.length; i++) if (worldCache[i].sig === sig) return worldCache[i].W;
    const W = makeWorld(theme, lvl.w, lvl.h, (x, y) => lvl.tiles[y][x], lvl.def);
    W.baseC = W.base.canvas(); W.overC = W.over.canvas(); W.frontC = W.front.canvas();
    worldCache.unshift({ sig, W });
    if (worldCache.length > 6) worldCache.pop();
    return W;
  }
  let scratch = null;
  let curTheme = 'village';

  O.ART_INITS.push(function initWorld() {
    const Tl = O.Tiles;
    const origGet = Tl.get.bind(Tl), origDecor = Tl.decor.bind(Tl);
    Object.keys(DIRT3).forEach((k) => { if (Tl.THEMES && Tl.THEMES[k]) Tl.THEMES[k].dirt = DIRT3[k].slice(); });
    scratch = O.makeCanvas(T, T);
    const sg = scratch.getContext('2d');

    Tl.handlesEdges = true;
    Tl.getCtx = function (theme, ch, x, y, lvl) {
      curTheme = theme;
      if (!PX[ch]) return null;
      const W = worldFor(theme, lvl);
      sg.clearRect(0, 0, T, T);
      sg.drawImage(W.baseC, x * T, y * T, T, T, 0, 0, T, T);
      return scratch;
    };
    Tl.overlay = function (lvl, back, front) {
      const W = worldFor(lvl.theme, lvl);
      back.drawImage(W.overC, 0, 0);
      front.drawImage(W.frontC, 0, 0);
    };

    // Context-free tiles (story scenes, fallbacks): painted from a small virtual scene.
    const miniCache = {};
    function mini(theme) {
      if (miniCache[theme]) return miniCache[theme];
      const rows = ['........', 'GGGGGGGG', 'DDDDDDDD', 'DDDDDDDD'];
      const W = makeWorld(theme, 8, 4, (x, y) => rows[y][x]);
      miniCache[theme] = { W, base: W.base.canvas(), over: W.over.canvas() };
      return miniCache[theme];
    }
    const getCache = {};
    Tl.get = function (theme, ch, variant, extra) {
      if (ch !== 'G' && ch !== 'D' && ch !== 'q') return origGet(theme, ch, variant, extra);
      const key = theme + ch + (variant || 0);
      if (getCache[key]) return getCache[key];
      const m = mini(theme), c = O.makeCanvas(T, T);
      const row = ch === 'G' ? 1 : ch === 'D' ? 2 : 3;
      c.getContext('2d').drawImage(m.base, (2 + ((variant || 0) % 4)) * T, row * T, T, T, 0, 0, T, T);
      return (getCache[key] = c);
    };
    Tl.tuft = function (theme, v) {
      const key = 'tuft' + theme + (v || 0);
      if (getCache[key]) return getCache[key];
      const m = mini(theme), c = O.makeCanvas(T, 4);
      c.getContext('2d').drawImage(m.over, (2 + ((v || 0) % 4)) * T, T - 4, T, 4, 0, 0, T, 4);
      return (getCache[key] = c);
    };

    // Decorations are theme-aware: explicit argument > story scene being shown > level being rendered.
    const SCENE_THEME = { orpheus: 'village', lovers: 'village', serpent: 'forest', hades: 'cave', oath: 'village' };
    function contextTheme() {
      const g = O.game;
      if (g && g.state === 'story' && O.STORY) {
        const pg = O.STORY[g.page] || O.STORY[0];
        if (pg && SCENE_THEME[pg.scene]) return SCENE_THEME[pg.scene];
      }
      if (g && (g.state === 'title' || g.state === 'press')) return 'village';
      return curTheme;
    }
    const decoCache = {};
    Tl.decor = function (type, seed, theme) {
      const fn = DECOR[type];
      if (!fn) return origDecor(type, seed);
      const th = SHARED_DECOR[type] ? (theme || contextTheme()) : '';
      const key = type + ':' + (seed || 0) + ':' + th;
      if (decoCache[key]) return decoCache[key];
      const sd0 = Math.abs(seed || 0), iseed = Number.isInteger(sd0) ? sd0 : Math.round(sd0 * 10);
      const pix = fn(rngOf(iseed * 7 + type.length * 131), th || curTheme, iseed);
      return (decoCache[key] = { c: pix.canvas(), w: pix.w, h: pix.h });
    };
    if (O.renderLevel && !O.renderLevel.__world) {
      const orig = O.renderLevel;
      O.renderLevel = function (lvl) { curTheme = lvl.theme; return orig.apply(this, arguments); };
      O.renderLevel.__world = true;
    }

    if (DECOR.__statue) O.registerSprite('statue', DECOR.__statue(), STATUE_ANCHOR);
    O.drawLightProp = drawLightProp;
  });

  /* =====================================================================================
     Decorations — every sprite lit from the upper-left, coloured sel-out outlines
     ===================================================================================== */
  const DECOR = {};
  const SHARED_DECOR = { bush: 1, grass: 1, flowers: 1, rocks: 1, oak: 1 };
  const STATUE_ANCHOR = {};

  // Foliage renderer: overlapping leaf clumps (spheres), each lit from the upper-left, with leafy
  // broken edges, contact shadows between clumps, clustered leaf texture and optional see-through gaps.
  function foliage(p, blobs, ramp, seed, o) {
    o = o || {};
    const n = ramp.length;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, cx = 0, cy = 0;
    blobs.forEach((b) => {
      b.ry = b.ry || b.r;
      x0 = Math.min(x0, b.x - b.r - 2); x1 = Math.max(x1, b.x + b.r + 2);
      y0 = Math.min(y0, b.y - b.ry - 2); y1 = Math.max(y1, b.y + b.ry + 2);
      cx += b.x; cy += b.y;
    });
    cx /= blobs.length; cy /= blobs.length;
    const R = Math.max(x1 - x0, y1 - y0) / 2;
    const sx = o.sx || 0.55, sy = o.sy || 0.55;
    for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
      let best = -1e9, bd = null, cover = 0;
      const edgeN = (vnoise(x * 0.7, y * 0.7, seed) - 0.5) * (o.edge || 0.55);
      for (let k = 0; k < blobs.length; k++) {
        const b = blobs[k];
        const dx = (x + 0.5 - b.x) / b.r, dy = (y + 0.5 - b.y) / b.ry, d = dx * dx + dy * dy;
        if (d > 1 + edgeN) continue;
        cover++;
        const hgt = (b.z || 0) + Math.sqrt(Math.max(0, 1 - d)) * b.r;
        if (hgt > best) { best = hgt; bd = [dx, dy, d]; }
      }
      if (!bd) continue;
      if (o.holes && bd[2] > 0.45 && vnoise(x * 0.4, y * 0.4, seed + 5) < o.holes) continue;
      const dx = bd[0], dy = bd[1], d = bd[2];
      const nz = Math.sqrt(Math.max(0, 1 - d));
      let v = -(dx * 0.55 + dy * 0.75) * 0.8 + nz * 0.3;
      v += -((x - cx) / R * 0.3 + (y - cy) / R * 0.5) * (o.global || 1);
      v += (vnoise(x * sx, y * sy, seed + 9) - 0.5) * (o.tex || 0.6);
      if (cover > 1 && d > 0.62) v -= 0.35;
      let idx = Math.round((0.72 - v) / 1.55 * (n - 1));
      idx = clamp(idx, 0, n - 1);
      if (!p.in(x, y)) continue;
      p.set(x, y, ramp[idx]);
    }
  }
  // Cylinder-shaded limb / branch (thin wrapper so every trunk uses the same light).
  const limb = (p, a, b, r0, r1, ramp) => p.capsule(a[0], a[1], b[0], b[1], r0, r1, ramp);

  const LEAF = {
    olive: ['#eef3c8', '#c3d49a', '#95ae74', '#6c865c', '#4d6350', '#334340'],
    cypress: ['#a6cf6e', '#6aa457', '#437f4f', '#2e5f48', '#20443d', '#152c2e'],
    oakDay: ['#dff29a', '#a2d468', '#6bb055', '#468550', '#2f5f49', '#1e3f3b'],
    oakNight: ['#c9e690', '#8cc66e', '#5d9f63', '#40775d', '#2c5452', '#1c3641'],
    bushDay: ['#e6f7a0', '#a9dc66', '#6fbb4f', '#46904a', '#2f6645', '#1f4338'],
    bushNight: ['#c1e38c', '#82bf6c', '#559a62', '#3a7159', '#294f4d', '#1b343d']
  };
  const BARK = {
    olive: ['#ddd0ba', '#ae9d87', '#817064', '#594b4e', '#392f39'],
    oak: ['#a88d7a', '#7f6660', '#5c4750', '#40313f', '#271e2b'],
    wood: ['#e0b183', '#b27f58', '#845a43', '#5b3e37', '#37262a']
  };

  // Olive foliage: thin horizontal wispy layers (not spheres), silver-green, darker undersides,
  // leaf texture from 2x1 angled dashes, ragged spray tips on the edges.
  const OLV = ['#d2d9b4', '#9fae88', '#6c7e68', '#46554f'];
  function olivePad(p, cx, cy, rx, ry, seed, back) {
    const sh1 = back ? 1 : 0;
    // a layer = several overlapping flat lobes -> irregular, cloud-like but horizontal
    const n = Math.max(2, Math.round(rx / 4.5)), subs = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      subs.push([cx - rx + 2 * rx * t + (hh(i, seed, 1) - 0.5) * 3, cy + (hh(i, seed, 2) - 0.5) * 2 - Math.sin(t * Math.PI) * ry * 0.35, (rx / n) * 1.55, ry * (0.65 + hh(i, seed, 3) * 0.45)]);
    }
    const x0 = Math.floor(cx - rx - 4), x1 = Math.ceil(cx + rx + 4), y0 = Math.floor(cy - ry * 2 - 2), y1 = Math.ceil(cy + ry + 2);
    const inside = (x, y) => subs.some(([sx, sy, a, b]) => {
      const dx = (x + 0.5 - sx) / a, dy = (y + 0.5 - sy) / b;
      return dx * dx + dy * dy <= 1 + (vnoise(x * 0.7, y * 0.5, seed) - 0.5) * 0.45;
    });
    for (let x = x0; x <= x1; x++) {
      let top = -1, bot = -1;
      for (let y = y0; y <= y1; y++) if (inside(x, y)) { if (top < 0) top = y; bot = y; }
      if (top < 0) continue;
      const dxn = (x + 0.5 - cx) / rx;
      for (let y = top; y <= bot; y++) {
        if (!inside(x, y)) continue;
        const a = y - top, b = bot - y;
        let k = a < 2 ? 0 : a < 4 ? 1 : 2;
        if (b < 2) k = 3; else if (b < 3 && k < 2) k = 2;
        if (k === 0 && dxn > 0.55) k = 1;
        if (dxn > 0.85 && k < 3) k++;
        // leaf texture: 2x1 angled dashes of the neighbouring tone
        const q = x + (y & 1) * 2;
        if (hh(q >> 2, y, seed + 7) < 0.45 && (q & 3) < 2) k = k === 1 ? 0 : k === 2 ? 1 : k;
        p.set(x, y, OLV[Math.min(3, k + sh1)]);
      }
      // spray tips poking out above the lit top and below
      if (hh(x, top, seed + 3) < 0.2) p.set(x + (dxn < 0 ? -1 : 1), top - 1, OLV[Math.min(3, 1 + sh1)]);
      if (hh(x, bot, seed + 4) < 0.15) p.set(x, bot + 1, OLV[3]);
    }
  }
  DECOR.olive = function (r, th, seed) {
    const p = new O.Pix(64, 64), B = BARK.olive, bx = 32;
    const J = () => Math.round((r() - 0.5) * 4);
    const lean = seed % 2 ? 1 : -1;
    // gnarled double trunk with a hollow, roots, twisted limbs reaching into the layers
    limb(p, [bx - 7, 63], [bx - 2, 57], 1.4, 2.6, B);
    limb(p, [bx + 9, 63], [bx + 3, 57], 1.4, 2.6, B);
    limb(p, [bx - 2, 63], [bx - 4 + lean, 47], 3.8, 3.0, B);
    limb(p, [bx + 3, 63], [bx + 2 + lean, 45], 3.4, 2.8, B);
    limb(p, [bx - 4 + lean, 47], [bx + 1, 35], 2.9, 2.2, B);
    limb(p, [bx + 2 + lean, 45], [bx + 10, 34], 2.6, 1.8, B);
    const tA = [bx + 2 + J(), 17 + J()], tB = [bx - 13 + J(), 27 + J()], tC = [bx + 19 + J(), 26 + J()];
    limb(p, [bx + 1, 35], tB, 1.9, 1.0, B);
    limb(p, [bx + 1, 36], tA, 1.8, 1.0, B);
    limb(p, [bx + 10, 34], tC, 1.6, 0.9, B);
    limb(p, [bx - 4 + lean, 47], [bx - 18, 37], 1.6, 0.9, B);
    limb(p, [bx + 10, 34], [bx + 12, 29], 1.1, 0.7, B);
    p.ellipse(bx, 52, 1.2, 2.2, B[4]); p.set(bx - 1, 50, B[3]);
    [[bx - 3, 58], [bx + 4, 53], [bx - 1, 42]].forEach(([x, y]) => p.set(x, y, B[3]));
    // layers: 1-2 big masses and 3-4 small tufts, back ones darker
    const s0 = seed * 13 + 1;
    olivePad(p, tB[0] + 1, tB[1] - 5, 9, 3.2, s0 + 1, true);
    olivePad(p, tA[0] + 6, tA[1] - 6, 9, 3.4, s0 + 8, true);
    olivePad(p, bx - 19, 36, 6 + (seed % 3), 2.8, s0 + 2, false);
    olivePad(p, tC[0], tC[1] - 1, 8, 3.6, s0 + 3, false);
    olivePad(p, tA[0] - 2, tA[1], 15, 5.5, s0 + 4, false);
    olivePad(p, tB[0] + 2, tB[1] + 1, 11 + (seed % 2) * 2, 4.6, s0 + 5, false);
    olivePad(p, bx + 12, 32, 5, 2.6, s0 + 6, false);
    if (seed % 3 !== 1) olivePad(p, tA[0] - 4, tA[1] - 8, 6, 2.8, s0 + 7, false);
    // a few dark olives hanging under the layers
    for (let k = 0, n = 0; k < 60 && n < 7; k++) {
      const x = 8 + Math.floor(r() * 48), y = 12 + Math.floor(r() * 26);
      if (p.get(x, y) === OLV[3] && !p.get(x, y + 1)) { p.set(x, y + 1, '#4a2e52'); p.set(x, y + 2, '#2e1d36'); n++; }
    }
    p.selout('#2c3134');
    return p;
  };

  DECOR.cypress = function (r, th, seed) {
    const H = 60 + Math.floor(r() * 14), p = new O.Pix(22, H + 3), cx = 11;
    const lean = (r() - 0.5) * 3;
    const blobs = [];
    const N = 17;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const prof = t < 0.14 ? 0.72 + t * 2 : Math.pow(1 - (t - 0.14) / 0.86, 0.85);
      const rad = 1.1 + 6.2 * prof;
      blobs.push({ x: cx + lean * t * t + (r() - 0.5) * 1.6, y: H - 5 - t * (H - 8), r: rad * (0.85 + r() * 0.3), ry: rad * 1.35, z: r() * 1.5 });
    }
    // trunk peeking out at the base
    limb(p, [cx, H + 2], [cx, H - 5], 1.6, 1.3, BARK.oak);
    foliage(p, blobs, LEAF.cypress, seed * 5 + 3, { edge: 0.6, sx: 0.8, sy: 0.35, tex: 0.75, global: 0.7 });
    p.selout('#101c1f');
    return p;
  };

  // Canopy built from a few large masses. Each mass is shaded as ONE form (light from the upper-left,
  // 4 flat bands); small leaf-clump cells only perturb the band borders so they read as clusters,
  // front masses cast a shadow on the masses behind, optional see-through gaps and a moon rim.
  function canopy(masses, W2, H2, ramp, o) {
    o = o || {};
    const c = new O.Pix(W2, H2), own = new Int8Array(W2 * H2).fill(-1);
    const cell = o.cell || 5;
    const inside = (m, x, y) => {
      const dx = (x + 0.5 - m.x) / m.rx, dy = (y + 0.5 - m.y) / m.ry;
      const ang = Math.atan2(dy, dx), wob = 1 + (vnoise(ang * 2.2 + m.x, m.y * 0.1, o.seed || 1) - 0.5) * 0.28 + Math.sin(ang * (m.lobes || 7) + m.x) * 0.06;
      return dx * dx + dy * dy <= wob * wob ? [dx, dy] : null;
    };
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      let best = -1, bd = null;
      for (let k = 0; k < masses.length; k++) { const q = inside(masses[k], x, y); if (q) { best = k; bd = q; } } // later masses are in front
      if (best < 0) continue;
      own[y * W2 + x] = best;
      const m = masses[best];
      // leaf-clump cells: each cell a tiny dome, lit from the upper-left
      const gx = (x + ((Math.floor(y / cell) & 1) ? cell / 2 : 0)) / cell, gy = y / (cell * 0.8);
      const fx = gx - Math.floor(gx) - 0.5, fy = gy - Math.floor(gy) - 0.5;
      const clump = (0.25 - (fx * fx + fy * fy)) * 0.9 - (fx * 0.6 + fy * 0.8) * 0.45;
      let v = -(bd[0] * 0.62 + bd[1] * 0.78) * 0.95 + clump * 0.55 + (m.lift || 0);
      v += (vnoise(x * 0.18, y * 0.18, (o.seed || 1) + 3) - 0.5) * 0.35;
      let k = v > 0.5 ? 0 : v > 0.02 ? 1 : v > -0.5 ? 2 : 3;
      if (m.back) k = Math.min(3, k + 1);
      c.set(x, y, k);
    }
    // cast shadow of front masses onto the ones behind (down-right), flat one band
    const out = new O.Pix(W2, H2);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      let k = c.get(x, y);
      if (k === null) continue;
      const me = own[y * W2 + x];
      for (let s = 1; s <= 3; s++) {
        const xx = x - s, yy = y - s;
        if (xx < 0 || yy < 0) break;
        const o2 = own[yy * W2 + xx];
        if (o2 > me) { k = Math.min(3, k + 1); break; }
      }
      out.set(x, y, k);
    }
    // leaf-cluster texture: small 2-3 px sprays of the next lighter band, only in the lit zone
    const sd = o.seed || 1;
    for (let gy = 0; gy < H2; gy += 4) for (let gx = -4; gx < W2; gx += 5) {
      const x = gx + ((gy >> 2) & 1 ? 2 : 0) + Math.floor(hh(gx, gy, sd + 31) * 3), y = gy + Math.floor(hh(gx, gy, sd + 32) * 2);
      const k = out.get(x, y);
      if (k === null || k < 1 || k > 2 || hh(gx, gy, sd + 33) > (k === 1 ? 0.8 : 0.35)) continue;
      const kk = k - 1;
      [[0, 0], [1, 0], [-1, 1], [0, 1]].forEach(([dx, dy]) => { const q = out.get(x + dx, y + dy); if (q !== null && q >= k) out.set(x + dx, y + dy, kk); });
      const q = out.get(x + 1, y + 1); if (q !== null && q === k) out.set(x + 1, y + 1, Math.min(3, k + 1));
    }
    // see-through gaps: irregular holes; the foliage just above a gap is leaf underside (darkest band)
    (o.holes || []).forEach(([hx, hy, hr]) => {
      for (let y = Math.floor(hy - hr - 3); y <= hy + hr + 2; y++) for (let x = Math.floor(hx - hr * 1.6 - 2); x <= hx + hr * 1.6 + 2; x++) {
        if (out.get(x, y) === null) continue;
        const d1 = Math.hypot((x + 0.5 - hx) / (hr * 1.3), (y + 0.5 - hy) / hr), d2 = Math.hypot((x + 0.5 - hx - hr * 0.9) / hr, (y + 0.5 - hy - hr * 0.4) / (hr * 0.8));
        const d = Math.min(d1, d2) + (vnoise(x * 0.5, y * 0.5, 17) - 0.5) * 0.35;
        if (d < 1) out.set(x, y, -1);
        else if (d < 1.5 && y < hy) out.set(x, y, 3);
      }
    });
    // resolve band -> colour, moon rim on upper-left outer edges of the top masses
    const res = new O.Pix(W2, H2);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const k = out.get(x, y);
      if (k === null || k < 0) continue;
      let col = ramp[k];
      if (o.rim) {
        const openUL = out.get(x - 1, y) === null || out.get(x, y - 1) === null || out.get(x - 1, y - 1) === null;
        const m = masses[own[y * W2 + x]];
        if (openUL && !m.back && k <= 1 && (x + 0.5 - m.x) / m.rx + (y + 0.5 - m.y) / m.ry < -0.35 && y < (o.rimY || H2)) col = o.rim;
      }
      res.set(x, y, col);
    }
    return res;
  }

  DECOR.oak = function (r, th, seed) {
    const night = th === 'forest';
    const WD = 88, HT = 98, p = new O.Pix(WD, HT);
    const B = night ? ['#8d8698', '#665e72', '#4a4256', '#342c3f', '#261f2e'] : BARK.oak;
    const ramp = night ? ['#7fa592', '#4f7a6c', '#34544f', '#22343f'] : ['#d6ea8a', '#86bd5a', '#4f8a4a', '#2f5c43'];
    const v = seed % 4, bx = 44 + (v === 2 ? -4 : 0), base = HT - 1;
    const J = () => (r() - 0.5) * 4;
    let masses, holes, trunkTop, limbs;
    if (v === 1) { // tall and narrow
      trunkTop = [bx + 1, 54];
      masses = [
        { x: bx - 11 + J(), y: 54, rx: 13, ry: 11, back: true },
        { x: bx + 12 + J(), y: 46, rx: 12, ry: 11, back: true },
        { x: bx + 1 + J(), y: 44, rx: 18, ry: 15 },
        { x: bx + 7, y: 33, rx: 12, ry: 10 },
        { x: bx - 3 + J(), y: 23, rx: 15, ry: 14, lift: 0.1 }
      ];
      holes = [[bx - 7, 57, 2.4], [bx + 8, 52, 2]];
      limbs = [[[bx, 66], [bx - 11, 52], 2.6, 1.2], [[bx + 1, 64], [bx + 12, 47], 2.4, 1.1], [[bx, 58], [bx - 2, 32], 2.8, 1.2]];
    } else if (v === 2) { // wide and leaning
      trunkTop = [bx + 8, 58];
      masses = [
        { x: bx - 23 + J(), y: 52, rx: 15, ry: 10, back: true },
        { x: bx + 28 + J(), y: 46, rx: 15, ry: 11, back: true },
        { x: bx - 2 + J(), y: 46, rx: 23, ry: 14 },
        { x: bx - 18, y: 41, rx: 13, ry: 10 },
        { x: bx + 17, y: 36, rx: 18, ry: 13, lift: 0.1 }
      ];
      holes = [[bx - 12, 56, 2.6], [bx + 19, 51, 2.2]];
      limbs = [[[bx + 5, 68], [bx - 21, 50], 3, 1.2], [[bx + 7, 64], [bx + 27, 46], 2.8, 1.2], [[bx + 8, 60], [bx + 12, 38], 2.6, 1.2]];
    } else if (v === 3) { // broken top: two crowns, a dead snag between them
      trunkTop = [bx, 58];
      masses = [
        { x: bx - 16 + J(), y: 50, rx: 16, ry: 12, back: true },
        { x: bx + 18 + J(), y: 52, rx: 15, ry: 11, back: true },
        { x: bx + 15, y: 43, rx: 15, ry: 12 },
        { x: bx - 12, y: 40, rx: 17, ry: 13, lift: 0.1 }
      ];
      holes = [[bx - 8, 55, 2.4], [bx + 9, 56, 2.2]];
      limbs = [[[bx, 68], [bx - 15, 46], 3, 1.3], [[bx, 64], [bx + 16, 46], 2.8, 1.2], [[bx, 58], [bx + 2, 20], 2.6, 0.8], [[bx + 2, 28], [bx + 8, 21], 1, 0.6]];
    } else { // broad classic crown
      trunkTop = [bx, 56];
      masses = [
        { x: bx - 20 + J(), y: 50, rx: 15, ry: 11, back: true },
        { x: bx + 21 + J(), y: 46, rx: 15, ry: 11, back: true },
        { x: bx + 2 + J(), y: 42, rx: 25, ry: 17 },
        { x: bx + 14, y: 29, rx: 14, ry: 11, lift: 0.05 },
        { x: bx - 9, y: 27, rx: 17, ry: 13, lift: 0.12 }
      ];
      holes = [[bx - 13, 54, 2.6], [bx + 14, 51, 2.2]];
      limbs = [[[bx, 66], [bx - 19, 48], 3.2, 1.3], [[bx + 1, 64], [bx + 20, 44], 3, 1.2], [[bx, 58], [bx + 2, 34], 3, 1.3]];
    }
    // roots and trunk (slight lean towards trunkTop), limbs spreading into the crown
    limb(p, [bx - 10, base], [bx - 3, base - 9], 1.4, 3.4, B);
    limb(p, [bx + 11, base], [bx + 4, base - 9], 1.4, 3.4, B);
    limb(p, [bx + 1, base], trunkTop, 6, 4.2, B);
    limbs.forEach(([a, b2, r0, r1]) => limb(p, a, b2, r0, r1, B));
    // bark: vertical fissures in 2-3 px clusters, a knot hole in the darkest bark tone
    for (let y = trunkTop[1] + 8; y < base - 2; y++) for (let x = bx - 6; x <= bx + 7; x++) {
      const c = p.get(x, y);
      if (!c || c === B[0]) continue;
      if (vnoise(x * 0.9, y * 0.12, seed + 21) > 0.72) p.set(x, y, c === B[1] ? B[2] : B[3]);
    }
    const ky = base - 24 - (seed % 3) * 5, kx = bx + (v === 2 ? 3 : 1);
    p.ellipse(kx, ky, 1.3, 2, B[4]); p.set(kx - 1, ky - 2, B[3]); p.set(kx + 1, ky + 2, B[1]); p.set(kx + 2, ky + 1, B[2]);
    if (night) for (let k = 0; k < 5; k++) { // cool moss clusters on the shaded side
      const y = base - 6 - Math.floor(r() * 30), x = bx + 2 + Math.floor(r() * 4);
      if (p.get(x, y)) { p.set(x, y, '#4c6b60'); p.set(x + 1, y, '#3b574f'); p.set(x, y + 1, '#3b574f'); }
    }
    // twigs crossing the see-through gaps (hidden by leaves everywhere else)
    holes.forEach((h) => { h[2] += 1.2; const [hx, hy, hr] = h; limb(p, [hx - hr * 1.8, hy + hr * 0.9], [hx + hr * 1.6, hy - hr * 1.1], 1.1, 0.6, B); p.line(hx, hy, hx + 1, hy + hr + 1, B[3]); });
    const cn = canopy(masses, WD, HT, ramp, { seed: seed * 7 + 5, holes, rim: night ? '#a9c2e6' : '#f4f8c0', rimY: 40 });
    p.blit(cn, 0, 0);
    p.selout(OUT);
    return p;
  };

  DECOR.bush = function (r, th, seed) {
    const night = th === 'forest';
    const WD = 38, HT = 24, p = new O.Pix(WD, HT);
    const ramp = night ? ['#7fa592', '#4f7a6c', '#34544f', '#22343f'] : ['#d6ea8a', '#86bd5a', '#4f8a4a', '#2f5c43'];
    // 3-4 low domes; shape varies by seed (wide mound, tall clump, or two humps)
    const v = seed % 3, masses = [];
    if (v === 0) masses.push({ x: 9, y: 16, rx: 8, ry: 7, back: true }, { x: 28, y: 15, rx: 8, ry: 7, back: true }, { x: 18, y: 13, rx: 12, ry: 9 }, { x: 13, y: 9, rx: 7, ry: 6, lift: 0.1 });
    else if (v === 1) masses.push({ x: 12, y: 15, rx: 8, ry: 8, back: true }, { x: 24, y: 14, rx: 9, ry: 9 }, { x: 16, y: 8, rx: 8, ry: 7, lift: 0.1 });
    else masses.push({ x: 8, y: 16, rx: 7, ry: 6, back: true }, { x: 22, y: 16, rx: 12, ry: 7 }, { x: 11, y: 12, rx: 8, ry: 7, lift: 0.05 }, { x: 28, y: 12, rx: 6, ry: 5, lift: 0.1 });
    masses.forEach((m) => { m.x += Math.round((r() - 0.5) * 2); });
    const cn = canopy(masses, WD, HT, ramp, { seed: seed * 11 + 1, cell: 4, rim: night ? '#a9c2e6' : null });
    p.blit(cn, 0, 0);
    // cut flat at the ground line, soft contact shadow row
    for (let x = 0; x < WD; x++) { p.set(x, 23, null); if (p.get(x, 22)) p.set(x, 22, ramp[3]); }
    // blossoms in small clusters (day: white + pink; night: a few pale-blue bells)
    const fl = night ? ['#bfe6ff', '#7cb8e8'] : (seed % 2 ? ['#ffffff', '#ffc2de'] : ['#ffd6ea', '#ff7fb6']);
    const nf = night ? 3 : 6;
    let placed = 0;
    for (let k = 0; k < 40 && placed < nf; k++) {
      const x = 4 + Math.floor(r() * 30), y = 4 + Math.floor(r() * 12), c = p.get(x, y);
      if (!c || c === ramp[3] || !p.get(x, y - 1) || !p.get(x + 1, y + 1)) continue;
      p.set(x, y, fl[0]); p.set(x + 1, y, fl[1]); if (!night) p.set(x, y + 1, fl[1]);
      placed++;
    }
    p.selout(night ? OUT : '#1c3326');
    return p;
  };

  DECOR.grass = function (r, th) {
    const night = th === 'forest';
    const g = night ? PAL.forest.grass : PAL.village.grass;
    const p = new O.Pix(20, 14);
    for (let k = 0; k < 13; k++) {
      const x0 = 1 + Math.floor(r() * 18), hgt = 5 + Math.floor(r() * 9), bend = (r() - 0.5) * 5;
      for (let j = 0; j < hgt; j++) {
        const t = j / hgt, x = Math.round(x0 + bend * t * t), y = 13 - j;
        const c = t > 0.8 ? g[0] : t > 0.5 ? g[1] : t > 0.2 ? g[2] : g[3];
        p.set(x, y, c);
        if (j < hgt * 0.35) p.set(x + 1, y, g[4]);
      }
    }
    if (!night && r() < 0.8) { const x = 3 + Math.floor(r() * 14); p.set(x, 3, '#ffffff'); p.set(x - 1, 4, '#ffffff'); p.set(x + 1, 4, '#ffffff'); p.set(x, 4, '#ffd23f'); p.set(x, 5, '#ffffff'); }
    if (night && r() < 0.7) { const x = 3 + Math.floor(r() * 14); p.set(x, 4, '#c9f2ff'); p.set(x, 5, '#63b7e8'); }
    return p;
  };

  DECOR.flowers = function (r, th) {
    const night = th === 'forest';
    const p = new O.Pix(20, 12);
    const g = night ? PAL.forest.grass : PAL.village.grass;
    const kinds = night ? ['bell', 'bell', 'lav'] : ['poppy', 'daisy', 'lav', 'poppy'];
    for (let k = 0; k < 6; k++) {
      const x = 2 + Math.floor(r() * 16), hgt = 4 + Math.floor(r() * 6), kind = kinds[Math.floor(r() * kinds.length)];
      for (let j = 0; j < hgt; j++) p.set(x + (j > hgt - 3 && k % 2 ? 1 : 0), 11 - j, j < 2 ? g[3] : g[2]);
      const fx = x + (k % 2 ? 1 : 0), fy = 11 - hgt;
      if (kind === 'poppy') {
        p.set(fx, fy, '#ff6a4d'); p.set(fx - 1, fy, '#ff8a66'); p.set(fx + 1, fy, '#e0343a'); p.set(fx, fy - 1, '#ff8a66'); p.set(fx - 1, fy + 1, '#c92536'); p.set(fx + 1, fy + 1, '#a01c34'); p.set(fx, fy + 1, '#2a1a2a');
      } else if (kind === 'daisy') {
        p.set(fx, fy, '#ffd23f'); p.set(fx - 1, fy, '#ffffff'); p.set(fx + 1, fy, '#dcd8ec'); p.set(fx, fy - 1, '#ffffff'); p.set(fx, fy + 1, '#dcd8ec');
      } else if (kind === 'lav') {
        for (let j = 0; j < 4; j++) p.set(fx + (j % 2), fy - j + 1, j % 2 ? '#8d6ae0' : '#b89cff');
      } else {
        p.set(fx, fy, '#c9f2ff'); p.set(fx - 1, fy + 1, '#63b7e8'); p.set(fx + 1, fy + 1, '#3f7fcf'); p.set(fx, fy + 1, '#8fd4ff');
      }
      // a leaf on the stem
      p.set(x - 1, 11 - Math.floor(hgt / 3), g[2]);
    }
    return p;
  };

  // Faceted boulders (low-poly look), moss/grass at the foot.
  function boulder(p, cx, cy, rx, ry, ramp, seed) {
    const nF = 6, off = hh(seed, 1, 1) * 6.28;
    const lx = cx - rx * 0.28, ly = cy - ry * 0.32;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      const ang = Math.atan2(dy, dx);
      const bump = 1 + 0.12 * Math.cos(ang * 3 + off) + 0.06 * Math.cos(ang * 5 + off * 2);
      if (dx * dx + dy * dy > bump * bump || y > cy + ry * 0.75) continue;
      const tx = (x + 0.5 - lx) / rx, ty = (y + 0.5 - ly) / ry, td = Math.sqrt(tx * tx + ty * ty);
      let v;
      if (td < 0.42) v = 0.75;
      else {
        const fa = Math.floor(((Math.atan2(ty, tx) + off + 6.28) % 6.28) / (6.28 / nF));
        const fc = fa * (6.28 / nF) + 3.14 / nF - off;
        v = -(Math.cos(fc) * 0.6 + Math.sin(fc) * 0.8) * 0.8 + 0.05 + (hh(fa, seed, 3) - 0.5) * 0.25;
      }
      const n = ramp.length;
      const idx = clamp(Math.round((0.75 - v) / 1.6 * (n - 1)), 0, n - 1);
      p.set(x, y, ramp[idx]);
    }
  }
  DECOR.rocks = function (r, th, seed) {
    const ramp = th === 'cave' ? ['#f6c894', '#d99b69', '#b27652', '#875643', '#5f3b38', '#412632']
      : th === 'forest' ? ['#d9dde6', '#a8aec1', '#7c8299', '#565b74', '#3c3f56', '#282a3d']
        : ['#fbf4e6', '#ddd1c2', '#b3a5a3', '#857885', '#5f5569', '#403a4d'];
    const p = new O.Pix(30, 15);
    const big = 6.5 + r() * 2.5, v = seed % 3;
    boulder(p, v === 2 ? 15 : 10, 14 - big * 0.8, big, big * 0.75, ramp, seed * 3 + 1);
    if (v !== 2) boulder(p, 21 + Math.round(r() * 2), 10.5, 4.5 + r() * 2.5, 4, ramp, seed * 3 + 2);
    if (v !== 1) boulder(p, v === 2 ? 25 : 15, 12.5, 2.5 + r() * 2, 2.4, ramp, seed * 3 + 3);
    if (v === 2) boulder(p, 5, 12.5, 3, 2.4, ramp, seed * 3 + 4);
    p.selout(th === 'cave' ? '#1c1119' : '#211b2c');
    const g = th === 'forest' ? PAL.forest.moss : th === 'cave' ? null : PAL.village.grass;
    if (g) {
      for (let x = 1; x < 29; x++) if (r() < 0.45) { const h = 1 + Math.floor(r() * 3); for (let j = 0; j < h; j++) p.set(x, 14 - j, j === h - 1 ? g[1] : g[2]); }
      for (let k = 0; k < 6; k++) { const x = 3 + Math.floor(r() * 22), y = 3 + Math.floor(r() * 4); if (p.get(x, y) && p.get(x, y) !== '#211b2c') { p.set(x, y, g[1]); p.set(x + 1, y, g[2]); } }
    }
    return p;
  };

  DECOR.fence = function (r, th, seed) {
    const p = new O.Pix(24, 17), W2 = ['#e6d2b8', '#bca083', '#8f7563', '#655157', '#433843'];
    const posts = [2, 10, 18].map((x, i) => ({ x, top: 1 + Math.floor(r() * 3), lean: r() < 0.35 ? (r() < 0.5 ? -1 : 1) : 0, i }));
    const broken = seed % 3 === 1; // one rail fallen on this piece
    posts.forEach((q) => {
      for (let y = q.top; y < 17; y++) {
        const off = q.lean && y < 8 ? q.lean * (y < 4 ? 1 : 0) : 0;
        p.set(q.x + off, y, W2[1]); p.set(q.x + 1 + off, y, W2[2]); p.set(q.x + 2 + off, y, W2[3]);
      }
      p.set(q.x, q.top, W2[0]); p.set(q.x + 1, q.top, W2[0]); p.set(q.x + 2, q.top, W2[2]);
      p.set(q.x + 1, 6 + q.i * 3, W2[4]); // knot
    });
    const rails = broken ? [[5, 0, 1]] : [[5, 0, 0], [10, 1, 0]];
    rails.forEach(([y, sag]) => {
      for (let x = 0; x < 24; x++) {
        if (posts.some((q) => x >= q.x && x <= q.x + 2)) continue;
        const yy = y + (x > 4 && x < 10 ? sag : 0);
        p.set(x, yy, W2[1]); p.set(x, yy + 1, W2[3]);
        if (x % 5 === 0) p.set(x, yy, W2[0]);
      }
    });
    if (broken) for (let x = 4; x < 16; x++) { const yy = 14 - Math.floor((x - 4) / 4); p.set(x, yy, W2[1]); p.set(x, yy + 1, W2[3]); } // fallen rail
    posts.forEach((q) => { p.set(q.x + 2, 5, '#d9c28a'); p.set(q.x + 2, 6, '#a38c5c'); });
    p.selout('#2b2230');
    return p;
  };

  DECOR.mushrooms = function (r, th, seed) {
    const p = new O.Pix(22, 14);
    const CAPS = {
      red: ['#ffb09a', '#f0604a', '#c23a3e', '#83243a'],
      violet: ['#eadcff', '#b89ce8', '#8a6cc4', '#5c4690'],
      tan: ['#f4d6a8', '#cc9a68', '#9a6a48', '#6a4434']
    };
    const stem = ['#fff4e0', '#e3d3c0', '#b4a3a6'];
    const n = 1 + (seed % 3);
    const list = [];
    for (let k = 0; k < n; k++) {
      const big = k === 0;
      list.push({ x: 11 + (k === 0 ? 0 : k === 1 ? -6 : 6) + Math.round((r() - 0.5) * 2), h: big ? 6 + Math.floor(r() * 3) : 3 + Math.floor(r() * 3), cr: big ? 3.6 + r() : 2 + r() * 1.2, lean: Math.round((r() - 0.5) * 2), kind: r() < 0.25 ? 'violet' : (th === 'cave' && r() < 0.5) ? 'tan' : 'red' });
    }
    list.sort((a, b) => a.h - b.h).reverse().forEach((m) => {
      const base = 13, top = base - m.h;
      for (let y = top; y <= base; y++) {
        const off = y < top + 2 ? m.lean : 0;
        p.set(m.x - 1 + off, y, stem[0]); p.set(m.x + off, y, stem[1]); if (m.cr > 3) p.set(m.x + 1 + off, y, stem[2]);
      }
      const C = CAPS[m.kind], cx = m.x + 0.5 + m.lean, cy = top;
      for (let y = Math.floor(cy - m.cr * 0.8); y <= cy + 1; y++) for (let x = Math.floor(cx - m.cr - 1); x <= cx + m.cr + 1; x++) {
        const dx = (x + 0.5 - cx) / m.cr, dy = (y + 0.5 - cy) / (m.cr * 0.75);
        if (dy > 0.45 || dx * dx + dy * dy > 1) continue;
        const v = -(dx * 0.6 + dy * 0.8);
        p.set(x, y, dy > 0.1 ? C[3] : v > 0.45 ? C[0] : v > -0.1 ? C[1] : C[2]);
      }
      if (m.kind === 'red' && m.cr > 2.5) { p.set(Math.round(cx - 1.5), Math.round(cy - m.cr * 0.45), '#ffffff'); p.set(Math.round(cx + 1), Math.round(cy - 1), '#fff0e8'); }
    });
    p.selout('#23141f');
    return p;
  };

  DECOR.amphora = function (r, th, seed) {
    const kind = seed % 3;
    const p = new O.Pix(20, 28);
    const OR = ['#ffd2a0', '#f4a562', '#d97d42', '#a9562f', '#713625'];
    const BK = ['#6d5a6a', '#3d3043', '#231a2b'];
    const cx = 9.5;
    // half-width profile (y = 0 top)
    const prof = kind === 1
      ? (y) => (y < 2 ? 4.5 : y < 6 ? 3 : y < 9 ? 3 + (y - 6) * 1.8 : y < 19 ? 8.3 - Math.pow((y - 13) / 6.5, 2) * 2.3 : y < 24 ? 6 - (y - 19) * 0.8 : y < 27 ? 3.6 : 0)
      : kind === 2
        ? (y) => (y < 3 ? 0 : y < 5 ? 8.5 : y < 8 ? 7.4 : y < 16 ? 7.4 - (y - 8) * 0.45 : y < 20 ? 3.2 - (y - 16) * 0.3 : y < 23 ? 2 : y < 27 ? 4.5 : 0)
        : (y) => (y < 2 ? 4 : y < 8 ? 2.6 : y < 12 ? 2.6 + (y - 8) * 1.3 : y < 19 ? 7.8 - Math.pow((y - 13) / 6, 2) * 1.6 : y < 24 ? 6.2 - (y - 19) * 0.9 : y < 27 ? 3.4 : 0);
    const topY = kind === 2 ? 3 : 1;
    for (let y = topY; y < 27; y++) {
      const hw = prof(y);
      for (let x = 0; x < 20; x++) {
        const dx = (x + 0.5 - cx) / hw;
        if (Math.abs(dx) > 1) continue;
        const v = -dx * 0.75 + Math.sqrt(1 - dx * dx) * 0.35;
        // zones: black glaze vs clay panel
        let glaze;
        if (kind === 2) glaze = y < 5 || (y >= 15 && y < 27 && !(y >= 23 && y < 24));
        else glaze = y < (kind === 1 ? 6 : 8) || y >= 20 || (y >= 9 && y < 10);
        const ramp = glaze ? BK : OR;
        let idx = Math.round((0.55 - v) / 1.3 * (ramp.length - 1));
        idx = clamp(idx, 0, ramp.length - 1);
        let c = ramp[idx];
        if (glaze && Math.abs(dx + 0.45) < 0.12 && y > 1) c = '#b7a8c8'; // glossy highlight
        p.set(x, y, c);
      }
    }
    // rim & foot highlights
    const rimY = topY;
    for (let x = 0; x < 20; x++) if (p.get(x, rimY)) p.set(x, rimY, x < cx ? OR[1] : OR[3]);
    // decoration: meander/tongues on the shoulder and a black-figure scene on the belly
    const band = kind === 2 ? 6 : kind === 1 ? 9 : 10;
    const isClay = (x, y) => OR.includes(p.get(x, y));
    const redFig = seed % 4 === 3;
    // red-figure vases: the belly frieze is black glaze and the figure is left in clay colour
    if (redFig) for (let y = band + 1; y <= band + 8; y++) for (let x = 0; x < 20; x++) if (isClay(x, y)) p.set(x, y, BK[x < cx - 3 ? 1 : 2]);
    // tongue pattern on the shoulder, then dotted / meander borders framing the frieze
    for (let y = band - 3; y < band; y++) for (let x = 0; x < 20; x++) {
      if (!isClay(x, y)) continue;
      const q = x % 3;
      if (q === 0 || (q === 1 && y < band - 1)) p.set(x, y, BK[2]);
    }
    for (let x = 0; x < 20; x++) {
      if (p.get(x, band)) p.set(x, band, BK[2]);
      if (p.get(x, band + 9) && isClay(x, band + 9)) p.set(x, band + 9, x % 2 ? BK[2] : OR[3]);
      else if (p.get(x, band + 9)) p.set(x, band + 9, BK[2]);
    }
    // one hand-drawn figure chosen by seed: hoplite with shield and spear, runner, or horse
    const FIG = [
      ['...##..#', '..###..#', '.#####.#', '###.####', '###.##.#', '.#..##.#', '....#.#.', '...#...#'],
      ['....##..', '....##..', '..####..', '.#.##.#.', '...##...', '..#..#..', '.#....#.', '#......#'],
      ['......##.', '.....####', '#...###..', '#######..', '.######..', '.#..#.#..', '.#..#..#.', '.........']
    ];
    const fig = FIG[seed % 3], fw = fig[0].length, fx = Math.round(cx - fw / 2), fy = band + 1;
    fig.forEach((row, j) => { for (let i = 0; i < fw; i++) if (row[i] === '#' && p.get(fx + i, fy + j)) p.set(fx + i, fy + j, redFig ? OR[1] : BK[2]); });
    // incised highlight (black-figure) / relief line (red-figure) on the figure's back edge
    fig.forEach((row, j) => { for (let i = 0; i < fw; i++) if (row[i] === '#' && (i === 0 || row[i - 1] !== '#') && j > 0 && j < 6 && hh(i, j, seed) < 0.5) p.set(fx + i, fy + j, redFig ? OR[0] : BK[1]); });
    // handles
    if (kind === 0) {
      [[3, 4, 2, 10], [16, 4, 17, 10]].forEach(([x0, y0, x1, y1], i) => { p.line(x0 + (i ? -1 : 1), y0, x1, y0 + 2, BK[1]); p.line(x1, y0 + 2, x1 + (i ? -1 : 1), y1, BK[i ? 2 : 1]); });
    } else if (kind === 1) {
      p.line(2, 11, 1, 14, BK[1]); p.line(1, 14, 3, 16, BK[1]); p.line(17, 11, 18, 14, BK[2]); p.line(18, 14, 16, 16, BK[2]);
    } else {
      p.line(1, 5, 1, 9, BK[1]); p.line(1, 9, 3, 11, BK[1]); p.line(18, 5, 18, 9, BK[2]); p.line(18, 9, 16, 11, BK[2]);
    }
    p.selout(OUT);
    return p;
  };

  DECOR.curtain = function (r, th, seed) {
    const p = new O.Pix(26, 74);
    const CR = seed % 2 ? ['#ff9a8a', '#e24b4a', '#b52d3d', '#801e37', '#4f1330'] : ['#d6a8ff', '#9a5ee0', '#6e3cb8', '#4a2787', '#2c1654'];
    const left = (y) => (y < 38 ? 3 + (y / 38) * 3 : y < 44 ? 7 : 7 - (y - 44) * 0.2);
    const right = (y) => (y < 38 ? 23 - (y / 38) * 5 : y < 44 ? 17 : 17 + (y - 44) * 0.25);
    for (let y = 4; y < 71; y++) {
      const a = left(y), b = right(y), wdt = b - a;
      for (let x = Math.floor(a); x < b; x++) {
        const t = (x + 0.5 - a) / wdt;
        const folds = 4.5 + (y > 44 ? (y - 44) * 0.02 : 0);
        let v = Math.cos((t * folds + (y > 44 ? (y - 44) * 0.01 : 0)) * Math.PI * 2) * 0.55 - (t - 0.5) * 0.7;
        if (y > 38 && y < 44) v = Math.cos(t * 9 * Math.PI) * 0.4 - (t - 0.5) * 0.6;
        const idx = clamp(Math.round((0.7 - v) / 1.5 * 4), 0, 4);
        p.set(x, y, CR[idx]);
      }
    }
    // gold rod with finials
    for (let x = 0; x < 26; x++) { p.set(x, 1, GOLD[1]); p.set(x, 2, GOLD[2]); p.set(x, 3, GOLD[3]); }
    p.orb(1.5, 2, 2, 2, GOLD); p.orb(24.5, 2, 2, 2, GOLD);
    // rings
    for (let x = 4; x < 23; x += 4) { p.set(x, 3, GOLD[0]); p.set(x, 4, GOLD[2]); }
    // tie-back cord and tassel
    for (let x = 6; x <= 18; x++) { p.set(x, 40, GOLD[1]); p.set(x, 41, GOLD[3]); }
    p.set(17, 42, GOLD[1]); p.set(18, 43, GOLD[2]); p.rect(17, 44, 3, 4, GOLD[2]); p.set(17, 44, GOLD[0]); p.set(19, 47, GOLD[3]);
    // gold fringe hem
    for (let x = 0; x < 26; x++) if (p.get(x, 70)) { p.set(x, 71, x % 2 ? GOLD[2] : GOLD[1]); if (x % 2 === 0) p.set(x, 72, GOLD[3]); }
    p.selout(OUT);
    return p;
  };

  DECOR.window = function () {
    const p = new O.Pix(38, 54), M = MARBLE, cx = 18.5, cy = 18, R0 = 18, R1 = 13;
    const inR = (x, y, R) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return y + 0.5 >= cy ? Math.abs(dx) <= R : dx * dx + dy * dy <= R * R; };
    const sky = ['#07061c', '#0d0f33', '#16204f', '#223273', '#2f4690'];
    for (let y = 0; y < 50; y++) for (let x = 0; x < 38; x++) {
      if (!inR(x, y, R0)) continue;
      if (!inR(x, y, R1) || y > 45) {
        // marble frame with voussoir joints and a lit upper-left
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
        let k = dx + dy < -4 ? 0 : dx + dy > 10 ? 2 : 1;
        if (y + 0.5 < cy && Math.floor((Math.atan2(dy, dx) + 3.2) / 0.35) % 2 === 0 && Math.abs(d - (R0 + R1) / 2) < 2.2 && hh(x, y, 1) < 0.25) k = 2;
        if (y + 0.5 < cy && Math.abs(d - R0) < 1) k = dx < 0 ? 1 : 3;
        p.set(x, y, M[k]);
        continue;
      }
      const t = y / 46;
      const f = t * (sky.length - 1);
      let i = Math.floor(f);
      if (f - i > 0.5 && bay(x, y) < (f - i - 0.5) * 2) i++;
      p.set(x, y, sky[clamp(i, 0, sky.length - 1)]);
    }
    // keystone in gold
    p.rect(16, 0, 6, 6, GOLD[2]); p.rect(16, 0, 6, 1, GOLD[0]); p.rect(16, 0, 1, 6, GOLD[1]); p.rect(21, 0, 1, 6, GOLD[3]);
    // stars, moon, distant mountain with a golden glint
    [[10, 12], [24, 9], [14, 24], [27, 22], [9, 30], [21, 17], [29, 31], [12, 7]].forEach(([x, y], i) => { p.set(x, y, i % 3 ? '#cfd8ff' : '#ffffff'); });
    p.orb(24.5, 14.5, 3.4, 3.4, ['#ffffff', '#fff8e0', '#eadfb8', '#cbbf9c']);
    p.ellipse(26, 13.5, 2.6, 2.8, null);
    for (let y = 0; y < 50; y++) for (let x = 0; x < 38; x++) if (p.get(x, y) === null && Math.hypot(x + 0.5 - 24.5, y + 0.5 - 14.5) < 3.5 && inR(x, y, R1)) p.set(x, y, sky[1]);
    for (let x = 5; x < 33; x++) {
      const hgt = 38 - Math.abs(x - 16) * 0.9 + Math.sin(x * 0.9) * 0.8;
      for (let y = Math.round(hgt); y < 46; y++) if (inR(x, y, R1)) p.set(x, y, y < hgt + 2 && x < 16 ? '#3a3a78' : '#23224f');
    }
    p.set(16, 29, GOLD[0]); p.set(16, 28, GOLD[1]);
    // mullions (marble) with gold lattice lines
    for (let y = 5; y < 46; y++) { p.set(18, y, M[1]); p.set(19, y, M[3]); }
    for (let x = 6; x < 32; x++) { if (inR(x, 30, R1)) { p.set(x, 30, M[1]); p.set(x, 31, M[3]); } }
    // inner reveal shadow (depth) on the top/left
    for (let y = 0; y < 46; y++) for (let x = 0; x < 38; x++) if (inR(x, y, R1) && (!inR(x - 1, y, R1) || !inR(x, y - 1, R1))) p.set(x, y, '#05040f');
    // sill
    p.rect(0, 46, 38, 3, M[0]); p.rect(0, 48, 38, 1, M[2]); p.rect(1, 49, 36, 3, M[2]); p.rect(1, 51, 36, 1, M[4]);
    p.rect(0, 46, 38, 1, M[0]);
    p.selout(OUT);
    return p;
  };

  DECOR.stalactite = function (r, th, seed) {
    const p = new O.Pix(28, 34), R = PAL.cave.rock;
    // 1-3 tapered cones grown from a lump of ceiling rock; count, length and lean vary by seed
    const n = 1 + (seed % 3);
    const cones = [];
    const mainX = 13 + Math.round((r() - 0.5) * 4);
    cones.push({ x: mainX + 0.5, w: 7 + Math.floor(r() * 3), len: 16 + Math.floor(r() * 7), lean: (r() - 0.5) * 3, main: true });
    if (n > 1) cones.push({ x: mainX - 6 - Math.floor(r() * 2) + 0.5, w: 5 + Math.floor(r() * 2), len: 9 + Math.floor(r() * 6), lean: -r() * 1.5 });
    if (n > 2) cones.push({ x: mainX + 6 + Math.floor(r() * 2) + 0.5, w: 5, len: 7 + Math.floor(r() * 5), lean: r() * 1.5 });
    // root lump (ceiling ramp: dark underside, lit left)
    const lx0 = Math.min(...cones.map((c) => c.x - c.w / 2)) - 2, lx1 = Math.max(...cones.map((c) => c.x + c.w / 2)) + 2;
    for (let x = Math.floor(lx0); x <= lx1; x++) {
      const t = (x - lx0) / (lx1 - lx0), hgt = 1 + Math.round(Math.sin(t * Math.PI) * 2.5 + (hh(x, seed, 3) - 0.5));
      for (let y = 0; y < hgt; y++) p.set(x, y, y === hgt - 1 ? R[5] : x < (lx0 + lx1) / 2 ? R[3] : R[4]);
    }
    // cones, back ones first
    cones.slice().reverse().forEach((c) => {
      const rings = [Math.floor(c.len * (0.25 + r() * 0.1)), c.len > 12 ? Math.floor(c.len * (0.52 + r() * 0.08)) : -1];
      for (let y = 0; y < c.len; y++) {
        const t = y / c.len, half = Math.max(0.5, (c.w / 2) * Math.pow(1 - t, 0.85)), cx = c.x + c.lean * t * t;
        for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
          const dx = (x + 0.5 - cx) / half;
          if (Math.abs(dx) > 1.02) continue;
          let k = dx < -0.45 ? 1 : dx < 0.05 ? 2 : dx < 0.55 ? 3 : 4;
          if (y < 2) k = Math.max(k, 3);
          if (rings.includes(y) && dx > -0.7) k = Math.min(5, k + 1);
          if (rings.includes(y - 1) && dx < 0.3) k = Math.max(0, k - 1);
          p.set(x, y, R[k]);
        }
      }
      // wet highlight near the tip, drip on the main cone
      const ty = c.len - 3, tx = Math.round(c.x + c.lean * Math.pow(ty / c.len, 2) - 0.8);
      p.set(tx, ty, '#ffe2bd'); p.set(tx, ty - 1, R[0]);
      if (c.main) { const dx = Math.round(c.x + c.lean - 0.5); p.set(dx, c.len + 1, '#bfe8ff'); p.set(dx, c.len + 2, '#6fb4e6'); }
    });
    p.selout('#1c1119');
    return p;
  };

  DECOR.crystals = function (r, th, seed) {
    const p = new O.Pix(24, 22), C = ['#f2ffff', '#aef8ff', '#58d6ef', '#2e98d0', '#23609f', '#1d3c73'];
    const prism = (bx, top, wdt, tilt) => {
      for (let y = top; y < 22; y++) {
        const cx = bx + tilt * (22 - y) / 22;
        const tipH = wdt * 1.2;
        const hw = y < top + tipH ? wdt * (y - top) / tipH : wdt;
        for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
          const t = (x + 0.5 - cx) / Math.max(0.5, hw);
          if (Math.abs(t) > 1) continue;
          let k = t < -0.35 ? 1 : t < 0.3 ? 2 : 4;
          if (y < top + tipH) k = t < 0 ? 0 : 3;
          if (Math.abs(t) > 0.85) k = Math.min(5, k + 1);
          p.set(x, y, C[k]);
        }
        if (y > top + tipH && y % 5 === 0) p.set(Math.round(cx - hw * 0.5), y, C[0]);
      }
    };
    const nC = 3 + (Math.abs(seed | 0) % 3);
    const spots = [[13, 1 + Math.floor(r() * 3), 3.4, Math.round((r() - 0.5) * 3)], [7, 7 + Math.floor(r() * 4), 2.6, -3], [18, 9 + Math.floor(r() * 4), 2.2, 3], [10, 12 + Math.floor(r() * 3), 1.8, -1], [4, 14, 1.6, -3]];
    spots.slice(0, nC).sort((a, b) => a[1] - b[1]).forEach(([x, top, wdt, tilt]) => prism(x, top, wdt, tilt));
    // rock base
    boulder(p, 12, 21, 11, 3.5, PAL.cave.rock, 3);
    p.selout('#10182e');
    return p;
  };

  DECOR.pedestal = function (r, th, seed) {
    const p = new O.Pix(24, 12), M = MARBLE, alt = (seed | 0) % 2 === 1;
    const slab = (x, y, w, h) => { p.rect(x, y, w, h, M[1]); p.rect(x, y, w, 1, M[0]); p.rect(x, y + h - 1, w, 1, M[3]); p.rect(x + w - 1, y, 1, h, M[3]); p.set(x, y, M[0]); };
    slab(1, 0, 22, 3);
    slab(3, 3, 18, 6);
    if (alt) { for (let x = 4; x < 20; x++) { const on = O.KEY[1][x % 6] === 'X', on2 = O.KEY[3][x % 6] === 'X'; p.set(x, 5, on ? M[3] : M[1]); p.set(x, 6, on2 ? M[3] : M[1]); } p.rect(4, 7, 16, 1, GOLD[2]); }
    else { p.rect(4, 5, 16, 1, GOLD[1]); p.rect(4, 6, 16, 1, GOLD[3]); for (let x = 6; x < 18; x += 3) p.set(x, 7, M[3]); }
    p.rect(3, 4, 1, 4, M[0]); p.rect(19, 4, 2, 5, M[3]); p.rect(18, 4, 1, 5, M[2]);
    slab(0, 9, 24, 3);
    if (r && r() < 0.6) { const cx = 2 + Math.floor(r() * 18); p.set(cx, 9, M[3]); p.set(cx + 1, 10, M[4]); } // chipped edge
    p.selout(OUT);
    return p;
  };

  // Marble statue of a hoplite, hand-authored 24x38 pixel map: Corinthian helmet with a tall horsehair
  // crest, round shield in 3/4 view (drawn first, behind the body), leaf-bladed spear, contrapposto
  // (weight on the far leg, near knee bent forward, heel raised, hips tilted). Tones 1..5 run from a warm
  // highlight to a cool violet shadow; only the outer silhouette gets the outline.
  const STATUE_MAP = [
    '.........1222.......1...',
    '.......12334443.....13..',
    '......1343434344...124..',
    '......24345555544..224..',
    '......34441112233...34..',
    '......44431122233.......',
    '.......4531223555.......',
    '........432233452.......',
    '.........43234353.......',
    '........44334434........',
    '..........5334..........',
    '.........23334..........',
    '........211222323.......',
    '........2112223423......',
    '........3122443423......',
    '.........122243423......',
    '.........1232334223.....',
    '.........2233434.44.....',
    '.........3233434........',
    '.........3344445........',
    '.........12132344.......',
    '.........1213244........',
    '.........3334223........',
    '..........3341223.......',
    '..........2341223.......',
    '..........2344123.......',
    '..........23441223......',
    '..........234.1223......',
    '..........234..113......',
    '..........234.123.......',
    '..........234.124.......',
    '..........234123........',
    '..........234123........',
    '..........234124........',
    '..........23423.........',
    '..........23332.........',
    '.........33444234.......',
    '........................'
  ];
  DECOR.__statue = function () {
    const WD = 24, HT = 38, p = new O.Pix(WD, HT);
    const M = [null, '#fffaf0', '#e8e1e8', '#c4bbd1', '#9e94b5', '#7a7295'];
    const set = (x, y, k) => p.set(x, y, M[k]);
    // round shield (behind the body): 1 px rim, cylindrical 3-tone face, embossed lambda
    for (let y = 11; y <= 28; y++) for (let x = 0; x <= 10; x++) {
      const dx = (x + 0.5 - 4.6) / 4.5, dy = (y + 0.5 - 19.8) / 7.8, d = dx * dx + dy * dy;
      if (d > 1) continue;
      if (d > 0.7) { set(x, y, dx * 0.8 + dy * 0.6 < -0.3 ? 1 : dx * 0.8 + dy * 0.6 > 0.3 ? 4 : 2); continue; }
      set(x, y, dx < -0.35 ? 2 : dx < 0.3 ? 3 : 4);
    }
    [[4, 15], [4, 16], [3, 17], [3, 18], [3, 19], [2, 20], [2, 21], [2, 22]].forEach(([x, y]) => { set(x, y, 1); set(x + 1, y, 5); });
    [[5, 16], [5, 17], [6, 18], [6, 19], [6, 20], [7, 21], [7, 22]].forEach(([x, y]) => { set(x, y, 2); set(x + 1, y, 5); });
    // the figure
    STATUE_MAP.forEach((row, y) => { for (let x = 0; x < WD; x++) { const k = +row[x]; if (k) set(x, y, k); } });
    // one weathering streak running down from the collar bone
    for (let y = 12; y <= 21; y++) { const c = p.get(10, y); if (c === M[1] || c === M[2]) set(10, y, 3); }
    p.selout(OUT);
    // spear shaft after the outline: a slim two-tone rod, clear of the body, gripped by the fist
    for (let y = 5; y <= 36; y++) { set(20, y, 2); set(21, y, 5); }
    set(19, 16, 2); set(20, 16, 1); set(21, 16, 3); set(19, 17, 3); set(20, 17, 3); set(21, 17, 4); set(20, 18, 4);
    p.set(22, 16, OUT); p.set(22, 17, OUT); p.set(21, 18, OUT); p.set(19, 18, OUT);
    STATUE_ANCHOR.ax = 12; STATUE_ANCHOR.ay = 37;
    return p;
  };

  /* =====================================================================================
     Light props: bronze brazier, wall torch, crystal glow — animated flames
     ===================================================================================== */
  const FIRE = ['#ffffff', '#fff4c0', '#ffd35a', '#ffb030', '#f05a28', '#b8302e', '#8a2030'];
  const flameCache = {};
  // Flame frame (8-frame loop): 2-3 licking tongues whose heights and tips sway out of phase; on frames
  // 3-5 the tip of the tallest tongue pinches off and rises as a small blob. Colour comes from the distance
  // to the flame's edge, so the bands are clean: white-yellow core, #ffb030, #f05a28, #8a2030 rim.
  function flame(w, h, f, seed) {
    const key = w + 'x' + h + ':' + f + ':' + seed;
    if (flameCache[key]) return flameCache[key];
    const ph = (f / 8) * Math.PI * 2, cx = w / 2, baseY = h - 1;
    const sd = (seed * 1.7) % 6.28;
    const pinch = f >= 3 && f <= 5;
    const tongues = [
      { bx: cx, bw: w * 0.36, hgt: h * (0.9 + 0.08 * Math.sin(ph + sd)) * (pinch ? 0.84 : 1), sw: Math.sin(ph + sd) * w * 0.14 },
      { bx: cx - w * 0.2, bw: w * 0.22, hgt: h * (0.55 + 0.14 * Math.sin(ph * 2 + 1.3 + sd)), sw: Math.sin(ph + 2.1 + sd) * w * 0.12 },
      { bx: cx + w * 0.2, bw: w * 0.22, hgt: h * (0.6 + 0.14 * Math.sin(ph * 2 + 3.9 + sd)), sw: Math.sin(ph + 4.2 + sd) * w * 0.12 }
    ];
    const E = new Float32Array(w * h).fill(-1);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let best = -1;
      tongues.forEach((tg) => {
        const t = (baseY + 0.5 - (y + 0.5)) / tg.hgt;
        if (t > 1) return;
        const spine = tg.bx + tg.sw * Math.pow(Math.max(0, t), 1.4);
        let half = tg.bw * Math.pow(Math.max(0, 1 - t), 0.75);
        if (t < 0.18) half *= Math.sqrt(Math.max(0, 1 - Math.pow((0.18 - t) / 0.3, 2)));  // rounded base
        const e = half - Math.abs(x + 0.5 - spine);
        if (e > best) best = e + (1 - t) * 0.9;
      });
      if (best >= 0) E[y * w + x] = best;
    }
    const p = new O.Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const e = E[y * w + x];
      if (e < 0) continue;
      p.set(x, y, FIRE[e < 1 ? 6 : e < 2 ? 4 : e < 3.3 ? 3 : e < 4.4 ? 2 : 1]);
    }
    // detached blob rising from the main tongue's tip
    if (pinch) {
      const k = f - 3, tipY = Math.round(baseY - tongues[0].hgt) - 2 - k * 2;
      const bx = Math.round(cx + tongues[0].sw * 1.1 - 0.5);
      const sz = [[2, 3], [2, 2], [1, 2]][k];
      for (let yy = 0; yy < sz[1]; yy++) for (let xx = 0; xx < sz[0]; xx++) p.set(bx + xx, tipY + yy, (yy === sz[1] - 1 && k < 2) ? FIRE[3] : FIRE[4]);
    }
    // no isolated pixels
    const kill = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p.get(x, y) && !p.get(x - 1, y) && !p.get(x + 1, y) && !p.get(x, y - 1) && !p.get(x, y + 1)) kill.push([x, y]);
    kill.forEach(([x, y]) => p.set(x, y, null));
    const c = p.canvas();
    flameCache[key] = c;
    return c;
  }
  const propCache = {};
  function brazierSprite() {
    if (propCache.brazier) return propCache.brazier;
    const p = new O.Pix(22, 26), BR = ['#ffe3a8', '#e5ab62', '#b87a40', '#82502f', '#553226', '#34201e'];
    // tripod legs with lion paws
    limb(p, [11, 12], [3, 24], 1.2, 1.0, BR); limb(p, [11, 12], [18, 24], 1.2, 1.0, BR); limb(p, [11, 12], [11, 25], 1.3, 1.1, BR);
    p.rect(1, 24, 4, 2, BR[3]); p.rect(16, 24, 4, 2, BR[3]); p.rect(9, 24, 4, 2, BR[2]); p.set(1, 24, BR[1]); p.set(9, 24, BR[0]);
    // ring
    p.line(5, 18, 17, 18, BR[2]); p.line(5, 19, 17, 19, BR[4]);
    // bowl
    for (let y = 4; y < 12; y++) {
      const hw = 10 - Math.pow((y - 4) / 8, 2) * 6;
      for (let x = Math.floor(11 - hw); x < 11 + hw; x++) {
        const t = (x + 0.5 - 11) / hw;
        let k = t < -0.55 ? 1 : t < 0 ? 2 : t < 0.55 ? 3 : 4;
        if (y === 4) k = 0;
        if (y === 5) k = t < 0 ? 4 : 5; // rim lip shadow
        p.set(x, y, BR[k]);
      }
    }
    // gold meander band on the bowl
    for (let x = 3; x < 19; x++) if (p.get(x, 7)) p.set(x, 7, x % 3 === 0 ? BR[5] : GOLD[x < 11 ? 1 : 2]);
    // embers / coals in the bowl
    for (let x = 3; x < 19; x++) p.set(x, 3, x % 3 ? '#ff7a3a' : '#ffd35a');
    p.set(2, 4, BR[1]); p.set(19, 4, BR[3]);
    p.selout(OUT);
    propCache.brazier = p.canvas();
    return propCache.brazier;
  }
  function torchSprite() {
    if (propCache.torch) return propCache.torch;
    const p = new O.Pix(12, 22), IR = ['#c9c3da', '#8a83a3', '#5a5372', '#3a344e'], WD = BARK.wood;
    // wooden torch with a pitch-soaked wrapped head
    limb(p, [6, 20], [6, 5], 1.1, 1.5, WD);
    p.rect(4, 2, 5, 4, '#5e3f36'); p.rect(4, 2, 2, 4, '#8a5f46'); p.rect(4, 3, 5, 1, '#3a2a2e'); p.set(8, 5, '#3a2a2e');
    // iron wall plate with rivets, curved arm and a clamp ring around the handle
    p.rect(0, 9, 2, 9, IR[2]); p.rect(0, 9, 1, 9, IR[1]); p.set(0, 9, IR[0]); p.set(1, 11, IR[3]); p.set(1, 15, IR[3]); p.set(0, 11, IR[0]); p.set(0, 15, IR[0]);
    p.set(2, 13, IR[1]); p.set(3, 12, IR[1]); p.set(3, 13, IR[2]); p.set(4, 12, IR[2]);
    [[4, 11], [5, 10], [6, 10], [7, 10], [8, 11], [8, 12], [7, 13], [6, 13], [5, 13], [4, 12]].forEach(([x, y], k) => p.set(x, y, k < 4 ? IR[0] : k < 6 ? IR[2] : IR[3]));
    p.set(5, 11, WD[1]); p.set(6, 11, WD[2]); p.set(7, 11, WD[3]); p.set(5, 12, WD[2]); p.set(6, 12, WD[3]); p.set(7, 12, WD[3]);
    p.selout(OUT);
    propCache.torch = p.canvas();
    return propCache.torch;
  }
  function drawEmbers(ctx, x, y, t, i, n, spread) {
    for (let k = 0; k < n; k++) {
      const life = 40, age = (t + k * 13 + i * 7) % life;
      const ex = Math.round(x + Math.sin((k * 2.1 + age * 0.12)) * spread * (age / life) + (hh(k, i, 3) - 0.5) * spread);
      const ey = Math.round(y - age * 0.55);
      ctx.fillStyle = age < life * 0.5 ? '#ffd35a' : '#f0582f';
      ctx.fillRect(ex, ey, 1, 1);
    }
  }
  function drawLightProp(ctx, type, x, y, t, i) {
    if (type === 'brazier') {
      const b = brazierSprite();
      ctx.drawImage(b, x - 11, y - 25);
      const f = Math.floor((t + i * 3) / 6) % 8;
      ctx.drawImage(flame(18, 26, f, 1 + i), x - 9, y - 22 - 25);
      drawEmbers(ctx, x, y - 42, t, i, 5, 10);
    } else if (type === 'torch') {
      ctx.drawImage(torchSprite(), x - 6, y - 7);
      const f = Math.floor((t + i * 4) / 6) % 8;
      ctx.drawImage(flame(10, 17, f, 2 + i), x - 5, y - 21);
      drawEmbers(ctx, x, y - 18, t, i, 3, 6);
    } else if (type === 'crystal') {
      // pulsing inner light and twinkles on the crystal cluster (the glow halo is the light module's job)
      const pulse = (Math.sin(t * 0.05 + i * 1.7) + 1) / 2;
      ctx.globalAlpha = 0.35 + pulse * 0.4;
      ctx.fillStyle = '#eaffff';
      ctx.fillRect(x - 1, y - 18, 1, 8); ctx.fillRect(x - 5, y - 11, 1, 5); ctx.fillRect(x + 5, y - 8, 1, 4);
      ctx.globalAlpha = 1;
      const tw = Math.floor(t / 6 + i * 5) % 12;
      if (tw < 3) {
        const sx = x + [-4, 2, 5, -1][Math.floor(t / 72 + i) % 4], sy = y - [12, 20, 9, 15][Math.floor(t / 72 + i) % 4];
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, 1, 1);
        if (tw === 1) { ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); }
      }
      for (let k = 0; k < 3; k++) {
        const age = (t + k * 29 + i * 11) % 80;
        ctx.fillStyle = k % 2 ? '#8ff6ff' : '#eaffff';
        ctx.globalAlpha = 1 - age / 80;
        ctx.fillRect(Math.round(x - 6 + k * 6 + Math.sin(age * 0.08 + k) * 2), Math.round(y - 8 - age * 0.3), 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  O.WorldArt = { makeWorld, PX, DECOR, PAL, setTheme(t) { curTheme = t; }, flame, brazierSprite, torchSprite };
})(window.OLY);
