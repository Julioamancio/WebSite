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
    const s = steps || 4;
    const q = Math.floor(clamp(t, 0, 1) * s + bay(x, y) * 0.999) / s;
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
    const S = steps || 5, P = pw || 1.6;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) {
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d >= 1) continue;
        const I = Math.pow(1 - d, P);
        const q = Math.floor(I * S + bay(x, y) * 0.999) / S;
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
        const I = clamp(base * (0.55 + n * 0.9), 0, 1);
        const q = Math.floor(I * 4 + bay(x, y) * 0.999) / 4;
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
  const SUN = [132, 30]; // upper-left light source, kept clear of the HUD counters
  const VIL = {
    haze: '#dfe9f3',
    rock: ['#d2d6ef', '#b5bbe3', '#9aa0d2', '#8185bf', '#6c6ea8'],
    snow: ['#ffffff', '#eef3fc', '#d3def5', '#b3c1e8', '#98a5d8']
  };

  function villageSky() {
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
    const [sx, sy] = SUN;
    halo(b, sx, sy, 70, '#fff6d8', 0.4, 6, 2.2);
    halo(b, sx, sy, 22, '#fffbe8', 0.65, 4, 1.2);
    for (let y = sy - 9; y < sy + 10; y++) for (let x = sx - 9; x < sx + 10; x++) {
      const d = Math.hypot(x + 0.5 - sx, y + 0.5 - sy);
      if (d < 6.2) b.set(x, y, '#fffff6'); else if (d < 7.4) b.set(x, y, '#fff3c4');
    }
    return b.canvas();
  }

  // Mount Olympus: a broad massif — several summits, lit left faces / shadowed right faces split
  // along meandering ridges, snow held in couloirs, forested foothills dissolving into haze,
  // and a tiny golden temple with a divine glow on the highest summit.
  function olympusLayer(night) {
    const b = new Buf(LW, H), LAKE = 141;
    // [x, topY, left slope, right slope] — the main summit is tall enough that its temple always clears
    // the world's roofs; shoulders and lower summits break the row of cones into a massif.
    const peaks = [[242, 36, 0.86, 0.66], [204, 60, 0.78, 1.05], [292, 58, 1.1, 0.7], [268, 52, 1.5, 1.0], [226, 50, 1.3, 1.6],
      [158, 88, 0.62, 0.85], [342, 80, 0.9, 0.56], [322, 74, 1.4, 1.2], [110, 112, 0.5, 0.62], [410, 106, 0.62, 0.48]];
    const top = new Float32Array(LW), own = new Int8Array(LW);
    for (let x = 0; x < LW; x++) {
      const fr = 1 - Math.abs(fbm(x, 2, 47, 64, 3, LW) * 2 - 1); // ridged foothills: no flat wedges at the massif's feet
      let h = 146 + Math.sin((x / LW) * Math.PI * 4) * 4 - Math.pow(fr, 1.5) * 20, o = -1;
      peaks.forEach((p, i) => {
        const dx = x - p[0];
        const v = p[1] + (dx < 0 ? -dx * p[2] : dx * p[3]) + Math.pow(Math.abs(dx) / 60, 2) * 4;
        if (v < h) { h = v; o = i; }
      });
      const n = fbm(x, 0, 41, 32, 4, LW) - 0.5, n2 = fbm(x, 3, 43, 8, 2, LW) - 0.5;
      top[x] = h + n * (h < 120 ? 12 : 5) * clamp((h - 34) / 14, 0.25, 1) + n2 * 3;
      own[x] = o;
    }
    const tp = Float32Array.from(top);
    for (let x = 0; x < LW; x++) top[x] = (tp[(x + LW - 1) % LW] + tp[x] * 2 + tp[(x + 1) % LW]) / 4;
    // snow never beats the gameplay whites: capped at #e8eefa, shadows drift toward the sky blue
    const rock = night ? ['#8e94c8', '#767cb4', '#60669e', '#4e5288', '#3e4172'] : ['#a4a9d6', '#8e93c7', '#787db5', '#6569a2', '#565993'];
    const snow = night ? ['#d6dcf6', '#bcc6ec', '#9ea9dc', '#8791cc', '#707ab8'] : ['#e8eefa', '#d5ddf3', '#bdc8ec', '#a9b6e6', '#8391cc'];
    const wood = night ? ['#58608f', '#4a5180', '#3e4472'] : ['#8fa9b8', '#7c98ab', '#6c879f'];
    const haze = night ? '#4a4c86' : '#dce7f2';
    for (let x = 0; x < LW; x++) {
      const t0 = Math.round(top[x]);
      const sl = (top[(x - 2 + LW) % LW] - top[(x + 2) % LW]) / 4;
      for (let y = t0; y < (night ? 180 : LAKE); y++) {
        const dd = y - t0;
        const pi = own[x] < 0 ? 0 : own[x];
        const P = peaks[pi];
        const k = clamp((y - P[1]) / 70, 0, 1.5);
        // main ridge from the summit, meandering and drifting with depth
        const rx = P[0] + (fbm(y, pi * 9, 5, 24, 3) - 0.5) * 40 * k + (y - P[1]) * 0.1;
        const side = x - rx;
        let v = side < 0 ? 0.72 : 0.3;
        v += clamp(-side / 40, -0.15, 0.15);
        // couloirs: fanned from the summit, but domain-warped so they bend, and gated so they vary in length
        const warp = (fbm(x, y * 0.8, 71 + pi, 28, 2, LW) - 0.5) * 22 * clamp(k * 1.6, 0.2, 1);
        const ang = (x - P[0] + warp) / (y - P[1] + 16);
        const f1 = fbm(ang * 8 + 50 + pi * 7, y * 0.025, 9, 1, 2);
        const f2 = fbm(ang * 8 + 50.3 + pi * 7, y * 0.025, 9, 1, 2);
        const gate = smooth(0.3, 0.62, fbm(ang * 5 + pi * 3, y * 0.035, 19, 1, 2));
        const rib = 1 - Math.abs(f1 * 2 - 1);
        v += (f2 - f1) * 4.2 * clamp(k * 2, 0.3, 1) * (0.35 + gate * 0.65);
        v += clamp(sl, -1, 1) * 0.3 * Math.exp(-dd / 10);
        v += (fbm(x, y, 13, 10, 2, LW) - 0.5) * 0.2;
        const alt = 166 - y;
        const sn = fbm(x, y * 1.3, 17, 14, 3, LW);
        const snowLine = 70 + (sn - 0.5) * 34 - (1 - rib) * 18 * gate - (side < 0 ? 6 : 0) + (pi > 4 ? 10 : 0);
        // rock outcrops breaking through the snow: a few irregular clusters per face
        // (wind strips the snow off the rib crests: dark rock streaks that follow the fall line)
        const oc = fbm(ang * 7 + pi * 5, y * 0.07, 61, 1, 2) * 0.7 + fbm(x, y, 63, 6, 2, LW) * 0.3;
        const outcrop = dd > 4 && y - P[1] > 10 && rib > 0.72 - (oc - 0.5) * 0.4 && oc > 0.5;
        let c;
        const isSnow = alt > snowLine && !outcrop;
        if (isSnow) c = tone(snow, v + 0.08, x, y, 0.45);
        else {
          c = tone(rock, v - (outcrop ? 0.12 : 0.05), x, y, 0.45);
          if (outcrop && oc > 0.7 && side < 0 && v > 0.55) c = rgb(rock[0]);
          const fw = clamp((64 - alt) / 26, 0, 1) * (0.6 + (fbm(x, y, 23, 4, 2, LW) - 0.5));
          if (fw > 0.45) c = tone(wood, v - 0.1 + (fbm(x, y * 2, 29, 3, 1, LW) - 0.5) * 0.6, x, y, 0.4);
        }
        if (dd === 0) c = sl > -0.1 ? rgb(isSnow ? snow[0] : rock[0]) : rgb(isSnow ? snow[2] : rock[1]);
        const ht = clamp((y - 104) / 52, 0, 1);
        if (ht > 0) c = qmix(c, haze, ht * 0.95, x, y, 5);
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
      const r = rng(5);
      for (let i = 0; i < 120; i++) {
        const x = (r() * LW) | 0, y = LAKE + 2 + ((Math.pow(r(), 0.8) * 30) | 0);
        const len = 1 + ((r() * 5) | 0);
        for (let k = 0; k < len; k++) b.set(x + k, y, k === 0 || k === len - 1 ? '#e2ecf8' : '#ffffff');
      }
    }
    // golden temple on the summit + divine glow and a faint beam
    const tx = peaks[0][0] - 1, ty = Math.round(top[tx]) + 1;
    halo(b, tx, ty - 6, 30, night ? '#ffe7a0' : '#fff2c0', night ? 0.5 : 0.5, 6, 1.9);
    for (let y = 0; y < ty - 12; y++) {
      const f = y / (ty - 12);
      for (let dx = -2; dx <= 2; dx++) {
        const I = (1 - Math.abs(dx) / 3) * f * f;
        const q = Math.floor(I * 3 + bay(tx + dx, y) * 0.999) / 3;
        if (q > 0) b.set(tx + dx, y, '#fff4c8', q * (night ? 0.3 : 0.2));
      }
    }
    const G = ['#fff7c0', '#ffd54a', '#e39b1d', '#a8621b', '#6b3a1a'];
    const X = tx - 5;
    b.rect(X - 1, ty - 1, 13, 2, G[3]); b.rect(X - 1, ty - 1, 13, 1, G[2]);
    b.rect(X, ty - 2, 11, 1, G[1]);
    for (let i = 0; i < 4; i++) { b.rect(X + 1 + i * 3, ty - 6, 1, 4, i < 2 ? G[0] : G[1]); b.rect(X + 2 + i * 3, ty - 6, 1, 4, G[3]); }
    b.rect(X, ty - 7, 11, 1, G[2]); b.rect(X - 1, ty - 8, 13, 1, G[1]);
    b.rect(X + 1, ty - 9, 9, 1, G[0]); b.rect(X + 3, ty - 10, 5, 1, G[1]); b.rect(X + 5, ty - 11, 1, 1, G[0]);
    b.set(X + 5, ty - 12, '#ffffff');
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
    }
    return b.canvas();
  }

  // Sprite clouds (cached), shaded from the upper-left.
  function cloudSprite(w, h, seed, pal) {
    const b = new Buf(w, h);
    cloudPaint(b, 0, 0, w, h, seed, pal);
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
    for (let y = my - MR - 1; y <= my + MR + 1; y++) for (let x = mx - MR - 1; x <= mx + MR + 1; x++) {
      const dx = (x + 0.5 - mx) / MR, dy = (y + 0.5 - my) / MR, d = dx * dx + dy * dy;
      if (d > 1) continue;
      const mare = fbm(x * 1.2, y * 1.2, 51, 10, 3);
      let v = 0.72 - Math.max(0, dx * 0.3 + dy * 0.25) - (mare > 0.56 ? 0.28 : 0) + (1 - d) * 0.15;
      let c = tone(['#fffdf4', '#f6eed8', '#e7dcc0', '#cfc2a6', '#b3a88e'], v, x, y, 0.4);
      if (d > 0.84 && dx + dy < -0.3) c = rgb('#ffffff');
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
      for (let y = 0; y < H; y++) {
        const cx = x0 + Math.sin(y * 0.018 + ph) * 3 + Math.sin(y * 0.05 + ph * 2) * 1;
        const flare = y > H - 44 ? Math.pow((y - (H - 44)) / 44, 2) * tw * 1.2 : 0;
        const wv = tw + flare, L = Math.round(cx - flare * 0.6), R = Math.round(cx + tw + flare * 0.4);
        for (let x = L; x < R; x++) {
          const u = (x - L) / (R - L);
          const bark = fbm(x * 1.0, y * 0.12, o.seed + i, 3, 2);
          let v = 0.62 - u * 0.75 + (bark - 0.5) * 0.45;
          let c = tone(pal, v, x, y, 0.35);
          if (x === L && o.rim) c = rgb(o.rim);
          else if (x === L + 1 && o.rim && bay(x, y) < 0.5) c = mixc(o.rim, pal[1], 0.5);
          b.set(x, y, c);
        }
        if (wv < 0) break;
      }
      // branches
      for (let j = 0; j < 3; j++) {
        const by = 30 + ((r() * 90) | 0), dir = r() < 0.5 ? -1 : 1, len = 10 + ((r() * 16) | 0);
        const bx = x0 + (dir > 0 ? tw - 1 : 0);
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
    halo(b, 200, 128, 170, '#7a3218', 0.5, 7, 1.7);  // distant lava/firelight glow
    halo(b, 200, 140, 70, '#ff9a40', 0.26, 5, 1.7);
    return b.canvas();
  }
  // Shade a vertical rock form given per-row spans. Lit face toward the glow (2 tones + broken
  // highlight clusters), shadow face (2 tones) with a violet bounce light near the tip.
  function shadeForm(b, rows, o, ld, seed, tipTop) {
    const pal = o.pal;
    rows.forEach((rw) => {
      const y = rw[0], L = rw[1], R = rw[2], t = rw[3], groove = rw[4];
      const mid = (L + R) / 2, hw = (R - L) / 2 + 0.35;
      for (let x = Math.round(L); x <= Math.round(R); x++) {
        const u = (x + 0.5 - mid) / hw, lit = clamp(u * ld, -1, 1);
        let v = 0.44 + lit * 0.42 + (fbm(x * 0.7, y * 0.35, seed + 3, 6, 2) - 0.5) * 0.26 + (o.formLift || 0);
        if (groove) v -= 0.3;
        let c = tone(pal, v, x, y, 0.22);
        const n = fbm(x * 0.6, y * 0.9, seed + 4, 4, 2);
        if (lit > 0.55 && n > 0.5 && !groove) c = rgb(o.rim);
        else if (lit > 0.3 && n > 0.62 && !groove) c = mixc(o.rim, pal[0], 0.5);
        else if (lit < -0.45 && (tipTop ? t > 0.35 : t < 0.65) && n > 0.42) c = mixc(o.bounce, pal[pal.length - 2], 0.35);
        b.set(x, y, c);
      }
    });
  }
  // A stalactite (top) or stalagmite (bottom): wobbling profile, convex taper, 1–2 bulging rings.
  function formation(b, x0, y0, len, w, top, seed, o, ld) {
    const r = rng(seed), dir = top ? 1 : -1, rows = [];
    const rings = [];
    const nR = 1 + ((r() * 2) | 0);
    for (let i = 0; i < nR; i++) rings.push([0.18 + r() * 0.5, 0.14 + r() * 0.2]);
    const lean = (r() - 0.5) * 0.18;
    for (let j = 0; j <= len; j++) {
      const t = j / len;
      let hw = w * (0.72 * (1 - Math.pow(t, 1.6)) + 0.28 * (1 - t));
      let groove = false;
      rings.forEach((rg) => { hw += w * rg[1] * Math.exp(-Math.pow((t - rg[0]) / 0.045, 2)); if (Math.abs(t - (rg[0] - 0.07)) * len < 0.6) groove = true; });
      const cx = x0 + lean * j + (fbm(j, 0, seed, 12, 2) - 0.5) * 3;
      const L = cx - hw - (fbm(j, 1, seed + 1, 5, 2) - 0.5) * 2.6, R = cx + hw + (fbm(j, 2, seed + 2, 5, 2) - 0.5) * 2.6;
      if (R - L < 0.8) { if (t > 0.85) rows.push([y0 + dir * j, cx, cx, t, false]); continue; }
      rows.push([y0 + dir * j, L, R, t, groove && hw > 2]);
    }
    shadeForm(b, rows, o, ld, seed, top);
    if (top) { const last = rows[rows.length - 1]; if (last) b.set(Math.round((last[1] + last[2]) / 2), last[0] + 1, o.rim); }
  }
  // A column where a stalactite met a stalagmite: pinched waist, rings, flared base and cap.
  function pillar(b, x0, yTop, yBot, w, seed, o, ld) {
    const r = rng(seed), rows = [], ym = yTop + (yBot - yTop) * (0.45 + r() * 0.15), half = (yBot - yTop) / 2;
    const rings = [[ym + (r() - 0.5) * 20, 0.3], [yTop + (ym - yTop) * 0.4, 0.2], [ym + (yBot - ym) * 0.55, 0.22]];
    for (let y = yTop; y <= yBot; y++) {
      const k = Math.abs(y - ym) / half;
      let hw = w * (0.38 + 0.62 * Math.pow(k, 1.7));
      let groove = false;
      rings.forEach((rg) => { hw += w * rg[1] * Math.exp(-Math.pow((y - rg[0]) / 3, 2)); if (Math.abs(y - (rg[0] - 4)) < 0.6) groove = true; });
      const cx = x0 + (fbm(y, 0, seed, 24, 2) - 0.5) * 6;
      const L = cx - hw - (fbm(y, 1, seed + 1, 6, 2) - 0.5) * 3, R = cx + hw + (fbm(y, 2, seed + 2, 6, 2) - 0.5) * 3;
      rows.push([y, L, R, 0.5, groove]);
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
    // ceiling & floor masses: 2–3 big tonal clusters, lit lip facing the glow, broken highlight
    for (let x = 0; x < LW; x++) {
      const u0 = Math.round(up[x]), d0 = Math.round(dn[x]);
      const slU = (up[(x + 2) % LW] - up[(x - 2 + LW) % LW]) / 4, slD = (dn[(x - 2 + LW) % LW] - dn[(x + 2) % LW]) / 4;
      for (let y = 0; y < H; y++) {
        let e, sl;
        if (y <= u0) { e = u0 - y; sl = slU * ldAt(x); } else if (y >= d0) { e = y - d0; sl = slD * ldAt(x); } else continue;
        const cl = fbm(x, y * 1.3, o.seed + 5, 40, 3, LW);
        let v = 0.2 + (cl - 0.5) * 0.9 + 0.42 * Math.exp(-e / 5) + clamp(sl, -0.5, 0.5) * 0.3 * Math.exp(-e / 8);
        let c = tone(o.pal, v, x, y, 0.2);
        const n = fbm(x, y, o.seed + 6, 6, 2, LW);
        if (e === 0 && sl > 0.12 && n > 0.56) c = rgb(o.rim);
        else if (e <= 1 && n > 0.62) c = mixc(o.rim, o.pal[0], 0.6);
        else if (e > 4 && Math.abs(cl - 0.5) < 0.011) c = o.pal[o.pal.length - 1];      // strata cracks
        else if (e > 4 && Math.abs(cl - 0.5) < 0.024 && bay(x, y) < 0.5) c = o.pal[Math.max(0, o.pal.length - 2)];
        b.set(x, y, c);
      }
    }
    // formations
    for (let i = 0; i < o.spikes; i++) {
      const x = Math.round((i + r() * 0.8) * LW / o.spikes), top = r() < 0.58;
      const len = o.len[0] + r() * o.len[1], w = 2.5 + r() * o.wid;
      formation(b, x, top ? Math.round(up[x]) - 3 : Math.round(dn[x]) + 3, Math.round(len), w, top, o.seed * 100 + i, o, ldAt(x));
    }
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
          const kk = k * (1 - dx * 0.55);
          b.set(x, y, qmix(b.getc(x, y), hz, kk, x, y, 4));
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
  // Sea of clouds under the night summit: three rows of billows (far → near), moonlit crowns from the
  // upper-left, lobe separations and a dithered darker underside where each row sits on the next.
  function templeClouds() {
    const b = new Buf(LW, H);
    const rows = [
      { y: 150, rmin: 8, rmax: 18, pal: ['#b9bcea', '#9ea3dc', '#868bc8', '#7277b4'], seed: 1 },
      { y: 166, rmin: 7, rmax: 16, pal: ['#c6c9f4', '#a2a7e0', '#7f85c4', '#646aa8', '#50558f'], seed: 2 },
      { y: 184, rmin: 9, rmax: 20, pal: ['#d2d5fa', '#a9aee6', '#8187c6', '#5e64a0', '#474c86'], seed: 3 }
    ];
    rows.forEach((row) => {
      const r = rng(row.seed * 131), lobes = [], pal = row.pal.map(rgb), n = pal.length;
      for (let x = 0; x < LW;) {
        const rad = row.rmin + r() * (row.rmax - row.rmin);
        lobes.push([x, row.y - rad * (0.25 + r() * 0.35), rad]);
        x += rad * (0.8 + r() * 0.6);
      }
      // body of the row: darkens with depth, soft internal billow texture
      for (let x = 0; x < LW; x++) for (let y = row.y; y < H; y++) {
        const v = 0.34 - (y - row.y) * 0.012 + (fbm(x, y * 2, 9 + row.seed, 16, 2, LW) - 0.5) * 0.2;
        b.set(x, y, tone(pal, v, x, y, 0.4));
      }
      // billows (bigger ones behind), each lit from the moon at the upper-left
      lobes.sort((p, q) => q[2] - p[2]).forEach((l) => {
        for (let y = Math.floor(l[1] - l[2]); y <= row.y + 3; y++) for (let x = Math.floor(l[0] - l[2]); x <= l[0] + l[2]; x++) {
          const dx = (x + 0.5 - l[0]) / l[2], dy = (y + 0.5 - l[1]) / l[2], d = Math.sqrt(dx * dx + dy * dy);
          if (d > 1) continue;
          const lit = (-dx * 0.6 - dy * 0.8) / (d || 1) * Math.min(1, d * 1.3);
          let v = 0.5 + lit * 0.36 - clamp((y - l[1]) / l[2], 0, 1) * 0.3 + (fbm(x, y, 5 + row.seed, 6, 2, LW) - 0.5) * 0.1;
          let c = tone(pal, v, x, y, 0.35);
          if (d > 0.84 && lit > 0.3) c = pal[0];                                         // moonlit crown
          else if (d > 0.86 && lit < -0.2) c = pal[Math.min(n - 1, 3)];                  // separation from the lobe behind
          if (y >= row.y + 1 && bay(x, y) < (y - row.y) / 4) c = tone(pal, 0.3, x, y, 0.3); // melt into the body
          b.set(x, y, c);
        }
      });
      // dithered darker underside where this row sits on the next
      for (let x = 0; x < LW; x++) for (let y = row.y + 12; y < row.y + 16 && y < H; y++) if (bay(x, y) < 0.5 - (y - row.y - 12) * 0.1) b.set(x, y, pal[n - 1]);
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
          { c: caveLayer({ seed: 5, ceil: 50, ceilAmp: 16, floor: 166, floorAmp: 12, spikes: 30, len: [22, 56], wid: 6, pillars: 3, pal: ['#6e4034', '#5a3430', '#48292c', '#3a2229', '#2e1c26'], rim: '#b8744a', bounce: '#4a3656', glow: G, haze: '#8a4428', hazeK: 0.55, hazeSpread: 46, mist: [118, 196, '#7a3524', 0.4] }), f: 0.06 },
          { c: caveLayer({ seed: 15, ceil: 24, ceilAmp: 14, floor: 186, floorAmp: 12, spikes: 16, len: [26, 52], wid: 9, pillars: 1, pal: ['#4e2c28', '#3e2225', '#301a20', '#24141b', '#1a0f16'], rim: '#b8643a', bounce: '#3a2c50', glow: G, haze: '#5a2a1e', hazeK: 0.35, hazeSpread: 40, mist: [150, 216, '#4a2220', 0.35], gems: 4, gemScale: 1 }), f: 0.16 },
          { c: caveLayer({ seed: 25, ceil: 8, ceilAmp: 10, floor: 202, floorAmp: 8, spikes: 10, len: [34, 50], wid: 13, pillars: 0, pal: ['#2c1a1c', '#22141a', '#1a0f15', '#140b11', '#0f080d'], rim: '#6a3424', bounce: '#231a34', glow: G, formLift: -0.05 }), f: 0.3 }
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
    const day = ['#ffffff', '#f4f7fd', '#dfe7f7', '#c3d0ee', '#aab6e0'];
    const far = ['#f3f7fd', '#e2eaf8', '#cdd9f2', '#b8c6ea'];
    const nightP = ['#c6a3c9', '#8e6ea8', '#62508e', '#453c78', '#352f66'];
    clouds = {
      village: [
        { c: cloudSprite(84, 26, 3, day), x: 150, y: 70, s: 0.05, p: 0.05 },
        { c: cloudSprite(56, 18, 5, day), x: 330, y: 50, s: 0.07, p: 0.06 },
        { c: cloudSprite(40, 12, 9, far), x: 20, y: 104, s: 0.03, p: 0.035 },
        { c: cloudSprite(64, 16, 11, far), x: 250, y: 112, s: 0.035, p: 0.04 },
        { c: cloudSprite(110, 30, 13, day), x: 520, y: 22, s: 0.06, p: 0.07 }
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
    return bg;
  }
  O.SkyArt = { background, Buf, fbm, halo, gradient, tone };

  /* ================================================================
     LIGHTING & ATMOSPHERE
     A light map (ambient colour + additive quantised light pools) is multiplied over the scene,
     then glows are added, fog / god rays / vignette / grading drawn on top. All sprites cached.
     ================================================================ */
  const LC = {};
  // Quantised radial light: `steps` bands with ordered-dithered seams. col = [r,g,b] (0..255).
  function lightSprite(r, col, steps, pw, key) {
    const k = key || ('L' + r + ':' + col.join(',') + ':' + steps + ':' + pw);
    if (LC[k]) return LC[k];
    const S = r * 2 + 1, cv = O.makeCanvas(S, S), g = cv.getContext('2d');
    const img = g.createImageData(S, S), d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dd = Math.hypot(x - r, y - r) / r;
      if (dd >= 1) continue;
      const I = Math.pow(1 - dd, pw || 1.5);
      const q = Math.floor(I * steps + bay(x, y) * 0.999) / steps;
      if (q <= 0) continue;
      const i = (y * S + x) * 4;
      d[i] = col[0] * q; d[i + 1] = col[1] * q; d[i + 2] = col[2] * q; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    LC[k] = cv;
    return cv;
  }
  function drawLight(g, r, col, x, y, steps, pw) {
    const s = lightSprite(r, col, steps || 6, pw || 1.5);
    g.drawImage(s, Math.round(x) - r, Math.round(y) - r);
  }
  // cached full-screen helpers
  function cached(key, fn) { if (!LC[key]) LC[key] = fn(); return LC[key]; }
  function vgrad(keys) { // vertical ambient gradient canvas (W×H), quantised
    const b = new Buf(W, H);
    gradient(b, keys, 12);
    return b.canvas();
  }
  function vignette(col, amax, inner, key) {
    return cached('vig:' + key, () => {
      const b = new Buf(W, H), c = rgb(col);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - W / 2) / (W / 2), dy = (y + 0.5 - H / 2) / (H / 2);
        const d = Math.sqrt(dx * dx * 0.8 + dy * dy * 1.1);
        const I = smooth(inner, 1.25, d);
        const q = Math.floor(I * 5 + bay(x, y) * 0.999) / 5;
        if (q > 0) b.set(x, y, c, q * amax);
      }
      return b.canvas();
    });
  }
  // Diagonal light shafts (from the upper-left) — additive, quantised along their length.
  function shafts(w, h, n, col, amax, seed, slope, key) {
    return cached('shaft:' + key, () => {
      const b = new Buf(w, h), r = rng(seed), c = rgb(col);
      const beams = [];
      for (let i = 0; i < n; i++) beams.push([r() * w, 6 + r() * 16, 0.4 + r() * 0.6]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let I = 0;
        beams.forEach((bm) => {
          const u = x - (bm[0] + y * slope); // distance across the beam
          const uu = ((u % w) + w) % w; const dd = Math.min(uu, w - uu);
          if (dd < bm[1]) I = Math.max(I, (1 - dd / bm[1]) * bm[2]);
        });
        I *= Math.pow(1 - y / h, 1.2);
        const q = Math.floor(I * 4 + bay(x, y) * 0.999) / 4;
        if (q > 0) b.set(x, y, c.map((v) => v * q * amax), 1);
      }
      return b.canvas();
    });
  }
  // Drifting fog band (periodic, alpha-quantised) to be drawn over the world.
  function fogBand(h, col, amax, seed, key) {
    return cached('fog:' + key, () => {
      const b = new Buf(LW, h);
      for (let y = 0; y < h; y++) {
        const f = y / h, env = Math.sin(f * Math.PI);
        for (let x = 0; x < LW; x++) {
          const n = fbm(x, y * 4, seed, 128, 3, LW);
          const I = clamp(env * (n * 1.8 - 0.45), 0, 1);
          const q = Math.floor(I * 4 + bay(x, y) * 0.999) / 4;
          if (q > 0) b.set(x, y, col, q * amax);
        }
      }
      return b.canvas();
    });
  }

  let LM = null, LX = null;
  function lightmap() {
    if (!LM) { LM = O.makeCanvas(W, H); LX = LM.getContext('2d'); LX.imageSmoothingEnabled = false; }
    LX.globalAlpha = 1;
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
  // Alpha mask of everything in front of the parallax background: level tiles, decor and entities.
  // Lets the night grade act on the (day-painted) world without dulling the authored sky.
  function worldMask(game, key, withHero) {
    const s = scratch(key || 'mask'), m = s.x, lvl = game.lvl, cam = game.cam;
    m.clearRect(0, 0, W, H);
    const sh = shakeOf(game);
    m.setTransform(1, 0, 0, 1, sh[0], sh[1]);
    const lv = lvl.canvas, fr = lvl.front, vh = Math.min(H - VY, lv ? lv.height : H - VY);
    if (lv) { m.drawImage(lv, cam, 0, W, vh, 0, VY, W, vh); m.drawImage(lv, cam, 0, W, VY, 0, 0, W, VY); }
    if (fr) m.drawImage(fr, cam, 0, W, vh, 0, VY, W, vh);
    const each = (arr) => (arr || []).forEach((e) => { try { e.draw(m, game); } catch (err) { /* mask only */ } });
    each(game.npcs); each(game.enemies);
    if (withHero) {
      each(game.pickups);
      if (game.player && game.state !== 'dying' && game.state !== 'itemget') { try { game.player.draw(m, game); } catch (e) { /* mask only */ } }
    }
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1;
    return s.cv;
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
    // pulls the world's day-greens toward moonlit blue-teal (hue/saturation), before the light map
    forest: [['saturation', 'rgba(90,90,140,0.55)'], ['color', 'rgba(70,72,140,0.28)']],
    cave: [['saturation', 'rgba(120,90,80,0.25)']],
    temple: [],
    village: []
  };
  // Elliptical quantised light sprite (cached). Used for the divine backlight.
  function lightSpriteE(rx, ry, col, steps, pw) {
    const k = 'E' + rx + ':' + ry + ':' + col.join(',') + ':' + steps + ':' + pw;
    if (LC[k]) return LC[k];
    const cv = O.makeCanvas(rx * 2 + 1, ry * 2 + 1), g = cv.getContext('2d');
    const img = g.createImageData(cv.width, cv.height), d = img.data;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const dd = Math.hypot((x - rx) / rx, (y - ry) / ry);
      if (dd >= 1) continue;
      const q = Math.floor(Math.pow(1 - dd, pw) * steps + bay(x, y) * 0.999) / steps;
      if (q <= 0) continue;
      const i = (y * cv.width + x) * 4;
      d[i] = col[0] * q; d[i + 1] = col[1] * q; d[i + 2] = col[2] * q; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return (LC[k] = cv);
  }
  // Two-band flame bloom: hot orange core ring fading to a deep red outer band (additive).
  function flameBloom(r) {
    return cached('fb:' + r, () => {
      const S = r * 2 + 1, b = new Buf(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - r, y - r) / r;
        if (d >= 1) continue;
        const I = Math.pow(1 - d, 1.7);
        const q = Math.floor(I * 4 + bay(x, y) * 0.999);
        if (q >= 3) b.set(x, y, [120, 74, 28]);
        else if (q === 2) b.set(x, y, [74, 34, 12]);
        else if (q === 1) b.set(x, y, [34, 12, 6]);
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
  function playerPos(game) {
    const p = game.player;
    return { x: Math.round(p.x + p.w / 2 - game.cam), y: Math.round(p.y + p.h / 2 + VY) };
  }
  function windowRect(game) {
    const d = (game.lvl.def.decor || []).find((q) => q[0] === 'window');
    if (!d) return null;
    let w = 34, h = 50;
    try { const im = O.Tiles.decor('window', d[4]); if (im) { w = im.w; h = im.h; } } catch (e) { /* default */ }
    const x = Math.round(d[1] * T + 8 - w / 2 - game.cam), y = d[2] * T - h + 1 + VY;
    return { x, y, w, h };
  }
  // Gods on screen, with the exact frame the engine drew this tick (so we can mask their silhouettes).
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
      [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach((o) => O.drawA(m, gd.name, gd.x + o[0] + sh[0], gd.feet + o[1] + sh[1], gd.flip));
    });
    a.globalCompositeOperation = 'destination-out';
    a.globalAlpha = strength;
    a.drawImage(s.cv, 0, 0);
    a.globalAlpha = 1;
    a.globalCompositeOperation = 'lighter';
  }
  // Fx/amb that emit light (sparks, hit stars, fireflies, embers).
  function particleLights(g, game, scale) {
    const cam = game.cam;
    (game.fx || []).forEach((f) => {
      if (f.type === 'spark' && f.t < 8) drawLight(g, 20, [255, 210, 140].map((v) => v * scale), f.x - cam, f.y + VY, 4, 1.4);
      else if (f.type === 'star' && f.t < 16) drawLight(g, 10, [255, 220, 120].map((v) => v * scale * 0.7), f.x - cam, f.y + VY, 3, 1.3);
    });
    (game.amb || []).forEach((p) => {
      if (p.k === 'fly') {
        const on = flyOn(p);
        if (on > 0) drawLight(g, 22, [Math.round(150 * on * scale), Math.round(230 * on * scale), Math.round(90 * on * scale)], p.x - cam, p.y + VY, 4, 1.6);
      } else if (p.k === 'ember' && p.t < 50) drawLight(g, 9, [200 * scale, 110 * scale, 40 * scale], p.x - cam, p.y + VY, 3, 1.3);
    });
  }
  // Faint cool readability pool on enemies, so silhouettes never vanish into the dark between lights.
  function enemyLights(g, game, col, r) {
    (game.enemies || []).forEach((e) => {
      if (e.dying) return;
      drawLight(g, r, col, Math.round(e.x + e.w / 2 - game.cam), Math.round(e.y + e.h / 2 + VY), 3, 1.2);
    });
  }
  function flyOn(p) { const ph = (p.t + ((p.x * 7) | 0)) % 150; return ph < 90 ? Math.min(1, ph / 12, (90 - ph) / 20) : 0; }
  function tileDraw(c, cv, off, y) { c.drawImage(cv, -off, y); if (cv.width - off < W) c.drawImage(cv, cv.width - off, y); }

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
      c.drawImage(cached('sunbloom2', () => { const b = new Buf(W, H); halo(b, SUN[0], SUN[1], 150, '#2e230c', 1, 5, 1.8); return b.canvas(); }), 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.drawImage(vignette('#2a1f3c', 0.3, 0.72, 'village'), 0, 0);
    },
    forest(c, game, t) {
      // 1) night grade of the day-painted world only (the parallax sky is authored at night already)
      // (the hero and pickups keep their colour: they are the focal points, lit by Orpheus' own warm pool)
      gradeOps(c, GRADE.forest, worldMask(game, 'mask', false));
      const mask = worldMask(game, 'maskH', true);
      // 2) light map: authored ambient for the backdrop, a darker moonlit ambient for the world
      const g = lightmap();
      g.globalCompositeOperation = 'source-over';
      g.drawImage(cached('amb:forest', () => vgrad([[0, '#b8aee6'], [80, '#9088cc'], [150, '#7671b8'], [216, '#605ea6']])), 0, 0);
      const s = scratch('ambw');
      s.x.drawImage(cached('amb:forestW', () => vgrad([[0, '#a298dc'], [70, '#8a82c8'], [140, '#6660a8'], [216, '#4c4890']])), 0, 0);
      s.x.globalCompositeOperation = 'destination-in';
      s.x.drawImage(mask, 0, 0);
      g.drawImage(s.cv, 0, 0);
      g.globalCompositeOperation = 'lighter';
      drawLight(g, 120, [40, 38, 80], FOR.moon[0], FOR.moon[1], 5, 1.4); // moonlight pooling from the upper-left
      const pp = playerPos(game);
      drawLight(g, 56, [170, 150, 115], pp.x, pp.y + 2, 4, 1.15); // Orpheus' lyre-warm pool: tight and readable
      enemyLights(g, game, [40, 40, 64], 30);
      particleLights(g, game, 1);
      c.globalCompositeOperation = 'multiply';
      c.drawImage(LM, 0, 0);
      // moon shafts
      c.globalCompositeOperation = 'lighter';
      const sh = shafts(LW, H, 4, '#6e70c8', 0.2, 21, 0.7, 'forest');
      const off = ((Math.floor(game.cam * 0.2 + t * 0.05) % LW) + LW) % LW;
      c.globalAlpha = 0.55 + Math.sin(t * 0.01) * 0.25;
      tileDraw(c, sh, off, 0);
      c.globalAlpha = 1;
      // low drifting ground fog, in front of everything
      c.globalCompositeOperation = 'source-over';
      const fog = fogBand(44, '#7c78c0', 0.4, 71, 'forest');
      tileDraw(c, fog, ((Math.floor(game.cam * 1.15 + t * 0.12) % LW) + LW) % LW, 168);
      const fog2 = fogBand(30, '#a48cc8', 0.2, 73, 'forest2');
      tileDraw(c, fog2, ((Math.floor(game.cam * 0.9 - t * 0.07) % LW) + LW) % LW, 150);
      c.drawImage(vignette('#0c0a1e', 0.6, 0.55, 'forest'), 0, 0);
    },
    cave(c, game, t) {
      gradeOps(c, GRADE.cave, null);
      const g = lightmap();
      g.globalCompositeOperation = 'source-over';
      g.drawImage(cached('amb:cave2', () => vgrad([[0, '#1e1630'], [100, '#2e2238'], [170, '#312438'], [216, '#221828']])), 0, 0);
      g.globalCompositeOperation = 'lighter';
      const src = sources(game);
      src.forEach((s) => {
        if (s.type === 'torch') {
          const f = flick(t, s.i, 1);
          drawLight(g, 84 + f * 2, [255, 150, 80], s.x, s.y - 10, 5, 1.5);   // pool with a steep falloff
          drawLight(g, 18 + f, [255, 200, 120], s.x, s.y - 11, 3, 1.1);      // hot core
        } else if (s.type === 'crystal') {
          const p = Math.round(Math.sin(t * 0.04 + s.i) * 2);
          drawLight(g, 50 + p, [70, 200, 235], s.x, s.y - 8, 5, 1.35);
        } else if (s.type === 'brazier') drawLight(g, 84 + flick(t, s.i, 2) * 2, [255, 160, 85], s.x, s.y - 30, 5, 1.5);
      });
      const pp = playerPos(game);
      drawLight(g, 50, [150, 118, 92], pp.x, pp.y + 2, 4, 1.2);
      enemyLights(g, game, [64, 50, 58], 42);
      particleLights(g, game, 1);
      c.globalCompositeOperation = 'multiply';
      c.drawImage(LM, 0, 0);
      // hot blooms around flames and a cold one around crystals
      c.globalCompositeOperation = 'lighter';
      src.forEach((s) => {
        if (s.type === 'torch') { const fb = flameBloom(30); const f = flick(t, s.i, 1); c.globalAlpha = 0.85 + f * 0.08; c.drawImage(fb, s.x - 30, s.y - 12 - 30); c.globalAlpha = 1; }
        else if (s.type === 'crystal') drawLight(c, 22, [16, 60, 80], s.x, s.y - 8, 3, 1.3);
      });
      // dust motes drifting in the torchlight
      src.forEach((s) => {
        if (s.type !== 'torch') return;
        for (let k = 0; k < 10; k++) {
          const a = k * 2.4 + s.i, rr = 12 + ((k * 37) % 34);
          const x = s.x + Math.cos(a + t * 0.004 * (1 + (k % 3))) * rr, y = s.y + Math.sin(a * 1.7 + t * 0.006) * rr * 0.7 - ((t * 0.08 + k * 11) % 20);
          c.fillStyle = k % 3 ? 'rgb(150,78,34)' : 'rgb(255,190,110)';
          c.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      });
      c.globalCompositeOperation = 'source-over';
      const fog = fogBand(40, '#4a2630', 0.3, 81, 'cave');
      tileDraw(c, fog, ((Math.floor(t * 0.1) % LW) + LW) % LW, 172);
      c.drawImage(vignette('#08040a', 0.8, 0.45, 'cave'), 0, 0);
      c.globalCompositeOperation = 'soft-light';
      c.fillStyle = 'rgba(255,160,100,0.14)'; c.fillRect(0, 0, W, H);
    },
    temple(c, game, t) {
      const hermes = game.lvl.id === 'hermes';
      const g = lightmap();
      g.globalCompositeOperation = 'source-over';
      g.drawImage(cached('amb:temple2', () => vgrad([[0, '#463c70'], [70, '#5e508a'], [150, '#72649a'], [216, '#685a90']])), 0, 0);
      g.globalCompositeOperation = 'lighter';
      const src = sources(game);
      src.forEach((s) => {
        if (s.type === 'brazier') drawLight(g, 112 + flick(t, s.i, 2) * 2, [255, 180, 105], s.x, s.y - 28, 6, 1.25);
        else if (s.type === 'torch') drawLight(g, 84 + flick(t, s.i, 2) * 2, [255, 170, 95], s.x, s.y - 10, 6, 1.35);
      });
      const gl = gods(game);
      const gcol = hermes ? [140, 200, 235] : [235, 205, 130];
      // the god's pool lives in the multiply map: it can only reveal the sprite's own colours, never wash them out
      gl.forEach((gd) => drawLight(g, 96, gcol, gd.x, gd.cy, 6, 1.2));
      const wr = windowRect(game);
      if (wr) {
        drawLight(g, 60, hermes ? [80, 110, 140] : [90, 90, 130], wr.x + wr.w / 2, wr.y + wr.h / 2, 5, 1.4);
        g.drawImage(cached('floorpool', () => { const b = new Buf(96, 24); for (let y = 0; y < 24; y++) for (let x = 0; x < 96; x++) { const dx = (x - 48) / 48, dy = (y - 12) / 12, d = Math.sqrt(dx * dx + dy * dy); if (d < 1) { const q = Math.floor((1 - d) * 4 + bay(x, y) * 0.999) / 4; if (q > 0) b.set(x, y, [60 * q, 60 * q, 90 * q]); } } return b.canvas(); }), Math.round(wr.x + wr.w / 2 + 20 - 48), 176 + VY - 12);
      }
      const pp = playerPos(game);
      drawLight(g, 48, [80, 68, 56], pp.x, pp.y, 4, 1.3);
      particleLights(g, game, 1);
      c.globalCompositeOperation = 'multiply';
      c.drawImage(LM, 0, 0);

      // additive layer — composed off-screen so gods can be masked out of it
      const A = scratch('add'), a = A.x;
      a.clearRect(0, 0, W, H);
      a.globalCompositeOperation = 'lighter';
      // divine backlight: a soft elliptical aura *behind* the god (masked by the silhouette below)
      gl.forEach((gd) => {
        const p = Math.round(Math.sin(t * 0.05) * 1.5);
        const au = lightSpriteE(30 + p, 38 + p, hermes ? [26, 56, 76] : [66, 52, 20], 3, 1.1);
        a.drawImage(au, gd.x - (au.width >> 1), gd.cy - 2 - (au.height >> 1));
      });
      src.forEach((s) => { if (s.type === 'brazier') { const fb = flameBloom(28); a.globalAlpha = 0.7; a.drawImage(fb, s.x - 28, s.y - 32 - 28); a.globalAlpha = 1; } });
      cutGods(a, gl, game, 1);
      // god rays through the window (drawn after the first cut so only 30% of a ray may touch a god)
      if (wr) {
        const rays = cached('rays:' + (hermes ? 'h' : 'z'), () => {
          const w = 150, h = 190, b = new Buf(w, h), col = hermes ? [150, 190, 230] : [255, 226, 160];
          const beams = [[-9, 3.5, 0.9], [-2, 2.5, 1], [5, 3.5, 0.8], [11, 2, 0.6], [0, 11, 0.35]];
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            let I = 0;
            beams.forEach((bm) => { const cx = 30 + bm[0] + y * 0.36 + bm[0] * y * 0.012, dd = Math.abs(x - cx) / (bm[1] + y * 0.07); if (dd < 1) I = Math.max(I, (1 - dd) * bm[2]); });
            I *= clamp(1 - y / h, 0, 1) * clamp(y / 8, 0, 1);
            const q = Math.floor(I * 4 + bay(x, y) * 0.999) / 4;
            if (q > 0) b.set(x, y, col.map((v) => v * q * 0.3), 1);
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
      c.globalCompositeOperation = 'soft-light';
      c.fillStyle = hermes ? 'rgba(150,215,255,0.12)' : 'rgba(255,200,120,0.12)'; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      c.drawImage(vignette('#140c22', 0.6, 0.55, 'temple'), 0, 0);
    }
  };

  // Pre-builds the cached light sprites of a theme by running it once on a scratch canvas.
  function warm(theme) {
    const cv = O.makeCanvas(W, H), c = cv.getContext('2d');
    const fake = { cam: 0, t: 0, npcs: [], fx: [], amb: [], enemies: [], pickups: [], state: 'play', player: { x: 100, y: 100, w: 12, h: 34, draw() {} },
      lvl: { theme, id: '', canvas: null, front: null, def: { lights: [], decor: theme === 'temple' ? [['window', 11.5, 7, 'back', 1]] : [] } } };
    (THEME_LIGHT[theme] || THEME_LIGHT.temple)(c, fake, 0);
  }

  O.Light = {
    apply(ctx, game) {
      if (!game || !game.lvl) return;
      const th = game.lvl.theme, fn = THEME_LIGHT[th] || THEME_LIGHT.temple;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // screen-shake must not expose unlit edges
      ctx.imageSmoothingEnabled = false;
      fn(ctx, game, game.t || 0);
      ctx.restore();
    },
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
  function starShape(g, x, y, t) {
    const big = t < 10, c1 = t < 14 ? '#fffbe0' : '#ffd24a', c2 = t < 14 ? '#ffd24a' : '#c67a1c';
    const diag = (t >> 2) & 1;
    g.fillStyle = c2;
    if (big) {
      if (diag) { g.fillRect(x - 1, y - 1, 1, 1); g.fillRect(x + 1, y - 1, 1, 1); g.fillRect(x - 1, y + 1, 1, 1); g.fillRect(x + 1, y + 1, 1, 1); }
      else { g.fillRect(x - 2, y, 5, 1); g.fillRect(x, y - 2, 1, 5); }
    } else { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    g.fillStyle = c1; g.fillRect(x, y, 1, 1);
  }

  O.FXDraw = function (c, f, x, y, game) {
    if (f.type === 'puff') { const fr = puffFrames(); const s = fr[Math.min(fr.length - 1, f.t)]; c.drawImage(s, x - 18, y - 18); return true; }
    if (f.type === 'spark') {
      const fr = sparkFrames(); const s = fr[Math.min(fr.length - 1, f.t)];
      // glow shrinks and fades with age (and is halved on the bright village sky)
      const gr = f.t <= 2 ? 14 : f.t <= 5 ? 10 : f.t <= 8 ? 6 : 0;
      if (gr) {
        const th = game && game.lvl ? game.lvl.theme : (O.game && O.game.lvl ? O.game.lvl.theme : '');
        const k = (1 - f.t / 10) * (th === 'village' ? 0.5 : 1);
        const col = [Math.round(120 * k / 8) * 8, Math.round(90 * k / 8) * 8, Math.round(40 * k / 8) * 8];
        c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(lightSprite(gr, col, 3, 1.4), x - gr, y - gr); c.restore();
      }
      c.drawImage(s, x - 17, y - 17); return true;
    }
    if (f.type === 'dust') { const fr = dustFrames(); c.drawImage(fr[Math.min(fr.length - 1, f.t)], x - 7, y - 7); return true; }
    if (f.type === 'star') { starShape(c, x, y, f.t); return true; }
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
    background('village'); // warm the title-screen background now, the rest in idle time
    warm('village');
    if (typeof setTimeout === 'function') ['forest', 'temple', 'cave'].forEach((th, i) => setTimeout(() => { try { background(th); warm(th); } catch (e) { O.logOnce('sky.warm', e); } }, 400 + i * 350));
  });
})(window.OLY);
