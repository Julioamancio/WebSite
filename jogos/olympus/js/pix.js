/* pix.js — tiny pixel-art painter: grids of colors, shaded shapes, dithering, outlines */
(function (O) {
  'use strict';

  const RGB = {};
  function rgb(hex) {
    if (RGB[hex]) return RGB[hex];
    const n = parseInt(hex.slice(1), 16);
    RGB[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return RGB[hex];
  }
  // 4x4 Bayer matrix for ordered dithering (values 0..15).
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  O.bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;

  class Pix {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
    in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get(x, y) { return this.in(x, y) ? this.d[y * this.w + x] : null; }
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (this.in(x, y)) this.d[y * this.w + x] = c; }
    rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); return this; }
    // Fill with ordered dither between two colors; t = amount of c2 (0..1).
    ditherRect(x, y, w, h, c1, c2, t) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, O.bayer(i, j) < t ? c2 : c1);
      return this;
    }
    ellipse(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.set(x, y, c);
        }
      }
      return this;
    }
    // Shaded sphere/ellipse. ramp = [light, base, dark, (highlight)]. Light comes from the upper-left.
    ball(cx, cy, rx, ry, ramp, lx, ly) {
      const Lx = lx === undefined ? -0.6 : lx, Ly = ly === undefined ? -0.8 : ly;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          const d = dx * dx + dy * dy;
          if (d > 1) continue;
          const n = dx * Lx + dy * Ly + (1 - d) * 0.25;
          const b = O.bayer(x, y);
          let c = ramp[1];
          if (ramp[3] && n > 0.75) c = ramp[3];
          else if (n > 0.45 || (n > 0.3 && b < 0.5)) c = ramp[0];
          else if (n < -0.35 || (n < -0.2 && b < 0.5)) c = ramp[2];
          this.set(x, y, c);
        }
      }
      return this;
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.set(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return this;
    }
    // Thick line (brush of radius r).
    stroke(x0, y0, x1, y1, r, c) {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        this.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, c);
      }
      return this;
    }
    // Adds a 1px outline around every filled region (4-neighbourhood).
    outline(c) {
      const add = [];
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          if (this.get(x, y) !== null) continue;
          if (this.get(x - 1, y) !== null || this.get(x + 1, y) !== null || this.get(x, y - 1) !== null || this.get(x, y + 1) !== null) add.push(x, y);
        }
      }
      for (let i = 0; i < add.length; i += 2) this.set(add[i], add[i + 1], c || '#000000');
      return this;
    }
    // Paint another Pix on top (null pixels are transparent).
    blit(src, ox, oy) {
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.d[y * src.w + x]; if (c) this.set(ox + x, oy + y, c); }
      return this;
    }
    canvas() {
      const cv = O.makeCanvas(this.w, this.h);
      const g = cv.getContext('2d');
      const img = g.createImageData(this.w, this.h);
      for (let i = 0; i < this.d.length; i++) {
        const c = this.d[i];
        if (!c) continue;
        const v = rgb(c);
        img.data[i * 4] = v[0]; img.data[i * 4 + 1] = v[1]; img.data[i * 4 + 2] = v[2]; img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return cv;
    }
  }
  O.Pix = Pix;

  // Horizontal color bands with dithered seams (classic 8-bit sky gradient).
  O.bands = function (p, x, y, w, h, colors) {
    const n = colors.length;
    for (let j = 0; j < h; j++) {
      const f = (j / h) * n;
      const i = Math.min(n - 1, Math.floor(f));
      const t = f - i;
      const next = colors[Math.min(n - 1, i + 1)];
      for (let k = 0; k < w; k++) {
        const b = O.bayer(x + k, y + j);
        p.set(x + k, y + j, t > 0.6 && b < (t - 0.6) * 2.5 ? next : colors[i]);
      }
    }
  };
})(window.OLY);

/* ---------- colour helpers, master palette and modern drawing helpers ---------- */
(function (O) {
  'use strict';
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  O.hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  O.rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  O.mix = (a, b, t) => { const A = O.hexToRgb(a), B = O.hexToRgb(b); return O.rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  function toHsl(hex) {
    const [r, g, b] = O.hexToRgb(hex).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp01(s); l = clamp01(l);
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return O.rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  O.toHsl = toHsl; O.fromHsl = fromHsl;
  // Hue-shift towards warm yellow when lightening, towards cool violet when darkening.
  function towards(h, target, amt) { let d = ((target - h + 540) % 360) - 180; return h + d * amt; }
  O.shift = function (hex, amt) {
    const [h, s, l] = toHsl(hex);
    if (amt >= 0) return fromHsl(towards(h, 55, amt * 0.35), s * (1 - amt * 0.15), l + (1 - l) * amt * 0.85);
    const a = -amt;
    return fromHsl(towards(h, 255, a * 0.35), Math.min(1, s * (1 + a * 0.25)), l * (1 - a * 0.8));
  };
  // Ramp of n tones, index 0 = brightest highlight, n-1 = deepest shadow, base colour in the middle.
  O.makeRamp = function (base, n, spread) {
    const N = n || 5, sp = spread || 0.7, mid = (N - 1) / 2, out = [];
    for (let i = 0; i < N; i++) out.push(i === Math.round(mid) ? base : O.shift(base, ((mid - i) / mid) * sp));
    return out;
  };

  // Master palette shared by every art module (5 tones, light -> dark). Pick from here for cohesion.
  O.PAL5 = {
    outline: '#1b1426',      // universal dark outline (deep plum, never pure black)
    skin: ['#ffe6c7', '#f7c08c', '#e0925f', '#b0613f', '#6e3528'],
    skinPale: ['#fff4ea', '#eed6d0', '#c9aab8', '#8d7497', '#554466'],
    hairAuburn: ['#f0a060', '#c8642e', '#94401e', '#662616', '#3a1410'],
    hairGold: ['#fff2a8', '#f6cf57', '#d49a2a', '#9c6118', '#5c3212'],
    hairWhite: ['#ffffff', '#e6e8f2', '#b9bdd6', '#8488ad', '#51557a'],
    hairDark: ['#6a5a86', '#44385e', '#2c2442', '#1d182d', '#120e1c'],
    cloth: ['#ffffff', '#eceaf4', '#c6c3db', '#908cb3', '#5c587f'],
    red: ['#ff9b7a', '#f0503a', '#bf2a2e', '#801b2c', '#4a1026'],
    gold: ['#fff7b0', '#ffd24a', '#e39b1d', '#a8621b', '#633416'],
    bronze: ['#ffd9a0', '#dca05a', '#a86a36', '#6e4128', '#3d2419'],
    leather: ['#e2a870', '#b47444', '#83502e', '#553222', '#2f1c17'],
    wood: ['#d8a878', '#a87650', '#7a5238', '#4f3427', '#2c1d1a'],
    sky: ['#e6f6ff', '#9fd8ff', '#5aa8f0', '#3470c8', '#20468f'],
    blue: ['#b8e6ff', '#5fb4ff', '#2f78e6', '#2446a8', '#18285e'],
    teal: ['#b6ffe6', '#4fe0c4', '#1ea5a0', '#146c78', '#0e3b4c'],
    purple: ['#e2c8ff', '#a878f0', '#7042c6', '#46268e', '#261552'],
    night: ['#8f84d6', '#5b4fa6', '#3b3278', '#241f4c', '#15122c'],
    green: ['#d8ff8a', '#8fdc4c', '#4ea83a', '#2c6e34', '#173f2a'],
    foliage: ['#b9f07a', '#6cc04a', '#3b8a3e', '#22573a', '#132f28'],
    olive: ['#d7e8a4', '#a2bf6c', '#6e9150', '#46643e', '#27392b'],
    stone: ['#f0eee8', '#c6c0bb', '#958d8e', '#64606c', '#3a3845'],
    marble: ['#ffffff', '#f1eef5', '#d5d0e2', '#a8a1c0', '#6f6a8e'],
    rock: ['#e6b88c', '#b8845e', '#865a44', '#583a33', '#312024'],
    dirt: ['#e7b27a', '#bb7c4c', '#8a5236', '#5a3326', '#321c1a'],
    terracotta: ['#ffb58a', '#f07a45', '#c24c2f', '#83302a', '#4a1b1f'],
    fire: ['#ffffe0', '#fff176', '#ffb52b', '#f5622a', '#b42c2c'],
    crystal: ['#eaffff', '#8ff6ff', '#38c8e8', '#2a7fc0', '#1f4480']
  };

  const P = O.Pix.prototype;
  // "Sel-out" outline: silhouette pixels get the outline colour, but where an outline pixel
  // touches a light area it is softened towards that area's darkest tone (modern style).
  P.selout = function (outer, soft) {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== null) continue;
        const n = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)].filter(Boolean);
        if (!n.length) continue;
        let c = outer || O.PAL5.outline;
        if (soft && y > 0 && this.get(x, y + 1) && !this.get(x, y - 1)) c = O.mix(c, n[0], 0.25);
        add.push(x, y, c);
      }
    }
    for (let i = 0; i < add.length; i += 3) this.set(add[i], add[i + 1], add[i + 2]);
    return this;
  };
  // Filled polygon (even-odd scanline).
  P.poly = function (pts, c) {
    let y0 = Infinity, y1 = -Infinity;
    pts.forEach((p) => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) xs.push(a[0] + ((y + 0.5 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
    }
    return this;
  };
  // Limb / capsule from (x0,y0) radius r0 to (x1,y1) radius r1, cylinder-shaded with a 5-tone ramp.
  // Light comes from the upper-left by default.
  P.capsule = function (x0, y0, x1, y1, r0, r1, ramp, lx, ly) {
    const Lx = lx === undefined ? -0.6 : lx, Ly = ly === undefined ? -0.8 : ly;
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1;
    const minX = Math.floor(Math.min(x0 - r0, x1 - r1)), maxX = Math.ceil(Math.max(x0 + r0, x1 + r1));
    const minY = Math.floor(Math.min(y0 - r0, y1 - r1)), maxY = Math.ceil(Math.max(y0 + r0, y1 + r1));
    const n = ramp.length;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        let t = ((px - x0) * dx + (py - y0) * dy) / len2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const cx = x0 + dx * t, cy = y0 + dy * t, r = r0 + (r1 - r0) * t;
        const ox = px - cx, oy = py - cy, d = Math.hypot(ox, oy);
        if (d > r) continue;
        const nd = d / (r || 1), dot = r ? (ox * Lx + oy * Ly) / r : 0;
        const v = dot * 0.8 + (1 - nd) * 0.35;
        const b = O.bayer(x, y) * 0.12;
        let i = Math.round((1 - (v + 0.6) / 1.4) * (n - 1) + b);
        i = i < 0 ? 0 : i > n - 1 ? n - 1 : i;
        this.set(x, y, ramp[Math.min(n - 1, Math.max(0, i))]);
      }
    }
    return this;
  };
  // Shaded ellipse with an n-tone ramp (generalised ball()).
  P.orb = function (cx, cy, rx, ry, ramp, lx, ly) {
    const Lx = lx === undefined ? -0.6 : lx, Ly = ly === undefined ? -0.8 : ly, n = ramp.length;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1) continue;
        const v = dx * Lx + dy * Ly + (1 - d) * 0.4;
        let i = Math.round((1 - (v + 0.7) / 1.6) * (n - 1) + O.bayer(x, y) * 0.3 - 0.15);
        i = i < 0 ? 0 : i > n - 1 ? n - 1 : i;
        this.set(x, y, ramp[i]);
      }
    }
    return this;
  };
})(window.OLY);
