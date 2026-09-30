/* ui.js — Orpheus: Song of Olympus — modern pixel UI.
   Bold proportional pixel font (overrides O.text), marble & gold frames, HUD, dialogue with portraits,
   status screen, title key-art, illustrated story scenes, game over, ending, area banner, boss bar,
   and the item / icon sprites (olive, ambrosia, pom, heart, icon_club, icon_sandals, lyre, bolt, arrow_up). */
window.OLY = window.OLY || {};
(function (O) {
  'use strict';
  const W = O.W, H = O.H;
  const OUT = '#1b1426';
  const GOLD = ['#fff7b0', '#ffd24a', '#e39b1d', '#a8621b', '#633416'];
  const MARBLE = ['#ffffff', '#f1eef5', '#d5d0e2', '#a8a1c0', '#6f6a8e'];
  const INK = '#140e24';
  const TXT = '#f4efe6';
  const DIM = '#9a91b8';
  const RED = ['#ffb59a', '#f0503a', '#bf2a2e', '#801b2c', '#4a1026'];

  /* =====================================================================
     FONT — bold proportional pixel font, 7px cap height (+1 descender row)
     ===================================================================== */
  const GL = {
    A: ['.####.', '##..##', '##..##', '######', '##..##', '##..##', '##..##'],
    B: ['#####.', '##..##', '##..##', '#####.', '##..##', '##..##', '#####.'],
    C: ['.####.', '##..##', '##....', '##....', '##....', '##..##', '.####.'],
    D: ['#####.', '##..##', '##..##', '##..##', '##..##', '##..##', '#####.'],
    E: ['######', '##....', '##....', '#####.', '##....', '##....', '######'],
    F: ['######', '##....', '##....', '#####.', '##....', '##....', '##....'],
    G: ['.####.', '##..##', '##....', '##.###', '##..##', '##..##', '.#####'],
    H: ['##..##', '##..##', '##..##', '######', '##..##', '##..##', '##..##'],
    I: ['####', '.##.', '.##.', '.##.', '.##.', '.##.', '####'],
    J: ['..####', '....##', '....##', '....##', '##..##', '##..##', '.####.'],
    K: ['##..##', '##.##.', '####..', '###...', '####..', '##.##.', '##..##'],
    L: ['##....', '##....', '##....', '##....', '##....', '##....', '######'],
    M: ['##...##', '###.###', '#######', '##.#.##', '##...##', '##...##', '##...##'],
    N: ['##..##', '###.##', '######', '##.###', '##..##', '##..##', '##..##'],
    O: ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
    P: ['#####.', '##..##', '##..##', '#####.', '##....', '##....', '##....'],
    Q: ['.####.', '##..##', '##..##', '##..##', '##.###', '##..##', '.###.#'],
    R: ['#####.', '##..##', '##..##', '#####.', '##.##.', '##..##', '##..##'],
    S: ['.####.', '##..##', '##....', '.####.', '....##', '##..##', '.####.'],
    T: ['######', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..'],
    U: ['##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
    V: ['##..##', '##..##', '##..##', '##..##', '##..##', '.####.', '..##..'],
    W: ['##...##', '##...##', '##...##', '##.#.##', '#######', '###.###', '##...##'],
    X: ['##..##', '##..##', '.####.', '..##..', '.####.', '##..##', '##..##'],
    Y: ['##..##', '##..##', '##..##', '.####.', '..##..', '..##..', '..##..'],
    Z: ['######', '....##', '...##.', '..##..', '.##...', '##....', '######'],
    0: ['.####.', '##..##', '##.###', '######', '###.##', '##..##', '.####.'],
    1: ['.##.', '###.', '.##.', '.##.', '.##.', '.##.', '####'],
    2: ['.####.', '##..##', '....##', '..###.', '.##...', '##....', '######'],
    3: ['.####.', '##..##', '....##', '..###.', '....##', '##..##', '.####.'],
    4: ['...###', '..####', '.##.##', '##..##', '######', '....##', '....##'],
    5: ['######', '##....', '#####.', '....##', '....##', '##..##', '.####.'],
    6: ['.####.', '##....', '##....', '#####.', '##..##', '##..##', '.####.'],
    7: ['######', '....##', '...##.', '..##..', '..##..', '..##..', '..##..'],
    8: ['.####.', '##..##', '##..##', '.####.', '##..##', '##..##', '.####.'],
    9: ['.####.', '##..##', '##..##', '.#####', '....##', '...##.', '.###..'],
    '.': ['..', '..', '..', '..', '..', '##', '##'],
    ',': ['..', '..', '..', '..', '..', '##', '##', '#.'],
    '!': ['##', '##', '##', '##', '##', '..', '##'],
    '?': ['.####.', '##..##', '....##', '..###.', '..##..', '......', '..##..'],
    "'": ['##', '##', '#.', '..', '..', '..', '..'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    ':': ['..', '##', '##', '..', '##', '##', '..'],
    ';': ['..', '##', '##', '..', '##', '##', '#.'],
    '/': ['....##', '...##.', '...##.', '..##..', '.##...', '.##...', '##....'],
    '(': ['.##', '##.', '##.', '##.', '##.', '##.', '.##'],
    ')': ['##.', '.##', '.##', '.##', '.##', '.##', '##.'],
    '"': ['##.##', '##.##', '#..#.', '.....', '.....', '.....', '.....'],
    '>': ['##...', '.##..', '..##.', '...##', '..##.', '.##..', '##...'],
    '<': ['...##', '..##.', '.##..', '##...', '.##..', '..##.', '...##'],
    '+': ['......', '..##..', '..##..', '######', '..##..', '..##..', '......'],
    '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
    '*': ['.....', '..#..', '#.#.#', '.###.', '#.#.#', '..#..', '.....'],
    '^': ['..##..', '.####.', '##..##', '......', '......', '......', '......'],
    '%': ['##...#', '##..##', '...##.', '..##..', '.##...', '##..##', '#...##'],
    '#': ['.#..#.', '######', '.#..#.', '.#..#.', '######', '.#..#.', '......'],
    '&': ['.###..', '##.##.', '.###..', '####.#', '##.##.', '##..#.', '.##.##'],
    '~': ['......', '......', '.##..#', '#..##.', '......', '......', '......'],
    '\u00d7': ['.....', '.....', '##.##', '.###.', '..#..', '.###.', '##.##'],
    '\u2191': ['..##..', '.####.', '######', '..##..', '..##..', '..##..', '..##..'],
    '\u2193': ['..##..', '..##..', '..##..', '..##..', '######', '.####.', '..##..'],
    '@': ['.####.', '##..##', '##.###', '##.#.#', '##.###', '##....', '.####.']
  };
  const SPACE = 4, GAP = 1;
  const GI = {};
  let gx = 0;
  Object.keys(GL).forEach((ch) => { const w = GL[ch][0].length; GI[ch] = { x: gx, w }; gx += w + 1; });
  const ATLAS_W = gx;
  const atlases = {};
  // colour can be a string or an array of 8 row colours (vertical gradient).
  function atlas(color) {
    const key = Array.isArray(color) ? color.join(',') : color;
    if (atlases[key]) return atlases[key];
    const c = O.makeCanvas(ATLAS_W, 8), g = c.getContext('2d');
    Object.keys(GL).forEach((ch) => {
      const rows = GL[ch], o = GI[ch].x;
      for (let y = 0; y < rows.length; y++) {
        g.fillStyle = Array.isArray(color) ? color[Math.min(color.length - 1, y)] : color;
        for (let x = 0; x < rows[y].length; x++) if (rows[y][x] === '#') g.fillRect(o + x, y, 1, 1);
      }
    });
    atlases[key] = c;
    return c;
  }
  function adv(ch) { const g = GI[ch]; return g ? g.w + GAP : ch === ' ' ? SPACE : 0; }
  function textWidth(str, scale, track) {
    const t = String(str).toUpperCase(), s = scale || 1, tr = track || 0;
    let w = 0;
    for (let i = 0; i < t.length; i++) w += adv(t[i]) + tr;
    return Math.max(0, (w - GAP - tr) * s);
  }
  // Draw text; returns the pen advance in px.
  function text(ctx, str, x, y, color, scale, track) {
    if (O.HDFont) { const r = O.HDFont(ctx, str, x, y, color || TXT, scale, track, textWidth(str, scale, track)); if (r !== null) return r; }
    const a = atlas(color || TXT), s = scale || 1, tr = track || 0;
    const t = String(str).toUpperCase();
    let px = Math.round(x);
    const py = Math.round(y);
    for (let i = 0; i < t.length; i++) {
      const g = GI[t[i]];
      if (g) ctx.drawImage(a, g.x, 0, g.w, 8, px, py, g.w * s, 8 * s);
      px += (adv(t[i]) + tr) * s;
    }
    return px - x;
  }
  O.text = function (ctx, str, x, y, color, scale) { return text(ctx, str, x, y, color, scale); };
  O.textWidth = textWidth;
  O.textCenter = function (ctx, str, y, color, scale) { text(ctx, str, Math.round((W - textWidth(str, scale)) / 2), y, color, scale); };
  O.textShadow = function (ctx, str, x, y, color, shadow, scale) {
    const s = scale || 1;
    text(ctx, str, x, y + s, shadow || INK, s);
    text(ctx, str, x, y, color, s);
  };
  // Rich text: o = { sh: shadow colour, ol: outline colour, sc: scale, al: 'c'|'r', tr: tracking }
  function rt(ctx, str, x, y, color, o) {
    o = o || {};
    const s = o.sc || 1, tr = o.tr || 0;
    let X = x;
    if (o.al === 'c') X = Math.round(x - textWidth(str, s, tr) / 2);
    else if (o.al === 'r') X = Math.round(x - textWidth(str, s, tr));
    if (o.ol) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) text(ctx, str, X + dx * s, y + dy * s, o.ol, s, tr);
      if (o.sh) text(ctx, str, X, y + 2 * s, o.sh, s, tr);
    } else if (o.sh) {
      text(ctx, str, X, y + s, o.sh, s, tr);
    }
    text(ctx, str, X, y, color, s, tr);
    return X;
  }
  O.UIText = rt;

  /* =====================================================================
     PIXEL HELPERS
     ===================================================================== */
  function fromMap(rows, legend) {
    const p = new O.Pix(rows[0].length, rows.length);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = legend[r[x]]; if (c) p.set(x, y, c); } });
    return p;
  }
  // 2.5D "dome" shading of any mask: distance transform -> rounded height -> normal -> light (upper-left).
  // o: { r: bevel radius, base: ramp index on flat areas, k: contrast, grad(y,x): extra index offset, spec }
  function dome(mask, ramp, o) {
    o = o || {};
    const w = mask.w, h = mask.h, n = w * h, D = new Float32Array(n);
    for (let i = 0; i < n; i++) D[i] = mask.d[i] ? 1e6 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : D[y * w + x]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!D[i]) continue;
      D[i] = Math.min(D[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x; if (!D[i]) continue;
      D[i] = Math.min(D[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
    }
    const r = o.r || 3;
    const Hh = (x, y) => {
      const d = at(x, y); if (!d) return 0;
      const q = Math.max(0, 1 - (d - 0.5) / r);
      return r * Math.sqrt(Math.max(0, 1 - q * q));
    };
    let Lx = o.L ? o.L[0] : -0.55, Ly = o.L ? o.L[1] : -0.7, Lz = o.L ? o.L[2] : 0.75;
    const ll = Math.hypot(Lx, Ly, Lz); Lx /= ll; Ly /= ll; Lz /= ll;
    const out = new O.Pix(w, h), N = ramp.length, base = o.base === undefined ? 1 : o.base, k = o.k || 3.2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!mask.d[y * w + x]) continue;
      const nx = (Hh(x - 1, y) - Hh(x + 1, y)) / 2, ny = (Hh(x, y - 1) - Hh(x, y + 1)) / 2, nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      const lum = (nx * Lx + ny * Ly + nz * Lz) / nl;
      let idx = base - (lum - Lz) * k + (o.grad ? o.grad(y, x) : 0);
      idx = Math.round(idx + (o.dither ? (O.bayer(x, y) - 0.5) * o.dither : 0));
      idx = idx < 0 ? 0 : idx > N - 1 ? N - 1 : idx;
      out.set(x, y, (o.spec && lum - Lz > 0.33) ? o.spec : ramp[idx]);
    }
    return out;
  }
  function maskOf(p) { const m = new O.Pix(p.w, p.h); for (let i = 0; i < p.d.length; i++) m.d[i] = p.d[i] ? '#' : null; return m; }
  function pad(p, n) { const q = new O.Pix(p.w + n * 2, p.h + n * 2); q.blit(p, n, n); return q; }

  /* =====================================================================
     ICONS / ITEM SPRITES
     ===================================================================== */
  // Rotated ellipse mask helper.
  function rotEllipse(m, cx, cy, rx, ry, ang, c) {
    const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.max(rx, ry) + 1;
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      const px = x + 0.5 - cx, py = y + 0.5 - cy;
      const u = px * ca + py * sa, v = -px * sa + py * ca;
      if ((u / rx) * (u / rx) + (v / ry) * (v / ry) <= 1) m.set(x, y, c || '#');
    }
    return m;
  }
  const OLV = ['#e6f0a8', '#b8c860', '#8aa640', '#6a8a30', '#3a4a2a'];
  const OLP = ['#c89ab8', '#a0708e', '#7a4a6a', '#5e3858', '#4a2a4a'];
  const OLL = ['#dce6c8', '#a8b890', '#7e9270', '#56684e'];
  function iconOlive() {
    // A sprig: slender silver-green leaf, a ripe dark olive behind, a big green olive in front.
    const p = new O.Pix(13, 15);
    // twig
    p.line(3, 3, 9, 1, '#6e4a2a'); p.set(4, 3, '#8a6038'); p.set(6, 2, '#8a6038');
    p.line(5, 3, 5, 5, '#6e4a2a'); p.line(9, 2, 9, 6, '#6e4a2a');
    // leaf (up-right, slender)
    const lf = new O.Pix(13, 15); rotEllipse(lf, 10.2, 1.8, 2.9, 1.05, -0.45);
    p.blit(dome(lf, OLL, { r: 1.2, base: 1.2, k: 2.6 }), 0, 0);
    p.set(9, 2, OLL[3]); p.set(10, 2, OLL[2]);
    // dark ripe olive (behind, right)
    const b = new O.Pix(13, 15); rotEllipse(b, 9.3, 9.6, 2.5, 3.4, 0.35);
    p.blit(dome(b, OLP, { r: 2.4, base: 2, k: 3.2 }), 0, 0);
    p.set(8, 8, '#e8c8e0');
    // green olive (front, left), tilted oval 7x10
    const g = new O.Pix(13, 15); rotEllipse(g, 4.8, 9.2, 3.35, 4.9, -0.28);
    p.blit(dome(g, OLV, { r: 3, base: 2, k: 3.3 }), 0, 0);
    p.set(3, 6, '#ffffff'); p.set(3, 7, OLV[0]); p.set(4, 6, OLV[0]);
    p.selout(OUT);
    return p;
  }
  const AMB = ['#fff7c8', '#ffd24a', '#e39b1d', '#a8621b', '#633416'];
  function iconAmbrosia() {
    const m = new O.Pix(12, 15);
    m.ellipse(6, 9.5, 4.6, 4.4, '#');        // belly
    m.rect(4, 3, 4, 3, '#');                  // neck
    m.rect(3, 2, 6, 2, '#');                  // rim
    m.rect(4, 13, 4, 2, '#');                 // foot
    const p = dome(m, AMB, { r: 2.5, base: 2, k: 3.2, spec: '#ffffff' });
    // handles
    p.set(2, 5, GOLD[3]); p.set(1, 6, GOLD[3]); p.set(1, 7, GOLD[3]); p.set(2, 8, GOLD[3]);
    p.set(9, 5, GOLD[3]); p.set(10, 6, GOLD[3]); p.set(10, 7, GOLD[3]); p.set(9, 8, GOLD[3]);
    // decorative band (terracotta meander hint)
    for (let x = 3; x <= 9; x++) if (p.get(x, 9)) p.set(x, 9, x % 2 ? '#c24c2f' : '#83302a');
    // glowing nectar at the mouth
    p.set(5, 1, '#fff4ea'); p.set(6, 1, '#ffd0f0'); p.set(5, 0, '#ffffff');
    p.selout(OUT);
    return pad(p, 0);
  }
  const POM = ['#ffc0a8', '#ff6a4e', '#d8303a', '#8e1a34', '#4e0f28'];
  function iconPom() {
    const m = new O.Pix(13, 14);
    m.ellipse(6.5, 8.5, 5.4, 5.2, '#');
    m.rect(5, 2, 3, 2, '#');
    const p = dome(m, POM, { r: 4, base: 2, k: 3.3, spec: '#ffe6d8' });
    // calyx crown
    p.set(4, 1, POM[3]); p.set(6, 0, POM[3]); p.set(8, 1, POM[3]); p.set(6, 1, POM[2]); p.set(5, 2, POM[3]); p.set(7, 2, POM[3]);
    p.selout(OUT);
    return p;
  }
  function iconHeart() {
    const m = fromMap([
      '.###...###.',
      '#####.#####',
      '###########',
      '###########',
      '###########',
      '.#########.',
      '..#######..',
      '...#####...',
      '....###....',
      '.....#.....'
    ], { '#': '#' });
    const p = pad(dome(m, RED, { r: 3, base: 1.6, k: 3.6, spec: '#fff0e8' }), 1);
    p.selout(OUT);
    return p;
  }
  // Club: cylinder-shaded along its long axis (light from the upper-left), knots, bronze band, leather grip.
  const WOOD = ['#e8b884', '#c89060', '#a87444', '#8a5a30', '#6a3e26', '#4a2a20', '#34192a'];
  function iconClub() {
    const w = 16, h = 16, x0 = 2.5, y0 = 13.5, x1 = 12.2, y1 = 3.6;
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    const nx = uy, ny = -ux;                      // normal pointing to the upper-left side
    const rad = (t) => 1.25 + Math.pow(Math.max(0, t), 1.6) * 1.75;  // handle -> head
    const p = new O.Pix(w, h);
    const knots = [[0.52, -1, 0.9], [0.8, 1, 1.0]];  // [t, side, size]
    const info = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const px = x + 0.5 - x0, py = y + 0.5 - y0;
      let t = (px * ux + py * uy) / L;
      const d = px * nx + py * ny;                   // signed distance from the axis (+ = lit side)
      if (t < -0.02 || t > 1.08) continue;
      let r = rad(Math.min(1, t));
      if (t > 1) r = Math.sqrt(Math.max(0, 1 - Math.pow((t - 1) / 0.08, 2))) * rad(1);
      let bump = 0;
      knots.forEach((k) => { const dt = (t - k[0]) * L; if (Math.abs(dt) < 1.6 && Math.sign(d) === k[1]) bump = Math.max(bump, k[2] * (1 - Math.abs(dt) / 1.6)); });
      if (Math.abs(d) > r + bump) continue;
      const q = d / (r + bump);                      // -1 shadow side .. +1 lit side
      let idx = q > 0.55 ? 1 : q > 0.1 ? 2 : q > -0.35 ? 3 : q > -0.75 ? 4 : 5;
      if (t > 0.98) idx = Math.max(1, idx - 1);      // lit end grain
      p.set(x, y, WOOD[idx]);
      info[x + ',' + y] = t;
    }
    // knots: dark ring interiors
    knots.forEach((k) => {
      const cx = x0 + ux * k[0] * L + nx * k[1] * rad(k[0]) * 0.55, cy = y0 + uy * k[0] * L + ny * k[1] * rad(k[0]) * 0.55;
      const X = Math.round(cx - 0.5), Y = Math.round(cy - 0.5);
      if (p.get(X, Y)) { p.set(X, Y, WOOD[6]); if (p.get(X + 1, Y)) p.set(X + 1, Y, WOOD[4]); if (p.get(X, Y - 1)) p.set(X, Y - 1, k[1] > 0 ? WOOD[1] : WOOD[3]); }
    });
    // end-grain ring on the head
    const hx = Math.round(x0 + ux * L * 1.02 - 0.5), hy = Math.round(y0 + uy * L * 1.02 - 0.5);
    if (p.get(hx, hy)) p.set(hx, hy, WOOD[2]);
    // bronze band (2px ring across the handle) + leather grip
    Object.keys(info).forEach((k) => {
      const t = info[k], xy = k.split(',').map(Number), c = p.get(xy[0], xy[1]);
      if (t > 0.3 && t < 0.4) p.set(xy[0], xy[1], c === WOOD[1] || c === WOOD[2] ? '#ffe08a' : c === WOOD[3] ? '#e0a040' : c === WOOD[4] ? '#b07028' : '#8a5020');
      else if (t < 0.12) p.set(xy[0], xy[1], c === WOOD[1] || c === WOOD[2] ? '#b0613f' : c === WOOD[3] ? '#8a4632' : '#5e2c28');
    });
    p.selout(OUT);
    return p;
  }
  // Winged sandal of Hermes, in profile: a bare foot on a sole with a raised toe, two diagonal straps crossing the
  // instep over a bare heel, an ankle strap, and a three-feather wing fanning upward from the heel.
  function iconSandals() {
    const p = fromMap([
      'w..w............',
      'aw.aw..w........',
      'aAwaAw.aw.......',
      '.aAaAAwaA.......',
      '.bAAaAAAb.......',
      '..bbAAAb........',
      '....bbKSSK......',
      '.....FfKF.......',
      '.....FFfSK......',
      '....FFFSKFfF....',
      '....FFSKFFFFFf..',
      '....fFFFFFFFFFFf',
      '....EEEEEEEEEEEe',
      '.....ddddddddde.'
    ], { w: '#ffffff', a: '#eef4ff', A: '#b8ccf0', b: '#7a8cc8', F: '#f0b890', f: '#c8805e', S: '#c88a48', K: '#7a4424', E: '#b0703a', e: '#d89050', d: '#6a3a1a' });
    p.selout(OUT);
    return p;
  }
  // HUD lyre (sits on the medallion's blue enamel): bright gold horn arms clearly apart from 2 strings,
  // a crossbar on top and a 3-row tortoiseshell sound box.
  const HUD_LYRE = [
    'a.......c',
    '.a.....c.',
    '.aYYYYYc.',
    'a.s...s.c',
    'a.s...s.c',
    'a.s...s.c',
    '.as...sc.',
    '..TTTTT..',
    '.TtTTUtT.',
    '..UUUUU..'
  ];
  function hudLyre() {
    const p = fromMap(HUD_LYRE, { a: GOLD[0], c: GOLD[2], Y: GOLD[0], s: '#fff0c0', T: '#c08040', t: '#e8b070', U: '#6a3a1c' });
    const q = new O.Pix(11, 12); q.blit(p, 1, 1);
    // the upper-left crossbar pixels catch the light
    q.set(3, 3, '#ffffff'); q.set(8, 3, GOLD[1]); q.set(7, 3, GOLD[1]);
    // outline only around the gold / wood parts, the strings stay free
    const sOn = []; for (let y = 0; y < q.h; y++) for (let x = 0; x < q.w; x++) if (q.get(x, y) === '#fff0c0') { sOn.push([x, y]); q.set(x, y, null); }
    q.selout(OUT);
    sOn.forEach((s2) => q.set(s2[0], s2[1], '#fff0c0'));
    return q.canvas();
  }
  // Small lyre lying on its side with one snapped string (game over).
  function fallenLyre() {
    const p = fromMap(HUD_LYRE, { a: GOLD[1], c: GOLD[3], Y: GOLD[1], s: '#e8d8b0', T: '#a86a38', t: '#c8905a', U: '#5a3018' });
    // snap the left string: keep only its lower part, the loose end curls away
    p.set(2, 3, null); p.set(2, 4, null); p.set(1, 5, '#e8d8b0'); p.set(2, 5, null);
    const r = new O.Pix(p.h + 2, p.w + 2);                 // rotate 90° clockwise (top of the lyre points right)
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) { const c = p.get(x, y); if (c) r.set(p.h - y, x + 1, c); }
    const sOn = []; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.get(x, y) === '#e8d8b0') { sOn.push([x, y]); r.set(x, y, null); }
    r.selout(OUT);
    sOn.forEach((s2) => r.set(s2[0], s2[1], '#e8d8b0'));
    return r.canvas();
  }
  function iconLyre() {
    // Ox-horn arms (mirrored S-curves), a lit yoke, three free strings, tortoiseshell soundbox.
    const m = fromMap([
      'G...........G',
      'GG.........GG',
      '.GG.......GG.',
      '.GYYYYYYYYYG.',
      '.GYYYYYYYYYG.',
      'GG.........GG',
      'G...........G',
      'G...........G',
      'GG.........GG',
      '.GG.......GG.',
      '..GG.....GG..',
      '..BBBBBBBBB..',
      '.TTTTTTTTTTT.',
      'TTTTTTTTTTTTT',
      '.TTTTTTTTTTT.',
      '..TTTTTTTTT..'
    ], { G: '#', Y: '#', B: '#', T: '#' });
    const gold = new O.Pix(13, 16), shell = new O.Pix(13, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 13; x++) if (m.get(x, y)) (y >= 11 ? shell : gold).set(x, y, '#');
    const arms = dome(gold, GOLD, { r: 1.4, base: 1.6, k: 3.2, spec: '#ffffff' });
    // yoke: 1px lit top, 1px dark bottom
    for (let x = 2; x <= 10; x++) { arms.set(x, 3, x < 7 ? GOLD[0] : GOLD[1]); arms.set(x, 4, GOLD[3]); }
    // right arm in shadow, left arm lit (upper-left light)
    for (let y = 5; y <= 10; y++) for (let x = 7; x < 13; x++) if (arms.get(x, y)) arms.set(x, y, x === 12 || (y >= 9 && x >= 10) ? GOLD[3] : GOLD[2]);
    const box2 = dome(shell, ['#e0a860', '#c08040', '#a8703a', '#8a5a2a', '#5e3a1c'], { r: 2.4, base: 2, k: 3.2 });
    // tortoiseshell mottling + bridge
    [[3, 13], [6, 13], [9, 13], [4, 14], [8, 14], [11, 13], [6, 15]].forEach((q) => box2.get(q[0], q[1]) && box2.set(q[0], q[1], '#5e3a1c'));
    for (let x = 3; x <= 9; x++) box2.set(x, 11, x === 3 ? '#e0a860' : '#7a4a24');
    const p = new O.Pix(15, 18);
    p.blit(arms, 1, 1); p.blit(box2, 1, 1);
    p.selout(OUT);
    // strings (after the outline so the gaps stay open)
    [5, 7, 9].forEach((x) => { for (let y = 6; y <= 11; y++) { p.set(x, y, y === 6 ? '#ffffff' : '#fff0c0'); } });
    return p;
  }
  function iconBolt() {
    const m = new O.Pix(11, 17);
    m.poly([[5, 0], [10, 0], [6.5, 6], [10, 6], [2, 16.5], [4.5, 8.5], [1, 8.5]], '#');
    const p = dome(m, ['#ffffff', '#fff7b0', '#ffd24a', '#e39b1d', '#a8621b'], { r: 1.6, base: 1.6, k: 3 });
    p.selout(OUT);
    return p;
  }
  // "Talk" prompt: marble speech bubble with a gold up-chevron and a tail pointing down at the speaker.
  function iconArrowUp() {
    const p = fromMap([
      '.OOOOOOOOOOO.',
      'OwMMMMMMMMMMO',
      'OMMMMMaMMMMMO',
      'OMMMMaGbMMMMO',
      'OMMMaGGGbMMMO',
      'OMMaGGGGGbMMO',
      'OMMcccGGcccmO',
      'OMMMMaGbMMmmO',
      'OMMMMcccMmmmO',
      'OmmmmmmmmmmmO',
      '.OOOOmmmOOOO.',
      '.....OmmO....',
      '.....OmO.....',
      '......O......'
    ], { O: OUT, w: '#ffffff', M: MARBLE[1], m: MARBLE[3], a: GOLD[0], G: GOLD[1], b: GOLD[2], c: GOLD[3] });
    return p;
  }

  /* =====================================================================
     FRAMES, PANELS, ORNAMENTS
     ===================================================================== */
  function hl(c, x, y, w, col) { c.fillStyle = col; c.fillRect(x, y, w, 1); }
  function vl(c, x, y, h, col) { c.fillStyle = col; c.fillRect(x, y, 1, h); }
  function box(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }

  // Gold bevel frame (4px): outline, lit top-left, shadowed bottom-right, dark inner line.
  function goldFrame(c, x, y, w, h) {
    hl(c, x + 2, y, w - 4, OUT); hl(c, x + 2, y + h - 1, w - 4, OUT);
    vl(c, x, y + 2, h - 4, OUT); vl(c, x + w - 1, y + 2, h - 4, OUT);
    box(c, x + 1, y + 1, 1, 1, OUT); box(c, x + w - 2, y + 1, 1, 1, OUT); box(c, x + 1, y + h - 2, 1, 1, OUT); box(c, x + w - 2, y + h - 2, 1, 1, OUT);
    hl(c, x + 2, y + 1, w - 4, GOLD[0]); vl(c, x + 1, y + 2, h - 4, GOLD[1]);
    hl(c, x + 2, y + h - 2, w - 4, GOLD[3]); vl(c, x + w - 2, y + 2, h - 4, GOLD[3]);
    c.fillStyle = GOLD[2];
    c.fillRect(x + 2, y + 2, w - 4, 1); c.fillRect(x + 2, y + h - 3, w - 4, 1);
    c.fillRect(x + 2, y + 2, 1, h - 4); c.fillRect(x + w - 3, y + 2, 1, h - 4);
    hl(c, x + 2, y + 2, w - 5, GOLD[1]);
    c.fillStyle = GOLD[4];
    c.fillRect(x + 3, y + 3, w - 6, 1); c.fillRect(x + 3, y + h - 4, w - 6, 1);
    c.fillRect(x + 3, y + 3, 1, h - 6); c.fillRect(x + w - 4, y + 3, 1, h - 6);
  }
  const STUD = fromMap([
    '...O...',
    '..OaO..',
    '.OabcO.',
    'OabGbdO',
    '.OcbdO.',
    '..OdO..',
    '...O...'
  ], { O: OUT, a: GOLD[0], b: GOLD[1], c: GOLD[2], d: GOLD[3], G: '#5fb4ff' }).canvas();
  const STUD_S = fromMap([
    '.O.',
    'OaO',
    '.O.'
  ], { O: OUT, a: GOLD[0] }).canvas();

  // Translucent "night glass" panel with gold frame and corner studs.
  const glassCache = {};
  function glass(w, h, a) {
    const key = w + 'x' + h + ':' + a;
    if (glassCache[key]) return glassCache[key];
    const cv = O.makeCanvas(w, h), g = cv.getContext('2d');
    const top = [28, 20, 52], bot = [12, 8, 26];
    for (let y = 0; y < h; y++) {
      const t = y / Math.max(1, h - 1);
      g.fillStyle = 'rgba(' + Math.round(top[0] + (bot[0] - top[0]) * t) + ',' + Math.round(top[1] + (bot[1] - top[1]) * t) + ',' + Math.round(top[2] + (bot[2] - top[2]) * t) + ',' + a + ')';
      g.fillRect(0, y, w, 1);
    }
    g.fillStyle = 'rgba(255,240,220,0.07)'; g.fillRect(0, 0, w, 1);
    g.fillStyle = 'rgba(255,240,220,0.04)'; g.fillRect(0, 1, w, 1);
    glassCache[key] = cv;
    return cv;
  }
  function panel(c, x, y, w, h, o) {
    o = o || {};
    c.drawImage(glass(w - 6, h - 6, o.a === undefined ? 0.86 : o.a), x + 3, y + 3);
    goldFrame(c, x, y, w, h);
    if (o.studs !== false) {
      c.drawImage(STUD, x - 2, y - 2); c.drawImage(STUD, x + w - 5, y - 2);
      c.drawImage(STUD, x - 2, y + h - 5); c.drawImage(STUD, x + w - 5, y + h - 5);
    }
  }
  O.panel = function (c, x, y, w, h) { panel(c, x, y, w, h); };

  // Greek key (meander) band, 7px tall, gold on dark.
  const KEY = [
    '#########.',
    '........#.',
    '######..#.',
    '#....#..#.',
    '#.####..#.',
    '#.......#.',
    '#########.'
  ];
  const keyCache = {};
  function keyBand(w, fg, bg) {
    const k = w + fg + bg;
    if (keyCache[k]) return keyCache[k];
    const cv = O.makeCanvas(w, 9), g = cv.getContext('2d');
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, 9); }
    g.fillStyle = GOLD[4]; g.fillRect(0, 0, w, 1); g.fillRect(0, 8, w, 1);
    for (let x = 0; x < w; x++) for (let y = 0; y < 7; y++) {
      if (KEY[y][x % 10] !== '#') continue;
      g.fillStyle = y === 0 || KEY[y - 1][x % 10] !== '#' ? GOLD[1] : fg; g.fillRect(x, y + 1, 1, 1);
    }
    keyCache[k] = cv;
    return cv;
  }
  // Golden laurel sprig, hand-authored: a curved stem with three pairs of almond leaves pointing along it
  // (lit upper edge GOLD[0], body GOLD[1], underside GOLD[3]) and a berry at the tip. Plum sel-out on the
  // exterior only. 'L' = 23x13 (titles, banners), 'S' = 15x10 (small labels). The stem base is on the left,
  // the tip points right; flip = mirrored copy (for the left side of a title).
  const LAUREL_MAP = {
    L: [
      '................aa...',
      '..........aa..aabb...',
      '....aa..aabb.abbc.wr.',
      '..aabb.abbc..bc.ssrm.',
      '.abbc..bc..sssss.....',
      '.bc..ssssss....ab....',
      'sssss....ab....bbbb..',
      '...ab....bbbb...bccc.',
      '...bbbb...bccc....cc.',
      '....bccc....cc.......',
      '......cc.............'
    ],
    S: [
      '........a....',
      '...a...ab....',
      '..ab..abc.wr.',
      '.abc.sssssrm.',
      'sssss...ab...',
      '...ab...bbc..',
      '...bbc...cc..',
      '....cc.......'
    ]
  };
  const laurelCache = {};
  // size: 'L' | 'S' (numbers kept for old call sites: >= 14 -> 'L'); flash: brightest tones (selected cursor)
  function laurel(size, flip, flash) {
    const sz = typeof size === 'number' ? (size >= 14 ? 'L' : 'S') : (size || 'L');
    const key = sz + ':' + (flip ? 1 : 0) + (flash ? 'f' : '');
    if (laurelCache[key]) return laurelCache[key];
    const lg = flash
      ? { a: '#ffffff', b: GOLD[0], c: GOLD[2], s: GOLD[1], m: GOLD[1], r: GOLD[0], w: '#ffffff' }
      : { a: GOLD[0], b: GOLD[1], c: GOLD[3], s: GOLD[2], m: GOLD[2], r: GOLD[1], w: '#ffffff' };
    const p = pad(fromMap(LAUREL_MAP[sz], lg), 1);
    p.selout(OUT);
    let cv = p.canvas();
    if (flip) { const f = O.makeCanvas(cv.width, cv.height), g = f.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); cv = f; }
    laurelCache[key] = cv;
    return cv;
  }
  // A pair of laurels framing a centred label: cy = the label's vertical centre, hw = half its width.
  // bob: 1px outward bob (menu cursors); flash: bright tones.
  function laurels(c, cx, cy, hw, size, gap, bob, flash) {
    const Lf = laurel(size, true, flash), Lr = laurel(size, false, flash);
    const g2 = gap === undefined ? 5 : gap, b = bob || 0;
    const y = Math.round(cy - Lr.height / 2);
    c.drawImage(Lf, Math.round(cx - hw - g2 - Lf.width - b), y);
    c.drawImage(Lr, Math.round(cx + hw + g2 + b), y);
  }
  // Decorative gold rule with a central diamond.
  function rule(c, x, y, w) {
    hl(c, x, y, w, GOLD[2]); hl(c, x, y + 1, w, GOLD[4]);
    hl(c, x + 2, y - 1, w - 4, 'rgba(255,247,176,0.25)');
  }
  // Marble name plate.
  function plate(c, x, y, w, label, col) {
    const h = 13;
    box(c, x + 1, y, w - 2, h, OUT); box(c, x, y + 1, w, h - 2, OUT);
    box(c, x + 1, y + 1, w - 2, h - 2, MARBLE[1]);
    hl(c, x + 1, y + 1, w - 2, '#ffffff');
    hl(c, x + 1, y + h - 3, w - 2, MARBLE[2]); hl(c, x + 1, y + h - 2, w - 2, MARBLE[3]);
    // veins
    c.fillStyle = 'rgba(111,106,142,0.35)';
    c.fillRect(x + 5, y + 4, 3, 1); c.fillRect(x + 8, y + 5, 2, 1); c.fillRect(x + w - 12, y + 8, 4, 1);
    // gold end caps
    [x + 1, x + w - 4].forEach((ex) => { box(c, ex, y + 1, 3, h - 2, GOLD[2]); vl(c, ex, y + 1, h - 2, GOLD[0]); vl(c, ex + 2, y + 1, h - 2, GOLD[3]); });
    rt(c, label, x + w / 2, y + 3, col || '#3a2a4a', { al: 'c', sh: 'rgba(255,255,255,0.6)' });
  }

  /* =====================================================================
     SMALL ANIMATION HELPERS
     ===================================================================== */
  const ease = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  function chevron(c, x, y, col) {
    c.fillStyle = OUT; c.fillRect(x - 1, y - 1, 9, 2); c.fillRect(x, y + 1, 7, 1); c.fillRect(x + 1, y + 2, 5, 1); c.fillRect(x + 2, y + 3, 3, 1); c.fillRect(x + 3, y + 4, 1, 1);
    c.fillStyle = col || GOLD[1]; c.fillRect(x, y, 7, 1); c.fillRect(x + 1, y + 1, 5, 1); c.fillRect(x + 2, y + 2, 3, 1); c.fillRect(x + 3, y + 3, 1, 1);
    c.fillStyle = GOLD[0]; c.fillRect(x, y, 3, 1);
  }
  function cursor(c, x, y, t) {
    // small gold arrowhead cursor with a bob
    const b = Math.round(Math.sin(t * 0.18) * 1.2);
    const X = x + b;
    c.fillStyle = OUT;
    c.fillRect(X - 1, y - 1, 3, 9); c.fillRect(X + 2, y, 2, 7); c.fillRect(X + 4, y + 1, 2, 5); c.fillRect(X + 6, y + 2, 1, 3);
    c.fillStyle = GOLD[2]; c.fillRect(X, y, 1, 7); c.fillRect(X + 1, y + 1, 1, 5); c.fillRect(X + 2, y + 1, 1, 5); c.fillRect(X + 3, y + 2, 1, 3); c.fillRect(X + 4, y + 2, 1, 3); c.fillRect(X + 5, y + 3, 1, 1);
    c.fillStyle = GOLD[0]; c.fillRect(X, y, 1, 3); c.fillRect(X + 1, y + 1, 2, 1); c.fillRect(X + 3, y + 2, 2, 1);
  }
  function sparkle(c, x, y, s, col) {
    c.fillStyle = col || '#fff7b0';
    c.fillRect(x, y, 1, 1);
    if (s > 0) { c.fillRect(x - s, y, s * 2 + 1, 1); c.fillRect(x, y - s, 1, s * 2 + 1); }
    if (s > 1) { c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1); }
  }

  /* =====================================================================
     HUD
     ===================================================================== */
  const hud = { hp: null, ghost: 0, ghostT: 0, olives: 0, oliveT: 0, amb: 0, ambT: 0, healT: 0 };
  let scrim = null;
  function hudScrim() {
    if (scrim) return scrim;
    scrim = O.makeCanvas(W, 34);
    const g = scrim.getContext('2d');
    for (let y = 0; y < 34; y++) {
      const a = 0.5 * Math.pow(1 - y / 34, 1.6);
      g.fillStyle = 'rgba(14,8,30,' + a.toFixed(3) + ')'; g.fillRect(0, y, W, 1);
    }
    return scrim;
  }
  let medal = null;
  function medallion() {
    if (medal) return medal;
    const p = new O.Pix(24, 24);
    p.ellipse(12, 12, 11.5, 11.5, OUT);
    const ring = new O.Pix(24, 24); ring.ellipse(12, 12, 10.5, 10.5, '#');
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (Math.hypot(x + 0.5 - 12, y + 0.5 - 12) < 7.6) ring.set(x, y, null);
    p.blit(dome(ring, GOLD, { r: 1.8, base: 2, k: 3.4, spec: '#ffffff' }), 0, 0);
    // lapis enamel disc: deep blue with a soft top-left highlight crescent and a darker lower-right
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
      const dx = x + 0.5 - 12, dy = y + 0.5 - 12, d = Math.hypot(dx, dy);
      if (d >= 7.6) continue;
      let col = '#2a4a8a';
      if (d >= 6.6) col = OUT;
      else if (Math.hypot(dx + 2.2, dy + 2.2) > 6.2 && dx + dy < -2) col = '#4a6ab0';
      else if (Math.hypot(dx - 1.6, dy - 1.6) > 5.6 && dx + dy > 3) col = '#1e3468';
      p.set(x, y, col);
    }
    p.set(8, 7, '#8aa8e0'); p.set(7, 8, '#6a8ad0');
    medal = p.canvas();
    return medal;
  }
  // 1px glint sweeping around the medallion's gold rim every ~4 s.
  function medalShine(c, cx, cy, t) {
    const ph = t % 240;
    if (ph > 36) return;
    const a0 = -Math.PI * 0.75 + (ph / 36) * Math.PI * 1.3;
    for (let k = -2; k <= 2; k++) {
      const a = a0 + k * 0.09, x = Math.round(cx + Math.cos(a) * 9.6 - 0.5), y = Math.round(cy + Math.sin(a) * 9.6 - 0.5);
      c.globalAlpha = k === 0 ? 0.95 : Math.abs(k) === 1 ? 0.6 : 0.3;
      c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1);
    }
    c.globalAlpha = 1;
  }
  function lifeBar(c, x, y, hp, maxHp, t, big) {
    const seg = big ? 5 : 4, bh = big ? 7 : 5, bw = maxHp * seg;
    // frame
    box(c, x, y, bw + 6, bh + 6, OUT);
    box(c, x + 1, y + 1, bw + 4, bh + 4, GOLD[2]);
    hl(c, x + 1, y + 1, bw + 4, GOLD[0]); hl(c, x + 1, y + bh + 4, bw + 4, GOLD[3]);
    vl(c, x + bw + 4, y + 1, bh + 4, GOLD[3]);
    box(c, x + 2, y + 2, bw + 2, bh + 2, OUT);
    const ix = x + 3, iy = y + 3;
    // empty
    for (let r = 0; r < bh; r++) hl(c, ix, iy + r, bw, r === 0 ? '#4a2440' : r >= bh - 1 ? '#1e1024' : '#33182e');
    const low = hp <= Math.max(2, maxHp * 0.25) && hp > 0;
    const pulse = low && (Math.sin(t * 0.25) > 0.2);
    const fillW = Math.max(0, Math.min(maxHp, hp)) * seg;
    // damage ghost
    const gw = Math.max(0, Math.min(maxHp, hud.ghost)) * seg;
    if (gw > fillW) { const a = Math.min(1, hud.ghostT / 20); c.globalAlpha = 0.4 + 0.6 * a; box(c, ix + fillW, iy, gw - fillW, bh, '#fff0c0'); c.globalAlpha = 1; }
    const ramp = pulse ? ['#ffffff', '#ffb59a', '#ff6a4e', '#d8303a', '#8e1a34'] : RED;
    for (let r = 0; r < bh; r++) {
      const col = r === 0 ? ramp[0] : r === 1 ? ramp[1] : r < bh - 1 ? ramp[2] : ramp[3];
      hl(c, ix, iy + r, fillW, col);
    }
    if (hud.healT > 0 && fillW > 0) { c.globalAlpha = hud.healT / 24; box(c, ix, iy, fillW, bh, '#fff7b0'); c.globalAlpha = 1; }
    // segment notches every 2 hp
    for (let i = 2; i < maxHp; i += 2) {
      const nx = ix + i * seg - 1;
      vl(c, nx, iy + 1, bh - 1, i * seg <= fillW ? 'rgba(74,16,38,0.55)' : 'rgba(0,0,0,0.25)');
    }
    // glint travelling along the filled bar
    if (fillW > 4) {
      const gxp = ((t * 0.9) % (fillW + 60)) - 10;
      if (gxp >= 0 && gxp < fillW) { c.globalAlpha = 0.7; box(c, ix + gxp, iy, 2, 1, '#ffffff'); c.globalAlpha = 1; }
    }
    // end cap diamond
    const ex = x + bw + 6, ey = y + ((bh + 6) >> 1);
    c.drawImage(STUD, ex - 3, ey - 3);
    return bw + 6;
  }

  // Ghost version of a sprite for empty slots: every pixel of its shape filled, edge pixels as a soft outline.
  function ghostShape(src, fill, edge) {
    const w = src.width, h = src.height, cv = O.makeCanvas(w, h), g = cv.getContext('2d');
    const d = src.getContext('2d').getImageData(0, 0, w, h).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      const e = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
      g.fillStyle = e ? edge : fill; g.fillRect(x, y, 1, 1);
    }
    return cv;
  }
  // "Not yet found": a hollow 1px ghost outline of the sprite's silhouette (outline pixels only, interior empty).
  function ghostOutline(src, col) {
    const w = src.width, h = src.height, cv = O.makeCanvas(w, h), g = cv.getContext('2d');
    const d = src.getContext('2d').getImageData(0, 0, w, h).data;
    // the sprite's own plum sel-out is the outermost ring: use the ring just inside it so the shape stays exact
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 128;
    g.fillStyle = col;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      if (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1)) g.fillRect(x, y, 1, 1);
    }
    return cv;
  }
  // "Not yet owned" version of a sprite: its own shading remapped to a dim violet ramp, semi-transparent.
  function dimSprite(src, ramp, alpha, edge) {
    const w = src.width, h = src.height, cv = O.makeCanvas(w, h), g = cv.getContext('2d');
    const d = src.getContext('2d').getImageData(0, 0, w, h).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      const i = (y * w + x) * 4, L = (d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15) / 255;
      const e = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
      g.globalAlpha = alpha;
      g.fillStyle = e ? edge : ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor((1 - L) * ramp.length)))];
      g.fillRect(x, y, 1, 1);
    }
    return cv;
  }
  const DIMR = ['#b0a4d0', '#8a7aa8', '#6a5a8a', '#4a3e68', '#342a50'];
  function emptyJar() {
    const s = O.SPR.ambrosia; if (!s) return null;
    if (!hud.jarEmpty || hud.jarSrc !== s.n) { hud.jarSrc = s.n; hud.jarEmpty = dimSprite(s.n, DIMR, 0.62, '#241a3a'); }
    return hud.jarEmpty;
  }
  function emptyItem(name) {
    const s = O.SPR[name]; if (!s) return null;
    const k = 'ghost_' + name;
    if (!hud[k] || hud[k + 'src'] !== s.n) { hud[k + 'src'] = s.n; hud[k] = ghostOutline(s.n, 'rgba(200,180,255,0.42)'); }
    return hud[k];
  }
  let hudBuf = null;
  function drawHUD(c0, g) {
    const st = g.st, t = g.t;
    // animated trackers
    if (hud.hp === null || hud.lvl !== g.lvl) { hud.hp = st.hp; hud.ghost = st.hp; hud.olives = st.olives; hud.amb = st.ambrosia; hud.lvl = g.lvl; }
    if (st.hp < hud.hp) { hud.ghost = Math.max(hud.ghost, hud.hp); hud.ghostT = 30; }
    if (st.hp > hud.hp) hud.healT = 24;
    hud.hp = st.hp;
    if (hud.ghostT > 0) hud.ghostT--; else if (hud.ghost > st.hp) hud.ghost = Math.max(st.hp, hud.ghost - 0.15);
    if (hud.ghost < st.hp) hud.ghost = st.hp;
    if (hud.healT > 0) hud.healT--;
    if (st.olives !== hud.olives) { hud.oliveT = 14; hud.olives = st.olives; }
    if (st.ambrosia !== hud.amb) { hud.ambT = 20; hud.amb = st.ambrosia; }
    if (hud.oliveT > 0) hud.oliveT--;
    if (hud.ambT > 0) hud.ambT--;
    // the HUD steps aside while someone is talking (the dialogue box takes the top of the screen)
    // ...and it is hidden behind the STATUS screen, which shows the same information
    const want = (g.dialog || g.state === 'pause') ? 0 : 1;
    if (g.state === 'pause') hud.vis = 0;
    if (hud.vis === undefined) hud.vis = want;
    hud.vis += (want - hud.vis) * 0.2;
    if (Math.abs(want - hud.vis) < 0.02) hud.vis = want;
    if (hud.vis <= 0.01) return;
    if (!hudBuf) hudBuf = O.makeCanvas(W, 36);
    const c = hudBuf.getContext('2d');
    c.clearRect(0, 0, W, 36);

    c.drawImage(hudScrim(), 0, 0);
    // medallion with lyre
    c.drawImage(medallion(), 4, 3);
    if (!hud.lyre) hud.lyre = hudLyre();
    c.drawImage(hud.lyre, 4 + 12 - (hud.lyre.width >> 1), 3 + 12 - (hud.lyre.height >> 1));
    medalShine(c, 16, 15, t);
    // life bar
    lifeBar(c, 27, 5, st.hp, st.maxHp, t);
    // olives
    const oy = 20 - (hud.oliveT > 8 ? 1 : 0);
    O.drawSpr(c, 'olive', 28, 16);
    rt(c, '×' + st.olives, 43, oy, hud.oliveT > 0 ? '#ffffff' : '#eef4c8', { ol: OUT });
    // ambrosia jars (a thin gold divider separates them from the olive counter)
    const ax0 = 74, s = O.SPR.ambrosia;
    vl(c, ax0 - 5, 18, 12, 'rgba(255,210,74,0.35)');
    if (s) {
      const ej = emptyJar();
      for (let i = 0; i < 3; i++) {
        const has = i < st.ambrosia;
        const bob = has && hud.ambT > 0 && i === st.ambrosia - 1 ? -1 - (hud.ambT > 12 ? 1 : 0) : 0;
        c.drawImage(has ? s.n : ej, ax0 + i * 12, 17 + bob);
      }
    }
    // item slots (top-right)
    const items = [['club', 'icon_club'], ['sandals', 'icon_sandals']];
    items.forEach((it, i) => {
      const x = W - 50 + i * 23, y = 4;
      const has = !!st.items[it[0]];
      slot(c, x, y, 20, has);
      const s2 = O.SPR[it[1]];
      if (!s2) return;
      const img = has ? s2.n : emptyItem(it[1]);
      if (img) c.drawImage(img, x + 10 - (s2.w >> 1), y + 10 - (s2.h >> 1));
    });
    c0.globalAlpha = hud.vis;
    c0.drawImage(hudBuf, 0, -Math.round((1 - hud.vis) * 8));
    c0.globalAlpha = 1;
    if (g.state === 'itemget' && O.ITEMS && O.ITEMS[g.itemKey]) itemToast(c0, g);
  }
  // "Treasure found" title card while the hero holds up a new item.
  function itemToast(c, g) {
    const it = O.ITEMS[g.itemKey], age = 130 - (g.itemT || 0);
    const a = Math.max(0, Math.min(1, age / 14, (g.itemT || 0) / 10));
    if (a <= 0) return;
    const T = goldTitle(it.name);
    const cy = 52, slide = Math.round((1 - ease(age / 18)) * 6);
    c.globalAlpha = a;
    const rw0 = Math.min(W, T.width + 150);
    c.drawImage(ribbon(rw0, 46, 0.72), Math.round(W / 2 - rw0 / 2), cy - 17);
    rt(c, 'TREASURE FOUND', W / 2, cy - 10 + slide, [GOLD[0], GOLD[0], GOLD[1], GOLD[1], GOLD[1], GOLD[2], GOLD[2], GOLD[2]], { al: 'c', ol: OUT, tr: 2 });
    const x = Math.round(W / 2 - T.width / 2);
    c.drawImage(T, x, cy + slide);
    laurels(c, W / 2, cy + slide + 13, T.width / 2 - 7, 'L', 4);
    c.globalAlpha = 1;
  }
  function slot(c, x, y, s, lit) {
    box(c, x + 1, y, s - 2, s, OUT); box(c, x, y + 1, s, s - 2, OUT);
    box(c, x + 1, y + 1, s - 2, s - 2, GOLD[2]);
    hl(c, x + 2, y + 1, s - 4, GOLD[0]); vl(c, x + 1, y + 2, s - 4, GOLD[1]);
    hl(c, x + 2, y + s - 2, s - 4, GOLD[3]); vl(c, x + s - 2, y + 2, s - 4, GOLD[3]);
    box(c, x + 2, y + 2, s - 4, s - 4, OUT);
    box(c, x + 3, y + 3, s - 6, s - 6, lit === false ? 'rgba(22,16,40,0.72)' : 'rgba(40,28,70,0.88)');
    hl(c, x + 3, y + 3, s - 6, 'rgba(160,140,220,0.30)');
    if (lit !== false) { c.fillStyle = 'rgba(255,210,120,0.10)'; c.fillRect(x + 4, y + 4, s - 8, s - 8); }
  }

  /* =====================================================================
     DIALOGUE — docked at the TOP of the screen so the people talking stay visible
     ===================================================================== */
  const SPEAKER = { ELDER: 'elder', MERCHANT: 'merchant', WOMAN: 'villager', ZEUS: 'zeus', HERMES: 'hermes', HADES: 'hades', EURYDICE: 'eurydice', ORPHEUS: 'orpheus' };
  const NAMES = { WOMAN: 'VILLAGER' };
  const GODS = { ZEUS: 1, HERMES: 1, HADES: 1 };
  const dlg = { ref: null, t0: 0, page: -1, pt0: 0 };
  // Dialogue layout (also used to pick the wrap width).
  const DB = { x: 8, y: 7, w: 368, h: 58 };
  const DLH = 11;
  O.TEXT_W = 36;

  function portraitFrame(c, x, y, name, t, god) {
    // 56x56 frame: gold bevel + inner marble rim
    const s = 56;
    if (god) glowAt(c, x + s / 2, y + s / 2, 46, 'rgba(255,220,120,1)', 0.28 + 0.1 * Math.sin(t * 0.06));
    box(c, x + 1, y, s - 2, s, OUT); box(c, x, y + 1, s, s - 2, OUT);
    box(c, x + 1, y + 1, s - 2, s - 2, GOLD[2]);
    hl(c, x + 2, y + 1, s - 4, GOLD[0]); vl(c, x + 1, y + 2, s - 4, GOLD[1]);
    hl(c, x + 2, y + s - 2, s - 4, GOLD[3]); vl(c, x + s - 2, y + 2, s - 4, GOLD[3]);
    box(c, x + 3, y + 3, s - 6, s - 6, OUT);
    const p = O.SPR[name];
    box(c, x + 4, y + 4, 48, 48, '#2a2040');
    if (p && p.hdc) { c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(p.hdc, x + 4, y + 4, 48, 48); c.restore(); }
    else if (p) c.drawImage(p.n, 0, 0, Math.min(48, p.w), Math.min(48, p.h), x + 4, y + 4, Math.min(48, p.w), Math.min(48, p.h));
    // inner glass sheen
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(x + 4, y + 4, 48, 1); c.fillRect(x + 4, y + 5, 1, 47);
    c.drawImage(STUD, x - 2, y - 2); c.drawImage(STUD, x + s - 5, y - 2); c.drawImage(STUD, x - 2, y + s - 5); c.drawImage(STUD, x + s - 5, y + s - 5);
  }
  // Typewriter glyph: the newest letter flashes brighter with a soft warm halo (base colour unchanged).
  function freshGlyph(c, ch, x, y) {
    if (ch === ' ') return;
    c.globalAlpha = 0.3;
    text(c, ch, x - 1, y, '#ffe6a0'); text(c, ch, x + 1, y, '#ffe6a0'); text(c, ch, x, y - 1, '#ffe6a0'); text(c, ch, x, y + 1, '#ffe6a0');
    c.globalAlpha = 1;
    text(c, ch, x, y, '#ffffff');
  }

  function drawDialog(c, g) {
    const d = g.dialog, t = g.t;
    if (!d) return;
    if (dlg.ref !== d) { dlg.ref = d; dlg.t0 = t; dlg.page = -1; }
    if (dlg.page !== d.page) { dlg.page = d.page; dlg.pt0 = t; }
    const k = ease((t - dlg.t0) / 10);
    const oy = -Math.round((1 - k) * 12);
    const kind = SPEAKER[d.speaker];
    const hasP = !!(kind && O.SPR['portrait_' + kind]);
    const maxLines = d.pages.reduce((m, p) => Math.max(m, p.length), 1) + (d.choice ? 1 : 0);
    const x = DB.x, y = DB.y + oy, w = DB.w, h = hasP ? DB.h : Math.min(DB.h, 20 + maxLines * DLH);
    c.globalAlpha = k;
    // soft shadow the box casts on the scene below
    c.fillStyle = 'rgba(10,6,24,0.28)'; c.fillRect(x + 4, y + h, w - 8, 2);
    c.fillStyle = 'rgba(10,6,24,0.14)'; c.fillRect(x + 8, y + h + 2, w - 16, 2);
    panel(c, x, y, w, h, { a: 0.94 });
    let tx = x + 14;
    if (hasP) {
      // portrait hangs from the box, breaking its bottom edge
      portraitFrame(c, x + 5, y + h - 44, 'portrait_' + kind, t, GODS[d.speaker]);
      tx = x + 69;
    }
    if (d.speaker) {
      const label = NAMES[d.speaker] || d.speaker;
      const pw = textWidth(label) + 22;
      plate(c, tx - 6, y + h - 7, pw, label, GODS[d.speaker] ? '#6a3a10' : '#3a2a4a');
    } else {
      // narration: laurel ornaments on the bottom edge
      laurels(c, x + w / 2, y + h, 3, 'S', 3);
      c.drawImage(STUD, x + w / 2 - 3, y + h - 3);
    }
    const page = d.pages[d.page] || [];
    let left = d.chars | 0;
    const total = page.join('').length;
    const ty = y + 9;
    page.forEach((line, i) => {
      const n = Math.max(0, Math.min(line.length, left));
      left -= line.length;
      if (n <= 0) return;
      const shown = line.slice(0, n);
      rt(c, shown, tx, ty + i * DLH, TXT, { sh: '#0a0614' });
      if (n < line.length && (d.chars | 0) < total) {
        const last = shown[shown.length - 1];
        freshGlyph(c, last, tx + textWidth(shown) - textWidth(last), ty + i * DLH);
      }
    });
    if (d.chars >= total) {
      if (d.choice && d.page === d.pages.length - 1) {
        const oyy = ty + Math.min(3, page.length) * DLH + 1;
        let ox = tx + 16;
        d.choice.options.forEach((o, i) => {
          const on = i === d.choice.sel;
          const ow = textWidth(o) + 14;
          if (on) {
            box(c, ox - 5, oyy - 2, ow, 11, 'rgba(255,210,74,0.18)');
            hl(c, ox - 5, oyy - 2, ow, 'rgba(255,247,176,0.45)'); hl(c, ox - 5, oyy + 8, ow, 'rgba(168,98,27,0.7)');
            cursor(c, ox - 14, oyy, t);
          }
          rt(c, o, ox + 2, oyy, on ? [GOLD[0], GOLD[0], GOLD[1], GOLD[1], GOLD[1], GOLD[2], GOLD[2], GOLD[2]] : DIM, { sh: '#0a0614' });
          ox += ow + 22;
        });
      } else {
        // continue prompt sits on the bottom border, in a small gold socket
        const bx = x + w - 26, by = y + h - 4 + Math.round(Math.sin(t * 0.15) * 1.2);
        box(c, bx - 3, y + h - 5, 13, 7, OUT); box(c, bx - 2, y + h - 4, 11, 5, '#2a1a40');
        chevron(c, bx, by - 2);
      }
    }
    c.globalAlpha = 1;
  }

  /* =====================================================================
     BANNER & BOSS BAR
     ===================================================================== */
  /* =====================================================================
     DISPLAY TYPE — hand-built Roman capitals (12px cap height) sharing the logo's gold finish.
     Used by the area banner, the STATUS title and section headings.
     ===================================================================== */
  const DG = {
    A: ['....##.....', '....###....', '...#.##....', '...#..##...', '..#...##...', '..#....##..', '.#.....##..', '.########..', '.#......##.', '#.......##.', '#........##', '###....####'],
    B: ['#######..', '.##...##.', '.##....##', '.##....##', '.##...##.', '.######..', '.##...##.', '.##....##', '.##....##', '.##....##', '.##...##.', '#######..'],
    C: ['...#####.', '.##....##', '##......#', '##.......', '##.......', '##.......', '##.......', '##.......', '##.......', '##......#', '.##....##', '...#####.'],
    D: ['#######...', '.##....##.', '.##.....##', '.##.....##', '.##.....##', '.##.....##', '.##.....##', '.##.....##', '.##.....##', '.##.....##', '.##....##.', '#######...'],
    E: ['#########', '.##.....#', '.##......', '.##...#..', '.##...#..', '.######..', '.##...#..', '.##...#..', '.##......', '.##......', '.##.....#', '#########'],
    F: ['#########', '.##.....#', '.##......', '.##...#..', '.##...#..', '.######..', '.##...#..', '.##...#..', '.##......', '.##......', '.##......', '####.....'],
    G: ['...#####.#', '.##.....##', '##.......#', '##........', '##........', '##........', '##...#####', '##......##', '##......##', '.##.....##', '.##.....##', '...######.'],
    H: ['####...####', '.##.....##.', '.##.....##.', '.##.....##.', '.##.....##.', '.#########.', '.##.....##.', '.##.....##.', '.##.....##.', '.##.....##.', '.##.....##.', '####...####'],
    I: ['####', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '####'],
    J: ['..#####', '....##.', '....##.', '....##.', '....##.', '....##.', '....##.', '....##.', '....##.', '#...##.', '##..##.', '.####..'],
    K: ['####..####', '.##....#..', '.##...#...', '.##..#....', '.##.#.....', '.####.....', '.##.##....', '.##..##...', '.##...##..', '.##....##.', '.##.....##', '####...###'],
    L: ['####.....', '.##......', '.##......', '.##......', '.##......', '.##......', '.##......', '.##......', '.##......', '.##......', '.##.....#', '#########'],
    M: ['###.......###', '.##.......##.', '.###.....###.', '.#.##...#.##.', '.#.##...#.##.', '.#..##.#..##.', '.#..##.#..##.', '.#...###..##.', '.#...###..##.', '.#....#...##.', '.#....#...##.', '###.......###'],
    N: ['###.....###', '.##......#.', '.###.....#.', '.#.##....#.', '.#..##...#.', '.#..##...#.', '.#...##..#.', '.#....##.#.', '.#....##.#.', '.#.....###.', '.#......##.', '###......#.'],
    O: ['...####...', '.##....##.', '##......##', '##......##', '##......##', '##......##', '##......##', '##......##', '##......##', '##......##', '.##....##.', '...####...'],
    P: ['#######..', '.##...##.', '.##....##', '.##....##', '.##....##', '.##...##.', '.######..', '.##......', '.##......', '.##......', '.##......', '####.....'],
    Q: ['...####...', '.##....##.', '##......##', '##......##', '##......##', '##......##', '##......##', '##......##', '##..##..##', '##...##.##', '.##...###.', '...######.'],
    R: ['#######....', '.##...##...', '.##....##..', '.##....##..', '.##...##...', '.######....', '.##..##....', '.##...##...', '.##...##...', '.##....##..', '.##....##..', '####....###'],
    S: ['..####.#', '.##...##', '##.....#', '##......', '.###....', '..####..', '....###.', '......##', '#.....##', '#.....##', '##...##.', '#.####..'],
    T: ['##########', '#...##...#', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '...####...'],
    U: ['####...###', '.##.....#.', '.##.....#.', '.##.....#.', '.##.....#.', '.##.....#.', '.##.....#.', '.##.....#.', '.##.....#.', '.##.....#.', '..##...#..', '...####...'],
    V: ['###.....###', '.##......#.', '.##......#.', '..##....#..', '..##....#..', '..##....#..', '...##..#...', '...##..#...', '....##.#...', '....###....', '....###....', '.....#.....'],
    W: ['###..###..###', '.##...##...#.', '.##...##...#.', '.##...##...#.', '..##..###.#..', '..##.#.##.#..', '..##.#.##.#..', '...###..###..', '...###..###..', '...##....##..', '....#....#...', '....#....#...'],
    X: ['###...###', '.##...#..', '..##.#...', '..##.#...', '...##....', '...##....', '...##....', '..#.##...', '..#.##...', '.#...##..', '.#...##..', '###..####'],
    Y: ['###....###', '.##.....#.', '..##...#..', '..##...#..', '...##.#...', '...####...', '....##....', '....##....', '....##....', '....##....', '....##....', '...####...'],
    Z: ['#########', '#.....##.', '.....##..', '.....##..', '....##...', '....##...', '...##....', '...##....', '..##.....', '..##.....', '.##.....#', '#########'],
    "'": ['##', '##', '.#', '#.', '..', '..', '..', '..', '..', '..', '..', '..']
  };
  const DCAP = 12;
  function displayParts(str) {
    return String(str).toUpperCase().split('').map((ch) => {
      if (ch === ' ') return new O.Pix(5, DCAP);
      const rows = DG[ch];
      if (rows) { const m = new O.Pix(rows[0].length, DCAP); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') m.set(x, y, '#'); }); return m; }
      // fallback: the text font at 1x, vertically centred
      const g2 = GL[ch]; const m = new O.Pix(g2 ? g2[0].length : 4, DCAP);
      if (g2) g2.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') m.set(x, y + 3, '#'); });
      return m;
    });
  }
  // Metal type finish shared by every display word: clean horizontal tone bands, a 1px specular edge on the
  // upper-left of each stroke, a darker bevel on the lower-right, an extruded base, a plum outline and a soft halo.
  const FINISH = {
    gold: { bands: ['#fffbe0', '#fff4b0', '#ffe27a', '#ffc840', '#e8a030', '#d88a20', '#8a4a10'], spec: '#ffffff', bevel: '#b86a18', ext: ['#9a5a1a', '#6e3a14', '#4a2410'], halo: '#2a0e20' },
    blood: { bands: ['#fff0e0', '#ffd8c0', '#ffa888', '#ff7a58', '#e0403a', '#b02634', '#5e1428'], spec: '#fff4ec', bevel: '#8a1c2c', ext: ['#6a1a2a', '#4a1026', '#2e0a1c'], halo: '#200410' },
    marble: { bands: ['#ffffff', '#ffffff', '#f1eef5', '#e2dcec', '#d5d0e2', '#b8b0d0', '#6f6a8e'], spec: '#ffffff', bevel: '#9a92b8', ext: ['#6f6a8e', '#4a4468', '#2e2a48'], halo: '#140e24' }
  };
  function finishFace(m, capTop, capH, F) {
    const out = new O.Pix(m.w, m.h), B = F.bands, wide = capH > 16;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!m.get(x, y)) continue;
      const t = (y - capTop) / capH;
      // band layout: bright top, a crisp "horizon" just under the middle, a warm lower half, a dark foot
      let col = t < 0.16 ? B[1] : t < 0.4 ? B[2] : t < 0.5 ? B[3] : t < 0.56 ? B[5] : t < 0.8 ? B[4] : t < 0.92 ? B[3] : B[5];
      const up = !m.get(x, y - 1), lf = !m.get(x - 1, y), dn = !m.get(x, y + 1), rg = !m.get(x + 1, y);
      if (wide) {
        // chiselled 2px bevel: light upper-left facets, dark lower-right facets, clean bands inside
        const up2 = !m.get(x, y - 2), lf2 = !m.get(x - 2, y), dn2 = !m.get(x, y + 2), rg2 = !m.get(x + 1, y + 1) || !m.get(x + 2, y);
        if (up) col = t < 0.55 ? F.spec : B[1];
        else if (lf) col = t < 0.55 ? B[0] : B[2];
        else if (dn) col = B[6];
        else if (rg) col = F.bevel;
        else if (dn2) col = B[5];
        else if (up2 || lf2) col = t < 0.5 ? B[1] : B[2];
        else if (rg2) col = B[4];
        out.set(x, y, col);
        continue;
      }
      if (dn) col = t > 0.5 ? B[6] : F.bevel;
      else if (rg && !up && wide) col = F.bevel;
      if (up || (lf && wide)) col = t < 0.5 ? F.spec : B[1];
      if ((up || lf) && dn) col = B[3];
      out.set(x, y, col);
    }
    return out;
  }
  // Large type: rounded bevel from the distance-field dome (no noise), banded by height, 1px specular top-left.
  function domeFace(m, capTop, capH, F) {
    const ramp = [F.spec, F.bands[1], F.bands[2], F.bands[3], F.bands[4], F.bands[5], F.bands[6]];
    const face = dome(m, ramp, {
      r: 2.2, base: 3, k: 4.2,
      grad: (y) => {
        const t = (y - capTop) / capH;
        if (t < 0.18) return -1.6;
        if (t < 0.42) return -0.8 + (t - 0.18) * 2;
        if (t < 0.5) return 0.8;
        if (t < 0.58) return 1.5;
        return 0.2 - (t - 0.58) * 1.2;
      }
    });
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!m.get(x, y)) continue;
      if (!m.get(x, y + 1)) face.set(x, y, F.bands[5]);
      else if ((!m.get(x, y - 1) || !m.get(x - 1, y)) && (y - capTop) / capH < 0.5) face.set(x, y, F.spec);
    }
    return face;
  }
  function metalWord(parts, kind, o) {
    o = o || {};
    const F = FINISH[kind] || FINISH.gold;
    const capH = parts[0] ? parts[0].h : DCAP;
    const gap = o.gap === undefined ? 1 : o.gap, EX = o.ex || 2, PADL = 3;
    const ww = parts.reduce((a, p) => a + p.w + gap, -gap);
    const w = ww + PADL * 2, h = capH + EX + PADL * 2;
    const m = new O.Pix(w, h);
    let x = PADL;
    const starts = [];
    parts.forEach((p) => { m.blit(p, x, PADL); starts.push(x); x += p.w + gap; });
    const face = o.dome ? domeFace(m, PADL, capH, F) : finishFace(m, PADL, capH, F);
    const out = new O.Pix(w, h);
    for (let e = EX; e >= 1; e--) for (let i = 0; i < m.d.length; i++) {
      if (!m.d[i]) continue;
      out.set(i % w, ((i / w) | 0) + e, F.ext[Math.min(2, Math.floor(((e - 1) / EX) * 3))]);
    }
    out.blit(face, 0, 0);
    const full = pad(out, 2);
    full.selout(OUT);
    const mask = pad(maskOf(m), 2);
    const res = O.makeCanvas(full.w + 4, full.h + 4), rg = res.getContext('2d');
    const fc = full.canvas();
    const sil = O.makeCanvas(full.w, full.h), sg = sil.getContext('2d');
    sg.drawImage(fc, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = F.halo; sg.fillRect(0, 0, full.w, full.h);
    rg.globalAlpha = o.halo === undefined ? 0.35 : o.halo;
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].forEach((d) => rg.drawImage(sil, 2 + d[0], 2 + d[1]));
    rg.globalAlpha = 1;
    rg.drawImage(fc, 2, 2);
    const L = { c: res, mask: mask.canvas(), w: res.width, h: res.height, ox: 2, oy: 2, tops: [] };
    parts.forEach((p, i) => {
      for (let yy = 0; yy < p.h; yy++) {
        let found = -1;
        for (let xx = 0; xx < p.w; xx++) if (p.get(xx, yy)) { found = xx; break; }
        if (found >= 0) { L.tops.push([starts[i] + found + 4 + 1, PADL + yy + 4 + 1]); break; }
      }
    });
    return L;
  }
  const dispCache = {};
  function goldTitle(str, kind) {
    const key = str + '|' + (kind || 'gold');
    if (!dispCache[key]) dispCache[key] = metalWord(displayParts(str), kind || 'gold', { gap: 1, ex: 2 }).c;
    return dispCache[key];
  }
  // Soft light sweep across a metal word (3px band, alpha 0.2 / 0.6 / 0.2, clipped to the letters).
  const shineBufs = {};
  function shine(c, L, x, y, t, period, key) {
    const ph = t % period, sx = ph * 2.2 - 30;
    if (sx > L.w + 30) return;
    let b = shineBufs[key];
    if (!b || b.width !== L.w || b.height !== L.h) b = shineBufs[key] = O.makeCanvas(L.w, L.h);
    const g = b.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, L.w, L.h);
    for (let yy = 0; yy < L.h; yy++) {
      const off = Math.round(sx - yy * 0.5);
      g.fillStyle = 'rgba(255,255,240,0.2)'; g.fillRect(off - 1, yy, 1, 1); g.fillRect(off + 3, yy, 1, 1);
      g.fillStyle = 'rgba(255,255,240,0.45)'; g.fillRect(off, yy, 1, 1); g.fillRect(off + 2, yy, 1, 1);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(off + 1, yy, 1, 1);
    }
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(L.mask, L.ox, L.oy);
    c.drawImage(b, x, y);
  }
  function drawBanner(c, g, name) {
    const b = g.banner;               // 140 -> 0 while shown
    const age = 140 - b;
    const a = Math.min(1, age / 18, b / 22);
    if (a <= 0) return;
    const T = goldTitle(name);
    const cy = 50;                    // below the HUD
    const slide = Math.round((1 - ease(age / 22)) * 6);
    // soft dithered ribbon behind (fades out at both ends, no hard edges)
    if (!bannerRibbon) {
      bannerRibbon = O.makeCanvas(W, 30);
      const rg = bannerRibbon.getContext('2d');
      for (let y = 0; y < 30; y++) for (let x = 0; x < W; x++) {
        const v = Math.sin((y / 29) * Math.PI) * Math.min(1, Math.sin((x / (W - 1)) * Math.PI) * 1.6) * 0.62;
        const q = Math.floor(v * 6 + O.bayer(x, y) * 0.99) / 6;
        if (q > 0) { rg.fillStyle = 'rgba(14,8,30,' + q.toFixed(3) + ')'; rg.fillRect(x, y, 1, 1); }
      }
    }
    c.globalAlpha = a;
    c.drawImage(bannerRibbon, 0, cy - 15);
    const x = Math.round((W - T.width) / 2), ty = cy - 10 - slide;
    c.drawImage(T, x, ty);
    const rw = Math.max(0, Math.min(Math.round(56 * ease(age / 30)), x - 44));
    const ry = ty + 9;
    rule(c, x - 26 - rw, ry, rw); rule(c, x + T.width + 26, ry, rw);
    c.drawImage(STUD_S, x - 29 - rw, ry - 1); c.drawImage(STUD_S, x + T.width + 26 + rw, ry - 1);
    laurels(c, W / 2, ty + 13, T.width / 2 - 7, 'L', 3);
    c.globalAlpha = 1;
  }
  let bannerRibbon = null;
  // Soft dark ribbon made of quantised, ordered-dithered alpha (no smooth blur edges): fades out at both ends.
  const ribbonCache = {};
  function ribbon(w, h, a) {
    const k = w + 'x' + h + ':' + a;
    if (ribbonCache[k]) return ribbonCache[k];
    const cv = O.makeCanvas(w, h), g = cv.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = Math.pow(Math.sin(((y + 0.5) / h) * Math.PI), 0.7) * Math.min(1, Math.sin(((x + 0.5) / w) * Math.PI) * 1.8) * a;
      const q = Math.floor(v * 6 + O.bayer(x, y) * 0.99) / 6;
      if (q > 0) { g.fillStyle = 'rgba(14,8,30,' + q.toFixed(3) + ')'; g.fillRect(x, y, 1, 1); }
    }
    ribbonCache[k] = cv;
    return cv;
  }
  const bossTrack = { hp: null, ghost: 0, t: 0, ref: null, shown: 0 };
  function drawBossBar(c, g, boss) {
    if (bossTrack.ref !== boss) { bossTrack.ref = boss; bossTrack.hp = boss.hp; bossTrack.ghost = boss.hp; bossTrack.shown = 0; }
    if (boss.hp < bossTrack.hp) { bossTrack.ghost = Math.max(bossTrack.ghost, bossTrack.hp); bossTrack.t = 24; }
    bossTrack.hp = boss.hp;
    if (bossTrack.t > 0) bossTrack.t--; else if (bossTrack.ghost > boss.hp) bossTrack.ghost = Math.max(boss.hp, bossTrack.ghost - 0.08);
    bossTrack.shown = Math.min(1, bossTrack.shown + 0.03);
    const k = ease(bossTrack.shown);
    const bw = 220, x = Math.round((W - bw) / 2), y = H - 20 + Math.round((1 - k) * 24);
    // name
    rt(c, 'THE ERYMANTHIAN BOAR', W / 2, y - 11, '#ffd0b0', { al: 'c', ol: OUT, tr: 1 });
    laurels(c, W / 2, y - 7, textWidth('THE ERYMANTHIAN BOAR', 1, 1) / 2, 'S', 4);
    // frame
    box(c, x - 1, y, bw + 2, 10, OUT); box(c, x, y - 1, bw, 12, OUT);
    box(c, x, y, bw, 10, GOLD[2]); hl(c, x, y, bw, GOLD[0]); hl(c, x, y + 9, bw, GOLD[3]);
    box(c, x + 2, y + 2, bw - 4, 6, OUT);
    const iw = bw - 6, ix = x + 3, iy = y + 3, bh = 4;
    for (let r = 0; r < bh; r++) hl(c, ix, iy + r, iw, r === 0 ? '#4a2440' : '#2a1428');
    const f = Math.max(0, boss.hp) / boss.maxHp, gf = Math.max(0, bossTrack.ghost) / boss.maxHp;
    const fw = Math.round(iw * f), gw = Math.round(iw * gf);
    if (gw > fw) box(c, ix + fw, iy, gw - fw, bh, '#fff0c0');
    const ramp = ['#ffd0a0', '#ff6a3a', '#d8303a', '#8e1a34'];
    for (let r = 0; r < bh; r++) hl(c, ix, iy + r, fw, ramp[r]);
    for (let i = 1; i < 8; i++) vl(c, ix + Math.round((iw * i) / 8), iy, bh, 'rgba(27,20,38,0.45)');
    c.drawImage(STUD, x - 6, y + 2); c.drawImage(STUD, x + bw - 1, y + 2);
  }

  /* =====================================================================
     DISPLAY LOGO — Roman capitals, bevelled gold with extrusion and shine
     ===================================================================== */
  const LH = 28;
  function serif(m, x0, x1, top) {
    const y = top ? 0 : LH - 2;
    m.rect(x0 - 2, y, x1 - x0 + 5, 2, '#');
    m.set(x0 - 1, top ? 2 : LH - 3, '#'); m.set(x1 + 1, top ? 2 : LH - 3, '#');
  }
  function ringM(m, cx, cy, rxo, ryo, rxi, ryi, keep) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const px = x + 0.5, py = y + 0.5;
      const o = ((px - cx) / rxo) ** 2 + ((py - cy) / ryo) ** 2 <= 1;
      if (!o) continue;
      const i = ((px - cx) / rxi) ** 2 + ((py - cy) / ryi) ** 2 <= 1;
      if (i) continue;
      if (keep && !keep(x, y)) continue;
      m.set(x, y, '#');
    }
  }
  const LETTERS = {
    O() { const m = new O.Pix(27, LH); ringM(m, 13.5, 14, 13.5, 14, 7, 10.8); return m; },
    R() {
      const m = new O.Pix(26, LH);
      m.rect(3, 0, 6, LH, '#'); serif(m, 3, 8, true); serif(m, 3, 8, false);
      m.rect(3, 0, 11, 3, '#'); m.rect(3, 13, 10, 3, '#');
      ringM(m, 12, 8, 10, 8, 5, 5, (x) => x >= 9);
      m.poly([[10, 14], [16, 14], [23, LH - 1], [17, LH - 1]], '#');
      m.rect(16, LH - 2, 10, 2, '#');
      return m;
    },
    P() {
      const m = new O.Pix(24, LH);
      m.rect(3, 0, 6, LH, '#'); serif(m, 3, 8, true); serif(m, 3, 8, false);
      m.rect(3, 0, 11, 3, '#'); m.rect(3, 14, 10, 3, '#');
      ringM(m, 12, 8.5, 10, 8.5, 5, 5.5, (x) => x >= 9);
      return m;
    },
    H() {
      const m = new O.Pix(29, LH);
      m.rect(3, 0, 6, LH, '#'); m.rect(20, 0, 6, LH, '#');
      serif(m, 3, 8, true); serif(m, 3, 8, false); serif(m, 20, 25, true); serif(m, 20, 25, false);
      m.rect(9, 12, 11, 3, '#');
      return m;
    },
    E() {
      const m = new O.Pix(23, LH);
      m.rect(3, 0, 6, LH, '#');
      m.rect(1, 0, 20, 3, '#'); m.rect(19, 0, 2, 7, '#'); m.set(18, 3, '#');
      m.rect(9, 12, 9, 3, '#'); m.rect(16, 10, 2, 7, '#');
      m.rect(1, LH - 3, 21, 3, '#'); m.rect(20, LH - 8, 2, 8, '#'); m.set(19, LH - 4, '#');
      m.set(2, 3, '#'); m.set(2, LH - 4, '#');
      return m;
    },
    U() {
      const m = new O.Pix(28, LH);
      m.rect(3, 0, 6, 18, '#'); m.rect(21, 0, 3, 18, '#');
      serif(m, 3, 8, true); m.rect(19, 0, 7, 2, '#'); m.set(20, 2, '#'); m.set(24, 2, '#');
      ringM(m, 13.5, 17, 10.5, 11, 5.8, 6.8, (x, y) => y >= 17);
      m.rect(3, 17, 6, 2, '#'); m.rect(21, 17, 3, 2, '#');
      return m;
    },
    S() {
      const m = new O.Pix(23, LH);
      ringM(m, 11.5, 7.5, 9.5, 7.5, 4.8, 4.2, (x, y) => !(x >= 11 && y >= 6));
      ringM(m, 11.5, 20.5, 10, 7.5, 5.2, 4.2, (x, y) => !(x <= 11 && y <= 21));
      m.stroke(5, 10.5, 17.5, 17.5, 2.6, '#');
      m.rect(18, 1, 3, 6, '#');
      m.rect(1, 21, 3, 6, '#');
      return m;
    },
    G() {
      const m = new O.Pix(28, LH);
      ringM(m, 13.5, 14, 13.5, 14, 7, 10.8, (x, y) => !(x >= 18 && y >= 6 && y <= 14));
      m.rect(22, 2, 3, 6, '#');
      m.rect(15, 15, 12, 3, '#'); m.rect(21, 15, 5, 11, '#');
      return m;
    },
    A() {
      const m = new O.Pix(30, LH);
      m.poly([[12, 0], [15, 0], [5, LH], [2, LH]], '#');
      m.poly([[12, 0], [17, 0], [27, LH], [21, LH]], '#');
      m.rect(8, 17, 14, 3, '#');
      m.rect(0, LH - 2, 8, 2, '#'); m.rect(19, LH - 2, 11, 2, '#');
      return m;
    },
    M() {
      const m = new O.Pix(35, LH);
      m.rect(3, 0, 3, LH, '#');
      m.poly([[3, 0], [9, 0], [19, LH], [15, LH]], '#');
      m.poly([[28, 0], [31, 0], [18, LH], [16, LH]], '#');
      m.rect(26, 0, 6, LH, '#');
      m.rect(1, 0, 8, 2, '#'); m.rect(24, 0, 10, 2, '#');
      m.rect(0, LH - 2, 8, 2, '#'); m.rect(24, LH - 2, 10, 2, '#');
      return m;
    },
    V() {
      const m = new O.Pix(29, LH);
      m.poly([[1, 0], [8, 0], [17, LH], [13, LH]], '#');
      m.poly([[23, 0], [26, 0], [16, LH], [14, LH]], '#');
      m.rect(0, 0, 10, 2, '#'); m.rect(21, 0, 8, 2, '#');
      return m;
    },
    ' ': () => new O.Pix(10, LH)
  };
  const logoCache = {};
  // Big metallic word-art (28px Roman capitals). kind: 'gold' | 'blood'
  function logo(word, kind) {
    const key = word + kind;
    if (!logoCache[key]) logoCache[key] = metalWord(word.split('').map((ch) => (LETTERS[ch] ? LETTERS[ch]() : LETTERS[' ']())), kind, { gap: 2, ex: 4 });
    return logoCache[key];
  }
  function drawLogo(c, word, kind, cx, y, t) {
    const L = logo(word, kind);
    const x = Math.round(cx - L.w / 2);
    c.drawImage(L.c, x, y);
    shine(c, L, x, y, t, 300, word);
    // twinkling glints on letter corners
    L.tops.forEach((q, i) => {
      const ph2 = (t + i * 47) % 180;
      if (ph2 < 16) sparkle(c, x + q[0], y + q[1], ph2 < 4 || ph2 > 12 ? 1 : 2, '#fff7b0');
    });
    return L;
  }

  /* =====================================================================
     TITLE KEY ART — sunset over Mount Olympus
     ===================================================================== */
  function hexA(h) { return O.hexToRgb(h); }
  function gradientList(stops, n) {
    // stops: [[t, hex], ...] -> n colours
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      let k = 0;
      while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      const a = stops[k], b = stops[k + 1];
      out.push(O.mix(a[1], b[1], Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])))));
    }
    return out;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const h = (a, b) => O.hash ? (O.hash(a, b, s) % 1000) / 1000 : ((Math.sin(a * 127.1 + b * 311.7 + s * 17.3) * 43758.5453) % 1 + 1) % 1;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
  }
  function fbm(x, y, s) { return vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 3) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 7) * 0.15; }

  const SUN = { x: 150, y: 139, r: 17 };
  const SKY_STOPS = [[0, '#0f0a28'], [0.2, '#24154a'], [0.38, '#46206a'], [0.52, '#7a2c74'], [0.64, '#b24270'], [0.74, '#e0645e'], [0.84, '#f89a5c'], [0.93, '#ffc978'], [1, '#ffe7a8']];
  let TA = null;
  // Quantised, ordered-dithered blend (no soft alpha edges, no rectangles).
  function qmix(a, b, k, x, y, steps) {
    const n = steps || 5;
    const q = Math.floor(Math.max(0, Math.min(1, k)) * n + O.bayer(x, y) * 0.99) / n;
    return q > 0 ? O.mix(a, b, Math.min(1, q)) : a;
  }
  function buildTitleArt() {
    if (TA) return TA;
    const skyCols = gradientList(SKY_STOPS, 48);
    const HOR = 176;
    const skyAt = (x, y) => {
      let i = Math.floor(Math.min(1, Math.max(0, y) / HOR) * 47 + O.bayer(x, y) - 0.25);
      return skyCols[i < 0 ? 0 : i > 47 ? 47 : i];
    };
    const sunGlow = (x, y, R) => { const d = Math.hypot(x - SUN.x, (y - SUN.y) * 1.3); return d < R ? Math.pow(1 - d / R, 2) : 0; };
    /* ---------- sky ---------- */
    const back = new O.Pix(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) back.set(x, y, qmix(skyAt(x, y), '#ffe9b0', sunGlow(x, y, 120) * 0.9, x, y, 6));
    for (let y = SUN.y - SUN.r - 1; y <= SUN.y + SUN.r + 1; y++) for (let x = SUN.x - SUN.r - 1; x <= SUN.x + SUN.r + 1; x++) {
      const d = Math.hypot(x + 0.5 - SUN.x, y + 0.5 - SUN.y);
      if (d <= SUN.r) back.set(x, y, d < SUN.r - 4 ? '#fffbe6' : d < SUN.r - 1.5 ? '#fff0b8' : '#ffe08a');
    }
    // thin tapered cloud streaks across the sun (ends dissolve with dithering)
    [[SUN.y - 6, 70, 1.6], [SUN.y + 1, 90, 2.2], [SUN.y + 7, 60, 1.4]].forEach((s, k) => {
      for (let x = SUN.x - s[1]; x <= SUN.x + s[1]; x++) {
        const u = Math.abs(x - SUN.x) / s[1], th = s[2] * (1 - u * u) + Math.sin(x * 0.11 + k) * 0.5;
        for (let j = 0; j < Math.round(th + 0.3); j++) {
          const y = s[0] + j, base = back.get(x, y);
          if (!base || O.bayer(x, y) < u * u) continue;
          back.set(x, y, O.mix(base, j === 0 ? '#ffd8b0' : '#d0708a', 0.55));
        }
      }
    });
    /* ---------- far range + Mount Olympus (own layer so clouds can drift behind it) ---------- */
    const mass = new O.Pix(W, H);
    const far = (x) => 136 - fbm(x * 0.02, 1, 11) * 26 - Math.max(0, 22 - Math.abs(x - 36) * 0.5) + Math.max(0, 16 - Math.abs(x - SUN.x) * 0.22);
    for (let x = 0; x < W; x++) {
      const top = Math.round(far(x)), slope = far(x + 1) - far(x - 1);
      for (let y = top; y < HOR + 12; y++) {
        // aerial perspective: the range takes the colour of the sky at its height, pushed toward mauve
        let col = O.mix(skyAt(x, y + 12), '#9a4a7a', 0.38);
        col = qmix(col, '#ffb08a', Math.max(0, Math.min(1, slope * 1.5)) * Math.max(0, 1 - (y - top) / 14) * 0.45, x, y, 3);
        if (y - top < 1) col = O.mix(col, '#ffd0a8', 0.55);
        col = qmix(col, '#ffd8a0', sunGlow(x, y, 70) * 0.8, x, y, 4);
        mass.set(x, y, col);
      }
    }
    const peaks = [[318, 80, 1.0], [280, 106, 1.05], [352, 100, 0.95], [236, 124, 1.1], [190, 136, 1.2]];
    const prof = (x) => {
      let best = 999;
      peaks.forEach((p) => { best = Math.min(best, p[1] + Math.abs(x - p[0]) * p[2] * (x < p[0] ? 1.0 : 0.85)); });
      return best + (fbm(x * 0.08, 3, 21) - 0.5) * 7;
    };
    const ridgeOf = (x) => { let bp = peaks[0], bd = 1e9; peaks.forEach((p) => { const v = p[1] + Math.abs(x - p[0]) * p[2]; if (v < bd) { bd = v; bp = p; } }); return bp; };
    for (let x = 150; x < W; x++) {
      const top = Math.round(prof(x));
      for (let y = top; y < HOR + 12; y++) {
        const depth = y - top;
        // the nearest (lowest) peak whose cone contains this pixel owns it -> diagonal valley lines, no seams
        let pk = null;
        peaks.forEach((q) => { if (q[1] + Math.abs(x - q[0]) * q[2] * (x < q[0] ? 1.0 : 0.85) <= y + 2 && (!pk || q[1] > pk[1])) pk = q; });
        if (!pk) pk = ridgeOf(x);
        const split = pk[0] + (y - pk[1]) * 0.28 + (fbm(y * 0.08, pk[0], 13) - 0.5) * 10;
        const lit = x < split;
        const snowLine = pk[1] + (pk === peaks[0] ? 34 : 18) + Math.sin(x * 0.42 + fbm(x * 0.1, 0, 3) * 6) * 5 + fbm(x * 0.2, y * 0.05, 5) * 8;
        const n = fbm(x * 0.14, y * 0.14, 9);
        let col;
        if (y < snowLine) {
          col = lit ? (n > 0.64 ? '#fff4ea' : n < 0.34 ? '#f0bcb8' : '#ffdcca') : (n > 0.62 ? '#c9a6d0' : n < 0.36 ? '#8e70ac' : '#a988bf');
          if (depth < 1) col = lit ? '#fff8f0' : '#dcc0e0';
          if (Math.abs(x - split) < 1) col = lit ? '#fff8f0' : col;
        } else {
          col = lit ? (n > 0.62 ? '#b25a82' : n < 0.36 ? '#7c3c72' : '#984a7c') : (n > 0.6 ? '#6a3e78' : n < 0.36 ? '#48285e' : '#56326c');
          if (y - snowLine < 2 && O.bayer(x, y) < 0.5) col = lit ? '#e8a8b0' : '#7a5c9a';
        }
        col = qmix(col, '#e8806e', (y - 118) / 80 * 0.6, x, y, 5);
        mass.set(x, y, col);
      }
    }
    // summit temple
    const tx = 318, ty = Math.round(prof(318)) + 1;
    for (let i = -6; i <= 6; i++) mass.set(tx + i, ty - 8, GOLD[2]);
    for (let i = -5; i <= 5; i++) mass.set(tx + i, ty - 9, GOLD[1]);
    for (let i = -3; i <= 3; i++) mass.set(tx + i, ty - 10, GOLD[0]);
    mass.set(tx, ty - 11, GOLD[0]);
    for (let cx = tx - 5; cx <= tx + 5; cx += 2) for (let yy = ty - 7; yy <= ty - 2; yy++) mass.set(cx, yy, cx < tx ? GOLD[0] : GOLD[2]);
    for (let i = -6; i <= 6; i++) { mass.set(tx + i, ty - 1, GOLD[3]); mass.set(tx + i, ty, GOLD[1]); }

    /* ---------- mid hills with cypress rows ---------- */
    const mid = new O.Pix(W, H);
    const hill = (x) => 170 - fbm(x * 0.018, 7, 31) * 20 - Math.sin(x * 0.011 + 1) * 6;
    for (let x = 0; x < W; x++) {
      const top = Math.round(hill(x)), sl = hill(x + 1) - hill(x - 1);
      for (let y = top; y < H; y++) {
        let col = y - top < 1 ? '#d06a7e' : sl > 0.2 && y - top < 5 ? '#6e3468' : '#4a2458';
        col = qmix(col, '#3a1c4a', (y - top - 8) / 22, x, y, 3);
        mid.set(x, y, col);
      }
    }
    const R = O.rng(77);
    for (let i = 0; i < 26; i++) {
      const x = Math.round(150 + R() * 234), base = Math.round(hill(x)) + 2, hh = 8 + Math.round(R() * 10);
      for (let y = 0; y < hh; y++) {
        const wdt = Math.max(0, Math.round(Math.sin((y / hh) * Math.PI * 0.9 + 0.2) * 2.2));
        for (let k = -wdt; k <= wdt; k++) mid.set(x + k, base - y, k === -wdt && y > 1 ? '#9a4a6e' : '#2e1640');
      }
    }
    for (let i = 0; i < 9; i++) { const x = Math.round(200 + R() * 170), y = Math.round(hill(x)) + 4 + Math.round(R() * 6); mid.set(x, y, '#ffd27a'); }

    /* ---------- foreground: cliff with strata, olive tree, ruins ---------- */
    const front = new O.Pix(W, H);
    const cliff = (x) => {
      if (x < 128) return 172 + Math.round(Math.sin(x * 0.09) * 1.5 + (x > 110 ? (x - 110) * 0.35 : 0));
      return 172 + (x - 110) * 0.35 + (x - 128) * (x - 128) * 0.06;
    };
    const ROCK = ['#ffb088', '#e0786a', '#a84a5e', '#6a2c56', '#442048', '#2e1638', '#221230'];
    for (let x = 0; x < 178; x++) {
      const top = Math.round(cliff(x));
      const face = x > 118;                                   // the sun-facing drop of the cliff
      for (let y = top; y < H; y++) {
        const d = y - top;
        let col = ROCK[6];
        // strata: three gently tilted bands, each with a lit upper lip
        const sy = y + x * 0.12 + Math.sin(x * 0.05) * 2;
        const band = ((sy - 176) % 13 + 13) % 13;
        if (d > 3) col = band < 1 ? ROCK[4] : band < 2 ? ROCK[5] : ROCK[6];
        if (d > 3 && band >= 2 && band < 4 && O.bayer(x, y) < 0.35) col = ROCK[5];
        if (d < 1) col = ROCK[0];
        else if (d < 2) col = ROCK[1];
        else if (d < 4) col = ROCK[3];
        // the sunlit face of the cliff edge
        if (face) {
          const edge = x - (118 + d * 1.6);
          if (edge > -3 && d < 30) col = edge > -1 ? ROCK[2] : edge > -2 ? ROCK[3] : col;
        }
        front.set(x, y, col);
      }
    }
    // grass tufts on the cliff top (rim-lit)
    for (let x = 2; x < 140; x += 3 + (x % 5 === 0 ? 2 : 0)) {
      const top = Math.round(cliff(x)), hgt = 2 + ((x * 7) % 4);
      for (let k = 0; k < hgt; k++) front.set(x + (k > 1 ? ((x % 2) ? 1 : -1) : 0), top - k, k === hgt - 1 ? '#ffb088' : k === hgt - 2 ? '#a84a5e' : '#2a1438');
    }
    // olive tree: gnarled trunk, 2-tone canopy clusters with a warm rim on the sun side (right)
    const trunk = [[14, 176], [16, 160], [12, 148], [18, 136], [24, 124]];
    for (let i = 0; i < trunk.length - 1; i++) front.stroke(trunk[i][0], trunk[i][1], trunk[i + 1][0], trunk[i + 1][1], 2.6 - i * 0.4, '#1e1030');
    front.stroke(16, 150, 34, 138, 1.4, '#1e1030');
    front.stroke(12, 146, 2, 132, 1.3, '#1e1030');
    for (let i = 0; i < trunk.length - 1; i++) front.line(trunk[i][0] + 2, trunk[i][1], trunk[i + 1][0] + 2, trunk[i + 1][1], '#6a2c56');
    const blobs = [[24, 116, 18, 9], [6, 124, 12, 7], [40, 128, 14, 6], [30, 104, 12, 7], [-2, 110, 10, 8], [48, 118, 9, 5]];
    const canopy = new O.Pix(W, H);
    blobs.forEach((b, k) => {
      for (let y = b[1] - b[3] - 2; y <= b[1] + b[3] + 2; y++) for (let x = b[0] - b[2] - 2; x <= b[0] + b[2] + 2; x++) {
        const dx = (x + 0.5 - b[0]) / b[2], dy = (y + 0.5 - b[1]) / b[3];
        const dd = dx * dx + dy * dy + (fbm(x * 0.45, y * 0.45, 40 + k) - 0.5) * 0.7;
        if (dd > 1 || x < 0) continue;
        // two tones: shadowed underside, cooler body; the upper-right rim catches the sunset
        let col = dy > 0.25 ? '#1e1030' : '#2e1a44';
        if (dy < -0.1 && dx > 0.1 && dd > 0.62) col = '#6a3056';
        if (dy < -0.25 && dx > 0.3 && dd > 0.8) col = '#c86a5a';
        if (dy < -0.5 && dx > 0.45 && dd > 0.9) col = '#f0a070';
        canopy.set(x, y, col);
      }
    });
    front.blit(canopy, 0, 0);
    // leaf flecks along the canopy edge
    const LR = O.rng(5);
    for (let i = 0; i < 70; i++) {
      const b = blobs[Math.floor(LR() * blobs.length)], a = LR() * Math.PI * 2;
      const x = Math.round(b[0] + Math.cos(a) * (b[2] + 1)), y = Math.round(b[1] + Math.sin(a) * (b[3] + 1));
      if (x < 0 || front.get(x, y)) continue;
      front.set(x, y, Math.cos(a) > 0.3 && Math.sin(a) < 0 ? '#c86a5a' : '#2e1a44');
    }
    // ruins (right): fluted broken columns, rim-lit on the sun side (left)
    const col3 = (x0, top, wdt, cap) => {
      for (let y = top; y < H; y++) {
        for (let x = x0; x < x0 + wdt; x++) {
          const k = x - x0;
          let c = k === 0 ? '#f09a80' : k === 1 ? '#b0506a' : k === 2 ? '#6a3058' : (k % 3 === 0 ? '#241232' : k % 3 === 1 ? '#3e2050' : '#34193f');
          if ((y - top) % 17 === 16) c = k <= 1 ? '#8a3c62' : '#1e1030';
          front.set(x, y, c);
        }
      }
      if (cap) {
        // Doric capital: echinus + abacus
        for (let x = x0 - 3; x < x0 + wdt + 3; x++) for (let y = top - 6; y < top - 2; y++) front.set(x, y, y === top - 6 ? '#ffb090' : x < x0 - 1 ? '#c0607a' : y === top - 3 ? '#1e1030' : '#3e2050');
        for (let x = x0 - 1; x < x0 + wdt + 1; x++) for (let y = top - 2; y < top; y++) front.set(x, y, x < x0 + 1 ? '#e88a78' : y === top - 1 ? '#1e1030' : '#5a2a58');
      } else {
        for (let x = x0; x < x0 + wdt; x++) {
          const jag = Math.round(Math.abs(Math.sin(x * 1.7)) * 4 + (x - x0) * 0.3);
          for (let y = top - 1; y < top + jag; y++) front.set(x, y, null);
          front.set(x, top + jag, x < x0 + 3 ? '#ffb090' : '#8a3c62');
        }
      }
    };
    col3(350, 140, 13, true);
    col3(368, 168, 12, false);
    for (let y = 202; y < 211; y++) for (let x = 318; x < 344; x++) {
      const d = y - 202;
      front.set(x, y, d === 0 ? '#f09a80' : x < 321 ? '#b0506a' : (x % 3 === 0 ? '#241232' : '#34193f'));
    }
    for (let x = 310; x < 318; x++) for (let y = 206; y < 211; y++) front.set(x, y, y === 206 ? '#e88a78' : '#2e1638');
    for (let x = 296; x < W; x++) for (let y = 210; y < H; y++) front.set(x, y, y === 210 ? '#b0506a' : '#1e1030');
    front.selout('#120a1e');

    TA = { back: back.canvas(), mass: mass.canvas(), mid: mid.canvas(), front: front.canvas() };
    TA.cloudsHigh = cumulusBand(768, 40, 3, [[30, 34, 64, 1], [196, 30, 44, 0.7], [330, 36, 80, 1.1], [520, 32, 52, 0.8], [640, 36, 70, 1]]);
    TA.cloudsLow = cumulusBand(768, 16, 8, [[40, 14, 40, 0.35], [300, 13, 30, 0.3], [520, 14, 46, 0.35]]);
    const st = O.rng(9);
    TA.stars = [];
    for (let i = 0; i < 70; i++) TA.stars.push([Math.round(st() * W), Math.round(Math.pow(st(), 1.6) * 90), st() * 6.28, st() < 0.15]);
    return TA;
  }
  // Sunset cumulus clusters on a transparent, horizontally tiling strip. Each puff is shaded on its own
  // (lit crown, warm body, violet underside) so the clusters read as stacked round volumes; flat violet bases.
  function cumulusBand(w, h, seed, list) {
    const R = O.rng(seed);
    const id = new Int16Array(w * h).fill(-1);
    const puffs = [];
    list.forEach((cl) => {
      const cx = cl[0], base = cl[1], len = cl[2], big = cl[3] || 1;
      const n = 3 + Math.floor(len / 18);
      const row = [];
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n, hump = Math.sin(u * Math.PI);
        const r = (3.5 + hump * 7 * big) * (0.75 + R() * 0.5);
        row.push({ x: cx + u * len + (R() - 0.5) * 4, y: base - r * 0.7 - hump * 5 * big, r, base });
      }
      // back row (higher, drawn first) then a lower front row of smaller puffs
      row.sort((a, b) => a.y - b.y).forEach((p) => puffs.push(p));
      for (let k = 0; k < n - 1; k++) {
        const u = (k + 1) / n, r = (3 + Math.sin(u * Math.PI) * 4) * (0.8 + R() * 0.4);
        puffs.push({ x: cx + u * len + (R() - 0.5) * 6, y: base - r * 0.45, r, base });
      }
    });
    puffs.forEach((p, i) => {
      const rx = p.r * 1.25, ry = p.r;
      for (let y = Math.floor(p.y - ry); y <= Math.min(p.base, Math.ceil(p.y + ry)); y++) for (let x = Math.floor(p.x - rx); x <= Math.ceil(p.x + rx); x++) {
        if (y < 0 || y >= h) continue;
        const dx = (x + 0.5 - p.x) / rx, dy = (y + 0.5 - p.y) / ry;
        if (dx * dx + dy * dy <= 1) id[y * w + (((x % w) + w) % w)] = i;
      }
    });
    const out = new O.Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = id[y * w + x];
      if (i < 0) continue;
      const p = puffs[i];
      let px = p.x; while (px - x > w / 2) px -= w; while (x - px > w / 2) px += w;
      const nx = (x + 0.5 - px) / (p.r * 1.25), ny = (y + 0.5 - p.y) / p.r;
      const up = y > 0 ? id[(y - 1) * w + x] : -1;
      const lit = -ny * 0.85 - nx * 0.25 + (O.bayer(x, y) - 0.5) * 0.18;
      let col = lit > 0.72 ? '#fff0d0' : lit > 0.42 ? '#ffd0a0' : lit > 0.08 ? '#f0a090' : lit > -0.35 ? '#c47890' : '#9a5a8a';
      if (up < 0 && lit > 0.2) col = '#fff4dc';
      else if (up >= 0 && up !== i && puffs[up].y < p.y && ny < -0.6) col = '#ffe0b8';   // crown of a front puff
      if (y >= p.base - 1) col = y === p.base ? '#6a3e7e' : '#7a4a8a';
      out.set(x, y, col);
    }
    return out.canvas();
  }
  // Music notes: hand-authored gold glyphs (5x8 eighth note, 8x8 beamed pair) with a plum sel-out on the exterior.
  const NOTE_MAPS = [
    ['..ab.', '..a.b', '..a.b', '..a..', '..a..', '.ab..', 'abb..', '.bc..'],
    ['..aaaaaa', '..abbbbb', '..a....a', '..a....a', '..a....a', '.ab...ab', 'abb..abb', '.bc...bc']
  ];
  const noteCv = [];
  function noteGlyph(i) {
    if (!noteCv[i]) {
      const p = pad(fromMap(NOTE_MAPS[i], { a: '#fff7b0', b: '#ffe27a', c: '#d8a030' }), 1);
      p.selout(OUT);
      noteCv[i] = p.canvas();
    }
    return noteCv[i];
  }
  // One note centred on (x, y) with a tiny warm glow behind it.
  function note(c, x, y, dbl, a) {
    const g = noteGlyph(dbl ? 1 : 0);
    const al = a === undefined ? 1 : a;
    glowAt(c, x, y, 7, 'rgba(255,220,130,1)', 0.35 * al);
    c.globalAlpha = al;
    c.drawImage(g, Math.round(x - g.width / 2), Math.round(y - g.height / 2));
    c.globalAlpha = 1;
  }
  // Notes rising and drifting from (x, y) (the lyre), fading in and out.
  function notes(c, x, y, t, n, spread) {
    const k = spread || 1;
    for (let i = 0; i < n; i++) {
      const tt = (t + i * 53) % 160;
      if (tt > 130) continue;
      const nx = x + tt * 0.32 * k + Math.sin(tt * 0.08 + i) * 4 * k, ny = y - tt * 0.42 * k;
      const a = tt < 12 ? tt / 12 : tt > 100 ? (130 - tt) / 30 : 1;
      note(c, nx, ny, i % 2, Math.max(0, a));
    }
  }
  function motes(c, t, n, x0, x1, y0, y1, col) {
    for (let i = 0; i < n; i++) {
      const sp = 0.15 + ((i * 37) % 10) / 40;
      const span = y1 - y0;
      const yy = y1 - ((t * sp + i * 29) % span);
      const xx = x0 + ((i * 97) % (x1 - x0)) + Math.sin(t * 0.02 + i) * 6;
      const tw = (Math.sin(t * 0.1 + i * 1.7) + 1) / 2;
      const fade = Math.min(1, (y1 - yy) / 20, (yy - y0) / 30);
      if (fade <= 0) continue;
      c.globalAlpha = fade * (0.4 + tw * 0.6);
      c.fillStyle = col || '#ffe9a0';
      c.fillRect(Math.round(xx), Math.round(yy), 1, 1);
      if (tw > 0.85) { c.fillRect(Math.round(xx) - 1, Math.round(yy), 3, 1); c.fillRect(Math.round(xx), Math.round(yy) - 1, 1, 3); }
      c.globalAlpha = 1;
    }
  }
  function birds(c, t) {
    for (let i = 0; i < 3; i++) {
      const x = ((t * (0.22 + i * 0.03) + i * 90) % (W + 60)) - 30, y = 92 + i * 7 + Math.sin(t * 0.03 + i) * 3;
      const up = ((t >> 3) + i) & 1;
      c.fillStyle = '#3a1a4a';
      c.fillRect(Math.round(x), Math.round(y), 1, 1);
      c.fillRect(Math.round(x) - 1, Math.round(y) - up, 1, 1); c.fillRect(Math.round(x) + 1, Math.round(y) - up, 1, 1);
      c.fillRect(Math.round(x) - 2, Math.round(y) - up * 2 + (up ? 0 : 1), 1, 1); c.fillRect(Math.round(x) + 2, Math.round(y) - up * 2 + (up ? 0 : 1), 1, 1);
    }
  }
  function drawKeyArt(c, t, o) {
    o = o || {};
    const A = buildTitleArt();
    c.drawImage(A.back, 0, 0);
    // twinkling stars
    A.stars.forEach((s) => {
      const tw = Math.sin(t * 0.05 + s[2]);
      if (tw < -0.3) return;
      c.fillStyle = s[1] < 40 ? '#ffffff' : '#e8c8ff';
      c.globalAlpha = 0.35 + 0.65 * Math.max(0, tw) * (1 - s[1] / 110);
      c.fillRect(s[0], s[1], 1, 1);
      if (s[3] && tw > 0.8) { c.fillRect(s[0] - 1, s[1], 3, 1); c.fillRect(s[0], s[1] - 1, 1, 3); }
      c.globalAlpha = 1;
    });
    // sun shimmer rays
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.95 + i * 0.28 + Math.sin(t * 0.004 + i) * 0.03;
      c.globalAlpha = 0.03 + 0.02 * Math.sin(t * 0.03 + i * 2);
      c.fillStyle = '#ffb070';
      c.beginPath(); c.moveTo(SUN.x, SUN.y);
      c.lineTo(SUN.x + Math.cos(a - 0.05) * 200, SUN.y + Math.sin(a - 0.05) * 200);
      c.lineTo(SUN.x + Math.cos(a + 0.05) * 200, SUN.y + Math.sin(a + 0.05) * 200);
      c.fill();
    }
    c.restore();
    // high cumulus drifting behind the massif
    const ch = A.cloudsHigh, cl = A.cloudsLow;
    const o0 = Math.floor(t * 0.05) % ch.width, o1 = Math.floor(t * 0.11) % cl.width;
    c.drawImage(ch, -o0, 62); c.drawImage(ch, ch.width - o0, 62);
    c.drawImage(A.mass, 0, 0);
    const gp = t % 200;
    if (gp < 24) sparkle(c, 318, 70, gp < 6 || gp > 18 ? 1 : 3, '#ffffff');
    birds(c, t);
    // low cloud sea wrapping the foot of the mountains
    c.drawImage(cl, -o1, 146); c.drawImage(cl, cl.width - o1, 146);
    c.drawImage(A.mid, 0, 0);
    c.drawImage(A.front, 0, 0);
    motes(c, t, 26, 0, W, 60, 214, '#ffe2a0');
    if (!o.noHero) {
      glowAt(c, 86, 154, 36, 'rgba(255,200,120,1)', 0.2 + 0.04 * Math.sin(t * 0.07));
      const fr = 'hero_lyre_' + ((t >> 4) & 1);
      O.drawA(c, O.SPR[fr] ? fr : 'hero_idle_0', 84, 172);
      notes(c, 96, 146, t, 3);
    }
  }
  // Soft scrim: smooth alpha falloff to nothing at every edge (no box).
  const scrimCache = {};
  function softScrim(w, h, a, col) {
    const k = w + 'x' + h + a + col;
    if (scrimCache[k]) return scrimCache[k];
    const cv = O.makeCanvas(w, h), g = cv.getContext('2d');
    const rgb = O.hexToRgb(col || '#140a24');
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = Math.pow(Math.sin(((y + 0.5) / h) * Math.PI), 0.8) * Math.min(1, Math.sin(((x + 0.5) / w) * Math.PI) * 1.6) * a;
      const i = (y * w + x) * 4;
      img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = Math.round(v * 255);
    }
    g.putImageData(img, 0, 0);
    scrimCache[k] = cv;
    return cv;
  }
  const GOLDTXT = ['#ffffff', '#fff7b0', '#fff7b0', '#ffd24a', '#ffd24a', '#e39b1d', '#e39b1d', '#e39b1d'];
  function drawTitle(c, g) {
    const t = g.t;
    drawKeyArt(c, t);
    const intro = Math.min(1, t / 40);
    const L = drawLogo(c, 'ORPHEUS', 'gold', W / 2, 10 + Math.round((1 - ease(intro)) * -10), t);
    // subtitle
    const sub = 'SONG OF OLYMPUS', sy = 10 + L.h + 3;
    const sw = textWidth(sub, 1, 2);
    rt(c, sub, W / 2, sy, ['#ffffff', '#ffffff', '#f4eef8', '#e8e0f0', '#d8cce8', '#c8b8dc', '#b8a8d0', '#b8a8d0'], { al: 'c', ol: '#2a1030', tr: 2 });
    const lx = Math.round(W / 2 - sw / 2) - 8, rx = Math.round(W / 2 + sw / 2) + 8;
    rule(c, lx - 28, sy + 3, 28); rule(c, rx, sy + 3, 28);
    c.drawImage(STUD_S, lx - 31, sy + 2); c.drawImage(STUD_S, rx + 28, sy + 2);
    // menu, drawn straight on the scene over a soft scrim
    const mx = 262, my = 160;
    c.drawImage(softScrim(150, 44, 0.55), mx - 75, my - 8);
    if (g.state === 'press') {
      const a = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.08));
      c.globalAlpha = a;
      rt(c, 'PRESS START', mx, my + 10, GOLDTXT, { al: 'c', ol: '#3a1030', sh: '#140a24', tr: 2 });
      c.globalAlpha = 1;
      const pw2 = textWidth('PRESS START', 1, 2) / 2;
      c.drawImage(laurel(16, true), Math.round(mx - pw2 - 26), my + 7); c.drawImage(laurel(16, false), Math.round(mx + pw2 + 6), my + 7);
    } else {
      const opts = ['NEW GAME', 'CONTINUE'];
      opts.forEach((o, i) => {
        const y = my + 3 + i * 16;
        const en = i === 0 || g.hasSave, on = g.sel === i;
        const col = !en ? '#8a7aa0' : on ? GOLDTXT : '#f0e8f8';
        c.globalAlpha = en ? 1 : 0.75;
        rt(c, o, mx, y, col, { al: 'c', ol: '#1b1426', sh: '#1b1426', tr: 1 });
        c.globalAlpha = 1;
        if (on) {
          const hw = Math.round(textWidth(o, 1, 1) / 2);
          const b = Math.round(Math.sin(t * 0.12) * 1.5);
          c.drawImage(laurel(12, true), mx - hw - 22 - b, y - 3); c.drawImage(laurel(12, false), mx + hw + 6 + b, y - 3);
        }
      });
    }
    // controls hint: centred, clear of the ruins on the right
    const hint = 'Z ATTACK   X JUMP   ↑ TALK   ENTER PAUSE';
    const hw2 = textWidth(hint);
    const hx = Math.round(Math.min(W / 2, 288 - hw2 / 2));
    c.globalAlpha = 0.9;
    rt(c, hint, hx, 204, '#e0d0ec', { al: 'c', ol: '#140a24' });
    c.globalAlpha = 1;
  }

  /* =====================================================================
     STORY — cinematic close-up panels. Each page is composed on a 192x108 stage with the game's own
     sprites, tiles, decor and parallax backgrounds, then shown at 2x so the actors fill ~40% of the frame
     with one consistent pixel density. Night / underworld pages multiply-grade their actors and add rim light.
     ===================================================================== */
  const SW = 192, SH = 108, SG = 74;           // stage size and ground line (stage px)
  const stg = {};
  function stageCanvases() {
    if (!stg.s) { stg.s = O.makeCanvas(SW, SH); stg.a = O.makeCanvas(SW, SH); stg.t = O.makeCanvas(SW, SH); stg.r = O.makeCanvas(SW, SH); }
    return stg;
  }
  function clear(cv) { const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height); return g; }
  function bgOf(theme) { try { return O.Tiles.background(theme); } catch (e) { O.logOnce('ui.bg', e); return null; } }
  function skyOf(s, theme, sx, sy) {
    const b = bgOf(theme);
    if (!b) { s.fillStyle = '#20183a'; s.fillRect(0, 0, SW, SH); return; }
    s.drawImage(b.sky, -Math.round(sx), -Math.round(sy));
  }
  function layerOf(s, theme, i, xoff, yoff) {
    const b = bgOf(theme); if (!b || !b.layers || !b.layers[i]) return;
    const L = b.layers[i], lw = L.c.width, o = ((Math.round(xoff) % lw) + lw) % lw;
    for (let x = -o; x < SW; x += lw) s.drawImage(L.c, x, Math.round(yoff + (L.y || 0)));
  }
  function groundOf(s, theme, y, xoff, dark) {
    const o = ((Math.round(xoff) % 16) + 16) % 16;
    try {
      for (let x = -o, i = 0; x < SW; x += 16, i++) {
        const v = (i + Math.floor(xoff / 16)) & 3;
        const tg = O.Tiles.get(theme, 'G', v); if (tg) s.drawImage(tg, x, y);
        for (let yy = y + 16; yy < SH; yy += 16) { const td = O.Tiles.get(theme, dark || 'D', (v + (yy >> 4)) & 3); if (td) s.drawImage(td, x, yy); }
        const tf = !O.Tiles.handlesEdges && O.Tiles.tuft && O.Tiles.tuft(theme, v);
        if (tf) s.drawImage(tf, x, y - 3);
      }
    } catch (e) { O.logOnce('ui.ground', e); }
  }
  function decor(c, type, seed, x, feet) {
    try {
      const d = O.Tiles.decor(type, seed);
      if (d) c.drawImage(d.c, Math.round(x - d.w / 2), Math.round(feet - d.h + 1));
      return d;
    } catch (e) { O.logOnce('ui.decor', e); }
    return null;
  }
  function spr(c, name, x, feet, flip, white, alpha) {
    const nm = O.SPR[name] ? name : name.replace(/_\d+$/, '_0');
    return O.drawA(c, nm, Math.round(x), Math.round(feet), flip, white, alpha);
  }
  // Multiply a transparent layer by a colour, keeping its alpha.
  function multiply(cv, col, a) {
    const S = stageCanvases(), tg = clear(S.t);
    tg.drawImage(cv, 0, 0);
    const g = cv.getContext('2d');
    g.save(); g.globalAlpha = a === undefined ? 1 : a; g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, cv.width, cv.height);
    g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.drawImage(S.t, 0, 0); g.restore();
  }
  // Rim light: the edge pixels of a layer that face the light (dx, dy = direction the light travels).
  function rim(dst, src, dx, dy, col, a, add) {
    const S = stageCanvases(), g = clear(S.r);
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'destination-out'; g.drawImage(src, dx, dy);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, SW, SH);
    g.globalCompositeOperation = 'source-over';
    dst.save(); dst.globalAlpha = a; if (add) dst.globalCompositeOperation = 'lighter'; dst.drawImage(S.r, 0, 0); dst.restore();
  }
  // Flat silhouette of a canvas in one colour (foreground framing elements).
  const silCache = {};
  function silhouetteOf(cv, col, key) {
    const k = key + col;
    if (silCache[k]) return silCache[k];
    const o = O.makeCanvas(cv.width, cv.height), g = o.getContext('2d');
    g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, o.width, o.height);
    silCache[k] = o;
    return o;
  }
  function frameDecor(c, type, seed, x, feet, col, rimCol) {
    try {
      const d = O.Tiles.decor(type, seed); if (!d) return;
      const X = Math.round(x - d.w / 2), Y = Math.round(feet - d.h + 1);
      if (rimCol) c.drawImage(silhouetteOf(d.c, rimCol, type + seed), X + 1, Y);
      c.drawImage(silhouetteOf(d.c, col, type + seed), X, Y);
    } catch (e) { O.logOnce('ui.frame', e); }
  }
  function grade(c, top, bot, a, mode, w, h) {
    const gr = c.createLinearGradient(0, 0, 0, h || H);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = mode || 'soft-light'; c.fillStyle = gr; c.fillRect(0, 0, w || W, h || H); c.restore();
  }
  let vig = null;
  function vignette(c, a) {
    if (!vig) {
      vig = O.makeCanvas(W, H);
      const g = vig.getContext('2d'), img = g.createImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
        const d = Math.sqrt(dx * dx * 0.8 + dy * dy);
        let v = Math.max(0, (d - 0.62) / 0.7);
        v = Math.floor(Math.min(1, v) * 6 + O.bayer(x, y) * 0.99) / 6;
        const i = (y * W + x) * 4;
        img.data[i] = 12; img.data[i + 1] = 6; img.data[i + 2] = 24; img.data[i + 3] = Math.round(v * 200);
      }
      g.putImageData(img, 0, 0);
    }
    c.globalAlpha = a === undefined ? 1 : a; c.drawImage(vig, 0, 0); c.globalAlpha = 1;
  }
  function glowAt(c, x, y, r, col, a) {
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, a); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }
  function petals(c, t, n, col, w, h) {
    const WW = w || W, HH = h || 180;
    for (let i = 0; i < n; i++) {
      const sp = 0.12 + (i % 5) * 0.03;
      const y = ((t * sp + i * 41) % (HH + 10)) - 5;
      const x = (((i * 83) % WW) + Math.sin(t * 0.03 + i) * 6 - y * 0.25 + WW) % WW;
      c.fillStyle = col[i % col.length];
      c.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  function heartFloat(c, x, y, t) {
    const s = O.SPR.heart;
    if (!s) return;
    const bob = Math.round(Math.sin(t * 0.06) * 2);
    c.drawImage(s.n, Math.round(x - s.w / 2), Math.round(y - s.h / 2) + bob);
  }
  function chain(c, x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2);
    for (let i = 0; i <= n; i++) {
      const k = i / n, sag = Math.sin(k * Math.PI) * 4;
      const x = Math.round(x0 + (x1 - x0) * k), y = Math.round(y0 + (y1 - y0) * k + sag);
      c.fillStyle = i % 2 ? '#9a96b8' : '#5a5680'; c.fillRect(x, y, 1, 1);
    }
  }
  // Flower arch for the wedding (stage scale): two vine-wrapped posts and a garland of blossoms.
  let archC = null;
  function flowerArch() {
    if (archC) return archC;
    const p = new O.Pix(44, 50);
    const WOODR = ['#c8905a', '#8a5a34', '#5a3a2a'];
    for (let y = 8; y < 50; y++) { p.set(4, y, WOODR[0]); p.set(5, y, WOODR[1]); p.set(38, y, WOODR[0]); p.set(39, y, WOODR[1]); }
    for (let x = 4; x <= 39; x++) { const yy = Math.round(9 - Math.sin(((x - 4) / 35) * Math.PI) * 7); p.set(x, yy, WOODR[0]); p.set(x, yy + 1, WOODR[2]); }
    const R = O.rng(31), FL = ['#ffffff', '#ffd0e0', '#ff8ab0', '#ffe070'], LV = ['#5a9a4a', '#3a6a3a', '#7ab860'];
    for (let i = 0; i < 90; i++) {
      let x, y;
      if (i < 50) { x = 4 + R() * 35; y = 9 - Math.sin(((x - 4) / 35) * Math.PI) * 7 + (R() - 0.5) * 4; }
      else { const side = R() < 0.5 ? 4.5 : 38.5; x = side + (R() - 0.5) * 3; y = 10 + R() * 34; }
      const X = Math.round(x), Y = Math.round(y);
      if (R() < 0.45) { p.set(X, Y, FL[Math.floor(R() * 4)]); if (R() < 0.5) p.set(X + 1, Y, FL[1]); }
      else p.set(X, Y, LV[Math.floor(R() * 3)]);
    }
    p.selout(OUT);
    archC = p.canvas();
    return archC;
  }
  let daisC = null;
  function dais() {
    if (daisC) return daisC;
    const p = new O.Pix(92, 14);
    const steps = [[14, 78, 0, 5], [7, 85, 5, 4], [0, 92, 9, 5]];
    steps.forEach((st) => {
      for (let y = st[2]; y < st[2] + st[3]; y++) for (let x = st[0]; x < st[1]; x++) {
        const d = y - st[2];
        let col = d === 0 ? '#c86a5a' : d === 1 ? '#6a3450' : '#3a1a34';
        if (d === 0 && (x < st[0] + 6 || x > st[1] - 7)) col = '#ffb070';    // brazier light on the step lips
        if (d === st[3] - 1) col = '#261226';
        if (x === st[0] || x === st[1] - 1) col = '#1e0e1e';
        if (d > 1 && d < st[3] - 1 && (x * 7 + y * 3) % 17 === 0) col = '#4a2240';
        p.set(x, y, col);
      }
    });
    p.selout(OUT);
    daisC = p.canvas();
    return daisC;
  }
  function tallGrass(c, t, x0, x1, base, col, tip, seed) {
    const R = O.rng(seed || 3);
    for (let x = x0; x < x1; x++) {
      if (R() < 0.35) continue;
      const hgt = 3 + Math.floor(R() * 9), sway = Math.sin(t * 0.03 + x * 0.3) * 1.2;
      for (let k = 0; k < hgt; k++) {
        const xx = Math.round(x + (sway * k) / hgt);
        c.fillStyle = k === hgt - 1 && tip ? tip : col;
        c.fillRect(xx, base - k, 1, 1);
      }
    }
  }
  // Actor layer helper: draws actors via fn into the actor canvas, optionally graded + rim lit, then onto the stage.
  function actors(s, fn, o) {
    const S = stageCanvases(), a = clear(S.a);
    fn(a);
    if (o && o.mul) multiply(S.a, o.mul, o.mulA);
    if (o && o.rim) rim(a, S.a, o.rim[0], o.rim[1], o.rim[2], o.rim[3], true);
    if (o && o.rim2) rim(a, S.a, o.rim2[0], o.rim2[1], o.rim2[2], o.rim2[3], true);
    s.drawImage(S.a, 0, 0);
  }
  // Olive bough in near-silhouette for framing a corner (grows right/down from its origin): a tapering branch
  // with hand-drawn lanceolate leaf stamps (lit upper edge) and a few olives. Cached per colour set.
  const LEAVES = {
    dn: ['##......', '.###....', '..####..', '...#####', '.....###'],
    up: ['.....###', '...#####', '..####..', '.###....', '##......'],
    hang: ['#..', '##.', '##.', '.##', '.##', '.##', '..#']
  };
  const boughCache = {};
  function bough(col, rimCol, seed) {
    const k = col + rimCol + seed;
    if (boughCache[k]) return boughCache[k];
    const w = 100, h = 56, m = new O.Pix(w, h), R = O.rng(seed || 7);
    const P = (u) => [u * 62, 2 + Math.pow(u, 1.4) * 20 + Math.sin(u * 4 + seed) * 2];
    for (let i = 0; i <= 168; i++) { const u = i / 168, p = P(u); m.stroke(p[0], p[1], p[0] + 0.5, p[1], u < 0.3 ? 1.5 : u < 0.65 ? 1.1 : 0.7, 'b'); }
    const stamp = (L, x, y) => L.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] === '#') m.set(Math.round(x) + xx, Math.round(y) + yy, 'l'); });
    const olives = [];
    for (let i = 0; i < 20; i++) {
      const u = 0.06 + (i / 20) * 0.94, p = P(u);
      const kind = i % 3 === 0 ? 'hang' : i % 2 ? 'dn' : 'up';
      if (kind === 'dn') { stamp(LEAVES.dn, p[0] - 1, p[1] + 1); if (i % 4 === 1) stamp(LEAVES.up, p[0] + 1, p[1] - 4); }
      else if (kind === 'up') stamp(LEAVES.up, p[0] - 1, p[1] - 5);
      else stamp(LEAVES.hang, p[0] - 1, p[1] + 1);
      if (i % 5 === 3 && R() < 0.9) { rotEllipse(m, p[0] + 3.5, p[1] + 4.5, 1.4, 1.9, 0.2, 'o'); olives.push([Math.round(p[0] + 3), Math.round(p[1] + 3)]); }
    }
    const e = P(1); stamp(LEAVES.dn, e[0] - 1, e[1] - 1);
    const mid = O.mix(col, rimCol, 0.4);
    const out = new O.Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = m.get(x, y); if (!v) continue;
      let c2 = col;
      if (!m.get(x, y - 1)) c2 = rimCol;
      else if (v === 'l' && !m.get(x, y - 2)) c2 = mid;
      out.set(x, y, c2);
    }
    olives.forEach((o) => out.set(o[0], o[1] + 1, O.mix(rimCol, '#ffffff', 0.3)));
    boughCache[k] = out.canvas();
    return boughCache[k];
  }
  // Fluted marble column in near-silhouette (story framing): shaft with flutes, echinus/abacus capital, rim light.
  function columnFrame(s, x, top, w, col, rimCol, broken) {
    const X = Math.round(x);
    for (let y = top; y < SH; y++) for (let k = 0; k < w; k++) {
      let c2 = k % 3 === 2 ? O.mix(col, '#000000', 0.25) : col;
      if (k === 0) c2 = rimCol; else if (k === 1) c2 = O.mix(col, rimCol, 0.45);
      s.fillStyle = c2; s.fillRect(X + k, y, 1, 1);
    }
    if (broken) {
      for (let k = 0; k < w; k++) { const j = Math.round(Math.abs(Math.sin(k * 1.9)) * 3 + k * 0.25); s.clearRect(X + k, top, 1, j); s.fillStyle = k < 3 ? rimCol : O.mix(col, rimCol, 0.3); s.fillRect(X + k, top + j, 1, 1); }
    } else {
      s.fillStyle = col; s.fillRect(X - 3, top - 7, w + 6, 4); s.fillRect(X - 1, top - 3, w + 2, 3);
      s.fillStyle = rimCol; s.fillRect(X - 3, top - 7, w + 6, 1); s.fillRect(X - 3, top - 6, 1, 3); s.fillRect(X - 1, top - 3, 1, 3);
    }
  }
  function drawBough(s, x, y, flip, col, rimCol, t, seed) {
    const b = bough(col, rimCol, seed);
    const sway = Math.round(Math.sin(t * 0.02 + (seed || 0)) * 1.2);
    s.save();
    if (flip) { s.translate(x, y + sway); s.scale(-1, 1); s.drawImage(b, 0, 0); }
    else s.drawImage(b, x, y + sway);
    s.restore();
  }
  // Paint a background group into the actor canvas, grade it, and composite it onto the stage.
  function graded(s, fn, mul, mulA) {
    const S = stageCanvases(), g = clear(S.a);
    fn(g);
    if (mul) multiply(S.a, mul, mulA);
    s.drawImage(S.a, 0, 0);
  }
  const SCENES = {
    // 0 — Orpheus plays on a hill above Arcadia in the warm late-afternoon light, Olympus behind him.
    orpheus(s, t) {
      const pan = t * 0.05;
      skyOf(s, 'village', 64 + pan * 0.05, 4);
      graded(s, (g) => {
        layerOf(g, 'village', 0, 104 + pan * 0.15, -22);
        layerOf(g, 'village', 1, 30 + pan * 0.3, -96);
        layerOf(g, 'village', 2, 60 + pan * 0.4, -100);
      }, '#ffd8b0', 0.8);
      grade(s, '#ffe0a0', '#ff9a50', 0.45, 'soft-light', SW, SH);
      glowAt(s, 66, 22, 70, 'rgba(255,220,150,1)', 0.3);
      groundOf(s, 'village', SG, pan);
      decor(s, 'flowers', 3, 150 - pan, SG); decor(s, 'flowers', 1, 22 - pan, SG);
      actors(s, (a) => {
        glowAt(a, 66, SG - 20, 26, 'rgba(255,220,150,1)', 0.25 + 0.05 * Math.sin(t * 0.05));
        spr(a, 'hero_lyre_' + ((t >> 4) & 1), 66, SG);
      }, { rim: [1, 0, '#fff0c0', 0.55] });
      notes(s, 76, SG - 30, t, 3);
      columnFrame(s, 176 - pan * 0.4, 8, 18, '#2a1a30', '#d89a6a');
      tallGrass(s, t, 0, SW, SH, '#2a1a30', '#8a5a3a', 5);
      motes(s, t, 12, 20, 170, 10, SG, '#fff2b0');
    },
    // 1 — the lovers: a two-shot at sunset, the sun setting between them, olive boughs above.
    lovers(s, t) {
      const pan = t * 0.05;
      skyOf(s, 'forest', 80 + pan * 0.05, 100);
      glowAt(s, 97, 58, 80, 'rgba(255,200,140,1)', 0.55);
      // the setting sun sinking between the two of them (behind the hills)
      for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) { const d = Math.hypot(x + 0.5, y + 0.5); if (d < 12) { s.fillStyle = d < 8 ? '#fffbe6' : d < 10.5 ? '#fff0b8' : '#ffe08a'; s.fillRect(97 + x, 58 + y, 1, 1); } }
      [[52, 30], [60, 44], [49, 22]].forEach((q, i) => { s.fillStyle = i === 1 ? 'rgba(200,100,130,0.55)' : 'rgba(255,200,170,0.55)'; s.fillRect(97 - q[1], q[0], q[1] * 2, 1); });
      graded(s, (g) => {
        layerOf(g, 'village', 1, 120 + pan * 0.3, -100);
        layerOf(g, 'village', 2, 200 + pan * 0.4, -104);
      }, '#c07890', 1);
      graded(s, (g) => groundOf(g, 'village', SG, 200 + pan), '#f0b8a8', 1);
      decor(s, 'flowers', 2, 34 - pan, SG); decor(s, 'flowers', 5, 160 - pan, SG);
      actors(s, (a) => {
        spr(a, 'hero_idle_' + ((t / 12 | 0) % 4), 80, SG);
        spr(a, 'eurydice_idle_' + ((t / 12 | 0) % 4), 114, SG, true);
      }, { mul: '#ffd8d0', mulA: 0.7, rim: [1, 0, '#ffe0b0', 0.8], rim2: [-1, 0, '#ffe0b0', 0.8] });
      heartFloat(s, 97, 22, t);
      drawBough(s, -4 + pan * 0.3, -6, false, '#3a1a38', '#e08a6a', t, 11);
      tallGrass(s, t, 0, SW, SH, '#3a1a38', '#c86a5a', 9);
      petals(s, t, 22, ['#ffd0e0', '#ff8ab0', '#ffffff'], SW, SH);
    },
    // 2 — the wedding at dusk: Orpheus plays under the flower arch; the serpent strikes from the grass.
    serpent(s, t) {
      const pan = t * 0.05;
      skyOf(s, 'forest', 60 + pan * 0.05, 92);
      glowAt(s, 150, 70, 60, 'rgba(255,170,110,1)', 0.3);
      graded(s, (g) => {
        layerOf(g, 'forest', 0, 40 + pan * 0.15, -58);
        layerOf(g, 'forest', 1, 60 + pan * 0.25, -62);
        layerOf(g, 'forest', 2, 90 + pan * 0.35, -64);
      }, '#c8b0e0', 1);
      graded(s, (g) => groundOf(g, 'forest', SG, 80 + pan), '#9890c8', 1);
      const bite = 150, fall = t > bite;
      const sx = Math.max(126, 178 - t * 0.35);
      actors(s, (a) => {
        a.drawImage(flowerArch(), Math.round(12 - pan * 0.4), SG - 49);
        spr(a, 'hero_lyre_' + ((t >> 4) & 1), Math.round(34 - pan * 0.4), SG);
        if (!fall) spr(a, 'eurydice_idle_' + ((t / 12 | 0) % 4), 104, SG);
        else {
          const k = Math.min(1, (t - bite) / 90);
          spr(a, 'eurydice_idle_0', 104, SG, false, t - bite < 12 && ((t >> 1) & 1), Math.max(0, 1 - k));
        }
      }, { mul: '#a8a0e0', rim: [-1, 0, '#ffc098', 0.85], rim2: [0, 1, '#d0d8ff', 0.3] });
      notes(s, 44, SG - 32, t, 2);
      // the serpent, lit a little so it reads in the grass
      actors(s, (a) => {
        const lunge = t > bite - 20 && t < bite + 30;
        spr(a, lunge ? 'snake_lunge_' + ((t >> 3) & 1) : 'snake_move_' + ((t >> 3) & 3), sx, SG + 1, true);
      }, { mul: '#b8c0e0', rim: [-1, 0, '#ffe0a0', 0.9] });
      if (fall) {
        const k = Math.min(1, (t - bite) / 90);
        const gy = SG - Math.min(22, (t - bite) * 0.2);
        glowAt(s, 104, gy - 18, 24, 'rgba(160,220,255,1)', Math.min(0.4, k));
        spr(s, 'eurydice_ghost_' + ((t / 10 | 0) % 4), 104, gy, false, false, Math.min(0.85, k * 1.2) * (0.75 + 0.25 * Math.sin(t * 0.1)));
        if (t - bite < 20) glowAt(s, 108, SG - 4, 18, 'rgba(255,60,60,1)', (20 - (t - bite)) / 30);
      }
      tallGrass(s, t, 150, SW, SG + 2, '#1a1030', '#6a5a8a', 11);
      tallGrass(s, t, 0, SW, SH, '#140a24', '#4a3a60', 13);
      petals(s, t, 16, ['#ffd0e0', '#ffffff'], SW, SH);
      if (fall && t - bite < 40) { s.save(); s.globalCompositeOperation = 'multiply'; s.globalAlpha = (40 - (t - bite)) / 60; s.fillStyle = '#ff3040'; s.fillRect(0, 0, SW, SH); s.restore(); }
      motes(s, t, 8, 10, 180, 20, SG, '#c8fca0');
    },
    // 3 — Tartarus: Hades on his obsidian dais between braziers; Eurydice's soul in chains.
    hades(s, t) {
      const pan = t * 0.05;
      skyOf(s, 'cave', 100, 60);
      graded(s, (g) => {
        layerOf(g, 'cave', 0, 60 + pan * 0.15, -64);
        layerOf(g, 'cave', 1, 30 + pan * 0.3, -84);
      }, '#8a3a3a', 1);
      for (let y = SG + 4; y < SH; y++) { const k = (y - SG - 4) / (SH - SG); s.fillStyle = O.mix('#ff8a3a', '#6a1418', Math.min(1, k * 1.4)); s.fillRect(0, y, SW, 1); }
      for (let x = 0; x < SW; x += 2) { const yy = SG + 4 + Math.round(Math.sin(x * 0.12 + t * 0.05)); s.fillStyle = '#ffe080'; s.fillRect(x, yy, 2, 1); }
      glowAt(s, SW / 2, SH, 90, 'rgba(255,90,30,1)', 0.3);
      s.drawImage(dais(), 50, SG - 10);
      glowAt(s, 96, SG - 36, 40, 'rgba(150,90,255,1)', 0.5 + 0.08 * Math.sin(t * 0.05));
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2 + t * 0.02, r = 16 + (i % 5) * 4 + Math.sin(t * 0.05 + i) * 1.5;
        s.fillStyle = i % 3 ? '#8a60e0' : '#d8c8ff';
        s.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.08 + i);
        s.fillRect(Math.round(96 + Math.cos(a) * r), Math.round(SG - 38 + Math.sin(a) * r * 0.5), 1, 1);
      }
      s.globalAlpha = 1;
      actors(s, (a) => {
        spr(a, 'hades_idle_' + ((t / 12 | 0) % 4), 96, SG - 9);
      }, { rim: [-1, 0, '#ffb070', 0.9], rim2: [1, 0, '#b890ff', 0.9] });
      if (O.drawLightProp) { try { O.drawLightProp(s, 'brazier', 60, SG - 9, t, 0); O.drawLightProp(s, 'brazier', 132, SG - 9, t, 1); } catch (e) { O.logOnce('ui.brazier', e); } }
      const gx = 166, gy = SG - 12 + Math.round(Math.sin(t * 0.05) * 2);
      glowAt(s, gx, gy - 18, 22, 'rgba(140,220,255,1)', 0.35);
      chain(s, gx - 5, gy - 16, gx - 18, SG + 2); chain(s, gx + 4, gy - 16, gx + 18, SG + 2);
      spr(s, 'eurydice_ghost_' + ((t / 10 | 0) % 4), gx, gy, true, false, 0.85);
      s.fillStyle = '#140608';
      for (let x = 0; x < 22; x++) { const hh = Math.round(64 * Math.pow(1 - x / 22, 1.6)); s.fillRect(x, SH - hh, 1, hh); }
      for (let x = 0; x < 16; x++) { const hh = Math.round(44 * Math.pow(1 - x / 16, 1.4)); s.fillRect(SW - 1 - x, SH - hh, 1, hh); }
      s.fillStyle = '#6a2418';
      for (let x = 0; x < 20; x++) { const hh = Math.round(64 * Math.pow(1 - x / 22, 1.6)); s.fillRect(x + 1, SH - hh, 1, 1); }
      motes(s, t, 16, 0, SW, 10, SH, '#ffb060');
    },
    // 4 — the oath: arms raised at night before Olympus rising above a sea of clouds; the temple's light answers.
    oath(s, t) {
      const pan = t * 0.05;
      skyOf(s, 'temple', 150 + pan * 0.05, 70);
      graded(s, (g) => layerOf(g, 'temple', 0, 108 + pan * 0.15, -20), '#b0b4e8', 1);
      const TX = 132, TY = 28;
      glowAt(s, TX, TY, 44, 'rgba(255,230,150,1)', 0.4 + 0.08 * Math.sin(t * 0.05));
      graded(s, (g) => layerOf(g, 'temple', 1, 60 + pan * 0.3, -76), '#8088c8', 1);
      // divine rays pouring from the summit temple down onto the hero
      s.save(); s.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        s.globalAlpha = 0.1 + 0.05 * Math.sin(t * 0.04 + i * 1.3);
        s.fillStyle = i % 2 ? '#ffe6a0' : '#fff4d0';
        s.beginPath(); s.moveTo(TX - 3 + i * 2, TY); s.lineTo(TX - 1 + i * 2, TY); s.lineTo(64 + i * 7, SG); s.lineTo(44 + i * 7, SG); s.fill();
      }
      s.restore();
      graded(s, (g) => groundOf(g, 'village', SG, 420 + pan, 'B'), '#7078b8', 1);
      actors(s, (a) => {
        glowAt(a, 56, SG - 22, 30, 'rgba(255,230,150,1)', 0.3 + 0.06 * Math.sin(t * 0.06));
        spr(a, t > 60 ? 'hero_hold' : 'hero_idle_' + ((t / 12 | 0) % 4), 56, SG);
      }, { mul: '#a8b0f0', mulA: 0.8, rim: [-1, 1, '#ffe8a0', 0.9] });
      tallGrass(s, t, 0, SW, SH, '#0e0a22', '#3a3a7a', 17);
      motes(s, t, 16, 30, 110, 0, SG, '#fff7b0');
      const ph = t % 240;
      if (ph >= 200 && ph < 214) {
        const b = O.SPR.bolt; if (b) s.drawImage(b.n, 158, 4);
        if (ph < 206) { s.fillStyle = 'rgba(255,255,255,0.35)'; s.fillRect(0, 0, SW, SH); }
      }
    }
  };

  let storyCam = { page: -1, t0: 0 };
  function drawStory(c, g) {
    const pg = O.STORY[g.page] || O.STORY[0];
    const t = g.storyT || 0;
    const fn = SCENES[pg.scene] || SCENES.orpheus;
    const S = stageCanvases(), s = clear(S.s);
    try { fn(s, t); } catch (e) { O.logOnce('ui.scene.' + pg.scene, e); }
    s.globalAlpha = 1; s.globalCompositeOperation = 'source-over';
    const sm = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(S.s, 0, 0, SW, SH, 0, 0, W, H);
    c.imageSmoothingEnabled = sm;
    if (storyCam.page !== g.page) { storyCam.page = g.page; storyCam.t0 = g.t; }
    vignette(c, 0.85);
    // subtitle band: a soft dark fade from the bottom, no box
    c.drawImage(storyScrim(), 0, H - 74);
    const lines = O.wrap(pg.text, 50);
    const ly = H - 20 - lines.length * 12;
    // ornament rule above the text
    const rw = 120, rx = Math.round(W / 2 - rw / 2), ry = ly - 8;
    rule(c, rx, ry, 52); rule(c, rx + rw - 52, ry, 52);
    c.drawImage(STUD, W / 2 - 3, ry - 3);
    let left = g.chars | 0;
    const total = pg.text.length;
    lines.forEach((l, i) => {
      const n = Math.max(0, Math.min(l.length, left));
      left -= l.length + 1;
      if (n <= 0) return;
      const shown = l.slice(0, n);
      const lx = Math.round(W / 2 - textWidth(l) / 2);
      rt(c, shown, lx, ly + i * 12, TXT, { ol: '#0e0818', sh: '#0e0818' });
      if (n < l.length) { const last = shown[shown.length - 1]; freshGlyph(c, last, lx + textWidth(shown) - textWidth(last), ly + i * 12); }
    });
    // page pips + continue chevron on one line at the bottom
    const n = O.STORY.length, cx = W / 2 - (n - 1) * 6;
    for (let i = 0; i < n; i++) {
      const x = cx + i * 12, y = H - 8;
      if (i === g.page) c.drawImage(STUD, x - 3, y - 3);
      else { box(c, x - 2, y - 2, 5, 5, OUT); box(c, x - 1, y - 1, 3, 3, i < g.page ? GOLD[2] : '#8a7aa8'); box(c, x - 1, y - 1, 1, 1, i < g.page ? GOLD[0] : '#b8a8d8'); }
    }
    if (g.chars >= total) chevron(c, W - 26, H - 12 + Math.round(Math.sin(g.t * 0.15) * 1.5));
    // skip hint (top-right, on its own soft backing)
    c.drawImage(softScrim(86, 20, 0.7), W - 90, 1);
    const kw = textWidth('START');
    keycap(c, W - 80, 6, kw + 6);
    rt(c, 'START', W - 77, 7, '#2a1a3a');
    rt(c, 'SKIP', W - 80 + kw + 12, 7, '#f0e8f8', { ol: '#0e0818' });
  }
  function keycap(c, x, y, w) {
    box(c, x + 1, y - 1, w - 2, 11, OUT); box(c, x, y, w, 9, OUT);
    box(c, x + 1, y, w - 2, 9, MARBLE[1]); hl(c, x + 1, y, w - 2, '#ffffff'); hl(c, x + 1, y + 8, w - 2, MARBLE[3]);
  }
  let stScrim = null;
  function storyScrim() {
    if (stScrim) return stScrim;
    stScrim = O.makeCanvas(W, 74);
    const g = stScrim.getContext('2d'), img = g.createImageData(W, 74);
    for (let y = 0; y < 74; y++) for (let x = 0; x < W; x++) {
      const v = Math.pow(y / 73, 0.7) * 0.9;
      const i = (y * W + x) * 4;
      img.data[i] = 14; img.data[i + 1] = 8; img.data[i + 2] = 26; img.data[i + 3] = Math.round(v * 255);
    }
    g.putImageData(img, 0, 0);
    return stScrim;
  }

  /* =====================================================================
     PAUSE / STATUS
     ===================================================================== */
  const ITEM_LIST = [['club', 'icon_club', 'WOODEN CLUB'], ['sandals', 'icon_sandals', 'WINGED SANDALS']];
  function drawPause(c, g) {
    const st = g.st, t = g.t;
    c.fillStyle = 'rgba(12,6,28,0.62)'; c.fillRect(0, 0, W, H);
    vignette(c, 1);
    const x = 30, y = 24, w = 324, h = 180;
    panel(c, x, y, w, h, { a: 0.95 });
    c.drawImage(keyBand(w - 16, GOLD[2], '#1c1236'), x + 8, y + 8);
    const T = goldTitle('STATUS');
    const tx0 = Math.round(W / 2 - T.width / 2);
    box(c, tx0 - 8, y - 2, T.width + 16, 18, '#1c1236');
    hl(c, tx0 - 8, y - 2, T.width + 16, GOLD[3]);
    c.drawImage(T, tx0, y - 8);
    laurels(c, W / 2, y - 8 + 13, T.width / 2 - 7, 'L', 4);
    // hero column
    portraitFrame(c, x + 14, y + 24, 'portrait_orpheus', t, false);
    plate(c, x + 10, y + 84, 64, 'ORPHEUS');
    rt(c, 'LIFE', x + 12, y + 104, GOLD[1], { sh: OUT });
    rt(c, st.hp + '/' + st.maxHp, x + 72, y + 104, '#ffc0a8', { al: 'r', sh: OUT });
    lifeBarSmall(c, x + 14, y + 114, 56, st.hp / st.maxHp, t);
    // current location
    if (g.lvl && g.lvl.name) {
      rt(c, 'LOCATION', x + 12, y + 130, GOLD[1], { sh: OUT });
      O.wrap(g.lvl.name, 10).slice(0, 2).forEach((l, i) => rt(c, l, x + 12, y + 141 + i * 10, '#e8e0f4', { sh: OUT }));
    }
    // right column
    const rx = x + 92;
    sectionTitle(c, 'TREASURES', rx, y + 26);
    ITEM_LIST.forEach((it, i) => {
      const sx = rx + i * 103, sy = y + 38;
      const has = !!st.items[it[0]];
      slot(c, sx, sy, 20, has);
      const s = O.SPR[it[1]];
      if (s) {
        const img = has ? s.n : emptyItem(it[1]);
        if (img) c.drawImage(img, sx + 10 - (s.w >> 1), sy + 10 - (s.h >> 1));
      }
      rt(c, has ? it[2] : '? ? ?', sx + 25, sy + 7, has ? TXT : '#5a4c78', { sh: OUT });
    });
    sectionTitle(c, 'SUPPLIES', rx, y + 68);
    O.drawSpr(c, 'olive', rx + 2, y + 79);
    rt(c, '×' + st.olives, rx + 17, y + 83, '#e8f0c0', { sh: OUT });
    const s = O.SPR.ambrosia;
    if (s) {
      const ej = emptyJar();
      for (let i = 0; i < 3; i++) c.drawImage(i < st.ambrosia ? s.n : ej, rx + 60 + i * 13, y + 79);
    }
    const canDrink = st.ambrosia > 0 && st.hp < st.maxHp;
    rt(c, 'B  DRINK +8', rx + 106, y + 83, canDrink ? GOLD[0] : '#5a4c78', { sh: OUT });
    if (canDrink && ((t >> 4) & 1)) c.drawImage(STUD_S, rx + 100, y + 84);
    sectionTitle(c, 'QUEST', rx, y + 102);
    box(c, rx, y + 112, 218, 42, 'rgba(10,6,20,0.45)');
    hl(c, rx, y + 112, 218, 'rgba(255,210,74,0.25)');
    O.wrap(O.questHint(st), 32).slice(0, 3).forEach((l, i) => rt(c, l, rx + 6, y + 117 + i * 12, '#e8e0f4', { sh: OUT }));
    // footer
    const fy = y + h - 17;
    const kw = textWidth('START') + 6, rw2 = textWidth('RESUME', 1, 1), tot = kw + 6 + rw2, fx = Math.round(W / 2 - tot / 2);
    keycap(c, fx, fy - 1, kw);
    rt(c, 'START', fx + 3, fy, '#2a1a3a');
    rt(c, 'RESUME', fx + kw + 6, fy, (t >> 5) & 1 ? '#f0e8f8' : '#c8b8dc', { sh: OUT, tr: 1 });
  }
  function sectionTitle(c, label, x, y) {
    rt(c, label, x, y, [GOLD[0], GOLD[0], GOLD[1], GOLD[1], GOLD[1], GOLD[2], GOLD[2], GOLD[2]], { sh: OUT, tr: 1 });
    const w = textWidth(label, 1, 1);
    hl(c, x + w + 5, y + 3, 214 - w - 5, GOLD[3]); hl(c, x + w + 5, y + 4, 214 - w - 5, 'rgba(27,20,38,0.8)');
    c.drawImage(STUD_S, x + 214, y + 2);
  }
  function lifeBarSmall(c, x, y, w, f, t) {
    box(c, x, y, w, 7, OUT); box(c, x + 1, y + 1, w - 2, 5, '#33182e');
    const fw = Math.round((w - 2) * Math.max(0, Math.min(1, f)));
    hl(c, x + 1, y + 1, fw, RED[0]); box(c, x + 1, y + 2, fw, 2, RED[1]); hl(c, x + 1, y + 4, fw, RED[2]); hl(c, x + 1, y + 5, fw, RED[3]);
    hl(c, x, y - 1, w, GOLD[2]); hl(c, x, y + 7, w, GOLD[3]);
  }

  /* =====================================================================
     GAME OVER
     ===================================================================== */
  let goBg = null;
  const GO_G = 150;
  function gameOverBg() {
    if (goBg) return goBg;
    const cols = gradientList([[0, '#07030e'], [0.4, '#1a0716'], [0.75, '#3a0c1e'], [1, '#62162a']], 24);
    const p = new O.Pix(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let i = Math.floor((Math.min(1, y / GO_G)) * 23 + O.bayer(x, y) - 0.3); i = Math.max(0, Math.min(23, i));
      p.set(x, y, cols[i]);
    }
    // a far row of ruined columns (hazy), then the near ruined colonnade
    const column = (x0, top, w, broken, far, n) => {
      const cx = W / 2, facing = x0 + w / 2 < cx ? 1 : -1;     // side that faces the spotlight
      const RIM = far ? '#6a2036' : '#c05050', MID = far ? '#3a1024' : '#5a1c30', SH2 = far ? '#1e0814' : '#3a1a3a', DK = far ? '#16060e' : '#1e0a1a';
      const baseY = GO_G + 2;
      for (let y = top; y < baseY; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const k = x - x0, kk = facing > 0 ? w - 1 - k : k;      // kk = 0 on the lit side
          let col = kk === 0 ? RIM : kk === 1 ? MID : (k % 3 === 1 ? DK : SH2);
          if (!far && kk > 1 && kk < w - 1 && (k % 3) === 0) col = O.mix(SH2, MID, 0.35);     // flute ridges
          if ((y - top) % 16 === 15) col = kk <= 1 ? MID : DK;                                 // drum joints
          p.set(x, y, col);
        }
      }
      if (broken) {
        for (let x = x0; x < x0 + w; x++) {
          const k = x - x0, jag = Math.round(Math.abs(Math.sin(k * 1.7 + n)) * 4 + (facing > 0 ? k : w - k) * 0.35);
          for (let y = top; y < top + jag; y++) p.set(x, y, null);
          const kk = facing > 0 ? w - 1 - k : k;
          p.set(x, top + jag, kk < 3 ? RIM : MID);
          for (let y = top - 1; y < top + jag; y++) p.set(x, y, cols[Math.max(0, Math.min(23, Math.floor((y / GO_G) * 23)))]);
        }
      } else {
        // capital: echinus + abacus
        for (let x = x0 - 2; x < x0 + w + 2; x++) for (let y = top - 3; y < top; y++) p.set(x, y, y === top - 3 ? RIM : ((facing > 0 ? x >= x0 + w : x < x0) ? RIM : SH2));
        for (let x = x0 - 3; x < x0 + w + 3; x++) for (let y = top - 6; y < top - 3; y++) p.set(x, y, y === top - 6 ? RIM : y === top - 4 ? DK : SH2);
      }
      // base (torus)
      for (let x = x0 - 2; x < x0 + w + 2; x++) for (let y = baseY - 3; y < baseY; y++) p.set(x, y, y === baseY - 3 ? RIM : SH2);
    };
    [[26, 104, 7, 1], [92, 118, 6, 0], [276, 110, 7, 1], [318, 96, 6, 0]].forEach((q, n) => column(q[0], q[1], q[2], q[3], true, n));
    [[40, 92, 13, 1], [66, 118, 11, 1], [300, 80, 13, 0], [340, 108, 12, 1]].forEach((q, n) => column(q[0], q[1], q[2], q[3], false, n + 3));
    // rocky ground with a lit lip
    for (let x = 0; x < W; x++) {
      const top = Math.round(GO_G + Math.sin(x * 0.03) * 2 + (fbm(x * 0.1, 1, 3) - 0.5) * 5);
      const near = Math.max(0, 1 - Math.abs(x - W / 2) / 110);
      for (let y = top; y < H; y++) {
        const d = y - top;
        let col = d === 0 ? O.mix('#6a2236', '#c05050', near) : d === 1 ? '#4a1428' : fbm(x * 0.2, y * 0.3, 6) > 0.62 ? '#1e0a14' : '#140610';
        if (d > 1 && d < 5 && O.bayer(x, y) < near * 0.5) col = '#3a1020';
        p.set(x, y, col);
      }
    }
    // fallen drums + rubble + dry grass along the ground line
    const drum = (x0, w, h) => {
      const gy = GO_G + 1;
      for (let y = gy - h; y < gy; y++) for (let x = x0; x < x0 + w; x++) {
        const d = y - (gy - h), dx = x - x0;
        let col = d === 0 ? '#c05050' : d === 1 ? '#7a2a3a' : (dx % 3 === 0 ? '#1e0a1a' : '#3a1a3a');
        if (dx === 0 || dx === w - 1) col = '#240c1c';
        p.set(x, y, col);
      }
      for (let y = gy - h; y < gy; y++) { p.set(x0 + w, y, '#5a1c30'); p.set(x0 + w + 1, y, y === gy - h ? '#c05050' : '#2a0e1e'); }
    };
    drum(110, 18, 8); drum(252, 14, 7);
    const RR = O.rng(21);
    for (let i = 0; i < 40; i++) {
      const x = Math.round(RR() * W), y = GO_G + Math.round(Math.sin(x * 0.03) * 2) - 1, r = RR() < 0.3 ? 2 : 1;
      for (let yy = 0; yy < r; yy++) for (let xx = 0; xx < r + 1; xx++) p.set(x + xx, y - yy, yy === r - 1 ? '#9a3a4a' : '#2a0e1e');
    }
    for (let i = 0; i < 60; i++) {
      const x = Math.round(RR() * W), gy = Math.round(GO_G + Math.sin(x * 0.03) * 2), hh = 2 + Math.floor(RR() * 4);
      for (let k = 0; k < hh; k++) p.set(x + (k > 1 ? (i % 2 ? 1 : -1) : 0), gy - 1 - k, k === hh - 1 ? '#a0504a' : '#3a1420');
    }
    goBg = p.canvas();
    return goBg;
  }
  let goT0 = 0, goLastT = -99;
  function drawGameOver(c, g) {
    const t = g.t;
    if (t - goLastT > 30) goT0 = t;
    goLastT = t;
    const lt = t - goT0;
    c.drawImage(gameOverBg(), 0, 0);
    glowAt(c, W / 2, GO_G - 6, 70, 'rgba(255,90,90,1)', 0.16);
    // drifting ash (cool) and rising embers (warm)
    for (let i = 0; i < 36; i++) {
      const y = ((t * (0.2 + (i % 4) * 0.05) + i * 37) % 230) - 10, x = (i * 71) % W + Math.sin(t * 0.02 + i) * 8;
      c.fillStyle = i % 3 ? '#5a3a4a' : '#a08090'; c.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    for (let i = 0; i < 18; i++) {
      const life = 200 + (i % 5) * 30, tt = (t + i * 53) % life, y = GO_G + 4 - tt * 0.6, x = (i * 97) % W + Math.sin(tt * 0.05 + i) * 6;
      const a = Math.min(1, tt / 20) * Math.max(0, 1 - tt / life);
      c.globalAlpha = a; c.fillStyle = tt < life * 0.4 ? '#ffd080' : tt < life * 0.7 ? '#ff8a40' : '#c03a30';
      c.fillRect(Math.round(x), Math.round(y), 1, 1); c.globalAlpha = 1;
    }
    // a single beam of light on the fallen hero
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.09 + 0.02 * Math.sin(t * 0.05);
    c.fillStyle = '#ffb0a0'; c.beginPath(); c.moveTo(W / 2 - 8, 0); c.lineTo(W / 2 + 12, 0); c.lineTo(W / 2 + 40, GO_G + 2); c.lineTo(W / 2 - 36, GO_G + 2); c.fill();
    c.restore();
    // ghostly Eurydice reaching down
    const ga = 0.22 + 0.12 * Math.sin(t * 0.03);
    spr(c, 'eurydice_ghost_' + ((t / 10 | 0) % 4), W / 2 + 2, GO_G - 34 + Math.round(Math.sin(t * 0.04) * 2), true, false, ga);
    spr(c, 'hero_dead_1', W / 2 - 6, GO_G + 1);
    const lf = O.SPR.lyre;
    if (lf) c.drawImage(lf.n, W / 2 + 18, GO_G + 2 - lf.h);
    vignette(c, 0.8);
    const k = ease(Math.min(1, lt / 50));
    c.globalAlpha = Math.min(1, lt / 30);
    drawLogo(c, 'GAME OVER', 'blood', W / 2, 20 + Math.round((1 - k) * -10), t);
    c.globalAlpha = 1;
    rt(c, 'EURYDICE STILL WAITS...', W / 2, 62, '#e0b8cc', { al: 'c', sh: OUT, tr: 1 });
    // menu
    const opts = ['CONTINUE', 'RETURN TO TITLE'];
    const mx = W / 2, my = 168;
    c.drawImage(softScrim(190, 44, 0.6, '#12040c'), mx - 95, my - 6);
    opts.forEach((o, i) => {
      const y = my + 4 + i * 16, on = g.sel === i;
      rt(c, o, mx, y, on ? ['#ffffff', '#ffe0d0', '#ffe0d0', '#ffb0a0', '#ffb0a0', '#ff7a6a', '#ff7a6a', '#ff7a6a'] : '#c8a8b8', { al: 'c', ol: '#1b0a14', sh: '#1b0a14', tr: 1 });
      if (on) {
        const hw = Math.round(textWidth(o, 1, 1) / 2), b = Math.round(Math.sin(t * 0.12) * 1.5);
        c.drawImage(laurel(12, true), mx - hw - 22 - b, y - 3); c.drawImage(laurel(12, false), mx + hw + 6 + b, y - 3);
      }
    });
  }

  /* =====================================================================
     ENDING
     ===================================================================== */
  function drawEnding(c, g) {
    const t = g.t, e = g.endT || 0;
    drawKeyArt(c, t, { noHero: true });
    // Orpheus, now wearing the winged sandals, gazes toward Olympus; a faint trail of light at his heels
    glowAt(c, 84, 168, 22, 'rgba(200,230,255,1)', 0.25 + 0.05 * Math.sin(t * 0.08));
    spr(c, 'hero_idle_' + ((t / 12 | 0) % 4), 84, 172);
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.6 + i * 9) % 54, x = Math.round(80 - ph * 0.5), y = Math.round(170 - Math.sin((ph / 54) * Math.PI) * 4 - i % 2);
      c.globalAlpha = Math.max(0, 1 - ph / 54) * 0.8;
      c.fillStyle = i % 2 ? '#ffffff' : '#cfe0ff'; c.fillRect(x, y, 1, 1);
      c.globalAlpha = 1;
    }
    // credits written straight onto the evening sky (no panel), above a very soft scrim
    const n = O.ENDING.length, top = 28, lh = 13;
    c.drawImage(softScrim(280, n * lh + 22, 0.45, '#140a24'), W / 2 - 140, top - 12);
    O.ENDING.forEach((l, i) => {
      const k = (e - i * 40) / 24;
      if (k <= 0 || !l.t) return;
      c.globalAlpha = Math.min(1, k);
      const col = l.c === '#f8b800' ? GOLDTXT : l.c === '#80c0fc' ? ['#ffffff', '#e8f6ff', '#d0ecff', '#b8e0ff', '#b8e0ff', '#98ccf0', '#98ccf0', '#98ccf0'] : '#fff8f0';
      rt(c, l.t, W / 2, top + i * lh + Math.round((1 - ease(Math.min(1, k))) * 4), col, { al: 'c', ol: '#1b1426', sh: '#1b1426', tr: 1 });
      c.globalAlpha = 1;
      if (l.c === '#f8b800') {
        const hw = Math.round(textWidth(l.t, 1, 1) / 2);
        c.drawImage(laurel(12, true), W / 2 - hw - 22, top + i * lh - 3); c.drawImage(laurel(12, false), W / 2 + hw + 6, top + i * lh - 3);
      }
    });
    if (e > n * 40 + 60) {
      c.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.08));
      rt(c, 'PRESS START', W / 2, 200, GOLDTXT, { al: 'c', ol: '#3a1030', sh: '#140a24', tr: 2 });
      c.globalAlpha = 1;
    }
  }

  /* =====================================================================
     REGISTRATION
     ===================================================================== */
  O.UI = { drawHUD, drawDialog, drawPause, drawTitle, drawStory, drawGameOver, drawEnding, drawBanner, drawBossBar };
  O.UIKit = { panel, goldFrame, glass, keyBand, laurel, plate, rule, text: rt, textWidth, dome, fromMap, cursor, chevron, sparkle, slot, titleArt: buildTitleArt };

  O.ART_INITS.push(function initUI() {
    const reg = (n, p, a) => O.registerSprite(n, p, a);
    reg('olive', iconOlive());
    reg('ambrosia', iconAmbrosia());
    reg('pom', iconPom());
    reg('heart', iconHeart());
    reg('icon_club', iconClub());
    reg('icon_sandals', iconSandals());
    reg('lyre', iconLyre());
    reg('bolt', iconBolt());
    reg('arrow_up', iconArrowUp());
  });
})(window.OLY);
