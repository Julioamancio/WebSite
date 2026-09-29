/* art/enemies.js — ENEMIES of Arcadia (modern pixel art).
   Olive-ochre viper, charcoal cave bat, rust-legged satyr brute, the ERYMANTHIAN BOAR (boss) and
   falling rocks. Big masses are painted as smooth unions of 3D ellipsoids/capsules (height field ->
   normals -> banded, hue-shifted form shading); faces, heads, horns, tusks and small details are
   hand-authored pixel maps or explicit paths. Plum sel-out outline, warm top rim + cool bounce rim.
   Each frame also carries an EMISSIVE/readability layer (eyes, stun stars, glints, rims) drawn after
   the scene lighting — see O.drawEmissive below. Everything faces RIGHT. */
(function (O) {
  'use strict';
  const OUT = (O.PAL5 && O.PAL5.outline) || '#1b1426';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  // 3D light: from the upper-left, slightly towards the viewer.
  const LN = Math.hypot(-0.52, -0.68, 0.52);
  const LX = -0.52 / LN, LY = -0.68 / LN, LZ = 0.52 / LN;

  /* =====================================================================
     masks + shading
     ===================================================================== */
  function Mask(w, h) { return { w, h, m: new Uint8Array(w * h) }; }
  const mGet = (M, x, y) => (x >= 0 && y >= 0 && x < M.w && y < M.h ? M.m[y * M.w + x] : 0);
  function mSet(M, x, y, v) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < M.w && y < M.h) M.m[y * M.w + x] = v; }
  function mPoly(M, pts, v) {
    v = v === undefined ? 1 : v;
    let y0 = Infinity, y1 = -Infinity;
    pts.forEach((p) => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) xs.push(a[0] + ((y + 0.5 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) mSet(M, x, y, v);
    }
    return M;
  }
  // tapered capsule
  function mTube(M, x0, y0, x1, y1, r0, r1, v) {
    v = v === undefined ? 1 : v;
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, R = Math.max(r0, r1) + 1;
    for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++) {
      for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++) {
        const px = x + 0.5, py = y + 0.5;
        const t = clamp(((px - x0) * dx + (py - y0) * dy) / l2, 0, 1);
        const r = r0 + (r1 - r0) * t;
        if (Math.hypot(px - x0 - dx * t, py - y0 - dy * t) <= r) mSet(M, x, y, v);
      }
    }
    return M;
  }
  // Paints a tube that follows a polyline. paint(x, y, s, u, ox, oy) -> colour; s = 0..1 along the
  // spine, u = -1 (dorsal/left-of-travel) .. +1 (ventral), (ox, oy) = unit surface normal in 2D.
  function tubeField(p, pts, rad, paint) {
    const segs = []; let L = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.001;
      segs.push({ a, b, len, s0: L }); L += len;
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach((q) => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
    const RM = 8;
    for (let y = Math.floor(y0 - RM); y <= Math.ceil(y1 + RM); y++) {
      for (let x = Math.floor(x0 - RM); x <= Math.ceil(x1 + RM); x++) {
        const px = x + 0.5, py = y + 0.5;
        let best = null;
        for (const sg of segs) {
          const dx = sg.b[0] - sg.a[0], dy = sg.b[1] - sg.a[1];
          const t = clamp(((px - sg.a[0]) * dx + (py - sg.a[1]) * dy) / (sg.len * sg.len), 0, 1);
          const cx = sg.a[0] + dx * t, cy = sg.a[1] + dy * t;
          const s = (sg.s0 + t * sg.len) / L, r = rad(s);
          const ox = px - cx, oy = py - cy, d = Math.hypot(ox, oy);
          if (d > r) continue;
          const k = d / r;
          if (!best || k < best.k) {
            const ux = dx / sg.len, uy = dy / sg.len; // travel dir; left normal = (uy, -ux)
            const u = -(ox * uy - oy * ux) / r;
            best = { k, s, u, ox: d ? ox / d : 0, oy: d ? oy / d : 0, r, d };
          }
        }
        if (best) { const c = paint(x, y, best.s, best.u, best.ox * best.k, best.oy * best.k, best); if (c) p.set(x, y, c); }
      }
    }
    return L;
  }
  // Composite src over dst, drawing a contour on src's edge where it overlaps something already in dst.
  // lineLit is used on edges facing the light (top/left), line elsewhere.
  function over(dst, src, line, lineLit) {
    const add = [];
    if (line) {
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        if (!src.get(x, y)) continue;
        let lit = false, hit = false;
        if (!src.get(x, y - 1) && dst.get(x, y - 1)) { hit = true; lit = true; }
        if (!src.get(x - 1, y) && dst.get(x - 1, y)) { hit = true; lit = true; }
        if (!src.get(x + 1, y) && dst.get(x + 1, y)) hit = true;
        if (!src.get(x, y + 1) && dst.get(x, y + 1)) hit = true;
        if (hit) add.push(x, y, lit && lineLit ? lineLit : line);
      }
    }
    dst.blit(src, 0, 0);
    for (let i = 0; i < add.length; i += 3) dst.set(add[i], add[i + 1], add[i + 2]);
    return dst;
  }
  // Sel-out outline. Outline pixels on top of lit areas are softened slightly (modern sel-out).
  function finish(p, soft) {
    const add = [];
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (p.get(x, y)) continue;
      const b = p.get(x, y + 1), a = p.get(x, y - 1), l = p.get(x - 1, y), r = p.get(x + 1, y);
      if (!(a || b || l || r)) continue;
      let c = OUT;
      if (soft && b && !a && !isAlpha(b)) c = O.mix(OUT, b, soft);
      add.push(x, y, c);
    }
    for (let i = 0; i < add.length; i += 3) p.set(add[i], add[i + 1], add[i + 2]);
    return p;
  }
  const isAlpha = (c) => c && c.length === 9;
  const A = (hex, a) => hex + Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, '0');
  // Pix -> canvas, supporting '#rrggbbaa' colours.
  function toCanvas(p) {
    const cv = O.makeCanvas(p.w, p.h), g = cv.getContext('2d'), img = g.createImageData(p.w, p.h);
    for (let i = 0; i < p.d.length; i++) {
      const c = p.d[i]; if (!c) continue;
      const n = parseInt(c.slice(1, 7), 16);
      img.data[i * 4] = (n >> 16) & 255; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255;
      img.data[i * 4 + 3] = c.length === 9 ? parseInt(c.slice(7, 9), 16) : 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
  // set only on filled pixels
  const setF = (p, x, y, c) => { if (p.get(x, y)) p.set(x, y, c); };
  // pixel map painter: rows of chars, legend char -> colour ('.' / ' ' = skip)
  function pmap(p, ox, oy, rows, legend, flipX) {
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) {
        const ch = r[i]; if (ch === '.' || ch === ' ') continue;
        const c = legend[ch]; if (c === undefined) continue;
        p.set(flipX ? ox + (r.length - 1 - i) : ox + i, oy + j, c);
      }
    }
  }

  /* =====================================================================
     READABILITY + EMISSIVE PASS
     Every enemy frame can carry three extra layers, drawn AFTER the scene lighting (O.Light.apply)
     so that threats never dissolve into the dark forest / warm cave:
       core  - full-brightness pixels (eyes, stun stars, tusk glint): drawn opaque, unlit
       glow  - sources of a soft, quantised additive halo around the core (eyes, stars)
       rim   - the sprite's own rim-light pixels (warm top rim + cool back/belly rim), re-drawn
               at partial alpha so the silhouette edge survives the multiply light map
     plus a faint 'lift' (the sprite itself at low alpha) in dark themes, mirroring how the hero
     is kept out of the night grade. O.drawEmissive(ctx, game) does it; the engine may call it
     after O.Light.apply (then set O.EMISSIVE_MANUAL = true). Until it does, the module wraps
     O.Light.apply once, additively.
     ===================================================================== */
  const EMI = {};
  const EMI_NAMES = [];
  function flipCv(cv) { const f = O.makeCanvas(cv.width, cv.height), g = f.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); return f; }
  // Quantised soft halo around every pixel of `src` (additive colours). Returns {cv, pad}.
  function haloCanvas(src, R, gain) {
    const pad = Math.ceil(R), w = src.w + pad * 2, h = src.h + pad * 2;
    const acc = new Float32Array(w * h * 4);
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y); if (!c) continue;
      const n = parseInt(c.slice(1, 7), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      for (let j = -pad; j <= pad; j++) for (let i = -pad; i <= pad; i++) {
        const d = Math.hypot(i, j * 1.1) / R; if (d >= 1) continue;
        const k = (1 - d) * (1 - d);
        const o = ((y + pad + j) * w + (x + pad + i)) * 4;
        acc[o] += r * k; acc[o + 1] += g * k; acc[o + 2] += b * k; acc[o + 3] += k;
      }
    }
    const cv = O.makeCanvas(w, h), gx = cv.getContext('2d'), img = gx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const a = acc[i * 4 + 3]; if (a <= 0) continue;
      let I = Math.min(1, a * (gain || 0.55));
      // pixel-friendly: 4 hard steps with an ordered-dither seam
      const x = i % w, y = (i / w) | 0;
      const q = Math.floor(I * 4 + O.bayer(x, y) * 0.9) / 4;
      if (q <= 0) continue;
      img.data[i * 4] = acc[i * 4] / a; img.data[i * 4 + 1] = acc[i * 4 + 1] / a; img.data[i * 4 + 2] = acc[i * 4 + 2] / a;
      img.data[i * 4 + 3] = Math.round(q * 150);
    }
    gx.putImageData(img, 0, 0);
    return { cv, pad };
  }
  // e = { core: Pix, glow: Pix, rim: Pix, R: halo radius }
  function reg(name, p, ax, ay, e) {
    O.registerSprite(name, toCanvas(p), { ax, ay });
    EMI_NAMES.push(name);
    if (!e) return;
    const L = {};
    if (e.core) { const c = toCanvas(e.core); L.core = [c, flipCv(c)]; }
    if (e.glow) { const h = haloCanvas(e.glow, e.R || 4, e.gain); L.halo = [h.cv, flipCv(h.cv)]; L.pad = h.pad; }
    if (e.rim) { const c = toCanvas(e.rim); L.rim = [c, flipCv(c)]; }
    L.lift = e.lift === undefined ? 1 : e.lift;
    EMI[name] = L;
  }
  // Rim light, applied to a finished (outlined) sprite in place. Returns a Pix with just the rim pixels.
  //  warm: colour of the light rim on top-facing edges (1 px, + a softer 2nd px where `thick`)
  //  cool: colour of the bounce rim on right-facing / bottom-facing edges
  function rimLight(p, o) {
    const R = new O.Pix(p.w, p.h);
    const skip = o.skip || [];
    const empty = (x, y) => { const c = p.get(x, y); return !c || c === OUT || isAlpha(c); };
    const ok = (c) => c && c !== OUT && !isAlpha(c) && skip.indexOf(c) < 0;
    const put = [];
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y); if (!ok(c)) continue;
      if (o.region && !o.region(x, y)) continue;
      const up = empty(x, y - 1) || (o.diag && empty(x - 1, y - 1) && empty(x - 1, y));
      if (o.warm && up && (!o.warmIf || o.warmIf(x, y))) {
        put.push(x, y, O.mix(c, o.warm, o.wa || 0.7));
        if (o.thick && !empty(x, y + 1) && ok(p.get(x, y + 1)) && (!o.thickIf || o.thickIf(x, y))) put.push(x, y + 1, O.mix(p.get(x, y + 1), o.warm, (o.wa || 0.7) * 0.5));
        continue;
      }
      const rt = empty(x + 1, y), dn = empty(x, y + 1);
      if (o.cool && (rt || (o.coolDown && dn)) && (!o.coolIf || o.coolIf(x, y))) put.push(x, y, O.mix(c, o.cool, o.ca || 0.55));
    }
    for (let i = 0; i < put.length; i += 3) { p.set(put[i], put[i + 1], put[i + 2]); R.set(put[i], put[i + 1], put[i + 2]); }
    return R;
  }
  // light sources for the emissive pass
  const THEME_EMI = {
    forest: { lift: 0.34, rim: 0.9, halo: 1 },
    cave: { lift: 0.36, rim: 1, halo: 1 },
    temple: { lift: 0.15, rim: 0.5, halo: 0.8 },
    village: { lift: 0, rim: 0, halo: 0.35 }
  };
  let CANV = null;
  function buildCanvMap() {
    CANV = new Map();
    EMI_NAMES.forEach((name) => {
      const s = O.SPR[name]; if (!s) return;
      CANV.set(s.n, { name, flip: 0, white: false }); CANV.set(s.f, { name, flip: 1, white: false });
      CANV.set(s.wn, { name, flip: 0, white: true }); CANV.set(s.wf, { name, flip: 1, white: true });
    });
  }
  const CALLS = [];
  const REC = {
    globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', globalCompositeOperation: 'source-over',
    drawImage(cv, x, y) { const m = CANV.get(cv); if (m && arguments.length === 3) CALLS.push([m, cv, x, y, this.globalAlpha]); }
  };
  const NOOP = () => {};
  const PROXY = new Proxy(REC, { get: (t, k) => (k in t ? t[k] : NOOP), set: (t, k, v) => { t[k] = v; return true; } });
  function drawEmissive(ctx, game) {
    if (!game || !game.enemies || !game.enemies.length || !game.lvl) return;
    if (!CANV) buildCanvMap();
    const th = THEME_EMI[game.lvl.theme] || THEME_EMI.temple;
    CALLS.length = 0;
    game.enemies.forEach((e) => { try { REC.globalAlpha = 1; e.draw(PROXY, game); } catch (err) { /* ignore */ } });
    if (!CALLS.length) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    CALLS.forEach(([m, cv, x, y, al]) => {
      const L = EMI[m.name];
      ctx.globalCompositeOperation = 'source-over';
      if (!L) { if (!m.white && th.lift > 0) { ctx.globalAlpha = th.lift * al; ctx.drawImage(cv, x, y); } return; }
      if (!m.white && th.lift > 0) { ctx.globalAlpha = Math.min(1, th.lift * L.lift) * al; ctx.drawImage(cv, x, y); }
      if (!m.white && L.rim && th.rim > 0) { ctx.globalAlpha = th.rim * al; ctx.drawImage(L.rim[m.flip], x, y); }
      if (L.core) { ctx.globalAlpha = al; ctx.drawImage(L.core[m.flip], x, y); }
      if (L.halo && th.halo > 0) {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = th.halo * al;
        ctx.drawImage(L.halo[m.flip], x - L.pad, y - L.pad);
      }
    });
    ctx.restore();
  }
  O.drawEmissive = drawEmissive;
  function installEmissiveHook() {
    if (!O.Light || !O.Light.apply || O.Light.apply.__enemyEmissive) return;
    const orig = O.Light.apply;
    const wrapped = function (ctx, game) {
      const m = ctx.getTransform ? ctx.getTransform() : null;
      const r = orig.apply(this, arguments);
      if (!O.EMISSIVE_MANUAL) {
        try { ctx.save(); if (m) ctx.setTransform(m); drawEmissive(ctx, game); } catch (e) { O.logOnce && O.logOnce('drawEmissive', e); } finally { ctx.restore(); }
      }
      return r;
    };
    wrapped.__enemyEmissive = true;
    O.Light.apply = wrapped;
  }

  /* =====================================================================
     palettes (index 0 = highlight .. 4 = deepest; hue-shifted)
     ===================================================================== */
  const C = {
    rock: ['#ecd6bc', '#b8987e', '#86685c', '#584450', '#34263a']
  };

  /* =====================================================================
     ROCK (falling from the den ceiling) ~11x10, anchor bottom-centre
     ===================================================================== */
  // hand-authored faceted chunk: lit top facets, mid front face, dark right/bottom, a zig-zag crack,
  // a fleck of cave moss; faint motion streaks above it (it only shows while falling)
  const ROCK = [
    '....1h1.....',
    '..11h1122...',
    '.1h1122k33..',
    '11122222k334',
    '22222233k344',
    '2223333334k4',
    '33333334444.',
    '.3334444445.',
    '..34445555..',
    '...455......'
  ];
  function makeRock() {
    const p = new O.Pix(14, 16);
    pmap(p, 1, 4, ROCK, { h: '#fff4e2', 1: C.rock[0], 2: C.rock[1], 3: C.rock[2], 4: C.rock[3], 5: C.rock[4], k: C.rock[4] });
    p.set(3, 8, '#8fae55'); p.set(4, 8, '#5f8445'); p.set(4, 9, '#5f8445');
    finish(p, 0);
    const rim = rimLight(p, { warm: '#ffe0b0', wa: 0.3, cool: '#8f98d8', ca: 0.5, coolDown: true });
    // motion streaks
    [[4, 3, 0.45], [4, 2, 0.3], [4, 1, 0.15], [8, 3, 0.4], [8, 2, 0.22], [6, 2, 0.3], [6, 1, 0.15]].forEach(([x, y, a]) => { if (!p.get(x, y)) p.set(x, y, A('#f0e4d4', a)); });
    reg('rock', p, 7, 14, { rim, lift: 1.2 });
  }

  /* =====================================================================
     SNAKE — low olive-ochre viper, deliberately OFF the forest-grass hue: khaki scales, a dark
     chocolate-violet diamond chain down the back, a warm rust belly stripe along the whole lower
     edge and a bright top highlight, so the silhouette separates from green in day and night.
     Wedge viper head with a neck pinch, dark post-ocular stripe, pale lip, emissive amber slit eye,
     thin forked tongue. Head top <= 12 px above the ground (under the standing-swing band): the
     hero must crouch to hit it. Canvas 38x16, anchor = hitbox centre (x 16), feet row 15.
     ===================================================================== */
  C.scale = ['#f4e8a0', '#c9b45a', '#8f7f3a', '#5e5230', '#3a3026'];
  C.chain = ['#7a5238', '#52342c', '#2a1c22'];
  C.rust = ['#f0a060', '#d8743a', '#a8502e', '#6e3028'];
  C.tongue = '#ff3a5e'; C.tongueD = '#b01a44';
  const SN = { W: 38, H: 16, AX: 16, AY: 15 };
  const SNL = { 1: C.scale[0], 2: C.scale[1], 3: C.scale[2], 4: C.scale[3], b: C.scale[3], k: C.chain[2], E: '#ffe03a', s: '#2a1c22',
    l: '#f6ecc8', c: '#e8c890', C: C.rust[1], g: '#e8708a', G: '#b03a5a', r: '#5a1428', W: '#fffdf4' };
  // wedge head, 11x7: 7 px tall at the jaw hinge, 3 px at the snout; heavy brow scale over the eye,
  // dark post-ocular stripe from the eye down to the jaw corner, pale lip line, cream chin.
  const SNAKE_HEAD = [
    '..11111....',
    '.1222bbb11.',
    '1223kEsE221',
    '222kk222222',
    '32kk22lllll',
    '3kk33cccc..',
    '.433c......'
  ];
  // open jaws, drawn as two rotated wedges hinged at the back (~60 degree gape): upper jaw (skull,
  // brow, eye, stripe, pink gum edge, two hanging fangs) and lower jaw (gum edge, cream chin), with a
  // small dark-red throat in the hinge.
  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function snakeHeadOpen(P, hx, hy, E) {
    const H0 = [hx + 1.5, hy + 4.6];
    const tu = -0.5, td = 0.6;
    const UP = [[-1, -4.2], [3, -5.2], [8, -4.4], [11, -2.6], [11.6, -1], [10.5, 0.7], [0, 1]];
    const LO = [[-0.5, -0.5], [9.8, 0.1], [9.8, 1.4], [6, 2.6], [0, 3.1]];
    const loc = (x, y, th) => { const px = x + 0.5 - H0[0], py = y + 0.5 - H0[1], c = Math.cos(-th), s = Math.sin(-th); return [px * c - py * s, px * s + py * c]; };
    const scr = (lx, ly, th) => { const c = Math.cos(th), s = Math.sin(th); return [Math.floor(H0[0] + lx * c - ly * s), Math.floor(H0[1] + lx * s + ly * c)]; };
    for (let y = hy - 8; y < hy + 16; y++) for (let x = hx - 3; x < hx + 16; x++) {
      const [ux, uy] = loc(x, y, tu), [dx, dy] = loc(x, y, td);
      if (inPoly(UP, ux, uy)) {
        let c = SNL[2];
        if (!inPoly(UP, ux, uy - 1.1)) c = SNL[1];
        else if (!inPoly(UP, ux, uy + 1.1)) c = ux > 1.5 ? SNL.g : SNL.k;
        else if (uy > -1.2 && ux < 3) c = SNL[3];
        P.set(x, y, c);
      } else if (inPoly(LO, dx, dy)) {
        let c = SNL.c;
        if (!inPoly(LO, dx, dy - 1.1)) c = dx > 1.5 ? SNL.g : SNL.G;
        else if (!inPoly(LO, dx, dy + 1.1)) c = SNL[4];
        P.set(x, y, c);
      } else if (Math.hypot(x + 0.5 - H0[0], y + 0.5 - H0[1]) < 3.4 && x + 0.5 > H0[0] - 0.5) P.set(x, y, SNL.r);
    }
    // stripe from behind the eye to the jaw corner, brow scale, slit eye
    for (let k = 0; k <= 4; k++) { const q = scr(lerp(4.6, 0.6, k / 4), lerp(-1.8, 0.2, k / 4), tu); P.set(q[0], q[1], SNL.k); }
    for (let k = 0; k < 3; k++) { const q = scr(5.4 + k, -3.6, tu); P.set(q[0], q[1], SNL.b); }
    for (let k = 0; k < 3; k++) { const q = scr(5.4 + k, -2.5, tu); P.set(q[0], q[1], k === 1 ? SNL.s : SNL.E); if (k !== 1) E.push(q); }
    // fangs hanging straight down from the upper-jaw tip
    [[9.9, 0.2, 3], [7.4, 0.5, 2]].forEach(([lx, ly, n]) => {
      const q = scr(lx, ly, tu);
      for (let k = 1; k <= n; k++) P.set(q[0], q[1] + k, k === n ? '#d8d2c8' : SNL.W);
    });
  }
  function snakeFrame(o) {
    const { W, H, AX, AY } = SN, G = AY - 1, p = new O.Pix(W, H);
    const R = 2.3;
    const pts = [];
    const x0 = o.tailX === undefined ? -14 : o.tailX, x1 = o.neckX;
    const NB = 26;
    for (let i = 0; i <= NB; i++) {
      const s = i / NB, x = lerp(x0, x1, s);
      const rr = s < 0.3 ? lerp(0.8, R, Math.pow(s / 0.3, 0.7)) : R;
      const hump = o.amp * Math.max(0, Math.sin((x - x0) * TAU / o.wl + o.phase)) * (0.45 + 0.55 * s);
      const tail = s < 0.12 ? (0.12 - s) / 0.12 * 1.2 : 0;
      pts.push([AX + x, G + 0.6 - rr - hump - tail]);
    }
    // neck: rises from the ground to the head attachment (cubic bezier)
    const nb = pts[pts.length - 1], ha = [AX + o.hx, G + o.hy];
    const c1 = [nb[0] + o.n1[0], nb[1] + o.n1[1]], c2 = [ha[0] + o.n2[0], ha[1] + o.n2[1]];
    for (let i = 1; i <= 12; i++) {
      const t = i / 12, u = 1 - t;
      pts.push([u * u * u * nb[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * ha[0],
        u * u * u * nb[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * ha[1]]);
    }
    let L = 0, Lb = 0; for (let i = 0; i + 1 < pts.length; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); L += d; if (i < NB) Lb = L; }
    const sN = Lb / L;
    // body -> neck tapers to a 3-px pinch right behind the 7-px head
    const rad = (s) => (s < sN * 0.3 ? lerp(0.8, R, Math.pow(s / (sN * 0.3), 0.7)) : s < sN ? R : lerp(R, 1.45, Math.min(1, (s - sN) / (1 - sN) * 1.2)));
    tubeField(p, pts, rad, (x, y, s, u, ox, oy) => {
      const v = -(ox * 0.5 + oy * 0.86);
      const a = s * L + o.pat;
      // warm rust belly stripe along the whole lower edge (throat on the raised neck)
      if (u > 0.4 && s > 0.05) return u > 0.8 || v < -0.6 ? C.rust[2] : C.rust[1];
      if (s > 0.08 && s < sN * 1.02) {
        const m = ((a % 7) + 7) % 7;
        const d = Math.abs(m - 3.5) / 2.9 + Math.abs(u + 0.28) / 0.62;
        if (d < 0.45) return v > 0.4 ? C.chain[0] : C.chain[1];
        if (d < 0.95) return C.chain[2];
        if (u > 0.02 && u < 0.36 && m < 1.2) return C.scale[4];   // lateral spot row
      }
      return C.scale[v > 0.5 ? 1 : v > -0.1 ? 2 : v > -0.55 ? 3 : 4];
    });
    // 1-px bright top highlight along the back
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
      const c = p.get(x, y); if (!c) continue;
      if (c === C.scale[1] || c === C.scale[2]) p.set(x, y, C.scale[0]);
      else if (c === C.chain[2] || c === C.chain[1]) p.set(x, y, C.chain[0]);
      break;
    }
    // head (hand-authored), attached at the neck end
    const hx = Math.round(ha[0]) - 1, hy = Math.round(ha[1]) - 3;
    const HP = new O.Pix(W, H), eyes = [];
    if (o.open) snakeHeadOpen(HP, hx, hy, eyes);
    else for (let j = 0; j < SNAKE_HEAD.length; j++) for (let i = 0; i < SNAKE_HEAD[j].length; i++) {
      const ch = SNAKE_HEAD[j][i]; if (ch === '.') continue;
      HP.set(hx + i, hy + j, SNL[ch]); if (ch === 'E') eyes.push([hx + i, hy + j]);
    }
    over(p, HP, C.scale[4]);
    for (let y = AY; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, null);
    finish(p, 0);
    // thin forked tongue (1 px line, 2-px fork), no outline so it stays a hairline
    if (o.tongue) {
      const tx = hx + SNAKE_HEAD[0].length + 1, ty = hy + 4, tl = o.tongue;
      for (let i = 0; i < tl; i++) p.set(tx + i, ty, C.tongue);
      p.set(tx + tl, ty - 1, C.tongue); p.set(tx + tl, ty + 1, C.tongueD);
    }
    // speed smear behind the striking head
    if (o.smear) {
      [[hy + 1, 4], [hy + 3, 5], [hy + 5, 3]].forEach(([y, n], k) => {
        for (let i = 1; i <= n; i++) { const x = hx - 1 - i - k; if (!p.get(x, y)) p.set(x, y, A(C.scale[0], 0.75 - i * 0.14)); }
      });
    }
    // emissive: slit-eye core + halo; rim: bright back line
    const core = new O.Pix(W, H), glow = new O.Pix(W, H);
    eyes.forEach(([x, y]) => { core.set(x, y, '#fff07a'); glow.set(x, y, '#ffc830'); });
    if (eyes.length === 2) { const m = eyes[0][0] + 1; core.set(m, eyes[0][1], '#2a1c22'); }
    const rim = rimLight(p, { warm: '#fff4b8', wa: 0.35, skip: [SNL.E, SNL.s, C.tongue, C.tongueD, SNL.W] });
    return { p, e: { core, glow, rim, R: 3.5, gain: 0.7, lift: 1.8 } };
  }
  function makeSnake() {
    const base = { neckX: 1, hx: 5, hy: -8.5, n1: [4, 0], n2: [-2, 3], amp: 1.6, wl: 10 };
    const put = (name, o) => { const f = snakeFrame(o); reg(name, f.p, SN.AX, SN.AY, f.e); };
    for (let i = 0; i < 4; i++) {
      put('snake_move_' + i, Object.assign({}, base, {
        phase: -i * TAU / 4, pat: i * 1.75, hy: -8.2 + [0, -0.4, 0, 0.8][i], hx: 5 + [0, 0, 1, 0][i], tongue: [0, 2, 3, 0][i]
      }));
    }
    // anticipation: head pulled BACK and UP into a tight S-coil, neck compressed, mouth closed
    put('snake_lunge_0', Object.assign({}, base, { tailX: -12, phase: 0.9, pat: 0.5, neckX: -3, hx: 1, hy: -9.6, n1: [6, -1], n2: [-6, 3], amp: 2.4 }));
    // strike: full extension forward and low, jaws gaping, fangs out, speed smear
    put('snake_lunge_1', Object.assign({}, base, { tailX: -11, phase: 2.2, pat: 2, neckX: 3, hx: 9, hy: -4.6, n1: [2, 0], n2: [-3, 0], amp: 1.2, open: true, smear: true }));
  }

  /* =====================================================================
     BAT — charcoal-violet body with a rust chest, tall pointed ears, tiny emissive red eyes and white
     fangs. Wings are continuous leathery membranes: a thick arm bone to the wrist (thumb claw), three
     1-px finger bones fanning out, dark cool membrane stretched between them with a warmer translucent
     band hugging each bone, and a scalloped trailing edge that curves 2 px up between fingertips.
     Anchored on the body centre.
     ===================================================================== */
  C.mem = ['#8a4058', '#5a2a48', '#3a1c38', '#26122a'];
  C.memF = ['#5e3050', '#3e2040', '#2c1630', '#1e0e22'];
  C.bone = ['#e8c4b8', '#c8a0a0', '#8a6070'];
  C.bfur = ['#8a7288', '#5e4a5e', '#4a3848', '#34263a', '#221828'];
  C.chest = ['#c07a4c', '#8a4a30', '#5e3024'];
  C.eyeB = ['#ffe0c0', '#ff3020'];
  const BT = { W: 40, H: 30, AX: 20, AY: 14 };
  // front-facing head 9x8: tall pointed ears with dark-rose insides, 1x2 red eyes, snub nose, fangs
  const BAT_FACE = [
    'a.......a',
    'ai.....ia',
    'aia...aia',
    '.a11122a.',
    '.12e2e23.',
    '.12e2e23.',
    '..22n23..',
    '...333...'
  ];
  const BFL = { a: C.bfur[1], i: C.mem[0], 1: C.bfur[0], 2: C.bfur[1], 3: C.bfur[2], e: C.eyeB[1], n: C.bfur[4], W: '#fffdf4' };
  function segDist(px, py, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
    const t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / l2, 0, 1);
    return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t);
  }
  // quadratic scallop from a to b, bowing `depth` px towards `to`
  function scallop(a, b, to, depth, n) {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], dx = to[0] - m[0], dy = to[1] - m[1], l = Math.hypot(dx, dy) || 1;
    const c = [m[0] + dx / l * depth * 2, m[1] + dy / l * depth * 2], out = [];
    for (let i = 1; i < n; i++) { const t = i / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
    return out;
  }
  function batWing(p, cx, cy, side, w, farW) {
    const k = side * (farW ? 0.86 : 1);
    const T = (q) => [cx + q[0] * k, cy + q[1] + (farW ? -0.5 : 0)];
    const S = T([2, -1.5]), Wr = T(w.Wr), F1 = T(w.F1), F2 = T(w.F2), F3 = T(w.F3), B = T(w.B || [2, 4]);
    const poly = [S, Wr, F1].concat(scallop(F1, F2, Wr, 1.25, 5), [F2], scallop(F2, F3, Wr, 1.25, 5), [F3], scallop(F3, B, Wr, 1.1, 5), [B]);
    const M = Mask(p.w, p.h);
    mPoly(M, poly);
    const fingers = [[Wr, F1], [Wr, F2], [Wr, F3]];
    const L = new O.Pix(p.w, p.h);
    const mem = farW ? C.memF : C.mem;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (!mGet(M, x, y)) continue;
      const px = x + 0.5, py = y + 0.5;
      let d = 99; fingers.forEach(([a, b]) => { d = Math.min(d, segDist(px, py, a, b)); });
      const da = segDist(px, py, S, Wr);
      // membrane: warm translucent band along each bone, cool dark between, darkest next to the body
      let c = d < 1.15 || da < 1.6 ? mem[0] : mem[1];
      const db = Math.hypot(px - B[0], py - B[1]);
      if (c === mem[1] && db < 4.5) c = mem[2];
      // fold creases half-way between fingers get the shadow tone
      if (c === mem[1] && !mGet(M, x, y + 1)) c = mem[2];
      L.set(x, y, c);
    }
    // arm bone (2 px: lit top edge, fur underneath), three 1-px finger bones, thumb claw
    const arm = Mask(p.w, p.h); mTube(arm, S[0], S[1], Wr[0], Wr[1], 1.3, 0.8);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (mGet(arm, x, y)) L.set(x, y, mGet(arm, x, y - 1) ? C.bfur[farW ? 4 : 3] : (farW ? C.bone[2] : C.bone[0]));
    fingers.forEach(([a, b]) => L.line(a[0], a[1], b[0], b[1], farW ? C.memF[0] : C.bone[2]));
    const wx = Math.round(Wr[0]), wy = Math.round(Wr[1]);
    L.set(wx, wy, farW ? C.bone[2] : C.bone[0]);
    L.set(wx + (side > 0 ? -1 : 1) * 0, wy - 1, farW ? C.bone[2] : C.bone[0]); L.set(wx - side, wy - 2, C.bfur[4]); // thumb claw
    over(p, L, farW ? null : C.mem[3], C.mem[3]);
  }
  function batBody(p, cx, cy) {
    const Bp = new O.Pix(p.w, p.h), S = Solid(p.w, p.h);
    sEll(S, cx, cy + 1.5, 3.4, 4.6, 4, 2);
    litSolid(Bp, S, C.bfur, { th: [0.9, 0.62, 0.25, -0.2], bias: 0.05 });
    // rust chest patch + fur tufts
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      if (!Bp.get(x, y)) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - (cy + 0.6);
      if (dx * dx / 5 + dy * dy / 7 < 1) Bp.set(x, y, dx < -0.5 && dy < 0.5 ? C.chest[0] : dy > 1.2 ? C.chest[2] : C.chest[1]);
    }
    setF(Bp, Math.floor(cx), Math.floor(cy + 5), C.bfur[3]); setF(Bp, Math.floor(cx - 1), Math.floor(cy + 4), C.chest[2]);
    over(p, Bp, C.bfur[4]);
    // tiny clawed feet
    p.set(Math.floor(cx - 2), Math.floor(cy + 6.5), C.bfur[3]); p.set(Math.floor(cx + 1), Math.floor(cy + 6.5), C.bfur[3]);
    // head (hand-authored face)
    const Hh = new O.Pix(p.w, p.h);
    const fx0 = Math.floor(cx) - 4, fy0 = Math.floor(cy) - 7;
    pmap(Hh, fx0, fy0, BAT_FACE, BFL);
    over(p, Hh, C.bfur[4]);
    // white fangs under the snout (after the contour pass so they are not eaten by it)
    p.set(fx0 + 3, fy0 + 7, '#fffdf4'); p.set(fx0 + 5, fy0 + 7, '#fffdf4'); p.set(fx0 + 4, fy0 + 7, '#3a0e22');
    return [[fx0 + 3, fy0 + 4], [fx0 + 5, fy0 + 4]];
  }
  // emissive eyes: 1x2 each, glint on top
  function batEyes(eyes, W, H, up) {
    const core = new O.Pix(W, H), glow = new O.Pix(W, H);
    eyes.forEach(([x, y]) => {
      core.set(x, y + (up ? 1 : 0), '#ff4a30'); core.set(x, y + (up ? 0 : 1), '#ff3020');
      core.set(x, y + (up ? 1 : 0), C.eyeB[0]);
      glow.set(x, y, '#ff2a18'); glow.set(x, y + 1, '#ff2a18');
    });
    return { core, glow };
  }
  const BAT_WINGS = [
    { dy: 1, Wr: [4.5, -8], F1: [5.5, -14.5], F2: [9.5, -13], F3: [11.5, -6.5], B: [2, 3.5] },   // up
    { dy: 0, Wr: [7, -3], F1: [14.5, -6], F2: [16.5, 0], F3: [12, 4.5], B: [2, 4] },         // spread (down-stroke)
    { dy: -1, Wr: [6.5, 2], F1: [12.5, 6], F2: [10, 10.5], F3: [5, 9.5], B: [2, 4.5] },      // down
    { dy: 0, Wr: [5, -5], F1: [7, -11.5], F2: [11, -9.5], F3: [11.5, -3], B: [2, 4] }    // recovery (folding up)
  ];
  function batFly(i) {
    const { W, H, AX, AY } = BT, p = new O.Pix(W, H), w = BAT_WINGS[i];
    const cx = AX + 0.5, cy = AY + 0.5 + w.dy;
    batWing(p, cx - 0.5, cy, -1, w, true);   // far wing (left)
    const body = new O.Pix(W, H);
    const eyes = batBody(body, cx, cy);
    over(p, body, C.bfur[4]);
    const near = new O.Pix(W, H);
    batWing(near, cx + 0.5, cy, 1, w, false);
    over(p, near, C.mem[3], C.mem[3]);
    finish(p, 0);
    const rim = rimLight(p, { warm: '#b8a8e8', wa: 0.4, skip: [C.eyeB[1], '#fffdf4'] });
    const e = batEyes(eyes, W, H, false);
    return { p, e: { core: e.core, glow: e.glow, rim, R: 3, gain: 0.9 } };
  }
  function batHang() {
    const { W, H, AX, AY } = BT, p = new O.Pix(W, H);
    const cx = AX + 0.5, cy = AY + 0.5;
    // wings wrapped like a cloak: the near wing overlaps the far one on a diagonal seam
    const Wp = new O.Pix(W, H), S = Solid(W, H);
    sEll(S, cx - 0.3, cy - 2.5, 4.6, 6.4, 5, 2);
    sEll(S, cx - 0.3, cy + 2.5, 3.6, 3, 4, 2);
    litSolid(Wp, S, C.mem, { th: [0.93, 0.55, 0.12], bias: 0 });
    // near wing wraps over from the right: slightly lighter, its edge a crisp diagonal seam
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = Wp.get(x, y); if (!c) continue;
      const seam = (x + 0.5 - cx) + (y + 0.5 - cy) * 0.28 + 0.6;
      if (seam < 0) Wp.set(x, y, C.memF[Math.min(3, C.mem.indexOf(c) + 0)]);
      if (Math.abs(seam) < 0.55) Wp.set(x, y, C.bone[2]);
    }
    // folded finger ridges (2 on the near wing, 1 on the far), asymmetric
    [[2.2, -8, 2.8, 2], [3.6, -6.5, 3.4, 1], [-3, -7, -3.4, 1.5]].forEach(([x0, y0, x1, y1], k) => {
      Wp.line(cx + x0, cy + y0, cx + x1, cy + y1, k === 2 ? C.bone[2] : C.bone[1]);
      Wp.line(cx + x0 + (k === 2 ? 1 : -1), cy + y0 + 1, cx + x1 + (k === 2 ? 1 : -1), cy + y1, C.mem[0]);
    });
    Wp.set(cx + 3, cy + 3, C.bone[0]); Wp.set(cx - 4, cy + 2, C.bone[2]); // wrist claws
    over(p, Wp, C.mem[3]);
    // clawed feet gripping the perch (top row)
    [[-2, -10], [1, -10], [-2, -9.5], [1, -9.5]].forEach(([x, y], i) => p.set(cx + x, cy + y, i < 2 ? C.bfur[4] : C.bfur[3]));
    p.set(cx - 1, cy - 10, C.bfur[4]); p.set(cx + 2, cy - 10, C.bfur[4]);
    // head, upside down at the bottom
    const Hh = new O.Pix(W, H);
    const fy0 = Math.floor(cy) + 3;
    pmap(Hh, Math.floor(cx) - 4, fy0, BAT_FACE.slice().reverse(), BFL);
    over(p, Hh, C.bfur[4]);
    finish(p, 0);
    const rim = rimLight(p, { warm: '#e0a8c0', wa: 0.4, cool: '#8f8fd8', ca: 0.4, skip: [C.eyeB[1], '#fffdf4'] });
    // eye rows of the reversed map: rows 7-4 -> 2..3 from the top of the reversed face
    const e = batEyes([[Math.floor(cx) - 1, fy0 + 2], [Math.floor(cx) + 1, fy0 + 2]], W, H, true);
    return { p, e: { core: e.core, glow: e.glow, rim, R: 3, gain: 0.9 } };
  }
  function makeBat() {
    for (let i = 0; i < 4; i++) { const f = batFly(i); reg('bat_fly_' + i, f.p, BT.AX, BT.AY, f.e); }
    const h = batHang(); reg('bat_hang', h.p, BT.AX, BT.AY, h.e);
  }

  /* =====================================================================
     SATYR — goat-legged forest brute, ~42 px. Barrel chest and heavy shoulders (lit pec + deltoid,
     violet core shadow), head thrust forward with a heavy brow, emissive amber eye, snarling fanged
     mouth and a pointed beard. A big opaque grey-ivory RAM HORN spirals 1.5 turns on the side of the
     skull, ridged every 2 px, its tip curling forward past the cheek. Rust-brown shaggy goat legs
     (thigh forward, long shin angled back to a pronounced hock, dark cloven hooves) with jagged fur
     tufts, a crude knotted club carried over the shoulder with the fist in front. Warm rim on top,
     cool rim on the right/back edges. Canvas 64x64, anchor x 30, feet row 61.
     ===================================================================== */
  C.sk = ['#ffdcb4', '#f0b890', '#c8845e', '#8a5048', '#5a3450'];
  C.gfur = ['#d8925a', '#a0643c', '#6e4030', '#4e2c34', '#321e2c'];
  C.hornS = ['#fffaec', '#eee2c4', '#bca884', '#76645c', '#3a2c3a'];
  C.hairS = ['#5a3a30', '#3e2828', '#2a1a22'];
  C.beardS = ['#9a5e3a', '#6a3c2a', '#40242a'];
  C.clubW = ['#c48656', '#96583a', '#66382a', '#42211f', '#2a1418'];
  C.hoofS = ['#7a6a78', '#4a3e50', '#2e2438', '#1c1624'];
  const ST = { W: 64, H: 64, AX: 30, AY: 61 };
  const far = (r, a) => r.map((c) => O.mix(O.shift(c, -(a || 0.2) * 0.5), '#3a2a48', (a || 0.2) * 1.2));
  function ik(a, b, l1, l2, dir) {
    let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 0.001;
    const mx = l1 + l2 - 0.05;
    if (d > mx) { b = [a[0] + dx / d * mx, a[1] + dy / d * mx]; dx = b[0] - a[0]; dy = b[1] - a[1]; d = mx; }
    const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    const ux = dx / d, uy = dy / d;
    return [a[0] + ux * x + uy * h * dir, a[1] + uy * x - ux * h * dir];
  }
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // Head facing right, 12x15. h/H/j hair, 1-5 skin, b brow shadow, e/E eye, n nose, m mouth interior,
  // w fang, t tooth row, B/C/D beard. The horn is painted over the back of the skull afterwards.
  const SATYR_HEAD = [
    '...hhhhh.....',
    '..hHHHHhh....',
    '.hHHHHH1122..',
    '.hHHH1111112.',
    'hHHH22bbbbb3.',
    'hjj3222beE2b1',
    'hj32222233n21',
    '.j3322223nn21',
    '.j43222233344',
    '.D43mtttttm4.',
    '.DC43mmmm34..',
    '.DCC43333BC..',
    '..DCCBBBCBC..',
    '...DDCBBCBC..',
    '.....DCBBC...',
    '.......DCB...'
  ];
  const SATYR_SNARL = [ // open snarl: dark mouth, two upper and two lower fangs
    '.j43222233344',
    '.D4mwmmmwm4..',
    '.DC4mmmmmm4..',
    '.DCC4wmmw4C..',
    '..DCC44BCBC..'
  ];
  const SHL = { h: C.hairS[0], H: C.hairS[1], j: C.hairS[2], 1: C.sk[0], 2: C.sk[1], 3: C.sk[2], 4: C.sk[3], 5: C.sk[4], b: '#6a3040',
    e: '#ffb020', E: '#fff27a', n: C.sk[3], m: '#2a0e1c', w: '#fffaf0', t: '#f0e6d8', B: C.beardS[0], C: C.beardS[1], D: C.beardS[2] };
  function satyrFrame(q) {
    const { W, H, AX, AY } = ST, G = AY - 1, p = new O.Pix(W, H);
    const X = (x) => AX + x, Y = (y) => G + y;
    const by = q.by || 0, lean = q.lean === undefined ? 0.1 : q.lean, br = q.breath || 0;
    const hip = [X(q.hx || 0), Y(-19 + by)];
    const T = (x, y) => { const s = Math.sin(lean), c = Math.cos(lean); return [hip[0] + x * c - y * s, hip[1] + x * s + y * c]; };
    const skF = far(C.sk, 0.35), furF = far(C.gfur, 0.25);
    /* ---------- goat leg: thick furry thigh forward -> long shin back to the hock -> cannon -> hoof ---------- */
    function leg(side, def, ramp, hoofP) {
      const S = Solid(W, H), L = new O.Pix(W, H);
      const top = [hip[0] + (side ? 1.5 : -1.5), hip[1] + 0.5];
      const hoof = [X(def.hoof[0]), Y(def.hoof[1])];
      const fet = [hoof[0] - 0.3 + (def.fx || 0), hoof[1] - 2.2];
      const hock = [fet[0] - 3.2 + (def.hk || 0), fet[1] - 5.6 + (def.hky || 0)];
      const knee = ik(top, hock, 8, 6.8, 1);
      sCap(S, top[0], top[1] - 1.5, knee[0], knee[1], 4.2, 2.8, 2, 1.3);   // ham / thigh
      sCap(S, knee[0], knee[1], hock[0], hock[1], 2.3, 1.5, 1.5, 1.2);     // shin
      sEll(S, hock[0] - 0.3, hock[1], 1.8, 1.6, 1.4, 1);                   // hock point
      sCap(S, hock[0], hock[1], fet[0], fet[1], 1.4, 1.2, 1.2, 1.1);       // cannon
      const lit = litSolid(L, S, ramp, { th: [0.9, 0.6, 0.28, -0.1], bias: side ? 0.04 : -0.08 });
      despeckle(L);
      // fur strands: short darker strokes running down-back on the thigh
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = L.get(x, y); if (!c || y > hock[1]) continue;
        const i = ramp.indexOf(c);
        if (i >= 1 && i < 3 && (x + y * 2) % 7 === 0 && (y % 3) === 0 && L.get(x, y + 2) && L.get(x - 1, y) && L.get(x + 1, y)) { L.set(x, y, ramp[i + 1]); if (L.get(x - 1, y + 1)) L.set(x - 1, y + 1, ramp[i + 1]); }
        else if (i === 2 && lit.V[y * W + x] > 0.4 && (x + y * 2) % 7 === 3 && (y % 3) === 1) L.set(x, y, ramp[1]);
      }
      // jagged shag: tufts off the back of the thigh, over the hock and feathering above the hoof
      const tuft = (x0, y0, dx, dy, n, c1, c2) => { for (let k = 0; k < n; k++) L.set(Math.round(x0 + dx * k), Math.round(y0 + dy * k), k < n - 1 ? c1 : c2); };
      const back = (y) => { for (let x = 0; x < W; x++) if (L.get(x, Math.round(y))) return x; return null; };
      for (let yy = top[1] + 2; yy < knee[1] + 1; yy += 3.5) { const bx = back(yy); if (bx !== null) tuft(bx - 0.4, yy, -0.8, 0.8, 3, ramp[2], ramp[3]); }
      tuft(hock[0] - 2, hock[1] - 1, -0.6, 1, 3, ramp[2], ramp[4]);
      tuft(fet[0] - 1.6, fet[1] - 0.5, -0.3, 1, 2, ramp[2], ramp[3]);
      tuft(fet[0] + 1.4, fet[1] - 0.5, 0.3, 1, 2, ramp[1], ramp[3]);
      // cloven hoof 4x3
      const hx = Math.round(hoof[0]) - 2, hy = Math.round(hoof[1]) - 2;
      pmap(L, hx, hy, ['abba', 'abbc', 'bcoc'], { a: hoofP[0], b: hoofP[1], c: hoofP[2], o: hoofP[3] });
      return L;
    }
    /* ---------- arm: deltoid, bicep, forearm ---------- */
    function arm(sh, hand, dir, ramp, near, l1, l2, elbow) {
      const S = Solid(W, H), L = new O.Pix(W, H);
      const el = elbow || ik(sh, hand, l1 || 6.5, l2 || 6.5, dir);
      if (near) sEll(S, sh[0], sh[1] + 0.5, 3.6, 3.4, 3.4, 2);     // deltoid cap
      sCap(S, sh[0], sh[1], el[0], el[1], near ? 3 : 2.6, 2.3, 1.5, 1.2);
      sCap(S, el[0], el[1], hand[0], hand[1], near ? 2.5 : 2.2, 2, 1.5, 1.2);
      litSolid(L, S, ramp, { th: [0.88, 0.6, 0.3, -0.1], bias: near ? 0 : -0.15 });
      despeckle(L);
      if (near) { // leather wrist wrap
        const w0 = [lerp(el[0], hand[0], 0.72), lerp(el[1], hand[1], 0.72)];
        const ux = hand[0] - el[0], uy = hand[1] - el[1], ul = Math.hypot(ux, uy) || 1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!L.get(x, y)) continue;
          const d = ((x + 0.5 - w0[0]) * ux + (y + 0.5 - w0[1]) * uy) / ul;
          if (Math.abs(d) < 1.1 && Math.hypot(x + 0.5 - w0[0], y + 0.5 - w0[1]) < 3.4) L.set(x, y, d < 0 ? '#8a5436' : '#54302a');
        }
      }
      return { L, el };
    }
    function fist(L, hx, hy, ramp) { // knuckles wrapped round the handle
      pmap(L, Math.round(hx) - 2, Math.round(hy) - 2, ['.112.', '12223', '1k2k3', '.334.'], { 1: ramp[0], 2: ramp[1], 3: ramp[2], 4: ramp[3], k: ramp[3] });
    }
    /* ---------- club: tapered handle -> knotty head, dark red wood, iron nails ---------- */
    function club(g, tip) {
      const L = new O.Pix(W, H);
      const dx = tip[0] - g[0], dy = tip[1] - g[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const pts = [[g[0] - ux * 3, g[1] - uy * 3], [tip[0], tip[1]]];
      tubeField(L, pts, (s) => (s < 0.42 ? 1.1 : lerp(1.1, 3.4, Math.pow((s - 0.42) / 0.58, 0.7))) + (s > 0.62 && s < 0.7 ? 0.7 : 0) + (s > 0.84 && s < 0.9 ? 0.6 : 0),
        (x, y, s, u, ox, oy) => {
          const v = -(ox * 0.55 + oy * 0.83);
          let i = v > 0.55 ? 0 : v > 0.1 ? 1 : v > -0.4 ? 2 : 3;
          if (s > 0.96 && i < 3) i++;
          return C.clubW[i];
        });
      [[0.66, 1.6], [0.8, -1.8], [0.92, 1.2]].forEach(([t, o]) => {
        const x = Math.round(g[0] + dx * t - uy * o), y = Math.round(g[1] + dy * t + ux * o);
        if (L.get(x, y)) L.set(x, y, C.clubW[4]);
      });
      [[0.74, -2], [0.9, 2.2], [0.82, 0.2]].forEach(([t, o]) => {
        const x = Math.round(g[0] + dx * t - uy * o), y = Math.round(g[1] + dy * t + ux * o);
        L.set(x, y, '#e8e6f2'); L.set(x + 1, y + 1, '#4a4058');
      });
      return L;
    }
    /* ---------- far arm, far leg, tail ---------- */
    const farSh = T(-3, -10.5);
    const fa = arm(farSh, [X(q.farHand[0]), Y(q.farHand[1] + by)], q.farDir || -1, skF, false, 6, 6, q.farElbow ? [X(q.farElbow[0]), Y(q.farElbow[1] + by)] : null);
    over(p, fa.L, null);
    { const L = new O.Pix(W, H); fist(L, X(q.farHand[0]), Y(q.farHand[1] + by), skF); over(p, L, null); }
    over(p, leg(0, q.far, furF, far(C.hoofS, 0.1)), null);
    const tl = q.tail || 0;
    const TL = new O.Pix(W, H), tb = T(-6.5, -2);
    pmap(TL, Math.round(tb[0]) - 3, Math.round(tb[1]) - 2 + Math.round(tl * 0.6), ['.12.', '1223', '.234', '..4.'], { 1: C.gfur[1], 2: C.gfur[2], 3: C.gfur[3], 4: C.gfur[4] });
    over(p, TL, null);
    /* ---------- torso: barrel chest, traps, abdomen, thick neck ---------- */
    const S = Solid(W, H);
    const E = (x, y, rx, ry, rz, k) => { const c = T(x, y); sEll(S, c[0], c[1], rx, ry, rz, k || 3); };
    E(0.5, -3.5, 5.6, 4, 5);                               // abdomen
    E(1.5, -8.5 - br * 0.6, 8 + br * 0.3, 5.4, 6.5);        // barrel chest (~16 px deep)
    E(-0.5, -12 - br, 7.4, 3.4, 5.5);                       // shoulder girdle / traps
    { const a = T(2, -11.5 - br), b = T(4, -14.5 - br); sCap(S, a[0], a[1], b[0], b[1], 3.3, 2.8, 2, 1); } // bull neck
    const TP = new O.Pix(W, H);
    const tl2 = litSolid(TP, S, C.sk, { th: [0.88, 0.66, 0.36, 0], bias: 0 }); despeckle(TP);
    // muscle definition: pec shelf, sternum groove, 2 ab rows, serratus notches
    const P = (x, y, c) => { const t = T(x, y); setF(TP, Math.round(t[0]), Math.round(t[1]), c); };
    [[-0.5, -5.3], [1, -4.9], [2.5, -4.9], [4, -5.1], [5.5, -5.6], [6.8, -6.4]].forEach(([x, y], i) => { P(x, y - br * 0.5, C.sk[3]); if (i && i < 5) P(x, y - 1 - br * 0.5, C.sk[0]); });
    [[4.2, -9.4], [4.2, -8.2]].forEach(([x, y]) => P(x, y - br * 0.5, C.sk[2]));
    [[3.5, -3], [3.5, -1.4], [1.5, -2.8]].forEach(([x, y]) => { P(x, y, C.sk[3]); P(x - 1, y - 0.8, C.sk[1]); });
    [[-2.5, -6.5], [-3, -5]].forEach(([x, y]) => P(x, y, C.sk[3]));
    over(p, TP, null);
    /* ---------- shaggy fur loin (jagged waistline, tufts pointing up into the belly) ---------- */
    const FS = Solid(W, H);
    { const c = T(0, 0.8); sEll(FS, c[0], c[1], 6.6, 3.6, 4, 2); }
    const FP = new O.Pix(W, H);
    litSolid(FP, FS, C.gfur, { th: [0.9, 0.55, 0.2, -0.2], bias: 0.1 });
    for (let k = -6; k <= 6; k += 2) { const c = T(k, -2.2 - ((k + 8) % 4 === 0 ? 1 : 0)); FP.set(Math.round(c[0]), Math.round(c[1]), C.gfur[1]); FP.set(Math.round(c[0]), Math.round(c[1]) + 1, C.gfur[1]); FP.set(Math.round(c[0]) + 1, Math.round(c[1]) + 1, C.gfur[2]); }
    for (let k = -6; k <= 6; k += 2) { const c = T(k, 3.8); const n = 2 + ((k + 7) % 3 === 0 ? 1 : 0); for (let j = 0; j < n; j++) FP.set(Math.round(c[0] - j * 0.4), Math.round(c[1] + j), C.gfur[j === n - 1 ? 4 : 3]); }
    over(p, FP, C.gfur[4], C.gfur[3]);
    /* ---------- near leg ---------- */
    over(p, leg(1, q.near, C.gfur, C.hoofS), C.gfur[4], C.gfur[3]);
    /* ---------- head (map) + horn ---------- */
    const neck = T(4.5, -14.5 - br), hd = q.head || [0, 0];
    const hx0 = Math.round(neck[0] + hd[0]) - 3, hy0 = Math.round(neck[1] + hd[1]) - 9;
    const HP = new O.Pix(W, H);
    const rows = SATYR_HEAD.slice();
    if (q.snarl) SATYR_SNARL.forEach((r, i) => { rows[8 + i] = r; });
    pmap(HP, hx0, hy0, rows, SHL);
    if (q.beard) { for (let y = hy0 + 12; y < hy0 + 16; y++) { const sh = y > hy0 + 13 ? q.beard : Math.sign(q.beard) * (Math.abs(q.beard) > 1 ? 1 : 0); if (!sh) continue; const row = []; for (let x = 0; x < W; x++) row.push(HP.get(x, y)); for (let x = 0; x < W; x++) HP.set(x, y, row[x - sh] || null); } }
    over(p, HP, C.sk[4]);
    // RAM HORN: filled, opaque, 1.5-turn spiral around the ear, ridged, tip curling past the cheek
    const HR = new O.Pix(W, H);
    const hc = [hx0 + 1.8 + (q.hornDx || 0), hy0 + 4.8];
    // explicit ram-horn path (head-local): root on the crown, up and back over the skull, down behind
    // the ear, forward under it and the tip curling up past the cheek
    const HK = [[6.2, 2.6], [4.6, -0.4], [1.2, -0.8], [-1.6, 1.8], [-2.6, 5.6], [-1.2, 9.4], [2.2, 11], [5.4, 10.2], [7.2, 8.2]].map(([x, y]) => [1.8 + (x - 2.2) * 0.74, 4.8 + (y - 5.6) * 0.74]);
    const cr = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    const hornPath = [];
    for (let i = 0; i < HK.length - 1; i++) for (let k = 0; k < 4; k++) {
      const t = k / 4, a0 = HK[Math.max(0, i - 1)], a1 = HK[i], a2 = HK[i + 1], a3 = HK[Math.min(HK.length - 1, i + 2)];
      hornPath.push([hx0 + (q.hornDx || 0) + cr(a0[0], a1[0], a2[0], a3[0], t), hy0 + cr(a0[1], a1[1], a2[1], a3[1], t)]);
    }
    hornPath.push([hx0 + (q.hornDx || 0) + HK[HK.length - 1][0], hy0 + HK[HK.length - 1][1]]);
    // inner face of the coil: filled disc with a half-turn spiral groove (reads as 1.5 turns)
    for (let y = Math.floor(hc[1] - 4); y <= hc[1] + 4; y++) for (let x = Math.floor(hc[0] - 4); x <= hc[0] + 4; x++) {
      const dx = x + 0.5 - hc[0], dy = y + 0.5 - hc[1], d = Math.hypot(dx * 0.95, dy);
      if (d > 2.4) continue;
      const ang = Math.atan2(dy, dx), sp = (d - 0.5 - ((ang + Math.PI) / TAU) * 1.6);
      const groove = Math.abs(((sp % 1.6) + 1.6) % 1.6 - 0.8) < 0.3;
      const lit = -(dx * 0.55 + dy * 0.83) / 3.3;
      HR.set(x, y, groove ? C.hornS[4] : lit > 0.2 ? C.hornS[2] : C.hornS[3]);
    }
    tubeField(HR, hornPath, (s) => lerp(2.1, 0.7, Math.pow(s, 1.15)), (x, y, s, u, ox, oy) => {
      const v = -(ox * 0.55 + oy * 0.83);
      let i = v > 0.5 ? 0 : v > 0.05 ? 1 : v > -0.45 ? 2 : 3;
      const groove = ((s * 30) % 2) < 0.6;                  // ridge grooves every ~2 px
      if (groove && s < 0.92) i = Math.min(4, i + (i < 2 ? 2 : 1));
      return C.hornS[i];
    });
    over(p, HR, C.hornS[4], C.hornS[3]);
    /* ---------- club + near arm + fist (handle crosses IN FRONT of the shoulder) ---------- */
    const nh = [X(q.hand[0]), Y(q.hand[1] + by)];
    const clubL = club(nh, [X(q.clubTip[0]), Y(q.clubTip[1] + by)]);
    const nSh = T(4.5, -11 - br);
    const na = arm(nSh, nh, q.armDir || 1, C.sk, true, 7, 6.5, q.elbow ? [X(q.elbow[0]), Y(q.elbow[1] + by)] : null);
    if (q.clubBehind) { over(p, clubL, C.clubW[4], C.clubW[3]); over(p, na.L, C.sk[4], C.sk[4]); }
    else { over(p, na.L, C.sk[4], C.sk[4]); over(p, clubL, C.clubW[4], C.clubW[3]); }
    { const L = new O.Pix(W, H); fist(L, nh[0], nh[1], C.sk); over(p, L, C.sk[4]); }
    if (q.farFront) { const L = new O.Pix(W, H); fist(L, X(q.farHand[0]), Y(q.farHand[1] + by), skF); over(p, L, C.sk[4]); }
    finish(p, 0);
    // rims: warm light on top edges, cool moon rim on right / back edges
    const eyeC = [SHL.e, SHL.E, SHL.w, SHL.m];
    const rim = rimLight(p, { warm: '#ffe0b0', wa: 0.45, cool: '#8fa0e0', ca: 0.6, skip: eyeC });
    const core = new O.Pix(W, H), glow = new O.Pix(W, H);
    const ex = hx0 + 8, ey = hy0 + 5;
    core.set(ex, ey, '#ffb020'); core.set(ex + 1, ey, '#fff27a'); glow.set(ex, ey, '#ff9a20'); glow.set(ex + 1, ey, '#ffb030');
    return { p, e: { core, glow, rim, R: 3.2, gain: 0.8, lift: 1.5 } };
  }
  function makeSatyr() {
    const { AX, AY } = ST;
    const put = (name, q) => { const f = satyrFrame(q); reg(name, f.p, AX, AY, f.e); };
    const idle = (o) => Object.assign({
      lean: 0.12, near: { hoof: [3.5, 0] }, far: { hoof: [-3.5, 0] },
      hand: [9.5, -16.5], elbow: [7, -22.5], clubTip: [20.5, -24], farHand: [-3.5, -17]
    }, o);
    put('satyr_idle_0', idle({}));
    put('satyr_idle_1', idle({ breath: 1, hand: [9.5, -17.5], elbow: [7.1, -23.5], clubTip: [21, -26], farHand: [-4, -17.5], tail: -1, beard: 1, head: [0, -0.4], snarl: true }));
    // 6-frame stomp: contact / down / passing, mirrored. Hooves 12 px apart at contact.
    const NH = [[6, 0], [2, 0], [-2, 0], [-6, 0], [-4, -4], [2, -5]];
    const FH = [[-6, 0], [-4, -4], [2, -5], [6, 0], [2, 0], [-2, 0]];
    const bob = [0, 1, -1, 0, 1, -1];
    for (let i = 0; i < 6; i++) {
      const nSw = i >= 4, fSw = i === 1 || i === 2;
      const armSw = Math.cos(i / 6 * TAU);
      const lag = bob[(i + 5) % 6];
      put('satyr_walk_' + i, {
        by: bob[i], lean: 0.14 + (i % 3 === 0 ? 0.04 : 0),
        near: { hoof: NH[i], hk: nSw ? -1.5 : 0, hky: nSw ? 2 : 0, fx: nSw ? -1 : 0 }, far: { hoof: FH[i], hk: fSw ? -1.5 : 0, hky: fSw ? 2 : 0, fx: fSw ? -1 : 0 },
        hand: [9.5, -16.5 - (bob[i] < 0 ? 0.5 : 0)], elbow: [7, -22.5], clubTip: [20.5, -24 + lag * 1.2],
        farHand: [-3 + armSw * 3.5, -17 - Math.abs(armSw)], tail: lag, beard: lag > 0 ? -1 : lag < 0 ? 1 : 0,
        head: [0, lag > 0 ? 0.5 : 0], snarl: i === 0 || i === 3
      });
    }
    // JUMP: both fists above the horns, club head raised high and arcing back (smash), legs tucked
    put('satyr_jump', {
      by: -2, lean: -0.08, near: { hoof: [3, -7], hk: 0.5, hky: 2.2, fx: -0.5 }, far: { hoof: [-1, -6], hk: 0.5, hky: 2, fx: -0.5 },
      hand: [3, -46.5], elbow: [5.5, -38.5], clubTip: [-10, -52.5], farHand: [1, -46], farElbow: [3, -38], farFront: true, clubBehind: true,
      snarl: true, tail: -2, beard: -1, head: [0.5, 0.5]
    });
  }

  /* =====================================================================
     3D "solid" painter: smooth union of ellipsoids / tapered capsules -> height field -> normals
     -> banded form shading (clean clusters, no noise). Used for the big masses (boar, satyr).
     ===================================================================== */
  function Solid(w, h) { const H = new Float32Array(w * h); H.fill(-1); return { w, h, H }; }
  const smax = (a, b, k) => { if (a < 0) return b; const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
  function sEll(S, cx, cy, rx, ry, rz, k) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (x < 0 || y < 0 || x >= S.w || y >= S.h) continue;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      const i = y * S.w + x; S.H[i] = smax(S.H[i], rz * Math.sqrt(1 - d2), k || 4);
    }
    return S;
  }
  function sCap(S, x0, y0, x1, y1, r0, r1, k, zk) {
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, R = Math.max(r0, r1) + 1;
    for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++) {
      for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++) {
        if (x < 0 || y < 0 || x >= S.w || y >= S.h) continue;
        const px = x + 0.5, py = y + 0.5, t = clamp(((px - x0) * dx + (py - y0) * dy) / l2, 0, 1);
        const r = r0 + (r1 - r0) * t, d = Math.hypot(px - x0 - dx * t, py - y0 - dy * t);
        if (d > r) continue;
        const i = y * S.w + x; S.H[i] = smax(S.H[i], r * Math.sqrt(1 - (d / r) * (d / r)) * (zk || 1), k || 2);
      }
    }
    return S;
  }
  const LV = (() => { const l = Math.hypot(-0.5, -0.72, 0.5); return [-0.5 / l, -0.72 / l, 0.5 / l]; })();
  // Paints the solid with `ramp` (index 0 = brightest). th = descending thresholds on n.L (length ramp-1).
  // Returns per-pixel {v (lighting), ny (normal y), nx} buffers for later texture passes.
  function litSolid(p, S, ramp, o) {
    o = o || {};
    const w = S.w, h = S.h, H = S.H, n = ramp.length;
    const th = o.th || [0.84, 0.64, 0.4, 0.14, -0.2].slice(0, n - 1);
    const edge = o.edge === undefined ? -1.5 : o.edge;
    const hv = (x, y) => (x < 0 || y < 0 || x >= w || y >= h || H[y * w + x] < 0 ? edge : H[y * w + x]);
    const V = new Float32Array(w * h), NX = new Float32Array(w * h), NY = new Float32Array(w * h);
    let y0 = h, y1 = 0;
    for (let i = 0; i < w * h; i++) if (H[i] >= 0) { const y = (i / w) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (H[i] < 0) continue;
      let nx = (hv(x - 1, y) - hv(x + 1, y)) * 0.5, ny = (hv(x, y - 1) - hv(x, y + 1)) * 0.5, nz = o.nz || 1;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const L = o.L || LV;
      let v = nx * L[0] + ny * L[1] + nz * L[2] + (o.bias || 0);
      if (o.gy) v -= o.gy * ((y - y0) / Math.max(1, y1 - y0) - 0.35);
      V[i] = v; NX[i] = nx; NY[i] = ny;
      let idx = n - 1;
      for (let k = 0; k < th.length; k++) if (v > th[k]) { idx = k; break; }
      if (o.min !== undefined && idx < o.min) idx = o.min;
      p.set(x, y, ramp[idx]);
    }
    return { V, NX, NY };
  }
  // Removes isolated single pixels (cluster clean-up): a pixel with no same-coloured 4-neighbour
  // takes the colour most of its neighbours share.
  function despeckle(p, only) {
    const put = [];
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const c = p.get(x, y); if (!c || (only && only.indexOf(c) < 0)) continue;
      const nb = [p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1), p.get(x, y + 1)];
      if (nb.some((q) => q === c) || nb.some((q) => !q)) continue;
      const cnt = {}; nb.forEach((q) => { cnt[q] = (cnt[q] || 0) + 1; });
      const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
      if (cnt[best] >= 2 && (!only || only.indexOf(best) >= 0)) put.push(x, y, best);
    }
    for (let i = 0; i < put.length; i += 3) p.set(put[i], put[i + 1], put[i + 2]);
    return p;
  }
  // Pixel-map painter with column shear (small head tilts without rotation mush).
  function pmapS(p, ox, oy, rows, legend, slope, pivot) {
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) {
        const ch = r[i]; if (ch === '.' || ch === ' ') continue;
        const c = legend[ch]; if (!c) continue;
        p.set(ox + i, oy + j + Math.round((i - (pivot || 0)) * (slope || 0)), c);
      }
    }
  }
  function rotMap(rows, k) { // rotate a square char map by k*90 degrees clockwise
    let r = rows.slice();
    for (let t = 0; t < ((k % 4) + 4) % 4; t++) {
      const n = r.length, out = [];
      for (let x = 0; x < n; x++) { let s = ''; for (let y = n - 1; y >= 0; y--) s += r[y][x]; out.push(s); }
      r = out;
    }
    return r;
  }
  // Semi-transparent cloud puff, drawn BEHIND the sprite: only empty / translucent pixels are painted.
  function puff(p, cx, cy, r, a, core) {
    if (r >= 2.2) { // cloud: three overlapping lobes
      puff1(p, cx - r * 0.55, cy + r * 0.3, r * 0.7, a * 0.9, false);
      puff1(p, cx + r * 0.5, cy + r * 0.35, r * 0.62, a * 0.9, false);
    }
    puff1(p, cx, cy, r, a, core);
  }
  function puff1(p, cx, cy, r, a, core) {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const ddx = x + 0.5 - cx, ddy = (y + 0.5 - cy) * 1.15, d = Math.hypot(ddx, ddy) / r;
      if (d > 1) continue;
      const lit = (-ddx - ddy) / r; // upper-left of the puff is brighter
      const col = d < 0.4 && core ? '#ffffff' : lit > 0.1 ? '#fbf8ff' : d < 0.7 ? '#e6e0f6' : '#bdb4dc';
      a = Math.min(0.9, a * 1.2);
      const al = d < 0.4 && core ? 1 : d < 0.75 ? a : a * 0.72;
      const cur = p.get(x, y);
      if (!cur) p.set(x, y, A(col, al));
      else if (isAlpha(cur)) { const ca = parseInt(cur.slice(7), 16) / 255; if (al > ca) p.set(x, y, A(col, al)); }
    }
  }
  // Four-point stun star (7x7 incl. its plum outline; 5x5 for the far one). Painted into the sprite
  // AND into the emissive core/glow layers so it stays bright after the scene lighting.
  function stunStar(p, core, glow, x, y, big) {
    const n = big ? 2 : 1, fill = [];
    fill.push([0, 0, 'w']);
    for (let k = 1; k <= n; k++) { const c = k === n && big ? 'a' : 'y'; fill.push([k, 0, c], [-k, 0, c], [0, k, c], [0, -k, c]); }
    const col = big ? { w: '#fff6c0', y: '#ffc030', a: '#ffa028' } : { w: '#e8d49a', y: '#c89038', a: '#c89038' };
    const has = (dx, dy) => fill.some(([a, b]) => a === dx && b === dy);
    for (let dy = -n - 1; dy <= n + 1; dy++) for (let dx = -n - 1; dx <= n + 1; dx++) {
      if (has(dx, dy)) continue;
      if (has(dx - 1, dy) || has(dx + 1, dy) || has(dx, dy - 1) || has(dx, dy + 1)) { p.set(x + dx, y + dy, OUT); core.set(x + dx, y + dy, OUT); }
    }
    fill.forEach(([dx, dy, c]) => { p.set(x + dx, y + dy, col[c]); core.set(x + dx, y + dy, col[c]); glow.set(x + dx, y + dy, big ? '#ffc040' : '#a07830'); });
  }

  /* =====================================================================
     ERYMANTHIAN BOAR — boss. Barrel-bodied wedge (massive shoulder hump, head slung low, rounded
     sloping rump) on SHORT thick legs (heavy forearms, thick hams tapering to the hock, 5-px cloven
     hooves). Warm umber hide lifted well above the cave's value, a real warm rim along spine & hump
     and a cool bounce rim on belly, chest and back so it separates from warm-dark rock. Bristle
     mane rooted in the hide (dark roots -> rust -> ochre tips) in overlapping clumps that spill down
     the shoulder. Hand-authored head: scarred bridge, pink snout disc, ivory tusk, 3x2 EMISSIVE red
     eye. Canvas 104x64, anchor (60, 62) — the snout tip sits <= 4 px past the 48-px hitbox front.
     ===================================================================== */
  C.hide = ['#f4c090', '#c88a6c', '#a0685e', '#74485a', '#4e3048', '#301e36'];
  C.hideF = C.hide.map((c) => O.mix(O.shift(c, -0.12), '#2a2040', 0.28));
  C.maneB = ['#e8b070', '#c47a42', '#8a3a24', '#6a2c2c', C.hide[4], C.hide[5]];
  C.snoutB = ['#ffd2c8', '#eba0a4', '#b86a7c', '#7a3e58'];
  C.tuskB = ['#fffcf2', '#f2e4c4', '#c9ae88', '#7e6058'];
  C.hoofB = ['#7a6e8a', '#4e4460', '#342a44', '#211a2e'];
  C.rimW = '#f0a060'; C.rimC = '#7f8fd0';
  // OX: body offset behind the anchor so the head does not sink into walls; D: belly drop (short legs)
  const BR = { W: 104, H: 64, AX: 50, AY: 62, OX: 13, D: 3.5 };
  // Head, facing right, 28x21. Legend: r rim, 1-5 hide, p/P/q snout disc, n nostril, e/E/d eye (3x2),
  // m mouth line, g lip. Tusk + scar are overlays (drawn after, so they can change per frame).
  const BOAR_HEAD = [
    '3221r1r2....................',
    '32221111r1r2................',
    '3322222221111r..............',
    '433333333455551r............',
    '433333333445eEe21r..........',
    '433333333344dee3221r........',
    '433333333344443333221r......',
    '43332222222343333332221r....',
    '433333333333343333322221rp..',
    '4333333333333433333333222Pp.',
    '.433333333333433333333334PpP',
    '.433333333333433333333344PnP',
    '.543333333334433333334444qPq',
    '..5433333334444444m444444qqq',
    '..5443333444444444444mmmmqq.',
    '...5443344444444444ggggggq..',
    '...5444444444444455555555...',
    '....54444544455555..........',
    '....5454555.................',
    '.....5455...................',
    '......55....................'
  ];
  // ivory tusk: rooted at the mouth corner on the lower jaw, curving out & up to the snout-top level
  const BOAR_TUSK = [[19, 14, 'T'], [20, 14, 'u'], [19, 13, '6'], [20, 13, 't'], [21, 13, 'u'], [20, 12, '6'], [21, 12, 't'], [22, 12, 'u'],
    [21, 11, '6'], [22, 11, 't'], [23, 11, 'u'], [21, 10, '6'], [22, 10, 't'], [23, 10, 'u'], [21, 9, '6'], [22, 9, 't'], [23, 9, 'u'],
    [21, 8, '6'], [22, 8, 't'], [23, 8, 'u'], [20, 7, '6'], [21, 7, 't'], [22, 7, 'u'], [20, 6, '6'], [21, 6, 'w'], [22, 6, 'u'], [21, 5, 'w']];
  // pale battle scars slashed across the bridge and the snout
  const BOAR_SCAR = [[18, 5, 's'], [17, 6, 's'], [18, 6, '5'], [16, 7, 's'], [17, 7, '5'], [15, 8, 'S'], [16, 8, '4'], [24, 9, 's'], [23, 10, 'S']];
  const SPIRAL = ['.ooo.', 'o...o', 'o.o.o', 'o.oo.', '.o...'];
  function boarFrame(q) {
    const { W, H, AX, AY, D } = BR, G = AY - 1, p = new O.Pix(W, H);
    const X = (x) => AX + x, Y = (y) => G + y;
    const bx = q.bx || 0, by = q.by || 0, sx = q.sx || 1, sy = q.sy || 1, pitch = q.pitch || 0;
    const piv = [0, -22];
    // body-space transform (local coords in, canvas coords out); the whole body sits D px lower
    const B = (x, y) => {
      const dx = (x - piv[0]) * sx, dy = (y - piv[1]) * sy, s = Math.sin(pitch), c = Math.cos(pitch);
      return [X(piv[0] + dx * c - dy * s + bx), Y(piv[1] + dx * s + dy * c + by + D)];
    };
    const br = q.breath || 0;
    const core = new O.Pix(W, H), glow = new O.Pix(W, H);
    /* ---------------- legs (far ones first): short and heavy ---------------- */
    function leg(def, front, isFar) {
      const ramp = isFar ? C.hideF : C.hide;
      const S = Solid(W, H), Lp = new O.Pix(W, H);
      const T = B(def.top[0], def.top[1]);
      const hoof = [X(def.hoof[0]), Y(def.hoof[1])];
      const pas = def.pas || (front ? [-0.5, -2.5] : [-1, -2.5]);
      const F = [hoof[0] + pas[0], hoof[1] - 1 + pas[1]];
      const K = ik(T, F, front ? 5.6 : 5.4, front ? 4.4 : 4.4, front ? (def.dir || 1) : (def.dir || -1));
      if (front) {
        sCap(S, T[0], T[1] - 3, K[0], K[1], 4.4, 3.0, 2, 1.4);        // heavy forearm
        sEll(S, K[0] + 0.3, K[1], 2.6, 2.3, 2.2, 1.5);                // knee (carpus)
        sCap(S, K[0], K[1], F[0], F[1], 2.1, 1.7, 1.5, 1.2);
      } else {
        sCap(S, T[0], T[1] - 4, K[0], K[1], 5.4, 2.6, 2, 1.4);        // thick ham tapering to the hock
        sEll(S, K[0] - 0.8, K[1] - 0.3, 2.2, 2.4, 2, 1.5);            // hock point
        sCap(S, K[0], K[1], F[0], F[1], 1.8, 1.6, 1.5, 1.2);
      }
      sCap(S, F[0], F[1], hoof[0] + 0.5, hoof[1] - 2, 1.8, 1.7, 1.2, 1.1); // pastern
      litSolid(Lp, S, ramp, { th: [0.9, 0.62, 0.36, 0.08, -0.25], bias: isFar ? -0.12 : 0.02 });
      despeckle(Lp);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = Lp.get(x, y); if (!c) continue;
        if (y < K[1] - 1 && ((x * 3 + y) % 5 === 0) && Lp.get(x, y - 1) && Lp.get(x - 1, y) && Lp.get(x + 1, y)) {
          const i = ramp.indexOf(c); if (i >= 1 && i < 5) Lp.set(x, y, ramp[i + 1]);
        }
      }
      // darker 'socks' below the knee / hock
      for (let y = Math.round(K[1]) + 2; y < H; y++) for (let x = 0; x < W; x++) { const c = Lp.get(x, y), i = ramp.indexOf(c); if (i >= 0 && i < 5) Lp.set(x, y, ramp[i + 1]); }
      // cloven hoof, 5 px wide, digging in
      const hx = Math.round(hoof[0]) - 2, hy = Math.round(hoof[1]) - 2;
      const hp = isFar ? C.hoofB.map((c) => O.shift(c, -0.15)) : C.hoofB;
      pmap(Lp, hx, hy, ['.bbb.', 'abbbc', 'abobc'], { a: hp[0], b: hp[1], c: hp[2], o: OUT });
      Lp.set(hx - 1, hy - 1, ramp[4]); // dewclaw
      return Lp;
    }
    const lg = q.legs;
    over(p, leg(lg.hf, false, true), null);
    over(p, leg(lg.ff, true, true), null);
    /* ---------------- tail: thin, curling down, dark tuft ---------------- */
    const ta = q.tail || 0;
    const t0 = B(-25, -24), t1 = [t0[0] - 2.5 - ta * 0.5, t0[1] + 1.5 - ta], t2 = [t1[0] - 0.5 + ta * 0.8, t1[1] + 3 - Math.abs(ta) * 0.5];
    const TL = new O.Pix(W, H);
    TL.line(t0[0], t0[1], t1[0], t1[1], C.hide[3]); TL.line(t1[0], t1[1], t2[0], t2[1], C.hide[3]);
    pmap(TL, Math.round(t2[0]) - 1, Math.round(t2[1]), ['45', '55', '.5'], { 4: C.hide[4], 5: C.hide[5] });
    over(p, TL, null);
    /* ---------------- body mass (shortened, rounded sloping rump) ---------------- */
    const S = Solid(W, H);
    const E = (x, y, rx, ry, rz, k) => { const c = B(x, y); sEll(S, c[0], c[1], rx * sx, ry * sy, rz, k || 6); };
    E(4, -27.5 - br * 0.8, 13 + br * 0.3, 12.5 + br * 0.6, 13);    // shoulder hump (peak ~ -40)
    E(-7, -21, 13.5, 9.5 + br * 0.5, 12);                           // barrel / ribcage
    E(-17.5, -18.5 + (q.rump || 0), 9.5, 9, 10);                     // rounded rump, sloping down
    E(-16.5, -16.5 + (q.rump || 0), 7.5, 6.5, 8, 4);                 // ham
    E(10, -24, 8, 9.5, 10);                                      // thick (short) neck
    E(7.5, -16, 7, 5.5, 8, 4);                                     // brisket
    const body = new O.Pix(W, H);
    const lit = litSolid(body, S, C.hide, { th: [0.93, 0.76, 0.5, 0.2, -0.18], gy: 0.4, edge: -3 });
    despeckle(body);
    // bristle strokes: rows of diagonal dashes running back & down from the spine
    const bc = B(0, 0).map(Math.round);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = body.get(x, y); if (!c) continue;
      const rx = x - bc[0], ry = y - bc[1];
      const row = Math.floor((ry + 60) / 3), off = Math.floor(hash(row, 3, 11) * 5);
      if ((((rx + off) % 5) + 5) % 5 !== 0 || (((ry + 60) % 3)) !== 0 || hash(rx, ry, 5) < 0.12) continue;
      if (!body.get(x, y - 2) || !body.get(x - 3, y + 3) || !body.get(x + 2, y)) continue;
      const i = C.hide.indexOf(c); if (i < 0) continue;
      const v = lit.V[y * W + x];
      const len = 2 + (hash(x, y, 7) > 0.45 ? 1 : 0) + (hash(x, y, 9) > 0.8 ? 1 : 0);
      const dc = i <= 1 ? C.hide[2] : C.hide[Math.min(5, i + 1)];
      for (let k = 0; k < len; k++) { const cc = body.get(x - k, y + k); if (cc && C.hide.indexOf(cc) <= C.hide.indexOf(dc)) body.set(x - k, y + k, dc); }
      if (v > 0.1 && i >= 1 && i <= 4) setF(body, x + 1, y - 1, C.hide[i - 1]);
    }
    // shaggy fringe under the belly / brisket / rump: dark spikes hanging down & back
    const fr = new O.Pix(W, H);
    for (let k = 0; k < 10; k++) {
      const u = B(-21.5 + k * 3.4, 0);
      let yy = -1; for (let y = H - 1; y >= 0; y--) if (body.get(Math.round(u[0]), y)) { yy = y; break; }
      if (yy < 0) continue;
      const l = 2 + ((k * 7) % 3);
      for (let j = 0; j < l; j++) { fr.set(Math.round(u[0]) - Math.floor(j / 2), yy + 1 + j, C.hide[j === 0 ? 4 : 5]); fr.set(Math.round(u[0]) + 1 - Math.floor(j / 2), yy + j, C.hide[5]); }
    }
    // bristles poking out of the back line and rump
    for (let x = 0; x < W; x += 2) {
      let ty = -1; for (let y = 0; y < H; y++) if (body.get(x, y)) { ty = y; break; }
      if (ty < 0 || x > B(6, 0)[0]) continue;
      const l = 1 + ((x * 5) % 3 === 0 ? 1 : 0);
      for (let j = 1; j <= l; j++) fr.set(x - j, ty - j + 1, C.hide[j === l ? 4 : 3]);
    }
    for (let y = 0; y < H; y += 2) {
      let lx = -1; for (let x = 0; x < W; x++) if (body.get(x, y)) { lx = x; break; }
      if (lx < 0 || y > G - 10) continue;
      fr.set(lx - 1, y + 1, C.hide[4]); if (y % 4 === 0) fr.set(lx - 2, y + 2, C.hide[5]);
    }
    over(p, fr, null);
    over(p, body, null);
    // muscle groove behind the shoulder
    const g0 = B(-6, -31), g1 = B(-3.5, -22);
    for (let i = 0; i <= 8; i++) { const t = i / 8; const x = Math.round(lerp(g0[0], g1[0], t) + Math.sin(t * 3) * 1.2), y = Math.round(lerp(g0[1], g1[1], t)); const c = p.get(x, y); const k = C.hide.indexOf(c); if (k >= 1 && k < 4 && (i % 3)) p.set(x, y, C.hide[k + 1]); }
    // old scars on the flank
    [[[-12, -26], [-8, -22]], [[-10, -27.5], [-6.5, -24]]].forEach(([a, b]) => { const A0 = B(a[0], a[1]), B0 = B(b[0], b[1]); for (let i = 0; i <= 4; i++) { const x = Math.round(lerp(A0[0], B0[0], i / 4)), y = Math.round(lerp(A0[1], B0[1], i / 4)); if (C.hide.indexOf(p.get(x, y)) >= 0) p.set(x, y, i % 2 ? '#d8a894' : '#e8bca4'); } });
    /* ---------------- near legs ---------------- */
    over(p, leg(lg.hn, false, false), C.hide[5], C.hide[4]);
    over(p, leg(lg.fn, true, false), C.hide[5], C.hide[4]);
    /* ---------------- mane: bristle clumps rooted in the hide, spilling down the shoulder ---------------- */
    const hd = q.head || {};
    const hbase = B(6, -29);
    const hox = hbase[0] + (hd.dx || 0), hoy = hbase[1] + (hd.dy || 0);
    const spineTop = (x) => { for (let y = 0; y < H; y++) if (body.get(x, y)) return y; return -1; };
    const MA = new O.Pix(W, H);
    const sweep = q.sweep || 0, wave = q.wave || 0;
    const xs0 = Math.round(B(-14.5, 0)[0]), xs1 = Math.round(hox + 4);
    const peakX = B(3, 0)[0];
    const spikes = [];
    for (let x = xs0, k = 0; x <= xs1; x += 2, k++) {
      const ty = x > hox + 1 ? Math.min(spineTop(x), hoy + 1) : spineTop(x);
      if (ty < 0) continue;
      const d = (x - peakX) / (x < peakX ? (peakX - xs0) : (xs1 - peakX + 6));
      let len = 7 * (1 - Math.pow(Math.abs(d), 1.6)) + 2.5;
      if (x > peakX) len = Math.max(len, 4.5 - (x - peakX) * 0.1);
      len *= [1, 0.7, 0.85][k % 3] * (q.maneLen || 1);
      const lag = Math.sin(k * 1.3 + wave) * 0.12;
      const ang = -Math.PI / 2 - 0.66 - sweep * 0.55 - d * 0.18 + lag;
      spikes.push([x, ty + 2.6, len, ang, 1.9]);
    }
    // spill: shorter clumps down the side of the neck / shoulder
    for (let k = 0; k < 6; k++) {
      const r = B(5.5 - k * 1.3, -33 + k * 2.1);
      spikes.push([r[0], r[1], 4.2 - k * 0.35, -Math.PI / 2 - 1.0 - sweep * 0.4 + Math.sin(k + wave) * 0.1, 1.5]);
    }
    spikes.forEach(([x0, y0, len, ang, w0]) => {
      const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
      for (let y = Math.floor(y0 - len - 2); y <= y0 + 3; y++) for (let x = Math.floor(x0 - len - 3); x <= x0 + 3; x++) {
        const px = x + 0.5 - x0, py = y + 0.5 - y0, al = px * ux + py * uy, sd = px * nx + py * ny;
        if (al < -1 || al > len) continue;
        const wdt = w0 * (1 - Math.max(0, al) / len) + 0.35;
        if (Math.abs(sd) > wdt) continue;
        const t = (al + 1) / (len + 1);
        let i = t > 0.8 ? 0 : t > 0.6 ? 1 : t > 0.4 ? 2 : t > 0.2 ? 3 : 4;
        if (sd > 0.35 && i < 5) i++;
        const cur = MA.get(x, y), ci = C.maneB.indexOf(cur);
        if (cur && ci >= 0 && ci <= i) continue;
        MA.set(x, y, C.maneB[i]);
      }
    });
    over(p, MA, C.maneB[5], C.maneB[4]);
    /* ---------------- head (hand-authored map) ---------------- */
    const HL = { r: O.mix(C.hide[0], C.rimW, 0.5), 1: C.hide[0], 2: C.hide[1], 3: C.hide[2], 4: C.hide[3], 5: C.hide[4], 6: C.hide[5],
      p: C.snoutB[0], P: C.snoutB[1], q: C.snoutB[2], n: OUT, e: '#ff4030', E: '#ffd0a0', d: '#b01a28', m: OUT, g: '#8e4656',
      t: C.tuskB[0], T: C.tuskB[1], u: C.tuskB[2], w: '#ffffff', s: '#f4c8b8', S: '#d09c98', k: '#c07080' };
    const hx0 = Math.round(hox), hy0 = Math.round(hoy), slope = hd.slope || 0;
    const hp = new O.Pix(W, H);
    // ear (behind the head top): procedural leaf, variants by angle
    const ea = hd.ear === undefined ? 0 : hd.ear; // 0 up, 1 flick, 2 back, 3 flop
    const EAR = [
      [[1.5, 2], [9, 1.5], [7.5, -3.5], [3, -9.5], [0.5, -4]],
      [[1.5, 2], [9, 1.5], [6.5, -3.5], [-0.5, -8.5], [-0.5, -3]],
      [[2, 2.5], [9, 1.5], [4.5, -2], [-5.5, -3.5], [-1, 0.5]],
      [[2.5, 0.5], [9, 1], [6, 6], [-2, 9.5], [0, 4]]
    ][ea];
    const EM = Mask(W, H); mPoly(EM, EAR.map(([x, y]) => [hx0 + x, hy0 + y]));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!mGet(EM, x, y)) continue;
      const lft = !mGet(EM, x - 1, y) || !mGet(EM, x, y - 1), rgt = !mGet(EM, x + 1, y) || !mGet(EM, x, y + 1);
      hp.set(x, y, lft ? C.hide[0] : rgt ? C.hide[3] : C.hide[2]);
    }
    const ec0 = [hx0 + 5, hy0 + 0.5], ec1 = [hx0 + EAR[3][0] * 0.8 + 1.2, hy0 + EAR[3][1] * 0.8 + 0.5];
    for (let i = 0; i <= 6; i++) { const x = Math.round(lerp(ec0[0], ec1[0], i / 6)), y = Math.round(lerp(ec0[1], ec1[1], i / 6)); if (mGet(EM, x, y) && mGet(EM, x - 1, y) && mGet(EM, x + 1, y)) { hp.set(x, y, i > 2 ? HL.k : C.snoutB[3]); if (i > 1 && i < 6 && mGet(EM, x + 2, y)) hp.set(x + 1, y, C.snoutB[3]); } }
    over(p, hp, C.hide[5]);
    const HP = new O.Pix(W, H);
    pmapS(HP, hx0, hy0, BOAR_HEAD, HL, slope, 12);
    const at = (x, y) => [hx0 + x, hy0 + y + Math.round((x - 12) * slope)];
    const ov = (list) => list.forEach(([x, y, ch]) => { if (HL[ch]) { const [X0, Y0] = at(x, y); HP.set(X0, Y0, HL[ch]); } });
    ov(BOAR_SCAR);
    if (hd.tongue) ov([[21, 15, 'k'], [22, 15, 'k'], [21, 16, 'k'], [22, 16, 'P'], [21, 17, 'q'], [22, 17, 'k']]);
    ov(BOAR_TUSK);
    // eye: glowing 3x2 or a white dazed spiral
    if (hd.daze !== undefined) {
      const sp = rotMap(SPIRAL, hd.daze);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
        const [X0, Y0] = at(11 + i, 2 + j);
        const corner = (i === 0 || i === 4) && (j === 0 || j === 4);
        if (corner) continue;
        const c = sp[j][i] === 'o' ? '#ffffff' : C.hide[5];
        HP.set(X0, Y0, c);
        if (sp[j][i] === 'o') core.set(X0, Y0, '#fff4e0');
      }
    } else {
      [[12, 4, '#ff4030'], [13, 4, '#ffd0a0'], [14, 4, '#ff4030'], [12, 5, '#c0202c'], [13, 5, '#ff4030'], [14, 5, '#ff4030']].forEach(([x, y, c]) => {
        const [X0, Y0] = at(x, y); core.set(X0, Y0, c); glow.set(X0, Y0, '#ff3020');
      });
    }
    // tusk glint (unlit highlight)
    { const [X0, Y0] = at(21, 5); core.set(X0, Y0, '#ffffff'); const [X1, Y1] = at(21, 6); core.set(X1, Y1, '#fffcf2'); }
    const hcont = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!HP.get(x, y) || y < hy0 + 8) continue;
      if ((!HP.get(x - 1, y) && p.get(x - 1, y)) || (!HP.get(x, y + 1) && p.get(x, y + 1))) hcont.push(x, y);
    }
    over(p, HP, null);
    for (let i = 0; i < hcont.length; i += 2) p.set(hcont[i], hcont[i + 1], C.hide[5]);
    finish(p, 0);
    /* ---------------- rims: warm torch rim on spine & hump (2 px), cool bounce rim below/behind ---------------- */
    const eyeCols = ['#ff4030', '#ffd0a0', '#b01a28', '#ffffff', C.hide[5]];
    const rim = rimLight(p, { warm: C.rimW, wa: 0.72, thick: true, thickIf: (x, y) => y < G - 22, diag: true,
      cool: C.rimC, ca: 0.62, coolDown: true, skip: eyeCols.concat(C.tuskB, C.hoofB, [OUT]) });
    // core eye pixels are also painted into the sprite (it reads without the emissive pass too)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = core.get(x, y); if (c && c !== OUT && hd.daze === undefined) p.set(x, y, c); }
    /* ---------------- effects after the outline (behind the sprite) ---------------- */
    const nos = at(28, 11);
    (q.steam || []).forEach(([dx, dy, r, a]) => puff(p, nos[0] + dx, nos[1] + dy, r, a, true));
    (q.dirt || []).forEach(([x, y, c], i) => {
      const pts = i % 2 ? [[0, 0], [1, 0]] : [[0, 0], [1, 0], [0, 1], [1, 1]];
      pts.forEach(([dx, dy]) => { const cur = p.get(X(x) + dx, Y(y) + dy); if (!cur || isAlpha(cur)) p.set(X(x) + dx, Y(y) + dy, dy ? O.shift(c, -0.3) : c); });
    });
    (q.dust || []).forEach(([x, y, r, a]) => puff(p, X(x), Y(y), r, a, false));
    if (q.stars !== undefined) {
      // 3 stars orbiting on a flat ellipse 7 px above the head top, the far one small and dim
      const sc = [hx0 + 17, hy0 - 10];
      const pts = [];
      for (let k = 0; k < 3; k++) {
        const a = q.stars + k * TAU / 3;
        pts.push([Math.round(sc[0] + Math.cos(a) * 10), Math.round(sc[1] + Math.sin(a) * 3), Math.sin(a) > -0.35]);
      }
      pts.sort((a, b) => a[1] - b[1]).forEach(([x, y, big]) => stunStar(p, core, glow, x, y, big));
    }
    return { p, e: { core, glow, rim, R: 5, gain: 0.5, lift: 1.15 } };
  }
  function makeBoar() {
    const { AX, AY, OX } = BR;
    const ax = AX + OX;
    const put = (name, q) => { const f = boarFrame(q); reg(name, f.p, ax, AY, f.e); };
    const stand = { fn: { top: [8, -16], hoof: [9.5, 0] }, ff: { top: [2.5, -16], hoof: [3.5, 0] }, hn: { top: [-18, -15], hoof: [-15, 0] }, hf: { top: [-22.5, -15], hoof: [-19.5, 0] } };
    // IDLE — heavy breathing: chest & hump swell on f1-f2, ear flick on f3, mane ripples, steam on the exhale
    const idleSteam = [[[4, 0, 3, 0.4]], [], [[3, 3, 2.4, 0.75]], [[4, 1, 3.4, 0.65], [8, 2, 2, 0.5]]];
    for (let i = 0; i < 4; i++) {
      const b = [0, 1, 1, 0.3][i];
      put('boar_idle_' + i, { legs: stand, breath: b, by: -Math.round(b), head: { dy: -Math.round(b * 0.6), ear: i === 3 ? 1 : 0 }, steam: idleSteam[i], wave: i * 1.6, tail: [0, 0.6, 1, 0.3][i] });
    }
    // PAW — charge-ready: head down, rump up; near front hoof: forward (lifted), planted, dragged back, lifted
    const pawFN = [{ top: [8, -16], hoof: [14, -5], pas: [-1.5, -2] }, { top: [8, -16], hoof: [12.5, 0] }, { top: [8, -16], hoof: [6.5, 0], pas: [0.5, -2.5] }, { top: [8, -16], hoof: [4.5, -4], pas: [1.5, -1.5] }];
    const pawSteam = [[[3, 3, 2.4, 0.75]], [[4, 1, 3.4, 0.7], [2, 4, 1.8, 0.7]], [[7, -2, 4, 0.55], [4, 2, 2.4, 0.65]], [[10, -5, 3.6, 0.4], [3, 3, 2, 0.7]]];
    const dc = ['#a86a44', '#8a5a3c', '#6a4232', '#c08a5a'];
    const pawDirt = [[[1, -2, dc[2]]], [], [[3, -3, dc[1]], [1, -5, dc[0]], [0, -2, dc[2]], [-1, -7, dc[3]], [-2, -4, dc[1]]],
      [[0, -4, dc[1]], [-3, -7, dc[0]], [-2, -11, dc[3]], [-6, -5, dc[2]], [-7, -9, dc[1]], [-9, -3, dc[0]], [2, -2, dc[2]]]];
    const pawDust = [[], [], [[4, -1, 2.4, 0.45]], [[1, -2, 3, 0.4], [-4, -1, 2, 0.3]]];
    for (let i = 0; i < 4; i++) {
      put('boar_paw_' + i, {
        legs: Object.assign({}, stand, { fn: pawFN[i], hn: { top: [-18, -15], hoof: [-17, 0] }, hf: { top: [-22.5, -15], hoof: [-21.5, 0] } }),
        pitch: 0.045, by: -0.5, rump: -1, head: { dy: 2, dx: 1, slope: 0.08, ear: 2 }, steam: pawSteam[i], dirt: pawDirt[i], dust: pawDust[i], sweep: 0.3, wave: i * 2.1, tail: 1.2
      });
    }
    // RUN — rotary gallop: f0 extension (leading front hoof down, hind legs flung back & bent at the
    // hock, hooves flicked up), f1 front strike, f2 gather, f3 suspension, f4 hind plant, f5 push
    const R = [
      { sx: 1.07, sy: 0.95, by: -2, pitch: 0.0, hd: 1, legs: { fn: { top: [8, -16], hoof: [21, 0], pas: [-0.5, -2.5] }, ff: { top: [2.5, -16], hoof: [18, -4], pas: [1, -2.5] }, hn: { top: [-18, -16], hoof: [-32, -8], pas: [-3, 1.5], dir: -1 }, hf: { top: [-22.5, -16], hoof: [-34.5, -10], pas: [-3, 1.5] } } },
      { sx: 1.04, sy: 0.97, by: -2.5, pitch: -0.03, hd: 2, legs: { fn: { top: [8, -16], hoof: [14.5, 0], pas: [-1, -2.5] }, ff: { top: [2.5, -16], hoof: [18, -2], pas: [0.5, -2.5] }, hn: { top: [-18, -16], hoof: [-30, -9], pas: [-2.5, 1.5] }, hf: { top: [-22.5, -16], hoof: [-32, -11], pas: [-2.5, 1.5] } } },
      { sx: 0.98, sy: 1.02, by: -3, pitch: -0.05, hd: 0, legs: { fn: { top: [8, -16], hoof: [7, 0], pas: [-1.5, -2.5] }, ff: { top: [2.5, -16], hoof: [10.5, 0], pas: [-1, -2.5] }, hn: { top: [-18, -16], hoof: [-15, -6], pas: [-2, -1.5] }, hf: { top: [-22.5, -16], hoof: [-19, -5], pas: [-2, -1.5] } } },
      { sx: 0.93, sy: 1.06, by: -5, pitch: -0.02, hd: -1, legs: { fn: { top: [8, -16], hoof: [2.5, -5], pas: [-2.5, -1] }, ff: { top: [2.5, -16], hoof: [5, -4], pas: [-2.5, -1] }, hn: { top: [-18, -16], hoof: [-8, -4], pas: [0, -2.5] }, hf: { top: [-22.5, -16], hoof: [-11, -3], pas: [0, -2.5] } } },
      { sx: 0.97, sy: 1.03, by: -3.5, pitch: 0.04, hd: 1, legs: { fn: { top: [8, -16], hoof: [10, -6], pas: [-2.5, -1] }, ff: { top: [2.5, -16], hoof: [6, -4.5], pas: [-2.5, -1] }, hn: { top: [-18, -16], hoof: [-10, 0], pas: [0, -2.5] }, hf: { top: [-22.5, -16], hoof: [-14, 0], pas: [-1, -2.5] } } },
      { sx: 1.03, sy: 0.98, by: -2.5, pitch: 0.05, hd: 2, legs: { fn: { top: [8, -16], hoof: [16, -5], pas: [0, -2.5] }, ff: { top: [2.5, -16], hoof: [12, -5], pas: [-1, -2.5] }, hn: { top: [-18, -16], hoof: [-20.5, 0], pas: [-1.5, -2.5] }, hf: { top: [-22.5, -16], hoof: [-24, 0], pas: [-1.5, -2.5] } } }
    ];
    for (let i = 0; i < 6; i++) {
      const f = R[i];
      const dust = i === 4 ? [[-13, -2, 2.4, 0.4], [-18, -3, 1.8, 0.3]] : i === 5 ? [[-25, -3, 3, 0.35], [-30, -5, 2.2, 0.25], [-20, -1, 1.6, 0.3]] : i === 0 ? [[-34, -6, 2.4, 0.2]] : [];
      put('boar_run_' + i, Object.assign({}, f, {
        head: { dy: f.hd, dx: 2, slope: 0.06, ear: 2 }, sweep: 1 + (i % 3 === 0 ? 0.2 : 0), wave: (i - 1) * 1.3, tail: 2.2, maneLen: 1,
        steam: i % 3 === 1 ? [[3, 4, 2.4, 0.5]] : i % 3 === 2 ? [[1, 6, 3, 0.35]] : [], dust
      }));
    }
    // STUN — body sunk, legs splayed (one front hoof 4 px forward, one 3 px back, knees buckled),
    // head swaying, snout low, tongue out, ear flopped, white spiral eye, 3 orbiting stars
    for (let i = 0; i < 4; i++) {
      put('boar_stun_' + i, {
        legs: { fn: { top: [8, -16], hoof: [13.5, 0], pas: [1.5, -2] }, ff: { top: [2.5, -16], hoof: [0.5, 0], pas: [-2, -2], dir: -1 }, hn: { top: [-18, -15], hoof: [-13.5, 0], pas: [0.5, -2] }, hf: { top: [-22.5, -15], hoof: [-21, 0] } },
        by: 2.5, sy: 0.96, pitch: 0.03, bx: [0, 0.5, 0, -0.5][i],
        head: { dy: 4.6, dx: [0, 1, 2, 1][i], slope: [0.14, 0.2, 0.15, 0.1][i], ear: 3, daze: i, tongue: true },
        stars: Math.PI / 2 + i * TAU / 12, tail: -0.5, wave: i, sweep: -0.1
      });
    }
  }

  O.ART_INITS.push(function () {
    const run = (n, f) => { try { f(); } catch (e) { console.error('[enemies:' + n + ']', e); } };
    run('rock', makeRock);
    run('snake', makeSnake);
    run('bat', makeBat);
    run('satyr', makeSatyr);
    run('boar', makeBoar);
    run('emissive', installEmissiveHook);
  });
})(window.OLY);
