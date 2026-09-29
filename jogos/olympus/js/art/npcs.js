/* art/npcs.js — NPCs, gods and dialogue portraits (modern pixel art, refinement round 3).
   Everything is painted the way a pixel artist paints: flat colour CLUSTERS laid down as shapes.
   - Portraits (48x48 busts): each material (skin, hair, cloth, metal) lives on its own layer; the
     base tone is a smooth closed spline shape, then light and shadow are added as further shapes
     clipped to that layer (a lit plane, a shadow plane, one highlight band per lock, dark tone
     only in the gaps between locks). Faces (eyes, brows, nose, mouth, ear) are hand-placed pixel
     maps, different per character (head angle, age, expression). No per-pixel normal shading, so
     no "barcode" stripes.
   - Sprites: the same shape painter at 1x plus hand-placed faces; idle loops animate breathing as
     a 0 -> 1/2 -> 1 -> 1/2 wave (shoulders lead, head follows), hair/cloth lag one frame, and the
     floating gods keep their body still (the engine bobs them) and animate only secondary motion.
   Light always comes from the upper-left; outlines are the deep plum O.PAL5.outline, never black. */
(function (O) {
  'use strict';
  const OUT = (O.PAL5 && O.PAL5.outline) || '#1b1426';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- ramps (0 = highlight .. 4 = deepest shadow), hue-shifted ---------------- */
  const R = {
    skin: ['#ffe2c4', '#f6be90', '#dc9068', '#a85e50', '#5e2f40'],
    skinF: ['#fff0e0', '#fbd3b2', '#eaa688', '#bc706a', '#6e3a50'],
    skinTan: ['#f6cda0', '#dc9c6c', '#b2704e', '#7e4644', '#46263a'],
    skinOld: ['#fbe2cc', '#eab996', '#c88a6e', '#915c5a', '#533448'],
    skinGod: ['#fff0d2', '#f8cf9a', '#dea06c', '#a8684e', '#603844'],
    skinHades: ['#f0eafc', '#c9c0e6', '#9a8ec6', '#6a5c9a', '#3a3066'],
    auburn: ['#ffb070', '#dd6f36', '#a84428', '#6c2826', '#3a1422'],
    blond: ['#fff4b0', '#f5cc5c', '#d8983a', '#a4603a', '#643a3c'],
    white: ['#ffffff', '#e9e6f6', '#c4bde0', '#968cc0', '#625a92'],
    darkHair: ['#8a6c9c', '#5a4274', '#3a2a52', '#241a38', '#140e22'],
    hadesHair: ['#5c4c8c', '#3a2e62', '#262044', '#17132c', '#0c0a18'],
    chestnut: ['#e0a068', '#a8643c', '#743e2e', '#4a2428', '#28141c'],
    brown: ['#b88a6a', '#7e5440', '#553430', '#36202a', '#1e121c'],
    cloth: ['#ffffff', '#f1edf8', '#d0c9e6', '#9e96c6', '#645c90'],
    ivory: ['#fffaf0', '#f4e8d4', '#dccab4', '#a898a8', '#6a5a7a'],
    wool: ['#e6b27a', '#c08850', '#8e5a3a', '#5e3634', '#321c28'],
    sky: ['#eaf8ff', '#a6daf8', '#68aae4', '#4672ba', '#2c4482'],
    corn: ['#c4dcff', '#86b0f0', '#5886d4', '#3a4c9c', '#242c68'],
    royal: ['#94bcff', '#5480e8', '#3450b8', '#243282', '#161a4c'],
    pink: ['#ffe6f0', '#f9aac8', '#e2709e', '#aa467e', '#602858'],
    terra: ['#ffb68a', '#e87a4a', '#c0522e', '#843428', '#4a1c20'],
    ochre: ['#ffe29a', '#f0b44a', '#d0842c', '#94502a', '#5a2c24'],
    violet: ['#aa9ada', '#6c5aaa', '#483a84', '#2e2458', '#181232'],
    iron: ['#bcbad0', '#84829e', '#585670', '#38364c', '#1e1c2e'],
    wood: ['#e0b27e', '#aa7850', '#7a5038', '#4e3129', '#2b1b1c'],
    leather: ['#e2a870', '#b47444', '#83502e', '#553222', '#2f1c17'],
    clay: ['#ffc094', '#f08250', '#c85432', '#86342c', '#4a1c22'],
    gold: ['#fff8c4', '#ffd75a', '#e8a024', '#aa641e', '#603418'],
    red: ['#ff9f7d', '#ee4e3a', '#be2a34', '#7e1a32', '#461028'],
    leaf: ['#e2f59a', '#9ccf5a', '#5d9b44', '#35663c', '#1c3a2c'],
    snake: ['#d8f08c', '#8cc454', '#4e9244', '#2c5e3e', '#173428'],
    feather: ['#ffffff', '#eaf0fb', '#b8c6e6', '#7c8abe', '#4c5688'],
    flame: ['#ffffff', '#b8f8ff', '#6ad8ff', '#8a6af0', '#4a34b0'],
    bolt: ['#ffffff', '#fff8c8', '#ffd84a', '#ff9a2a', '#c4501c'],
    silver: ['#ffffff', '#dfe6f2', '#a9b2cc', '#6f7699', '#3e4466'],
    cloud: ['#ffffff', '#eef2ff', '#c8d2f2', '#96a2d4', '#6a74a8']
  };
  O.NPC_RAMPS = R;

  /* ================================================================
     SHAPE PAINTER
     ================================================================ */
  // Legend builder: LG({ch: '#hex'}, ['abcde', ramp], ...) -> {ch: colour}
  function LG(fixed) {
    const lg = Object.assign({ o: OUT }, fixed || {});
    for (let k = 1; k < arguments.length; k++) {
      const [chars, ramp] = arguments[k];
      for (let i = 0; i < chars.length; i++) if (chars[i] !== ' ') lg[chars[i]] = ramp[Math.min(i, ramp.length - 1)];
    }
    return lg;
  }
  // ASCII pixel map at (x0, y0). '.'/' ' skip, '_' erase. clip (optional) limits where it paints.
  function art(p, x0, y0, rows, lg, tag, clip) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const x = x0 + i, y = y0 + j;
        if (clip && !okClip(clip, x, y)) continue;
        if (ch === '_') { p.set(x, y, null); continue; }
        const c = lg[ch];
        if (c === undefined) throw new Error('npcs.js legend missing "' + ch + '" in ' + tag);
        p.set(x, y, c);
      }
    });
    return p;
  }
  function okClip(clip, x, y) {
    if (!clip) return true;
    if (typeof clip === 'function') return clip(x, y);
    return !!clip.get(x, y);
  }
  // Hermite / Catmull-Rom spline through points [x, y, corner?]. Corner points get zero tangents.
  function spline(pts, closed, tension) {
    const n = pts.length, out = [], T = tension === undefined ? 0.5 : tension;
    if (n < 3) { pts.forEach((q) => out.push([q[0], q[1]])); return out; }
    const P = (i) => (closed ? pts[((i % n) + n) % n] : pts[clamp(i, 0, n - 1)]);
    const tan = (i) => { const q = P(i); if (q[2]) return [0, 0]; const a = P(i - 1), b = P(i + 1); return [(b[0] - a[0]) * T, (b[1] - a[1]) * T]; };
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i), p1 = P(i + 1), m0 = tan(i), m1 = tan(i + 1);
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), N = Math.max(4, Math.ceil(len * 2));
      for (let k = 0; k < N; k++) {
        const t = k / N, t2 = t * t, t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
        out.push([h00 * p0[0] + h10 * m0[0] + h01 * p1[0] + h11 * m1[0], h00 * p0[1] + h10 * m0[1] + h01 * p1[1] + h11 * m1[1]]);
      }
    }
    if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  }
  // Even-odd scanline fill, pixel-centre sampling. col: colour or fn(x, y) -> colour|null.
  function fill(p, poly, col, clip) {
    let y0 = Infinity, y1 = -Infinity;
    poly.forEach((q) => { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const cy = y + 0.5, xs = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        if ((a[1] <= cy && b[1] > cy) || (b[1] <= cy && a[1] > cy)) xs.push(a[0] + ((cy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
          if (clip && !okClip(clip, x, y)) continue;
          const c = typeof col === 'function' ? col(x, y) : col;
          if (c) p.set(x, y, c);
        }
      }
    }
    return p;
  }
  const blob = (p, pts, col, clip) => fill(p, spline(pts, true), col, clip);        // smooth closed shape
  const poly = (p, pts, col, clip) => fill(p, pts, col, clip);                       // straight polygon
  // Open spline stroke. w: width (number) or [w0, w1] tapering. w <= 1 -> clean 1-px line.
  function curve(p, pts, w, col, clip) {
    const S = spline(pts, false);
    const W0 = Array.isArray(w) ? w[0] : w, W1 = Array.isArray(w) ? w[1] : w;
    if (W0 <= 1 && W1 <= 1) {
      let last = null;
      const put = (x, y) => { if (last && last[0] === x && last[1] === y) return; last = [x, y]; if (!clip || okClip(clip, x, y)) p.set(x, y, typeof col === 'function' ? col(x, y) : col); };
      for (let i = 0; i + 1 < S.length; i++) bres(S[i][0], S[i][1], S[i + 1][0], S[i + 1][1], put);
      return p;
    }
    let tot = 0; const acc = [0];
    for (let i = 1; i < S.length; i++) { tot += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]); acc.push(tot); }
    const done = new Set();
    S.forEach((q, i) => {
      const r = lerp(W0, W1, tot ? acc[i] / tot : 0) / 2;
      if (r <= 0.2) return;
      for (let y = Math.floor(q[1] - r); y <= Math.ceil(q[1] + r); y++) for (let x = Math.floor(q[0] - r); x <= Math.ceil(q[0] + r); x++) {
        const k = x + ',' + y;
        if (done.has(k)) continue;
        if ((x + 0.5 - q[0]) ** 2 + (y + 0.5 - q[1]) ** 2 > r * r) continue;
        if (clip && !okClip(clip, x, y)) continue;
        done.add(k);
        p.set(x, y, typeof col === 'function' ? col(x, y) : col);
      }
    });
    return p;
  }
  function bres(x0, y0, x1, y1, fn) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.floor(x1); y1 = Math.floor(y1);
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
  function ell(p, cx, cy, rx, ry, col, clip) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      if (clip && !okClip(clip, x, y)) continue;
      const c = typeof col === 'function' ? col(x, y, dx, dy) : col;
      if (c) p.set(x, y, c);
    }
    return p;
  }
  function dots(p, list, lg) { list.forEach(([x, y, ch]) => p.set(x, y, (lg && lg[ch]) || ch)); return p; }
  // Sel-out outline: transparent pixels touching the figure get the outline colour.
  function outline(p, col, diag) {
    const add = [];
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (p.get(x, y)) continue;
      let hit = p.get(x - 1, y) || p.get(x + 1, y) || p.get(x, y - 1) || p.get(x, y + 1);
      if (!hit && diag) hit = p.get(x - 1, y - 1) || p.get(x + 1, y - 1) || p.get(x - 1, y + 1) || p.get(x + 1, y + 1);
      if (hit) add.push(x, y);
    }
    for (let i = 0; i < add.length; i += 2) p.set(add[i], add[i + 1], typeof col === 'function' ? col(add[i], add[i + 1]) : col || OUT);
    return p;
  }
  // Rim light: pixels on the right-hand silhouette edge are tinted towards col (skip: {colour: 1}).
  function rim(p, col, amt, y0, y1, skip, clip) {
    const hits = [];
    for (let y = y0 || 0; y < (y1 || p.h); y++) for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y);
      if (!c || p.get(x + 1, y) || (skip && skip[c]) || (clip && !okClip(clip, x, y))) continue;
      hits.push(x, y, O.mix(c, col, amt));
    }
    for (let i = 0; i < hits.length; i += 3) p.set(hits[i], hits[i + 1], hits[i + 2]);
    return p;
  }
  // Layer composite: where the layer overlaps existing pixels, its edge becomes an inner contour.
  function comp(dst, L, line) {
    if (line) {
      const add = [];
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        if (L.get(x, y) || !dst.get(x, y)) continue;
        if (L.get(x - 1, y) || L.get(x + 1, y) || L.get(x, y - 1) || L.get(x, y + 1)) add.push(x, y);
      }
      for (let i = 0; i < add.length; i += 2) dst.set(add[i], add[i + 1], typeof line === 'function' ? line(dst.get(add[i], add[i + 1]), add[i], add[i + 1]) : line);
    }
    dst.blit(L, 0, 0);
    return dst;
  }
  // Orphan cleanup: a pixel whose 4 neighbours are all one other tone of the same ramp takes that tone.
  function clean(p, ramps) {
    const id = {};
    ramps.forEach((r, k) => r.forEach((c) => { if (id[c] === undefined) id[c] = k; }));
    const ch = [];
    for (let y = 1; y < p.h - 1; y++) for (let x = 1; x < p.w - 1; x++) {
      const c = p.get(x, y);
      if (!c || id[c] === undefined) continue;
      const n = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)];
      if (n.some((q) => q === c)) continue;
      if (n.every((q) => q === n[0] && id[q] === id[c])) ch.push(x, y, n[0]);
    }
    for (let i = 0; i < ch.length; i += 3) p.set(ch[i], ch[i + 1], ch[i + 2]);
    return p;
  }
  const L48 = () => new O.Pix(48, 48);
  const onCol = (p, cols) => (x, y) => cols.indexOf(p.get(x, y)) >= 0;
  function recolor(p, from, to, clip) { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) === from && (!clip || okClip(clip, x, y))) p.set(x, y, to); return p; }
  function shiftPix(src, dx, dy, clip) {
    const q = new O.Pix(src.w, src.h);
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c) q.set(x + (clip && !clip(x, y) ? 0 : dx), y + (clip && !clip(x, y) ? 0 : dy), c); }
    return q;
  }
  // Flat concentric background bands (light behind the head), 1-px checker only at band seams.
  function bgBands(cols, cx, cy, rx, ry, extra) {
    const p = L48(), n = cols.length;
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
      const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
      let k = Math.floor(d); const f = d - k;
      k = clamp(k, 0, n - 1);
      if (k < n - 1 && f > 1 - 1.4 / Math.min(rx, ry) && ((x + y) & 1)) k++;
      p.set(x, y, cols[k]);
    }
    if (extra) extra(p);
    return p;
  }
  // Additive glow on a background around points/path (quantised to 3 levels, checker at the fringe).
  function glow(bg, pts, col, rad, amt) {
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
      const base = bg.get(x, y) || '#101018', key = base + lvl;
      if (!cache[key]) { const A = O.hexToRgb(base), C = O.hexToRgb(col), k = lvl * 0.16; cache[key] = O.rgbToHex(A[0] + C[0] * k, A[1] + C[1] * k, A[2] + C[2] * k); }
      bg.set(x, y, cache[key]);
    }
    return bg;
  }
  O.NPCPaint = { LG, art, spline, fill, blob, poly, curve, ell, dots, outline, rim, comp, clean, bgBands, glow };

  /* ================================================================
     PORTRAITS (48x48 busts facing right)
     ================================================================ */
  // A lock of hair / beard: a tapered tube along a spline spine, painted as 3 flat clusters:
  // lit side (tone 1), shadow side (tone 2) and one short highlight band (tone 0) in the upper
  // part of the lit side. o: {lit: 0..1 portion lit, hi: [t0, t1] highlight span, hiW: width
  // fraction, tip: t after which the lit side fades to base, clip, dark: shift tones}.
  function lockShape(p, spine, w0, w1, H, o) {
    o = o || {};
    const S = spline(spine, false);
    let tot = 0; const acc = [0];
    for (let i = 1; i < S.length; i++) { tot += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]); acc.push(tot); }
    const sam = S.map((q, i) => {
      const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      return { x: q[0], y: q[1], tx, ty, nx: -ty, ny: tx, t: tot ? acc[i] / tot : 0 };
    });
    const pw = o.pow || 1, width = (t) => lerp(w0, w1, Math.pow(t, pw));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    sam.forEach((q) => { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); });
    const pad = Math.max(w0, w1) / 2 + 1, lit = o.lit === undefined ? 0.5 : o.lit, hi = o.hi || [0.12, 0.45], hiW = o.hiW === undefined ? 0.4 : o.hiW;
    const d = o.dark || 0, T = (k) => H[clamp(k + d, 0, H.length - 1)];
    for (let y = Math.floor(y0 - pad); y <= Math.ceil(y1 + pad); y++) for (let x = Math.floor(x0 - pad); x <= Math.ceil(x1 + pad); x++) {
      const px = x + 0.5, py = y + 0.5;
      let best = null, bd = 1e9;
      for (let i = 0; i < sam.length; i++) { const q = sam[i], dd = (px - q.x) ** 2 + (py - q.y) ** 2; if (dd < bd) { bd = dd; best = q; } }
      const ox = px - best.x, oy = py - best.y, along = ox * best.tx + oy * best.ty;
      if ((best.t === 0 && along < -0.2) || (best.t === 1 && along > 0.2)) continue;
      const hw = width(best.t) / 2;
      if (hw <= 0.25) continue;
      let s = (ox * best.nx + oy * best.ny) / hw;
      if (Math.abs(s) > 1) continue;
      if (o.clip && !okClip(o.clip, x, y)) continue;
      // orient s so that -1 is the lit (upper-left) side
      if (best.nx * -0.6 + best.ny * -0.8 < 0) s = -s;
      const u = (s + 1) / 2;                 // 0 = lit edge .. 1 = shadow edge
      let tone = 2;
      if (o.wave) {
        // wavy lock: where the lock swings to the right while falling, its surface faces the
        // light -> a lit crescent across the whole lock; where it swings back -> shadow.
        const v = best.tx * (o.wave || 1) - s * 0.3 + (o.bias || 0);
        tone = v > 0.62 ? 0 : v > 0.12 ? 1 : v > -0.45 ? 2 : 3;
        if (tone === 0 && Math.abs(s) > 0.6) tone = 1;
        if (o.tipFade && best.t > o.tipFade && tone < 2) tone++;
        p.set(x, y, T(tone));
        continue;
      }
      if (u < lit && best.t < (o.tip === undefined ? 0.8 : o.tip)) tone = 1;
      if (best.t > hi[0] && best.t < hi[1] && u > (o.hiAt || 0.1) && u < (o.hiAt || 0.1) + hiW) tone = 0;
      if (o.base !== undefined && tone === 2) tone = o.base;
      p.set(x, y, T(tone));
    }
    return p;
  }
  // Several locks composited one after another; where a lock overlaps earlier ones its edge
  // becomes a dark gap (tone 3), which is the only place the dark tone appears.
  function hairLocks(fig, list, H, gap) {
    list.forEach((l) => { const q = new O.Pix(fig.w, fig.h); lockShape(q, l[0], l[1], l[2], H, l[3]); comp(fig, q, gap === undefined ? H[3] : gap); });
    return fig;
  }
  // Cloth fold: shadow valley (tapered stroke) with a lit ridge on its upper-left side.
  function fold(p, pts, w, shade, ridge, clip) {
    if (ridge) curve(p, pts.map((q) => [q[0] - 1, q[1] - 0.6]), [Math.max(1, w[0] * 0.6), Math.max(1, w[1] * 0.5)], ridge, clip);
    curve(p, pts, w, shade, clip);
    return p;
  }
  // Eye: hand-placed map with a per-character legend (lid, sclera, iris dark/light, catchlight).
  function faceLG(skin, extra) {
    return Object.assign(LG({ w: '#fbf6f4', '*': '#ffffff' }, ['01234', skin]), extra || {});
  }
  function finish(fig, bg, rimCol, rimAmt, outCol, rimClip) {
    if (rimCol) rim(fig, rimCol, rimAmt || 0.4, 0, 48, null, rimClip);
    outline(fig, outCol || OUT);
    bg.blit(fig, 0, 0);
    return bg;
  }

  /* ---------- ORPHEUS: young hero, auburn waves, red headband, determined kind eyes ---------- */
  function portraitOrpheus() {
    const S = R.skin, H = R.auburn, C = R.cloth, RD = R.red, G = R.gold;
    const fig = L48();
    // --- hair behind the head and nape (first, everything else overlaps it)
    const hb = L48();
    blob(hb, [[14, 6], [22, 2], [30, 3], [26, 10], [21, 14], [20, 22], [21, 28], [19, 33], [14, 34], [9, 30], [8, 22], [9, 12]], H[2]);
    hairLocks(hb, [
      [[[17, 6], [11, 12], [9, 21], [12, 32]], 7, 3, H, { lit: 0.55, hi: [0.15, 0.4] }],
      [[[21, 10], [16, 16], [15, 25], [18, 33]], 6, 2, H, { lit: 0.5, hi: [0.2, 0.45] }]
    ], H);
    // headband tails flutter behind the knot
    curve(hb, [[12, 15], [8, 19], [6, 25]], [3, 1.6], RD[2]);
    curve(hb, [[12, 15], [8.5, 19], [6.5, 24]], [1.6, 1], RD[1]);
    curve(hb, [[13, 16], [12, 21], [10, 26]], [2.6, 1.4], RD[3]);
    comp(fig, hb, null);
    // --- body: white chiton, folds radiate from the far-shoulder pin
    const bd = L48();
    blob(bd, [[4, 48, 1], [6, 42], [12, 38], [20, 36], [31, 36.5], [39, 38], [44, 42], [47, 48, 1]], C[1]);
    blob(bd, [[29, 38], [38, 38.5], [44, 43], [46, 48, 1], [36, 48, 1], [36, 44]], C[2], bd);     // far side turns away
    fold(bd, [[24, 40], [28, 44], [30, 48]], [3, 2], C[2], C[0], bd);
    fold(bd, [[33, 39], [35, 43], [38, 48]], [2.6, 1.6], C[3], C[1], bd);
    fold(bd, [[20, 42], [21, 45], [21, 48]], [2, 1.4], C[2], null, bd);
    // gold trim on the round neckline
    curve(bd, [[19, 36.5], [25, 40], [31, 36.8]], 1, G[1]);
    curve(bd, [[20, 37.5], [25, 41], [30, 37.8]], 1, G[3]);
    comp(fig, bd, C[4]);
    // --- red cloak thrown over the near shoulder, pinned by a gold brooch
    const ck = L48();
    blob(ck, [[0, 48, 1], [0, 41], [4, 37], [11, 35], [17, 36], [21, 39.5], [19, 44], [17, 48, 1]], RD[2]);
    blob(ck, [[1, 40], [5, 36.6], [11, 35.6], [15, 37], [11, 39], [6, 41], [2, 44]], RD[1], ck);   // lit top of the shoulder
    curve(ck, [[4, 37.6], [9, 36.4], [13, 37]], 1, RD[0], ck);
    fold(ck, [[8, 40], [7, 44], [6, 48]], [3, 2], RD[3], null, ck);
    fold(ck, [[14, 41], [13, 45], [13, 48]], [2.4, 1.6], RD[3], null, ck);
    curve(ck, [[10, 40], [10, 44], [9.5, 48]], [1.6, 1], RD[1], ck);
    comp(fig, ck, C[4]);
    art(fig, 16, 38, ['.yG.', 'yY*G', 'GYGg', '.gg.'], LG({ '*': '#ffffff' }, ['yYGg', [G[0], G[1], G[2], G[3]]]), 'brooch');
    // --- neck: set back behind the jaw, curved cast shadow under the chin
    const nk = L48();
    poly(nk, [[21, 27], [29, 31], [30.5, 35], [31, 38.5], [21, 38.5]], S[2]);
    poly(nk, [[21, 29], [24, 30], [24, 38.5], [21, 38.5]], S[1], nk);
    blob(nk, [[20, 27], [26, 30], [31, 32.5], [30, 35.5], [25, 33.5], [21, 31.5]], S[3], nk);
    comp(fig, nk, S[4]);
    // --- head: 3/4 view, strong straight nose, defined chin
    const hd = L48();
    blob(hd, [[24, 5], [31, 7], [34.2, 11], [35, 16], [35.3, 18.2, 1], [34.4, 20.2], [35.2, 22.2], [36.8, 24.9, 1], [35, 26.1, 1], [35.3, 27.4], [34.6, 28.6], [35, 29.6], [34.4, 31.4], [32.2, 33.6], [28, 33.4], [23.5, 30.6], [20.5, 27.5], [19.6, 24], [19.4, 19], [19.5, 13], [20, 7]], S[1]);
    // light plane: temple/forehead and the cheekbone under the near eye
    blob(hd, [[20, 8], [28, 7], [33, 10], [31, 14], [24, 15], [20, 16]], S[0], hd);
    blob(hd, [[24.5, 23.4], [28, 23.2], [29.6, 24], [27, 24.8], [25, 24.8]], S[0], hd);
    // shadow plane: side of the jaw curving from the ear to the chin, eye socket, under the nose
    blob(hd, [[20, 25], [22, 27.5], [26, 30.4], [30, 31.8], [33, 31.6], [32.5, 33.8], [28, 33.8], [23, 31], [20, 28]], S[2], hd);
    blob(hd, [[30.2, 19.4], [34.2, 19.2], [34.5, 21.4], [33, 22.2], [31, 21.4]], S[2], hd);
    blob(hd, [[32.4, 25.6], [35.5, 25.6], [35, 26.6], [33, 26.8]], S[2], hd);
    // ear (skin + one shadow tone + 1-px inner shadow)
    art(hd, 19, 19, ['.01.', '0122', '0132', '0122', '.12.', '..2.'], faceLG(S), 'ear');
    // brows: raised 1 px off the lid, slight inner lift = determined but kind
    const E = faceLG(S, { L: '#4a1e2c', B: H[3], b: H[2], J: '#2f5a3c', j: '#6fae5e', h: S[0], m: '#8a3440', r: '#c8705e', n: S[3], k: '#f2a58e' });
    art(hd, 24, 16, ['.bBBB.', 'B....B'.replace(/\./g, '.')], E, 'brow-near');
    art(hd, 31, 16, ['bBB', '...'], E, 'brow-far');
    // near eye (5 wide), iris 2x3 dark-top/light-bottom, catchlight top-left, lower-lid highlight
    art(hd, 24, 18, [
      '.LLLL.',
      'Lw*Jw.',
      '.wJjwL',
      '..jj..',
      '.hhhh.'
    ], E, 'eye-near');
    // far eye: 1 px narrower, tucked behind the nose bridge
    art(hd, 31, 18, [
      'LLL',
      '*Jw',
      'Jj.',
      'hh.'
    ], E, 'eye-far');
    // nose: bridge light, nostril notch; mouth: firm line with a slight upturn
    art(hd, 33, 21, ['0.', '.0', '..', '.n'], E, 'nose');
    art(hd, 31, 27, ['.mmm', 'n.rr', '..n.'], E, 'mouth');
    comp(fig, hd, S[3]);
    // --- hair on top: 4 big S-shaped locks sweeping back, curls spilling over the band
    const ht = L48();
    blob(ht, [[13, 11], [14.5, 6], [20, 2.2], [28, 1.2], [35, 3], [38.6, 7], [38, 11], [34, 11], [28, 11.4], [22, 13.6], [17, 15.4]], H[2]);
    blob(ht, [[15, 9], [17.5, 4.6], [24, 2.2], [31, 2.4], [30, 5.2], [24, 6.4], [19, 9], [16, 12]], H[1], ht);      // lit crown
    blob(ht, [[29, 5.4], [34, 4.4], [37.4, 7.4], [36, 9.6], [32, 8]], H[1], ht);                                     // lit front wave
    curve(ht, [[18.5, 6.6], [22, 4.2], [27, 3.2]], [2, 1], H[0], ht);                                                // sheen
    curve(ht, [[31.5, 6], [34, 5.6]], 1, H[0], ht);
    curve(ht, [[37, 9.6], [32, 7.6], [26, 7.6], [20, 11]], [2, 1], H[3], ht);                                        // gaps between waves
    curve(ht, [[28, 4.8], [24, 6.8], [19, 10.6], [16, 14]], [1.6, 1], H[3], ht);
    curve(ht, [[34, 2.6], [30, 3], [28.5, 4.4]], 1, H[3], ht);
    // sideburn in front of the ear
    lockShape(ht, [[23.5, 12], [22.2, 15], [22.8, 19]], 3.4, 1.4, H, { lit: 0.5, hi: [0.2, 0.5] });
    comp(fig, ht, H[4]);
    // headband across the brow, knotted at the back
    const bn = L48();
    curve(bn, [[36, 11.4], [29, 11.2], [22, 13.2], [15, 15.4]], 3, RD[2]);
    curve(bn, [[35.5, 10.6], [29, 10.4], [22, 12.4], [16, 14.6]], 1, RD[1]);
    curve(bn, [[34, 10.6], [30, 10.4]], 1, RD[0]);
    ell(bn, 13.5, 15.5, 2.2, 2.2, RD[2]);
    ell(bn, 13, 15, 1.2, 1.2, RD[1]);
    comp(fig, bn, OUT);
    // curls spilling over the band
    const cu = L48();
    hairLocks(cu, [
      [[[29, 9], [32, 11], [32, 14], [30, 15.5]], 3.6, 1.4, H, { lit: 0.5, hi: [0.1, 0.5] }],
      [[[35, 9.5], [37.5, 12], [37, 14.5]], 3, 1.2, H, { lit: 0.5, hi: [0.1, 0.4] }]
    ], H);
    comp(fig, cu, H[4]);
    clean(fig, [S, H, C, RD]);
    const bg = bgBands(['#94546a', '#7a4260', '#5f3354', '#452544'], 26, 18, 19, 19);
    return finish(fig, bg, '#ffd6a8', 0.4);
  }

  /* ---------- EURYDICE: gentle, golden waves, flower crown, wide soft eyes ---------- */
  function flower(p, x, y, petal, petalD, core) {
    dots(p, [[x, y - 1, petal], [x - 1, y, petal], [x + 1, y, petalD], [x, y + 1, petalD], [x, y, core]]);
  }
  // Wavy-hair shading: for each wave [x0, y0, x1, y1] a lit crest (tone 1 with a tone-0 core on
  // the lit left half) and a shadow trough (tone 3) 3-4 px below it, all clipped to the mass.
  function waves(p, list, H, clip, o) {
    o = o || {};
    list.forEach(([x0, y0, x1, y1]) => {
      const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 1.6;
      curve(p, [[x0, y0 + 0.6], [mx, my], [x1, y1]], o.cw || 2.6, H[1], clip);
      curve(p, [[x0 + 1, y0 + 0.2], [lerp(x0, mx, 0.8), my + 0.2], [lerp(mx, x1, 0.3), my + 0.6]], 1, H[0], clip);
      curve(p, [[x0, y0 + 4], [mx, my + 3.2], [x1, y1 + 3.6]], [1.8, 1.2], H[3], clip);
    });
    return p;
  }
  function portraitEurydice() {
    const S = R.skinF, H = R.blond, C = R.cloth, G = R.gold, LF = R.leaf;
    const fig = L48();
    // --- long hair behind: four wavy S-locks; each wave that swings right catches the light as a
    //     crescent across the lock, the return swing falls into shadow (no stripes along the lock)
    const hb = L48();
    blob(hb, [[14, 5], [22, 2], [30, 3], [27, 12], [24.5, 20], [24, 28], [21.5, 36], [19, 42], [18, 48, 1], [0, 48, 1], [0.6, 40], [3, 32], [3.6, 22], [7, 11]], H[2]);
    hairLocks(hb, [
      [[[17, 5], [9, 12], [5, 19], [7, 25], [3, 32], [4, 39], [1, 46]], 7, 5, H, { wave: 1.1, bias: 0.15 }],
      [[[19, 6], [13, 13], [11, 21], [14, 28], [10, 35], [11, 42], [8, 48]], 8, 5.5, H, { wave: 1.1 }],
      [[[23, 9], [18, 16], [17, 24], [20, 31], [16, 38], [17, 44], [15, 48]], 7, 5, H, { wave: 1.1, bias: -0.05 }],
      [[[25, 14], [22, 20], [22.4, 27], [22, 34], [19.6, 40], [20, 46]], 5, 3, H, { wave: 1.1, bias: -0.15 }]
    ], H);
    comp(fig, hb, null);
    // --- dress: white chiton, gold-trimmed neckline, soft folds from the shoulder clasp
    const bd = L48();
    blob(bd, [[12, 48, 1], [14, 42], [19, 38.5], [26, 37.5], [33, 38], [40, 40.5], [44, 44], [46, 48, 1]], C[1]);
    blob(bd, [[31, 39.5], [39, 40.5], [44, 44.5], [45.4, 48, 1], [36, 48, 1], [35, 44]], C[2], bd);
    fold(bd, [[22, 42], [24, 45], [25, 48]], [2.6, 1.8], C[2], C[0], bd);
    fold(bd, [[33, 41], [35, 44.5], [37, 48]], [2.4, 1.6], C[3], null, bd);
    curve(bd, [[18, 39.4], [25, 42.6], [33, 39]], 1, G[1]);
    curve(bd, [[19, 40.4], [25, 43.6], [32, 40]], 1, G[3]);
    comp(fig, bd, C[4]);
    art(fig, 16, 39, ['.yG', 'yY*', 'Ggg'], LG({ '*': '#ffffff' }, ['yYGg', [G[0], G[1], G[2], G[3]]]), 'clasp');
    // --- neck: slender, set back, curved shadow under the jaw
    const nk = L48();
    poly(nk, [[22, 28], [29.5, 31.5], [30.5, 35], [31, 39.8], [22, 39.8]], S[2]);
    poly(nk, [[22, 30], [25, 31], [25, 40], [22, 40]], S[1], nk);
    blob(nk, [[21, 28], [26, 31], [31, 32.6], [30.4, 35], [26, 33.6], [22, 31.6]], S[3], nk);
    comp(fig, nk, S[4]);
    // --- head: rounder, smaller chin, small soft nose
    const hd = L48();
    blob(hd, [[25, 6], [31, 8], [34, 12], [34.6, 17], [34.8, 18.4, 1], [34.2, 20.2], [35, 22.4], [36.3, 24.6, 1], [34.8, 25.6, 1], [35.1, 27], [34.5, 28], [34.9, 29.1], [34.2, 31], [31.5, 32.8], [27, 32.2], [23.5, 29.6], [21.4, 26.6], [20.8, 22], [20.6, 15], [21, 8]], S[1]);
    blob(hd, [[24.6, 23.2], [28.4, 23], [30, 24], [27.4, 25], [25.2, 24.8]], S[0], hd);
    blob(hd, [[21.4, 25], [23.4, 28.2], [27, 30.6], [30.5, 31.6], [33.5, 31], [32, 33.2], [27.5, 33], [23.4, 30.4], [21, 27.6]], S[2], hd);
    blob(hd, [[30.6, 19.4], [34.2, 19.2], [34.4, 21.2], [33, 21.8], [31.2, 21.2]], S[2], hd);
    blob(hd, [[32.8, 25.4], [35.4, 25.4], [35, 26.4], [33.2, 26.6]], S[2], hd);
    art(hd, 20, 20, ['.01.', '0122', '0132', '0122', '.12.'], faceLG(S), 'ear');
    const E = faceLG(S, { L: '#4a2436', B: H[3], b: H[2], J: '#2e5aa8', j: '#6aa8ee', h: S[0], m: '#b04c5e', r: '#e88a86', n: S[3], k: '#f7a898', g: G[1] });
    art(hd, 24, 16, ['.bBB.', 'b....'], E, 'brow-near');       // soft, high arched brows
    art(hd, 31, 16, ['bB.', '...'], E, 'brow-far');
    art(hd, 23, 18, [
      '..LLLL',
      '.LwwwwL',
      'L.w*Jw.',
      '..wJjw.',
      '...jj..',
      '..hhhh.'
    ].map((r) => r.slice(0, 7)), E, 'eye-near');
    art(hd, 31, 18, [
      'LLL',
      'ww.',
      '*J.',
      'Jj.',
      'hh.'
    ], E, 'eye-far');
    art(hd, 34, 22, ['0', '.', '.', 'n'], E, 'nose');
    art(hd, 32, 27, ['mmm', 'rr.'], E, 'mouth');
    art(hd, 26, 25, ['kk'], E, 'blush');
    dots(hd, [[20, 25, G[1]], [20, 26, G[3]]]);                                                     // earring
    comp(fig, hd, S[3]);
    // --- front hair: soft bangs swept to the back, one lock falling in front of the ear
    const ht = L48();
    blob(ht, [[14, 11], [16, 5.6], [22, 2.4], [29, 1.8], [35, 4], [37.4, 8.4], [36, 13], [33.5, 11], [30, 12.4], [27, 12.6], [24, 14.6], [21.5, 19], [19, 16]], H[2]);
    blob(ht, [[16, 9], [18.6, 5], [25, 2.6], [32, 3], [30, 6.2], [24, 7.4], [19.6, 10.4], [17, 13]], H[1], ht);
    blob(ht, [[30, 6.4], [34.4, 5.4], [37, 8.8], [35.6, 11.6], [32.4, 9.2]], H[1], ht);
    curve(ht, [[19, 7.4], [23, 4.6], [28.4, 3.6]], [2, 1], H[0], ht);
    curve(ht, [[32.6, 7.4], [35, 7.2]], 1, H[0], ht);
    curve(ht, [[36.4, 10.6], [31.4, 8.6], [26, 9], [21, 13]], [1.8, 1], H[3], ht);
    curve(ht, [[29, 5.4], [24, 7.8], [19.4, 12.4]], [1.4, 1], H[3], ht);
    lockShape(ht, [[23.2, 13], [21.6, 17], [21.4, 22], [22.6, 27]], 3.6, 1.6, H, { lit: 0.55, hi: [0.15, 0.4] });
    comp(fig, ht, H[4]);
    // --- flower crown: leaves along a thin vine, white and pink blossoms
    const fc = L48();
    curve(fc, [[15, 12], [20, 8.2], [27, 6], [34, 6.2]], 1, LF[3]);
    [[17, 10.4, -1], [22.4, 7.4, 1], [29.6, 6, -1], [34, 6.6, 1]].forEach(([x, y, d]) => { dots(fc, [[x, y, LF[1]], [x + 1, y + d * 0.8, LF[2]], [x - 1, y, LF[2]]]); });
    flower(fc, 19, 9, '#ffffff', '#e2dcf0', G[1]);
    flower(fc, 25, 6.5, '#ffd0e0', '#f090b4', G[1]);
    flower(fc, 31, 5.4, '#ffffff', '#e2dcf0', G[1]);
    flower(fc, 35.6, 7.6, '#ffd0e0', '#f090b4', G[1]);
    comp(fig, fc, OUT);
    clean(fig, [S, H, C]);
    const bg = bgBands(['#a6c6d4', '#86aac4', '#6a8cb0', '#50709a'], 26, 18, 19, 19);
    return finish(fig, bg, '#fff6d8', 0.35);
  }

  /* ---------- ZEUS: near-frontal, looking down, laurel of separate leaves, bolt at arm's length ---------- */
  // Laurel leaf maps (pointed ellipses ~2x4 at 30-45 degrees): light edge, two golds, dark underside.
  const LEAF = {
    ur: ['..yY', '.yGg', 'Gg..'],      // above the stem, tip to the right
    dr: ['Gy..', '.gGy', '..gG'],      // below the stem, tip to the right
    ul: ['Yy..', 'gGy.', '..gG'],
    dl: ['..yG', 'yGg.', 'Gg..']
  };
  function boltPath(p, pts, w, cols) {
    curve(p, pts, w + 2, cols[2]);
    curve(p, pts, w, cols[1]);
    curve(p, pts, 1, cols[0]);
  }
  function portraitZeus() {
    const S = R.skinGod, H = R.white, G = R.gold, B = R.bolt, RB = R.royal, C = R.cloth;
    const fig = L48();
    // --- mane: a wide white mass behind the head, wavy locks falling to the shoulders
    const hb = L48();
    blob(hb, [[12, 8], [18, 3], [26, 1.6], [34, 3.4], [39, 9], [40, 20], [39, 32], [35, 37], [14, 37], [9, 30], [8, 18]], H[3]);
    hairLocks(hb, [
      [[[16, 5], [11, 11], [10, 19], [12, 26], [9, 34]], 7, 4, H, { wave: 1.1, bias: 0.2, dark: 1 }],
      [[[19, 8], [15, 15], [15, 23], [16, 30], [14, 36]], 6, 4, H, { wave: 1.1, bias: 0.05, dark: 1 }],
      [[[34, 5], [37.5, 11], [37.5, 19], [36, 26], [37, 33]], 7, 4, H, { wave: -1.1, bias: -0.05, dark: 1 }],
      [[[31, 8], [34, 15], [34, 23], [33, 30], [34, 36]], 6, 4, H, { wave: -1.1, bias: -0.2, dark: 1 }]
    ], H, H[4]);
    comp(fig, hb, null);
    // --- body: white chiton, royal-blue himation over the near shoulder, gold clasp
    const bd = L48();
    blob(bd, [[1, 48, 1], [3, 41], [9, 36.5], [18, 35], [30, 35], [39, 36.5], [45, 41], [47, 48, 1]], C[1]);
    blob(bd, [[32, 36], [40, 37], [45, 42], [46.5, 48, 1], [37, 48, 1], [36, 42]], C[2], bd);
    fold(bd, [[34, 38], [37, 43], [39, 48]], [2.6, 1.6], C[3], C[0], bd);
    comp(fig, bd, C[4]);
    const hm = L48();
    blob(hm, [[0, 48, 1], [0.5, 41], [5, 36.5], [12, 35], [18, 36], [22, 40], [27, 48, 1]], RB[2]);
    blob(hm, [[1, 41], [5, 37.4], [11, 36], [15, 37.4], [10, 39.6], [5, 42], [2, 45]], RB[1], hm);
    curve(hm, [[4, 38.4], [9, 36.8], [13, 37.2]], 1, RB[0], hm);
    fold(hm, [[9, 40], [11, 44], [12, 48]], [3, 2], RB[3], null, hm);
    fold(hm, [[16, 40], [19, 44], [21, 48]], [2.4, 1.6], RB[3], RB[1], hm);
    curve(hm, [[18, 36.4], [22, 40.4], [27, 48]], 1, G[1], hm);                   // gold border
    comp(fig, hm, C[4]);
    art(fig, 15, 36, ['.yG.', 'yY*G', 'GYGg', '.gg.'], LG({ '*': '#ffffff' }, ['yYGg', [G[0], G[1], G[2], G[3]]]), 'clasp');
    // --- head: near-frontal, broad forehead, heavy brow ridge shading the sockets
    const hd = L48();
    blob(hd, [[18, 6], [25, 4.6], [32, 6], [34.2, 11], [34, 18.5], [32, 23], [25, 24.5], [18.6, 23], [16.2, 18.5], [16, 11]], S[1]);
    blob(hd, [[17, 7.6], [23, 5.6], [28, 6.6], [26, 9.6], [20, 11], [17, 11]], S[0], hd);                 // lit forehead
    blob(hd, [[31, 8], [34.4, 11], [34.2, 19], [32, 22.6], [30.6, 19], [31, 12]], S[2], hd);              // turning plane
    blob(hd, [[17.4, 13.4], [23.6, 12.8], [25, 14], [26.6, 12.8], [31.4, 13.2], [31.6, 15.8], [28, 16.2], [26.4, 15], [24, 16.2], [18.2, 15.8]], S[2], hd); // sockets
    const E = faceLG(S, { L: '#40263a', J: '#2c4a86', j: '#8cc4f6', B: H[2], b: H[1], a: H[0], h: S[0], n: S[4], q: S[2] });
    // heavy white brows angled down to the centre (stern), eyes lowered: he looks down on you
    art(hd, 16, 10, ['abb....', 'bBBBb..', '.33BBB.', '...333.'], E, 'brow-l');
    art(hd, 27, 10, ['....bba', '..bBBBb', '.BBB33.', '.333...'], E, 'brow-r');
    art(hd, 18, 14, ['.LLLL.', 'LwJ*wL', '..jj..', '.hhhh.'], E, 'eye-l');
    art(hd, 27, 14, ['.LLLL', 'LwJ*w', '..jj.', '.hhh.'], E, 'eye-r');
    art(hd, 24, 12, ['.0..', '.02.', '.02.', '.012', '2012', '2002', 'n22n', '.nn.'], E, 'nose');
    comp(fig, hd, S[3]);
    // --- mustache + beard: 6 S-curved locks tapering to separate points
    const bdr = L48();
    blob(bdr, [[17, 21], [22, 22.4], [25.6, 22], [29, 22.4], [34, 21], [35, 28], [33, 36], [28, 42], [25, 44], [21, 40], [16, 32], [15.6, 26]], H[2]);
    hairLocks(bdr, [
      [[[18.6, 23], [15.6, 28], [18.6, 33], [15.8, 39]], 6, 1, H, { wave: 1.2, bias: 0.3 }],
      [[[32.4, 23], [34.6, 28], [32, 33], [33.6, 39]], 5.6, 1, H, { wave: 1.2, bias: -0.25 }],
      [[[22.4, 24], [19.8, 30], [23.4, 36], [20.6, 43]], 6.4, 1, H, { wave: 1.2, bias: 0.15 }],
      [[[28.6, 24], [30.4, 30], [27.6, 36], [29.6, 43]], 6, 1, H, { wave: 1.2, bias: -0.1 }],
      [[[25.4, 25], [27.4, 31], [24, 38], [25.6, 46.4]], 6, 1, H, { wave: 1.2, bias: 0.05 }]
    ], H);
    const mu = L48();
    lockShape(mu, [[25.4, 20.6], [21, 21.4], [18, 24], [17, 28]], 3.4, 1.2, H, { lit: 0.6, hi: [0.1, 0.4] });
    lockShape(mu, [[26.6, 20.6], [30.4, 21.4], [33, 24], [33.6, 28]], 3.4, 1.2, H, { lit: 0.4, hi: [0.1, 0.35] });
    comp(bdr, mu, H[3]);
    art(bdr, 24, 23, ['.nn.', 'nqqn'], LG({ n: '#8a3a4a', q: '#c0606a' }), 'lip');
    comp(fig, bdr, H[3]);
    // --- hair on the crown, pushed back so the forehead stays open
    const ht = L48();
    blob(ht, [[14, 9], [16, 3.6], [22, 1], [30, 1.2], [35, 4.2], [36, 9], [33.6, 7], [30, 5.4], [25, 5], [20, 5.6], [16.6, 8]], H[2]);
    blob(ht, [[16, 6.6], [19, 2.8], [26, 1.4], [30, 2.4], [25, 3.8], [19, 5.4]], H[1], ht);
    curve(ht, [[18.6, 4], [23, 2.4], [27, 2.2]], 1, H[0], ht);
    comp(fig, ht, H[4]);
    // --- laurel crown: separate pointed leaves alternating above/below a curved stem,
    //     pointing to the front where the two branches meet
    const lc = L48(), GL = LG({}, ['YyGg', [G[0], G[1], G[2], G[3]]]);
    curve(lc, [[14.6, 9.4], [19, 6.4], [25, 5.4], [31, 6.4], [35.4, 9.4]], 1, G[3]);
    art(lc, 14, 5, LEAF.ur, GL, 'leaf'); art(lc, 14, 9, LEAF.dr, GL, 'leaf');
    art(lc, 18, 3, LEAF.ur, GL, 'leaf'); art(lc, 19, 7, LEAF.dr, GL, 'leaf');
    art(lc, 22, 2, LEAF.ur, GL, 'leaf');
    art(lc, 26, 2, LEAF.ul, GL, 'leaf');
    art(lc, 30, 3, LEAF.ul, GL, 'leaf'); art(lc, 29, 7, LEAF.dl, GL, 'leaf');
    art(lc, 34, 5, LEAF.ul, GL, 'leaf'); art(lc, 34, 9, LEAF.dl, GL, 'leaf');
    dots(lc, [[25, 4, G[0]], [24, 5, G[1]], [25, 5, G[2]], [26, 5, G[3]]]);
    comp(fig, lc, G[4]);
    // --- fist and thunderbolt held out to the right, clear of the face
    const bl = L48();
    boltPath(bl, [[44, 0], [40, 8], [44.4, 11], [39.6, 21], [42.6, 23], [38.6, 33]], 1.4, [B[0], B[2], B[3]]);
    const fist = L48();
    art(fist, 36, 26, [
      '..0011.',
      '.001112',
      '0111122',
      '3322233',
      '0111122',
      '3322233',
      '.11122.',
      '.GGGGG.',
      '.ggggg.'
    ], LG({ G: G[1], g: G[3] }, ['0123', S]), 'fist');
    comp(bl, fist, S[3]);
    clean(fig, [S, H, C, RB]);
    rim(fig, '#ffe08a', 0.55, 0, 48, { [G[1]]: 1 }, (x) => x > 28);
    comp(fig, bl, null);
    // --- storm background with the bolt's glow (dithered only at its fringe)
    const bg = bgBands(['#4c4a8c', '#3c3a78', '#2e2c62', '#221f4c'], 24, 18, 20, 20);
    glow(bg, [[44, 0], [40, 8], [44, 11], [40, 21], [42, 23], [39, 33]], '#ffd46a', 12, 0.9);
    return finish(fig, bg, null);
  }

  /* ---------- HERMES: half profile, chin up, winged helmet, lopsided grin, caduceus ---------- */
  // Wing of 3-4 feathers fanning from a root; each feather is a tapered stroke with a lit edge.
  function wing(p, root, tips, F, w) {
    tips.forEach((tp, i) => {
      const mid = [lerp(root[0], tp[0], 0.5) + (tp[2] || 0), lerp(root[1], tp[1], 0.5) - (tp[3] || 0)];
      curve(p, [root, mid, [tp[0], tp[1]]], [w || 2.6, 1], i === 0 ? F[1] : i === tips.length - 1 ? F[3] : F[2]);
      curve(p, [[root[0], root[1] - 0.8], [mid[0], mid[1] - 0.8], [tp[0], tp[1]]], 1, i === tips.length - 1 ? F[2] : F[0]);
    });
    return p;
  }
  // Caduceus: gold rod, two snakes as 2-px S-curves crossing twice, heads facing the wings.
  function caduceus(p, x, y0, y1, big) {
    const G = R.gold, SN = R.snake, F = R.feather;
    const rod = new O.Pix(p.w, p.h);
    poly(rod, [[x - 1, y0 + 4], [x + 1, y0 + 4], [x + 1, y1], [x - 1, y1]], G[2]);
    poly(rod, [[x - 1, y0 + 4], [x, y0 + 4], [x, y1], [x - 1, y1]], G[1]);
    ell(rod, x, y0 + 3, 1.8, 1.8, (xx, yy) => (xx + yy < x + y0 + 3 ? G[0] : G[2]));
    wing(rod, [x - 1, y0 + 4.4], [[x - 6, y0 + 0.4, 0, 1], [x - 6.4, y0 + 3.4], [x - 5, y0 + 6]], F, 2);
    wing(rod, [x + 1, y0 + 4.4], [[x + 6, y0 + 0.4, 0, 1], [x + 6.4, y0 + 3.4], [x + 5, y0 + 6]], F, 2);
    comp(p, rod, OUT);
    // hand-placed coils: 2-px snakes crossing twice, 3x2 heads with the eye facing the wings
    const sn = new O.Pix(p.w, p.h);
    const lg = { s: SN[1], S: SN[2], k: SN[2], K: SN[3], e: '#1b1426', y: G[1], G: G[2] };
    art(sn, x - 6, y0 + 7, big ? [
      '.ss.......kk.',
      'sSSe.....eKKk',
      '..sS.....Kk..',
      '...sS...Kk...',
      '....sSyKk....',
      '.....KSS.....',
      '....kKySs....',
      '...kK.y.Ss...',
      '..kK..y..Ss..',
      '..kK..y..Ss..',
      '...kK.y.Ss...',
      '....kKySs....',
      '.....SSK.....',
      '....sSyKk....',
      '...sS.y.Kk...',
      '..sS..y..Kk..',
      '..sS..y..Kk..',
      '...sSSyKKk...'
    ] : [
      'ss.....kk',
      'sSe...eKk',
      '.sS...Kk.',
      '..sSyKk..',
      '...KSS...',
      '..kKySs..',
      '.kK.y.Ss.',
      '..kKySs..',
      '...SSK...',
      '..sSyKk..',
      '.sS.y.Kk.',
      '..sSyKk..'
    ], lg, 'caduceus-coils');
    comp(p, sn, SN[4]);
    return p;
  }
  function portraitHermes() {
    const S = R.skin, H = R.chestnut, G = R.gold, F = R.feather, SK = R.sky, OC = R.ochre;
    const fig = L48();
    // --- curls at the nape under the helmet
    const hb = L48();
    blob(hb, [[14, 12], [22, 11], [23, 20], [22, 27], [17, 29], [12, 25], [11, 18]], H[2]);
    hairLocks(hb, [
      [[[16, 13], [13, 18], [15, 22], [13, 27]], 5, 2, H, { wave: 1.1, bias: 0.1 }],
      [[[21, 14], [18, 19], [20, 24], [18, 28.6]], 5, 2, H, { wave: 1.1, bias: 0 }]
    ], H);
    comp(fig, hb, null);
    // --- body: light-blue chiton, ochre chlamys pinned on the near shoulder with folds from the pin
    const bd = L48();
    blob(bd, [[6, 48, 1], [8, 42], [14, 38], [22, 36.6], [31, 37], [38, 39], [42, 43], [44, 48, 1]], SK[1]);
    blob(bd, [[31, 38.6], [37, 39.6], [41.6, 44], [43, 48, 1], [35, 48, 1], [34, 43]], SK[2], bd);
    fold(bd, [[24, 41], [27, 45], [28, 48]], [2.6, 1.8], SK[2], SK[0], bd);
    fold(bd, [[34, 41], [36, 44.6], [38, 48]], [2.4, 1.6], SK[3], null, bd);
    comp(fig, bd, SK[4]);
    const ck = L48();
    blob(ck, [[0, 48, 1], [0, 42], [4, 38], [11, 36], [18, 37], [21, 40], [18, 44], [15, 48, 1]], OC[2]);
    blob(ck, [[1, 41.6], [4.6, 38.4], [11, 36.8], [15.6, 38], [11, 40], [5, 42.6], [1.6, 45.6]], OC[1], ck);
    curve(ck, [[4, 39.4], [9, 37.4], [13, 37.8]], 1, OC[0], ck);
    fold(ck, [[16, 40], [12, 44], [9, 48]], [3, 2], OC[3], null, ck);
    fold(ck, [[17, 42], [16, 45], [15, 48]], [2, 1.4], OC[3], null, ck);
    fold(ck, [[7, 43], [4, 46], [3, 48]], [2.4, 1.6], OC[3], OC[1], ck);
    comp(fig, ck, SK[4]);
    art(fig, 17, 38, ['.yG.', 'yY*G', 'GYGg', '.gg.'], LG({ '*': '#ffffff' }, ['yYGg', [G[0], G[1], G[2], G[3]]]), 'pin');
    // --- neck: chin up, so the throat is long and lit, set back behind the jaw
    const nk = L48();
    poly(nk, [[21, 26], [30, 30], [32, 34], [33, 39.4], [22, 39.4]], S[1]);
    poly(nk, [[27, 30], [32, 32], [33, 39.4], [29, 39.4]], S[2], nk);
    blob(nk, [[21, 26], [26, 28.6], [32, 30.6], [31, 32.6], [26, 31.4], [22, 29.4]], S[3], nk);
    comp(fig, nk, S[4]);
    // --- head: half profile, chin raised, straight nose, open cheerful face
    const hd = L48();
    blob(hd, [[24, 8], [31, 9], [35, 12.6], [36, 17.4], [36.4, 19, 1], [35.6, 20.4], [37, 22.6], [38.4, 24.2, 1], [36.6, 25, 1], [36.8, 26.4], [36.2, 27.2], [36.6, 28.4], [36, 30.4], [33.4, 31.6], [28, 30.4], [23.6, 27.6], [21, 24], [20.4, 17], [21, 10]], S[1]);
    blob(hd, [[22, 12], [30, 11], [33, 14], [30, 17], [24, 17.6], [21.6, 16]], S[0], hd);
    blob(hd, [[21.6, 23.4], [24, 26.6], [28, 28.6], [33, 29.8], [35.6, 29.6], [33.6, 31.8], [28, 30.8], [23.6, 28], [21.2, 25]], S[2], hd);
    blob(hd, [[33.8, 25], [37, 25.2], [36.6, 26.2], [34.4, 26.2]], S[2], hd);
    blob(hd, [[32.4, 19.4], [35.8, 19.6], [35.6, 21.6], [33.6, 21.6]], S[2], hd);
    art(hd, 21, 18, ['.01.', '0122', '0132', '0122', '.12.'], faceLG(S), 'ear');
    const E = faceLG(S, { L: '#40202a', B: H[3], b: H[2], J: '#6a3c2a', j: '#b8804a', h: S[0], m: '#7a3040', n: S[3], k: '#f4a08a', d: S[2] });
    art(hd, 28, 16, ['.bBBB', 'b....'], E, 'brow');
    art(hd, 35, 17, ['bB'], E, 'brow-far');
    // eye line ~45% down the face; lively near eye, far eye just a sliver at the profile
    art(hd, 28, 18, [
      '.LLLL.',
      'LwJ*w.',
      '.wJjw.',
      '..hh..'
    ], E, 'eye');
    art(hd, 35, 18, ['L', 'J'], E, 'eye-far');
    art(hd, 35, 21, ['0', '0', '.', 'n'], E, 'nose');
    // closed lopsided grin rising to the right, dimple at the high corner, small warm blush
    art(hd, 31, 26, ['...md', 'mmm..', '.nn..'], E, 'grin');
    art(hd, 28, 23, ['kk'], E, 'blush');
    comp(fig, hd, S[3]);
    // --- fringe curls under the brim
    const fr = L48();
    hairLocks(fr, [
      [[[34, 12], [36, 14], [35, 16]], 3, 1.2, H, { lit: 0.5, hi: [0.1, 0.5] }],
      [[[29, 12], [31, 14.4], [30, 16]], 3, 1.2, H, { lit: 0.5, hi: [0.1, 0.5] }],
      [[[24, 12], [22.6, 15], [23, 18]], 3.4, 1.4, H, { lit: 0.5, hi: [0.2, 0.5] }]
    ], H);
    comp(fig, fr, H[4]);
    // --- winged petasos helmet: gold dome and brim, feathered wing sweeping up and back
    const hm = L48();
    // close-fitting rounded cap (no hard-hat brim), rolled rim with an engraved band
    blob(hm, [[18.4, 14.4], [18.4, 8.6], [22.6, 5], [28.6, 4.2], [33.6, 6.4], [36.6, 10.4], [37.4, 13.2], [30, 12.6], [24, 13.2]], G[2]);
    blob(hm, [[19.6, 11.4], [20.6, 8], [24.4, 5.6], [28.6, 5.2], [26, 7.6], [22, 10.6]], G[1], hm);
    curve(hm, [[21.4, 8.4], [24.4, 6.2]], 1, G[0], hm);
    blob(hm, [[31.4, 6.8], [35.2, 9.6], [36.6, 12.4], [33, 11.4]], G[3], hm);
    curve(hm, [[18.4, 13.6], [24, 12.4], [30, 11.8], [37.4, 12.4]], [2, 2], G[2], hm);
    curve(hm, [[18.6, 12.8], [24, 11.6], [30, 11], [36.6, 11.6]], 1, G[1]);
    curve(hm, [[19, 14.6], [24, 13.4], [30, 12.8], [37.6, 13.4]], 1, G[3]);
    comp(fig, hm, OUT);
    const wg = L48();
    wing(wg, [19, 9], [[6, 1, 1, 2], [5, 5.4, 0, 1], [7, 9.4], [10, 12]], F, 3);
    wing(wg, [34, 6], [[38, 0.6, 0, 1], [40.4, 2.8]], F, 2);
    comp(fig, wg, OUT);
    // --- caduceus resting on the far shoulder
    const cd = L48();
    caduceus(cd, 42, 3, 48, true);
    comp(fig, cd, OUT);
    clean(fig, [S, H, SK, OC]);
    const bg = bgBands(['#bfe6ff', '#93cdf6', '#6eaee8', '#548cd2'], 26, 16, 20, 20, (p) => {
      // two soft cloud puffs low in the sky
      ell(p, 6, 30, 7, 3, '#e6f6ff'); ell(p, 11, 28.6, 5, 3, '#f4fbff');
      ell(p, 43, 38, 6, 2.6, '#d8efff');
    });
    return finish(fig, bg, '#fff2c4', 0.35);
  }

  /* ---------- HADES: chin lowered, glowing eyes looking up, iron crown with ghost flames ---------- */
  // Ghost flame: a teardrop tongue, violet rim, cyan body, white core; lean bends the tip.
  function ghostFlame(p, x, y, h, w, lean) {
    const FL = R.flame;
    // S-shaped tongue: belly swings against the lean, the tip whips with it
    blob(p, [[x - w / 2, y], [x - w * 0.55 - lean * 0.3, y - h * 0.35], [x - w * 0.2 - lean * 0.2, y - h * 0.62], [x + lean, y - h, 1], [x + w * 0.3 - lean * 0.1, y - h * 0.55], [x + w * 0.5, y - h * 0.25], [x + w / 2, y]], FL[3]);
    blob(p, [[x - w * 0.3, y], [x - w * 0.35 - lean * 0.2, y - h * 0.35], [x + lean * 0.6, y - h * 0.78, 1], [x + w * 0.25, y - h * 0.35], [x + w * 0.3, y]], FL[2]);
    curve(p, [[x - 0.2, y - 0.4], [x - lean * 0.1, y - h * 0.3], [x + lean * 0.3, y - h * 0.5]], 1, FL[1]);
    curve(p, [[x - 0.2, y - 0.4], [x, y - h * 0.2]], 1, FL[0]);
    return p;
  }
  function portraitHades() {
    const S = R.skinHades, H = R.hadesHair, IR = R.iron, VI = R.violet, FL = R.flame;
    const fig = L48();
    // --- ghost flames rising from the crown (drawn first: the crown band overlaps their roots)
    const fl = L48();
    ghostFlame(fl, 18.4, 11, 9, 4.4, -2.2);
    ghostFlame(fl, 22.6, 10.4, 11.4, 4.8, -1.2);
    ghostFlame(fl, 27.2, 10, 11.6, 5, 1.2);
    ghostFlame(fl, 31.8, 10.6, 9.4, 4.4, 2.4);
    comp(fig, fl, null);
    // --- long black hair falling behind the shoulders, cool violet sheen
    const hb = L48();
    blob(hb, [[13, 8], [22, 6], [30, 7], [26, 14], [23, 22], [22, 32], [20, 42], [18, 48, 1], [2, 48, 1], [4, 36], [6, 22], [8, 12]], H[2]);
    hairLocks(hb, [
      [[[15, 9], [10, 16], [9, 26], [6, 36], [5, 48]], 7, 4, H, { wave: 1, bias: 0.15 }],
      [[[20, 10], [15, 18], [14, 28], [12, 38], [11, 48]], 7, 4, H, { wave: 1, bias: 0.05 }],
      [[[24, 14], [20, 22], [19.4, 32], [17, 42], [17, 48]], 5, 3, H, { wave: 1, bias: -0.1 }]
    ], H, H[4]);
    comp(fig, hb, null);
    // --- body: dark violet robe, high iron collar and pauldron
    const bd = L48();
    blob(bd, [[8, 48, 1], [10, 42], [16, 38.6], [24, 37.4], [33, 37.6], [40, 40], [44, 44], [46, 48, 1]], VI[2]);
    blob(bd, [[32, 39], [39, 41], [43.6, 45], [45, 48, 1], [36, 48, 1], [35, 44]], VI[3], bd);
    fold(bd, [[26, 41], [28, 45], [29, 48]], [2.6, 1.8], VI[3], VI[1], bd);
    fold(bd, [[20, 42], [20, 45], [19, 48]], [2, 1.4], VI[3], null, bd);
    comp(fig, bd, VI[4]);
    const ir = L48();
    blob(ir, [[0, 48, 1], [0, 42], [3, 38], [10, 36], [16, 37], [19, 40], [17, 44], [14, 48, 1]], IR[2]);
    blob(ir, [[1, 41.4], [4, 38.4], [10, 36.8], [14, 37.8], [9, 39.6], [4, 42], [1.6, 45]], IR[1], ir);
    curve(ir, [[3.6, 39.4], [8, 37.6], [11.6, 37.8]], 1, IR[0], ir);
    curve(ir, [[2, 44.6], [8, 41.6], [15, 41.4]], [2, 1.4], IR[3], ir);             // lamellae
    curve(ir, [[1, 47.6], [8, 45], [14, 45]], [2, 1.4], IR[3], ir);
    comp(fig, ir, OUT);
    // high collar standing up behind the neck
    const cl = L48();
    poly(cl, [[18, 38], [20, 31], [23, 30], [24, 38.6]], IR[2]);
    poly(cl, [[31, 38], [32.6, 33], [35, 33.4], [36, 38.8]], IR[3]);
    curve(cl, [[20.6, 31.4], [19, 37.6]], 1, IR[1]);
    // --- neck: narrow (60% of the jaw), in deep shadow under the lowered chin
    const nk = L48();
    poly(nk, [[23, 27], [30, 31], [31.6, 35], [32, 39], [23.4, 39]], S[2]);
    blob(nk, [[22, 27], [27, 30], [32, 32], [31.6, 34.6], [27, 33], [23, 31]], S[3], nk);
    comp(fig, nk, S[4]);
    comp(fig, cl, OUT);
    // --- head: long gaunt face, chin lowered, hollow cheeks, straight nose with a nostril notch
    const hd = L48();
    blob(hd, [[24, 9], [31, 10], [34, 13.4], [34.6, 17.6], [34.9, 19.2, 1], [34.1, 21], [35, 23.2], [36.2, 26, 1], [34.6, 26.8, 1], [34.9, 28], [34.2, 29], [34.4, 30.4], [33.4, 32.4], [30.6, 33.6], [27.4, 32.6], [23.6, 29.6], [21.6, 25], [21, 18], [21.6, 11]], S[1]);
    blob(hd, [[22.4, 12.4], [27, 12], [29.4, 13.4], [27, 15.4], [23.4, 15.6]], S[0], hd);                   // lit brow
    blob(hd, [[23.6, 24], [27, 25.4], [31.4, 25.6], [33, 28], [30, 29.4], [26, 28.6], [23, 27.2]], S[2], hd);    // hollow under the cheekbone
    blob(hd, [[22, 26], [25, 30], [29, 32.4], [33, 32], [32, 34], [27.6, 33.6], [23.4, 30.4]], S[3], hd);         // jaw plane
    blob(hd, [[30.4, 18.6], [34.6, 18.4], [34.4, 21.4], [32.6, 22], [30.8, 21.2]], S[3], hd);                     // deep sockets
    blob(hd, [[24.4, 18.8], [29.4, 18.4], [29.6, 20.6], [25, 21]], S[2], hd);
    blob(hd, [[33, 26.2], [36, 26.2], [35.2, 27.2], [33.6, 27.4]], S[3], hd);
    art(hd, 21, 20, ['.12.', '1233', '1243', '1233', '.23.'], faceLG(S), 'ear');
    const E = faceLG(S, { L: '#1c1430', B: H[3], b: H[2], n: S[4], q: S[3], c: '#8ff0ff', C: '#3fb8e8', W: '#ffffff', m: '#3a2448', g: H[2] });
    // heavy brows slanting down to the nose; eyes looking UP from under them, burning cyan
    art(hd, 24, 16, ['bb....', '.BBBB.', '...BBB'], E, 'brow-near');
    art(hd, 31, 17, ['.bB', 'BB.'], E, 'brow-far');
    art(hd, 25, 19, ['LLLL.', 'LWcCL', '.CC..'], E, 'eye-near');
    art(hd, 32, 19, ['LLL', 'Wc.', 'C..'], E, 'eye-far');
    art(hd, 34, 22, ['1', '1', 'q', 'n'], E, 'nose');
    art(hd, 31, 28, ['mmmm', 'q..q'], E, 'mouth');
    // short pointed goatee
    art(hd, 30, 30, ['.gggg', 'gBBBg', '.gBB.', '..B..'], E, 'goatee');
    comp(fig, hd, S[4]);
    // --- hair framing the face, parted, falling in front of the ear
    const ht = L48();
    blob(ht, [[18, 13], [20, 9], [26, 7.6], [32, 8.6], [35, 11.4], [30, 11], [25, 12.6], [22.6, 16], [22.6, 24], [21, 28], [18.6, 22]], H[2]);
    lockShape(ht, [[24, 12], [21.4, 17], [21.2, 23], [22.6, 28]], 3.6, 1.4, H, { wave: 1, bias: 0.1 });
    curve(ht, [[20.6, 11], [25, 9], [30, 9]], 1, H[0], ht);
    comp(fig, ht, H[4]);
    // --- iron crown: band with spikes, dark metal lit by the flames
    const cr = L48();
    poly(cr, [[17.4, 13.6], [18, 10], [26, 8.6], [34.6, 10], [35, 13], [26, 11.8]], IR[2]);
    [[18, 10, 8], [22, 9.2, 5.6], [26.4, 8.6, 5], [30.6, 9, 5.4], [34.2, 10, 7.4]].forEach(([x, y, t]) => poly(cr, [[x - 1.2, y + 0.6], [x, t], [x + 1.2, y + 0.6]], IR[2]));
    curve(cr, [[18, 10.6], [26, 9.2], [34.4, 10.6]], 1, IR[1], cr);
    curve(cr, [[18, 12.8], [26, 11.4], [34.6, 12.4]], 1, IR[3], cr);
    [[22, 10.4], [30.6, 10.6]].forEach(([x, y]) => dots(cr, [[x, y, '#8ff0ff']]));        // soul gems
    dots(cr, [[26, 10, '#ffffff'], [25, 10, FL[2]], [27, 10, FL[2]]]);
    comp(fig, cr, OUT);
    clean(fig, [S, H, VI, IR]);
    // cyan rim light from the flames on the right edge of the face and neck
    rim(fig, '#7ae6ff', 0.55, 12, 40, { '#ffffff': 1 }, (x) => x > 28);
    const bg = bgBands(['#34305c', '#282448', '#1e1a38', '#15122a'], 26, 16, 20, 20);
    glow(bg, [[17, 4], [22, 1], [27, 1], [32, 3]], '#6ad8ff', 11, 0.7);
    return finish(fig, bg, null, 0, '#0c0a16');
  }

  /* ---------- ELDER: bald dome, wispy side locks, long beard, kind creased eyes, staff ---------- */
  function portraitElder() {
    const S = R.skinOld, H = R.white, W = R.wool, WD = R.wood, C = R.ivory;
    const fig = L48();
    // --- staff behind the far shoulder
    const st = L48();
    poly(st, [[40, 8], [42.4, 8], [43.4, 48], [41, 48]], WD[2]);
    poly(st, [[40, 8], [41, 8], [42, 48], [41, 48]], WD[1]);
    blob(st, [[38.6, 6], [40.4, 3.4], [43.4, 3.6], [44.4, 6.6], [42.6, 9], [39.6, 8.6]], WD[2]);
    blob(st, [[39.2, 5.6], [40.6, 4], [42.6, 4.2], [41, 6.2]], WD[1], st);
    dots(st, [[41, 20, WD[3]], [42, 21, WD[3]], [42, 33, WD[3]], [41, 34, WD[3]]]);                  // knots
    comp(fig, st, null);
    // --- body: brown wool himation over an ivory chiton, folds from the near shoulder
    const bd = L48();
    blob(bd, [[4, 48, 1], [6, 42], [12, 38], [20, 36.4], [30, 36.4], [38, 38.4], [44, 43], [46, 48, 1]], C[1]);
    blob(bd, [[31, 38], [38, 39.4], [43, 43.6], [45, 48, 1], [36, 48, 1], [35, 43]], C[2], bd);
    comp(fig, bd, C[4]);
    const hm = L48();
    blob(hm, [[0, 48, 1], [0, 43.4], [4, 40], [10, 37.6], [17, 36.6], [22, 38], [27, 41.6], [33, 48, 1]], W[2]);
    blob(hm, [[0.6, 43.4], [4.4, 40.6], [10, 38.4], [16, 37.6], [11, 40.4], [5.4, 43], [1.4, 46]], W[1], hm);
    curve(hm, [[3.4, 41.4], [8, 39], [13, 38]], 1, W[0], hm);
    fold(hm, [[12, 41], [15, 45], [16, 48]], [3, 2], W[3], null, hm);
    fold(hm, [[20, 40], [24, 44], [26, 48]], [2.6, 1.6], W[3], W[1], hm);
    fold(hm, [[5, 43], [4, 46], [4, 48]], [2.4, 1.6], W[3], null, hm);
    comp(fig, hm, W[4]);
    // --- neck (mostly hidden by the beard)
    const nk = L48();
    poly(nk, [[22, 27], [30, 31], [31, 38], [22, 38]], S[2]);
    comp(fig, nk, S[4]);
    // --- side hair: three wispy locks behind the ear with white tips (behind the head layer)
    const sh = L48();
    hairLocks(sh, [
      [[[22, 10], [18.4, 13.6], [17.2, 18.6], [18.4, 24]], 4, 1, H, { wave: 1, bias: 0.25 }],
      [[[22, 14], [19.6, 18.6], [19.6, 23.4], [21.4, 28]], 3.6, 1, H, { wave: 1, bias: 0.1 }],
      [[[21.4, 9], [17.4, 10.6], [15.6, 14.6]], 3.2, 1, H, { wave: 1, bias: 0.3 }]
    ], H, H[3]);
    [[18, 23], [21, 27], [15, 14]].forEach(([x, y]) => sh.get(x, y) && sh.set(x, y, H[0]));
    comp(fig, sh, null);
    // --- head: 3/4, forward stoop, bald dome (smaller), big kind nose
    const hd = L48();
    blob(hd, [[25, 6], [31, 7], [34.6, 11], [35.4, 16], [35.6, 18.2, 1], [34.8, 20], [35.8, 22], [37.6, 24.6, 1], [36, 26.2, 1], [34, 26.8], [33.6, 30], [30, 32], [25, 31], [21.6, 27], [20.6, 20], [21, 12], [22.4, 8]], S[1]);
    blob(hd, [[22, 10], [25, 6.8], [30, 7.4], [28, 10.4], [24, 12.6], [22, 13]], S[0], hd);                      // shiny dome
    dots(hd, [[25, 8, '#ffffff'], [26, 8, S[0]]]);
    blob(hd, [[31, 8.6], [34.8, 12], [35.4, 17], [33, 16.4], [32, 12]], S[2], hd);
    blob(hd, [[30.4, 18.6], [34.8, 18.4], [34.6, 21], [32.6, 21.6], [30.8, 21]], S[2], hd);
    blob(hd, [[33.2, 24.6], [36.4, 24.8], [36, 26.4], [33.6, 26.4]], S[2], hd);
    const E = faceLG(S, { L: '#3a2436', B: H[1], b: H[0], a: H[2], J: '#4a3a2a', j: '#8a6a44', h: S[0], n: S[3], q: S[2], k: '#f2a08c' });
    // forehead creases, crow's feet: short curves only (no long lines)
    curve(hd, [[26, 13.2], [28, 12.6], [30, 13]], 1, S[2]);
    curve(hd, [[27, 15], [29.6, 14.6]], 1, S[2]);
    art(hd, 20, 18, ['.01.', '0122', '0132', '0132', '0122', '.12.'], E, 'ear');
    // bushy white brows with a soft, raised shape; eyes creased into a smile
    art(hd, 25, 15, ['.bbBa', 'bBBBa'], E, 'brow-near');
    art(hd, 32, 15, ['bBa', 'BB.'], E, 'brow-far');
    art(hd, 25, 18, ['.LLLL.', 'LwJ*wL', '.wjjw.', 'q.hh..'], E, 'eye-near');
    art(hd, 32, 18, ['LLL.', 'J*w.', 'jj..'], E, 'eye-far');
    art(hd, 34, 21, ['0.', '01', '001'], E, 'nose');
    art(hd, 29, 22, ['kk'], E, 'cheek');
    comp(fig, hd, S[3]);
    // --- moustache + long beard: S-locks, lighter towards the tips, pointed ends
    const br = L48();
    blob(br, [[23, 26], [28, 27.6], [33, 26.8], [36, 28.4], [36, 34], [33, 42], [29, 48, 1], [24, 48, 1], [22, 40], [21, 32]], H[2]);
    hairLocks(br, [
      [[[24, 27], [22, 33], [24.6, 39], [23, 47]], 5.6, 1.4, H, { wave: 1.1, bias: 0.25 }],
      [[[34.6, 28], [35.4, 33], [33, 38], [34, 43]], 5, 1.2, H, { wave: 1.1, bias: -0.2 }],
      [[[27.6, 28], [26.4, 34], [29, 40], [27, 48]], 5.6, 1.4, H, { wave: 1.1, bias: 0.1 }],
      [[[31, 28], [31.6, 34], [29.6, 40], [31, 47]], 5.4, 1.4, H, { wave: 1.1, bias: -0.05 }]
    ], H);
    const mu = L48();
    lockShape(mu, [[33.6, 26.2], [29, 27], [26, 29.6], [24.6, 32.4]], 3.4, 1.2, H, { lit: 0.6, hi: [0.1, 0.4] });
    lockShape(mu, [[34.6, 26.4], [36, 28], [36.4, 30.6]], 2.6, 1.2, H, { lit: 0.4, hi: [0.1, 0.35] });
    comp(br, mu, H[3]);
    comp(fig, br, H[3]);
    // --- gnarled hand on the staff at the lower right
    const hn = L48();
    art(hn, 38, 38, [
      '.0011.',
      '001112',
      '322233',
      '011122',
      '322233',
      '.1122.'
    ], LG({}, ['0123', S]), 'hand');
    comp(fig, hn, S[4]);
    clean(fig, [S, H, W, C]);
    const bg = bgBands(['#e0b884', '#c89868', '#a87852', '#86583e'], 27, 18, 19, 19);
    return finish(fig, bg, '#fff0d0', 0.3);
  }

  /* ---------- MERCHANT: plump market woman, terracotta headscarf, smile lines, jar of ambrosia ---------- */
  function jar(p, x, y, CL, big) {
    // clay amphora: lip, neck, handle, round belly with a painted band and a highlight
    const J = new O.Pix(p.w, p.h);
    if (big) {
      blob(J, [[x - 5.4, y + 8], [x - 5, y + 3.6], [x - 2.4, y + 1], [x + 2.4, y + 1], [x + 5, y + 3.6], [x + 5.4, y + 8], [x + 3.6, y + 13], [x + 1, y + 15], [x - 1, y + 15], [x - 3.6, y + 13]], CL[2]);
      blob(J, [[x - 4.6, y + 6], [x - 3.4, y + 2.6], [x - 1, y + 1.8], [x - 1.4, y + 5], [x - 3, y + 9], [x - 4.4, y + 9]], CL[1], J);
      dots(J, [[x - 3, y + 3, CL[0]], [x - 3, y + 4, CL[0]], [x - 4, y + 5, CL[0]]]);
      blob(J, [[x + 2, y + 9], [x + 5, y + 7], [x + 4, y + 12], [x + 1, y + 14.4], [x - 1, y + 14]], CL[3], J);
      curve(J, [[x - 5, y + 7.4], [x, y + 8.4], [x + 5.2, y + 7.4]], 1, '#1e1a2e', J);             // black-figure band
      curve(J, [[x - 5, y + 6.4], [x, y + 7.4], [x + 5.2, y + 6.4]], 1, CL[0], J);
      poly(J, [[x - 1.6, y - 3], [x + 1.6, y - 3], [x + 1.6, y + 1.4], [x - 1.6, y + 1.4]], CL[2]);
      poly(J, [[x - 1.6, y - 3], [x - 0.4, y - 3], [x - 0.4, y + 1.4], [x - 1.6, y + 1.4]], CL[1]);
      poly(J, [[x - 2.8, y - 4.4], [x + 2.8, y - 4.4], [x + 2.8, y - 3], [x - 2.8, y - 3]], CL[1]);
      curve(J, [[x + 1.6, y - 2], [x + 4.6, y - 1.4], [x + 4.4, y + 2.6]], 1, CL[3]);               // handle
      // ambrosia glowing at the mouth
      dots(J, [[x - 1, y - 5, '#fff2a8'], [x, y - 5, '#ffd75a'], [x + 1, y - 5, '#fff2a8'], [x, y - 6, '#ffffff']]);
    }
    comp(p, J, CL[4]);
    return p;
  }
  function portraitMerchant() {
    const S = R.skinTan, H = R.brown, T = R.terra, D = R.corn, C = R.ivory;
    const fig = L48();
    // --- headscarf knot and short tail at the nape
    const kn = L48();
    ell(kn, 15.6, 20, 2.8, 2.6, T[2]);
    ell(kn, 15, 19.4, 1.4, 1.2, T[1]);
    lockShape(kn, [[15, 21], [12.4, 24.6], [11.4, 27.4]], 3.4, 1.8, T, { lit: 0.5, hi: [0.1, 0.4] });
    lockShape(kn, [[16.4, 21.6], [16, 25], [14.6, 27.4]], 2.8, 1.6, T, { lit: 0.3, hi: [0.1, 0.2], dark: 1 });
    comp(fig, kn, null);
    // --- body: light-blue dress, ivory shawl wrapped over the near shoulder
    const bd = L48();
    blob(bd, [[3, 48, 1], [5, 42], [11, 37.6], [20, 36], [30, 36.4], [38, 38.6], [44, 43], [46, 48, 1]], D[1]);
    blob(bd, [[30, 38], [38, 39.4], [43.6, 44], [45, 48, 1], [34, 48, 1], [33, 43]], D[2], bd);
    fold(bd, [[24, 41], [26, 45], [27, 48]], [2.6, 1.8], D[2], D[0], bd);
    comp(fig, bd, D[4]);
    const sw = L48();
    blob(sw, [[0, 48, 1], [0, 42], [4, 38.4], [11, 36.2], [18, 36.4], [23, 38.6], [21, 43], [18, 48, 1]], C[1]);
    blob(sw, [[1, 42], [4.4, 39], [10, 37], [15, 37.4], [10, 40], [5, 42.6], [1.6, 45.6]], C[0], sw);
    fold(sw, [[12, 40], [11, 44], [10, 48]], [3, 2], C[2], null, sw);
    fold(sw, [[19, 40], [17, 44], [16, 48]], [2.4, 1.6], C[3], null, sw);
    comp(fig, sw, D[4]);
    // --- neck
    const nk = L48();
    poly(nk, [[21, 27], [29, 30.4], [30, 34], [30.6, 38], [21, 38]], S[2]);
    poly(nk, [[21, 29], [24, 30], [24, 38], [21, 38]], S[1], nk);
    blob(nk, [[20, 27], [25, 29.6], [30, 31.4], [29.6, 34], [25, 32.6], [21, 31]], S[3], nk);
    comp(fig, nk, S[4]);
    // --- head: round and friendly, full cheeks, short soft nose
    const hd = L48();
    blob(hd, [[24, 7], [31, 8], [34.6, 12], [35.4, 16.6], [35.6, 18.4, 1], [34.8, 20], [35.6, 22], [37, 24.2, 1], [35.4, 25.2, 1], [35.6, 26.6], [35, 27.8], [35.2, 29.4], [33.6, 31.6], [30, 32.8], [25.4, 31.8], [22, 28.6], [20.6, 24], [20.4, 16], [21, 10]], S[1]);
    blob(hd, [[23.4, 22.6], [28, 22], [31, 23.4], [29.6, 26], [25, 26], [23, 24.6]], S[0], hd);                 // round cheek
    blob(hd, [[21.4, 25], [24, 28.6], [28, 30.6], [32, 31.2], [34.6, 30.6], [32.6, 33], [27, 32.8], [23, 30], [21, 27]], S[2], hd);
    blob(hd, [[30.6, 18.8], [34.6, 18.6], [34.6, 20.8], [32.6, 21.4], [31, 20.8]], S[2], hd);
    blob(hd, [[32.6, 24.8], [36, 25], [35.4, 26], [33.4, 26.2]], S[2], hd);
    art(hd, 20, 19, ['.01.', '0122', '0132', '0122', '.12.'], faceLG(S), 'ear');
    const E = faceLG(S, { L: '#3a1e26', B: H[2], b: H[1], J: '#5a2e1c', j: '#c07c40', h: S[0], m: '#7a2c38', r: '#d8646a', n: S[3], k: '#f0907a', l: '#3a1e26', t: '#fff6ea', g: R.gold[1], G: R.gold[3] });
    art(hd, 24, 15, ['.bBBb.', 'b.....'], E, 'brow-near');                    // high friendly arch
    art(hd, 31, 15, ['bBb', '...'], E, 'brow-far');
    // smiling eyes: lower lid pushed up by the cheek, crow's feet
    art(hd, 24, 17, [
      '.LLLL.',
      'lw*Jw.',
      'n.jjw.',
      '.n.hh.'
    ], E, 'eye-near');
    dots(hd, [[23, 17, E.l]]);                                                     // lash flick
    art(hd, 31, 17, ['LLL', 'J*w', 'jj.'], E, 'eye-far');
    art(hd, 34, 21, ['0.', '0.', '..'], E, 'nose');
    // warm open smile with a glint of teeth, cheek apples, dimple
    art(hd, 29, 26, ['n....n', '.mmmm.', '..rr..'], E, 'smile');
    curve(hd, [[31.6, 23.4], [29.6, 24.6], [28.6, 26.4]], 1, S[2]);                   // smile line
    art(hd, 26, 24, ['kk'], E, 'blush');
    dots(hd, [[21, 24, E.g], [21, 25, E.G]]);                                  // gold earring
    comp(fig, hd, S[3]);
    // --- dark hair peeking at the temple, then the terracotta scarf wrapped tight over the head
    const hr = L48();
    blob(hr, [[20, 18], [21.4, 14], [24, 12.4], [28, 11.8], [26, 13.4], [23.4, 15.6], [22.6, 19]], H[2]);
    curve(hr, [[22.4, 15.4], [24.4, 13.2]], 1, H[1], hr);
    lockShape(hr, [[24.4, 14], [22.8, 16.4], [22.8, 19.6]], 2.6, 1, H, { lit: 0.5, hi: [0.2, 0.5] });
    comp(fig, hr, H[4]);
    const sc = L48();
    blob(sc, [[15, 19], [15.6, 11], [20, 5.4], [27, 3.6], [33, 5], [36.6, 8], [37.4, 11.6], [33, 11.4], [28, 11.6], [24, 12.6], [20.6, 16.6], [19, 20.4]], T[2]);
    blob(sc, [[16.4, 14], [18.6, 8.6], [23, 5.2], [29, 4.6], [27, 7.6], [22, 9.6], [18.4, 14]], T[1], sc);
    curve(sc, [[18.4, 10], [21.4, 6.8], [25, 5.6]], 1, T[0], sc);
    fold(sc, [[35, 10.4], [30, 8.6], [24, 9.6], [19, 14]], [2, 1.2], T[3], null, sc);
    fold(sc, [[30, 5.6], [25, 6.6], [20.6, 10]], [1.6, 1], T[3], null, sc);
    curve(sc, [[19.6, 19.6], [21.6, 15.6], [25, 13]], 1, T[3], sc);
    // woven hem band along the front edge: ochre border with a row of dots
    curve(sc, [[18.6, 19.4], [20.6, 15], [24, 11.8], [30, 10.4], [37, 10.4]], 2, R.ochre[1], sc);
    curve(sc, [[19.4, 19.6], [21.4, 15.4], [24.6, 12.4], [30, 11.2], [37, 11.2]], 1, R.ochre[3], sc);
    [[20, 16], [22, 13.6], [25, 11.6], [28, 10.8], [31, 10.4], [34, 10.4]].forEach(([x, y]) => sc.get(x, y) && sc.set(x, y, '#fff2c0'));
    comp(fig, sc, T[4]);
    // --- jar of ambrosia cradled against the chest at the front
    jar(fig, 40, 32, R.clay, true);
    clean(fig, [S, H, T, D, C]);
    const bg = bgBands(['#f2cc8e', '#dcaa6c', '#c08752', '#9c663e'], 26, 18, 19, 19);
    return finish(fig, bg, '#fff0c8', 0.3);
  }

  /* ---------- VILLAGER: shy young woman, head tilted down, dark hair in a bun with a flower ---------- */
  function portraitVillager() {
    const S = R.skin, H = R.darkHair, PK = R.pink, C = R.cloth;
    const fig = L48();
    // --- bun at the back of the head
    const bn = L48();
    ell(bn, 14.6, 10.4, 5.4, 5, H[2]);
    blob(bn, [[10.6, 9.4], [12.6, 6.4], [16, 5.6], [14.4, 8.4], [12.4, 11.6]], H[1], bn);
    curve(bn, [[11.6, 9.6], [13.4, 7.2]], 1, H[0], bn);
    curve(bn, [[18.6, 8], [15.6, 11], [11, 12.6]], [1.6, 1], H[3], bn);
    comp(fig, bn, null);
    // --- body: pink dress with a white trim, soft folds
    const bd = L48();
    blob(bd, [[6, 48, 1], [8, 42], [14, 38.4], [22, 37], [31, 37.4], [38, 39.4], [43, 43.4], [45, 48, 1]], PK[1]);
    blob(bd, [[31, 39], [38, 40.4], [42.6, 44.4], [44, 48, 1], [35, 48, 1], [34, 44]], PK[2], bd);
    blob(bd, [[8, 44], [10, 40.4], [14, 38.8], [12, 42.4], [10, 48, 1], [7, 48, 1]], PK[2], bd);
    fold(bd, [[24, 42], [26, 45.4], [27, 48]], [2.6, 1.8], PK[2], PK[0], bd);
    fold(bd, [[17, 41], [16, 45], [15, 48]], [2.2, 1.6], PK[3], null, bd);
    curve(bd, [[16, 39.4], [24, 42.6], [32, 39.4]], 1, '#ffffff');
    curve(bd, [[17, 40.4], [24, 43.6], [31, 40.4]], 1, PK[2]);
    comp(fig, bd, PK[4]);
    // --- neck: slender, set back
    const nk = L48();
    poly(nk, [[22, 28], [29, 31.6], [30, 35], [30.6, 39], [22, 39]], S[2]);
    poly(nk, [[22, 30], [25, 31], [25, 39], [22, 39]], S[1], nk);
    blob(nk, [[21, 28], [26, 31], [30.4, 32.6], [30, 35], [26, 33.6], [22, 31.6]], S[3], nk);
    comp(fig, nk, S[4]);
    // --- head: tilted down (chin tucked, more skull showing), soft small features
    const hd = L48();
    blob(hd, [[24, 8], [30.6, 9.6], [34, 13.6], [34.6, 18.6], [34.8, 20.4, 1], [34.2, 22], [35, 24.2], [36, 26.4, 1], [34.6, 27.2, 1], [34.6, 28.4], [34, 29.4], [34.2, 30.4], [33.2, 32], [30.6, 33.6], [27, 33], [23.6, 30.4], [21.4, 26.6], [20.8, 20], [21.2, 12]], S[1]);
    blob(hd, [[23.6, 25], [27.6, 24.6], [29.6, 25.6], [27, 26.6], [24.6, 26.4]], S[0], hd);
    blob(hd, [[21.6, 26], [24, 29.4], [27.6, 31.6], [31.4, 32.6], [33.4, 31.8], [31.6, 34], [27, 33.6], [23.4, 30.6], [21.2, 28]], S[2], hd);
    blob(hd, [[30.4, 21], [34.2, 20.8], [34.2, 23], [32.4, 23.6], [30.8, 23]], S[2], hd);
    blob(hd, [[32.6, 27], [35.4, 27], [34.8, 28], [33, 28.2]], S[2], hd);
    art(hd, 20, 21, ['.01.', '0122', '0132', '0122', '.12.'], faceLG(S), 'ear');
    const E = faceLG(S, { L: '#3a1e36', B: H[2], b: H[1], J: '#5a3a28', j: '#a8744a', h: S[0], m: '#a8445a', r: '#e27c86', n: S[3], k: '#f59a9a' });
    // brows arched up at the centre (shy), eyes lowered with long lashes
    art(hd, 24, 17, ['...bB', '.bB..', 'b....'], E, 'brow-near');
    art(hd, 31, 18, ['Bb', '..'], E, 'brow-far');
    art(hd, 23, 20, [
      '..LLLL',
      '.LwwwwL',
      'L.w*Jw.',
      '..wJjw.',
      '...jj..',
      '..hhh..'
    ].map((r) => r.slice(0, 7)), E, 'eye-near');
    art(hd, 31, 20, ['LLL', 'ww.', '*J.', 'Jj.', 'h..'], E, 'eye-far');
    art(hd, 34, 24, ['0', '.', 'n'], E, 'nose');
    art(hd, 31, 29, ['.mm', 'rr.'], E, 'mouth');                        // small closed smile
    art(hd, 25, 27, ['kkk'], E, 'blush');
    dots(hd, [[29, 27, E.k]]);
    comp(fig, hd, S[3]);
    // --- hair: centre-parted bangs sweeping back to the bun, one lock falling by the ear
    const ht = L48();
    blob(ht, [[15, 15], [17, 8], [22, 4.8], [29, 5], [34, 8.4], [36.4, 13.4], [35.4, 17.4], [33, 14.6], [29.4, 13.2], [25, 14.4], [22.4, 18], [21.6, 24], [19, 20]], H[2]);
    blob(ht, [[17, 11], [19.4, 7], [25, 5.4], [30.4, 6.4], [26, 8.4], [21, 10.6], [18.4, 13.4]], H[1], ht);
    curve(ht, [[19.6, 8.4], [23, 6.4], [27, 6]], [2, 1], H[0], ht);
    curve(ht, [[31, 8], [34, 10.4]], 1, H[0], ht);
    fold(ht, [[35, 15.4], [31.4, 11.4], [26, 10.6], [21, 13.4]], [1.8, 1], H[3], null, ht);
    lockShape(ht, [[23, 14], [21.4, 19], [21.6, 25], [23.4, 30]], 3.4, 1.4, H, { wave: 1, bias: 0.15 });
    comp(fig, ht, H[4]);
    // --- flower tucked above the ear: pink blossom with a yellow heart and two leaves
    const fl = L48();
    art(fl, 15, 12, [
      '..pp.ll',
      '.pPPpl.',
      'pPYyPp.',
      'pPyyPq.',
      '.pPPq..',
      '..qq...'
    ], { p: PK[1], P: PK[0], q: PK[3], Y: '#fff6b0', y: R.gold[1], l: R.leaf[1] }, 'flower');
    comp(fig, fl, OUT);
    clean(fig, [S, H, PK]);
    const bg = bgBands(['#b8dc9a', '#96c47e', '#76a868', '#5a8a58'], 26, 18, 19, 19);
    return finish(fig, bg, '#fff2d8', 0.3);
  }

  /* ---------- hand-placed base maps (frame 0) ---------- */
  const MAPS = {
    eury: [
      '......................',
      '........CBBAAB........',
      '......CBAAAAAABB......',
      '.....CBlpAfApAlAB.....',
      '....CBAAABAAAABAAB....',
      '....BAABAAAB0001BB....',
      '....ABBCBAB1111111....',
      '....ABBCBB1WK111K1....',
      '....ABCCBB11K111K10...',
      '....BBCCCB2kk11111....',
      '...BABCCCC2211mm1.....',
      '...BABCCC.222111......',
      '...BABCC....322.......',
      '...BABC.1vwww12.......',
      '...BABCC1vwwwv2.......',
      '..BAABCC1vwwvvu2......',
      '..BABCCC12wwvvu2......',
      '..BABCC.12ggggGG......',
      '..BABCC.21vvwvu2......',
      '..BABCC..21vwvu2......',
      '..BABC...v220112......',
      '..BBC...vwv22221......',
      '..BC....vwvvvvuu......',
      '...C...vwwvvvuut......',
      '.......vwvvvvuutt.....',
      '......vwwvvvvuuut.....',
      '......vwvvvvvuuutt....',
      '.....vwwvvvvuuuutt....',
      '.....vwvvvvvvuuutt....',
      '....vwwvvvvvuuuuttt...',
      '....vwvvvvvvuuuuutt...',
      '....uvvvvvvvuuuuttt...',
      '....tuuuuuuuuuuttt....',
      '.....tt11tttt0ttt.....',
      '.....NNnN....nN.......'
    ],
    merch: [
      '........................',
      '........VUUUUV..........',
      '......VUTTSSTUV.........',
      '.....VUTSSTTTTUV........',
      '....VUTTUTTTTTTUV.......',
      '...VVUUOUOUOhhUVV.......',
      '..VUXVUVhh1111111.......',
      '..UTUXVh11WK111K1.......',
      '..VUX.Vh111K111K10......',
      '..UX.V.h2kk111111.......',
      '...X....3221mm11........',
      '.........3221111........',
      '.........33322..........',
      '.........a3322b.........',
      '.......abbbbbbbbc.......',
      '......abbbbeebbbcc.ygy..',
      '.....1abbbeeffbbccrRss..',
      '....12abbbeeffbbcc.rs...',
      '....21.abbeeffbbcrRrst..',
      '...21..abbeeffbccRrrsstt',
      '...12..LLLLLLMM12rrsst.t',
      '....12.abbeeff120rssst.t',
      '.....21abbeeffbc2xxxxxtt',
      '......2abbeefffbcrrssst.',
      '......abbbeeffqbccrssstx',
      '......abbbeeffqbcc.sttx.',
      '.....abbbbeeffqbccc.....',
      '.....abbbbeeffqbccc.....',
      '....abbbbbeeffqqbccc....',
      '....abbbbbeeffqqbccc....',
      '....abbbbbeeffqqbcccd...',
      '...abbbbbbeeffqqbbccd...',
      '...abbbbbbeeffqqbcccd...',
      '...bccccccqqqqqccccdd...',
      '...ddd111dddd...00d.....',
      '...NNnnN......nnNN......'
    ],
    vill: [
      '......................',
      '....DCCD..............',
      '...DBAABD.............',
      '...CBABBCCDCCD........',
      '...DCBBCBABBBBCD......',
      '....DCBABBBBBBBBC.....',
      '....pPDCBBBC1111B.....',
      '...pPYpDCB1111111.....',
      '...pyPqCBB1WK111K1....',
      '....qql.BC11K111K10...',
      '......DCC2kk11111.....',
      '......DCD22111m1......',
      '.......D..22111.......',
      '..........3222........',
      '.........xa322ax......',
      '........xaaaaaabax....',
      '.......1xaaaaaabbx....',
      '.......12aaaaaabbx....',
      '.......21xaaaaabbx....',
      '.......12.xWWWWWx.J...',
      '.......21xaaaaabJx.J..',
      '........2xaa1122J..J..',
      '.........xaaRr0rRrJ...',
      '........xaaaJIIJIJI...',
      '........xaaaIJJIJJI...',
      '........xaaaaIJIIJ....',
      '.......xaaaabbbbbx....',
      '.......xaaaabbbbbx....',
      '......xaaaaabbbbbbx...',
      '......xaaaaabbbbbbx...',
      '......xbbbbbbbbbbbx...',
      '........11....11......',
      '........22....21......',
      '........12....12......',
      '........nN....nN......',
      '.......nNN...nNN......'
    ],
    elder: [
      '.........................',
      '...................zwz...',
      '..........2110.....wWz...',
      '.........211001....zwz...',
      '........21110001....wz...',
      '........2111111112..wz...',
      '.......A2111111112..wz...',
      '......AB321BAAB111..wz...',
      '......BC3212QK1111..wz...',
      '.....AB.32211K11110.wz...',
      '.....B...32AAAA11...wz...',
      '.........3AAABBAA1..wz...',
      '........bABBABBAB...wz...',
      '.......abAABBABBA...wz...',
      '......aabBAABBABc..12z...',
      '.....aaabbBABBAc1112wz...',
      '.....aabbbcBABBc12212z...',
      '....raabbbbcBAB2122.wz...',
      '....raabbbbccBA..c..wz...',
      '....rabbabbbccB.cc..wz...',
      '....rabbabbbbcccc...wz...',
      '....rabbbabbbbcc....wz...',
      '....rabbbabbbbccc...wz...',
      '.....rabbbabbbbcc...wz...',
      '.....rabbbbabbbccc..wz...',
      '.....rabbbbabbbiic..wz...',
      '.....rabbbbbabbiijc.wz...',
      '.....rabbbbbabbiijc.wz...',
      '....raabbbbbbabiijcc.wz..',
      '....rabbbbbbbbbiijcc.wz..',
      '....rabbbbbbbbbiijjc.wz..',
      '....rabbbbbbbbbiijjcc.z..',
      '....raaaaaccccciiijcc.z..',
      '.....cc11cccc.....cc..w..',
      '......nN....11nN......z..',
      '.....nNN...nnNN.......z..'
    ],
    zeus: [
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '................................................',
      '..................BAAAB.........................',
      '...............BAAAAAAABB...........0011........',
      '..............BAYgYYgYYgAB.........011112.......',
      '.............BAgGYgGYgGYgB.........111122.......',
      '.............BAB0000000YgA.........Y11122.......',
      '............BAB1111111111B.........yYgg2........',
      '............ABB2AAB11AAB1.........11122.........',
      '............ABC22WK22K2...........11122.........',
      '............BCC2111K11K1.........11112..........',
      '............BCCB3211AAA10.......11112...........',
      '............BCC.321AABBAA.....011112............',
      '............CCC..3ABBABBA...0111122.............',
      '............CC..AABBABBBAB011111122.............',
      '.............pqqBABBABBAB0111112................',
      '...........ppqqqABBABBAB21112222................',
      '..........ppqqqqrBABBABvv122....................',
      '..........pqqqqqqrBABBwwvvv.....................',
      '.........ppqqqqqqrrBABwwvvvu....................',
      '.........pqqqqqqqqrrBAwvvvuu....................',
      '.........pqqqqqqqqqrrBAvvvuu....................',
      '.........pqq1qqqqqqqrrBwvvuu....................',
      '.........pqq11qqqqqqqrrwvvuu....................',
      '.........pqq21qqqqqqqqrrvvuu....................',
      '..........q221yyYYYYYYgggvuu....................',
      '...........vvvwwvvvvvvvvvuu.....................',
      '...........vvvwwvvvvvvvvuuut....................',
      '..........wvvvwwvvvvvvvvuuut....................',
      '..........wvvvwwvvvvvuvvuuut....................',
      '.........wvvvvwwvvvvvuvvuuutt...................',
      '.........wvvvvwwvvvvvuvvvuuut...................',
      '........wvvvvwwvvvvvuvvvvuuutt..................',
      '........wvvvvwwvvvvvvuvvvvuuutt.................',
      '.......wvvvvwwvvvvvvuvvvvvuuutt.................',
      '.......wvvvvwwvvvvvuvvvvvvuuuttt................',
      '......wvvvvwwvvvvvvuvvvvvvuuuuttt...............',
      '.....wvvvvwwvvvvvvuuvvvvvvuuuuttt...............',
      '....wvvvvwwvvvvvvuuvvvvvvvuuuuuttt..............',
      '....YYYgYYvYYYYgYYGvvvvvvuuuuuuttt..............',
      '....GGGGGGvGGGGGGGGYYYYgYYYvYYYYgg..............',
      '...................GGGGGGGGGvGGGGGG.............',
      '......lkkklkkkklkkklkkkkGGGGGGGGGGG.............',
      '....lkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkl............',
      '...lkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkml..........',
      '..mlkkkkkkllkkkkkkkkkklkkkkkkkkkllkmmm..........',
      '..mllllllmmllllllllllmmllllllllmmmmmn...........',
      '...mmmmmnn.mmmmmmmmnn..mmmmmmmmnnnn.............',
      '.....nnn......nnnnn......nnnnnn.................',
      '................................................'
    ],
    herm: [
      '........................................',
      '........................................',
      '........................................',
      '................gYYYYg..................',
      '..............gYyyYYYGg.................',
      '.............gYyYYYYYYGg................',
      '............gGGGGGGGGGGGg...............',
      '............DCBBB11111BC................',
      '............CBCB1111111B................',
      '............BCB21WK111K1................',
      '............CBC211K111K10...............',
      '............DC.3211k11m1................',
      '...............32211mm1.................',
      '................32221...................',
      '..................322...................',
      '.............aabbbb22bbbba..............',
      '............1abbbbbbbbbbbcc.............',
      '............21abbbbbbbbbbc2111..........',
      '............12.abbbbbbbbcc111112........',
      '............21.abbbbbbbbc....2112.......',
      '............12..abbbbbbbc......0122.....',
      '............21..abbbbbbcc........122....',
      '............12..LLLLLLLLL.........2.....',
      '............012.abbbbbbbc...............',
      '.............11abbbbbbbbcc..............',
      '..............abbbbbbbbbccc.............',
      '..............abbbbbabbbbcc.............',
      '...............2111bbb2111..............',
      '...............21112.12211111...........',
      '...............211122..1221111122.......',
      '................2112....12111111222.....',
      '................2112......1211112222....',
      '................2112........11112222....',
      '................2112........1221122.....',
      '................2112........12112.......',
      '................2112........1112........',
      '................211.........112.........',
      '................211........1112.........',
      '................2112......N112..........',
      '................2112......Nn1...........',
      '................211........N............',
      '...............N112.....................',
      '...............Nn1......................',
      '...............NN.......................',
      '...............N........................',
      '........................................',
      '........................................',
      '........................................',
      '........................................'
    ],
    hades: [
      '....................................',
      '....................................',
      '....................................',
      '...........................j...j....',
      '...........................j...j....',
      '...........................Jj.jJ....',
      '............i.i.i.i.i.......JjJ.....',
      '...........iIiIiIiIiIQ.......J......',
      '...........QQQQQQQQQQQD......j......',
      '...........DCB21111111.......j......',
      '..........DCB211111111.......j......',
      '..........CBC2nN1111n1.......j......',
      '..........CBD321111l11.......j......',
      '..........CBD3211111110......j......',
      '..........BCD.4321113........j......',
      '..........BCD..432m11........j......',
      '.........BCD....43EE1........j......',
      '.........BCD.....3EE.........j......',
      '.........BCDDiiI.hh22Qiv.....j......',
      '........BCDiiIIIQhhhvvvvv....j......',
      '........BCiiIIIQQvvvvvvvvw...j......',
      '........BCiIIIQQvvvvvvvvvv...j......',
      '........BDIIQQvvvvvvvvvvvxwwvj......',
      '........DD.Qvvvvvvvvvvvvxxvvw1......',
      '..........vvvvvvvvvvvvvvxx..211.....',
      '..........vvvvvvvvvvvvxxx....1......',
      '.........vvvvvvvvvvvvvxxx....j......',
      '.........vvwvvvvvvvvvxxxx....j......',
      '.........vwvvvvIIIIIIIIIxx...j......',
      '.........vwvvvvQQQnQQQQQxx...j......',
      '........vwwvvxvvvvxxxzxxx....j......',
      '........vwwvvxvvvvxxxzxxx....j......',
      '.......vwwvvvxvvvvxxxzxxx....j......',
      '.......vwwvvxvvvvvxxxzxxxx...j......',
      '.......vwwvvxvvvvvxxxxzxxx...j......',
      '......vwwvvvxvvvvvxxxxzxxx...j......',
      '......vwwvvvxvvvvvxxxxzxxx...j......',
      '......vwwvvvxvvvvvxvxxzxxxz..j......',
      '.....vwwvvvvxxvvvvxxxxzzxxz..j......',
      '.....vwwvvvxxvvvvvxxxxzzxxz..j......',
      '.....vwwvvvxxvvvvvxxxxzzxxz..j......',
      '....vwwvvvwxxvvvvwxxxxzzxxxz.j......',
      '....vwwvvvwxxvvvvwxxxxzzxxxz.j......',
      '....vwwvvvwxxvvvvwxxxxxzzxxz.j......',
      '...vwwvvvwxxvvvvvwxxxxxzzxxxzj......',
      '...vwwvvvwxxvvvvvwxxxxxzzxxxzj......',
      '...vwwvvvwxxvvvvvwxxxxxzzxxxzj......',
      '...zzzvvvzzzzzvvvzzzzzzzxxxxzj......',
      '....zz...zz..3321..zz..zzz...j......',
      '.............hhhh............j......',
      '....................................',
      '....................................'
    ],
    jar: [
      '.ygy.....',
      '.rRss....',
      '..rs.....',
      '.rRrst...',
      'rRrrsstt.',
      'rRrrsst.t',
      'rrrssst.t',
      'MMMMMMMtt',
      'rrrssst..',
      '.rssstx..',
      '..sttx...'
    ],
  };

  /* ================================================================
     IN-GAME NPC SPRITES — 3/4 view facing right, 4-frame idle loops (12 ticks each) + _blink.
     Each character is a hand-placed pixel map (MAPS above) split into three bands:
       head (rows < head), chest (head..chest), lower body (>= chest).
     Breathing is a travelling wave: the chest rises first (frame 1), the head follows (frame 2),
     the chest settles while the head is still up (frame 3): 0 -> 1/2 -> 1 -> 1/2. When a band
     rises, its last row is repeated so the body stretches instead of tearing. Hair tips and hems
     live in the static lower band, so they naturally lag behind; hems also flutter at the corners.
     Floating gods keep the body still (the engine already bobs them) and animate only secondary
     motion: wings, cape, beard, bolt sparks and flames. Props that must stay planted (staff,
     bident) are split out of the map into a static layer.
     ================================================================ */
  const CH = [0, 1, 1, 0];      // chest / shoulders / arms rise
  const HD = [0, 0, 1, 1];      // head follows one frame later
  function idleSet(draw, outCol) {
    const out = [];
    for (let f = 0; f < 5; f++) {
      const p = f < 4 ? draw(f, false) : draw(0, true);
      outline(p, outCol || OUT);
      out.push(p);
    }
    return out;
  }
  // Split a map into moving rows and a static layer made of the chars in `stat`.
  function splitMap(rows, stat) {
    const mv = [], st = [];
    rows.forEach((r) => {
      let a = '', b = '';
      for (let i = 0; i < r.length; i++) { const s = stat && stat.indexOf(r[i]) >= 0; a += s ? '.' : r[i]; b += s ? r[i] : '.'; }
      mv.push(a); st.push(b);
    });
    return { mv, st };
  }
  // Draw map rows with breathing bands. bands = [headEnd, chestEnd]; off = [headDy, chestDy] (<= 0).
  function drawBands(p, rows, lg, x0, y0, bands, off, tag) {
    const [hEnd, cEnd] = bands, [hd, cd] = off;
    const put = (r, dy) => art(p, x0, y0 + r + dy, [rows[r]], lg, tag);
    for (let r = cEnd; r < rows.length; r++) put(r, 0);
    if (cd < 0) put(cEnd - 1, 0);                 // stretch the waist row
    for (let r = hEnd; r < cEnd; r++) put(r, cd);
    if (hd < cd) put(hEnd - 1, cd);               // stretch the neck row
    for (let r = 0; r < hEnd; r++) put(r, hd);
  }
  // Standard grounded NPC: static layer, banded map, blink, per-frame extras.
  // o: {map, lg, stat, bands, blink: [[x, y, ch]...] (head coords), before(p, f, c, h), after(p, f, c, h, blink)}
  function mapFrames(o) {
    const M = splitMap(o.map, o.stat), W = o.map[0].length + (o.padW || 0), H = o.map.length + (o.padH || 1);
    return idleSet((f, blink) => {
      const p = new O.Pix(W, H), fl = !!o.float, c = fl ? 0 : -CH[f], h = fl ? 0 : -HD[f];
      if (o.before) o.before(p, f, c, h);
      art(p, 0, 0, M.st, o.lg, o.tag + '-static');
      drawBands(p, M.mv, o.lg, 0, 0, o.bands, [h, c], o.tag);
      if (blink && o.blink) o.blink.forEach(([x, y, ch]) => p.set(x, y + h, o.lg[ch] || ch));
      if (o.flutter) o.flutter[f].forEach(([x, y, ch]) => (ch === '_' ? p.set(x, y, null) : p.set(x, y, o.lg[ch] || ch)));
      if (o.after) o.after(p, f, c, h, blink);
      return p;
    }, o.outCol);
  }

  /* ---------- EURYDICE (and her ghost) ---------- */
  function eurydiceLG(ghost) {
    const SK = ghost ? ['#ffffff', '#e8f8ff', '#bfe4f4', '#86b4d8', '#50709e'] : R.skinF;
    const HR = ghost ? ['#ffffff', '#d4fbff', '#8fe4f6', '#4fa6d6', '#2d5c9c'] : R.blond;
    const CL = ghost ? ['#ffffff', '#e2fbff', '#a8e6f6', '#6fb2dc', '#4474b0'] : R.cloth;
    const GD = ghost ? ['#ffffff', '#d4f8ff', '#8fd0f0', '#5a9ccc', '#3a6aa0'] : R.gold;
    return LG({ W: '#ffffff', K: ghost ? '#2d4f86' : '#2a2040', m: ghost ? '#6fa8d0' : '#c05a60', k: ghost ? '#d8f4ff' : '#f7a898',
      p: ghost ? '#d4f8ff' : '#ff9cc0', f: '#ffffff', l: ghost ? '#a8f0e0' : '#6cc04a', y: GD[0], g: GD[1], G: GD[3],
      n: ghost ? CL[3] : R.leather[1], N: ghost ? CL[4] : R.leather[3] },
    ['01234', SK], ['ABCDE', HR], ['wvut', CL]);
  }
  // closed eyes: the upper row turns to skin, the lower row becomes a 2-px lash line
  const EURY_BLINK = [[11, 7, '1'], [12, 7, '1'], [16, 7, '1'], [11, 8, 'K'], [12, 8, 'K'], [16, 8, 'K']];
  function eurydiceFrames(ghost) {
    const lg = eurydiceLG(ghost);
    const base = mapFrames({
      map: MAPS.eury, lg, tag: 'eury', bands: [13, 22], blink: EURY_BLINK, outCol: ghost ? '#2e5a98' : OUT,
      // hem corners flutter one frame behind the breath
      flutter: [[], [], [[19, 32, 't'], [4, 32, 'u']], [[19, 32, 't'], [19, 31, 't']]]
    });
    if (!ghost) return base;
    // spectral: the lower body dissolves into three wispy tails, motes of light drift up
    const G = ['#ffffff', '#e2fbff', '#a8e6f6', '#6fb2dc', '#4474b0'];
    return base.map((p, f) => {
      const q = new O.Pix(p.w, p.h + 2);
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        const c = p.get(x, y);
        if (c && y < 24 && c !== '#2e5a98') q.set(x, y, c);
      }
      const sw = [0, 1, 0, -1, 0][f];
      [[8, 23, 10, -2, 5], [12, 23, 12, 0.5, 5.4], [16, 23, 9, 2.2, 4.4]].forEach(([x, y, len, dx, w], k) => {
        const tip = [x + dx + sw * (k === 1 ? -1 : 1), y + len];
        blob(q, [[x - w / 2, y], [x + dx * 0.4 - w * 0.4 + sw * 0.5, y + len * 0.5], [tip[0], tip[1], 1], [x + dx * 0.4 + w * 0.4 + sw * 0.5, y + len * 0.5], [x + w / 2, y]], G[2]);
        blob(q, [[x - w * 0.25, y], [x + dx * 0.3 + sw * 0.4, y + len * 0.45], [x + dx * 0.6 + sw * 0.6, y + len * 0.7, 1], [x + w * 0.25, y]], G[1]);
      });
      for (let y = 0; y < 20; y++) for (let x = 0; x < q.w; x++) if (q.get(x, y) === G[2]) q.set(x, y, G[1]);
      outline(q, '#2e5a98');
      [[4, 20 - f * 3], [19, 26 - f * 2], [11, 36 - f * 3], [15, 14 - f * 2]].forEach(([x, y]) => { if (y > 0 && !q.get(x, y)) q.set(x, y, G[1]); });
      return q;
    });
  }

  /* ---------- MERCHANT: plump, terracotta headscarf, hand on hip, clay jar on the other hip ---------- */
  function merchantFrames() {
    const T = R.terra, J = R.clay;
    const lg = LG({ K: '#2a1830', W: '#ffffff', m: '#8a3440', k: '#f0907a', h: R.brown[1], H: R.brown[3], O: R.ochre[1],
      L: R.leather[1], M: R.leather[2], n: R.leather[1], N: R.leather[3], y: '#fff2a8', g: '#ffd75a' },
    ['0123', R.skinTan], ['STUVX', T], ['abcd', R.corn], ['efq', [R.ivory[0], R.ivory[1], R.ivory[2]]], ['Rrstx', J]);
    return mapFrames({
      map: MAPS.merch, lg, tag: 'merchant', bands: [13, 20],
      blink: [[10, 7, '1'], [11, 7, '1'], [15, 7, '1'], [10, 8, 'K'], [11, 8, 'K'], [15, 8, 'K']],
      flutter: [[], [], [[20, 33, 'd']], [[20, 33, 'd'], [2, 33, 'b']]],
      after: (p, f, c) => {
        // ambrosia glints at the jar's mouth
        const gl = [[19, 15], [20, 14], [21, 15], [20, 14]][f];
        p.set(gl[0], gl[1] + c, '#ffffff');
      }
    });
  }

  /* ---------- VILLAGER: shy young woman, bun with a flower, calf-length dress, apple basket ---------- */
  function villagerFrames() {
    const lg = LG({ W: '#ffffff', K: '#2a1830', m: '#b04a56', k: '#f59a9a', p: '#f9aac8', P: '#ffe6f0', q: '#e2709e', Y: '#fff6b0', y: '#ffd75a', l: '#6cc04a',
      a: R.pink[1], b: R.pink[2], x: R.pink[3], I: '#d4a05a', J: '#a8713c', R: '#ff8a6a', r: '#e0403a', n: R.leather[1], N: R.leather[3] },
    ['0123', R.skin], ['ABCDE', R.darkHair]);
    return mapFrames({
      map: MAPS.vill, lg, tag: 'villager', bands: [13, 20],
      blink: [[11, 8, '1'], [12, 8, '1'], [16, 8, '1'], [11, 9, 'K'], [12, 9, 'K'], [16, 9, 'K']],
      flutter: [[], [], [[18, 30, 'x']], [[18, 30, 'x'], [5, 30, 'x']]],
      after: (p, f, c, h) => {
        // flower petal trembles, one frame behind the head
        if (f === 2 || f === 3) p.set(3, 7 + h, '#ffe6f0');
      }
    });
  }

  /* ---------- ELDER: stooped sage, bald dome, wispy side locks, long beard, planted staff ---------- */
  function elderFrames() {
    const lg = LG({ Q: '#ffffff', K: '#2a1f33', m: '#8a3a44', r: '#a8a8d8', i: R.ivory[0], j: R.ivory[2], w: R.wood[1], W: R.wood[0], z: R.wood[3], n: R.leather[1], N: R.leather[3] },
    ['0123', R.skinOld], ['ABCD', R.white], ['abcd', ['#e8b07a', '#c89058', '#8e5a3a', '#5e3634']]);
    return mapFrames({
      map: MAPS.elder, lg, tag: 'elder', stat: 'wWz', bands: [12, 22],
      blink: [[12, 8, '1'], [13, 8, '1'], [12, 9, 'K'], [13, 9, 'K']],
      after: (p, f, c, h) => {
        // beard tip sways one frame behind
        if (f >= 2) { p.set(14, 19 + c, R.white[1]); p.set(15, 19 + c, R.white[2]); }
      }
    });
  }

  /* ---------- ZEUS: 47 px on his cloud, thunderbolt raised; the body is still, the bolt crackles ---------- */
  function zeusFrames() {
    const lg = LG({ K: '#16223f', W: '#ffffff', M: '#8a3a44', X: '#ffffff', Z: '#ffd84a', O: '#ff9a2a' },
    ['0123', R.skinGod], ['ABCD', R.white], ['yYgG', R.gold], ['wvut', ['#fffaf0', '#f0e4d0', '#cdbccc', '#8a78b0']],
    ['pqrs', R.royal], ['klmn', R.cloud]);
    const B = R.bolt;
    return mapFrames({
      map: MAPS.zeus, lg, tag: 'zeus', bands: [0, 0], float: true,
      blink: [[17, 22, '2'], [18, 22, '2'], [21, 22, '2'], [18, 23, 'K'], [19, 23, 'K'], [21, 23, 'K'], [22, 23, 'K']],
      before: (p, f) => {
        // thunderbolt: bold zigzag (white core, gold body, orange edge) gripped at its lower tip;
        // an electric halo pulses cyan / pale gold on alternate frames
        const bl = new O.Pix(p.w, p.h);
        art(bl, 34, 2, [
          '.....ZZZZ.',
          '....ZXXZO.',
          '....ZXZO..',
          '...ZXZO...',
          '...ZXZO...',
          '..ZXZZZZZ.',
          '..ZXXXXXZO',
          '..ZZZZXZO.',
          '.....ZXO..',
          '....ZXZO..',
          '....ZXO...',
          '...ZXO....',
          '...ZXO....',
          '..ZXO.....',
          '..ZO......'
        ], { Z: f % 2 ? '#ffe680' : '#fff6b0', O: f % 2 ? B[3] : '#5ac8f0', X: '#ffffff' }, 'bolt');
        // crackle: the glow outline flips between electric cyan and pale gold
        const halo = new O.Pix(p.w, p.h);
        halo.blit(bl, 0, 0);
        outline(halo, f % 2 ? '#ffd84a' : '#8ff0ff');
        for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = halo.get(x, y); if (c && !bl.get(x, y)) p.set(x, y, c); }
        p.blit(bl, 0, 0);
      },
      after: (p, f) => {
        // crackling sparks jumping off the bolt, beard tip and hem sway
        const SP = [[[45, 5], [33, 8], [45, 13]], [[37, 2], [46, 9], [32, 12]], [[44, 2], [33, 5], [46, 14]], [[33, 3], [45, 7], [38, 17]]][f];
        SP.forEach(([x, y], k) => { p.set(x, y, k === 1 ? B[1] : '#ffffff'); if (k === 0) { p.set(x + 1, y, B[2]); p.set(x, y + 1, B[3]); } });
        if (f === 1 || f === 2) { p.set(24, 27, R.white[1]); p.set(25, 26, R.white[2]); }
        const fl = [[], [[35, 52, 't']], [[35, 52, 't'], [36, 52, 't']], [[35, 52, 't']]][f];
        fl.forEach(([x, y, ch]) => p.set(x, y, lg[ch]));
      }
    });
  }

  /* ---------- HERMES: hovering messenger, crescent cape, fluttering cap and ankle wings, caduceus ---------- */
  function featherFan(p, x, y, dir, ph, F) {
    // 3 feathers fanning back (dir = -1 -> to the left) and up; ph = flutter phase 0..2
    const lift = [0, 1, 2][ph];
    const fans = [[4, -3 - lift], [5, -1 - lift * 0.5], [4, 1]];
    fans.forEach(([dx, dy], i) => {
      curve(p, [[x, y], [x + dir * dx, y + dy]], 1, i === 0 ? F[0] : i === 1 ? F[1] : F[2]);
      curve(p, [[x, y + 1], [x + dir * (dx - 1), y + dy + 1]], 1, i === 2 ? F[3] : F[2]);
    });
    return p;
  }
  function hermesFrames() {
    const F = R.feather, OC = R.ochre, G = R.gold;
    const lg = LG({ K: '#2a1a14', W: '#ffffff', m: '#7e3440', k: '#f4a08a', L: R.leather[1], N: G[2], n: G[1] },
    ['0123', R.skin], ['ABCD', R.chestnut], ['yYgG', R.gold], ['abcd', R.sky]);
    const FL = [0, 1, 2, 1];               // wing flutter phase
    const CAPE = [0, 0, 1, 2];             // cape flare lags the wings by a frame
    const m = MAPS.herm;
    return mapFrames({
      map: m, lg, tag: 'hermes', bands: [0, 0], float: true, padH: 3,
      blink: [[17, 9, '1'], [18, 9, '1'], [22, 9, '1'], [17, 10, 'K'], [18, 10, 'K'], [22, 10, 'K']],
      before: (p, f) => {
        // chlamys pinned at the shoulder: a curved sail flaring out behind the back, two cloth
        // tones, folds radiating from the pin, the darker lining showing where the hem flips
        const k = CAPE[f], ck = new O.Pix(p.w, p.h);
        blob(ck, [[16.4, 15], [12, 15.6], [7.6, 18 - k * 0.5], [4.4 - k, 22.6], [3.4 - k, 27 + k * 0.6, 1], [6.4, 26.4], [8.6, 28.2, 1], [11, 25], [14, 21], [16, 18]], OC[2]);
        blob(ck, [[16, 15.4], [12, 16.2], [8.6, 18.4 - k * 0.5], [6.6 - k, 21], [10, 20], [14, 17.6]], OC[1], ck);
        curve(ck, [[15, 16], [11.4, 16.8], [8.4 - k * 0.5, 18.8]], 1, OC[0], ck);
        curve(ck, [[15.4, 16.6], [10, 21.4], [5.6 - k, 26]], [1.6, 1], OC[3], ck);
        curve(ck, [[15.6, 17.4], [12, 22.6], [8.6, 27.4]], [1.4, 1], OC[3], ck);
        curve(ck, [[4 - k, 26.6 + k * 0.5], [6.4, 26], [8.4, 27.6]], 1, OC[4], ck);
        comp(p, ck, null);
        // caduceus in the far hand (behind the hand pixels of the map)
        const cd = new O.Pix(p.w, p.h), SN = R.snake;
        poly(cd, [[33, 10], [34, 10], [34, 40], [33, 40]], G[2]);
        for (let y = 10; y <= 40; y++) cd.set(33, y, G[1]);
        art(cd, 30, 13, [
          'ss...kk',
          'sSe.eKk',
          '.sS.Kk.',
          '..sSK..',
          '...KS..',
          '..kKsS.',
          '.kK..Ss',
          '..kKsS.',
          '...SK..',
          '..sSKk.',
          '.sS..Kk',
          '..sSKk.'
        ], { s: SN[1], S: SN[2], k: SN[2], K: SN[3], e: '#1b1426' }, 'cad');
        ell(cd, 33.5, 9, 1.4, 1.4, (x, y) => (x + y < 42 ? G[0] : G[2]));
        const w = FL[f];
        curve(cd, [[32, 9], [29, 8 - w], [27, 6 - w]], 1, F[0]); curve(cd, [[32, 10], [28, 10 - w * 0.5]], 1, F[2]);
        curve(cd, [[35, 9], [38, 8 - w], [40, 6 - w]], 1, F[0]); curve(cd, [[35, 10], [39, 10 - w * 0.5]], 1, F[2]);
        comp(p, cd, OUT);
      },
      after: (p, f, c, h, blink) => {
        const w = FL[f], wg = new O.Pix(p.w, p.h);
        // cap wing: 3 broad feathers rooted in the side of the cap, sweeping up and back
        const R0 = [14.4, 6.4];
        [[7, 1.4 - w, F[0]], [6.2, 4.4 - w * 0.6, F[1]], [8, 7.4 - w * 0.2, F[2]]].forEach(([tx, ty, col]) => curve(wg, [R0, [(R0[0] + tx) / 2, (R0[1] + ty) / 2 - 0.6], [tx, ty]], [2.4, 1], col));
        curve(wg, [[13.6, 5.6], [10, 3.6 - w * 0.6], [7.6, 2 - w]], 1, '#ffffff');
        curve(wg, [[24, 4], [26, 2 - w * 0.5]], [2, 1], F[1]);
        // ankle wings: 3-feather fans angled back and up
        featherFan(wg, 15, 40, -1, w, F);
        featherFan(wg, 27, 36, -1, w, F);
        comp(p, wg, OUT);
      }
    });
  }

  /* ---------- HADES: 44 px, gaunt, ghost-flame iron crown, glowing eyes, planted bident ---------- */
  function hadesFrames() {
    const FLc = R.flame;
    const lg = LG({ n: '#8ff0ff', N: '#ffffff', l: '#b8f4ff', m: '#3a2448', E: R.hadesHair[2], h: R.iron[3], j: R.iron[1], J: R.iron[2],
      i: R.iron[1], I: R.iron[2], Q: R.iron[3], v: R.violet[1], w: R.violet[0], x: R.violet[2], z: R.violet[3] },
    ['01234', R.skinHades], ['ABCD', R.hadesHair]);
    const FH = [[3, 5, 4, 3], [4, 3, 5, 4], [5, 4, 3, 5], [4, 5, 4, 3]];
    const FX = [[0, 1, 0, -1], [1, 0, -1, 0], [0, -1, 0, 1], [-1, 0, 1, 0]];
    return mapFrames({
      map: MAPS.hades, lg, tag: 'hades', stat: 'jJ', bands: [18, 28], outCol: '#0c0a16',
      blink: [[14, 11, '3'], [15, 11, '3'], [20, 11, '3'], [19, 12, '1']],
      before: (p, f, c, h) => {
        // ghost flames licking up from the crown spikes (at most 5 px above it), flickering
        const fl = new O.Pix(p.w, p.h);
        [12, 15, 18, 21].forEach((x, k) => {
          const ht = FH[f][k], lean = FX[f][k], y0 = 7 + h;
          blob(fl, [[x - 1.4, y0], [x - 1.2, y0 - ht * 0.5], [x + lean * 0.8, y0 - ht, 1], [x + 1.2, y0 - ht * 0.5], [x + 1.4, y0]], FLc[3]);
          curve(fl, [[x, y0], [x + lean * 0.4, y0 - ht * 0.6]], 1, FLc[2]);
          fl.set(x, y0 - 1, FLc[1]);
        });
        comp(p, fl, null);
      },
      after: (p, f, c, h, blink) => {
        if (!blink && (f & 1)) p.set(15, 12 + h, '#b8f4ff');      // eye glow flickers
        // cyan rim light on the left edge from the flames of the underworld, violet rim on the right
        const hits = [];
        for (let y = 8; y < p.h; y++) for (let x = 1; x < p.w - 1; x++) {
          const col = p.get(x, y);
          if (!col || col === lg.j || col === lg.J) continue;
          if (!p.get(x - 1, y) && x < 18) hits.push(x, y, O.mix(col, '#6ad8ff', 0.45));
        }
        for (let i = 0; i < hits.length; i += 3) p.set(hits[i], hits[i + 1], hits[i + 2]);
      }
    });
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
    const P = [['orpheus', portraitOrpheus], ['eurydice', portraitEurydice], ['zeus', portraitZeus], ['hermes', portraitHermes], ['hades', portraitHades], ['elder', portraitElder], ['merchant', portraitMerchant], ['villager', portraitVillager]];
    P.forEach(([k, fn]) => safe('portrait_' + k, () => reg('portrait_' + k, fn(), 24, 47)));
    // anchor: ay = outline row under the lowest pixel (Hermes: 3 px of air under his toes)
    const low = (m) => { for (let y = m.length - 1; y >= 0; y--) if (/[^.]/.test(m[y])) return y; return m.length - 1; };
    const SP = [
      ['eurydice', () => eurydiceFrames(false), 11, low(MAPS.eury) + 1],
      ['eurydice_ghost', () => eurydiceFrames(true), 11, low(MAPS.eury) + 1],
      ['merchant', merchantFrames, 12, low(MAPS.merch) + 1],
      ['villager', villagerFrames, 12, low(MAPS.vill) + 1],
      ['elder', elderFrames, 11, low(MAPS.elder) + 1],
      ['zeus', zeusFrames, 22, low(MAPS.zeus) + 1],
      ['hermes', hermesFrames, 20, low(MAPS.herm) + 3],
      ['hades', hadesFrames, 17, low(MAPS.hades) + 1]
    ];
    SP.forEach(([k, fn, ax, ay]) => safe(k, () => fn().forEach((p, f) => {
      const ghost = k === 'eurydice_ghost';
      reg(f < 4 ? k + (ghost ? '_' : '_idle_') + f : k + '_blink', p, ax, ay);
    })));
  });
})(window.OLY);
