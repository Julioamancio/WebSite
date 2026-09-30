/* hdui.js — HD interface: vector HUD, dialogue box, area banner, boss bar, status (pause) screen, game over,
   and vector item icons, drawn in game units under the x5 transform so everything stays sharp at 1080p.
   Fonts: Cinzel (titles, labels, numbers) and Marcellus (running text), both Greek-inscription styles.
   Active only when the HD art loaded (O.HD.on); otherwise ui.js keeps drawing the pixel interface. */
(function (O) {
  'use strict';
  const W = O.W, H = O.H;
  const FD = '"Cinzel", "Trajan Pro", Georgia, serif', FB = '"Marcellus", Georgia, "Times New Roman", serif';
  const SC = () => O.S || 1;
  const on = () => !!(O.HD && O.HD.on);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const INK = 'rgba(8,4,18,0.85)', CREAM = '#f6efe2', DIM = '#9a91b8';

  /* ================= TEXT ================= */
  const GRAD = {
    gold: [[0, '#fffbe6'], [0.32, '#ffe38a'], [0.55, '#f2b53c'], [0.8, '#c47a1c'], [1, '#8a4e10']],
    blood: [[0, '#fff0e6'], [0.3, '#ffb08c'], [0.55, '#ff5a3c'], [0.8, '#b02634'], [1, '#5e1428']],
    silver: [[0, '#ffffff'], [0.4, '#eef0f8'], [0.75, '#b8c0d8'], [1, '#8088a8']]
  };
  function vgrad(c, stops, y0, y1) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([p, col]) => g.addColorStop(p, col));
    return g;
  }
  function setFont(c, size, fam, weight) { c.font = (weight || (fam === FD ? '700' : '400')) + ' ' + size + 'px ' + fam; }
  function measure(c, s, size, fam, weight, track) {
    c.save(); setFont(c, size, fam || FB, weight);
    if (track) c.letterSpacing = track + 'px';
    const w = c.measureText(s).width; c.restore();
    return w;
  }
  // T(c, text, x, y, {size, font, weight, color|'gold'|'blood'|'silver', align, shadow, stroke, strokeW, maxW, alpha, track})
  // y is the vertical middle of the capitals.
  function T(c, s, x, y, o) {
    o = o || {};
    s = String(s);
    const size = o.size || 8, fam = o.font || FB;
    c.save();
    setFont(c, size, fam, o.weight);
    c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic';
    if (o.track) c.letterSpacing = o.track + 'px';
    if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    const by = y + size * 0.33, mw = o.maxW;
    const put = (fn, dx, dy) => (mw ? c[fn](s, x + dx, by + dy, mw) : c[fn](s, x + dx, by + dy));
    if (o.shadow !== false) { c.fillStyle = o.shadow || INK; put('fillText', size * 0.04, size * 0.1); }
    if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.strokeW || size * 0.14; c.strokeStyle = o.stroke; put('strokeText', 0, 0); }
    const col = o.color || CREAM;
    c.fillStyle = GRAD[col] ? vgrad(c, GRAD[col], y - size * 0.4, y + size * 0.36) : col;
    put('fillText', 0, 0);
    const w = c.measureText(s).width;
    c.restore();
    return mw ? Math.min(w, mw) : w;
  }

  // Hook for the rest of ui.js / render.js: the pixel font keeps its layout metrics, the glyphs become vector.
  O.HDFont = function (ctx, str, x, y, color, scale, track, width) {
    if (!on()) return null;
    const s = scale || 1, t = String(str).toUpperCase();
    ctx.save();
    setFont(ctx, 9.8 * s, FB);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (Array.isArray(color)) {
      const g = ctx.createLinearGradient(0, y, 0, y + 8 * s);
      color.forEach((col, i) => g.addColorStop(i / Math.max(1, color.length - 1), col));
      ctx.fillStyle = g;
    } else ctx.fillStyle = color || CREAM;
    const mw = Math.max(1, width * 1.06);
    ctx.fillText(t, x, y + 7 * s, mw);
    ctx.restore();
    return width;
  };

  /* ================= SHAPES ================= */
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  const goldLine = (c, y0, y1) => vgrad(c, [[0, '#fff3b8'], [0.3, '#e8b048'], [0.7, '#b87424'], [1, '#f0c860']], y0, y1);
  function gem(c, x, y, r, kind) {
    c.save();
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath();
    c.fillStyle = kind === 'red' ? vgrad(c, [[0, '#ffc0b0'], [0.5, '#e0403a'], [1, '#6a1026']], y - r, y + r) : vgrad(c, [[0, '#fffbe0'], [0.45, '#f2c050'], [1, '#8a4e10']], y - r, y + r);
    c.fill();
    c.lineWidth = 0.35; c.strokeStyle = 'rgba(40,16,8,0.9)'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.3, r * 0.22, 0, 7); c.fill();
    c.restore();
  }
  function shadowBox(c, blur, dy, a) { c.shadowColor = 'rgba(0,0,0,' + (a || 0.5) + ')'; c.shadowBlur = blur * SC(); c.shadowOffsetY = dy * SC(); }
  function panel(c, x, y, w, h, o) {
    o = o || {};
    const r = o.r === undefined ? 4 : o.r;
    c.save();
    shadowBox(c, 5, 1.5, 0.55);
    rr(c, x, y, w, h, r);
    c.fillStyle = vgrad(c, [[0, 'rgba(44,32,76,' + (o.a || 0.94) + ')'], [1, 'rgba(14,9,30,' + (o.a || 0.94) + ')']], y, y + h);
    c.fill();
    c.shadowColor = 'transparent';
    rr(c, x + 1, y + 1, w - 2, h * 0.45, Math.max(0.5, r - 1));
    c.fillStyle = vgrad(c, [[0, 'rgba(255,255,255,0.09)'], [1, 'rgba(255,255,255,0)']], y, y + h * 0.45); c.fill();
    c.lineWidth = 1.1; c.strokeStyle = goldLine(c, y, y + h); rr(c, x + 0.55, y + 0.55, w - 1.1, h - 1.1, r); c.stroke();
    c.lineWidth = 0.3; c.strokeStyle = 'rgba(240,200,110,0.5)'; rr(c, x + 2.3, y + 2.3, w - 4.6, h - 4.6, Math.max(0.5, r - 1.8)); c.stroke();
    if (o.gems !== false) [[x + 1, y + 1], [x + w - 1, y + 1], [x + 1, y + h - 1], [x + w - 1, y + h - 1]].forEach(([gx, gy]) => gem(c, gx, gy, 2));
    c.restore();
  }
  function slot(c, x, y, s, lit) {
    c.save();
    rr(c, x, y + 1, s, s, 3); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fill(); // cheap drop shadow (runs every frame)
    rr(c, x, y, s, s, 3);
    c.fillStyle = vgrad(c, [[0, lit ? 'rgba(70,52,110,0.92)' : 'rgba(30,22,50,0.8)'], [1, lit ? 'rgba(28,18,52,0.92)' : 'rgba(14,10,26,0.8)']], y, y + s);
    c.fill(); c.shadowColor = 'transparent';
    c.lineWidth = 0.9; c.strokeStyle = lit ? goldLine(c, y, y + s) : 'rgba(170,150,210,0.45)'; rr(c, x + 0.45, y + 0.45, s - 0.9, s - 0.9, 3); c.stroke();
    if (lit) { const g = c.createRadialGradient(x + s / 2, y + s / 2, 1, x + s / 2, y + s / 2, s * 0.6); g.addColorStop(0, 'rgba(255,215,120,0.22)'); g.addColorStop(1, 'rgba(255,215,120,0)'); c.fillStyle = g; c.fillRect(x, y, s, s); }
    c.restore();
  }
  // Draw an HD frame so it fits in a box, centred (used for icons in slots and counters).
  // "Not yet owned" version of an icon: greyed once and cached (a canvas filter every frame costs ~10 fps).
  const dimCache = {};
  function dimOf(name) {
    const e = O.SPR[name];
    if (!e || !e.hd) return e;
    if (dimCache[name] && dimCache[name].src === e) return dimCache[name].f;
    const cv = document.createElement('canvas'); cv.width = e.sw; cv.height = e.sh;
    const g = cv.getContext('2d');
    g.filter = 'grayscale(1) brightness(0.55)';
    g.drawImage(e.img, e.sx, 0, e.sw, e.sh, 0, 0, e.sw, e.sh);
    const f = O.HD.makeFrame(cv, e.sw, e.sh, e.ax / e.k, e.ay / e.k, e.k);
    dimCache[name] = { src: e, f };
    return f;
  }
  function iconIn(c, name, cx, cy, size, dim) {
    const e = dim ? dimOf(name) : O.SPR[name];
    if (!e) return;
    const k = size / Math.max(e.w, e.h);
    c.save();
    if (dim) c.globalAlpha *= 0.45;
    c.translate(cx - (e.w / 2 - e.ax) * k, cy - (e.h / 2 - e.ay) * k); c.scale(k, k);
    if (e.hd) O.HD.drawFrame(c, e, 0, 0, false, false); else c.drawImage(e.n, -e.ax, -e.ay);
    c.restore();
  }

  /* ================= VECTOR ICONS ================= */
  function lin(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); }
  function hi(c, x, y, rx, ry, a) { c.fillStyle = 'rgba(255,255,255,' + (a || 0.6) + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, -0.5, 0, 7); c.fill(); }
  const ICONS = {
    olive(c) {
      c.lineCap = 'round';
      c.strokeStyle = '#6a4a22'; c.lineWidth = 0.7; lin(c, [[6.5, 1.5], [6.2, 5], [4.6, 6.4]]); c.stroke(); lin(c, [[6.2, 5], [8.6, 6]]); c.stroke();
      c.fillStyle = vgrad(c, [[0, '#b8d870'], [1, '#4a7a24']], 0, 5);
      c.save(); c.translate(9.4, 2.6); c.rotate(-0.5); c.beginPath(); c.ellipse(0, 0, 3.4, 1.3, 0, 0, 7); c.fill(); c.restore();
      const o = (x, y, a, b) => { const g = c.createRadialGradient(x - 1, y - 1.4, 0.3, x, y, 4.4); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 3.3, 4.2, 0.15, 0, 7); c.fill(); hi(c, x - 1.1, y - 1.7, 0.9, 0.6, 0.7); };
      o(4.4, 10.2, '#9ac04a', '#34501a'); o(8.9, 9.4, '#8a5a8a', '#2a1030');
    },
    ambrosia(c) {
      const g0 = c.createRadialGradient(6, 9, 1, 6, 9, 7.5); g0.addColorStop(0, 'rgba(255,220,120,0.45)'); g0.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = g0; c.fillRect(-2, 0, 16, 16);
      c.beginPath();
      c.moveTo(4.3, 2.4); c.lineTo(7.7, 2.4); c.lineTo(7.3, 4.6);
      c.bezierCurveTo(11.4, 6, 11.6, 11.8, 8.2, 14.4); c.lineTo(3.8, 14.4);
      c.bezierCurveTo(0.4, 11.8, 0.6, 6, 4.7, 4.6); c.closePath();
      c.fillStyle = vgrad(c, [[0, '#fff3b0'], [0.45, '#f4bc3a'], [1, '#9a5610']], 2, 14.5); c.fill();
      c.lineWidth = 0.45; c.strokeStyle = '#5a300c'; c.stroke();
      c.fillStyle = 'rgba(255,250,210,0.35)'; c.fillRect(2.2, 8.4, 7.6, 1.2);
      c.fillStyle = '#7a4a22'; c.fillRect(4.6, 0.8, 2.8, 1.8);
      hi(c, 4, 7.4, 0.9, 1.8, 0.65);
    },
    pom(c) {
      c.fillStyle = '#7a1424'; lin(c, [[4.8, 3.8], [5.2, 1.2], [6.5, 3], [7.8, 1.2], [8.2, 3.8]]); c.fill();
      const g = c.createRadialGradient(4.8, 6.4, 0.6, 6.5, 8.3, 6.2); g.addColorStop(0, '#ff9a88'); g.addColorStop(0.45, '#d8283a'); g.addColorStop(1, '#6a0e24');
      c.fillStyle = g; c.beginPath(); c.arc(6.5, 8.4, 5.3, 0, 7); c.fill();
      c.lineWidth = 0.4; c.strokeStyle = '#4a0818'; c.stroke();
      hi(c, 4.4, 6.4, 1.2, 0.8, 0.7);
    },
    heart(c) {
      c.beginPath(); c.moveTo(6.5, 11.2);
      c.bezierCurveTo(0.2, 6.8, 0.6, 1.2, 4, 1.2); c.bezierCurveTo(5.4, 1.2, 6.2, 2.2, 6.5, 3.2);
      c.bezierCurveTo(6.8, 2.2, 7.6, 1.2, 9, 1.2); c.bezierCurveTo(12.4, 1.2, 12.8, 6.8, 6.5, 11.2); c.closePath();
      c.fillStyle = vgrad(c, [[0, '#ffa8a0'], [0.5, '#e02a3a'], [1, '#801024']], 1, 11.2); c.fill();
      c.lineWidth = 0.45; c.strokeStyle = '#4a0818'; c.stroke();
      hi(c, 3.8, 3.8, 1.1, 0.7, 0.7);
    },
    icon_club(c) {
      c.save(); c.translate(8, 8.4); c.rotate(-0.78);
      c.beginPath(); c.moveTo(-7.4, -1); c.lineTo(3.6, -2.6); c.arc(4.8, 0, 2.9, -2, 2); c.lineTo(-7.4, 1); c.arc(-7.4, 0, 1, Math.PI / 2, -Math.PI / 2); c.closePath();
      c.fillStyle = vgrad(c, [[0, '#e8b47a'], [0.5, '#9a6234'], [1, '#5a3418']], -3, 3); c.fill();
      c.lineWidth = 0.45; c.strokeStyle = '#3a2010'; c.stroke();
      c.fillStyle = '#5a3418'; [[2.6, -1.2, 0.6], [5.2, 1, 0.5], [0.4, 0.6, 0.35]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, r * 1.4, r, 0, 0, 7); c.fill(); });
      c.strokeStyle = 'rgba(255,230,190,0.55)'; c.lineWidth = 0.35; lin(c, [[-6.8, -0.6], [3, -1.8]]); c.stroke();
      c.strokeStyle = '#c89048'; c.lineWidth = 0.5; [-6, -5.1, -4.2].forEach((x) => { lin(c, [[x, -1.1], [x + 0.5, 1.1]]); c.stroke(); });
      c.restore();
    },
    icon_sandals(c) {
      c.save();
      const wing = (x, y, len, ang) => { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.ellipse(-len / 2, 0, len / 2, 1.05, 0, 0, 7); c.fillStyle = vgrad(c, [[0, '#ffffff'], [1, '#d8e0f0']], -1, 1); c.fill(); c.lineWidth = 0.3; c.strokeStyle = '#b0904a'; c.stroke(); c.restore(); };
      wing(5.2, 6.4, 5.8, 0.65); wing(5.4, 7.6, 5.2, 0.3); wing(5.6, 8.8, 4.4, 0.02);
      c.beginPath(); c.moveTo(3, 11); c.quadraticCurveTo(8, 12.8, 14.6, 11.4); c.lineTo(14.8, 12.8); c.quadraticCurveTo(8, 14.2, 2.8, 12.6); c.closePath();
      c.fillStyle = vgrad(c, [[0, '#c88a50'], [1, '#6a3a1a']], 11, 13.4); c.fill(); c.lineWidth = 0.35; c.strokeStyle = '#3a2010'; c.stroke();
      c.strokeStyle = vgrad(c, [[0, '#fff0a0'], [1, '#c88a20']], 5, 12); c.lineWidth = 0.8; c.lineCap = 'round';
      lin(c, [[5, 11.4], [8.4, 6.4]]); c.stroke(); lin(c, [[11.8, 11.6], [8.4, 6.4]]); c.stroke(); lin(c, [[6.2, 9.4], [10.6, 9.6]]); c.stroke();
      c.restore();
    },
    lyre(c) {
      c.lineCap = 'round';
      const gold = vgrad(c, [[0, '#fff3b0'], [0.5, '#f0b53a'], [1, '#9a5a10']], 0, 18);
      c.strokeStyle = 'rgba(245,235,210,0.85)'; c.lineWidth = 0.28;
      for (let i = 0; i < 5; i++) { const x = 5.6 + i * 1; lin(c, [[x, 4.6], [x, 14.6]]); c.stroke(); }
      c.strokeStyle = gold; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(4.6, 16); c.bezierCurveTo(0.8, 12, 1, 6, 3.6, 1.6); c.stroke();
      c.beginPath(); c.moveTo(10.4, 16); c.bezierCurveTo(14.2, 12, 14, 6, 11.4, 1.6); c.stroke();
      c.lineWidth = 1.1; lin(c, [[3, 4.2], [12, 4.2]]); c.stroke();
      c.fillStyle = gold; c.beginPath(); c.ellipse(7.5, 15.6, 3.8, 1.6, 0, 0, 7); c.fill();
      c.lineWidth = 0.35; c.strokeStyle = '#6a3a08'; c.stroke();
    },
    bolt(c) {
      const g = c.createRadialGradient(5.5, 8.5, 1, 5.5, 8.5, 8); g.addColorStop(0, 'rgba(255,230,120,0.5)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.fillRect(-2, 0, 15, 17);
      lin(c, [[6.6, 0.5], [1.4, 9.6], [5, 9.6], [3.4, 16.6], [9.8, 6.6], [6, 6.6], [8.6, 0.5]]); c.closePath();
      c.fillStyle = vgrad(c, [[0, '#fffbe0'], [0.5, '#ffd24a'], [1, '#e08a10']], 0, 17); c.fill();
      c.lineWidth = 0.45; c.strokeStyle = '#7a3a08'; c.stroke();
    },
    rock(c, w, h) { // falling boulder in the boar's den
      const cx = w / 2, cy = h / 2;
      c.beginPath();
      const pts = 9;
      for (let i = 0; i < pts; i++) { const a = (i / pts) * Math.PI * 2, r = (0.84 + ((i * 37) % 5) * 0.04) * Math.min(w, h) / 2; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.closePath();
      const g = c.createRadialGradient(cx - w * 0.2, cy - h * 0.25, 0.5, cx, cy, Math.max(w, h) * 0.6);
      g.addColorStop(0, '#c8b49a'); g.addColorStop(0.5, '#7a6450'); g.addColorStop(1, '#3a2a22');
      c.fillStyle = g; c.fill(); c.lineWidth = 0.5; c.strokeStyle = '#1e140e'; c.stroke();
      c.strokeStyle = 'rgba(30,20,14,0.6)'; c.lineWidth = 0.35; lin(c, [[cx - w * 0.15, cy - h * 0.1], [cx + w * 0.05, cy + h * 0.05], [cx + w * 0.02, cy + h * 0.25]]); c.stroke();
      hi(c, cx - w * 0.2, cy - h * 0.22, w * 0.12, h * 0.07, 0.35);
    },
    arrow_up(c) {
      rr(c, 0.6, 0.6, 11.8, 10.2, 3); c.moveTo(5, 10.6); c.lineTo(6.5, 13.4); c.lineTo(8, 10.6);
      c.fillStyle = vgrad(c, [[0, '#ffffff'], [1, '#e2dcee']], 0, 13); c.fill();
      c.lineWidth = 0.5; c.strokeStyle = 'rgba(40,24,60,0.85)'; c.stroke();
      lin(c, [[6.5, 2.4], [9.8, 6.2], [7.7, 6.2], [7.7, 8.8], [5.3, 8.8], [5.3, 6.2], [3.2, 6.2]]); c.closePath();
      c.fillStyle = vgrad(c, [[0, '#ffe890'], [1, '#c87a18']], 2, 9); c.fill();
      c.lineWidth = 0.35; c.strokeStyle = '#6a3a08'; c.stroke();
    }
  };
  function registerIcons() {
    const R = 12;
    Object.keys(ICONS).forEach((n) => {
      const old = O.SPR[n];
      if (!old) return;
      const w = old.w, h = old.h, cv = document.createElement('canvas');
      cv.width = Math.round(w * R); cv.height = Math.round(h * R);
      const g = cv.getContext('2d');
      g.scale(R, R);
      try { ICONS[n](g, w, h); } catch (e) { O.logOnce('icon ' + n, e); return; }
      O.SPR[n] = O.HD.makeFrame(cv, cv.width, cv.height, old.ax * R, old.ay * R, 1 / R);
    });
    // The ghost of Eurydice (game over, underworld): her HD idle frames tinted pale cyan.
    for (let i = 0; i < 4; i++) {
      const e = O.SPR['eurydice_idle_' + i];
      if (!e || !e.hd) continue;
      const cv = document.createElement('canvas'); cv.width = e.sw; cv.height = e.sh;
      const g = cv.getContext('2d');
      g.drawImage(e.img, e.sx, 0, e.sw, e.sh, 0, 0, e.sw, e.sh);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(160,235,255,0.72)'; g.fillRect(0, 0, e.sw, e.sh);
      O.SPR['eurydice_ghost_' + i] = O.HD.makeFrame(cv, e.sw, e.sh, e.ax / e.k, e.ay / e.k, e.k);
    }
  }

  /* ================= HUD ================= */
  const hud = { hp: null, ghost: 0, ghostT: 0, healT: 0, olives: 0, oliveT: 0, amb: 0, ambT: 0, vis: undefined, lvl: null };
  function medallion(c, cx, cy, t) {
    c.save();
    c.beginPath(); c.arc(cx, cy + 1, 11.4, 0, 7); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fill();
    c.beginPath(); c.arc(cx, cy, 11, 0, 7);
    c.fillStyle = vgrad(c, [[0, '#fff3b8'], [0.35, '#f0b848'], [0.75, '#a86418'], [1, '#e8b050']], cy - 11, cy + 11); c.fill();
    c.shadowColor = 'transparent';
    c.lineWidth = 0.4; c.strokeStyle = 'rgba(60,24,8,0.9)'; c.stroke();
    const g = c.createRadialGradient(cx - 2.5, cy - 3, 0.5, cx, cy, 8.4);
    g.addColorStop(0, '#6f96e0'); g.addColorStop(0.55, '#2c4c9a'); g.addColorStop(1, '#101e4a');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 8.3, 0, 7); c.fill();
    c.lineWidth = 0.5; c.strokeStyle = 'rgba(40,20,8,0.8)'; c.stroke();
    iconIn(c, 'lyre', cx, cy + 0.4, 12);
    // a glint running around the rim every few seconds
    const ph = t % 240;
    if (ph < 40) {
      const a = -Math.PI * 0.8 + (ph / 40) * Math.PI * 1.4;
      c.globalCompositeOperation = 'lighter';
      const x = cx + Math.cos(a) * 9.7, y = cy + Math.sin(a) * 9.7, gg = c.createRadialGradient(x, y, 0, x, y, 3);
      gg.addColorStop(0, 'rgba(255,255,255,0.95)'); gg.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill();
    }
    c.restore();
  }
  function bar(c, x, y, w, h, frac, ghost, t, o) {
    o = o || {};
    const r = h / 2;
    c.save();
    rr(c, x - 1.2, y - 0.4, w + 2.4, h + 2.4, r + 1.2); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fill();
    rr(c, x - 1.2, y - 1.2, w + 2.4, h + 2.4, r + 1.2); c.fillStyle = goldLine(c, y - 1.2, y + h + 1.2); c.fill();
    c.shadowColor = 'transparent';
    rr(c, x, y, w, h, r); c.fillStyle = vgrad(c, [[0, '#1c0c1e'], [1, '#3a1a34']], y, y + h); c.fill();
    c.save(); rr(c, x, y, w, h, r); c.clip();
    if (ghost > frac) { c.fillStyle = 'rgba(255,240,196,0.85)'; c.fillRect(x + w * frac, y, w * (ghost - frac), h); }
    const fw = w * clamp(frac, 0, 1);
    const hot = o.pulse ? 0.5 + 0.5 * Math.sin(t * 0.25) : 0;
    c.fillStyle = vgrad(c, [[0, hot ? '#ffe0d0' : '#ffa888'], [0.35, hot ? '#ff7a60' : '#f04a36'], [1, '#8a1a2e']], y, y + h);
    c.fillRect(x, y, fw, h);
    if (o.heal) { c.fillStyle = 'rgba(255,247,176,' + o.heal + ')'; c.fillRect(x, y, fw, h); }
    c.fillStyle = 'rgba(255,255,255,0.32)'; c.fillRect(x, y + h * 0.12, fw, h * 0.22);
    if (o.ticks) { c.fillStyle = 'rgba(40,8,20,0.45)'; for (let i = 1; i < o.ticks; i++) c.fillRect(x + (w * i) / o.ticks - 0.2, y + 0.6, 0.4, h - 1.2); }
    if (fw > 6) {
      const gx = x + ((t * 0.9) % (fw + 60)) - 10;
      if (gx > x && gx < x + fw) { const g = c.createLinearGradient(gx - 4, 0, gx + 4, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(gx - 4, y, 8, h); }
    }
    c.restore();
    gem(c, x + w + 2.4, y + h / 2, 2.4, o.gem);
    c.restore();
  }
  function drawHUD(c, g) {
    const st = g.st, t = g.t;
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
    const want = (g.dialog || g.state === 'pause') ? 0 : 1;
    if (g.state === 'pause') hud.vis = 0;
    if (hud.vis === undefined) hud.vis = want;
    hud.vis += (want - hud.vis) * 0.2;
    if (Math.abs(want - hud.vis) < 0.02) hud.vis = want;
    if (hud.vis > 0.01) {
      c.save();
      c.globalAlpha = hud.vis; c.translate(0, -(1 - hud.vis) * 8);
      c.fillStyle = vgrad(c, [[0, 'rgba(10,6,24,0.55)'], [1, 'rgba(10,6,24,0)']], 0, 38); c.fillRect(0, 0, W, 38);
      medallion(c, 16, 16, t);
      const bw = st.maxHp * 4.4;
      bar(c, 32, 6.4, bw, 6.6, st.hp / st.maxHp, hud.ghost / st.maxHp, t,
        { ticks: st.maxHp / 2, pulse: st.hp > 0 && st.hp <= Math.max(2, st.maxHp * 0.25), heal: hud.healT / 24 * 0.8 });
      // olives
      const pop = hud.oliveT > 8 ? 1 : 0;
      iconIn(c, 'olive', 36, 23.5 - pop, 10);
      T(c, '× ' + st.olives, 43, 23.8 - pop, { font: FD, size: 7.4, color: hud.oliveT ? '#ffffff' : '#eef4c8' });
      // ambrosia jars
      const ax0 = 74;
      c.fillStyle = 'rgba(255,210,74,0.35)'; c.fillRect(ax0 - 6, 18.5, 0.4, 10);
      for (let i = 0; i < 3; i++) {
        const has = i < st.ambrosia, bob = has && hud.ambT > 0 && i === st.ambrosia - 1 ? -1.2 : 0;
        iconIn(c, 'ambrosia', ax0 + i * 11, 23.5 + bob, 10.5, !has);
      }
      // item slots (top right)
      [['club', 'icon_club'], ['sandals', 'icon_sandals']].forEach((it, i) => {
        const x = W - 48 + i * 22, y = 5, has = !!st.items[it[0]];
        slot(c, x, y, 18, has);
        iconIn(c, it[1], x + 9, y + 9, 13, !has);
      });
      c.restore();
    }
    if (g.state === 'itemget' && O.ITEMS && O.ITEMS[g.itemKey]) itemToast(c, g);
  }
  // Soft dark band behind titles: fades out to the sides and to the top and bottom (cached per size).
  const ribbons = {};
  function ribbon(c, cy, h, a) {
    const key = h + ':' + a;
    if (!ribbons[key]) {
      const k = 4, cv = document.createElement('canvas'); cv.width = W * k; cv.height = h * k;
      const g = cv.getContext('2d'), hg = g.createLinearGradient(0, 0, cv.width, 0);
      hg.addColorStop(0, 'rgba(10,6,24,0)'); hg.addColorStop(0.22, 'rgba(10,6,24,' + a + ')'); hg.addColorStop(0.78, 'rgba(10,6,24,' + a + ')'); hg.addColorStop(1, 'rgba(10,6,24,0)');
      g.fillStyle = hg; g.fillRect(0, 0, cv.width, cv.height);
      g.globalCompositeOperation = 'destination-in';
      const vg = g.createLinearGradient(0, 0, 0, cv.height);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.35, 'rgba(0,0,0,1)'); vg.addColorStop(0.65, 'rgba(0,0,0,1)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = vg; g.fillRect(0, 0, cv.width, cv.height);
      ribbons[key] = cv;
    }
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(ribbons[key], 0, cy - h / 2, W, h); c.restore();
  }
  function goldRules(c, cx, y, half, len, a) {
    c.save();
    c.globalAlpha *= a === undefined ? 1 : a;
    [-1, 1].forEach((s) => {
      const x0 = cx + s * half, x1 = cx + s * (half + len);
      const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(240,192,80,0.95)'); g.addColorStop(1, 'rgba(240,192,80,0)');
      c.fillStyle = g; c.fillRect(Math.min(x0, x1), y - 0.35, len, 0.7);
      gem(c, x0 + s * 1.5, y, 1.7);
    });
    c.restore();
  }
  function itemToast(c, g) {
    const it = O.ITEMS[g.itemKey], age = 130 - (g.itemT || 0);
    const a = clamp(Math.min(age / 14, (g.itemT || 0) / 10), 0, 1);
    if (a <= 0) return;
    const cy = 54, slide = (1 - ease(age / 18)) * 6;
    c.save(); c.globalAlpha *= a;
    ribbon(c, cy, 40, 0.7);
    T(c, 'TREASURE FOUND', W / 2, cy - 9 + slide, { font: FD, size: 6, color: 'gold', align: 'center', track: 1.6 });
    const nw = measure(c, it.name, 13, FD, '900', 0.6);
    T(c, it.name, W / 2, cy + 5 + slide, { font: FD, weight: '900', size: 13, color: 'gold', align: 'center', stroke: 'rgba(50,18,8,0.95)', track: 0.6 });
    goldRules(c, W / 2, cy + 5 + slide, nw / 2 + 8, 40);
    c.restore();
  }

  /* ================= DIALOGUE ================= */
  const SPEAKER = { ELDER: 'elder', MERCHANT: 'merchant', WOMAN: 'villager', ZEUS: 'zeus', HERMES: 'hermes', HADES: 'hades', EURYDICE: 'eurydice', ORPHEUS: 'orpheus' };
  const NAMES = { WOMAN: 'VILLAGER' };
  const GODS = { ZEUS: 1, HERMES: 1, HADES: 1 };
  const dlg = { ref: null, t0: 0 };
  function portrait(c, x, y, s, name, god, t) {
    const p = O.SPR[name];
    c.save();
    if (god) {
      const g = c.createRadialGradient(x + s / 2, y + s / 2, s * 0.2, x + s / 2, y + s / 2, s * 0.85);
      g.addColorStop(0, 'rgba(255,220,120,' + (0.35 + 0.1 * Math.sin(t * 0.06)) + ')'); g.addColorStop(1, 'rgba(255,220,120,0)');
      c.fillStyle = g; c.fillRect(x - s * 0.4, y - s * 0.4, s * 1.8, s * 1.8);
    }
    shadowBox(c, 3, 1, 0.5);
    rr(c, x - 1.4, y - 1.4, s + 2.8, s + 2.8, 5); c.fillStyle = goldLine(c, y, y + s); c.fill();
    c.shadowColor = 'transparent';
    c.save(); rr(c, x, y, s, s, 4); c.clip();
    c.fillStyle = '#2a2040'; c.fillRect(x, y, s, s);
    if (p && p.hdc) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(p.hdc, x, y, s, s); }
    c.fillStyle = vgrad(c, [[0, 'rgba(255,255,255,0.16)'], [0.4, 'rgba(255,255,255,0)']], y, y + s); c.fillRect(x, y, s, s);
    c.restore();
    c.lineWidth = 0.35; c.strokeStyle = 'rgba(60,24,8,0.9)'; rr(c, x, y, s, s, 4); c.stroke();
    [[x - 0.6, y - 0.6], [x + s + 0.6, y - 0.6], [x - 0.6, y + s + 0.6], [x + s + 0.6, y + s + 0.6]].forEach(([gx, gy]) => gem(c, gx, gy, 1.8));
    c.restore();
  }
  function plate(c, x, cy, label, god) {
    const tw = measure(c, label, 6.6, FD, '700', 0.8), w = tw + 16, h = 10;
    c.save();
    shadowBox(c, 2.5, 0.8, 0.5);
    rr(c, x, cy - h / 2, w, h, h / 2);
    c.fillStyle = vgrad(c, [[0, '#ffffff'], [0.5, '#ece6f2'], [1, '#bdb4d2']], cy - h / 2, cy + h / 2); c.fill();
    c.shadowColor = 'transparent';
    c.lineWidth = 0.8; c.strokeStyle = goldLine(c, cy - h / 2, cy + h / 2); c.stroke();
    gem(c, x + 3.4, cy, 1.5); gem(c, x + w - 3.4, cy, 1.5);
    T(c, label, x + w / 2, cy + 0.2, { font: FD, size: 6.6, color: god ? '#6a3a10' : '#3a2a4a', align: 'center', shadow: 'rgba(255,255,255,0.7)', track: 0.8 });
    c.restore();
    return w;
  }
  function chevron(c, x, y) {
    c.save();
    lin(c, [[x, y], [x + 6, y], [x + 3, y + 3.6]]); c.closePath();
    c.fillStyle = vgrad(c, [[0, '#fff3b0'], [1, '#d08a1c']], y, y + 3.6); c.fill();
    c.lineWidth = 0.35; c.strokeStyle = 'rgba(50,20,8,0.9)'; c.stroke();
    c.restore();
  }
  function drawDialog(c, g) {
    const d = g.dialog, t = g.t;
    if (!d) return;
    if (dlg.ref !== d) { dlg.ref = d; dlg.t0 = t; }
    const k = ease((t - dlg.t0) / 10), oy = -(1 - k) * 12;
    const kind = SPEAKER[d.speaker], p = kind && O.SPR['portrait_' + kind], hasP = !!(p && p.hdc);
    const maxLines = d.pages.reduce((m, pg) => Math.max(m, pg.length), 1) + (d.choice ? 1 : 0);
    const x = 8, y = 6 + oy, w = W - 16, h = hasP ? 62 : Math.min(62, 22 + maxLines * 11);
    c.save(); c.globalAlpha = k;
    panel(c, x, y, w, h, { r: 5 });
    let tx = x + 14;
    if (hasP) { portrait(c, x + 7, y + 6, 50, 'portrait_' + kind, GODS[d.speaker], t); tx = x + 68; }
    if (d.speaker) plate(c, tx - 3, y + h, NAMES[d.speaker] || d.speaker, GODS[d.speaker]);
    else gem(c, x + w / 2, y + h, 2.6);
    const page = d.pages[d.page] || [];
    let left = d.chars | 0;
    const total = page.join('').length, ty = y + 12;
    page.forEach((line, i) => {
      const n = Math.max(0, Math.min(line.length, left));
      left -= line.length;
      if (n > 0) T(c, line.slice(0, n), tx, ty + i * 11.2, { size: 8.8, color: CREAM, maxW: x + w - 12 - tx });
    });
    if (d.chars >= total) {
      if (d.choice && d.page === d.pages.length - 1) {
        const oyy = ty + Math.min(3, page.length) * 11.2;
        let ox = tx + 14;
        d.choice.options.forEach((o, i) => {
          const sel = i === d.choice.sel, ow = measure(c, o, 7.6, FD, '700', 0.8) + 16;
          if (sel) {
            c.save(); rr(c, ox - 6, oyy - 5.5, ow, 11, 5.5);
            c.fillStyle = 'rgba(255,210,74,0.18)'; c.fill(); c.lineWidth = 0.5; c.strokeStyle = 'rgba(255,220,120,0.7)'; c.stroke(); c.restore();
            gem(c, ox - 10 + Math.sin(t * 0.18) * 1.2, oyy, 2);
          }
          T(c, o, ox + 2, oyy, { font: FD, size: 7.6, color: sel ? 'gold' : DIM, track: 0.8 });
          ox += ow + 20;
        });
      } else chevron(c, x + w - 16, y + h - 7 + Math.sin(t * 0.15) * 1.2);
    }
    c.restore();
  }

  /* ================= BANNER & BOSS BAR ================= */
  function drawBanner(c, g, name) {
    const b = g.banner, age = 140 - b, a = clamp(Math.min(age / 18, b / 22), 0, 1);
    if (a <= 0) return;
    const cy = 52, slide = (1 - ease(age / 22)) * 6;
    c.save(); c.globalAlpha *= a;
    ribbon(c, cy, 30, 0.6);
    const tw = measure(c, name, 15, FD, '900', 1.4);
    T(c, name, W / 2, cy - slide, { font: FD, weight: '900', size: 15, color: 'gold', align: 'center', stroke: 'rgba(50,18,8,0.95)', strokeW: 1.6, track: 1.4 });
    goldRules(c, W / 2, cy - slide, tw / 2 + 10, 56 * ease(age / 30));
    c.restore();
  }
  const boss = { hp: null, ghost: 0, t: 0, ref: null, shown: 0 };
  function drawBossBar(c, g, bo) {
    if (boss.ref !== bo) { boss.ref = bo; boss.hp = bo.hp; boss.ghost = bo.hp; boss.shown = 0; }
    if (bo.hp < boss.hp) { boss.ghost = Math.max(boss.ghost, boss.hp); boss.t = 24; }
    boss.hp = bo.hp;
    if (boss.t > 0) boss.t--; else if (boss.ghost > bo.hp) boss.ghost = Math.max(bo.hp, boss.ghost - 0.08);
    boss.shown = Math.min(1, boss.shown + 0.03);
    const k = ease(boss.shown), bw = 220, x = (W - bw) / 2, y = H - 16 + (1 - k) * 24;
    c.save();
    const nm = 'THE ERYMANTHIAN BOAR', nw = measure(c, nm, 7.4, FD, '900', 1.2);
    T(c, nm, W / 2, y - 8, { font: FD, weight: '900', size: 7.4, color: 'blood', align: 'center', stroke: 'rgba(30,6,12,0.95)', track: 1.2 });
    goldRules(c, W / 2, y - 8, nw / 2 + 6, 26, 0.8);
    bar(c, x, y, bw, 6, Math.max(0, bo.hp) / bo.maxHp, Math.max(0, boss.ghost) / bo.maxHp, g.t, { ticks: 8, gem: 'red' });
    gem(c, x - 2.4, y + 3, 2.4, 'red');
    c.restore();
  }

  /* ================= STATUS (PAUSE) ================= */
  function section(c, label, x, y, w) {
    const lw = T(c, label, x, y, { font: FD, size: 7, color: 'gold', track: 1 });
    const g = c.createLinearGradient(x + lw + 5, 0, x + w, 0); g.addColorStop(0, 'rgba(240,192,80,0.8)'); g.addColorStop(1, 'rgba(240,192,80,0.1)');
    c.fillStyle = g; c.fillRect(x + lw + 5, y - 0.3, w - lw - 5, 0.6);
    gem(c, x + w, y, 1.6);
  }
  function drawPause(c, g) {
    const st = g.st, t = g.t;
    c.save();
    c.fillStyle = 'rgba(8,4,20,0.62)'; c.fillRect(0, 0, W, H);
    const x = 30, y = 26, w = 324, h = 178;
    panel(c, x, y, w, h, { r: 6, a: 0.96 });
    // title tab
    const tw = measure(c, 'STATUS', 14, FD, '900', 2);
    c.save(); shadowBox(c, 3, 1, 0.5); rr(c, W / 2 - tw / 2 - 16, y - 8, tw + 32, 16, 8);
    c.fillStyle = vgrad(c, [[0, '#2c2050'], [1, '#150e2c']], y - 8, y + 8); c.fill(); c.shadowColor = 'transparent';
    c.lineWidth = 0.9; c.strokeStyle = goldLine(c, y - 8, y + 8); c.stroke(); c.restore();
    T(c, 'STATUS', W / 2, y, { font: FD, weight: '900', size: 14, color: 'gold', align: 'center', stroke: 'rgba(50,18,8,0.95)', track: 2 });
    // hero column
    portrait(c, x + 16, y + 18, 50, 'portrait_orpheus', false, t);
    T(c, 'ORPHEUS', x + 41, y + 78, { font: FD, size: 7.2, color: 'silver', align: 'center', track: 1 });
    T(c, 'LIFE', x + 14, y + 92, { font: FD, size: 6.4, color: 'gold', track: 1 });
    T(c, st.hp + ' / ' + st.maxHp, x + 70, y + 92, { font: FD, size: 6.4, color: '#ffc0a8', align: 'right' });
    bar(c, x + 14, y + 98, 54, 5, st.hp / st.maxHp, st.hp / st.maxHp, t, { gem: 'red' });
    if (g.lvl && g.lvl.name) {
      T(c, 'LOCATION', x + 14, y + 116, { font: FD, size: 6.4, color: 'gold', track: 1 });
      O.wrap(g.lvl.name, 12).slice(0, 2).forEach((l, i) => T(c, l, x + 14, y + 127 + i * 9, { size: 7.4, color: '#e8e0f4', maxW: 62 }));
    }
    // divider
    c.fillStyle = vgrad(c, [[0, 'rgba(240,192,80,0)'], [0.5, 'rgba(240,192,80,0.6)'], [1, 'rgba(240,192,80,0)']], y + 16, y + h - 20);
    c.fillRect(x + 84, y + 16, 0.5, h - 36);
    // right column
    const rx = x + 94, cw = 214;
    section(c, 'TREASURES', rx, y + 20, cw);
    [['club', 'icon_club', 'WOODEN CLUB'], ['sandals', 'icon_sandals', 'WINGED SANDALS']].forEach((it, i) => {
      const sx = rx + i * 106, sy = y + 28, has = !!st.items[it[0]];
      slot(c, sx, sy, 20, has);
      iconIn(c, it[1], sx + 10, sy + 10, 14, !has);
      T(c, has ? it[2] : '? ? ?', sx + 25, sy + 10, { size: 7.6, color: has ? CREAM : '#6a5c88', maxW: 78 });
    });
    section(c, 'SUPPLIES', rx, y + 62, cw);
    iconIn(c, 'olive', rx + 7, y + 75, 11);
    T(c, '× ' + st.olives, rx + 15, y + 75.5, { font: FD, size: 7.4, color: '#e8f0c0' });
    for (let i = 0; i < 3; i++) iconIn(c, 'ambrosia', rx + 62 + i * 12, y + 75, 11, i >= st.ambrosia);
    const canDrink = st.ambrosia > 0 && st.hp < st.maxHp;
    T(c, 'B — DRINK AMBROSIA (+8)', rx + 104, y + 75.5, { size: 7, color: canDrink ? '#ffe7a0' : '#6a5c88', alpha: canDrink ? 0.75 + 0.25 * Math.sin(t * 0.1) : 1 });
    section(c, 'QUEST', rx, y + 94, cw);
    c.save(); rr(c, rx, y + 100, cw, 46, 4); c.fillStyle = 'rgba(8,4,20,0.45)'; c.fill(); c.lineWidth = 0.4; c.strokeStyle = 'rgba(255,210,74,0.25)'; c.stroke(); c.restore();
    O.wrap(O.questHint(st), 38).slice(0, 4).forEach((l, i) => T(c, l, rx + 7, y + 108 + i * 10, { size: 7.4, color: '#ece4f6', maxW: cw - 14 }));
    // footer
    const fy = y + h - 11;
    const kw = measure(c, 'START', 6.4, FD, '700', 0.8) + 10;
    const rw = measure(c, 'RESUME', 7, FD, '700', 1.2), tot = kw + 6 + rw, fx = W / 2 - tot / 2;
    c.save(); rr(c, fx, fy - 5, kw, 10, 3); c.fillStyle = vgrad(c, [[0, '#ffffff'], [1, '#c8c0d8']], fy - 5, fy + 5); c.fill(); c.lineWidth = 0.5; c.strokeStyle = '#3a2a4a'; c.stroke(); c.restore();
    T(c, 'START', fx + kw / 2, fy + 0.2, { font: FD, size: 6.4, color: '#2a1a3a', align: 'center', shadow: false, track: 0.8 });
    T(c, 'RESUME', fx + kw + 6, fy, { font: FD, size: 7, color: (t >> 5) & 1 ? '#f0e8f8' : '#c8b8dc', track: 1.2 });
    c.restore();
  }

  /* ================= GAME OVER ================= */
  const goState = { t0: 0, last: -99 };
  function drawGameOver(c, g) {
    const t = g.t, GY = 150;
    if (t - goState.last > 30) goState.t0 = t; // a new game over (slow devices skip several ticks per frame)
    goState.last = t;
    const lt = t - goState.t0, I = O.HD.img;
    c.save();
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.fillStyle = '#07030e'; c.fillRect(0, 0, W, H);
    if (I.submundo) { const s = W / I.submundo.width, ih = I.submundo.height * s; c.drawImage(I.submundo, 0, GY + 8 - 0.85 * ih, W, ih); }
    c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(150,40,60,1)'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = vgrad(c, [[0, 'rgba(6,2,10,0.85)'], [0.5, 'rgba(10,2,10,0.35)'], [1, 'rgba(6,2,10,0.7)']], 0, H); c.fillRect(0, 0, W, H);
    // a beam of light on the fallen hero
    c.save(); c.globalCompositeOperation = 'lighter';
    const beam = c.createLinearGradient(0, 0, 0, GY + 6); beam.addColorStop(0, 'rgba(255,170,150,0)'); beam.addColorStop(1, 'rgba(255,170,150,' + (0.22 + 0.04 * Math.sin(t * 0.05)) + ')');
    c.fillStyle = beam; lin(c, [[W / 2 - 10, 0], [W / 2 + 14, 0], [W / 2 + 46, GY + 6], [W / 2 - 42, GY + 6]]); c.fill();
    c.restore();
    // embers
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      const life = 200 + (i % 5) * 30, tt = (t + i * 53) % life, ey = GY + 6 - tt * 0.6, ex = (i * 97) % W + Math.sin(tt * 0.05 + i) * 6;
      const a = Math.min(1, tt / 20) * Math.max(0, 1 - tt / life), gr = c.createRadialGradient(ex, ey, 0, ex, ey, 2.4);
      gr.addColorStop(0, 'rgba(255,200,120,' + a + ')'); gr.addColorStop(1, 'rgba(255,90,40,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(ex, ey, 2.4, 0, 7); c.fill();
    }
    c.restore();
    // Eurydice's ghost reaching down, Orpheus fallen, the lyre beside him
    O.drawA(c, 'eurydice_ghost_' + ((t / 10 | 0) % 4), W / 2 + 6, GY - 26 + Math.sin(t * 0.04) * 2, true, false, 0.28 + 0.1 * Math.sin(t * 0.03));
    O.HD.shadow(c, W / 2 - 4, GY + 1, 18, 0.4);
    O.drawA(c, 'hero_dead_1', W / 2 - 6, GY + 1);
    O.drawA(c, 'lyre', W / 2 + 24, GY + 1);
    const v = c.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, W * 0.65);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    // title + menu
    const k = ease(Math.min(1, lt / 50));
    c.globalAlpha = Math.min(1, lt / 30);
    T(c, 'GAME OVER', W / 2, 36 - (1 - k) * 10, { font: FD, weight: '900', size: 28, color: 'blood', align: 'center', stroke: 'rgba(30,4,10,0.95)', strokeW: 2, track: 2 });
    c.globalAlpha = 1;
    T(c, 'EURYDICE STILL WAITS...', W / 2, 60, { size: 8.4, color: '#e8c4d4', align: 'center', track: 0.6 });
    ['CONTINUE', 'RETURN TO TITLE'].forEach((o, i) => {
      const yy = 176 + i * 15, sel = g.sel === i, ow = measure(c, o, 9, FD, '700', 1.2);
      if (sel) { c.fillStyle = vgrad(c, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(60,8,20,0.55)'], [1, 'rgba(0,0,0,0)']], yy - 7, yy + 7); c.fillRect(W / 2 - ow / 2 - 30, yy - 7, ow + 60, 14); }
      T(c, o, W / 2, yy, { font: FD, size: 9, color: sel ? 'blood' : '#c8a8b8', align: 'center', stroke: sel ? 'rgba(30,4,10,0.9)' : undefined, track: 1.2 });
      if (sel) { const b = Math.sin(t * 0.12) * 1.5; gem(c, W / 2 - ow / 2 - 10 - b, yy, 2.2, 'red'); gem(c, W / 2 + ow / 2 + 10 + b, yy, 2.2, 'red'); }
    });
    c.restore();
  }

  /* ================= HOOK UP ================= */
  const HDV = { drawHUD, drawDialog, drawBanner, drawBossBar, drawPause, drawGameOver };
  const U = O.UI || {};
  Object.keys(HDV).forEach((n) => {
    const orig = U[n];
    U[n] = function (c, g, a, b) {
      if (on()) { try { return HDV[n](c, g, a, b); } catch (e) { O.logOnce('hdui.' + n, e); } }
      return orig && orig(c, g, a, b);
    };
  });
  O.HDUI = { init: registerIcons, T, measure, panel, gem, FD, FB };
})(window.OLY);
