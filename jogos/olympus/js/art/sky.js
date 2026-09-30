/* art/sky.js — parallax backgrounds (all 4 themes), lighting & atmosphere (O.Light.apply)
   and the look of particles (O.FXDraw / O.AmbDraw).
   Everything heavy is painted once into cached canvases; per frame we only blit. */
(function (O) {
  'use strict';
  const W = O.W || 384, H = O.H || 216, VY = O.VIEW_Y || 8, T = O.TILE || 16;
  const LW = 768; // parallax layer width (layers tile horizontally, all noise is periodic on LW)

  /* ================================================================
     colour + fast RGBA buffer
     ================================================================ */
  const HC = {};
  function rgb(h) {
    if (typeof h !== 'string') return h;
    let v = HC[h];
    if (!v) { const n = parseInt(h.slice(1), 16); v = HC[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return v;
  }
  function mixc(a, b, t) { a = rgb(a); b = rgb(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, a) { c = rgb(c); return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')'; }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const bay = (x, y) => O.bayer(x & 3, y & 3);
  const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  function Buf(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  Buf.prototype.idx = function (x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (y < 0 || y >= this.h) return -1;
    x = ((x % this.w) + this.w) % this.w;
    return (y * this.w + x) * 4;
  };
  Buf.prototype.set = function (x, y, c, a) {
    const i = this.idx(x, y);
    if (i < 0) return;
    c = rgb(c);
    const d = this.d;
    if (a === undefined || a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    if (a <= 0) return;
    const da = d[i + 3] / 255, oa = a + da * (1 - a);
    d[i] = (c[0] * a + d[i] * da * (1 - a)) / oa;
    d[i + 1] = (c[1] * a + d[i + 1] * da * (1 - a)) / oa;
    d[i + 2] = (c[2] * a + d[i + 2] * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  };
  Buf.prototype.alpha = function (x, y) { const i = this.idx(x, y); return i < 0 ? 0 : this.d[i + 3]; };
  Buf.prototype.getc = function (x, y) { const i = this.idx(x, y); return i < 0 ? null : [this.d[i], this.d[i + 1], this.d[i + 2]]; };
  Buf.prototype.rect = function (x, y, w, h, c, a) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c, a); };
  Buf.prototype.canvas = function () {
    const cv = O.makeCanvas(this.w, this.h);
    const g = cv.getContext('2d');
    const img = g.createImageData(this.w, this.h);
    img.data.set(this.d);
    g.putImageData(img, 0, 0);
    return cv;
  };

  /* ================================================================
     periodic value noise
     ================================================================ */
  function ih(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vn(x, y, s, px) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (px) { x0 = ((x0 % px) + px) % px; x1 = ((x1 % px) + px) % px; }
    const a = ih(x0, yi, s), b = ih(x1, yi, s), c = ih(x0, yi + 1, s), d = ih(x1, yi + 1, s);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  // fBm; `cell` = biggest feature in px; P = x period in px (cells must divide it).
  function fbm(x, y, s, cell, oct, P) {
    let sum = 0, amp = 1, norm = 0, c = cell;
    for (let o = 0; o < oct; o++) {
      sum += vn(x / c, y / c, s + o * 31, P ? Math.round(P / c) : 0) * amp;
      norm += amp; amp *= 0.5; c /= 2;
    }
    return sum / norm;
  }
  function rng(seed) { return O.rng(seed); }

  // Pick a tone from a light→dark palette for value v (1 = lit), with a narrow ordered-dither seam.
  function tone(pal, v, x, y, dk) {
    const n = pal.length;
    let f = (1 - clamp(v, 0, 1)) * (n - 1) + (bay(x, y) - 0.47) * (dk === undefined ? 0.55 : dk);
    let i = Math.round(f);
    i = i < 0 ? 0 : i > n - 1 ? n - 1 : i;
    return pal[i];
  }
  // Quantised mix a→b (t 0..1) in `steps` steps with dithered seams.
  function qmix(a, b, t, x, y, steps) {
    const q = qb(t, steps || 4, x, y, 0.14);
    return q <= 0 ? rgb(a) : q >= 1 ? rgb(b) : mixc(a, b, q);
  }

  /* ================================================================
     generic painters
     ================================================================ */
  // Vertical sky gradient through key colours, split in many quantised bands with dithered seams.
  function gradient(b, keys, bandH, x0, x1) {
    const colAt = (y) => {
      for (let k = 0; k < keys.length - 1; k++) {
        if (y <= keys[k + 1][0]) return mixc(keys[k][1], keys[k + 1][1], (y - keys[k][0]) / (keys[k + 1][0] - keys[k][0] || 1));
      }
      return rgb(keys[keys.length - 1][1]);
    };
    const X0 = x0 || 0, X1 = x1 === undefined ? b.w : x1;
    const bands = Math.ceil(b.h / bandH) + 1, cols = [];
    for (let i = 0; i <= bands; i++) cols.push(colAt((i + 0.5) * bandH));
    for (let y = 0; y < b.h; y++) {
      const f = y / bandH, i = Math.floor(f), fr = f - i;
      for (let x = X0; x < X1; x++) {
        const nxt = fr > 0.55 && bay(x, y) < (fr - 0.55) * 2.2;
        b.set(x, y, nxt ? cols[i + 1] : cols[i]);
      }
    }
  }
  // Soft round glow painted with quantised alpha rings (dithered seams).
  function halo(b, cx, cy, r, col, amax, steps, pw) {
    const S = steps || 5, P = pw || 1.6, F = clamp(1.4 * S / r / Math.max(0.6, P * 0.7), 0.04, 0.3);
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d >= 1) continue;
        const q = qb(Math.pow(1 - d, P), S, x, y, F);
        if (q > 0) b.set(x, y, col, q * amax);
      }
    }
  }
  // A periodic horizon profile: returns Float32Array of top y per column.
  function profile(w, base, amp, seed, cell, oct, extra) {
    const t = new Float32Array(w);
    for (let x = 0; x < w; x++) t[x] = base - (fbm(x, 0, seed, cell, oct, w) - 0.5) * 2 * amp + (extra ? extra(x) : 0);
    return t;
  }
  // Fill a ridge given a top profile: face shading by slope (light from the upper-left), texture,
  // crest rim light and a haze fade toward its foot.
  function ridge(b, top, o) {
    const w = b.w, pal = o.pal.map(rgb);
    for (let x = 0; x < w; x++) {
      const t0 = Math.round(top[x]);
      const sl = (top[(x - 3 + w) % w] - top[(x + 3) % w]) / 6; // >0: rising to the right → faces left → lit
      for (let y = Math.max(0, t0); y < b.h; y++) {
        const dd = y - t0;
        let v = (o.v0 === undefined ? 0.55 : o.v0) + clamp(sl * (o.slopeK || 1.2), -0.5, 0.5) * Math.exp(-dd / (o.faceD || 30));
        if (o.tex) v += (fbm(x, y * (o.texY || 1), o.seed + 7, o.texCell || 16, 2, w) - 0.5) * o.tex;
        v -= dd * (o.depthK || 0);
        let c = tone(pal, v, x, y);
        if (o.rim && dd <= (o.rimW || 0) && sl > (o.rimSl === undefined ? -0.15 : o.rimSl) &&
            (!o.rimBreak || fbm(x, 0, o.seed + 91, 6, 2, w) > o.rimBreak)) c = dd === 0 ? rgb(o.rim) : mixc(o.rim, c, 0.5);
        if (o.haze) {
          const ht = clamp((y - (o.hazeFrom !== undefined ? o.hazeFrom : t0 + 10)) / (o.hazeLen || 40), 0, 1);
          if (ht > 0) c = qmix(c, o.haze, ht * (o.hazeMax || 1), x, y, 4);
        }
        b.set(x, y, c);
      }
    }
  }
  // Quantised horizontal mist band (alpha).
  function mist(b, y0, y1, col, amax, seed, peak) {
    const pk = peak === undefined ? 0.6 : peak;
    for (let y = y0; y < y1; y++) {
      const f = (y - y0) / (y1 - y0);
      const base = f < pk ? f / pk : (1 - f) / (1 - pk);
      for (let x = 0; x < b.w; x++) {
        const n = fbm(x, y * 3, seed, 96, 3, b.w);
        const q = qb(clamp(base * (0.55 + n * 0.9), 0, 1), 4, x, y, 0.12);
        if (q > 0) b.set(x, y, col, q * amax);
      }
    }
  }

  /* ---------- small scenery pieces ---------- */
  // Cypress: tall flame shape, lit on the left.
  function cypress(b, cx, yb, h, pal, rim) {
    const mw = Math.max(1.2, h * 0.16);
    for (let y = 0; y < h; y++) {
      const t = y / h; // 0 = top
      const hw = t < 0.08 ? mw * 0.35 * (t / 0.08 + 0.3) : mw * Math.min(1, Math.pow((t - 0.02) / 0.55, 0.6)) * (t > 0.88 ? 0.85 : 1);
      const L = Math.round(cx - hw), R = Math.round(cx + hw);
      for (let x = L; x <= R; x++) {
        const u = (x - cx) / (hw + 0.5); // -1 left .. 1 right
        let v = 0.55 - u * 0.55 + (ih(x >> 1, (yb - h + y) >> 1, 77) - 0.5) * 0.35;
        let c = tone(pal, v, x, yb - h + y, 0.3);
        if (rim && x === L && y > 1) c = rgb(rim);
        b.set(x, yb - h + y, c);
      }
    }
  }
  // Round tree crown (olive/oak/bush) built from overlapping leaf clumps. Clumps toward the
  // upper-left are lighter and drawn last; each clump is lit from the upper-left and gets a dark
  // lower-right separation edge — the classic modern pixel-art foliage cluster look.
  function crown(b, cx, cy, rx, ry, pal, seed, rim, trunkPal) {
    if (trunkPal) {
      for (let y = Math.round(cy); y < cy + ry * 1.6; y++) { b.set(cx, y, trunkPal[1]); b.set(cx + 1, y, trunkPal[2]); }
    }
    const r = rng(seed * 7 + 1);
    const n = Math.max(3, Math.round((rx * ry) / 9));
    const cl = [];
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.72;
      const rr = Math.max(1.4, Math.min(rx, ry) * (0.34 + r() * 0.22));
      cl.push([cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, rr]);
    }
    cl.push([cx - rx * 0.12, cy - ry * 0.18, Math.max(1.5, Math.min(rx, ry) * 0.55)]);
    cl.sort((p, q) => (q[0] * 0.6 + q[1]) - (p[0] * 0.6 + p[1]));
    const small = rx < 4;
    cl.forEach((c) => {
      const pos = clamp(((c[0] - cx) / rx) * -0.6 + ((c[1] - cy) / ry) * -0.8, -1, 1);
      for (let y = Math.floor(c[1] - c[2] - 1); y <= c[1] + c[2] + 1; y++) {
        for (let x = Math.floor(c[0] - c[2] - 1); x <= c[0] + c[2] + 1; x++) {
          const dx = (x + 0.5 - c[0]) / c[2], dy = (y + 0.5 - c[1]) / c[2];
          const d = Math.sqrt(dx * dx + dy * dy) + (ih(x, y, seed) - 0.5) * (small ? 0.1 : 0.3);
          if (d > 1) continue;
          const lit = (-dx * 0.6 - dy * 0.8) / (Math.sqrt(dx * dx + dy * dy) || 1) * Math.min(1, d * 1.4);
          let v = 0.44 + pos * 0.3 + lit * 0.26;
          if (d > 0.72 && lit < -0.25) v -= 0.3;
          let col = tone(pal, v, x, y, 0.3);
          if (rim && d > 0.7 && lit > 0.35 && pos > -0.35) col = rgb(rim);
          b.set(x, y, col);
        }
      }
    });
  }
  // Tiny whitewashed house with a terracotta roof (distant village dressing).
  function house(b, x, yb, w, h, wall, wallSh, roof, door) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) b.set(x + i, yb - j, i >= w - 1 ? wallSh : wall);
    for (let i = -1; i <= w; i++) b.set(x + i, yb - h, roof);
    if (w >= 5) for (let i = 0; i < w - 1; i++) b.set(x + i, yb - h - 1, roof);
    if (door) b.set(x + 1 + (w > 4 ? 1 : 0), yb, door);
  }

  /* ================================================================
     VILLAGE — bright Arcadian day, Mount Olympus with its golden temple
     ================================================================ */
  const SUN = [70, 52]; // upper-left light source, below the HUD counters and clear of Olympus' summit
  const VIL = {
    haze: '#dfe9f3',
    rock: ['#d2d6ef', '#b5bbe3', '#9aa0d2', '#8185bf', '#6c6ea8'],
    snow: ['#ffffff', '#eef3fc', '#d3def5', '#b3c1e8', '#98a5d8']
  };

  function villageSky(sun) {
    const b = new Buf(W, H);
    gradient(b, [[0, '#2458c6'], [40, '#3a75dc'], [85, '#5f9be9'], [125, '#8fbdf1'], [155, '#bcd8f4'], [180, '#e2ecf2'], [216, '#f4ecd9']], 9);
    // high cirrus veils
    for (let y = 18; y < 120; y++) {
      for (let x = 0; x < W; x++) {
        const n = fbm(x * 0.35, y * 3.2, 5, 48, 3);
        const band = Math.exp(-Math.pow((y - 58 - Math.sin(x * 0.01) * 14) / 16, 2)) + Math.exp(-Math.pow((y - 100) / 9, 2)) * 0.7;
        const I = clamp((n - 0.55) * 3, 0, 1) * band;
        const q = Math.floor(I * 3 + bay(x, y) * 0.999) / 3;
        if (q > 0) b.set(x, y, '#ffffff', q * 0.35);
      }
    }
    // the sun (upper-left, matching the scene light) with a quantised halo
    const [sx, sy] = sun || SUN;
    halo(b, sx, sy, 70, '#fff6d8', 0.4, 6, 2.2);
    halo(b, sx, sy, 22, '#fffbe8', 0.65, 4, 1.2);
    for (let y = sy - 9; y < sy + 10; y++) for (let x = sx - 9; x < sx + 10; x++) {
      const d = Math.hypot(x + 0.5 - sx, y + 0.5 - sy);
      if (d < 6.2) b.set(x, y, '#fffff6'); else if (d < 7.4) b.set(x, y, '#fff3c4');
    }
    return b.canvas();
  }

  // Mount Olympus: a skyline built from angled segments (steep summit pyramid, a shoulder, a lower second
  // summit) roughened by midpoint displacement; shaded by PLANES: ridge polylines run down from every summit
  // and shoulder, valleys between them — the west-facing plane left of each ridge takes the light (upper-left),
  // the east-facing plane right of it the shadow ramp. Snow is held in the valleys (couloirs), wind-stripped
  // rock is exposed along the crests and in slanted cliff bands, forest and haze take the foot of the massif.
  // The summit wears a tiny golden temple (day only — at night we are inside the temple itself).
  const OLY_X = 150; // layer x of the main summit: far from the world temple's pediment for the village camera range
  function mpd(pts, seed, rough) {
    const r = rng(seed), out = [pts[0]];
    const rec = (a, b, depth) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 3 || depth > 7) { out.push(b); return; }
      const m = [(a[0] + b[0]) / 2 + (r() - 0.5) * len * rough * 0.5, (a[1] + b[1]) / 2 + (r() - 0.5) * len * rough];
      rec(a, m, depth + 1); rec(m, b, depth + 1);
    };
    for (let i = 1; i < pts.length; i++) rec(pts[i - 1], pts[i], 0);
    return out;
  }
  // polyline → value per integer key (x for skylines, y for ridges), linear between vertices
  function sampleLine(pts, keyIdx, n, from) {
    const a = new Float32Array(n).fill(NaN), vi = 1 - keyIdx;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i], k0 = p[keyIdx], k1 = q[keyIdx];
      const lo = Math.ceil(Math.min(k0, k1)), hi = Math.floor(Math.max(k0, k1));
      for (let k = lo; k <= hi; k++) {
        const t = k1 === k0 ? 0 : (k - k0) / (k1 - k0), idx = k - (from || 0);
        if (idx >= 0 && idx < n && isNaN(a[idx])) a[idx] = p[vi] + (q[vi] - p[vi]) * t;
      }
    }
    return a;
  }
  // dx/dy move the summit (dy lowers it while the foot stays on the lake); story pages use a variant
  function olympusLayer(night, dx, dy, temple) {
    const b = new Buf(LW, H), LAKE = 141, OX = OLY_X + (dx || 0), X = OX - 150, DY = dy || 0;
    const sq = (p) => [p[0] + X, p[1] + DY * clamp((141 - p[1]) / 118, 0, 1)];
    // skyline: summit pyramid (steep 55–60° faces), left shoulder (25°), long 35° flank; right: notch, shoulder,
    // second summit, third summit, then low hazy ranges around the rest of the (periodic) layer.
    const S = [[-66, 128], [-20, 124], [16, 118], [40, 108], [56, 98], [74, 92], [92, 80], [106, 70], [118, 62], [126, 56], [136, 43],
      [144, 31], [150, 23], [153, 24], [156, 29], [160, 36], [168, 48], [176, 54], [186, 58], [198, 57], [212, 62], [226, 70], [240, 78],
      [252, 70], [262, 60], [268, 62], [276, 70], [290, 84], [304, 90], [318, 84], [330, 78], [338, 82], [352, 94], [372, 104], [398, 114],
      [430, 122], [470, 128], [520, 126], [566, 131], [612, 127], [660, 130], [702, 128]].map(sq);
    const top = sampleLine(mpd(S, night ? 11 : 12, 0.22), 0, LW + 140, -70);
    const TOP = new Float32Array(LW);
    for (let x = 0; x < LW; x++) { let v = top[x + 70]; if (isNaN(v) && x - LW + 70 >= 0) v = top[x - LW + 70]; TOP[x] = isNaN(v) ? 128 : v; }
    // ridges (start on the skyline, run down and outward) — [points]
    const RID = [
      [[150, 23], [153, 52], [160, 80], [167, 108], [176, 140]],
      [[126, 56], [120, 76], [112, 100], [106, 124], [100, 140]],
      [[92, 80], [86, 98], [78, 118], [72, 140]],
      [[56, 98], [52, 118], [48, 140]],
      [[186, 58], [192, 78], [196, 102], [204, 140]],
      [[262, 60], [264, 82], [268, 106], [276, 140]],
      [[218, 64], [224, 88], [232, 116], [238, 140]],
      [[330, 78], [334, 100], [340, 122], [346, 140]],
      [[304, 90], [310, 112], [316, 140]]
    ].map((R, i) => sampleLine(mpd(R.map(sq), 300 + i * 7 + (night ? 1 : 0), 0.5), 1, H, 0));
    const rock = night ? ['#9ea4d4', '#8a90c4', '#6e74aa', '#565b92', '#454879'] : ['#b2b6de', '#9ea3d2', '#7f84b8', '#666aa2', '#555892'];
    const snowL = night ? ['#e6ebfb', '#d0d8f2', '#bcc6ec'] : ['#ffffff', '#eef3fc', '#dfe7f7'];
    const snowS = night ? ['#9ea9dc', '#8791cc', '#707ab8'] : ['#c3cdef', '#a9b6e6', '#8f9cd6'];
    const wood = night ? ['#58608f', '#4a5180', '#3e4472'] : ['#8fa9b8', '#7c98ab', '#6c879f'];
    const haze = night ? '#4a4c86' : '#dce7f2';
    const r = rng(77);
    // slanted cliff bands on the lit planes of the snowfield (short parallelograms along the fall line)
    const bands = [];
    for (let i = 0; i < 9; i++) bands.push([OX - 50 + r() * 200, 50 + r() * 36, 4 + r() * 6, 0.6 + r() * 0.5]);
    for (let x = 0; x < LW; x++) {
      const t0 = Math.round(TOP[x]);
      const sl = (TOP[(x - 2 + LW) % LW] - TOP[(x + 2) % LW]) / 4; // >0: rising to the right → faces the light
      const mass = x > X + 20 && x < X + 420;
      for (let y = t0; y < (night ? 180 : LAKE); y++) {
        const dd = y - t0;
        // planes: ridges at this row, sorted; valleys halfway (wobbling) between neighbours
        let lit, dR = 99, dV = 99, pu = 0.5;
        if (mass) {
          let L = -1e9, R = 1e9;
          for (let k = 0; k < RID.length; k++) {
            const rx = RID[k][y];
            if (isNaN(rx)) continue;
            if (rx <= x && rx > L) L = rx;
            if (rx > x && rx < R) R = rx;
          }
          const vw = (fbm(x * 0.2, y, 91, 12, 2) - 0.5) * 0.3;
          if (L < -1e8 && R > 1e8) lit = sl > -0.1;
          else if (L < -1e8) { lit = true; dR = R - x; pu = 1 - clamp(dR / 34, 0, 1); }
          else if (R > 1e8) { lit = false; dR = x - L; dV = 99; pu = clamp(dR / 30, 0, 1); }
          else {
            const V = L + (R - L) * (0.52 + vw);
            lit = x >= V;
            dR = lit ? R - x : x - L;
            dV = Math.abs(x - V);
            pu = lit ? (x - V) / Math.max(1, R - V) : (x - L) / Math.max(1, V - L);
          }
        } else lit = sl > -0.05;
        // snow: held low in the valleys, stripped high on the crests
        const snowLine = 86 + (fbm(x, 0, 17, 16, 3, LW) - 0.5) * 22 + (lit ? (pu - 0.5) * 16 : (0.5 - pu) * 8) + (dV < 7 ? (7 - dV) * 3.2 : 0) - (dR < 3 ? 10 : 0) + (mass ? 0 : -40);
        let isSnow = y < snowLine;
        // wind-stripped rock just under the crest on the shadow side, broken into segments down the ridge
        if (isSnow && !lit && dR >= 1 && dR <= 2.5 && y - t0 > 3 && fbm(y, x * 0.1, 55, 7, 2) > 0.48) isSnow = false;
        let band = false;
        if (isSnow && lit) {
          for (let k = 0; k < bands.length; k++) {
            const B = bands[k], u = x - B[0] - (y - B[1]) * B[3];
            if (y >= B[1] && y < B[1] + 3 && u >= (y - B[1]) * 0.8 && u < B[2] - (y - B[1])) { band = y === B[1] ? 1 : 2; break; }
          }
          if (band) isSnow = false;
        }
        let c;
        if (isSnow) {
          // form shading across each plane: lit planes brighten toward their crest, shadow planes lift toward the valley
          if (lit) c = dR < 2.5 && dd > 0 ? snowL[0] : tone(snowL, 0.25 + pu * 0.62 - (y - 30) * 0.003 + (fbm(x, y * 0.5, 29, 8, 2, LW) - 0.5) * 0.18, x, y, 0.22);
          else c = dR < 3.5 ? snowS[2] : tone(snowS, 0.1 + pu * 0.75 + (fbm(x, y * 0.5, 31, 8, 2, LW) - 0.5) * 0.18, x, y, 0.22);
        } else {
          const alt = y - snowLine;
          if (band) c = band === 1 ? rock[1] : rock[3];
          else if (lit) c = tone(rock, 0.78 - alt * 0.004 + (fbm(x, y * 2, 23, 6, 2, LW) - 0.5) * 0.3, x, y, 0.35);
          else c = tone(rock, 0.3 - alt * 0.003 + (dV < 2 ? 0.08 : 0) + (fbm(x, y * 2, 23, 6, 2, LW) - 0.5) * 0.2, x, y, 0.35);
          // forest cloaking the foothills (edge wanders; darker on the shadow planes)
          const fw = (y - 108 - (fbm(x, 0, 33, 12, 2, LW) - 0.5) * 16) / 14;
          if (fw > 0) c = tone(wood, (lit ? 0.72 : 0.3) - fw * 0.1 + (fbm(x, y * 2, 29, 3, 1, LW) - 0.5) * 0.5, x, y, 0.4);
        }
        if (dd === 0) c = sl > -0.1 ? (isSnow ? snowL[0] : rock[0]) : (isSnow ? snowS[0] : rock[1]); // crisp crest line
        const ht = clamp((y - 106) / 40, 0, 1);
        if (ht > 0) c = qmix(c, haze, ht * 0.9, x, y, 5);
        b.set(x, y, c);
      }
    }
    // a still lake at the foot of the massif mirroring it (wavy, hazy reflection + glints)
    if (!night) {
      const lake = rgb('#9dbde6'), deep = rgb('#7fa2d8');
      for (let y = LAKE; y < H; y++) {
        const dy = y - LAKE, sy = LAKE - 1 - Math.round(dy * 1.15);
        const wob = Math.round(Math.sin(y * 1.7) * (dy > 3 ? 1 : 0) + Math.sin(y * 0.4) * 0.6);
        for (let x = 0; x < LW; x++) {
          const src = sy >= 0 ? b.getc(x + wob, sy) : null;
          const has = sy >= 0 && b.alpha(x + wob, sy) > 200;
          const baseC = mixc(lake, deep, clamp(dy / 36, 0, 1));
          let c = has ? qmix(src, baseC, 0.45 + dy / 70, x, y, 4) : baseC;
          if (dy === 0) c = rgb('#dfeaf6');
          b.set(x, y, c);
        }
      }
      const rr = rng(5);
      for (let i = 0; i < 120; i++) {
        const x = (rr() * LW) | 0, y = LAKE + 2 + ((Math.pow(rr(), 0.8) * 30) | 0);
        const len = 1 + ((rr() * 5) | 0);
        for (let k = 0; k < len; k++) b.set(x + k, y, k === 0 || k === len - 1 ? '#e2ecf8' : '#ffffff');
      }
    }
    if (night && !temple) return b.canvas();
    // golden temple on the summit + divine glow and a faint beam
    const tx = ((OX % LW) + LW) % LW, ty = Math.round(TOP[tx]) + 1;
    halo(b, tx, ty - 6, 30, '#fff2c0', 0.5, 5, 1.9);
    for (let y = 0; y < ty - 12; y++) {
      const f = y / (ty - 12);
      for (let dx = -2; dx <= 2; dx++) {
        const q = qb((1 - Math.abs(dx) / 3) * f * f, 3, tx + dx, y, 0.15);
        if (q > 0) b.set(tx + dx, y, '#fff4c8', q * 0.2);
      }
    }
    const G = ['#fff7c0', '#ffd54a', '#e39b1d', '#a8621b', '#6b3a1a'];
    const X0 = tx - 5;
    b.rect(X0 - 1, ty - 1, 13, 2, G[3]); b.rect(X0 - 1, ty - 1, 13, 1, G[2]);
    b.rect(X0, ty - 2, 11, 1, G[1]);
    for (let i = 0; i < 4; i++) { b.rect(X0 + 1 + i * 3, ty - 6, 1, 4, i < 2 ? G[0] : G[1]); b.rect(X0 + 2 + i * 3, ty - 6, 1, 4, G[3]); }
    b.rect(X0, ty - 7, 11, 1, G[2]); b.rect(X0 - 1, ty - 8, 13, 1, G[1]);
    b.rect(X0 + 1, ty - 9, 9, 1, G[0]); b.rect(X0 + 3, ty - 10, 5, 1, G[1]); b.rect(X0 + 5, ty - 11, 1, 1, G[0]);
    b.set(X0 + 5, ty - 12, '#ffffff');
    return b.canvas();
  }

  // Far ranges / hills with dressing. kind: 'far' | 'mid' | 'near' | 'bush'
  function villageHills(kind) {
    const b = new Buf(LW, H);
    const r = rng(kind.length * 97 + 3);
    if (kind === 'far') {
      const top = profile(LW, 128, 24, 61, 192, 4, (x) => Math.sin((x / LW) * Math.PI * 6) * 8);
      ridge(b, top, { pal: ['#9ab3e3', '#819dd6', '#6e8bc9', '#607cbc'], seed: 3, slopeK: 2.2, faceD: 30, tex: 0.3, texCell: 24, texY: 2, rim: '#d2e0f6', haze: VIL.haze, hazeFrom: 150, hazeLen: 30, hazeMax: 0.8 });
      // tiny far villages catching the sun
      for (let i = 0; i < 7; i++) {
        const x = (r() * LW) | 0, y = Math.round(top[x]) + 4 + ((r() * 5) | 0);
        for (let k = 0; k < 3 + ((r() * 3) | 0); k++) { b.set(x + k * 2, y, '#eef2f8'); b.set(x + k * 2 + 1, y, '#c9d3ea'); }
      }
    } else if (kind === 'mid') {
      const top = profile(LW, 158, 12, 71, 128, 4, (x) => Math.sin((x / LW) * Math.PI * 8 + 1) * 5);
      ridge(b, top, { pal: ['#b9d6a8', '#9dc49a', '#84b08e', '#6f9c86', '#5f8a80'], seed: 5, slopeK: 2.4, faceD: 26, tex: 0.35, texCell: 12, rim: '#d0e6b6', haze: VIL.haze, hazeLen: 40, hazeMax: 0.55 });
      // groves and cypresses
      for (let i = 0; i < 70; i++) {
        const x = (r() * LW) | 0, y = Math.round(top[x]) + 2 + ((r() * 14) | 0);
        if (r() < 0.45) cypress(b, x, y, 6 + ((r() * 6) | 0), ['#8fb294', '#6f9682', '#5b7f74'], null);
        else crown(b, x, y - 2, 2.2, 1.6, ['#a7c796', '#86ad86', '#6c9478'], i + 1, null);
      }
      // white village on a shoulder + a small shrine
      for (let v = 0; v < 3; v++) {
        const x0 = 90 + v * 250 + ((r() * 40) | 0);
        for (let k = 0; k < 5; k++) {
          const x = x0 + k * 7 + ((r() * 3) | 0), y = Math.round(top[x + 2]) + 6 + ((r() * 4) | 0);
          house(b, x, y, 4 + ((r() * 2) | 0), 3, '#f2f2f4', '#cfd3e2', '#d99a7e', '#7f9ac4');
        }
      }
    } else if (kind === 'near') {
      const top = profile(LW, 170, 10, 81, 96, 4, (x) => Math.sin((x / LW) * Math.PI * 10 + 2) * 4);
      ridge(b, top, { pal: ['#c4e38e', '#a2cf74', '#84b961', '#6aa055', '#578a4d'], seed: 7, slopeK: 2.6, faceD: 22, tex: 0.45, texCell: 10, texY: 2.5, rim: '#dcf2a6', haze: '#cfe3bc', hazeLen: 60, hazeMax: 0.25 });
      // field stripes (terraces)
      for (let x = 0; x < LW; x++) {
        const t0 = Math.round(top[x]);
        for (let k = 1; k < 5; k++) {
          const y = t0 + k * 7 + Math.round(Math.sin(x * 0.03 + k) * 2);
          if (bay(x, y) < 0.6) b.set(x, y, k & 1 ? '#6aa055' : '#b6da80');
        }
      }
      for (let i = 0; i < 46; i++) {
        const x = (r() * LW) | 0, y = Math.round(top[x]) + 3 + ((r() * 10) | 0);
        if (r() < 0.4) cypress(b, x, y, 12 + ((r() * 10) | 0), ['#6d9a58', '#4f7f4a', '#3f6a44', '#325a40'], '#8cb866');
        else crown(b, x, y - 3, 4 + r() * 2, 3 + r() * 1.5, ['#b3cf86', '#8fb46c', '#6f9858', '#577f4c'], i + 40, '#cfe49a', ['#8a6a4a', '#6e5240', '#50392e']);
      }
      // a ruined temple on a knoll
      const tx = 520, ty = Math.round(top[tx]) + 2;
      b.rect(tx - 12, ty - 1, 25, 2, '#e9e6ef'); b.rect(tx - 12, ty, 25, 1, '#b9b6cc');
      for (let i = 0; i < 5; i++) if (i !== 3) { const hh = i === 4 ? 6 : 10; b.rect(tx - 10 + i * 5, ty - 1 - hh, 2, hh, '#f7f5fa'); b.rect(tx - 9 + i * 5, ty - 1 - hh, 1, hh, '#c8c3d8'); }
      b.rect(tx - 11, ty - 12, 18, 2, '#f1eef6'); b.rect(tx - 11, ty - 11, 18, 1, '#c3bdd4');
    } else {
      // closest bushes / olive canopy line just above the ground
      const top = profile(LW, 181, 6, 91, 48, 3);
      for (let x = 0; x < LW; x += 5 + ((r() * 7) | 0)) {
        const y = Math.round(top[x]);
        crown(b, x, y, 7 + r() * 6, 5 + r() * 3, ['#9fcf6a', '#78b456', '#5b9848', '#467d40', '#35653a'], x + 5, '#c4ea88');
      }
      for (let x = 0; x < LW; x++) for (let y = Math.round(top[x]) + 3; y < H; y++) b.set(x, y, tone(['#5b9848', '#467d40', '#35653a'], 0.6 - (y - top[x]) * 0.03, x, y));
      // no pinholes: below the first opaque pixel of each column everything is solid foliage
      for (let x = 0; x < LW; x++) {
        let y = 0;
        while (y < H && b.alpha(x, y) < 200) y++;
        for (; y < H; y++) if (b.alpha(x, y) < 250) b.set(x, y, b.alpha(x, y - 1) > 200 && y > 0 ? mixc(b.getc(x, y - 1), '#35653a', 0.5) : '#35653a');
      }
    }
    return b.canvas();
  }

  // Sprite clouds (cached), shaded from the upper-left.
  function cloudSprite(w, h, seed, pal, edge) {
    const b = new Buf(w, h);
    cloudPaint(b, 0, 0, w, h, seed, pal);
    // 1-px cool underside/back edge so a cloud never merges with the snow behind it
    if (edge) for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) {
      if (b.alpha(x, y) < 200) continue;
      if (y === h - 1 || b.alpha(x, y + 1) < 200 || (x < w - 1 && b.alpha(x + 1, y) < 200 && y > h * 0.45)) b.set(x, y, edge);
    }
    return b.canvas();
  }
  // Cumulus built from 3–6 lobes of different sizes (big one off-centre), shaded from the upper-left,
  // with a flat base whose underside is a darker dithered band.
  function cloudPaint(b, ox, oy, w, h, seed, pal) {
    const r = rng(seed);
    const n = clamp(Math.round(w / 22) + 2, 3, 6);
    const base = h - 2, blobs = [];
    const bigAt = 0.3 + r() * 0.4;
    const sp = (w * 0.8) / Math.max(1, n - 1);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const cx = w * (0.1 + t * 0.8) + (r() - 0.5) * sp * 0.4;
      const big = Math.exp(-Math.pow((t - bigAt) / 0.3, 2));
      const ry = (base - 1) * (0.26 + big * 0.24 + r() * 0.08) + 0.5;
      const rx = Math.max(ry * 1.25, sp * (0.7 + r() * 0.35)) * (1 + big * 0.2);
      const cy = Math.max(ry, base - ry * (0.55 + r() * 0.35));
      const rxx = Math.min(rx, w / 2 - 1.5);
      blobs.push([clamp(cx, rxx + 1, w - rxx - 1), cy, rxx, ry]);
    }
    const fr = (base - 1) * 0.3 + 0.5;
    blobs.push([w * 0.5, base - fr * 0.5, w * 0.4, fr]); // filler along the flat base
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (y > base) continue;
      let best = -1, nx = 0, ny = 0;
      blobs.forEach((bl) => {
        const dx = (x + 0.5 - bl[0]) / bl[2], dy = (y + 0.5 - bl[1]) / bl[3], d = 1 - Math.sqrt(dx * dx + dy * dy);
        if (d > best) { best = d; nx = dx; ny = dy; }
      });
      if (best < 0) continue;
      const lit = -nx * 0.6 - ny * 0.8;
      let v = 0.5 + lit * 0.45 - (y / h) * 0.3 + (fbm(x, y, seed, 6, 2) - 0.5) * 0.16;
      if (best < 0.12 && lit < 0) v -= 0.12;                 // lobe separations on the shadow side
      if (y >= base - 2) v -= (y - (base - 3)) * 0.12 + (bay(x, y) < 0.5 ? 0.08 : 0); // dithered underside
      b.set(ox + x, oy + y, tone(pal, v, x, y, 0.4));
    }
  }

  /* ================================================================
     FOREST — twilight turning into moonlit night
     ================================================================ */
  const FOR = {
    moon: [96, 52],
    mist: '#a784b0'
  };
  function forestSky() {
    const b = new Buf(W, H);
    gradient(b, [[0, '#0c0c2a'], [30, '#161642'], [58, '#25225e'], [82, '#3d2f78'], [100, '#633d88'], [116, '#914f8e'], [130, '#bf668b'], [144, '#df8783'], [160, '#f0a980'], [216, '#f7c889']], 7);
    // dim static star field (twinkling ones are animated)
    const r = rng(23);
    for (let i = 0; i < 170; i++) {
      const x = (r() * W) | 0, y = (Math.pow(r(), 1.6) * 140) | 0;
      const a = (1 - y / 150) * (0.35 + r() * 0.5);
      b.set(x, y, r() < 0.2 ? '#ffe9c8' : '#c9c8ff', a);
    }
    // faint milky band
    for (let y = 0; y < 120; y++) for (let x = 0; x < W; x++) {
      const d = (y - (x * 0.28 - 10)) / 22;
      const I = Math.exp(-d * d) * clamp((fbm(x, y, 29, 24, 3) - 0.35) * 2, 0, 1);
      const q = Math.floor(I * 3 + bay(x, y) * 0.999) / 3;
      if (q > 0) b.set(x, y, '#9a8fe0', q * 0.2);
    }
    // the moon, lit from itself; subtle maria; cool quantised halo
    const [mx, my] = FOR.moon, MR = 17;
    halo(b, mx, my, 92, '#8f86e0', 0.32, 6, 1.9);
    halo(b, mx, my, 38, '#d8d4ff', 0.35, 5, 1.4);
    // the disc: flat light, a soft terminator band to the lower-right, three flat maria, a bright upper-left limb
    const MARIA = [[-5, -4, 6, 4.2], [5, 1, 4.5, 5.5], [-3, 7, 4, 2.6]];
    for (let y = my - MR - 1; y <= my + MR + 1; y++) for (let x = mx - MR - 1; x <= mx + MR + 1; x++) {
      const dx = (x + 0.5 - mx) / MR, dy = (y + 0.5 - my) / MR, d = dx * dx + dy * dy;
      if (d > 1) continue;
      const sh = dx * 0.55 + dy * 0.45;
      let c = sh > 0.52 ? '#e7dcc0' : sh > 0.25 ? '#f4ecd6' : '#fbf6e8';
      const mare = MARIA.some((m) => Math.pow((x + 0.5 - mx - m[0]) / m[2], 2) + Math.pow((y + 0.5 - my - m[1]) / m[3], 2) < 1);
      if (mare) c = sh > 0.4 ? '#d6c9aa' : '#e4d8bb';
      if (d > 0.8 && dx + dy < -0.35) c = '#ffffff';
      b.set(x, y, c);
    }
    return b.canvas();
  }

  // One layer of forest: rounded crowns + firs, a solid mass below, moon rim light on the upper-left edges.
  function treeline(o) {
    const b = new Buf(LW, H);
    const r = rng(o.seed);
    const pal = o.pal.map(rgb);
    const top = profile(LW, o.base, o.amp || 8, o.seed + 1, 96, 3);
    // mass
    for (let x = 0; x < LW; x++) {
      for (let y = Math.round(top[x]); y < H; y++) {
        let v = 0.35 - (y - top[x]) * (o.fade || 0.004) + (fbm(x, y, o.seed + 2, 12, 2, LW) - 0.5) * 0.4;
        b.set(x, y, tone(pal, v, x, y, 0.4));
      }
    }
    // crowns / firs
    const items = [];
    for (let x = 0; x < LW; x += o.step[0] + ((r() * o.step[1]) | 0)) items.push(x);
    items.forEach((x, i) => {
      const y = Math.round(top[x]);
      const sz = o.size[0] + r() * o.size[1];
      if (r() < (o.firs || 0)) {
        const h = sz * 2.4;
        for (let j = 0; j < h; j++) {
          const f = j / h;
          const hw = j < 2 ? 0 : Math.max(1, f * sz * 0.55 + Math.sin(j * 1.3) * (sz * 0.07) * (j % 3 === 0 ? 1 : 0));
          for (let k = Math.round(-hw); k <= Math.round(hw); k++) {
            const lit = -k / (hw + 1) * 0.6 + 0.25 - f * 0.3;
            let c = tone(pal, 0.35 + lit * 0.5, x + k, y - h + j + 4, 0.35);
            if (k === Math.round(-hw) && j > 1 && o.rim) c = rgb(o.rim);
            b.set(x + k, y - h + j + 4, c);
          }
        }
      } else {
        crown(b, x, y - sz * 0.35, sz * 1.05, sz * 0.8, pal, o.seed * 13 + i, o.rim);
      }
    });
    if (o.trunks) {
      for (let i = 0; i < o.trunks; i++) {
        const x = Math.round((i + r() * 0.6) * LW / o.trunks), tw = 2 + ((r() * 3) | 0);
        const yt = Math.round(top[x]) - 4;
        for (let y = yt; y < H; y++) for (let k = 0; k < tw; k++) b.set(x + k, y, k === 0 && o.rim ? mixc(o.rim, pal[2], 0.5) : pal[pal.length - 1]);
      }
    }
    if (o.mist) mist(b, o.mist[0], o.mist[1], o.mist[2], o.mist[3], o.seed + 9, 0.55);
    return b.canvas();
  }

  // Near forest: tall trunks with rim light, big leaf canopy hanging from the top, dark undergrowth.
  function forestNear(o) {
    const b = new Buf(LW, H);
    const r = rng(o.seed);
    const pal = o.pal.map(rgb);
    const n = o.trees;
    for (let i = 0; i < n; i++) {
      const x0 = Math.round((i + 0.2 + r() * 0.6) * LW / n), tw = o.tw[0] + ((r() * o.tw[1]) | 0), ph = r() * 6;
      const bendA = 3 + r() * 3, bendK = 0.8 + r() * 0.9, flareH = 12 + r() * 8, flareW = 3 + (i % 3);
      for (let y = 0; y < H; y++) {
        // one or two gentle bends, 1 px of taper every 40 px going up, a 3–5 px root flare
        const cx = x0 + tw / 2 + Math.sin((y / H) * Math.PI * bendK + ph) * bendA;
        const wd = Math.max(4, tw - Math.floor((H - y) / 40));
        const fl = y > H - flareH ? Math.pow((y - (H - flareH)) / flareH, 2) * flareW : 0;
        const L = Math.round(cx - wd / 2 - fl), R = Math.round(cx + wd / 2 + fl * 0.8);
        for (let x = L; x <= R; x++) {
          const u = (x - L) / Math.max(1, R - L);
          // bark: vertical ridges as elongated clusters, lit on the moon side, furrows in shadow
          const rg = fbm(x * 0.9, y * 0.08, o.seed + i * 7, 3, 2);
          let v = u < 0.28 ? 0.74 : u < 0.6 ? 0.52 : u < 0.84 ? 0.3 : 0.1;
          if (rg > 0.63) v += 0.2; else if (rg < 0.35) v -= 0.22;
          let c = tone(pal, v, x, y, 0.15);
          if (x === L && o.rim && fbm(y, i, o.seed + 40, 6, 2) > 0.36) c = rgb(o.rim); // broken moonlit rim
          b.set(x, y, c);
        }
      }
      // branches
      for (let j = 0; j < 3; j++) {
        // (kept below the moon's band so no clump ever crosses the moon, whatever the parallax offset)
        const by = 104 + ((r() * 44) | 0), dir = r() < 0.5 ? -1 : 1, len = 10 + ((r() * 16) | 0);
        const bx = x0 + (dir > 0 ? tw - 1 : 0) + Math.round(Math.sin((by / H) * Math.PI * bendK + ph) * bendA);
        for (let k = 0; k < len; k++) {
          const yy = by - k * 0.55 + Math.sin(k * 0.3) * 1.2, th = k < len * 0.3 ? 3 : k < len * 0.65 ? 2 : 1;
          for (let q = 0; q < th; q++) b.set(bx + dir * k, yy + q, q === 0 ? (dir < 0 ? o.rim : pal[2]) : pal[4]);
        }
        // foliage: 2–3 overlapping masses clustered along the outer branch (no lollipops), moonlit top edges
        const nm = 2 + ((r() * 2) | 0);
        for (let m = 0; m < nm; m++) {
          const kk = len * (0.45 + m * 0.3 + r() * 0.1);
          const mx = bx + dir * kk + (r() - 0.5) * 6, my = by - kk * 0.55 - 2 - r() * 6 + (m === 1 ? -4 : 0);
          crown(b, mx, my, 7 + r() * 6, 5 + r() * 3, pal, x0 + j * 17 + m * 5, o.rim);
        }
      }
    }
    // canopy clumps hanging from the top of the screen
    for (let x = 0; x < LW; x += 10 + ((r() * 12) | 0)) {
      const y = -6 + r() * (o.canopy || 26);
      crown(b, x, y, 12 + r() * 10, 8 + r() * 6, pal, x + o.seed, o.rim);
    }
    // undergrowth: ferns and bushes rising from the bottom
    const top = profile(LW, o.ground, 6, o.seed + 3, 48, 3);
    for (let x = 0; x < LW; x += 6 + ((r() * 6) | 0)) crown(b, x, top[x], 7 + r() * 6, 5 + r() * 3, pal, x * 3 + o.seed, o.rim);
    for (let x = 0; x < LW; x++) for (let y = Math.round(top[x]) + 3; y < H; y++) b.set(x, y, tone(pal, 0.2 - (y - top[x]) * 0.02, x, y, 0.4));
    return b.canvas();
  }

  /* ================================================================
     CAVE — warm, deep cavern
     ================================================================ */
  function caveSky() {
    const b = new Buf(W, H);
    gradient(b, [[0, '#0c060e'], [50, '#170b12'], [100, '#261114'], [140, '#3a1a14'], [175, '#2a1210'], [216, '#12080a']], 9);
    halo(b, 200, 128, 170, '#7a3218', 0.5, 12, 1.6);  // distant lava/firelight glow (many shallow bands)
    halo(b, 200, 140, 70, '#ff9a40', 0.26, 8, 1.6);
    // the farthest depth plane: flat hazy silhouettes of spires and hanging teeth against the glow,
    // melting into it (lightest nearest the light), each with a 1-px lit edge on the side facing it
    const r = rng(808);
    const sil = (x0, base, hgt, wd, up) => {
      for (let j = 0; j < hgt; j++) {
        const t = j / hgt, hw = wd * (1 - Math.pow(t, 1.3)) + 0.4, y = up ? base - j : base + j;
        const cx = x0 + (fbm(j, x0, 811, 8, 2) - 0.5) * 2;
        for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
          const g = clamp(1 - Math.hypot((x - 200) / 150, (y - 132) / 90), 0, 1);
          const col = mixc('#2a1210', '#8a4024', Math.round(g * 5) / 5 * 0.8);
          const edge = (x === Math.round(x > 200 ? cx - hw : cx + hw));
          b.set(x, y, edge && g > 0.2 ? mixc(col, '#c06a3a', 0.45) : col);
        }
      }
    };
    for (let x = 6; x < W; x += 10 + r() * 22) sil(x, 176 + r() * 8, 18 + r() * 34 * (1 - Math.abs(x - 200) / 260), 3 + r() * 5, true);
    for (let x = 2; x < W; x += 8 + r() * 18) sil(x, 0, 30 + r() * 44, 3 + r() * 6, false);
    for (let x = 0; x < W; x++) for (let y = 176; y < H; y++) if (b.alpha(x, y) > 0) b.set(x, y, mixc('#2a1210', '#5a2618', clamp(1 - Math.abs(x - 200) / 200, 0, 1) * 0.8));
    return b.canvas();
  }
  // Shade a vertical rock form as a cone/cylinder from per-row spans [y, L, R, t]: a continuous lit band
  // (2–3 px, tapering with the width) on the side facing the glow, a 1-px highlight broken every 6–10 px,
  // a mid tone, a shadow band and a violet bounce near the tip on the far side. ld = +1 glow to the right.
  function shadeForm(b, rows, o, ld, seed, tipTop) {
    const pal = o.pal, r = rng(seed * 3 + 1);
    let gapAt = 3 + ((r() * 6) | 0);
    rows.forEach((rw, k) => {
      const y = rw[0], L = rw[1], R = rw[2], t = rw[3];
      const mid = (L + R) / 2, hw = Math.max(0.5, (R - L) / 2 + 0.5);
      const litW = clamp(hw * 0.42, 1, 3), shW = clamp(hw * 0.4, 1, 3.5);
      if (k === gapAt) gapAt += 6 + ((r() * 5) | 0);
      const broken = k === gapAt - 1 || (k === gapAt - 2 && hw > 3);
      const x0 = Math.round(L), x1 = Math.round(R);
      for (let x = x0; x <= x1; x++) {
        const dl = ld > 0 ? x1 - x : x - x0;        // px from the lit edge
        const ds = ld > 0 ? x - x0 : x1 - x;        // px from the shadow edge
        let c;
        if (x1 - x0 < 1) c = pal[1];
        else if (dl < 1) c = broken ? pal[1] : o.rim;
        else if (dl < 1 + litW) c = pal[1];
        else if (ds < 1) c = (tipTop ? t > 0.4 : t < 0.6) && (k & 1) ? mixc(o.bounce, pal[3], 0.4) : pal[4];
        else if (ds < 1 + shW) c = pal[3];
        else c = pal[2];
        b.set(x, y, c);
      }
    });
  }
  // A stalactite (top) or stalagmite (bottom): wobbling profile, convex taper, a slight lean.
  function formation(b, x0, y0, len, w, top, seed, o, ld) {
    const r = rng(seed), dir = top ? 1 : -1, rows = [];
    const lean = (r() - 0.5) * 0.16, bulge = 0.15 + r() * 0.35, bw = r() * 0.12;
    for (let j = 0; j <= len; j++) {
      const t = j / len;
      let hw = w * (0.7 * (1 - Math.pow(t, 1.5)) + 0.3 * (1 - t)) * (1 + bw * Math.exp(-Math.pow((t - bulge) / 0.08, 2)));
      const cx = x0 + lean * j + (fbm(j, 0, seed, 14, 2) - 0.5) * 2.4;
      const L = cx - hw - (fbm(j, 1, seed + 1, 7, 2) - 0.5) * 1.6, R = cx + hw + (fbm(j, 2, seed + 2, 7, 2) - 0.5) * 1.6;
      if (R - L < 0.6) { if (t > 0.8) rows.push([y0 + dir * j, cx, cx, t]); continue; }
      rows.push([y0 + dir * j, L, R, t]);
    }
    shadeForm(b, rows, o, ld, seed, top);
    if (top) { const last = rows[rows.length - 1]; if (last) b.set(Math.round((last[1] + last[2]) / 2), last[0] + 1, o.rim); } // a drop of light at the tip
  }
  // A column where a stalactite met a stalagmite: pinched waist, flared base and cap.
  function pillar(b, x0, yTop, yBot, w, seed, o, ld) {
    const r = rng(seed), rows = [], ym = yTop + (yBot - yTop) * (0.45 + r() * 0.15), half = (yBot - yTop) / 2;
    for (let y = yTop; y <= yBot; y++) {
      const k = Math.abs(y - ym) / half;
      const hw = w * (0.36 + 0.64 * Math.pow(k, 1.7)) * (1 + 0.1 * Math.sin(y * 0.21 + seed));
      const cx = x0 + (fbm(y, 0, seed, 24, 2) - 0.5) * 6;
      const L = cx - hw - (fbm(y, 1, seed + 1, 8, 2) - 0.5) * 2, R = cx + hw + (fbm(y, 2, seed + 2, 8, 2) - 0.5) * 2;
      rows.push([y, L, R, 0.5]);
    }
    shadeForm(b, rows, o, ld, seed, true);
  }
  // Hexagonal crystal shards (light face, dark face, 1-px glint) inside a 2-band cyan halo.
  const CRY = ['#e9ffff', '#92f0ff', '#46c6ec', '#2786c4', '#1b4f8e', '#15305e'];
  function crystalCluster(b, x, y, seed, sc) {
    const r = rng(seed);
    halo(b, x, y - 5 * sc, 20 * sc, '#2aa6d8', 0.22, 2, 1.1);
    halo(b, x, y - 4 * sc, 9 * sc, '#6fe0ff', 0.25, 2, 1.0);
    const n = 3 + ((r() * 3) | 0), sh = [];
    for (let k = 0; k < n; k++) {
      const f = n === 1 ? 0 : k / (n - 1) - 0.5;
      sh.push({ a: f * 1.1 + (r() - 0.5) * 0.25, len: (5 + r() * 3 + (1 - Math.abs(f) * 2) * 5) * sc, w: (1.3 + r() * 0.9) * sc, ox: f * 5 * sc, pr: Math.abs(f) });
    }
    sh.sort((p, q) => q.pr - p.pr);
    sh.forEach((s) => {
      const ax = Math.sin(s.a), ay = -Math.cos(s.a), px = -ay, py = ax;
      for (let d = 0; d <= s.len; d += 0.5) {
        const hw = d < s.len * 0.72 ? s.w : s.w * (s.len - d) / (s.len * 0.28);
        for (let o = -hw; o <= hw; o += 0.5) {
          const X = x + s.ox + ax * d + px * o, Y = y + ay * d + py * o;
          let c = o < -0.2 ? (o < -hw + 0.8 ? CRY[1] : CRY[2]) : (o > hw - 0.8 ? CRY[4] : CRY[3]);
          if (d > s.len * 0.72 && o < 0) c = CRY[1];
          b.set(X, Y, c);
        }
      }
      b.set(x + s.ox + ax * s.len * 0.72 + px * -s.w * 0.5, y + ay * s.len * 0.72 + py * -s.w * 0.5, CRY[0]);
      b.set(x + s.ox + ax * s.len, y + ay * s.len, CRY[0]);
    });
    for (let i = -4; i <= 4; i++) if (bay(x + i, y) < 0.6) b.set(x + i, y + 1, i < 0 ? CRY[4] : CRY[5]);
  }
  function caveLayer(o) {
    const b = new Buf(LW, H);
    const r = rng(o.seed);
    o.pal = o.pal.map(rgb);
    const gxs = [o.glow[0], o.glow[0] + 384, o.glow[0] - 384, o.glow[0] + 768];
    const ldAt = (x) => { let best = gxs[0]; gxs.forEach((g) => { if (Math.abs(g - x) < Math.abs(best - x)) best = g; }); return best > x ? 1 : -1; };
    const up = profile(LW, o.ceil, o.ceilAmp, o.seed + 1, 96, 4, (x) => (fbm(x, 9, o.seed + 11, 24, 2, LW) - 0.5) * 6);
    const dn = profile(LW, o.floor, o.floorAmp, o.seed + 2, 96, 4, (x) => (fbm(x, 7, o.seed + 12, 24, 2, LW) - 0.5) * 5);
    // irregular drip line under the ceiling: rounded 1–4 px lobes
    for (let i = 0; i < LW / 5; i++) {
      const x0 = (r() * LW) | 0, wl = 2 + ((r() * 6) | 0), dp = 1 + r() * 3;
      for (let k = -wl; k <= wl; k++) { const xx = (x0 + k + LW) % LW, d = dp * Math.sqrt(Math.max(0, 1 - (k / (wl + 0.5)) ** 2)); up[xx] = Math.max(up[xx], Math.round(up[(x0 + LW) % LW]) + d); }
    }
    // ceiling & floor masses: a few flat tonal clusters, strata inside the mass only, lit lip facing the glow
    for (let x = 0; x < LW; x++) {
      const u0 = Math.round(up[x]), d0 = Math.round(dn[x]);
      const slU = (up[(x + 2) % LW] - up[(x - 2 + LW) % LW]) / 4 * ldAt(x), slD = (dn[(x - 2 + LW) % LW] - dn[(x + 2) % LW]) / 4 * ldAt(x);
      for (let y = 0; y < H; y++) {
        let e, sl;
        if (y <= u0) { e = u0 - y; sl = slU; } else if (y >= d0) { e = y - d0; sl = slD; } else continue;
        // elongated strata clusters (stretched along x), lighter near the lip, darker deep in the mass
        const cl = fbm(x * 0.375, y * 1.6, o.seed + 5, 24, 2, LW * 0.375) + (e < 8 ? 0.12 : e > 18 ? -0.1 : 0);
        let c = cl > 0.6 ? o.pal[2] : cl < 0.42 ? o.pal[4] : o.pal[3];
        const stratum = Math.abs(fbm(x * 0.25, y, o.seed + 8, 12, 2, LW / 4) - 0.5) < 0.02 && e > 3;
        if (stratum) c = o.pal[4];
        if (y >= d0) { // floor: the top surface catches the glow
          if (e === 0) c = sl > -0.2 ? o.rim : o.pal[1];
          else if (e <= 2) c = o.pal[1];
          else if (e <= 4 && bay(x, y) < 0.5) c = o.pal[2];
        } else {        // ceiling lip: dark underside, a lit rim only where it turns toward the glow
          if (e === 0) c = sl > 0.25 ? o.pal[1] : o.pal[4];
          else if (e === 1) c = o.pal[3];
        }
        b.set(x, y, c);
      }
    }
    // formations: Poisson-like spacing (gaps 14–60 px), thin stalactites clustered beside the big ones
    const spots = [];
    for (let x = r() * 20; x < LW - 8;) {
      const big = r() < 0.45, top = r() < 0.62;
      spots.push([Math.round(x), big, top]);
      if (big && r() < 0.7) { const n = 1 + ((r() * 2) | 0); for (let k = 0; k < n; k++) spots.push([Math.round(x + (k + 1) * (4 + r() * 5) * (r() < 0.5 ? -1 : 1)), false, top]); }
      x += 14 + Math.pow(r(), 1.5) * 46 * o.spread;
    }
    spots.forEach((sp, i) => {
      const [x, big, top] = sp, xx = ((x % LW) + LW) % LW;
      const len = (big ? o.len[0] + r() * o.len[1] : o.len[0] * 0.35 + r() * o.len[0] * 0.5) * (top ? 1 : 0.7);
      const w = big ? 4.5 + r() * o.wid * 1.2 : 1.6 + r() * 1.8;
      formation(b, xx, top ? Math.round(up[xx]) - 2 : Math.round(dn[xx]) + 2, Math.round(len), w, top, o.seed * 100 + i, o, ldAt(xx));
    });
    for (let i = 0; i < (o.pillars || 0); i++) {
      const x = Math.round((i + 0.3 + r() * 0.4) * LW / o.pillars);
      pillar(b, x, Math.round(up[x]) - 4, Math.round(dn[x]) + 4, 7 + r() * 7, o.seed * 50 + i, o, ldAt(x));
    }
    // glow haze: forms melt into the warm air near the light (atmospheric perspective of a cave)
    if (o.haze) {
      const hz = rgb(o.haze);
      for (let y = 0; y < H; y++) {
        const k = o.hazeK * Math.exp(-Math.pow((y - o.glow[1]) / o.hazeSpread, 2));
        if (k < 0.04) continue;
        for (let x = 0; x < LW; x++) {
          if (b.alpha(x, y) < 200) continue;
          const dx = Math.abs(((x - o.glow[0]) % 384 + 576) % 384 - 192) / 192; // 0 at the glow
          b.set(x, y, qmix(b.getc(x, y), hz, k * (1 - dx * 0.55), x, y, 4));
        }
      }
    }
    if (o.mist) mist(b, o.mist[0], o.mist[1], o.mist[2], o.mist[3], o.seed + 9, 0.6);
    for (let i = 0; i < (o.gems || 0); i++) {
      const x = Math.round((i + 0.2 + r() * 0.6) * LW / o.gems);
      crystalCluster(b, x, Math.round(dn[x]) + 2, o.seed + i * 7, o.gemScale || 1);
    }
    return b.canvas();
  }

  /* ================================================================
     TEMPLE — night sky over Olympus (mostly hidden behind walls)
     ================================================================ */
  function templeSky() {
    const b = new Buf(W, H);
    gradient(b, [[0, '#090a24'], [60, '#141a46'], [120, '#26306a'], [170, '#3d4a88'], [216, '#5a5f9e']], 9);
    const r = rng(41);
    for (let i = 0; i < 200; i++) { const x = (r() * W) | 0, y = (Math.pow(r(), 1.4) * 170) | 0; b.set(x, y, r() < 0.25 ? '#fff4d0' : '#cfd4ff', 0.3 + r() * 0.6); }
    // a waning crescent lit from the lower-left — the same phase the temple window shows
    const mx = 80, my = 44, MR = 11;
    halo(b, mx, my, 64, '#a6a8f0', 0.26, 5, 1.8);
    for (let y = my - MR - 1; y <= my + MR + 1; y++) for (let x = mx - MR - 1; x <= mx + MR + 1; x++) {
      const d = Math.hypot(x + 0.5 - mx, y + 0.5 - my);
      if (d >= MR) continue;
      const cut = Math.hypot(x + 0.5 - (mx + 4.6), y + 0.5 - (my - 3.2)) < MR - 0.6;
      if (cut) { b.set(x, y, '#1e2552', 0.55); continue; } // faint earthshine
      const edge = Math.hypot(x + 0.5 - (mx + 4.6), y + 0.5 - (my - 3.2)) < MR + 0.8;
      b.set(x, y, edge ? '#ddd3b8' : tone(['#ffffff', '#f4f0e0', '#e4dac0'], 0.85 - (fbm(x, y, 3, 6, 2) > 0.6 ? 0.35 : 0) - (d > MR - 1.2 ? 0.2 : 0), x, y, 0.3));
    }
    return b.canvas();
  }
  // Sea of clouds under the night summit: three rows of wide, flat-topped banks (far → near). Each bank is
  // a flat ellipse (rx 3–5× ry) painted back-to-front in flat colour; only its top edge is lit (moon at the
  // upper-left) and only where it rises above what is behind it; a 1-px crease marks its lower-right rim;
  // long flat shadow strata run through each row's body. No per-lobe pillow shading.
  function templeClouds() {
    const b = new Buf(LW, H);
    const rows = [
      { y: 150, ry: [4, 8], k: [3, 4.5], pal: ['#c6c9f2', '#aaafe6', '#9398d4', '#8085c4', '#7075b4'], seed: 1 },
      { y: 170, ry: [6, 12], k: [3, 4.5], pal: ['#d4d7fa', '#b3b8ee', '#8f95d4', '#7278ba', '#5c62a4'], seed: 2 },
      { y: 194, ry: [8, 15], k: [3, 4], pal: ['#e4e6fd', '#bfc3f2', '#9297d4', '#6a70ae', '#4d5392'], seed: 3 }
    ];
    rows.forEach((row) => {
      const r = rng(row.seed * 131), pal = row.pal.map(rgb), banks = [];
      for (let x = -40; x < LW + 40;) {
        const ry = (row.ry[0] + r() * (row.ry[1] - row.ry[0])) * (r() < 0.22 ? 1.6 : 1), rx = ry * (row.k[0] + r() * (row.k[1] - row.k[0]));
        banks.push([x, row.y - ry * (0.05 + r() * 0.8), rx, ry]);
        x += rx * (0.75 + r() * 0.8);
      }
      // body: flat, one step darker every ~7 px, with long wavy shadow strata
      for (let x = 0; x < LW; x++) for (let y = row.y; y < H; y++) {
        const dy = y - row.y, wav = Math.round(Math.sin((x / LW) * Math.PI * 2 * (5 + row.seed) + row.seed) * 1.5 + (fbm(x, row.seed, 70, 32, 2, LW) - 0.5) * 3);
        let c = dy < 4 ? pal[2] : pal[3];
        const st = (dy + wav) % 9;
        if (dy > 3 && (st === 0 || (st === 1 && fbm(x, dy, 71 + row.seed, 24, 2, LW) > 0.5)) && fbm(x, dy >> 3, 72 + row.seed, 40, 2, LW) > 0.38) c = pal[4];
        b.set(x, y, c);
      }
      // banks back-to-front: tall ones behind, low ones in front
      const own = new Int16Array(LW).fill(-1), topY = new Float32Array(LW).fill(1e9);
      banks.sort((p, q) => (p[1] - p[3]) - (q[1] - q[3]));
      banks.forEach((bk, i) => {
        const [cx, cy, rx, ry] = bk;
        for (let xi = Math.floor(cx - rx); xi <= cx + rx; xi++) {
          const x = ((xi % LW) + LW) % LW, u = (xi + 0.5 - cx) / rx;
          if (Math.abs(u) >= 1) continue;
          const h = ry * Math.sqrt(1 - Math.pow(Math.abs(u), 3.5)), t = Math.round(cy - h);
          const covered = topY[x] <= t;            // something behind already rises above this bank here
          for (let y = t; y <= row.y + 2; y++) {
            let c = y - row.y > 3 ? pal[3] : pal[2];
            if (covered) { if (y === t && u < 0.2 && topY[x] >= t - 2) c = pal[1]; }   // barely hidden: a faint seam only
            else if (y === t) c = u < 0.45 ? pal[0] : pal[1];                          // lit top edge
            else if (y <= t + 2 && u < 0.2) c = pal[1];                              // moonlit top surface
            if (!covered && u > 0.6 && y > t + 1 && Math.abs(Math.pow(Math.abs(u), 3.5) + Math.pow((y + 0.5 - cy) / ry, 2) - 1) < 0.18) c = pal[3]; // lower-right crease
            b.set(x, y, c);
          }
          if (t < topY[x]) { topY[x] = t; own[x] = i; }
        }
      });
      // a thin flat shadow where this row tucks under the next one
      for (let x = 0; x < LW; x++) { const y = row.y + 11 + Math.round(Math.sin(x * 0.05 + row.seed) * 1.2); if (y < H) b.set(x, y, pal[4]); }
    });
    return b.canvas();
  }

  /* ================================================================
     background registry (with per-frame sky animation)
     ================================================================ */
  const BG = {};
  function build(theme) {
    if (theme === 'village') {
      const sky = villageSky();
      return {
        base: sky, anim: 'village',
        layers: [
          { c: olympusLayer(false), f: 0.03 },
          { c: villageHills('mid'), f: 0.16 },
          { c: villageHills('near'), f: 0.28 },
          { c: villageHills('bush'), f: 0.45 }
        ]
      };
    }
    if (theme === 'forest') {
      const far = new Buf(LW, H);
      // distant ranges: two octaves of relief so no stretch reads as a flat mesa; rim only on slopes facing the moon
      const top = new Float32Array(LW);
      for (let x = 0; x < LW; x++) {
        const rd = 1 - Math.abs(fbm(x, 1, 131, 96, 3, LW) * 2 - 1); // ridged: sharp crests, rounded valleys
        top[x] = 138 - Math.pow(rd, 1.6) * 30 - (fbm(x, 5, 133, 192, 2, LW) - 0.5) * 26 - (fbm(x, 9, 135, 12, 2, LW) - 0.5) * 5;
      }
      ridge(far, top, { pal: ['#bb86a8', '#a87a9f', '#966e96', '#87648d'], seed: 13, slopeK: 2.6, faceD: 22, tex: 0.3, texCell: 24, texY: 2, rim: '#e0a3b4', rimSl: 0.12, rimBreak: 0.42, haze: '#dc9794', hazeLen: 30, hazeMax: 0.8 });
      return {
        base: forestSky(), anim: 'forest',
        layers: [
          { c: far.canvas(), f: 0.04 },
          { c: treeline({ seed: 7, base: 136, amp: 7, step: [5, 6], size: [5, 4], firs: 0.4, pal: ['#8a6aa6', '#795c98', '#6a508b', '#5f4880'], rim: '#b489c0', mist: [132, 170, '#d496a8', 0.5] }), f: 0.09 },
          { c: treeline({ seed: 17, base: 148, amp: 10, step: [8, 8], size: [8, 6], firs: 0.45, pal: ['#5a4c8e', '#4a3f7e', '#3d346f', '#332c63', '#2a2557'], rim: '#8a76c0', mist: [154, 194, '#a07cb8', 0.42] }), f: 0.17 },
          { c: treeline({ seed: 27, base: 158, amp: 12, step: [12, 10], size: [12, 8], firs: 0.25, pal: ['#2e3064', '#252855', '#1e2148', '#181b3c', '#131631'], rim: '#525aa0', fade: 0.01 }), f: 0.3 },
          { c: forestNear({ seed: 37, trees: 5, tw: [10, 8], ground: 180, canopy: 16, pal: ['#1d2046', '#171a3a', '#12152f', '#0e1027', '#0a0c1e'], rim: '#3a4282' }), f: 0.52 }
        ]
      };
    }
    if (theme === 'cave') {
      const G = [200, 128];
      return {
        base: caveSky(), anim: null,
        layers: [
          { c: caveLayer({ seed: 5, ceil: 50, ceilAmp: 16, floor: 166, floorAmp: 12, len: [22, 44], wid: 5, spread: 0.6, pillars: 3, pal: ['#7a4838', '#633a32', '#4e2e2e', '#3e2429', '#301d26'], rim: '#d08a58', bounce: '#4a3656', glow: G, haze: '#8a4428', hazeK: 0.34, hazeSpread: 44, mist: [118, 196, '#7a3524', 0.4] }), f: 0.06 },
          { c: caveLayer({ seed: 15, ceil: 24, ceilAmp: 14, floor: 186, floorAmp: 12, len: [26, 44], wid: 8, spread: 1, pillars: 1, pal: ['#5a3228', '#462624', '#361c20', '#28151b', '#1c1016'], rim: '#c06a3c', bounce: '#3a2c50', glow: G, haze: '#5a2a1e', hazeK: 0.35, hazeSpread: 40, mist: [150, 216, '#4a2220', 0.35], gems: 4, gemScale: 1 }), f: 0.16 },
          { c: caveLayer({ seed: 25, ceil: 8, ceilAmp: 10, floor: 202, floorAmp: 8, len: [34, 40], wid: 12, spread: 1.6, pillars: 0, pal: ['#3a2220', '#2c1a1c', '#22141a', '#180d13', '#10080d'], rim: '#7a3c26', bounce: '#231a34', glow: G }), f: 0.3 }
        ]
      };
    }
    // temple (default)
    return {
      base: templeSky(), anim: 'temple',
      layers: [
        { c: olympusLayer(true), f: 0.03 },
        { c: templeClouds(), f: 0.1 }
      ]
    };
  }

  /* ---------- animated sky: drifting clouds, birds, twinkling stars, shooting stars ---------- */
  let clouds = null;
  function cloudSet() {
    if (clouds) return clouds;
    const day = ['#fffdf8', '#faf6f2', '#ebe9f4', '#cfd4ee', '#b4bbe0'];
    const far = ['#f7f6f8', '#e8e9f5', '#d3daf0', '#bcc6e8'];
    const nightP = ['#c6a3c9', '#8e6ea8', '#62508e', '#453c78', '#352f66'];
    clouds = {
      village: [
        { c: cloudSprite(84, 26, 3, day, '#9fb0dc'), x: 250, y: 72, s: 0.05, p: 0.05 },
        { c: cloudSprite(56, 18, 5, day, '#9fb0dc'), x: 420, y: 40, s: 0.07, p: 0.06 },
        { c: cloudSprite(40, 12, 9, far, '#aebbe0'), x: 20, y: 104, s: 0.03, p: 0.035 },
        { c: cloudSprite(64, 16, 11, far, '#aebbe0'), x: 300, y: 112, s: 0.035, p: 0.04 },
        { c: cloudSprite(110, 30, 13, day, '#9fb0dc'), x: 560, y: 12, s: 0.06, p: 0.07 }
      ],
      forest: [
        { c: cloudSprite(120, 12, 21, nightP), x: 40, y: 58, s: 0.04, p: 0.03 },
        { c: cloudSprite(80, 10, 23, nightP), x: 260, y: 30, s: 0.05, p: 0.035 },
        { c: cloudSprite(150, 14, 25, nightP), x: 420, y: 96, s: 0.03, p: 0.025 }
      ],
      temple: [
        { c: cloudSprite(100, 14, 31, ['#8f92d4', '#6a6fb4', '#4f5496', '#3c417c']), x: 120, y: 80, s: 0.04, p: 0.03 }
      ]
    };
    return clouds;
  }
  const TW = []; // twinkling stars
  (function () { const r = rng(99); for (let i = 0; i < 26; i++) TW.push([(r() * W) | 0, (Math.pow(r(), 1.5) * 110) | 0, r() * 6.28, 0.02 + r() * 0.05]); })();

  function animate(bg, theme) {
    const g = O.game;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / (1000 / 60);
    const frame = Math.floor(now);
    if (bg.lastFrame === frame) return;
    bg.lastFrame = frame;
    const cam = g && g.state !== 'title' && g.state !== 'press' && g.state !== 'story' ? g.cam || 0 : 0;
    const c = bg.ctx;
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.drawImage(bg.base, 0, 0);
    const cs = cloudSet()[theme] || [];
    const span = W + 260;
    cs.forEach((cl) => {
      let x = cl.x - now * cl.s - cam * cl.p;
      x = ((x % span) + span) % span - 130;
      c.drawImage(cl.c, Math.round(x), cl.y);
    });
    if (theme === 'forest' || theme === 'temple') {
      TW.forEach((s) => {
        const v = Math.sin(now * s[3] + s[2]);
        if (v < 0.2) return;
        c.fillStyle = v > 0.85 ? '#ffffff' : '#d8d6ff';
        c.fillRect(s[0], s[1], 1, 1);
        if (v > 0.9) { c.globalAlpha = 0.5; c.fillRect(s[0] - 1, s[1], 3, 1); c.fillRect(s[0], s[1] - 1, 1, 3); c.globalAlpha = 1; }
      });
      // occasional shooting star
      const per = 520, ph = now % per;
      if (theme === 'forest' && ph < 26) {
        const k = Math.floor(now / per), r = rng(k * 7 + 1);
        const sx = 160 + r() * 200, sy = 10 + r() * 40;
        for (let i = 0; i < 12; i++) {
          const x = Math.round(sx - (ph - i) * 3), y = Math.round(sy + (ph - i) * 1.2);
          if (i > ph) continue;
          c.globalAlpha = (1 - i / 12) * (ph > 18 ? (26 - ph) / 8 : 1);
          c.fillStyle = i < 2 ? '#ffffff' : '#c9c4ff';
          c.fillRect(x, y, 1, 1);
        }
        c.globalAlpha = 1;
      }
    }
    if (theme === 'village') {
      // a small flock of birds gliding past
      const per = 1500, ph = now % per;
      if (ph < 900) {
        const k = Math.floor(now / per), r = rng(k * 3 + 5);
        const by = 30 + r() * 50;
        for (let i = 0; i < 4; i++) {
          const x = Math.round(W + 20 - ph * 0.5 + i * 9 - cam * 0.08), y = Math.round(by + Math.sin(ph * 0.02 + i) * 2 + (i % 2) * 5 + i * 2);
          const up = ((ph >> 3) + i) & 1;
          c.fillStyle = '#4a5a8c';
          c.fillRect(x, y, 1, 1);
          if (up) { c.fillRect(x - 2, y - 1, 2, 1); c.fillRect(x + 1, y - 1, 2, 1); }
          else { c.fillRect(x - 2, y, 2, 1); c.fillRect(x + 1, y, 2, 1); c.fillRect(x - 3, y + 1, 1, 1); c.fillRect(x + 3, y + 1, 1, 1); }
        }
      }
    }
  }

  // Story pages were composed around a summit further right and lower: give them a variant of the
  // Olympus layer (same sky and other layers) so the summit sits inside their 192×108 frames.
  function storyVariant(bg, key) {
    if (!bg.storyV) {
      const L = bg.layers.slice();
      L[0] = { c: olympusLayer(key !== 'village', 92, 13, true), f: L[0].f };
      const sky = O.makeCanvas(W, H), base = key === 'village' ? villageSky([150, 34]) : bg.base;
      bg.storyV = { sky, layers: L, base, anim: bg.anim, ctx: sky.getContext('2d'), lastFrame: -1 };
      bg.storyV.ctx.imageSmoothingEnabled = false;
      bg.storyV.ctx.drawImage(base, 0, 0);
    }
    const v = bg.storyV;
    if (v.anim) { try { animate(v, v.anim); } catch (e) { O.logOnce('sky.animate', e); } }
    return v;
  }
  function background(theme) {
    const key = BG[theme] ? theme : ({ village: 1, forest: 1, cave: 1 }[theme] ? theme : 'temple');
    let bg = BG[key];
    if (!bg) {
      const d = build(key);
      const sky = O.makeCanvas(W, H);
      bg = BG[key] = { sky, layers: d.layers, base: d.base, anim: d.anim, ctx: sky.getContext('2d'), lastFrame: -1 };
      bg.ctx.imageSmoothingEnabled = false;
      bg.ctx.drawImage(d.base, 0, 0);
    }
    if (bg.anim) { try { animate(bg, bg.anim); } catch (e) { O.logOnce('sky.animate', e); } }
    if ((key === 'village' || key === 'temple') && O.game && O.game.state === 'story') return storyVariant(bg, key);
    return bg;
  }
  O.SkyArt = { background, Buf, fbm, halo, gradient, tone };

  /* ================================================================
     LIGHTING & ATMOSPHERE
     Pipeline — everything per frame is a blit of a cached canvas (no per-pixel work, no entity redraws):
       1. BAKE (once, whenever the engine re-renders a level): per-theme colour grade of the level and
          front canvases, moonlit top edges (forest), openings carved through the den's back wall onto
          the parallax cavern (cave), static light baked into the front layer.
       2. PRE-ENTITY pass (hooked right after the level is drawn, before any character): a light map —
          backdrop ambient / world ambient masked by the level's own alpha / light pools — is multiplied
          over the environment only; additive ground light goes here too.
       3. CHARACTERS are drawn through lit sprite variants (cached per frame canvas × light key): colours
          scaled by the light where they stand, plus a rim on the edge that faces the light.
       4. O.Light.apply (after the front layer): additive blooms, god rays, fog, vignette, grading.
     Light edges are flat bands; the ordered dither is confined to a 2–3 px fringe between bands.
     ================================================================ */
  const LC = {};
  function cached(key, fn) { if (!LC[key]) LC[key] = fn(); return LC[key]; }
  // Quantise I (0..1) into S flat bands; dither only inside a fringe of F (fraction of a band) around each edge.
  function qb(I, S, x, y, F) {
    const f = clamp(I, 0, 1) * S;
    let q = Math.floor(f);
    const t = f - q, b = bay(x, y);
    if (t > 1 - F) { if (b < (t - 1 + F) / (2 * F)) q++; } else if (t < F && q > 0) { if (b < (F - t) / (2 * F)) q--; }
    return (q > S ? S : q) / S;
  }
  // Elliptical banded light (additive colour on black, cached). fpx = dither fringe width in px.
  function lightE(rx, ry, col, steps, pw, fpx) {
    const k = 'E' + rx + ':' + ry + ':' + col.join(',') + ':' + steps + ':' + pw + ':' + (fpx || 1.2);
    if (LC[k]) return LC[k];
    const w = rx * 2 + 1, h = ry * 2 + 1, cv = O.makeCanvas(w, h), g = cv.getContext('2d');
    const img = g.createImageData(w, h), d = img.data;
    const F = clamp((fpx || 1.2) * steps / Math.max(rx, ry) / Math.max(0.5, pw), 0.03, 0.3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dd = Math.hypot((x - rx) / rx, (y - ry) / ry);
      if (dd >= 1) continue;
      const q = qb(Math.pow(1 - dd, pw), steps, x, y, F);
      if (q <= 0) continue;
      const i = (y * w + x) * 4;
      d[i] = col[0] * q; d[i + 1] = col[1] * q; d[i + 2] = col[2] * q; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return (LC[k] = cv);
  }
  const rcol = (c) => [Math.round(c[0] / 4) * 4, Math.round(c[1] / 4) * 4, Math.round(c[2] / 4) * 4];
  function lightSprite(r, col, steps, pw) { return lightE(r, r, rcol(col), steps || 5, pw || 1.2); }
  function drawLight(g, r, col, x, y, steps, pw) { g.drawImage(lightSprite(r, col, steps, pw), Math.round(x) - r, Math.round(y) - r); }
  function drawLightE(g, rx, ry, col, x, y, steps, pw) { g.drawImage(lightE(rx, ry, rcol(col), steps || 5, pw || 1), Math.round(x) - rx, Math.round(y) - ry); }
  // Vertical ambient gradient (W×H): per-2px rows, no dither — adjacent rows differ by ≤1 level.
  function vgrad(keys, h) {
    const HH = h || H, cv = O.makeCanvas(1, HH), g = cv.getContext('2d'), img = g.createImageData(1, HH);
    for (let y = 0; y < HH; y++) {
      const yy = (y >> 1) * 2 + 1;
      let c = rgb(keys[keys.length - 1][1]);
      for (let k = 0; k < keys.length - 1; k++) if (yy <= keys[k + 1][0]) { c = mixc(keys[k][1], keys[k + 1][1], clamp((yy - keys[k][0]) / (keys[k + 1][0] - keys[k][0] || 1), 0, 1)); break; }
      img.data.set([c[0], c[1], c[2], 255], y * 4);
    }
    g.putImageData(img, 0, 0);
    const out = O.makeCanvas(W, HH), o = out.getContext('2d');
    o.imageSmoothingEnabled = false;
    o.drawImage(cv, 0, 0, W, HH);
    return out;
  }
  function vignette(col, amax, inner, key) {
    return cached('vig:' + key, () => {
      const b = new Buf(W, H), c = rgb(col);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - W / 2) / (W / 2), dy = (y + 0.5 - H / 2) / (H / 2);
        const q = qb(smooth(inner, 1.3, Math.sqrt(dx * dx * 0.8 + dy * dy * 1.1)), 4, x, y, 0.12);
        if (q > 0) b.set(x, y, c, q * amax);
      }
      return b.canvas();
    });
  }
  // Diagonal light shafts (from the upper-left) — additive, flat bands along and across each beam.
  function shafts(w, h, n, col, amax, seed, slope, key) {
    return cached('shaft:' + key, () => {
      const b = new Buf(w, h), r = rng(seed), c = rgb(col);
      const beams = [];
      for (let i = 0; i < n; i++) beams.push([r() * w, 8 + r() * 16, 0.45 + r() * 0.55]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let I = 0;
        beams.forEach((bm) => {
          const u = x - (bm[0] + y * slope), uu = ((u % w) + w) % w, dd = Math.min(uu, w - uu);
          if (dd < bm[1]) I = Math.max(I, Math.min(1, (1 - dd / bm[1]) * 1.6) * bm[2]);
        });
        I *= Math.pow(1 - y / h, 1.1);
        const q = qb(I, 3, x, y, 0.1);
        if (q > 0) b.set(x, y, c.map((v) => v * q * amax), 1);
      }
      return b.canvas();
    });
  }
  // Drifting fog: 3 solid alpha bands with wavy, periodic edges (no checker fields).
  function fogBand(h, col, amax, seed, key) {
    return cached('fog:' + key, () => {
      const b = new Buf(LW, h), c = rgb(col);
      const wave = (x, k) => Math.sin((x / LW) * Math.PI * 2 * (3 + k) + seed + k * 1.7) * 3 + Math.sin((x / LW) * Math.PI * 2 * (11 + k * 2) + k) * 1.4 +
        (fbm(x, k * 5, seed + k, 48, 2, LW) - 0.5) * 8;
      const edges = [0.16, 0.42, 0.68], alph = [0.45, 0.75, 1];
      for (let x = 0; x < LW; x++) {
        const e = edges.map((f, k) => Math.round(f * h + wave(x, k)));
        const tail = Math.round(h * 0.94 + wave(x, 4) * 0.5);
        for (let y = 0; y < h; y++) {
          let a = 0;
          for (let k = 2; k >= 0; k--) if (y >= e[k]) { a = alph[k]; break; }
          if (y > tail) a *= 0.5;
          if (a > 0) b.set(x, y, c, a * amax);
        }
      }
      return b.canvas();
    });
  }

  let LM = null, LX = null;
  function lightmap() {
    if (!LM) { LM = O.makeCanvas(W, H); LX = LM.getContext('2d'); LX.imageSmoothingEnabled = false; }
    LX.globalAlpha = 1;
    LX.globalCompositeOperation = 'source-over';
    return LX;
  }
  // Re-usable full-screen scratch canvases (state reset on every fetch).
  const SCR = {};
  function scratch(key) {
    let s = SCR[key];
    if (!s) { const cv = O.makeCanvas(W, H), x = cv.getContext('2d'); x.imageSmoothingEnabled = false; s = SCR[key] = { cv, x }; }
    s.x.setTransform(1, 0, 0, 1, 0, 0);
    s.x.globalCompositeOperation = 'source-over';
    s.x.globalAlpha = 1;
    return s;
  }
  const shakeOf = (game) => (game.shake > 0 ? [(game.t >> 1) & 1 ? 2 : -2, (game.t >> 2) & 1 ? 1 : -1] : [0, 0]);
  // Alpha of the level's back canvas on screen (tiles + back decor only: two blits, no entity redraws).
  function levelMask(game) {
    const s = scratch('wm'), m = s.x, lv = game.lvl.canvas;
    m.clearRect(0, 0, W, H);
    if (!lv) return s.cv;
    const sh = shakeOf(game), vh = Math.min(H - VY, lv.height);
    m.drawImage(lv, game.cam, 0, W, vh, sh[0], VY + sh[1], W, vh);
    m.drawImage(lv, game.cam, 0, W, VY, sh[0], sh[1], W, VY);
    return s.cv;
  }
  // Light map base: `bgAmb` where the parallax backdrop shows, `worldAmb` on the level's pixels.
  function ambient(g, game, bgAmb, worldAmb) {
    g.globalCompositeOperation = 'source-over';
    g.drawImage(bgAmb, 0, 0);
    const s = scratch('ambw');
    s.x.clearRect(0, 0, W, H);
    s.x.drawImage(worldAmb, 0, 0);
    s.x.globalCompositeOperation = 'destination-in';
    s.x.drawImage(levelMask(game), 0, 0);
    g.drawImage(s.cv, 0, 0);
  }
  // Colour-grade the screen (optionally only where `mask` is opaque). ops = [[compositeMode, fillStyle], ...]
  function gradeOps(c, ops, mask) {
    const s = scratch('grade'), g = s.x;
    g.clearRect(0, 0, W, H);
    g.drawImage(c.canvas, 0, 0);
    ops.forEach((o) => { g.globalCompositeOperation = o[0]; g.fillStyle = o[1]; g.fillRect(0, 0, W, H); });
    g.globalCompositeOperation = 'destination-in';
    if (mask) g.drawImage(mask, 0, 0); else { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = 'source-over';
    c.globalCompositeOperation = 'source-over';
    c.drawImage(s.cv, 0, 0);
  }
  const GRADE = {
    // pulls the world's day-greens toward moonlit blue-teal (hue/saturation) — baked once per level
    forest: [['saturation', 'rgba(90,90,140,0.5)'], ['color', 'rgba(70,72,140,0.26)']],
    cave: [['saturation', 'rgba(120,90,80,0.22)']],
    temple: [],
    village: []
  };
  // Two-band flame bloom: hot orange core fading to a deep red outer band (additive, flat bands).
  function flameBloom(r) {
    return cached('fb:' + r, () => {
      const S = r * 2 + 1, b = new Buf(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - r, y - r) / r;
        if (d >= 1) continue;
        const q = Math.round(qb(Math.pow(1 - d, 1.5), 4, x, y, 0.1) * 4);
        if (q >= 3) b.set(x, y, [120, 74, 28]);
        else if (q === 2) b.set(x, y, [70, 34, 12]);
        else if (q === 1) b.set(x, y, [30, 12, 6]);
      }
      return b.canvas();
    });
  }
  const flick = (t, i, amp) => Math.round((Math.sin(t * 0.21 + i * 2.1) + Math.sin(t * 0.53 + i * 5.3) * 0.6 + (ih((t >> 2) + i * 101, i, 3) - 0.5) * 0.8) * amp);

  function sources(game) {
    const cam = game.cam, out = [];
    (game.lvl.def.lights || []).forEach((l, i) => {
      out.push({ type: l.type, x: Math.round(l.tx * T + 8 - cam), y: l.row * T + VY, i });
    });
    return out;
  }
  // screen y of the first solid floor under a light (cached per level), or 0
  function floorBelow(game, s) {
    const lvl = game.lvl, k = 'fb' + s.i;
    if (!lvl.skyFloor) lvl.skyFloor = {};
    if (lvl.skyFloor[k] === undefined) {
      const l = lvl.def.lights[s.i], tx = Math.floor(l.tx + 0.5);
      let ty = l.row;
      while (ty < lvl.h && !lvl.isSolid(tx, ty)) ty++;
      lvl.skyFloor[k] = ty < lvl.h ? ty * T : 0;
    }
    return lvl.skyFloor[k] ? lvl.skyFloor[k] + VY : 0;
  }
  function playerPos(game) {
    const p = game.player;
    return { x: Math.round(p.x + p.w / 2 - game.cam), y: Math.round(p.y + p.h / 2 + VY), feet: Math.round(p.y + p.h + VY) };
  }
  function windowRect(game) {
    const d = (game.lvl.def.decor || []).find((q) => q[0] === 'window');
    if (!d) return null;
    let w = 34, h = 50;
    try { const im = O.Tiles.decor('window', d[4]); if (im) { w = im.w; h = im.h; } } catch (e) { /* default */ }
    const x = Math.round(d[1] * T + 8 - w / 2 - game.cam), y = d[2] * T - h + 1 + VY;
    return { x, y, w, h };
  }
  // Gods on screen, with the exact frame the engine draws this tick (so we can mask their silhouettes).
  function gods(game) {
    const out = [];
    (game.npcs || []).forEach((n) => {
      if (n.kind !== 'zeus' && n.kind !== 'hermes' && n.kind !== 'hades') return;
      const bob = n.float ? Math.round(Math.sin(n.t * 0.05) * 2) - 6 : 0;
      const feet = Math.round(n.y + n.h + bob) + VY, x = Math.round(n.x + n.w / 2 - game.cam);
      out.push({ n, x, feet, cy: feet - 24, name: O.frame ? O.frame(n.kind + '_idle', n.t, 12, 4) : n.kind + '_idle_0', flip: n.facing < 0 });
    });
    return out;
  }
  // Remove (strength 0..1) an additive layer wherever a god's sprite (dilated by 1 px) sits, so no glow
  // is ever added on top of a character's body — light reads as coming from *behind* the figure.
  function cutGods(a, list, game, strength) {
    if (!list.length) return;
    const s = scratch('sil'), m = s.x;
    m.clearRect(0, 0, W, H);
    const sh = shakeOf(game);
    list.forEach((gd) => {
      [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach((o) => ORIG.drawA(m, gd.name, gd.x + o[0] + sh[0], gd.feet + o[1] + sh[1], gd.flip));
    });
    a.globalCompositeOperation = 'destination-out';
    a.globalAlpha = strength;
    a.drawImage(s.cv, 0, 0);
    a.globalAlpha = 1;
    a.globalCompositeOperation = 'lighter';
  }
  // Fx/amb that emit light (sparks, hit stars, fireflies, embers) — into the light map.
  function particleLights(g, game, scale) {
    const cam = game.cam;
    (game.fx || []).forEach((f) => {
      if (f.type === 'spark' && f.t < 8) drawLight(g, 20, [255 * scale, 210 * scale, 140 * scale], f.x - cam, f.y + VY, 3, 1.2);
      else if (f.type === 'star' && f.t < 12) drawLight(g, 12, [180 * scale, 150 * scale, 80 * scale], f.x - cam, f.y + VY, 2, 1.2);
    });
    (game.amb || []).forEach((p) => {
      if (p.k === 'fly') {
        const on = Math.round(flyOn(p) * 4) / 4;
        if (on > 0) drawLight(g, 22, [150 * on * scale, 230 * on * scale, 90 * on * scale], p.x - cam, p.y + VY, 3, 1.3);
      } else if (p.k === 'ember' && p.t < 50) drawLight(g, 9, [200 * scale, 110 * scale, 40 * scale], p.x - cam, p.y + VY, 2, 1.2);
    });
  }
  function flyOn(p) { const ph = (p.t + ((p.x * 7) | 0)) % 150; return ph < 90 ? Math.min(1, ph / 12, (90 - ph) / 20) : 0; }
  function tileDraw(c, cv, off, y) { c.drawImage(cv, -off, y); if (cv.width - off < W) c.drawImage(cv, cv.width - off, y); }

  /* ---------------- 1. BAKE (per level render) ---------------- */
  function copyOf(cv) { const c = O.makeCanvas(cv.width, cv.height); c.getContext('2d').drawImage(cv, 0, 0); return c; }
  function replaceWith(cv, src) { const g = cv.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'copy'; g.drawImage(src, 0, 0); g.restore(); }
  function gradeCanvas(cv, ops) {
    if (!ops.length) return;
    const t = copyOf(cv), g = t.getContext('2d');
    ops.forEach((o) => { g.globalCompositeOperation = o[0]; g.fillStyle = o[1]; g.fillRect(0, 0, t.width, t.height); });
    g.globalCompositeOperation = 'destination-in'; g.drawImage(cv, 0, 0);
    replaceWith(cv, t);
  }
  // Multiply a canvas by a light map of the same size (keeps its alpha).
  function multiplyCanvas(cv, lm) {
    const t = copyOf(cv), g = t.getContext('2d');
    g.globalCompositeOperation = 'multiply'; g.drawImage(lm, 0, 0);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(cv, 0, 0);
    replaceWith(cv, t);
  }
  // Level-space light map with the level's static lights at rest (for the front layer, drawn after entities).
  function staticLM(lvl, amb, lights) {
    const cv = O.makeCanvas(lvl.pxW, lvl.pxH), g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(amb, 0, 0, 1, H, 0, -VY, lvl.pxW, H);
    g.globalCompositeOperation = 'lighter';
    (lvl.def.lights || []).forEach((l, i) => { const L = lights[l.type]; if (L) L(g, l.tx * T + 8, l.row * T, i); });
    return cv;
  }
  // Moonlit top edges: every opaque pixel with sky above (or above-left) gets a cool additive rim.
  function topRim(cv, col, k2) {
    const w = cv.width, h = cv.height, g = cv.getContext('2d'), img = readPixels(cv), d = img.data;
    const a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 128 ? 1 : 0;
    const c = rgb(col);
    for (let y = 1; y < h; y++) for (let x = 1; x < w; x++) {
      const i = y * w + x;
      if (!a[i]) continue;
      let e = 0;
      if (!a[i - w] || !a[i - w - 1]) e = 1; else if (y > 1 && !a[i - 2 * w]) e = k2;
      if (!e) continue;
      const o = i * 4;
      d[o] = Math.min(255, d[o] + c[0] * e); d[o + 1] = Math.min(255, d[o + 1] + c[1] * e); d[o + 2] = Math.min(255, d[o + 2] + c[2] * e);
    }
    g.putImageData(img, 0, 0);
  }
  // Openings carved through the den's back wall ('k' tiles) onto the parallax cavern, with a lit sill,
  // a dark lintel and a sel-out edge so they read as holes through thick rock.
  const OPENINGS = {
    den: [[188, 98, 70, 56, 1], [40, 70, 19, 24, 2], [340, 82, 20, 28, 3]]
  };
  // natural rock columns left standing inside an opening: [x, yTop, yBot, half-width]
  const COLUMNS = { den: [[194, 30, 170, 10]] };
  function carve(lvl) {
    const list = OPENINGS[lvl.id];
    if (!list || !lvl.canvas) return;
    const w = lvl.pxW, h = lvl.pxH, g = lvl.canvas.getContext('2d'), img = readPixels(lvl.canvas), d = img.data;
    const hole = new Uint8Array(w * h);
    list.forEach(([cx, cy, rx, ry, s]) => {
      for (let y = Math.max(0, cy - ry - 8); y < Math.min(h, cy + ry + 8); y++) for (let x = Math.max(0, cx - rx - 8); x < Math.min(w, cx + rx + 8); x++) {
        if (lvl.tile(x >> 4, y >> 4) !== 'k') continue;
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        // arched top, flatter sill; chunky rock-lump boundary
        const e = Math.pow(Math.abs(nx), 2.2) + Math.pow(Math.abs(ny), ny > 0 ? 3 : 1.9);
        const n = (fbm(x, y, 400 + s, 10, 2) - 0.5) * 0.55 + (fbm(x, y, 410 + s, 4, 1) - 0.5) * 0.18;
        if (e + n < 1) hole[y * w + x] = 1;
      }
    });
    // stalactite teeth hanging from each lintel and stubby stalagmites on each sill, cut back out of the hole
    list.forEach(([cx, cy, rx, ry, s]) => {
      const r = rng(s * 71 + 5), n = Math.max(1, Math.round(rx / 11));
      for (let k = 0; k < n; k++) {
        const x0 = Math.round(cx - rx * 0.8 + ((k + 0.2 + r() * 0.6) / n) * rx * 1.6);
        let yt = cy - ry - 8;
        while (yt < cy && !hole[yt * w + x0]) yt++;
        const len = Math.round((0.12 + r() * 0.2) * ry * (k % 2 ? 0.7 : 1)), hw = 1.5 + r() * (rx > 30 ? 3 : 1.5);
        for (let j = -2; j < len; j++) for (let i = -Math.ceil(hw); i <= Math.ceil(hw); i++) {
          const ww = hw * Math.pow(1 - Math.max(0, j) / len, 0.8);
          if (Math.abs(i) <= ww && yt + j >= 0) hole[(yt + j) * w + x0 + i] = 0;
        }
        if (r() < 0.6) {
          const x1 = Math.round(cx - rx * 0.7 + r() * rx * 1.4);
          let yb = cy + ry + 8;
          while (yb > cy && !hole[yb * w + x1]) yb--;
          const l2 = Math.round(3 + r() * 6), h2 = 1.5 + r() * 2.5;
          for (let j = -1; j < l2; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) <= h2 * (1 - Math.max(0, j) / l2)) hole[(yb - j) * w + x1 + i] = 0;
        }
      }
    });
    const colSpan = [];
    (COLUMNS[lvl.id] || []).forEach(([x0, y0, y1, hw], i) => {
      for (let y = y0; y < y1; y++) {
        const t = (y - y0) / (y1 - y0), k = Math.abs(t - 0.52) / 0.52;
        const half = hw * (0.62 + 0.38 * Math.pow(k, 1.6)) + (fbm(y, i, 420, 8, 2) - 0.5) * 2.2;
        const cx = x0 + (fbm(y, i, 430, 30, 2) - 0.5) * 7;
        for (let x = Math.floor(cx - half - 1); x <= cx + half + 1; x++) if (Math.abs(x + 0.5 - cx) <= half) hole[y * w + x] = 0;
        colSpan.push([y, cx, half]);
      }
    });
    const H1 = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : hole[y * w + x]);
    const lit = rgb('#b98a64'), dark = rgb('#0e0810');
    // emissive rim: the edges facing the glowing cavern catch its light from behind (drawn additively
    // after the light map, so the multiply never crushes it) — stored level-space on the level object
    const E = new Buf(w, h), GX = 200, GY = 116;
    const emitK = (x, y, s) => {
      const k = clamp(1.15 - Math.hypot((x - GX) / 150, (y - GY) / 110), 0, 1) * s;
      const q = Math.round(k * 4) / 4;
      if (q > 0) E.set(x, y, [120 * q, 60 * q, 24 * q]);
    };
    const emit = (x, y, lv) => emitK(x, y, lv ? 0.5 : 1);
    // 1) wall face: a subtle lip where it meets the opening (lit on top/sides, dark over the lintel)
    const pal = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (hole[i] || !(H1(x, y - 1) || H1(x, y + 1) || H1(x - 1, y) || H1(x + 1, y))) continue;
      const o = i * 4, c = [d[o], d[o + 1], d[o + 2]];
      pal.push(o, H1(x, y + 1) && !H1(x, y - 1) ? mixc(c, dark, 0.35) : mixc(c, lit, 0.22));
    }
    for (let k = 0; k < pal.length; k += 2) { const o = pal[k], n = pal[k + 1]; d[o] = n[0]; d[o + 1] = n[1]; d[o + 2] = n[2]; }
    // 2) the rock's thickness, seen inside each opening: sill top surface (below eye level, lit by the
    //    cavern), lintel underside (dark), inner side walls; they eat into the hole so it reads as a tunnel
    const thick = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!hole[i]) continue;
      let k, c, e = 0;
      if ((k = [1, 2, 3].find((q) => !H1(x, y + q)))) {
        const o = ((y + k) * w + x) * 4; c = mixc([d[o], d[o + 1], d[o + 2]], lit, [0.55, 0.45, 0.32][k - 1]); e = [0.9, 0.6, 0.35][k - 1];
      } else if ((k = [1, 2, 3].find((q) => !H1(x, y - q)))) {
        const o = ((y - k) * w + x) * 4; c = mixc([d[o], d[o + 1], d[o + 2]], dark, [0.7, 0.6, 0.5][k - 1]); e = k === 3 && H1(x, y + 1) ? 0.25 : 0;
      } else if ((k = [1, 2].find((q) => !H1(x - q, y) || !H1(x + q, y)))) {
        const sx = !H1(x - k, y) ? x - k : x + k, o = (y * w + sx) * 4;
        c = mixc([d[o], d[o + 1], d[o + 2]], dark, k === 1 ? 0.55 : 0.4);
        e = k === 2 ? 0.3 : 0;
      } else continue;
      thick.push(i, c, e);
    }
    thick.forEach((v, j) => {
      if (j % 3) return;
      const i = v, c = thick[j + 1], e = thick[j + 2], o = i * 4, x = i % w, y = (i / w) | 0;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      hole[i] = 0;
      if (e > 0) emitK(x, y, e);
    });
    // the column: a rock cylinder, dark core, both flanks rim-lit by the cavern glow behind it
    colSpan.forEach(([y, cx, half]) => {
      for (let x = Math.floor(cx - half); x <= cx + half; x++) {
        const i = y * w + x;
        if (hole[i] || Math.abs(x + 0.5 - cx) > half) continue;
        const dl = x + 0.5 - (cx - half), dr = cx + half - (x + 0.5), o = i * 4, c = [d[o], d[o + 1], d[o + 2]];
        let n = mixc(c, dark, 0.2);
        if (dl < 1 || dr < 1) { n = mixc(c, lit, 0.4); emit(x, y, 0); }
        else if (dl < 2 || dr < 2) { n = mixc(c, lit, 0.2); emit(x, y, 1); }
        d[o] = n[0]; d[o + 1] = n[1]; d[o + 2] = n[2];
      }
    });
    lvl.skyEmit = E.canvas();
    for (let i = 0; i < w * h; i++) if (hole[i]) d[i * 4 + 3] = 0;
    g.putImageData(img, 0, 0);
  }
  const BAKE = {
    forest(lvl) {
      gradeCanvas(lvl.canvas, GRADE.forest);
      gradeCanvas(lvl.front, GRADE.forest);
      topRim(lvl.canvas, '#5a6cb0', 0.65);
      multiplyCanvas(lvl.front, staticLM(lvl, AMB.forestW(), {}));
    },
    cave(lvl) {
      carve(lvl);
      gradeCanvas(lvl.canvas, GRADE.cave);
      gradeCanvas(lvl.front, GRADE.cave);
      multiplyCanvas(lvl.front, staticLM(lvl, AMB.caveW(), CAVE_LIGHTS));
    },
    temple(lvl) {
      multiplyCanvas(lvl.front, staticLM(lvl, AMB.temple(), TEMPLE_LIGHTS));
    }
  };
  function bakeLevel(lvl) {
    if (!lvl || !lvl.canvas) return;
    const fn = BAKE[lvl.theme] || (lvl.theme === 'village' ? null : BAKE.temple);
    if (fn) fn(lvl);
  }

  /* ---------------- ambient gradients ---------------- */
  const AMB = {
    // forest backdrop is painted at night already: near-neutral, the moon keeps its authored cream
    forestBg: () => cached('amb:forestBg', () => vgrad([[0, '#ffffff'], [120, '#f0ecff'], [216, '#d8d2f4']])),
    forestW: () => cached('amb:forestW', () => vgrad([[0, '#bcb4ee'], [70, '#aca4e4'], [140, '#9c94da'], [216, '#8a82cc']])),
    caveBg: () => cached('amb:caveBg', () => vgrad([[0, '#c8b4b4'], [110, '#e8d4c8'], [216, '#c0a8a8']])),
    caveW: () => cached('amb:caveW', () => vgrad([[0, '#2a2038'], [110, '#33273f'], [216, '#3a2c44']])),
    temple: () => cached('amb:temple3', () => vgrad([[0, '#40386a'], [70, '#564a84'], [150, '#6e6298'], [216, '#685a90']]))
  };
  // torch: tall elliptical pool pushed below the flame so the floor under it gets a clear warm pool
  const CAVE_LIGHTS = {
    torch(g, x, y, i, f) { f = f || 0; drawLightE(g, 96 + f * 2, 84 + f * 2, [255, 150, 80], x, y + 14, 8, 0.9); drawLight(g, 22 + f, [255, 200, 130], x, y - 11, 2, 1); },
    crystal(g, x, y, i, p) { drawLightE(g, 46 + (p || 0), 30 + (p || 0), [44, 130, 170], x, y - 8, 4, 1.3); },
    brazier(g, x, y, i, f) { drawLightE(g, 96 + (f || 0) * 2, 72, [255, 160, 85], x, y - 24, 5, 0.9); }
  };
  const TEMPLE_LIGHTS = {
    brazier(g, x, y, i, f) { drawLightE(g, 112 + (f || 0) * 2, 92 + (f || 0) * 2, [240, 186, 112], x, y - 26, 8, 1.4); },
    torch(g, x, y, i, f) { drawLightE(g, 84 + (f || 0) * 2, 70, [255, 170, 95], x, y - 6, 6, 1.2); }
  };

  /* ---------------- 2. PRE-ENTITY pass ---------------- */
  const PRE = {
    forest(c, game, t) {
      const g = lightmap();
      ambient(g, game, AMB.forestBg(), AMB.forestW());
      g.globalCompositeOperation = 'lighter';
      drawLightE(g, 150, 110, [36, 34, 72], FOR.moon[0], FOR.moon[1] + 30, 4, 1.2); // moonlight pooling from the upper-left
      const pp = playerPos(game);
      drawLight(g, 46, [96, 84, 66], pp.x, pp.y, 3, 1);                              // lyre-warm pool around Orpheus
      particleLights(g, game, 1);
      c.globalCompositeOperation = 'multiply';
      c.drawImage(LM, 0, 0);
      // warm ground ellipse under his feet, as if lit by the lyre (on the ground only: characters come after)
      c.globalCompositeOperation = 'lighter';
      c.drawImage(lightE(22, 6, [90, 70, 50], 2, 0.8), pp.x - 22, pp.feet - 5);
    },
    cave(c, game, t) {
      const g = lightmap();
      ambient(g, game, AMB.caveBg(), AMB.caveW());
      g.globalCompositeOperation = 'lighter';
      const src = sources(game);
      src.forEach((s) => {
        const L = CAVE_LIGHTS[s.type];
        if (L) L(g, s.x, s.y, s.i, s.type === 'crystal' ? Math.round(Math.sin(t * 0.04 + s.i) * 2) : flick(t, s.i, 1));
        // the floor right under a wall torch gets its own warm pool
        if (s.type === 'torch') { const fy = floorBelow(game, s); if (fy) drawLightE(g, 44 + flick(t, s.i, 1), 9, [170, 96, 44], s.x, fy + 1, 3, 1); }
      });
      const pp = playerPos(game);
      drawLight(g, 48, [120, 95, 70], pp.x, pp.y - 4, 3, 1);
      particleLights(g, game, 1);
      c.globalCompositeOperation = 'multiply';
      c.drawImage(LM, 0, 0);
      // warm wash on the rock around each flame: dark stone still reads as a lit wall plane
      c.globalCompositeOperation = 'lighter';
      const em = game.lvl.skyEmit;
      if (em) { const sh = shakeOf(game); c.drawImage(em, game.cam, 0, W, H - VY, sh[0], VY + sh[1], W, H - VY); }
      src.forEach((s) => { if (s.type === 'torch') { const f = flick(t, s.i, 1); c.drawImage(lightE(64, 56, [56, 26, 10], 8, 1.3), s.x - 64, s.y - 60 + f); } });
    },
    temple(c, game, t) {
      const hermes = game.lvl.id === 'hermes';
      const g = lightmap();
      g.drawImage(AMB.temple(), 0, 0);
      g.globalCompositeOperation = 'lighter';
      const src = sources(game);
      src.forEach((s) => { const L = TEMPLE_LIGHTS[s.type]; if (L) L(g, s.x, s.y, s.i, flick(t, s.i, 1)); });
      // the god's presence lights the wall behind him (he himself is drawn after, lit by his own variant)
      gods(game).forEach((gd) => drawLightE(g, 60, 72, hermes ? [36, 58, 76] : [56, 48, 28], gd.x, gd.cy, 5, 1.4));
      const wr = windowRect(game);
      if (wr) {
        drawLightE(g, 44, 52, hermes ? [70, 96, 124] : [80, 80, 116], wr.x + wr.w / 2, wr.y + wr.h / 2, 3, 1);
        g.drawImage(lightE(50, 11, hermes ? [50, 64, 90] : [60, 58, 84], 3, 1), Math.round(wr.x + wr.w / 2 + 22 - 50), 176 + VY - 11);
      }
      const pp = playerPos(game);
      drawLight(g, 40, [70, 60, 50], pp.x, pp.y, 2, 1);
      particleLights(g, game, 1);
      c.globalCompositeOperation = 'multiply';
      c.drawImage(LM, 0, 0);
    }
  };
  function preEntity(c, game) {
    if (!game || !game.lvl) return;
    const fn = PRE[game.lvl.theme] || (game.lvl.theme === 'village' ? null : PRE.temple);
    if (!fn) return;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.globalAlpha = 1;
    fn(c, game, game.t || 0);
    c.restore();
  }

  /* ---------------- 3. LIT SPRITE VARIANTS ---------------- */
  // P = { key, m:[r,g,b] multiplier, sat (desaturate 0..1), tint:[r,g,b,a] (hue push, luminance kept),
  //       lx, ly (direction toward the light, -1..1), grad (extra light on the lit half), rim:[r,g,b] additive edge }
  const VAR = new WeakMap(), PXD = new WeakMap();
  // Pixel reads go through one scratch canvas flagged willReadFrequently (no readback on shared sprite canvases).
  let RD = null;
  function readPixels(cv) {
    if (!RD) { RD = document.createElement('canvas'); RD.width = 64; RD.height = 64; RD.g = RD.getContext('2d', { willReadFrequently: true }); }
    if (RD.width < cv.width || RD.height < cv.height) { RD.width = Math.max(RD.width, cv.width); RD.height = Math.max(RD.height, cv.height); RD.g = RD.getContext('2d', { willReadFrequently: true }); }
    RD.g.clearRect(0, 0, cv.width, cv.height);
    RD.g.drawImage(cv, 0, 0);
    return RD.g.getImageData(0, 0, cv.width, cv.height);
  }
  function srcData(cv) {
    let d = PXD.get(cv);
    if (!d) { d = readPixels(cv); PXD.set(cv, d); }
    return d;
  }
  function variant(cv, P) {
    let m = VAR.get(cv);
    if (!m) { m = new Map(); VAR.set(cv, m); }
    let v = m.get(P.key);
    if (v) return v;
    if (m.size > 48) m.clear();
    const w = cv.width, h = cv.height, s = srcData(cv).data;
    v = O.makeCanvas(w, h);
    const g = v.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : s[(y * w + x) * 4 + 3] > 100);
    let bx0 = w, bx1 = 0, by0 = h, by1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (s[(y * w + x) * 4 + 3]) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, hw = Math.max(4, (bx1 - bx0) / 2), hh = Math.max(4, (by1 - by0) / 2);
    const lx = P.lx || 0, ly = P.ly || 0, sx = Math.sign(lx), sy = Math.sign(ly), M = P.m, R = P.rim, tn = P.tint;
    const tl = tn ? (tn[0] * 0.3 + tn[1] * 0.59 + tn[2] * 0.11) || 1 : 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = s[i + 3];
      if (!a) continue;
      let r = s[i], gg = s[i + 1], b = s[i + 2];
      const l = r * 0.3 + gg * 0.59 + b * 0.11;
      if (P.sat) { r += (l - r) * P.sat; gg += (l - gg) * P.sat; b += (l - b) * P.sat; }
      if (tn) { const k = l / tl; r += (tn[0] * k - r) * tn[3]; gg += (tn[1] * k - gg) * tn[3]; b += (tn[2] * k - b) * tn[3]; }
      const u = clamp(((x - cx) / hw) * lx + ((y - cy) / hh) * ly, -1, 1);
      const k = 1 + (P.grad || 0) * (u > 0.2 ? 1 : u < -0.35 ? -1 : 0);
      r *= M[0] * k; gg *= M[1] * k; b *= M[2] * k;
      if (R) {
        let e = 0;
        if ((sx && !A(x + sx, y)) || (sy && !A(x, y + sy)) || (sx && sy && !A(x + sx, y + sy))) e = 1;
        else if ((sx && !A(x + 2 * sx, y)) || (sy && !A(x, y + 2 * sy))) e = 0.4;
        if (e) { r += R[0] * e; gg += R[1] * e; b += R[2] * e; }
      }
      d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = a;
    }
    g.putImageData(img, 0, 0);
    m.set(P.key, v);
    return v;
  }
  const CLS = new Map();
  function classOf(name) {
    let c = CLS.get(name);
    if (c !== undefined) return c;
    const p = name.split('_')[0];
    c = p === 'hero' ? 'hero' : (p === 'snake' || p === 'bat' || p === 'satyr' || p === 'boar' || name === 'rock') ? 'foe'
      : (p === 'zeus' || p === 'hermes' || p === 'hades') ? 'god' : (p === 'elder' || p === 'merchant' || p === 'villager' || p === 'eurydice') ? 'npc' : null;
    CLS.set(name, c);
    return c;
  }
  const MOON_RIM = [72, 77, 116]; // #8f9ae8 at 50%, additive
  const q8 = (v) => Math.round(v * 12) / 12;
  const SPRITE_LIGHT = {
    forest(game, cls) {
      if (cls === 'hero') return { key: 'fh', m: [0.95, 0.95, 1], sat: 0.2, tint: [70, 72, 140, 0.1], lx: -1, ly: -1, grad: 0.06, rim: MOON_RIM };
      if (cls === 'foe') return { key: 'ff', m: [0.9, 0.92, 1], sat: 0.08, lx: -1, ly: -1, grad: 0.08, rim: MOON_RIM };
      return null;
    },
    // position-dependent: torches (warm, strong rim on the side that faces them), crystals (cool), the hero's own pool
    cave(game, cls, x, y) {
      if (cls === 'god') return null;
      let r = 0.4, g = 0.34, b = 0.46, best = 0, bx = 0, by = 0;
      sources(game).forEach((s) => {
        if (s.type === 'torch' || s.type === 'brazier') {
          const dx = s.x - x, dy = s.y - 12 - y, e = Math.hypot(dx / 150, dy / 120);
          if (e >= 1) return;
          const k = Math.pow(1 - e, 0.8);
          r += k * 0.9; g += k * 0.55; b += k * 0.3;
          if (k > best) { best = k; bx = dx; by = dy; }
        } else if (s.type === 'crystal') {
          const e = Math.hypot((s.x - x) / 70, (s.y - 8 - y) / 50);
          if (e < 1) { const k = (1 - e) * 0.5; r += k * 0.2; g += k * 0.6; b += k * 0.75; }
        }
      });
      if (cls === 'hero') { r += 0.3; g += 0.24; b += 0.18; }
      const m = [q8(Math.min(1.05, r)), q8(Math.min(1.02, g)), q8(Math.min(1, b))];
      const lx = Math.abs(bx) > 10 ? Math.sign(bx) : 0, ly = by < -10 ? -1 : 0, rk = Math.round(Math.min(1, best * 1.6) * 3) / 3;
      const rim = rk > 0 ? [255 * 0.4 * rk, 170 * 0.4 * rk, 90 * 0.4 * rk] : null;
      return { key: 'c' + m.join(',') + ':' + lx + ly + rk + cls, m, sat: 0.05, lx, ly: lx || ly ? ly : -1, grad: 0.16, rim };
    },
    temple(game, cls, x, y) {
      if (cls === 'god') return game.lvl.id === 'hermes' ? { key: 'gh', m: [0.88, 0.93, 1] } : { key: 'gz', m: [0.97, 0.92, 0.82] };
      let best = 0, bx = 0;
      sources(game).forEach((s) => {
        const dx = s.x - x, e = Math.abs(dx) / 150;
        if (e < 1 && 1 - e > best) { best = 1 - e; bx = dx; }
      });
      const k = q8(best);
      const m = [0.86 + k * 0.14, 0.8 + k * 0.14, 0.84 + k * 0.08];
      return { key: 't' + k + (bx > 0 ? 'r' : 'l') + cls, m, lx: bx > 0 ? 1 : -1, ly: 0, grad: 0.08, rim: [120 * k, 80 * k, 36 * k] };
    }
  };
  const ENT = { on: false, ctx: null, game: null };
  const ORIG = {};
  function litDrawA(ctx, name, x, y, flip, white, alpha) {
    if (ENT.on && ctx === ENT.ctx && !white) {
      const s = O.SPR[name], cls = s && classOf(name);
      const th = ENT.game.lvl.theme, fn = cls && (SPRITE_LIGHT[th] || (th === 'village' ? null : SPRITE_LIGHT.temple));
      if (fn) {
        const sx = Math.round(flip ? x - (s.w - 1 - s.ax) : x - s.ax), sy = Math.round(y - s.ay);
        let P = null;
        try { P = fn(ENT.game, cls, sx + s.w / 2, sy + s.h / 2); } catch (e) { O.logOnce('sky.spriteLight', e); }
        if (P) {
          const v = variant(flip ? s.f : s.n, P);
          if (alpha !== undefined) ctx.globalAlpha = alpha;
          ctx.drawImage(v, sx, sy);
          if (alpha !== undefined) ctx.globalAlpha = 1;
          return { sx, sy, s };
        }
      }
    }
    return ORIG.drawA.apply(this, arguments);
  }
  // Hooks into the engine's draw order (the lead may call O.Light.pre / O.Light.onLevel directly instead).
  function installHooks() {
    const P = O.Game && O.Game.prototype;
    if (P && P.drawLights && !P.drawLights.__sky) {
      const orig = P.drawLights;
      P.drawLights = function (c) {
        ENT.on = false;
        try { preEntity(c, this); } catch (e) { O.logOnce('sky.pre', e); }
        const r = orig.apply(this, arguments);
        ENT.on = true; ENT.ctx = c; ENT.game = this;
        return r;
      };
      P.drawLights.__sky = true;
    }
    if (P && P.drawWorld && !P.drawWorld.__sky) {
      const origW = P.drawWorld;
      P.drawWorld = function () { ENT.on = false; try { return origW.apply(this, arguments); } finally { ENT.on = false; } };
      P.drawWorld.__sky = true;
    }
    if (O.renderLevel && !O.renderLevel.__sky) {
      const origR = O.renderLevel;
      O.renderLevel = function (lvl) {
        const r = origR.apply(this, arguments);
        try { bakeLevel(lvl); } catch (e) { O.logOnce('sky.bake', e); }
        return r;
      };
      O.renderLevel.__sky = true;
    }
    if (O.drawA && !O.drawA.__sky) {
      ORIG.drawA = O.drawA;
      O.drawA = litDrawA;
      O.drawA.__sky = true;
    }
    if (!ORIG.drawA) ORIG.drawA = O.drawA;
  }

  /* ---------------- 4. POST pass (O.Light.apply) ---------------- */
  const THEME_LIGHT = {
    village(c, game, t) {
      // sun shafts from the upper-left, parallax-shifted, softly breathing
      const sh = shafts(LW, H, 5, '#ffe6a8', 0.14, 7, 0.55, 'village');
      const off = ((Math.floor(game.cam * 0.25) % LW) + LW) % LW;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.75 + Math.sin(t * 0.012) * 0.25;
      tileDraw(c, sh, off, 0);
      c.globalAlpha = 1;
      // warm sunlight grade + soft bloom centred on the sun (clear of the HUD)
      c.globalCompositeOperation = 'soft-light';
      c.fillStyle = 'rgba(255,214,150,0.26)'; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      c.drawImage(cached('sunbloom3', () => { const b = new Buf(W, H); halo(b, SUN[0], SUN[1], 150, '#2e230c', 1, 4, 1.8); return b.canvas(); }), 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.drawImage(vignette('#2a1f3c', 0.3, 0.72, 'village'), 0, 0);
    },
    forest(c, game, t) {
      // moon shafts
      c.globalCompositeOperation = 'lighter';
      const sh = shafts(LW, H, 4, '#5a5cb0', 0.2, 21, 0.7, 'forest');
      const off = ((Math.floor(game.cam * 0.2 + t * 0.05) % LW) + LW) % LW;
      c.globalAlpha = 0.5 + Math.sin(t * 0.01) * 0.2;
      tileDraw(c, sh, off, 0);
      c.globalAlpha = 1;
      // low drifting ground fog, in front of everything (solid wavy bands)
      c.globalCompositeOperation = 'source-over';
      tileDraw(c, fogBand(28, '#6e6ab4', 0.16, 71, 'forest'), ((Math.floor(game.cam * 1.15 + t * 0.12) % LW) + LW) % LW, 190);
      tileDraw(c, fogBand(26, '#9c88c4', 0.16, 73, 'forest2'), ((Math.floor(game.cam * 0.9 - t * 0.07) % LW) + LW) % LW, 158);
      c.drawImage(vignette('#0c0a1e', 0.4, 0.66, 'forest'), 0, 0);
    },
    cave(c, game, t) {
      const src = sources(game);
      // hot blooms around flames and a cold one around crystals
      c.globalCompositeOperation = 'lighter';
      src.forEach((s) => {
        if (s.type === 'torch') { const fb = flameBloom(30); const f = flick(t, s.i, 1); c.globalAlpha = 0.8 + f * 0.08; c.drawImage(fb, s.x - 30, s.y - 12 - 30); c.globalAlpha = 1; }
        else if (s.type === 'crystal') drawLight(c, 22, [16, 60, 80], s.x, s.y - 8, 2, 1.2);
      });
      // dust motes drifting in the torchlight
      src.forEach((s) => {
        if (s.type !== 'torch') return;
        for (let k = 0; k < 12; k++) {
          const a = k * 2.4 + s.i, rr = 12 + ((k * 37) % 40);
          const x = s.x + Math.cos(a + t * 0.004 * (1 + (k % 3))) * rr, y = s.y + 8 + Math.sin(a * 1.7 + t * 0.006) * rr * 0.7 - ((t * 0.08 + k * 11) % 20);
          c.fillStyle = k % 3 ? 'rgb(150,78,34)' : 'rgb(255,190,110)';
          c.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      });
      c.globalCompositeOperation = 'source-over';
      tileDraw(c, fogBand(34, '#4a2630', 0.28, 81, 'cave'), ((Math.floor(t * 0.1) % LW) + LW) % LW, 182);
      c.drawImage(vignette('#08040a', 0.6, 0.62, 'cave'), 0, 0);
      c.globalCompositeOperation = 'soft-light';
      c.fillStyle = 'rgba(255,160,100,0.14)'; c.fillRect(0, 0, W, H);
    },
    temple(c, game, t) {
      const hermes = game.lvl.id === 'hermes';
      const src = sources(game), gl = gods(game), wr = windowRect(game);
      // additive layer — composed off-screen so gods can be masked out of it
      const A = scratch('add'), a = A.x;
      a.clearRect(0, 0, W, H);
      a.globalCompositeOperation = 'lighter';
      // divine backlight: a soft elliptical aura *behind* the god (masked by the silhouette below)
      gl.forEach((gd) => {
        const p = Math.round(Math.sin(t * 0.05) * 1.5);
        const au = lightE(30 + p, 38 + p, hermes ? [24, 52, 72] : [64, 50, 20], 3, 1.1);
        a.drawImage(au, gd.x - (au.width >> 1), gd.cy - 2 - (au.height >> 1));
      });
      src.forEach((s) => { if (s.type === 'brazier') { const fb = flameBloom(28); a.globalAlpha = 0.7; a.drawImage(fb, s.x - 28, s.y - 32 - 28); a.globalAlpha = 1; } });
      cutGods(a, gl, game, 1);
      // god rays through the window (drawn after the first cut so only 30% of a ray may touch a god)
      if (wr) {
        const rays = cached('rays3:' + (hermes ? 'h' : 'z'), () => {
          const w = 150, h = 190, b = new Buf(w, h), col = hermes ? [150, 190, 230] : [255, 226, 160];
          const beams = [[-9, 3.5, 0.9], [-2, 2.5, 1], [5, 3.5, 0.8], [11, 2, 0.6], [0, 11, 0.35]];
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            let I = 0;
            beams.forEach((bm) => { const cx = 30 + bm[0] + y * 0.36 + bm[0] * y * 0.012, dd = Math.abs(x - cx) / (bm[1] + y * 0.07); if (dd < 1) I = Math.max(I, Math.min(1, (1 - dd) * 1.5) * bm[2]); });
            I *= clamp(1 - y / h, 0, 1) * clamp(y / 8, 0, 1);
            const q = qb(I, 3, x, y, 0.1);
            if (q > 0) b.set(x, y, col.map((v) => v * q * 0.28), 1);
          }
          return b.canvas();
        });
        a.globalAlpha = 0.75 + Math.sin(t * 0.015) * 0.2;
        a.drawImage(rays, Math.round(wr.x + wr.w / 2 - 30), wr.y + 8);
        a.globalAlpha = 1;
        for (let k = 0; k < 16; k++) { // motes dancing in the beams
          const yy = ((t * (0.12 + (k % 4) * 0.03) + k * 37) % 150);
          const x = wr.x + wr.w / 2 - 12 + (k * 13) % 26 + yy * 0.38 + Math.sin(t * 0.02 + k) * 3;
          a.fillStyle = hermes ? 'rgb(120,160,190)' : 'rgb(190,160,100)';
          a.fillRect(Math.round(x), Math.round(wr.y + 14 + yy), 1, 1);
        }
        cutGods(a, gl, game, 0.7);
      }
      c.globalCompositeOperation = 'lighter';
      c.drawImage(A.cv, 0, 0);
      // warm (or cool, for Hermes) grade: light in the upper wall, stronger toward the floor
      c.globalCompositeOperation = 'soft-light';
      c.drawImage(cached('tgrade:' + (hermes ? 'h' : 'z'), () => {
        const cv = O.makeCanvas(W, H), g = cv.getContext('2d'), col = hermes ? '150,215,255' : '255,200,120';
        for (let y = 0; y < H; y += 4) { g.fillStyle = 'rgba(' + col + ',' + (0.06 + 0.07 * smooth(60, 190, y)).toFixed(3) + ')'; g.fillRect(0, y, W, 4); }
        return cv;
      }), 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.drawImage(vignette('#140c22', 0.55, 0.6, 'temple'), 0, 0);
    }
  };

  // Pre-builds the cached light sprites of a theme by running its passes once on a scratch canvas.
  function warm(theme) {
    const cv = O.makeCanvas(W, H), c = cv.getContext('2d');
    const fake = { cam: 0, t: 0, npcs: [], fx: [], amb: [], enemies: [], pickups: [], state: 'play', player: { x: 100, y: 100, w: 12, h: 34, draw() {} },
      lvl: { theme, id: '', canvas: null, front: null, def: { lights: [], decor: theme === 'temple' ? [['window', 11.5, 7, 'back', 1]] : [] } } };
    const pre = PRE[theme] || PRE.temple;
    if (theme !== 'village') pre(c, fake, 0);
    (THEME_LIGHT[theme] || THEME_LIGHT.temple)(c, fake, 0);
  }

  O.Light = {
    apply(ctx, game) {
      ENT.on = false;
      if (!game || !game.lvl) return;
      const th = game.lvl.theme, fn = THEME_LIGHT[th] || THEME_LIGHT.temple;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // screen-shake must not expose unlit edges
      ctx.imageSmoothingEnabled = false;
      fn(ctx, game, game.t || 0);
      ctx.restore();
    },
    // The engine may call these directly (then the hooks become no-ops): pre = after the level, before entities.
    pre: preEntity,
    onLevel: bakeLevel,
    // Colour grade for scenes that don't run the full light pass (story pages, title key art).
    // `mask` (optional canvas W×H): grade only where it is opaque (e.g. the foreground props).
    grade(ctx, theme, mask) {
      const ops = (GRADE[theme] || []).slice();
      if (theme === 'forest') ops.push(['multiply', 'rgb(150,142,205)']);
      if (!ops.length) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      gradeOps(ctx, ops, mask || null);
      ctx.restore();
    }
  };

  /* ================================================================
     PARTICLE LOOK (fx + ambient)
     ================================================================ */
  const FXC = {};
  function frames(key, n, S, paint) {
    if (FXC[key]) return FXC[key];
    const out = [];
    for (let i = 0; i < n; i++) { const b = new Buf(S, S); paint(b, i, n, S / 2); out.push(b.canvas()); }
    FXC[key] = out;
    return out;
  }
  function ball(b, cx, cy, r, pal, alpha) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy;
      if (d > 1) continue;
      if (alpha < 1 && bay(x, y) >= alpha) continue;
      b.set(x, y, tone(pal, 0.5 - dx * 0.45 - dy * 0.55 + (1 - d) * 0.2, x, y, 0.4));
    }
  }
  const PUFF = ['#ffffff', '#eeedf7', '#cfcbe3', '#a8a1c8', '#7d74a4'];
  const DUST = ['#f4e6cf', '#d8c4a6', '#ae9a85', '#857469'];
  // Smoke puff: one connected mass of overlapping lobes with a shared upper-left highlight and a violet
  // underside; it swells, rises, then erodes with an ordered-dither threshold instead of shrinking.
  function puffFrames() {
    return frames('puff2', 22, 36, (b, i, n, C) => {
      const t = i / (n - 1);
      const R = 3 + Math.sqrt(t) * 10, cy = C + 2 - t * 6;
      const lobes = [[C, cy, 5 * (1 - t * 0.3) + 0.6]];
      for (let k = 0; k < 7; k++) {
        const a = k * 0.898 + 0.3 + t * 0.4, rr = R * 0.5 * (0.8 + (k % 3) * 0.15);
        const sz = (4.3 - (k % 3) * 0.6) * (1 - t * 0.5) * (0.75 + 0.35 * Math.min(1, t * 4));
        lobes.push([C + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * 0.8, sz]);
      }
      const MR = R * 0.55 + 5;
      for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
        let dm = -1;
        lobes.forEach((l) => { const d = Math.hypot(x + 0.5 - l[0], y + 0.5 - l[1]) / l[2]; if (1 - d > dm) dm = 1 - d; });
        if (dm <= 0) continue;
        if (t > 0.55) { const th = (t - 0.55) / 0.45; if (clamp(dm * 2.4, 0, 1) * 0.5 + bay(x, y) * 0.5 < th * 1.04) continue; }
        const gx = (x + 0.5 - C) / MR, gy = (y + 0.5 - cy) / MR;
        const lit = -gx * 0.6 - gy * 0.8;
        const v = 0.5 + lit * 0.6 + (dm - 0.3) * 0.35 - t * 0.3;
        let col = tone(PUFF, v, x, y, 0.3);
        if (gy > 0.3 && dm < 0.4 && lit < -0.2) col = rgb(PUFF[4]);
        b.set(x, y, col);
      }
    });
  }
  function sparkFrames() {
    return frames('spark', 10, 34, (b, i, n, C) => {
      const t = i / (n - 1);
      if (i < 3) { halo(b, C, C, 9 - i, '#fff6d0', 1, 3, 0.8); ball(b, C, C, 4 - i, ['#ffffff', '#ffffff', '#fff3b0'], 1); }
      const L = 5 + t * 12, L0 = L * (0.25 + t * 0.6);
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4 + 0.2, len = k % 2 ? L * 0.65 : L;
        for (let s = L0; s < len; s += 0.5) {
          const x = C + Math.cos(a) * s, y = C + Math.sin(a) * s;
          const f = (s - L0) / (len - L0 + 0.01);
          b.set(x, y, f < 0.3 && t < 0.6 ? '#ffffff' : f < 0.7 ? '#ffd54a' : '#e3861d');
        }
      }
    });
  }
  function dustFrames() {
    return frames('dust', 16, 14, (b, i, n, C) => {
      const t = i / (n - 1), r = 2.8 - t * 1.6;
      ball(b, C, C, r, DUST, t < 0.5 ? 1 : 1 - (t - 0.5) * 1.6);
      if (t < 0.6) ball(b, C + 2, C + 1, r * 0.7, DUST, 1 - t);
    });
  }
  // Hit star: a 4-point sparkle (long straight arms, 1-px diagonals) cooling white → gold → orange,
  // turning 45° every 4 frames, opened by a 1-frame 5×5 white flash. Pre-rendered (13×13 frames).
  function starFrames() {
    return frames('star2', 24, 13, (b, t, n, C) => {
      const cx = 6, cy = 6;
      if (t === 0) { b.rect(cx - 2, cy - 2, 5, 5, '#ffffff'); b.rect(cx - 3, cy, 7, 1, '#fff4c0'); b.rect(cx, cy - 3, 1, 7, '#fff4c0'); return; }
      const ph = t < 8 ? 0 : t < 16 ? 1 : 2;
      const arm = [4, 3, 2][ph] - (t > 20 ? 1 : 0);
      const core = ['#ffffff', '#ffe07a', '#ff9a3a'][ph], mid = ['#ffe07a', '#ff9a3a', '#c0561c'][ph], tip = ['#ff9a3a', '#c0561c', '#7a2c1c'][ph];
      const rot = (t >> 2) & 1;
      const dirs = rot ? [[1, 1], [-1, 1], [1, -1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const len = rot ? Math.max(1, arm - 1) : arm;
      dirs.forEach(([dx, dy]) => { for (let k = 1; k <= len; k++) b.set(cx + dx * k, cy + dy * k, k === len ? tip : mid); });
      if (!rot && ph < 2) [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([dx, dy]) => b.set(cx + dx, cy + dy, tip));
      if (rot && ph < 2) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => b.set(cx + dx, cy + dy, mid));
      b.set(cx, cy, core);
    });
  }

  O.FXDraw = function (c, f, x, y, game) {
    if (f.type === 'puff') { const fr = puffFrames(); const s = fr[Math.min(fr.length - 1, f.t)]; c.drawImage(s, x - 18, y - 18); return true; }
    if (f.type === 'spark') {
      const fr = sparkFrames(); const s = fr[Math.min(fr.length - 1, f.t)];
      // glow shrinks and fades with age (and is halved on the bright village sky)
      const gr = f.t <= 2 ? 13 : f.t <= 5 ? 8 : 0;
      if (gr) {
        const th = game && game.lvl ? game.lvl.theme : (O.game && O.game.lvl ? O.game.lvl.theme : '');
        const k = (1 - f.t / 10) * (th === 'village' ? 0.5 : 1);
        const col = [Math.round(120 * k / 8) * 8, Math.round(90 * k / 8) * 8, Math.round(40 * k / 8) * 8];
        c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(lightSprite(gr, col, 3, 1.9), x - gr, y - gr); c.restore();
      }
      c.drawImage(s, x - 17, y - 17); return true;
    }
    if (f.type === 'dust') { const fr = dustFrames(); c.drawImage(fr[Math.min(fr.length - 1, f.t)], x - 7, y - 7); return true; }
    if (f.type === 'star') {
      const fr = starFrames(), t = Math.min(fr.length - 1, f.t);
      if (t < 12) { c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(lightSprite(6, [t < 4 ? 120 : 80, t < 4 ? 96 : 56, 24], 2, 1), x - 6, y - 6); c.restore(); }
      c.drawImage(fr[t], x - 6, y - 6);
      return true;
    }
    if (f.type === 'bit') {
      const k = (f.t >> 2) & 3;
      c.fillStyle = '#4a2c24'; c.fillRect(x - 1, y - 1, 3, 3);
      c.fillStyle = '#b8845e'; c.fillRect(x - 1 + (k & 1), y - 1 + (k >> 1), 2, 2);
      c.fillStyle = '#e6b88c'; c.fillRect(x - 1 + (k & 1), y - 1 + (k >> 1), 1, 1);
      return true;
    }
    return false;
  };

  const LEAF = [
    [[0, 0, '#cfe39a'], [1, 0, '#8fb45c'], [2, 1, '#5f8a44']],
    [[0, 0, '#a2bf6c'], [1, 1, '#6e9150'], [1, 0, '#cfe39a']],
    [[0, 1, '#5f8a44'], [1, 1, '#8fb45c'], [2, 0, '#cfe39a']],
    [[1, 0, '#cfe39a'], [1, 1, '#8fb45c'], [1, 2, '#5f8a44']]
  ];
  O.AmbDraw = function (c, p, x, y) {
    if (p.k === 'leaf') {
      const fr = LEAF[(p.t >> 3) & 3];
      fr.forEach((q) => { c.fillStyle = q[2]; c.fillRect(x + q[0], y + q[1], 1, 1); });
      return true;
    }
    if (p.k === 'fly') {
      const on = flyOn(p);
      if (on <= 0) { c.fillStyle = '#3a4a2a'; c.fillRect(x, y, 1, 1); return true; }
      c.save();
      c.globalCompositeOperation = 'lighter';
      const s = lightSprite(7, [Math.round(120 * on), Math.round(200 * on), Math.round(60 * on)], 3, 1.2);
      c.drawImage(s, x - 7, y - 7);
      c.restore();
      c.fillStyle = on > 0.6 ? '#f6ffc0' : '#c8f070';
      c.fillRect(x, y, 1, 1);
      return true;
    }
    if (p.k === 'ember') {
      const col = p.t < 20 ? '#fff6c0' : p.t < 40 ? '#ffc040' : p.t < 58 ? '#f06a28' : '#8a2c24';
      c.save();
      c.globalCompositeOperation = 'lighter';
      if (p.t < 50) c.drawImage(lightSprite(4, [140, 70, 20], 2, 1), x - 4, y - 4);
      c.restore();
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
      if (p.t < 12) c.fillRect(x, y + 1, 1, 1);
      return true;
    }
    if (p.k === 'drip') {
      c.fillStyle = '#3c6c9c'; c.fillRect(x, y, 1, 3);
      c.fillStyle = '#9fe0ff'; c.fillRect(x, y + 1, 1, 1);
      c.fillStyle = '#ffffff'; c.fillRect(x, y + 2, 1, 1);
      return true;
    }
    return false;
  };

  /* ================================================================
     registration
     ================================================================ */
  O.ART_INITS = O.ART_INITS || [];
  O.ART_INITS.push(function () {
    O.Tiles.background = background;
    installHooks();
    background('village'); // warm the title-screen background now, the rest in idle time
    warm('village');
    if (typeof setTimeout === 'function') ['forest', 'temple', 'cave'].forEach((th, i) => setTimeout(() => { try { background(th); warm(th); } catch (e) { O.logOnce('sky.warm', e); } }, 400 + i * 350));
  });
})(window.OLY);
