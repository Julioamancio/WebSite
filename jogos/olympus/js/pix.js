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
