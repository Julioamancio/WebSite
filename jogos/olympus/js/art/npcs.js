/* art/npcs.js — NPCs, gods and dialogue portraits (modern pixel art).
   Everything is rendered through a tiny "G-buffer" painter: each part stores a material (5-tone
   hue-shifted ramp) and a light value computed from a surface normal (light from the upper-left).
   The resolver quantises to clean clusters, adds cast shadows and internal edges between parts,
   a cool rim light on the back edge and a coloured sel-out outline. Faces use hand-placed stamps. */
(function (O) {
  'use strict';
  const OUT = (O.PAL5 && O.PAL5.outline) || '#1b1426';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const LX = -0.55, LY = -0.68, LZ = 0.48;
  const lit = (nx, ny, nz) => clamp((nx * LX + ny * LY + nz * LZ + 0.32) / 1.32, 0, 1);
  const TH = [0.86, 0.58, 0.36, 0.16];

  /* ---------------- ramps (0 = highlight .. 4 = deepest shadow) ---------------- */
  const R = {
    skin: ['#ffe8cf', '#f5c396', '#dc9467', '#a9604a', '#633441'],
    skinF: ['#fff0e2', '#f8d0b0', '#e2a283', '#b06d63', '#6a3a4c'],
    skinOld: ['#fbe6d2', '#eabf9b', '#c98f70', '#915f5a', '#533647'],
    skinGod: ['#fff3d8', '#f8d2a0', '#e0a270', '#aa6a52', '#633a44'],
    skinHades: ['#f1ecfb', '#cbc3e4', '#9c90c4', '#6a5d98', '#3a3163'],
    ghost: ['#ffffff', '#d4fbff', '#8fe4f6', '#4fa6d6', '#2d5c9c'],
    auburn: ['#f6ad6c', '#cf6c34', '#9a4422', '#66261c', '#381419'],
    gold: ['#fff8c4', '#ffd75a', '#e49e22', '#a9621d', '#5f3418'],
    blond: ['#fff6c2', '#f8d56e', '#dca23a', '#a36a28', '#5e3a22'],
    white: ['#ffffff', '#e9ebf6', '#bcc0da', '#8488b0', '#4e5178'],
    darkHair: ['#7c607e', '#533b5a', '#36263f', '#22182b', '#130d19'],
    chestnut: ['#d39868', '#9c603e', '#6c3c2e', '#452429', '#25141a'],
    honey: ['#f6c67a', '#cf8b40', '#9a5a2c', '#643722', '#361c18'],
    cloth: ['#ffffff', '#efebf6', '#cbc5de', '#948cb8', '#5d5784'],
    wool: ['#dcaa76', '#ab7249', '#7d4e37', '#533037', '#2e1b27'],
    sky: ['#eafaff', '#abddfa', '#6caee6', '#4776bc', '#2b4381'],
    pink: ['#ffe6f0', '#f9acc9', '#e0709e', '#a4467c', '#5d2656'],
    red: ['#ff9f7d', '#f0513b', '#bf2a30', '#7e1b31', '#461027'],
    violet: ['#8a74b8', '#5a4688', '#3a2c62', '#241b42', '#140f28'],
    iron: ['#b6b4c8', '#7e7c98', '#54526e', '#34324a', '#1c1a2c'],
    wood: ['#dcae7e', '#a87650', '#7a5038', '#4e3129', '#2b1b1c'],
    leather: ['#e2a870', '#b47444', '#83502e', '#553222', '#2f1c17'],
    clay: ['#ffb88c', '#ec7a48', '#bb4a30', '#7e2e2c', '#461a22'],
    leaf: ['#e2f59a', '#9ccf5a', '#5d9b44', '#35663c', '#1c3a2c'],
    flameG: ['#ffffff', '#b8f6ff', '#6cc4ff', '#7a62f0', '#44309e'],
    bolt: ['#ffffff', '#fffbd0', '#ffe25a', '#ffaa2a', '#d8621c'],
    lip: ['#ffc3b0', '#ea8d80', '#c45e62', '#8e3a4c', '#56223a'],
    silver: ['#ffffff', '#dfe6f2', '#a9b2cc', '#6f7699', '#3e4466']
  };
  O.NPC_RAMPS = R;

  /* ---------------- G-buffer painter ---------------- */
  const FIXM = { r: ['#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff'] };
  class G {
    constructor(w, h) {
      this.w = w; this.h = h;
      const n = w * h;
      this.m = new Array(n).fill(null); this.v = new Float32Array(n); this.p = new Int16Array(n).fill(-1);
      this.fc = new Array(n).fill(null); this.dk = new Int8Array(n);
      this.parts = []; this.part();
    }
    // Start a new part. edge: darken own pixels touching parts behind; cast: shadow thrown down-right
    // onto parts behind; rim: cool rim light on the right edge; bias: added to the light value.
    part(o) {
      this.parts.push(Object.assign({ edge: 0, cast: 0, castLen: 1, rim: true, bias: 0, grp: null, noOut: false, th: TH }, o || {}));
      this.cur = this.parts.length - 1; return this;
    }
    i(x, y) { x = Math.floor(x); y = Math.floor(y); return x >= 0 && y >= 0 && x < this.w && y < this.h ? y * this.w + x : -1; }
    put(x, y, m, v) { const i = this.i(x, y); if (i < 0) return; this.m[i] = m; this.v[i] = v; this.p[i] = this.cur; this.fc[i] = null; this.dk[i] = 0; }
    fix(x, y, c) { const i = this.i(x, y); if (i < 0 || !c) return; this.fc[i] = c; if (!this.m[i]) this.m[i] = FIXM; this.p[i] = this.cur; }
    tone(x, y, m, t) { this.fix(x, y, m.r[clamp(t, 0, m.r.length - 1)]); }
    has(x, y) { const i = this.i(x, y); return i >= 0 && this.m[i] !== null; }
    matAt(x, y) { const i = this.i(x, y); return i >= 0 ? this.m[i] : null; }
    del(x, y) { const i = this.i(x, y); if (i >= 0) { this.m[i] = null; this.fc[i] = null; this.p[i] = -1; } }
    // Adjust light value of existing pixels (only where mask matches, optional material filter).
    shade(x, y, dv, mat) { const i = this.i(x, y); if (i < 0 || !this.m[i] || this.fc[i]) return; if (mat && this.m[i] !== mat) return; this.v[i] = clamp(this.v[i] + dv, 0, 1); }
    darken(x, y, k) { const i = this.i(x, y); if (i < 0 || !this.m[i]) return; this.dk[i] = clamp(this.dk[i] + k, -4, 4); }

    /* ---- primitives ---- */
    ell(cx, cy, rx, ry, m, o) {
      o = o || {};
      const add = o.add || 0, flat = o.flat;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;
          if (o.clip && !o.clip(x, y)) continue;
          const v = flat !== undefined ? flat : lit(dx * (o.sx || 1), dy * (o.sy || 1), Math.sqrt(1 - d2));
          this.put(x, y, m, clamp(v + add, 0, 1));
        }
      }
      return this;
    }
    cap(x0, y0, x1, y1, r0, r1, m, o) {
      o = o || {};
      const add = o.add || 0;
      const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
      const X0 = Math.floor(Math.min(x0 - r0, x1 - r1)) - 1, X1 = Math.ceil(Math.max(x0 + r0, x1 + r1)) + 1;
      const Y0 = Math.floor(Math.min(y0 - r0, y1 - r1)) - 1, Y1 = Math.ceil(Math.max(y0 + r0, y1 + r1)) + 1;
      for (let y = Y0; y <= Y1; y++) {
        for (let x = X0; x <= X1; x++) {
          const px = x + 0.5, py = y + 0.5;
          let t = ((px - x0) * dx + (py - y0) * dy) / L2; t = clamp(t, 0, 1);
          const cx = x0 + dx * t, cy = y0 + dy * t, r = r0 + (r1 - r0) * t;
          const ox = px - cx, oy = py - cy, d = Math.hypot(ox, oy);
          if (d > r) continue;
          if (o.clip && !o.clip(x, y)) continue;
          const nx = ox / (r || 1), ny = oy / (r || 1), nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const v = o.flat !== undefined ? o.flat : lit(nx, ny, nz);
          this.put(x, y, m, clamp(v + add + (o.grad ? o.grad * (0.5 - t) : 0), 0, 1));
        }
      }
      return this;
    }
    // Polygon; shading "cyl" (default: vertical cylinder across each scanline span), "flat" or a function.
    poly(pts, m, o) {
      o = o || {};
      let y0 = Infinity, y1 = -Infinity;
      pts.forEach((p) => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
        const xs = [];
        for (let k = 0; k < pts.length; k++) {
          const a = pts[k], b = pts[(k + 1) % pts.length];
          if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) xs.push(a[0] + ((y + 0.5 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const L = Math.round(xs[k]), Rr = Math.round(xs[k + 1]);
          for (let x = L; x < Rr; x++) {
            if (o.clip && !o.clip(x, y)) continue;
            let v;
            if (typeof o.shade === 'function') v = o.shade(x, y, L, Rr);
            else if (o.flat !== undefined) v = o.flat;
            else {
              let nx = Rr - L > 1 ? ((x + 0.5 - L) / (Rr - L)) * 2 - 1 : 0;
              if (o.fold) nx = clamp(nx + o.fold(x, y), -1, 1);
              const ny = o.ny !== undefined ? o.ny : -0.15;
              v = lit(nx * 0.95, ny, Math.sqrt(Math.max(0.02, 1 - nx * nx * 0.9)));
            }
            this.put(x, y, m, clamp(v + (o.add || 0) + (o.vgrad ? o.vgrad * ((y - y0) / Math.max(1, y1 - y0) - 0.5) : 0), 0, 1));
          }
        }
      }
      return this;
    }
    // Tapered curved lock (hair strand, ribbon, cloth tail). pts = control points (Catmull-Rom).
    lock(pts, r0, r1, m, o) {
      o = o || {};
      const S = [];
      const seg = pts.length - 1;
      for (let s = 0; s < seg; s++) {
        const p0 = pts[Math.max(0, s - 1)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(seg, s + 2)];
        for (let k = 0; k < 12; k++) {
          const t = k / 12, t2 = t * t, t3 = t2 * t;
          const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
          S.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
      }
      S.push(pts[seg].slice());
      const n = S.length;
      let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
      S.forEach((p) => { X0 = Math.min(X0, p[0]); X1 = Math.max(X1, p[0]); Y0 = Math.min(Y0, p[1]); Y1 = Math.max(Y1, p[1]); });
      const rm = Math.max(r0, r1) + 1;
      for (let y = Math.floor(Y0 - rm); y <= Math.ceil(Y1 + rm); y++) {
        for (let x = Math.floor(X0 - rm); x <= Math.ceil(X1 + rm); x++) {
          const px = x + 0.5, py = y + 0.5;
          let best = 1e9, bi = 0;
          for (let k = 0; k < n; k++) { const d = (S[k][0] - px) ** 2 + (S[k][1] - py) ** 2; if (d < best) { best = d; bi = k; } }
          const t = bi / (n - 1), r = r0 + (r1 - r0) * t, d = Math.sqrt(best);
          if (d > r) continue;
          if (o.clip && !o.clip(x, y)) continue;
          const a = S[Math.max(0, bi - 1)], b = S[Math.min(n - 1, bi + 1)];
          let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          // signed distance across the lock -> cylinder normal
          const side = ((px - S[bi][0]) * -ty + (py - S[bi][1]) * tx) / (r || 1);
          const nx = -ty * side, ny = tx * side, nz = Math.sqrt(Math.max(0, 1 - side * side));
          let v = o.flat !== undefined ? o.flat : lit(nx, ny, nz);
          if (o.hl && t > o.hl[0] && t < o.hl[1] && side < 0.35) v += o.hl[2] || 0.28;
          if (o.tipDark) v -= o.tipDark * t;
          if (o.rootDark) v -= o.rootDark * (1 - t);
          this.put(x, y, m, clamp(v + (o.add || 0), 0, 1));
        }
      }
      return this;
    }
    // Hand-placed pixels. legend: char -> '#hex' | [material, tone] | function(x,y)
    stamp(x0, y0, rows, lg) {
      rows.forEach((row, j) => {
        for (let k = 0; k < row.length; k++) {
          const ch = row[k];
          if (ch === '.' || ch === ' ') continue;
          const e = lg[ch];
          if (e === undefined) continue;
          if (e === null) { this.del(x0 + k, y0 + j); continue; }
          if (typeof e === 'string') this.fix(x0 + k, y0 + j, e);
          else if (typeof e === 'function') e(x0 + k, y0 + j);
          else this.tone(x0 + k, y0 + j, e[0], e[1]);
        }
      });
      return this;
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        if (typeof c === 'function') c(x0, y0); else this.fix(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return this;
    }

    /* ---- resolve to a Pix ---- */
    render(opt) {
      opt = opt || {};
      const { w, h } = this, P = this.parts;
      const out = new O.Pix(w, h);
      const dark = new Int8Array(w * h);
      const tone = new Int8Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          if (!this.m[i]) continue;
          const a = this.p[i], pa = P[a];
          let dkv = this.dk[i];
          // cast shadow from parts in front, at the upper-left
          for (let dy = -3; dy <= 0; dy++) {
            for (let dx = -3; dx <= 0; dx++) {
              if (!dx && !dy) continue;
              const j = this.i(x + dx, y + dy);
              if (j < 0 || !this.m[j]) continue;
              const b = this.p[j];
              if (b <= a) continue;
              const pb = P[b];
              if (!pb.cast || (pb.grp !== null && pb.grp === pa.grp)) continue;
              const dist = Math.max(-dx, -dy);
              if (dist > pb.castLen) continue;
              if (dx < -dist || dy < -dist) continue;
              // only straight up, left or diagonal
              if (!(dx === 0 || dy === 0 || dx === dy)) continue;
              dkv = Math.max(dkv, this.dk[i] + pb.cast);
            }
          }
          // internal edge on the front part
          if (pa.edge) {
            const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (const [dx, dy] of nb) {
              const j = this.i(x + dx, y + dy);
              if (j < 0 || !this.m[j]) continue;
              const b = this.p[j];
              if (b < a && !(pa.grp !== null && P[b].grp === pa.grp)) { dkv = Math.max(dkv, this.dk[i] + pa.edge); break; }
            }
          }
          dark[i] = dkv;
        }
      }
      for (let i = 0; i < w * h; i++) {
        const m = this.m[i];
        if (!m) continue;
        if (this.fc[i]) { out.d[i] = this.fc[i]; tone[i] = -1; continue; }
        const pa = P[this.p[i]], th = pa.th;
        const v = this.v[i] + pa.bias;
        let t = v > th[0] ? 0 : v > th[1] ? 1 : v > th[2] ? 2 : v > th[3] ? 3 : 4;
        t = clamp(t + dark[i], pa.minTone || 0, m.r.length - 1);
        tone[i] = t;
        out.d[i] = m.r[t];
      }
      // rim light: right-hand silhouette edge of parts that allow it
      if (opt.rim !== false) {
        const rc = opt.rimColor || '#bfeaff';
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (!this.m[i] || this.fc[i]) continue;
            const pa = P[this.p[i]];
            if (!pa.rim) continue;
            if (this.has(x + 1, y)) continue;
            if (!this.has(x - 1, y) || !this.has(x, y - 1)) continue;
            if (tone[i] < 2) continue;
            const m = this.m[i];
            out.d[i] = m.rim || O.mix(m.r[2], rc, opt.rimAmt || 0.42);
          }
        }
      }
      // coloured outline
      if (opt.outline !== false) {
        const add = [];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (this.has(x, y)) continue;
            let any = false, allNo = true, lightNb = null;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const j = this.i(x + dx, y + dy);
              if (j < 0 || !this.m[j]) continue;
              any = true;
              if (!P[this.p[j]].noOut) allNo = false;
              if ((dx === 1 || dy === 1) && tone[j] >= 0 && tone[j] <= 1 && this.m[j] !== FIXM) lightNb = this.m[j];
            }
            if (!any || allNo) continue;
            let c = opt.outlineColor || OUT;
            if (opt.softOutline && lightNb) c = O.mix(lightNb.r[4], c, 0.35);
            add.push(x, y, c);
          }
        }
        for (let k = 0; k < add.length; k += 3) out.set(add[k], add[k + 1], add[k + 2]);
      }
      return out;
    }
  }
  O.NPCPainter = G;

  const mat = (ramp, rim) => ({ r: ramp, rim: rim || null });
  const MAT = {};
  Object.keys(R).forEach((k) => { MAT[k] = mat(R[k]); });

  /* ---------------- portrait background ---------------- */
  // Soft dithered radial vignette (square, opaque) in the character's mood colours.
  function portraitBG(cols, cx, cy) {
    const p = new O.Pix(48, 48);
    const n = cols.length;
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        const d = Math.hypot((x + 0.5 - cx) / 30, (y + 0.5 - cy) / 28);
        const f = clamp(d, 0, 0.999) * (n - 1);
        const k = Math.floor(f), t = f - k;
        p.set(x, y, O.bayer(x, y) < t ? cols[Math.min(n - 1, k + 1)] : cols[k]);
      }
    }
    return p;
  }

  /* ================================================================
     PORTRAITS (48x48, bust facing right)
     ================================================================ */

  // Shared portrait head: cranium + jaw with face-modelling (sockets, cheek, nose, jaw shadow).
  // g: painter, h: {x,y} head centre, sk: skin material, o: options (jaw, chin, female, old)
  function portraitHead(g, h, sk, o) {
    o = o || {};
    const hx = h.x, hy = h.y;
    const rx = o.rx || 9.5, ry = o.ry || 10.5;
    const headN = (x, y) => {
      let dx = (x + 0.5 - hx) / (rx + 1), dy = (y + 0.5 - (hy + 1)) / (ry + 2.5);
      const d2 = dx * dx + dy * dy;
      if (d2 > 0.97) { const s = Math.sqrt(0.97 / d2); dx *= s; dy *= s; }
      return lit(dx, dy, Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)));
    };
    g.part({ rim: true });
    // cranium
    g.ell(hx, hy, rx, ry, sk, { flat: 0 });
    // jaw / cheek / chin polygon (3/4 view: chin forward-right)
    const j = o.jaw || [[hx - 8, hy + 2], [hx - 6, hy + 8], [hx - 1, hy + 12], [hx + 3, hy + 14], [hx + 6, hy + 14], [hx + 8.5, hy + 11], [hx + 9.5, hy + 6], [hx + 9.5, hy]];
    g.poly(j, sk, { flat: 0 });
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const i = g.i(x, y);
      if (g.m[i] === sk && g.p[i] === g.cur) g.v[i] = headN(x, y);
    }
    return headN;
  }

  /* ---------- ORPHEUS portrait ---------- */
  function portraitOrpheus() {
    const bg = portraitBG(['#8a3b3b', '#6e2c3a', '#521f36', '#3a1830', '#261126'], 26, 18);
    const g = new G(48, 48);
    const sk = MAT.skin, hr = MAT.auburn, cl = MAT.cloth, rd = MAT.red, gd = MAT.gold;
    const H = { x: 24, y: 20 };
    // back hair mass
    g.part({ rim: true });
    g.ell(20, 19, 12, 12.5, hr, { add: -0.1 });
    g.lock([[12, 20], [10, 27], [11, 33]], 4, 1.5, hr, { add: -0.15 });
    g.lock([[16, 24], [15, 31], [17, 36]], 4, 1.5, hr, { add: -0.1 });
    // headband tails flowing behind
    g.part({ cast: 1 });
    g.lock([[11, 15], [6, 18], [3, 24]], 2, 1.2, rd, { add: 0.05 });
    g.lock([[11, 16], [7, 22], [6, 29]], 1.8, 1, rd, { add: -0.1 });
    // neck
    g.part({ cast: 0 });
    g.cap(24, 30, 25, 40, 4, 4.5, sk, { add: -0.25 });
    // torso / shoulders: white chiton
    g.part({ cast: 1, edge: 0 });
    g.poly([[6, 48], [9, 40], [16, 36], [22, 37], [30, 37], [36, 39], [42, 44], [44, 48]], cl, { ny: -0.3, fold: (x, y) => Math.sin(x * 0.7) * 0.12 });
    // neckline V with gold trim
    g.part({});
    g.poly([[21, 37], [24, 43], [29, 37]], sk, { add: -0.2 });
    g.line(20, 37, 24, 44, (x, y) => g.tone(x, y, gd, 1));
    g.line(24, 44, 30, 37, (x, y) => g.tone(x, y, gd, 2));
    // red cloak on the near (left) shoulder with gold brooch
    g.part({ cast: 1, edge: 0 });
    g.poly([[4, 48], [6, 41], [11, 36], [17, 35], [21, 38], [19, 42], [15, 48]], rd, { ny: -0.4 });
    g.part({ cast: 1 });
    g.ell(18.5, 39.5, 2.2, 2.2, gd);
    // head
    portraitHead(g, H, sk, {});
    // ear
    g.part({ edge: 1 });
    g.ell(16, 23, 2.2, 3.2, sk, { add: -0.05 });
    g.tone(16, 23, sk, 3); g.tone(16, 24, sk, 3);
    // hair on top / fringe
    g.part({ cast: 1, castLen: 2, grp: 'hair' });
    g.ell(22, 13, 10.5, 7, hr, { add: 0.05 });
    g.lock([[30, 10], [33, 14], [33, 18]], 3, 1, hr, { hl: [0.1, 0.5, 0.3] });
    g.lock([[25, 9], [29, 13], [29, 17]], 3, 1, hr, { hl: [0.1, 0.5, 0.3] });
    g.lock([[19, 10], [22, 14], [21, 18]], 3, 1, hr, { hl: [0.1, 0.4, 0.3] });
    g.lock([[14, 12], [13, 18], [15, 22]], 3, 1, hr, {});
    // headband across the forehead
    g.part({ cast: 1, grp: 'band' });
    g.lock([[11, 15], [18, 13.5], [26, 13], [33, 14.5]], 1.6, 1.4, rd, {});
    // face features
    g.part({});
    const E = { k: '#3b1d2c', w: '#f6efe8', i: '#5a8f5a', j: '#2e4f3a', h: '#ffffff', b: R.auburn[3], c: R.auburn[4] };
    const lg = Object.assign({}, E, { 1: [sk, 1], 2: [sk, 2], 3: [sk, 3], 4: [sk, 4], 0: [sk, 0], l: R.lip[2], m: R.lip[3], n: R.lip[1] });
    g.stamp(21, 18, [
      '.bbbb....bbb',
      'b....b......',
      '.kkkkk..kkkk',
      '.kwihk..wihk',
      '..3jj3..3jj.',
      '.........3..',
      '..........2.',
      '..........23',
      '.........33.',
      '............',
      '.......mmmm.',
      '........nn..'
    ], lg);
    const fg = g.render({ rim: true });
    bg.blit(fg, 0, 0);
    return bg;
  }

  /* ================================================================
     IN-GAME NPC SPRITES
     ================================================================ */
  function elder(f) {
    const W = 28, Hh = 44;
    const g = new G(W, Hh);
    const sk = MAT.skinOld, hw = MAT.white, wl = MAT.wool, wd = MAT.wood, cl = MAT.cloth;
    const br = f === 1 || f === 2 ? 1 : 0; // breathing
    const sw = [0, 1, 1, 0][f];
    const hx = 12, hy = 11 + br;
    // back arm
    g.part({});
    g.cap(9, 19 + br, 8, 27 + br, 2, 1.8, wl, { add: -0.25 });
    // robe (under-tunic)
    g.part({ cast: 1 });
    g.poly([[7, 17 + br], [17, 17 + br], [19, 30], [21, 42], [5, 42], [6, 30]], cl, { add: -0.05, fold: (x, y) => Math.sin((x - 3) * 1.1) * 0.25 * (y > 28 ? 1 : 0) });
    // himation drape (brown wool) across body
    g.part({ cast: 1, edge: 0 });
    g.poly([[6, 17 + br], [15, 16 + br], [18, 22 + br], [17, 36], [20, 40 - sw], [8, 41], [5, 32]], wl, { fold: (x, y) => Math.sin((x + y * 0.4) * 0.9) * 0.3 });
    // feet
    g.part({});
    g.ell(15, 41.5, 2.5, 1.5, sk, { add: -0.1 });
    // staff
    g.part({ cast: 1 });
    g.cap(21, 4, 21, 42, 1, 1, wd, {});
    g.ell(21, 4.5, 1.8, 2, wd, {});
    // front arm to the staff
    g.part({ cast: 1, edge: 1 });
    g.cap(15, 19 + br, 20, 25, 2, 1.8, wl, {});
    g.part({});
    g.ell(21, 25, 1.8, 1.8, sk, {});
    // head
    g.part({});
    g.ell(hx, hy, 5, 5.5, sk, {});
    // hair (white, receding) & beard
    g.part({ cast: 1, grp: 'hair' });
    g.ell(10, hy - 2, 4.5, 4, hw, {});
    g.ell(9, hy + 1, 3, 4, hw, { add: -0.1 });
    g.part({ cast: 1, grp: 'hair' });
    g.lock([[13, hy + 3], [15, hy + 8], [14, hy + 13 + sw]], 3.2, 0.8, hw, { hl: [0.1, 0.4, 0.2] });
    g.part({});
    g.stamp(14, hy - 1, ['kk.', 'k..', '..2', '.4.'], { k: '#2a1f33', 2: [sk, 2], 4: [sk, 3] });
    return g.render({});
  }

  /* ================================================================ */
  O.ART_INITS.push(function () {
    const reg = (name, pix, ax, ay) => O.registerSprite(name, pix, { ax, ay });
    for (let f = 0; f < 4; f++) reg('elder_idle_' + f, elder(f), 13, 43);
    reg('portrait_orpheus', portraitOrpheus(), 24, 47);
  });
})(window.OLY);
