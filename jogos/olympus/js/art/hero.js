/* art/hero.js — ORPHEUS, the playable hero (modern pixel art, refinement round 3).
   A small 2D rig: every frame is a pose (hip, spine lean, IK legs/arms, head expression, club,
   cape/hair/headband secondary motion). Parts are painted into separate layers with clean cluster
   shading (light from the upper-left, hue-shifted ramps, no single-pixel noise), composited with
   coloured internal contour lines, then wrapped in a plum sel-out outline + cool rim light.
   Face/hair, fists and the lying death pose are hand-authored pixel maps.
   Proportions: 38 px tall, head 9 px (~1/4.3), broad shoulders, 3 px neck, 3-4 px calves.
   Everything faces RIGHT; the engine flips. All frames share the same canvas width and anchor x. */
(function (O) {
  'use strict';
  const OUT = (O.PAL5 && O.PAL5.outline) || '#1b1426';
  const W = 76, H = 66, AX = 36, AY = 60; // work canvas; AX/AY = feet point (outline row under soles)
  const BX = 0;                           // body x offset so the chiton centroid sits over AX
  const LX = -0.6, LY = -0.8;             // light direction (upper-left)
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

  /* ---------------- palette (index 0 = highlight .. 4 = deepest) ---------------- */
  const PAL = {
    skin: ['#ffe4c4', '#f6bf8e', '#dc9063', '#a95c45', '#673140'],
    skinB: ['#eab896', '#d49274', '#b0706a', '#83485a', '#56304a'],   // far limbs: one step darker, rose
    hair: ['#f8b86c', '#d8763a', '#a84c28', '#723020', '#43182a'],
    band: ['#ffb27a', '#f0503a', '#c8382e', '#8a2030', '#4a1026'],   // bright scarlet headband
    cape: ['#e2525e', '#b8283a', '#8e1f3a', '#6a1838', '#3e1030'],   // deep crimson cape
    lining: ['#c4506e', '#983054', '#702444', '#4e1a3a', '#2e0f26'],
    cloth: ['#ffffff', '#f3f0f8', '#d2cce6', '#9b94c2', '#625c8c'],
    gold: ['#fff5b0', '#ffd24a', '#e39b1d', '#a8621b', '#633416'],
    bronze: ['#fff0b8', '#f2c46b', '#c98a2e', '#8a5220', '#5a3018'],
    bronzeB: ['#e8cc94', '#d0a056', '#a06a2c', '#6c4220', '#4a2818'],
    leather: ['#dca16a', '#a8693e', '#7a4a2c', '#4f2e22', '#2d1a18'],
    leatherB: ['#c28c64', '#94603e', '#6c442e', '#472a22', '#2a1a18'],
    wood: ['#ecca90', '#c2915a', '#8e643e', '#5e422e', '#36261f'],
    eye: '#231a3a', white: '#fbf8ff', lyreStr: '#fff8d8',
    lace: '#6e4028', laceHi: '#c48a5a', teeth: '#fff4e8', mouthIn: '#6a2a3a'
  };

  /* ---------------- tiny layer helpers ---------------- */
  const newL = () => new O.Pix(W, H);
  // Cylinder-shaded limb with per-t material callback (mat(t, s, v) -> ramp).
  // opt.bulge / opt.bc = [t0, t1]: extra radius over part of the limb (deltoid, calf).
  function limb(p, x0, y0, x1, y1, r0, r1, mat, opt) {
    const o = opt || {};
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1, len = Math.sqrt(len2);
    const nxp = -dy / len, nyp = dx / len; // perpendicular
    const bg = o.bulge || 0, bc = o.bc || [0, 1];
    const R = Math.max(r0, r1) + bg + 1;
    for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++) {
      for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++) {
        const px = x + 0.5, py = y + 0.5;
        const t = ((px - x0) * dx + (py - y0) * dy) / len2;
        const tc = clamp(t, 0, 1);
        const cx = x0 + dx * tc, cy = y0 + dy * tc;
        let r = r0 + (r1 - r0) * tc;
        if (bg) { const u = (tc - bc[0]) / (bc[1] - bc[0]); if (u > 0 && u < 1) r += bg * Math.sin(Math.PI * u); }
        const ox = px - cx, oy = py - cy, d = Math.hypot(ox, oy);
        if (d > r + 0.02) continue;
        const s = (ox * nxp + oy * nyp) / (r || 1); // -1..1 across the limb
        const v = (nxp * s * LX + nyp * s * LY) * 1.1 + (o.bias || 0);
        const ramp = mat(tc, s, v);
        if (!ramp) continue;
        if (typeof ramp === 'string') { p.set(x, y, ramp); continue; }
        if (ramp === PAL.bronze || ramp === PAL.bronzeB) { p.set(x, y, ramp[v > 0.3 ? 0 : v > -0.35 ? 1 : 3]); continue; }
        // 3 clean tones: lit / base / shadow (+ optional highlight)
        let i;
        if (o.two) i = o.hi && v > o.hi ? 0 : v > (o.cut === undefined ? -0.3 : o.cut) ? 1 : 2;   // 2 clean tones (+ optional highlight)
        else i = o.hi && v > 0.75 ? 0 : v > 0.2 ? 1 : v > -0.45 ? (o.flat ? 1 : 2) : 3;
        p.set(x, y, ramp[i === 3 && r < 1.3 ? 2 : i]);
      }
    }
  }
  function ik(a, b, l1, l2, dir) {
    // two-bone IK; dir=+1 puts the joint on the +x side for a limb pointing down.
    let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 0.001;
    const mx = l1 + l2 - 0.05;
    if (d > mx) { b = [a[0] + dx / d * mx, a[1] + dy / d * mx]; dx = b[0] - a[0]; dy = b[1] - a[1]; d = mx; }
    const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    const ux = dx / d, uy = dy / d;
    return [[a[0] + ux * x + uy * h * dir, a[1] + uy * x - ux * h * dir], b];
  }
  // internal contour colour: two steps darker on the underlying material's own ramp
  let LOOK = null;
  function look(u) {
    if (!LOOK) {
      LOOK = {};
      Object.keys(PAL).forEach((k) => { if (Array.isArray(PAL[k])) PAL[k].forEach((c, i) => { if (!(c in LOOK)) LOOK[c] = [PAL[k], i, k]; }); });
    }
    return LOOK[u];
  }
  function lineOf(u, amt) {
    const e = look(u);
    if (e) { const r = e[0]; const j = Math.min(4, Math.max(e[1] + 2, 3)); return r[j] === u ? O.mix(u, OUT, amt) : r[j]; }
    return O.mix(u, OUT, amt);
  }
  // composite: draw an internal contour where the new layer overlaps existing pixels.
  // all=true also contours the left/top sides (used where a part must separate from what is behind it).
  function comp(dst, L, line, all) {
    if (line !== false) {
      const add = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (L.get(x, y) || !dst.get(x, y)) continue;
        if (L.get(x - 1, y) || L.get(x, y - 1) || (all && (L.get(x + 1, y) || L.get(x, y + 1)))) add.push(x, y);
      }
      for (let i = 0; i < add.length; i += 2) {
        const u = dst.get(add[i], add[i + 1]);
        dst.set(add[i], add[i + 1], lineOf(u, typeof line === 'number' ? line : 0.55));
      }
    }
    dst.blit(L, 0, 0);
  }
  // de-noise: a pixel that differs from all 4 neighbours inside a flat area takes the majority colour
  function clean(L, pass) {
    for (let k = 0; k < (pass || 1); k++) {
      const ch = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = L.get(x, y); if (!c) continue;
        const n = [L.get(x - 1, y), L.get(x + 1, y), L.get(x, y - 1), L.get(x, y + 1)];
        if (n.some((v) => v === c)) continue;
        const f = n.filter(Boolean); if (f.length < 3) continue;
        const cnt = {}; f.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1; });
        let best = null, bn = 0; Object.keys(cnt).forEach((q) => { if (cnt[q] > bn) { bn = cnt[q]; best = q; } });
        if (bn >= 2) ch.push(x, y, best);
      }
      for (let i = 0; i < ch.length; i += 3) L.set(ch[i], ch[i + 1], ch[i + 2]);
    }
  }
  // cool rim light: shadow side (right) of cloth/cape/hair, and the back edge (left) of hair, cape and far leg,
  // so the silhouette survives dark caves
  const RIM = '#b4bff0';
  function rimLight(p) {
    const add = [];
    const R1 = { cloth: 0.32, cape: 0.34, hair: 0.28, skinB: 0.3, leatherB: 0.3, lining: 0.3 };
    for (let y = 1; y < H; y++) for (let x = 1; x < W - 1; x++) {
      const c = p.get(x, y);
      if (!c) continue;
      const e = look(c); if (!e) continue;
      const k = e[2];
      if (!p.get(x + 1, y) && p.get(x - 1, y) && R1[k] && e[1] >= 1) { add.push(x, y, O.mix(c, RIM, R1[k])); continue; }
      if (!p.get(x - 1, y) && p.get(x + 1, y) && (k === 'cape' || k === 'lining') && e[1] >= 2) add.push(x, y, O.mix(c, RIM, 0.22));
    }
    for (let i = 0; i < add.length; i += 3) p.set(add[i], add[i + 1], add[i + 2]);
  }
  // plum sel-out; on strongly lit upper-left edges of warm materials the line takes the material's darkest tone
  function outlineAll(p) {
    rimLight(p);
    const add = [];
    const warm = { skin: 1, hair: 1, cape: 1, band: 1, wood: 1 };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (p.get(x, y)) continue;
      const r = p.get(x + 1, y), d = p.get(x, y + 1), l = p.get(x - 1, y), u = p.get(x, y - 1);
      if (!(r || d || l || u)) continue;
      let c = OUT;
      if (!l && !u) {
        const n = d || r, e = look(n);
        if (e && warm[e[2]] && e[1] <= 1) c = O.mix(e[0][4], OUT, 0.35);
      }
      add.push(x, y, c);
    }
    for (let i = 0; i < add.length; i += 3) p.set(add[i], add[i + 1], add[i + 2]);
  }
  const pointIn = (x, y, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  };
  function fillPoly(p, poly, colFn) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    poly.forEach((q) => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      if (pointIn(x + 0.5, y + 0.5, poly)) { const c = colFn(x, y); if (c) p.set(x, y, c); }
    }
  }
  function stamp(p, rows, ox, oy, cmap) {
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = cmap(r[x]); if (c) p.set(ox + x, oy + y, c); } });
  }

  /* ---------------- head: hand-authored profile map ----------------
     12 wide x 10 tall, facing right. Neck anchor = (6, 10). Rows: 0-2 hair (volume + highlight clumps),
     3 headband, 4 brow, 5-6 eye (+ nose tip at x11), 7 mouth, 8 jaw + 2 px chin, 9 neck.
     Back hair ends at the ear line (ear = k/K at x5).
     A-E hair (light..dark), 1-5 skin, h/R/r/q headband, k/K ear, e pupil, w eye white, b brow, m mouth */
  const HEAD = [
    '....CBBC....',
    '..DBAABBAC..',
    '.DBAABBAABCC',
    '.qrRRRRRRRhC',
    'CBC21bb12b3.',
    'BCk21we22e3.',
    'DCK312e22e32',
    '.D4322222m3.',
    '...4322223..'
  ];
  const HEAD_NECK = [6, 11];
  const EXPR = {
    n: [],
    blink: [[5, 5, '2'], [6, 5, '2'], [5, 6, 'b'], [6, 6, 'b'], [9, 5, '2'], [9, 6, 'b']],
    fierce: [[5, 4, 'b'], [6, 4, '1'], [6, 5, 'b'], [5, 5, '2'], [5, 6, 'w'], [9, 4, '1'], [9, 5, 'b']],
    shout: [[5, 4, 'b'], [6, 4, '1'], [6, 5, 'b'], [5, 5, '2'], [5, 6, 'w'], [9, 4, '1'], [9, 5, 'b'], [9, 7, 'M'], [10, 7, 'M'], [9, 8, 'M'], [10, 8, '3'], [8, 7, 'm']],
    hurt: [[5, 4, '1'], [6, 4, 'b'], [5, 5, 'b'], [6, 5, '2'], [5, 6, 'b'], [6, 6, 'b'], [9, 5, '2'], [9, 6, 'b'], [9, 7, 'M'], [10, 7, 'M']],
    calm: [[5, 5, '2'], [6, 5, '2'], [5, 6, 'b'], [6, 6, 'b'], [9, 5, '2'], [9, 6, 'b'], [9, 7, 'm'], [10, 7, '3'], [8, 7, 'm']],
    joy: [[5, 4, 'b'], [6, 4, 'b'], [8, 7, 'm'], [9, 7, 'T'], [10, 7, 'M'], [9, 8, 'M'], [10, 8, '3']],
    dead: [[5, 5, '2'], [6, 5, '2'], [5, 6, 'b'], [6, 6, 'b'], [9, 5, '2'], [9, 6, 'b']]
  };
  function headColor(ch) {
    switch (ch) {
      case 'A': return PAL.hair[0]; case 'B': return PAL.hair[1]; case 'C': return PAL.hair[2];
      case 'D': return PAL.hair[3]; case 'E': return PAL.hair[4];
      case '1': return PAL.skin[0]; case '2': return PAL.skin[1]; case '3': return PAL.skin[2]; case '4': return PAL.skin[3]; case '5': return PAL.skin[4];
      case 'k': return PAL.skin[2]; case 'K': return PAL.skin[3];
      case 'h': return PAL.band[0]; case 'R': return PAL.band[1]; case 'r': return PAL.band[2]; case 'q': return PAL.band[3];
      case 'e': return PAL.eye; case 'w': return PAL.white; case 'b': return PAL.hair[3]; case 'm': return PAL.skin[3];
      case 'M': return PAL.mouthIn; case 'T': return PAL.teeth;
      default: return null;
    }
  }
  function headRows(expr) {
    const rows = HEAD.map((r) => r.split(''));
    (EXPR[expr] || []).forEach(([x, y, c]) => { if (!rows[y]) rows[y] = '............'.split(''); rows[y][x] = c; });
    return rows;
  }
  function drawHead(p, nx, ny, expr) {
    const rows = headRows(expr);
    const ox = Math.round(nx - HEAD_NECK[0]), oy = Math.round(ny - HEAD_NECK[1]);
    rows.forEach((r, y) => r.forEach((ch, x) => { const c = headColor(ch); if (c) p.set(ox + x, oy + y, c); }));
  }

  /* ---------------- secondary motion pieces ---------------- */
  // ribbon (headband tails): from (x,y) along angle a (0 = right, pi = left), wave phase ph
  function ribbon(p, x, y, a, len, ph, amp, ramp, w0) {
    const pts = [];
    for (let i = 0; i <= len * 2; i++) {
      const s = i / 2, t = s / len, wv = Math.sin(ph + s * 0.95) * amp * t;
      pts.push([x + Math.cos(a) * s - Math.sin(a) * wv, y + Math.sin(a) * s + Math.cos(a) * wv, t, s]);
    }
    pts.forEach(([px, py, t, s]) => {
      const r = lerp(w0 || 0.8, 0.5, t);
      const tw = Math.cos(ph + s * 0.95); // twist: the side facing us is lit
      const c = t > 0.85 ? ramp[2] : tw > 0.2 ? ramp[1] : tw > -0.6 ? ramp[2] : ramp[3];
      p.ellipse(px, py, r, r, c);
    });
    // lit tip
    const e = pts[Math.max(0, pts.length - 4)];
    p.set(e[0], e[1] - 0.4, ramp[0]);
  }

  // cape: chain of segments (F.a = angles from straight down, + = trailing back), wavy hem, one lit ridge
  // and one dark valley (clean 2 px clusters), lining where the tip flips over (F.curl).
  function drawCape(L, top, F) {
    const segs = F.a || [0.08, 0.1, 0.12], len = F.len || 11.5, N = 24;
    const wo = F.wo === undefined ? 3.2 : F.wo, wi = F.wi === undefined ? 2.4 : F.wi, bill = F.bill || 0, ph = F.ph || 0;
    const S = [];
    let x = top[0], y = top[1];
    for (let i = 0; i <= N; i++) {
      const t = i / N, f = t * (segs.length - 1), k = Math.min(segs.length - 2, Math.floor(f));
      const a = lerp(segs[k], segs[k + 1], f - k);
      const d = [-Math.sin(a), Math.cos(a)], n = [-Math.cos(a), -Math.sin(a)];
      const o = lerp(F.o0 || 1.0, wo, Math.min(1, t * 1.3)) + bill * Math.sin(Math.PI * t) * 0.9;
      const w = lerp(1.2, wi, Math.min(1, t * 1.2)) - bill * Math.sin(Math.PI * t) * 0.3;
      // travelling wave: ripple moving from the shoulder to the hem (F.wave = [amp, phase])
      const wv = F.wave ? F.wave[0] * t * Math.sin(t * Math.PI * 1.6 - F.wave[1]) : 0;
      S.push({ x: x + n[0] * wv, y: y + n[1] * wv, t, d, n, o, w });
      x += d[0] * len / N; y += d[1] * len / N;
    }
    const outer = S.map((s) => [s.x + s.n[0] * s.o, s.y + s.n[1] * s.o]);
    const inner = S.map((s) => [s.x - s.n[0] * s.w, s.y - s.n[1] * s.w]);
    const e = S[N], hem = [];
    const sc = F.scal === undefined ? 1.2 : F.scal;
    for (let k = 1; k <= 3; k++) {
      const u = k / 4, dip = (k === 2 ? -0.3 : sc) + Math.sin(ph + k * 2) * 0.35 + (F.hem || 0) * (1 - u);
      const bx = lerp(outer[N][0], inner[N][0], u), by = lerp(outer[N][1], inner[N][1], u);
      hem.push([bx + e.d[0] * dip, by + e.d[1] * dip]);
    }
    const tipO = [outer[N][0] + e.d[0] * (F.hem || 0), outer[N][1] + e.d[1] * (F.hem || 0)];
    const poly = [].concat(outer.slice(0, N), [tipO], hem, inner.slice().reverse());
    const curl = F.curl || 0;
    const ridge = F.ridge === undefined ? 0.25 : F.ridge;
    fillPoly(L, poly, (px, py) => {
      const qx = px + 0.5, qy = py + 0.5;
      let best = null, bd = 1e9;
      for (const s of S) { const dd = (qx - s.x) * (qx - s.x) + (qy - s.y) * (qy - s.y); if (dd < bd) { bd = dd; best = s; } }
      const ac = (qx - best.x) * best.n[0] + (qy - best.y) * best.n[1];
      const sv = ac > 0 ? ac / Math.max(0.8, best.o) : ac / Math.max(0.8, best.w); // +1 outer .. -1 inner
      const t = best.t;
      const ramp = curl && t > 1 - curl ? PAL.lining : PAL.cape;
      // outer (back) face is lit by the key light; inner face (toward the body) in shadow
      let i = sv > 0.35 ? 1 : sv > -0.4 ? 2 : 3;
      const rd = Math.abs(sv - ridge) * best.o;
      if (t > 0.25 && rd < 0.75 && sv > 0) i = 1;
      if (t > 0.3 && Math.abs(sv + 0.1) * best.w < 0.6) i = 3;  // valley between ridge and body
      if (t < 0.12) i = Math.max(i, 2);
      if (sv > 0.8 && t > 0.1 && t < 0.7) i = 0;                 // lit outer edge
      if (ramp === PAL.lining) i = Math.min(4, i + 1);
      return ramp[i];
    });
    clean(L, 2);
  }

  /* ---------------- limbs, fists, club ---------------- */
  // 3x3 fist (knuckles lit on the upper-left), far fist one step darker
  const FIST = [[0, 1, 1], [1, 1, 2], [2, 2, 3]];
  function drawFist(p, h, back) {
    const sk = back ? PAL.skinB : PAL.skin;
    const x0 = Math.round(h[0] - 1.5), y0 = Math.round(h[1] - 1.5);
    FIST.forEach((r, j) => r.forEach((i, k) => p.set(x0 + k, y0 + j, sk[i])));
  }
  function drawArm(p, A, back) {
    const sk = back ? PAL.skinB : PAL.skin, br = back ? PAL.bronzeB : PAL.bronze;
    // upper arm with a round deltoid cap (1 px highlight on top)
    limb(p, A.root[0], A.root[1], A.elb[0], A.elb[1], 1.45, 1.15, () => sk, { bulge: 0.3, bc: [-0.2, 0.45], two: 1, hi: back ? 0 : 0.85 });
    if (!back) p.set(A.root[0] - 0.7, A.root[1] - 1.1, sk[0]);   // deltoid highlight
    const fl = dist(A.elb, A.hand) || 1;
    limb(p, A.elb[0], A.elb[1], A.hand[0], A.hand[1], 1.2, 1.15, (t) => { const a = (1 - t) * fl; return a > 0.9 && a < 3.4 ? br : sk; }, { two: 1 });
  }
  function drawLeg(p, L, back) {
    const sk = back ? PAL.skinB : PAL.skin, le = back ? PAL.leatherB : PAL.leather;
    limb(p, L.root[0], L.root[1], L.knee[0], L.knee[1], 2.0, 1.6, () => sk, { two: 1, hi: back ? 0 : 0.8 });
    const sd = dist(L.knee, L.ank) || 1;
    const strap = back ? PAL.leatherB[2] : PAL.leather[2], strapHi = back ? PAL.leatherB[1] : PAL.leather[1];
    limb(p, L.knee[0], L.knee[1], L.ank[0], L.ank[1], 1.5, 1.1, (t, s, v) => {
      const along = (1 - t) * sd; // px above ankle
      if (along < 1.6) return v > -0.1 ? strapHi : strap;               // sandal ankle wrap (2 px)
      if (!back && along > 3.3 && along < 4.2) return v > -0.1 ? strapHi : strap; // upper strap (near leg only)
      return sk;
    }, { bulge: back ? 0.35 : 0.55, bc: [0.0, 0.6], two: 1 });
    if (!back && Math.abs(L.knee[0] - L.root[0]) < 2.5) p.set(L.knee[0] - 0.8, L.knee[1] - 0.2, sk[0]); // knee highlight (standing legs)
    // foot (sandal): wedge pointing forward, rotated by L.a (toe down > 0)
    const a = L.a || 0, ca = Math.cos(a), sa = Math.sin(a);
    const pts = [[-1.4, -1.2], [1.0, -1.2], [3.3, -0.2], [4.2, 1.1], [-1.6, 1.1]].map(([x, y]) => [L.ank[0] + x * ca - y * sa, L.ank[1] + 0.6 + x * sa + y * ca]);
    fillPoly(p, pts, (x, y) => {
      const lx = (x + 0.5 - L.ank[0]) * ca + (y + 0.5 - L.ank[1] - 0.6) * sa;
      const ly = -(x + 0.5 - L.ank[0]) * sa + (y + 0.5 - L.ank[1] - 0.6) * ca;
      if (ly > 0.4) return le[3];                            // sole
      if (lx > 1.0 && lx < 2.0) return strap;                // toe strap
      return sk[ly < -0.3 ? 1 : 2];
    });
  }
  // knotted olive-wood club: slim grip, bronze band, thick knobbly head, lit upper-left edge
  function drawClub(p, h, a, len) {
    const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
    const s = [h[0] - d[0] * 2.5, h[1] - d[1] * 2.5], e = [h[0] + d[0] * len, h[1] + d[1] * len];
    const tot = dist(s, e);
    limb(p, s[0], s[1], e[0], e[1], 1.05, 2.25, (t, sd, v) => {
      if (t > 0.26 && t < 0.33) return PAL.bronze;
      const w = PAL.wood;
      return v > 0.6 ? w[0] : v > 0.05 ? w[1] : v > -0.55 ? w[2] : w[3];
    }, { bulge: 0.4, bc: [0.7, 1.08] });
    // knots: bumps out of the silhouette with a lit top and a dark hole
    [[0.5, 1, 1.9], [0.68, -1, 2.35], [0.86, 1, 2.9]].forEach(([t, sd, o]) => {
      const q = [lerp(s[0], e[0], t) + n[0] * sd * o, lerp(s[1], e[1], t) + n[1] * sd * o];
      const lit = (n[0] * sd * LX + n[1] * sd * LY) > 0;
      p.set(q[0], q[1], lit ? PAL.wood[0] : PAL.wood[2]);
      const k = [lerp(s[0], e[0], t + 0.05) + n[0] * sd * 0.2, lerp(s[1], e[1], t + 0.05) + n[1] * sd * 0.2];
      p.set(k[0], k[1], PAL.wood[3]);
    });
    // lit end-cap highlight
    const lsd = (n[0] * LX + n[1] * LY) > 0 ? 1 : -1;
    p.set(e[0] - d[0] * 1.2 + n[0] * lsd * 0.9, e[1] - d[1] * 1.2 + n[1] * lsd * 0.9, PAL.wood[0]);
    return tot;
  }
  const LYRE = [
    'A.......C',
    'AB.....CD',
    '.B.....C.',
    '.BBBBBBC.',
    '.Bs.s.sC.',
    '.Bs.s.sC.',
    '.Bs.s.sC.',
    '.BCCCCCD.',
    '.CDDDDDE.',
    '..DEEED..'
  ];
  function drawLyre(p, h, cfg, front) {
    const ox = Math.round(h[0]) - 2, oy = Math.round(h[1]) - 8;
    const col = { A: PAL.gold[0], B: PAL.gold[1], C: PAL.gold[2], D: PAL.gold[3], E: PAL.gold[4], s: PAL.lyreStr };
    LYRE.forEach((r, y) => r.split('').forEach((ch, x) => {
      if (ch === '.' || (front && ch !== 's') || (!front && ch === 's')) return;
      const c = ch === 's' && cfg.pluck && y >= 5 && x === 4 ? PAL.gold[1] : col[ch];
      p.set(ox + x, oy + y, c);
    }));
  }

  /* ---------------- swing smear ----------------
     Elliptical arc (centre c, radii rx/ry, angles a0 -> a1, y down) that ends exactly at the club head.
     Tapers from 1 px at the start to S.w px at the head. Bands from the outer edge inward:
     dithered pale-gold fringe, white core, saturated orange body. Drawn only into empty pixels. */
  function drawSmear(p, S) {
    const [cx, cy] = S.c, rx = S.rx, ry = S.ry, a0 = S.a0, a1 = S.a1, wmax = S.w;
    const span = a1 - a0, dir = span >= 0 ? 1 : -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (p.get(x, y)) continue;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      const r = Math.hypot(dx, dy); if (r > 1.05 || r < 0.4) continue;
      let a = Math.atan2(dy, dx);
      while ((a - a0) * dir < -0.2) a += dir * Math.PI * 2;
      while ((a - a0) * dir > Math.PI * 2 - 0.2) a -= dir * Math.PI * 2;
      const t = (a - a0) / span;
      if (t < 0 || t > 1.0) continue;
      const Rloc = Math.hypot(rx * Math.cos(a), ry * Math.sin(a));
      const u = (1 - r) * Rloc; // px inward from the outer edge
      const th = 1 + (wmax - 1) * Math.pow(t, S.pw || 1.3);
      if (u < -0.25 || u > th) continue;
      if (t < 0.06) continue;
      let c;
      if (th < 2.2) c = t < 0.3 ? '#ffb040' : '#ffffff';       // thin, solid start of the arc
      else if (u < 0.75) { if (O.bayer(x, y) >= 0.5) continue; c = '#ffe0a0'; }
      else if (u < 1.75) c = '#ffffff';
      else c = (u - 1.75) / Math.max(0.5, th - 1.75) < 0.55 ? '#ffb040' : '#ff7a2a';
      if (S.fade && c === '#ffffff' && t < 0.6) c = '#ffe0a0';
      p.set(x, y, c);
    }
    if (S.chips) S.chips.forEach(([ox, oy, c]) => { const X = Math.round(S.tip[0] + ox), Y = Math.round(S.tip[1] + oy); if (!p.get(X, Y)) p.set(X, Y, c); });
  }

  /* ---------------- the renderer ---------------- */
  function render(P) {
    const cv = newL();
    const T = (v) => [AX + BX + v[0], AY + v[1]];
    const hip = T(P.hip), lean = P.lean || 0, tl = (P.torso || 9.5) - 0.6;
    const U = [Math.sin(lean), -Math.cos(lean)], R = [Math.cos(lean), Math.sin(lean)];
    const at = (o, x, y) => [o[0] + R[0] * x - U[0] * y, o[1] + R[1] * x - U[1] * y]; // local (x forward, y down)
    const loc = (o, x, y) => { const dx = x + 0.5 - o[0], dy = y + 0.5 - o[1]; return [dx * R[0] + dy * R[1], -(dx * U[0] + dy * U[1])]; };
    const neck = [hip[0] + U[0] * tl, hip[1] + U[1] * tl];
    const sh = P.shoulder || 0;
    const sw2 = P.shoulderW || 1;
    const shF = at(neck, -3.4 * sw2, 2.0 - sh), shB = at(neck, 3.3 * sw2, 1.9 - sh); // 3/4 view: near shoulder on the left
    const hw = P.hipW === undefined ? 1.5 : P.hipW;
    const hipF = at(hip, -hw, 0), hipB = at(hip, hw, 0);
    const legs = {};
    ['F', 'B'].forEach((k) => {
      const L = P['leg' + k]; const root = k === 'F' ? hipF : hipB;
      const foot = T(L.f);
      const [knee, ank] = ik(root, foot, 7.7, 7.4, L.kd === undefined ? 1 : L.kd);
      legs[k] = { root, knee, ank, a: L.a || 0 };
    });
    const arms = {};
    ['F', 'B'].forEach((k) => {
      const A = P['arm' + k]; const root = k === 'F' ? shF : shB;
      const hand = A.H ? T(A.H) : [root[0] + A.h[0], root[1] + A.h[1]];
      let elb, hd;
      if (A.E) { elb = T(A.E); hd = hand; }
      else if (A.e) { elb = [root[0] + A.e[0], root[1] + A.e[1]]; hd = hand; }
      else { const al = P.armLen || 1; [elb, hd] = ik(root, hand, 5.2 * al, 5.0 * al, A.ed === undefined ? -1 : A.ed); }
      arms[k] = { root, elb, hand: hd };
    });
    const flow = P.flow || {};
    const bl = tl - 1.4; // belt (local y from the neck)

    /* --- layers, back to front --- */
    // 1. headband tails + hair flick (behind head)
    const headPos = [neck[0] + (P.head ? P.head[0] : 0), neck[1] + (P.head ? P.head[1] : 0)];
    const ho = { ox: Math.round(headPos[0] - HEAD_NECK[0]), oy: Math.round(headPos[1] - HEAD_NECK[1]) };
    const Ltail = newL();
    {
      const ta = flow.band === undefined ? 2.0 : flow.band, tph = flow.bph || 0, amp = flow.bamp === undefined ? 0.9 : flow.bamp;
      const bl0 = flow.blen || 6.5;
      ribbon(Ltail, ho.ox + 1.2, ho.oy + 3.4, ta, bl0, tph, amp, PAL.band, 0.62);
      ribbon(Ltail, ho.ox + 1.4, ho.oy + 3.8, ta + 0.35, bl0 - 1.8, tph + 1.9, amp * 0.8, PAL.band, 0.55);
      // back hair flick: a small tuft that trails behind the crown (lags the body)
      const lk = flow.lock || [0, 0];
      if (lk[0] || lk[1]) {
        fillPoly(Ltail, [[ho.ox + 1.5, ho.oy + 1.0], [ho.ox + 1.5, ho.oy + 5.5], [ho.ox + 0.2 + lk[0], ho.oy + 4.2 + lk[1]], [ho.ox - 0.2 + lk[0] * 0.8, ho.oy + 2.4 + lk[1] * 0.6]],
          (x, y) => (y - ho.oy < 3 + lk[1] * 0.5 ? PAL.hair[1] : PAL.hair[2]));
      }
    }

    // 2. cape (behind body)
    const Lcape = newL();
    if (P.cape !== false) drawCape(Lcape, at(neck, -3.6, 0.6), flow.cape || {});

    // 3. far arm, far leg, near leg
    const Lbarm = newL();
    drawArm(Lbarm, arms.B, true);
    const Lbfist = newL();
    drawFist(Lbfist, arms.B.hand, true);
    const Lbleg = newL();
    drawLeg(Lbleg, legs.B, true);
    const Lfleg = newL();
    drawLeg(Lfleg, legs.F, false);

    // 4. torso (chiton, 3/4 view): three clean clusters — lit near-side plane (upper-left light), one 2 px
    // diagonal fold from the near clasp to the belt, solid shadow plane on the far side (+ cool rim)
    const Ltor = newL();
    const tpoly = [[-3.0, -0.8], [-1.4, -0.6], [0.3, 1.3], [1.9, -0.6], [2.6, -0.7], [4.1, 0.3], [5.0, 1.9], [4.7, 4.6], [3.8, bl - 0.6], [4.0, bl + 0.8], [-3.9, bl + 0.8], [-3.7, bl - 0.6], [-4.5, 4.2], [-5.1, 1.8], [-4.4, 0.2]].map((q) => at(neck, q[0], q[1]));
    fillPoly(Ltor, tpoly, (x, y) => {
      const [lx, ly] = loc(neck, x, y);
      let i = 1;
      if (lx > 3.4) i = 3;                                            // far side in shadow
      else if (lx > 2.5) i = 2;
      else if (ly < 2.6 && lx < 1.0) i = 0;                           // lit top of the chest / near shoulder
      const fd = (lx + 1.6) - (ly - 0.6) * 0.55;                      // diagonal fold: near clasp -> belt centre
      if (ly > 1.6 && ly < bl - 0.6 && fd > -0.9 && fd < 1.1 && i < 2) i = 2;
      if (ly > bl - 1.0 && ly < bl + 0.2 && i < 2 && lx > -1) i = 2;  // blousing shadow over the belt
      return PAL.cloth[i];
    });
    clean(Ltor, 2);
    // belt with buckle
    for (let x = -4.4; x <= 4.4; x += 0.35) {
      const b = at(neck, x, bl + 0.2);
      if (!Ltor.get(Math.floor(b[0]), Math.floor(b[1]))) continue;
      Ltor.set(b[0], b[1], x > 2.6 ? PAL.leather[3] : PAL.leather[x < -1.6 ? 1 : 2]);
    }
    const buckle = at(neck, 0.6, bl + 0.2);
    Ltor.set(buckle[0], buckle[1], PAL.gold[1]);
    // fibula clasp on the front of the shoulder
    const fib = at(neck, -2.8, 0.1);
    const Lclasp = newL();
    if (P.cape !== false) {
      const fx = Math.round(fib[0] - 0.5), fy = Math.round(fib[1] - 0.5);
      Lclasp.set(fx, fy, PAL.gold[0]); Lclasp.set(fx + 1, fy, PAL.gold[1]); Lclasp.set(fx, fy + 1, PAL.gold[2]); Lclasp.set(fx + 1, fy + 1, PAL.gold[3]);
    }

    // 5. skirt: straight / slightly tapered, 2 vertical folds (2 px), solid back plane, gold hem
    const Lsk = newL();
    const tF = legs.F, tB = legs.B;
    const kp = (L, t) => [lerp(L.root[0], L.knee[0], t), lerp(L.root[1], L.knee[1], t)];
    const pF = kp(tF, 0.5), pB = kp(tB, 0.5);
    const wl = at(neck, -3.9, bl + 0.7), wr = at(neck, 4.0, bl + 0.7);
    const pr = pF[0] >= pB[0] ? pF : pB, pl = pF[0] >= pB[0] ? pB : pF;
    const sw = flow.skirt || 0;
    const skl = P.skirtLen || 5.2;
    const baseY = Math.max(wl[1], wr[1]) + skl;
    let hrx = clamp(Math.max(wr[0] + 0.2, pr[0] + 2.2), wr[0] - 0.5, wr[0] + 2.2) - sw;
    let hlx = clamp(Math.min(wl[0] - 0.2, pl[0] - 2.2), wl[0] - 2.2, wl[0] + 0.5) - sw * 1.3;
    const hrY = Math.min(baseY, pr[1] + 2.4), hlY = Math.min(baseY + 0.3, pl[1] + 3.2) - (sw > 0 ? sw * 0.5 : 0);
    const hemPts = [];
    for (let k = 0; k <= 4; k++) { const u = k / 4; hemPts.push([lerp(hrx, hlx, u), lerp(hrY, hlY, u) + (k === 1 || k === 3 ? 0.5 : 0)]); }
    const spoly = [wl, wr].concat(hemPts);
    fillPoly(Lsk, spoly, (x, y) => {
      const t = clamp((y + 0.5 - wl[1]) / Math.max(1, (hrY + hlY) / 2 - wl[1]), 0, 1);
      const xl = lerp(wl[0], hlx, t), xr = lerp(wr[0], hrx, t);
      const wd = Math.max(1, xr - xl), px = x + 0.5 - xl;
      let i = 1;
      if (px > wd - 2.0) i = 3;                                   // far side in shadow
      else if (t < 0.35 && px < wd * 0.4) i = 0;                   // lit near-side top
      if (t > 0.18) {
        const f1 = wd * 0.3, f2 = wd * 0.62;                        // two 2 px folds
        if (Math.abs(px - f1) < 1.0 || Math.abs(px - f2) < 1.0) i = Math.max(i, 2);
      }
      if (t < 0.12) i = Math.max(i, 2);                            // shadow under the belt
      return PAL.cloth[i];
    });
    clean(Lsk, 2);
    // hem trim: gold band + darker edge
    for (let x = 0; x < W; x++) {
      for (let y = H - 1; y >= 0; y--) {
        const c = Lsk.get(x, y);
        if (!c) continue;
        const back = c === PAL.cloth[3];
        Lsk.set(x, y, back ? PAL.gold[4] : PAL.gold[3]);
        if (Lsk.get(x, y - 1) && y - 1 > wl[1] + 1.5) Lsk.set(x, y - 1, back ? PAL.gold[2] : PAL.gold[1]);
        break;
      }
    }

    // 6. head (neck column + hand-authored head)
    const Lhead = newL();
    drawHead(Lhead, headPos[0], headPos[1], P.face || 'n');
    const Lneck = newL();
    limb(Lneck, neck[0] + 0.4, neck[1] + 1.0, headPos[0] + 0.1, headPos[1] - 2.2, 1.5, 1.5, (t, s2, v) => (t > 0.6 || v < -0.3 ? PAL.skin[2] : PAL.skin[1]), {});

    // 7. near arm, club, fist
    const Lfarm = newL();
    drawArm(Lfarm, arms.F, false);
    const Lclub = newL();
    if (P.club) drawClub(Lclub, arms.F.hand, P.club.a, P.club.len || 13);
    const Lfist = newL();
    drawFist(Lfist, arms.F.hand, false);
    const Lprop = newL();
    if (P.lyre) drawLyre(Lprop, arms.B.hand, P.lyre);

    // compose
    comp(cv, Ltail, false);
    if (!P.armBFront) { comp(cv, Lbarm, false); comp(cv, Lbfist, 0.5); }
    comp(cv, Lcape, 0.45);
    if (P.clubBehind && P.club) comp(cv, Lclub, 0.45);
    comp(cv, Lbleg, 0.5);
    comp(cv, Lfleg, 0.5);
    comp(cv, Lneck, false);
    comp(cv, Ltor, 0.5);
    comp(cv, Lsk, 0.5);
    if (P.armFBehind) { comp(cv, Lfarm, 0.5, true); comp(cv, Lfist, 0.5); }
    comp(cv, Lhead, 0.5);
    comp(cv, Lclasp, false);
    if (P.armBFront) comp(cv, Lbarm, 0.5, true);
    if (P.lyre) {
      // lyre frame in front of the body, cradled by the far hand, strings over it
      comp(cv, Lprop, 0.5);
      const Lb = newL(); drawLyre(Lb, arms.B.hand, P.lyre, true); comp(cv, Lb, false);
    }
    if (P.armBFront) comp(cv, Lbfist, 0.5, true);
    if (!P.armFBehind) comp(cv, Lfarm, 0.55, true);
    if (!P.clubBehind && P.club) comp(cv, Lclub, 0.55, true);
    if (!P.armFBehind) comp(cv, Lfist, 0.55, true);
    outlineAll(cv);
    if (P.smear && P.club) {
      const S = P.smear, h = arms.F.hand, a = P.club.a, len = (P.club.len || 13) + 1.5;
      const tip = [h[0] + Math.cos(a) * len, h[1] + Math.sin(a) * len];
      // ellipse centre derived so the arc passes exactly through the club head at angle a1
      const rx = S.rx, ry = S.ry, c = [tip[0] - rx * Math.cos(S.a1), tip[1] - ry * Math.sin(S.a1)];
      drawSmear(cv, { c, rx, ry, a0: S.a0, a1: S.a1, w: S.w, fade: S.fade, pw: S.pw, tip, chips: S.chips });
      if (S.dust) S.dust.forEach(([dx, dy, col]) => { const X = Math.round(tip[0] + dx), Y = AY - 1 + dy; if (!cv.get(X, Y)) cv.set(X, Y, col); });
    }
    if (P.dust) P.dust.forEach(([dx, dy, col]) => { const X = Math.round(arms.F.hand[0] + dx), Y = AY - 1 + dy; if (!cv.get(X, Y)) cv.set(X, Y, col); });
    return cv;
  }

  /* ---------------- lying dead pose: hand-drawn 40 x 9 map ----------------
     Supine, head at the left in profile with the nose to the sky and eyes closed; hair fanned on the
     ground; far arm flung up-left past the head; flat white torso band with the near arm along it; gold
     hem; straight legs (near knee lifted 2 px); crimson cape pooled underneath. */
  const DEAD = [
    '...........................................',
    '..........2................................',
    '......r1122m2............................l.',
    '.....CR2bb2223..WWWWWw.............23...2l.',
    '....DBC21332332WWwwwwwwwwwcLwwwG221122L.2l.',
    '...DCAB2k3343322221OO22wwwwLwwcG222222L33Ll',
    '677DBAC3K44..43222223O22cccLwccg333333333Ll',
    '677ECBCDD...zxvcccccccccccvlvvvy666777788ll',
    '.8EDCDDEE.zxxXXXXXXXXXXXXXXXXXXxxxxzz......'
  ];
  function renderDead() {
    const cv = newL();
    const cmap = (ch) => {
      switch (ch) {
        case 'A': return PAL.hair[0]; case 'B': return PAL.hair[1]; case 'C': return PAL.hair[2]; case 'D': return PAL.hair[3]; case 'E': return PAL.hair[4];
        case '1': return PAL.skin[0]; case '2': return PAL.skin[1]; case '3': return PAL.skin[2]; case '4': return PAL.skin[3];
        case '6': return PAL.skinB[1]; case '7': return PAL.skinB[2]; case '8': return PAL.skinB[3];
        case 'k': return PAL.skin[3];
        case 'R': return PAL.band[1]; case 'r': return PAL.band[2];
        case 'W': return PAL.cloth[0]; case 'w': return PAL.cloth[1]; case 'c': return PAL.cloth[2]; case 'v': return PAL.cloth[3];
        case 'G': return PAL.gold[1]; case 'g': return PAL.gold[2]; case 'y': return PAL.gold[3];
        case 'L': return PAL.leather[2]; case 'l': return PAL.leather[3];
        case 'O': return PAL.bronze[1]; case 'o': return PAL.bronze[2];
        case 'X': return PAL.cape[1]; case 'x': return PAL.cape[2]; case 'z': return PAL.cape[3];
        case 'b': return PAL.hair[3]; case 'm': return PAL.skin[3]; case 'e': return PAL.skinB[2];
        default: return null;
      }
    };
    const ox = AX - 21, oy = AY - DEAD.length;
    stamp(cv, DEAD, ox, oy, cmap);
    outlineAll(cv);
    return cv;
  }

  /* ---------------- poses ---------------- */
  const base = (o) => Object.assign({
    hip: [0, -16.5], lean: 0.04, torso: 9.5, face: 'n',
    legF: { f: [2.5, -2], a: 0 }, legB: { f: [-2.5, -2], a: 0 },
    armF: { h: [0.9, 9.9] }, armB: { h: [-0.6, 9.9] },
    flow: {}
  }, o);
  const POSES = {};
  // idle breathing (4 frames): chest rises on the inhale; hair, tails and cape hem sway on offset phases
  [0, 0.6, 1, 0.4].forEach((b, i) => {
    const ph = i * Math.PI / 2;
    POSES['hero_idle_' + i] = base({
      hip: [-0.6, -16.4], torso: 9.5 + (b > 0.5 ? 0.5 : 0), shoulder: b > 0.9 ? 0.5 : 0, lean: 0.0,
      armF: { h: [-1.3, 9.9 - b * 0.4], ed: -1 }, armB: { h: [0.9, 6.4 - b * 0.3], ed: 1 },
      legF: { f: [-2.9, -2], a: 0 }, legB: { f: [3.6, -2.3], a: 0.22 },
      face: 'n',
      flow: {
        cape: { a: [0.1, 0.14 + Math.sin(ph + 2) * 0.03, 0.18 + Math.sin(ph + 2) * 0.06], len: 13.5, wo: 4.2, wi: 1.6, o0: 2.6, ph: ph + 2, scal: 0.9, ridge: 0.35 },
        band: 2.2 + Math.sin(ph + 1) * 0.12, bph: 1 + i * 1.57, bamp: 0.7, blen: 6.5
      }
    });
  });
  // run cycle: contact, down, pass, up (x2 mirrored). Bob: down -1, up +1 around contact.
  // Hair/cape/tails follow the previous frame's bob (1-frame lag).
  const RUN = [
    { hip: -15.5, F: [6.4, -2, -0.3], B: [-6.0, -2.5, 0.75], aF: [-5.6, 6.4], aB: [5.0, 3.0], st: 0 },   // contact
    { hip: -14.5, F: [2.8, -2, 0.0], B: [-7.0, -6.4, 1.05], aF: [-3.6, 7.8], aB: [4.8, 4.2], st: 0 },   // down
    { hip: -15.5, F: [0.2, -2, 0.05], B: [2.2, -7.0, 0.55], aF: [1.2, 9.0], aB: [0.4, 9.0], st: 0 },     // pass
    { hip: -16.5, F: [-5.8, -2.9, 0.8], B: [6.0, -4.4, 0.05], aF: [7.0, 2.8], aB: [-4.4, 7.0], st: 0 }   // up
  ];
  // cape hem wave (0,+1,+2,+1 px), lagging one frame behind the torso bob; length varies 2-3 px
  const CAPE_RUN = [
    { a: [0.6, 0.98, 1.15], len: 12.6, hem: 0.0, wave: [1.3, 0] },
    { a: [0.64, 1.0, 1.1], len: 12.0, hem: 1.0, wave: [1.3, Math.PI / 2] },
    { a: [0.7, 1.02, 1.0], len: 11.2, hem: 2.0, wave: [1.3, Math.PI] },
    { a: [0.64, 1.0, 1.1], len: 12.4, hem: 1.0, wave: [1.3, Math.PI * 1.5] }
  ];
  for (let i = 0; i < 8; i++) {
    const r = RUN[i % 4], m = i >= 4;
    const fF = m ? r.B : r.F, fB = m ? r.F : r.B;
    const aF = m ? r.aB : r.aF, aB = m ? r.aF : r.aB;
    const prev = RUN[(i + 3) % 4];
    const lagY = prev.hip + 15.5; // hair/cape follow the previous frame's bob
    const cr = CAPE_RUN[(i + 3) % 4];
    POSES['hero_run_' + i] = base({
      hip: [0.8, r.hip], lean: 0.3, torso: 9.5 + r.st * 0.3, hipW: 0.6,
      legF: { f: [fF[0], fF[1]], a: fF[2] }, legB: { f: [fB[0], fB[1]], a: fB[2] },
      armF: { h: [aF[0], aF[1]], ed: aF[0] > 2 ? 1 : -1 }, armB: { h: [aB[0], aB[1]], ed: aB[0] > 2 ? 1 : -1 },
      face: 'n', head: [0.6, 0.3],
      flow: {
        cape: { a: cr.a, len: cr.len, wo: 2.8, wi: 1.9, o0: 1.6, bill: 0.5, ph: i * 1.1, hem: cr.hem, scal: 1.0, ridge: 0.2, wave: [cr.wave[0], cr.wave[1] + (i >= 4 ? 0.3 : 0)] },
        band: Math.PI - 0.35 - lagY * 0.12, bph: i * 1.4, bamp: 1.3, blen: 7, lock: [-1.6, 0.4 + lagY * 0.6], skirt: 0.6
      }
    });
  }
  POSES.hero_jump = base({ hip: [0, -19], lean: 0.1, torso: 9.8, legF: { f: [-2.2, -3.5], a: 1.0 }, legB: { f: [4.2, -10.5], a: 0.5 }, armF: { h: [-4.6, 6.6], ed: -1 }, armB: { h: [3.6, -6.6], ed: 1 }, face: 'fierce',
    flow: { cape: { a: [0.2, 0.28, 0.4], len: 12.5, wo: 2.6, wi: 1.8, ph: 1 }, band: 1.9, bph: 0.5, bamp: 1.1, lock: [0, 2], skirt: -0.4 } });
  POSES.hero_peak = base({ hip: [0, -19], lean: 0.14, torso: 9.5, legF: { f: [-2.8, -7.5], a: 0.8 }, legB: { f: [4.8, -10.5], a: 0.4 }, armF: { h: [-5.6, 4.4], ed: -1 }, armB: { h: [5.6, 0.4], ed: 1 }, face: 'n',
    flow: { cape: { a: [0.8, 1.2, 1.5], len: 11.5, wo: 3.2, wi: 2.0, bill: 1.0, ph: 2.2 }, band: 2.6, bph: 1.5, bamp: 1.2, lock: [-1, -1] } });
  POSES.hero_fall = base({ hip: [0, -18], lean: 0.0, torso: 9.6, legF: { f: [-2.6, -4.6], a: 0.7 }, legB: { f: [3.6, -1.6], a: 0.45 }, armF: { h: [-6.8, -4.0], ed: -1 }, armB: { h: [6.4, -4.4], ed: 1 }, face: 'hurt',
    flow: { cape: { a: [1.9, 2.2, 2.35], len: 11, wo: 3.0, wi: 2.2, bill: 0.8, ph: 3, curl: 0.25 }, band: -2.5, bph: 2, bamp: 1.2, blen: 6, lock: [-0.5, -2], skirt: 0.7 } });
  POSES.hero_land = base({ hip: [0, -12.6], lean: 0.32, torso: 9.0, head: [0.5, 0.6], legF: { f: [-4.2, -2], a: 0.15 }, legB: { f: [5.2, -2], a: 0 }, armF: { h: [-3.6, 7.0], ed: -1 }, armB: { h: [5.4, 4.2], ed: 1 }, face: 'n', skirtLen: 4.6,
    flow: { cape: { a: [0.35, 0.6, 0.5], len: 11, wo: 3.4, wi: 2.1, bill: 1.3, ph: 4 }, band: 2.35, bph: 3, bamp: 1.1, skirt: 0.5 } });
  POSES.hero_crouch = base({ hip: [0, -9.2], lean: 0.45, torso: 9.0, head: [0.5, 0.6], legF: { f: [-4.8, -1.6], a: 1.25, kd: 1 }, legB: { f: [5.4, -2], a: 0, kd: 1 }, armF: { h: [-0.6, 7.2], ed: -1 }, armB: { h: [4.8, 5.0], ed: 1 }, face: 'n', skirtLen: 4.4,
    flow: { cape: { a: [0.5, 0.75, 0.62], len: 10.5, wo: 3.0, wi: 2.0, bill: 0.9, ph: 0.5 }, band: 2.3, bph: 1 } });

  // attacks: anticipation -> wind-up -> strike (smear) -> follow-through -> recover.
  // Hands are placed in absolute feet coordinates (H/E) so the club lines up with the engine hitbox:
  // strike club horizontal at feet-22, head ~24 px in front (hitbox x +6..+28, y feet-28..feet-14).
  function swing(kind) {
    const out = [];
    const low = kind === 'catk', air = kind === 'jatk';
    const dy = low ? 7.3 : air ? -2.5 : 0;        // vertical shift of the upper body
    const up = (v) => [v[0], v[1] + dy];
    const legs = (pz, F, B) => {
      if (low) { pz.legB = { f: [5.6 + Math.max(0, pz.hip[0]) * 0.6, -2], a: 0, kd: 1 }; pz.legF = { f: [-4.8, -1.6], a: 1.25, kd: 1 }; }
      else if (air) { pz.legF = { f: [pz.hip[0] + 4.3, -12], a: 0.5 }; pz.legB = { f: [pz.hip[0] - 3, -8.5], a: 0.8 }; }
      else { pz.legF = F; pz.legB = B; }
      return pz;
    };
    const mk = (o) => {
      const pz = base(Object.assign({ hipW: 0.7 }, o));
      pz.hip = [o.hip[0], o.hip[1] + dy];
      if (low) { pz.lean = (pz.lean || 0) + 0.3; pz.torso = 9.0; pz.head = [0.5, 0.6]; pz.skirtLen = 4.4; }
      return pz;
    };
    const chips = [[2, -2, '#ffffff'], [4, 0, '#ffb040'], [3, 2, '#ffe0a0'], [5, -1, '#ffffff']];
    // f0 anticipation: the club is hoisted onto the near shoulder — fist in front of the shoulder, elbow
    // down-forward, club head resting behind the back; knees dip, chest up, cape pushed forward
    out.push(legs(mk({ hip: [-0.6, -16.0], lean: -0.08, torso: 9.7,
      armF: { E: up([0.0, -20.6]), H: up([-2.4, -25.6]) }, armB: { h: [4.4, 6.0], ed: 1 },
      club: { a: -2.45, len: 13 }, clubBehind: true, face: 'fierce',
      flow: { cape: { a: [-0.02, 0.04, 0.1], len: 12.5, wo: 3.6, wi: 1.7, o0: 2.2, ph: 1 }, band: 1.75, bph: 0.3, bamp: 0.9 } }),
      { f: [4.0, -2] }, { f: [-3.6, -2] }));
    // f1 wind-up: torso rocks back, elbow raised high beside the head, fist behind the crown,
    // club angled ~35 deg down-back behind the shoulders; weight on the back leg
    out.push(legs(mk({ hip: [-1.6, -15.2], lean: -0.22, torso: 10.3,
      armF: { E: up([-10.0, -27.2]), H: up([-9.4, -32.4]) }, armB: { h: [5.0, 3.6], ed: 1 },
      club: { a: Math.PI - 0.6, len: 13 }, clubBehind: true, face: 'fierce',
      flow: { cape: { a: [-0.12, -0.05, 0.06], len: 12.5, wo: 3.6, wi: 1.8, o0: 2.2, bill: 0.5, ph: 2 }, band: 1.45, bph: 1, bamp: 1.0, lock: [1.2, 0] } }),
      { f: [5.0, -2] }, { f: [-4.4, -2], a: 0.1 }));
    // f2 strike: lunge, torso forward, arm fully extended, club horizontal at feet-22 + smear from the
    // wind-up position over the head down to the club head
    out.push(legs(mk({ hip: [3.0, -14.7], lean: 0.42, torso: 10.0,
      armF: { H: up([10.4, -22.0]) }, armB: { h: [-4.6, 5.6], ed: -1 },
      club: { a: 0.0, len: 13.5 }, face: 'shout',
      smear: { rx: 22, ry: 14, a0: -2.8, a1: 0, w: 6, chips },
      flow: { cape: { a: [1.0, 1.3, 1.45], len: 12.5, wo: 2.8, wi: 1.9, bill: 0.7, ph: 3, wave: [1, 0.5] }, band: Math.PI - 0.25, bph: 2, bamp: 1.6, blen: 7, lock: [-2.0, 0], skirt: 0.8 } }),
      { f: [9.6, -2], a: -0.1 }, { f: [-6.2, -2.8], a: 0.9 }));
    // f3 follow-through: club swung down-forward, trailing fade of the smear
    out.push(legs(mk({ hip: [3.0, -14.6], lean: 0.5, torso: 9.9,
      armF: { H: up([9.2, -15.8]) }, armB: { h: [-4.4, 6.2], ed: -1 },
      club: { a: 0.95, len: 13 }, face: 'fierce',
      smear: { rx: 22, ry: 14, a0: -0.55, a1: 0.62, w: 4, fade: 1, pw: 0.8 },
      flow: { cape: { a: [0.8, 1.1, 1.35], len: 12, wo: 3.0, wi: 2.0, bill: 1.0, curl: 0.25, ph: 4, wave: [1, 2] }, band: 2.6, bph: 3, bamp: 1.3, lock: [-1.2, 1], skirt: 0.5 } }),
      { f: [9.6, -2] }, { f: [-6.2, -2.4], a: 0.8 }));
    // f4 recover: straighten up, club lowered in front, ~25 deg forward of vertical, 2 px clear of the leg
    out.push(legs(mk({ hip: [1.4, -16.4], lean: 0.14, torso: 9.5,
      armF: { H: up([6.4, -16.6]) }, armB: { h: [-2.4, 8.8] },
      club: { a: 1.08, len: 12 }, face: 'n',
      flow: { cape: { a: [0.3, 0.42, 0.55], len: 12.2, wo: 3.4, wi: 1.9, o0: 2, bill: 0.6, ph: 5 }, band: 2.2, bph: 4, bamp: 1.0 } }),
      { f: [2.4, -2] }, { f: [-4.4, -2], a: 0.15 }));
    if (low) {
      // crouch: overhead wind-up stays, the strike is a low, nearly horizontal sweep to the ground in front
      out[2].armF = { H: up([10.0, -19.4]) }; out[2].club = { a: 0.55, len: 13.5 };
      out[2].smear = { rx: 22, ry: 7, a0: -1.25, a1: 0.55, w: 6, pw: 0.8, chips: [[2, -1, '#ffffff'], [3, 1, '#ffe0a0']], dust: [[1, 0, '#e8d0a8'], [3, 0, '#c9b08a'], [2, -1, '#e8d0a8'], [-1, 0, '#c9b08a']] };
      // follow-through: the club lands flat along the ground, head resting just above the floor line
      out[3].armF = { H: [9.4, -4.8] }; out[3].club = { a: 0.07, len: 13 };
      out[3].smear = null; out[3].dust = [[14, 0, '#e8d0a8'], [16, -1, '#c9b08a'], [18, 0, '#e8d0a8']];
      out[4].armF = { H: up([7.0, -15.6]) }; out[4].club = { a: 0.6, len: 12 };
    }
    if (air) { out[0].lean = -0.06; out[1].lean = -0.16; }
    out.forEach((pz, i) => { POSES['hero_' + kind + '_' + i] = pz; });
  }
  swing('atk'); swing('catk'); swing('jatk');

  // hurt: strong back-arch, head thrown back, arms flung back, cape/hair/tails whipping forward
  POSES.hero_hurt = base({ hip: [-1.5, -16.4], lean: -0.34, torso: 9.4, head: [-1, 0.5], legF: { f: [5, -6], a: 0.5 }, legB: { f: [-3, -1.8], a: 0.25 }, armF: { h: [-6.2, -4.4], ed: 1 }, armB: { h: [-7, 0.5], ed: 1 }, face: 'hurt',
    flow: { cape: { a: [-0.6, -1.1, -1.35], len: 12.5, wo: 2.6, wi: 2.0, bill: 0.8, ph: 1 }, band: -0.3, bph: 1, bamp: 1.5, blen: 7, lock: [2.5, -1.5], skirt: -0.9 } });
  // collapsing: on the knees, slumped forward
  POSES.hero_dead_0 = base({ hip: [-1, -8.6], lean: 0.8, torso: 9.2, head: [1, 1.5], legF: { f: [-6, -1.5], a: 1.4, kd: 1 }, legB: { f: [4.4, -2], a: 0 }, armF: { h: [1.0, 8.4], ed: -1 }, armB: { h: [4.2, 7.4], ed: 1 }, face: 'hurt', skirtLen: 4.4,
    flow: { cape: { a: [0.9, 1.3, 1.8], len: 11, wo: 3.2, wi: 2.1, bill: 0.9, ph: 2, curl: 0.25 }, band: 2.3, bph: 1 } });
  // lyre: a big golden lyre held out at the right side by the far hand (at its base), the near hand
  // reaching across the belly to pluck the strings; eyes closed, gentle smile
  [0, 1].forEach((i) => {
    POSES['hero_lyre_' + i] = base({ hip: [-0.4, -16.5], lean: 0.0, torso: 9.5 + i * 0.4, legF: { f: [-2.9, -2] }, legB: { f: [3.6, -2.3], a: 0.22 },
      armF: { E: [-3.0, -18.6], H: [4.6 - i * 0.5, -19.6 - i * 0.9] }, armB: { E: [5.8, -21.0], H: [6.6, -17.4] },
      face: 'calm', lyre: { pluck: i * 3 },
      flow: { cape: { a: [0.1, 0.14, 0.18 + i * 0.05], len: 13.5, wo: 4.2, wi: 1.6, o0: 2.6, ph: i * 1.6, ridge: 0.35 }, band: 2.0 + i * 0.1, bph: i * 1.3, bamp: 0.7 } });
  });
  POSES.hero_blink = Object.assign({}, POSES.hero_idle_0, { face: 'blink' });
  // item get: triumphant, both arms raised with bent elbows (diamond), fists meeting 3 px above the crown,
  // weight on the back leg, front knee relaxed, proud open smile
  POSES.hero_hold = base({ hip: [-0.4, -16.5], lean: -0.03, torso: 9.8, shoulder: 1.0, shoulderW: 1.4, head: [0.6, 0.6], face: 'joy',
    legF: { f: [-2.8, -2] }, legB: { f: [3.8, -2.5], a: 0.3 },
    armF: { E: [-7.6, -31.6], H: [-2.4, -38.6] }, armB: { E: [6.8, -31.8], H: [1.0, -39.0] },
    flow: { cape: { a: [0.1, 0.13, 0.18], len: 12, wo: 3.3, wi: 1.6, ph: 1.2, ridge: 0.3 }, band: 2.25, bph: 1.2, bamp: 0.8 } });

  /* ---------------- register ---------------- */
  function finish(name, p) {
    // crop rows above the content (engine places held items relative to the sprite top)
    let top = 0;
    outer: for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (p.get(x, y)) { top = y; break outer; }
    top = Math.max(0, top - 1);
    const h = AY + 1 - top;
    const q = new O.Pix(W, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) { const c = p.get(x, y + top); if (c) q.set(x, y, c); }
    O.registerSprite(name, q, { ax: AX, ay: AY - top });
  }
  O.HERO_ART = { render, POSES, W, H, AX, AY };

  O.ART_INITS.push(function () {
    Object.keys(POSES).forEach((k) => finish(k, render(POSES[k])));
    finish('hero_dead_1', renderDead());
  });
})(window.OLY);
