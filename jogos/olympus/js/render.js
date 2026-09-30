/* render.js — everything the player sees: level art, lights, particles, HUD, dialogue,
   title screen, story scenes, pause, game over and ending. */
(function (O) {
  'use strict';
  const T = O.TILE, VY = O.HUD_H, VIEW_H = O.ROWS * T, W = O.W, H = O.H;
  const GOLD = ['#fcf088', '#f8b800', '#a86000'];
  const INK = '#0c0c28';

  /* ---------------- level baking ---------------- */
  function placeDecor(ctx, d) {
    const type = d[0], tx = d[1], row = d[2], seed = d[4], anchor = d[5];
    const img = O.Tiles.decor(type, seed);
    if (!img) return;
    const x = Math.round(tx * T + 8 - img.w / 2);
    const y = anchor === 'top' ? row * T - 1 : row * T - img.h + 1;
    ctx.drawImage(img.c, x, y);
  }
  O.renderLevel = function (lvl) {
    const g = lvl.canvas.getContext('2d'), f = lvl.front.getContext('2d');
    g.clearRect(0, 0, lvl.pxW, lvl.pxH);
    f.clearRect(0, 0, lvl.pxW, lvl.pxH);
    const def = lvl.def, th = O.Tiles.theme(lvl.theme);
    const earth = (ch) => ch === 'G' || ch === 'D';
    const FG = { G: 1, D: 1, B: 1, P: 1, X: 1 };
    const pass = (fg) => {
      for (let y = 0; y < lvl.h; y++) {
        for (let x = 0; x < lvl.w; x++) {
          const ch = lvl.tiles[y][x];
          if (ch === '.' || !!FG[ch] !== fg) continue;
          if (O.HD && O.HD.hideTile(lvl, ch, x, y)) continue; // the 2.5D scenery already shows it
          let depth = 0;
          for (let k = y - 1; k >= 0 && earth(lvl.tile(x, k)); k--) depth++;
          const deep = ch === 'D' && depth >= 2;
          let img = null;
          if (O.Tiles.getCtx) { try { img = O.Tiles.getCtx(lvl.theme, ch, x, y, lvl); } catch (e) { O.logOnce('getCtx', e); } }
          if (!img) img = ch === 'd' ? O.Tiles.get(lvl.theme, 'd', 0, lvl.tile(x, y - 1) !== 'd') : O.Tiles.get(lvl.theme, deep ? 'q' : ch, O.hash(x, y) % 4);
          if (!img) continue;
          g.drawImage(img, x * T, y * T);
          if (O.Tiles.handlesEdges) continue;
          if (earth(ch)) {
            const top = ch === 'G' ? 1 : 0, inset = ch === 'G' ? 6 : 0;
            if (x > 0 && !lvl.isSolid(x - 1, y)) {
              g.fillStyle = '#000000'; g.fillRect(x * T, y * T + top, 1, T - top);
              g.fillStyle = th.dirt[2]; g.fillRect(x * T + 1, y * T + inset, 1, T - inset);
            }
            if (x < lvl.w - 1 && !lvl.isSolid(x + 1, y)) {
              g.fillStyle = '#000000'; g.fillRect(x * T + T - 1, y * T + top, 1, T - top);
              g.fillStyle = th.dirt[2]; g.fillRect(x * T + T - 2, y * T + inset, 1, T - inset);
            }
          }
          if (ch === 'G' && !lvl.isSolid(x, y - 1) && lvl.tile(x, y - 1) !== 'X') g.drawImage(O.Tiles.tuft(lvl.theme, O.hash(x, y, 1) % 4), x * T, y * T - 4);
        }
      }
    };
    const hd = O.HD && O.HD.scene(lvl);
    const keep = (d) => !(hd && O.HD.hideDecor(lvl, d));
    pass(false);
    (def.decor || []).filter((d) => d[3] === 'back' && keep(d)).forEach((d) => placeDecor(g, d));
    if (!hd) (def.statues || []).forEach((st) => O.drawA(g, 'statue', st.tx * T + 8, st.row * T - st.lift));
    pass(true);
    if (O.Tiles.overlay && !hd) { try { O.Tiles.overlay(lvl, g, f); } catch (e) { O.logOnce('overlay', e); } }
    (def.decor || []).filter((d) => d[3] === 'front' && keep(d)).forEach((d) => placeDecor(f, d));
    // Keep an ungraded copy of the spike areas (lighting modules may darken the level canvas later).
    lvl.hazard = null;
    for (let y = 0; y < lvl.h; y++) {
      for (let x = 0; x < lvl.w; x++) {
        if (lvl.tiles[y][x] !== 'X') continue;
        if (!lvl.hazard) lvl.hazard = O.makeCanvas(lvl.pxW, lvl.pxH);
        lvl.hazard.getContext('2d').drawImage(lvl.canvas, x * T - 3, y * T - 4, T + 6, T + 8, x * T - 3, y * T - 4, T + 6, T + 8);
      }
    }
  };

  /* ---------------- helpers ---------------- */
  const glowCache = {};
  function glow(color, R) {
    const key = color + R;
    if (glowCache[key]) return glowCache[key];
    const p = new O.Pix(R * 2, R * 2);
    for (let y = 0; y < R * 2; y++) for (let x = 0; x < R * 2; x++) {
      const d = Math.hypot(x - R + 0.5, y - R + 0.5) / R;
      if (d < 1 && O.bayer(x, y) < Math.pow(1 - d, 1.4) * 0.6) p.set(x, y, color);
    }
    glowCache[key] = p.canvas();
    return glowCache[key];
  }
  function drawGlow(c, color, x, y, R, alpha) {
    c.globalAlpha = alpha === undefined ? 0.55 : alpha;
    c.drawImage(glow(color, R), Math.round(x - R), Math.round(y - R));
    c.globalAlpha = 1;
  }
  function shadowText(c, s, x, y, color, shadow, scale) {
    O.text(c, s, x + 1, y + 1, shadow || INK, scale);
    O.text(c, s, x, y, color || '#fcfcfc', scale);
  }
  function centerX(s, scale) { return Math.round((W - String(s).length * 8 * (scale || 1)) / 2); }

  // Greek key (meander) strip.
  function meander(c, x, y, w, color, bg) {
    if (bg) { c.fillStyle = bg; c.fillRect(x, y, w, 6); }
    c.fillStyle = color;
    for (let i = 0; i < w; i++) for (let j = 0; j < 6; j++) if (O.KEY[j][i % 6] === 'X') c.fillRect(x + i, y + j, 1, 1);
  }
  // Framed panel with gold double border and corner studs.
  function panel(c, x, y, w, h, fill) {
    c.fillStyle = '#000000'; c.fillRect(x, y, w, h);
    c.fillStyle = fill || INK; c.fillRect(x + 1, y + 1, w - 2, h - 2);
    c.fillStyle = '#141848'; c.fillRect(x + 4, y + 4, w - 8, 2);
    c.fillStyle = GOLD[1];
    c.fillRect(x + 1, y + 1, w - 2, 1); c.fillRect(x + 1, y + h - 2, w - 2, 1);
    c.fillRect(x + 1, y + 1, 1, h - 2); c.fillRect(x + w - 2, y + 1, 1, h - 2);
    c.fillStyle = GOLD[2];
    c.fillRect(x + 3, y + 3, w - 6, 1); c.fillRect(x + 3, y + h - 4, w - 6, 1);
    c.fillRect(x + 3, y + 3, 1, h - 6); c.fillRect(x + w - 4, y + 3, 1, h - 6);
    [[x, y], [x + w - 5, y], [x, y + h - 5], [x + w - 5, y + h - 5]].forEach((q) => {
      c.fillStyle = GOLD[2]; c.fillRect(q[0], q[1], 5, 5);
      c.fillStyle = GOLD[0]; c.fillRect(q[0] + 1, q[1] + 1, 3, 3);
      c.fillStyle = GOLD[1]; c.fillRect(q[0] + 2, q[1] + 2, 2, 2);
    });
  }
  O.panel = panel;

  // Big gradient logo text (cached).
  const logoCache = {};
  function logo(text, grad, outline) {
    const key = text + grad.join('');
    if (logoCache[key]) return logoCache[key];
    const sc = 3, w = text.length * 8 * sc, h = 8 * sc;
    const tmp = O.makeCanvas(w, h);
    O.text(tmp.getContext('2d'), text, 0, 0, '#ffffff', sc);
    const data = tmp.getContext('2d').getImageData(0, 0, w, h).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 0;
    const p = new O.Pix(w + 6, h + 6), m = new O.Pix(w + 6, h + 6);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      p.set(x + 4, y + 4, '#1c0818');
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      const f = (y / (h - 1)) * (grad.length - 1);
      const i = Math.floor(f), fr = f - i;
      let c = grad[Math.min(grad.length - 1, i + (O.bayer(x, y) < fr ? 1 : 0))];
      if (!on(x, y - 1)) c = '#fcfcf0';
      else if (!on(x, y + 1)) c = grad[grad.length - 1];
      p.set(x + 2, y + 2, c);
      m.set(x + 2, y + 2, '#fcfcfc');
    }
    const outlined = new O.Pix(w + 6, h + 6);
    for (let i = 0; i < p.d.length; i++) outlined.d[i] = p.d[i] && p.d[i] !== '#1c0818' ? p.d[i] : null;
    outlined.outline(outline);
    for (let i = 0; i < p.d.length; i++) if (!outlined.d[i] && p.d[i]) outlined.d[i] = p.d[i];
    logoCache[key] = { c: outlined.canvas(), mask: m.canvas(), w: w + 6, h: h + 6 };
    return logoCache[key];
  }
  function drawLogo(c, text, grad, outline, y, shine) {
    const L = logo(text, grad, outline);
    const x = Math.round((W - L.w) / 2);
    c.drawImage(L.c, x, y);
    if (shine !== undefined) {
      const sx = Math.floor(shine % (L.w + 80)) - 40;
      for (let k = 0; k < 3; k++) {
        const col = sx + k;
        if (col >= 0 && col < L.w) c.drawImage(L.mask, col, 0, 1, L.h, x + col, y, 1, L.h);
      }
    }
  }
  function note(c, x, y, color) {
    c.fillStyle = '#000000';
    c.fillRect(x - 1, y + 4, 5, 4); c.fillRect(x + 2, y - 1, 3, 7);
    c.fillStyle = color;
    c.fillRect(x, y + 5, 3, 2); c.fillRect(x + 3, y, 1, 6); c.fillRect(x + 4, y, 2, 1); c.fillRect(x + 5, y + 1, 1, 1);
  }

  const P = O.Game.prototype;

  /* ---------------- main draw ---------------- */
  P.draw = function () {
    const c = this.ctx;
    c.fillStyle = '#000000';
    c.fillRect(0, 0, W, H);
    switch (this.state) {
      case 'press': case 'title': this.drawTitle(c); break;
      case 'story': this.drawStory(c); break;
      case 'cut': O.Cutscene.draw(c, this); break;
      case 'options': case 'howto':
        if (this.menuFrom === 'title') this.drawTitle(c);
        else { this.drawWorld(c); if (this.menuFrom === 'pause') this.drawPause(c); }
        if (O.HDUI) O.HDUI[this.state === 'options' ? 'drawOptions' : 'drawHowto'](c, this);
        break;
      case 'play': case 'itemget': case 'dying': this.drawWorld(c); this.drawHUD(c); if (this.dialog) this.drawDialog(c); break;
      case 'pause': this.drawWorld(c); this.drawHUD(c); this.drawPause(c); break;
      case 'gameover': this.drawGameOver(c); break;
      case 'ending': this.drawEnding(c); break;
    }
    if (this.trans) {
      const a = Math.min(4, Math.floor(this.trans.t / 4)) / 4;
      if (a > 0) { c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.fillRect(0, 0, W, H); }
    }
  };

  P.drawWorld = function (c) {
    const lvl = this.lvl, cam = this.cam;
    c.save();
    if (this.shake > 0) c.translate((this.t >> 1) & 1 ? 2 : -2, (this.t >> 2) & 1 ? 1 : -1);
    const hd = O.HD && O.HD.drawBackground(c, this);
    if (!hd) {
      const bg = O.Tiles.background(lvl.theme);
      c.drawImage(bg.sky, 0, 0);
      bg.layers.forEach((L) => {
        const lw = L.c.width;
        const off = Math.floor(cam * L.f) % lw;
        for (let x = -off; x < W; x += lw) c.drawImage(L.c, x, L.y || 0);
      });
    }
    const lv = lvl.render();
    if (hd) O.HD.drawSet(c, this);
    c.drawImage(lv, cam, 0, W, VIEW_H, 0, VY, W, VIEW_H);
    c.drawImage(lv, cam, 0, W, VY, 0, 0, W, VY);
    if (!(hd && O.HD.hideLights(lvl))) this.drawLights(c);
    this.npcs.forEach((n) => n.draw(c, this));
    this.pickups.forEach((pk) => pk.draw(c, this));
    // Snakes crawl in the grass: draw them after the foreground layer so the tufts don't cover them.
    this.enemies.forEach((e) => { if (!e.lowProfile) e.draw(c, this); });
    if (this.state === 'dying') this.drawDeath(c);
    else if (this.state === 'itemget') this.drawItemGet(c);
    else this.player.draw(c, this);
    this.drawFx(c);
    c.drawImage(lvl.front, cam, 0, W, VIEW_H, 0, VY, W, VIEW_H);
    this.enemies.forEach((e) => { if (e.lowProfile) e.draw(c, this); });
    if (hd) O.HD.post(c, this);
    if (O.Light && O.Light.apply && !(hd && O.HD.hideLights(lvl))) { try { c.save(); O.Light.apply(c, this); } catch (e) { O.logOnce('Light.apply', e); } finally { c.restore(); } }
    this.drawHazards(c);
    this.drawAmbient(c);
    if (this.flash > 0 && (this.flash & 1)) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, 0, W, H); }
    c.restore();
    if (this.banner > 0 && this.banner < 140 && !this.dialog) this.drawBanner(c, lvl.name);
    const boss = this.enemies.find((e) => e instanceof O.Boar);
    if (boss && boss.state !== 'wait') this.drawBossBar(c, boss);
  };

  // Spikes are redrawn on top of the lighting pass (partially) so dangers always read clearly.
  // Spikes are redrawn on top of the lighting pass from an ungraded copy, so dangers always read clearly.
  P.drawHazards = function (c) {
    const lvl = this.lvl, cam = this.cam, hz = lvl.hazard;
    if (!hz || lvl.theme === 'village') return;
    c.globalAlpha = 0.85;
    c.drawImage(hz, cam, 0, W, VIEW_H, 0, VY, W, VIEW_H);
    c.globalAlpha = 1;
  };

  P.drawBanner = function (c, name) {
    if (O.UI && O.UI.drawBanner) { try { return O.UI.drawBanner(c, this, name); } catch (e) { O.logOnce('UI.drawBanner', e); } }
    const w = name.length * 8 + 36, x = Math.round((W - w) / 2);
    panel(c, x, 30, w, 20);
    shadowText(c, name, x + 18, 36, GOLD[0]);
  };
  P.drawBossBar = function (c, boss) {
    if (O.UI && O.UI.drawBossBar) { try { return O.UI.drawBossBar(c, this, boss); } catch (e) { O.logOnce('UI.drawBossBar', e); } }
    panel(c, 60, H - 26, W - 120, 22);
    shadowText(c, 'BOAR', 68, H - 19, '#fc7050');
    for (let i = 0; i < boss.maxHp; i++) {
      const x = 108 + i * 12, on = i < boss.hp;
      c.fillStyle = '#000000'; c.fillRect(x, H - 20, 10, 9);
      c.fillStyle = on ? '#d82800' : '#3c0c08'; c.fillRect(x + 1, H - 19, 8, 7);
    }
  };

  P.drawLights = function (c) {
    const cam = this.cam, t = this.t;
    (this.lvl.def.lights || []).forEach((l, i) => {
      const x = Math.round(l.tx * T + 8 - cam), y = l.row * T + VY;
      if (O.drawLightProp) { try { O.drawLightProp(c, l.type, x, y, t, i); return; } catch (e) { O.logOnce('drawLightProp', e); } }
      if (l.type === 'brazier') {
        const flick = (t >> 3) & 1;
        drawGlow(c, '#f8b800', x, y - 20, 30 + flick, 0.45);
        O.drawA(c, 'brazier', x, y);
        O.drawA(c, 'flame_' + ((t >> 3) & 3), x, y - 12);
      } else if (l.type === 'torch') {
        drawGlow(c, '#f8b800', x, y - 4, 34, 0.4);
        c.fillStyle = '#c88830'; c.fillRect(x - 1, y + 1, 3, 8);
        O.drawA(c, 'flame_' + (((t + i * 5) >> 3) & 3), x, y + 1);
      } else if (l.type === 'crystal') {
        drawGlow(c, '#40d8e0', x, y - 10, 22 + Math.round(Math.sin(t * 0.05 + i) * 3), 0.4);
      }
    });
  };

  P.drawAmbient = function (c) {
    const cam = this.cam;
    this.amb.forEach((p) => {
      const x = Math.round(p.x - cam), y = Math.round(p.y) + VY;
      if (O.AmbDraw) { try { if (O.AmbDraw(c, p, x, y, this) !== false) return; } catch (e) { O.logOnce('AmbDraw', e); } }
      if (p.k === 'leaf') {
        const flip = (p.t >> 4) & 1;
        c.fillStyle = '#2c7818'; c.fillRect(x, y, 2, 1);
        c.fillStyle = flip ? '#b8f070' : '#58c030'; c.fillRect(x + (flip ? 1 : 0), y + 1, 2, 1);
      } else if (p.k === 'fly') {
        const on = (p.t % 90) < 55;
        if (!on) return;
        c.globalAlpha = 0.35; c.fillStyle = '#c8fc68'; c.fillRect(x - 1, y - 1, 3, 3); c.globalAlpha = 1;
        c.fillStyle = '#f0fca8'; c.fillRect(x, y, 1, 1);
      } else if (p.k === 'ember') {
        c.fillStyle = p.t < 30 ? '#fcf088' : p.t < 50 ? '#f8b800' : '#d82800';
        c.fillRect(x, y, 1, 1);
      } else if (p.k === 'drip') {
        c.fillStyle = '#80c0fc'; c.fillRect(x, y, 1, 2);
      }
    });
  };

  P.drawItemGet = function (c) {
    const p = this.player;
    const d = O.drawBody(c, this, 'hero_hold', p, p.facing < 0, false);
    const it = O.ITEMS[this.itemKey];
    const iconName = O.SPR[it.icon] ? it.icon : it.icon.replace('icon_', 'icon');
    const s = O.SPR[iconName];
    if (!d || !s) return;
    const cx = Math.round(p.x + p.w / 2 - this.cam), cy = d.sy - 8;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + this.t * 0.03;
      c.fillStyle = i % 2 ? '#ffd24a' : '#fff7b0';
      for (let k = 8; k < 22; k += 2) c.fillRect(Math.round(cx + Math.cos(a) * k), Math.round(cy + Math.sin(a) * k), 1, 1);
    }
    O.drawA(c, iconName, cx, cy + Math.floor(s.h / 2) + Math.round(Math.sin(this.t * 0.2)));
  };

  P.drawDeath = function (c) {
    const p = this.player;
    const wf = (n) => (p.wf ? p.wf(n) : n);
    if (this.dieT < 50) O.drawBody(c, this, wf('hero_hurt'), p, ((this.dieT >> 3) & 1) === 1, (this.dieT >> 1) & 1);
    else O.drawBody(c, this, wf(this.dieT < 70 ? 'hero_dead_0' : 'hero_dead_1'), p, p.facing < 0, false);
  };

  P.drawFx = function (c) {
    const cam = this.cam;
    this.fx.forEach((f) => {
      const x = Math.round(f.x - cam), y = Math.round(f.y) + VY;
      if (O.FXDraw) { try { if (O.FXDraw(c, f, x, y, this) !== false) return; } catch (e) { O.logOnce('FXDraw', e); } }
      if (f.type === 'puff') {
        const r = 3 + f.t * 0.7;
        const col = f.t < 8 ? '#fcfcfc' : f.t < 15 ? '#d8d8e8' : '#9090b0';
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + f.t * 0.05;
          const s = f.t < 14 ? 3 : 2;
          c.fillStyle = '#000000'; c.fillRect(Math.round(x + Math.cos(a) * r) - 1, Math.round(y + Math.sin(a) * r) - 1, s + 1, s + 1);
          c.fillStyle = col; c.fillRect(Math.round(x + Math.cos(a) * r) - 1, Math.round(y + Math.sin(a) * r) - 1, s, s);
        }
      } else if (f.type === 'star') {
        c.fillStyle = f.t < 12 ? '#fcf088' : '#f8b800';
        c.fillRect(x, y, 1, 1); if (f.t < 10) { c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); }
      } else if (f.type === 'spark') {
        const r = 2 + f.t;
        c.fillStyle = '#fcfcfc';
        c.fillRect(x - r, y, r * 2 + 1, 1); c.fillRect(x, y - r, 1, r * 2 + 1);
        c.fillStyle = '#f8b800';
        c.fillRect(x - r + 1, y - r + 1, 1, 1); c.fillRect(x + r - 1, y - r + 1, 1, 1); c.fillRect(x - r + 1, y + r - 1, 1, 1); c.fillRect(x + r - 1, y + r - 1, 1, 1);
        if (f.t < 4) { c.fillStyle = '#fcfcfc'; c.fillRect(x - 2, y - 2, 5, 5); }
      } else if (f.type === 'dust') {
        const s = f.t < 6 ? 3 : f.t < 11 ? 2 : 1;
        c.fillStyle = f.t < 8 ? '#e8e0d0' : '#a8a098';
        c.fillRect(x - (s >> 1), y - (s >> 1), s, s);
      } else if (f.type === 'bit') {
        c.fillStyle = '#000000'; c.fillRect(x - 1, y - 1, 4, 4);
        c.fillStyle = '#b87850'; c.fillRect(x, y, 2, 2);
      } else if (f.type === 'text') {
        shadowText(c, f.text, x, y, f.color);
      }
    });
  };

  /* ---------------- HUD ---------------- */
  P.drawHUD = function (c) {
    if (O.UI && O.UI.drawHUD) { try { return O.UI.drawHUD(c, this); } catch (e) { O.logOnce('UI.drawHUD', e); } }
    const st = this.st;
    c.fillStyle = INK; c.fillRect(0, 0, W, VY);
    c.fillStyle = '#141848'; c.fillRect(0, 0, W, 2);
    meander(c, 0, 25, W, GOLD[2], '#000000');
    c.fillStyle = GOLD[1]; c.fillRect(0, 24, W, 1);
    c.fillStyle = '#000000'; c.fillRect(0, 31, W, 1);

    shadowText(c, 'LIFE', 6, 4, '#fcfcfc');
    const bw = st.maxHp * 4 + 3;
    c.fillStyle = '#000000'; c.fillRect(40, 3, bw, 10);
    c.fillStyle = GOLD[2]; c.fillRect(41, 4, bw - 2, 8);
    c.fillStyle = '#000000'; c.fillRect(42, 5, bw - 4, 6);
    for (let i = 0; i < st.maxHp; i++) {
      const x = 43 + i * 4, on = i < st.hp;
      c.fillStyle = on ? '#d82800' : '#3c0c08'; c.fillRect(x, 6, 3, 4);
      if (on) { c.fillStyle = '#fc7050'; c.fillRect(x, 6, 3, 1); }
    }
    shadowText(c, this.lvl.name.slice(0, 18), 6, 15, GOLD[0]);

    O.drawSpr(c, 'olive', 150, 2);
    shadowText(c, 'X' + O.pad(st.olives, 3), 160, 4);
    O.drawSpr(c, 'ambrosia', 150, 13);
    shadowText(c, 'X' + st.ambrosia, 160, 15);

    [['club', 'iconClub'], ['sandals', 'iconSandals']].forEach((it, i) => {
      const x = 204 + i * 22;
      c.fillStyle = '#000000'; c.fillRect(x, 3, 18, 18);
      c.fillStyle = GOLD[2]; c.fillRect(x + 1, 4, 16, 16);
      c.fillStyle = '#080818'; c.fillRect(x + 2, 5, 14, 14);
      if (st.items[it[0]]) { const s = O.SPR[it[1]]; O.drawSpr(c, it[1], x + 9 - s.w / 2, 12 - s.h / 2); }
    });
  };

  /* ---------------- dialogue ---------------- */
  P.drawDialog = function (c) {
    if (O.UI && O.UI.drawDialog) { try { return O.UI.drawDialog(c, this); } catch (e) { O.logOnce('UI.drawDialog', e); } }
    const d = this.dialog;
    const x = 6, y = 158, w = 244, h = 76;
    panel(c, x, y, w, h);
    if (d.speaker) {
      const sw = d.speaker.length * 8 + 14;
      panel(c, x + 10, y - 9, sw, 14);
      shadowText(c, d.speaker, x + 17, y - 5, GOLD[0]);
    }
    const page = d.pages[d.page];
    let left = d.chars | 0;
    page.forEach((line, i) => {
      const shown = line.slice(0, Math.max(0, left));
      left -= line.length;
      shadowText(c, shown, x + 12, y + 12 + i * 13, '#fcfcfc');
    });
    const total = page.join('').length;
    if (d.chars >= total) {
      if (d.choice && d.page === d.pages.length - 1) {
        const oy = y + 12 + 3 * 13;
        d.choice.options.forEach((o, i) => {
          const ox = x + 40 + i * 80;
          const on = i === d.choice.sel;
          if (on) shadowText(c, '>', ox - 11 + ((this.t >> 3) & 1), oy, GOLD[1]);
          shadowText(c, o, ox, oy, on ? GOLD[0] : '#a0a0c0');
        });
      } else {
        const by = y + h - 12 + ((this.t >> 3) & 1);
        c.fillStyle = '#000000'; c.fillRect(x + w - 19, by - 1, 9, 6);
        c.fillStyle = GOLD[1];
        c.fillRect(x + w - 18, by, 7, 1); c.fillRect(x + w - 17, by + 1, 5, 1); c.fillRect(x + w - 16, by + 2, 3, 1); c.fillRect(x + w - 15, by + 3, 1, 1);
      }
    }
  };

  P.drawPause = function (c) {
    if (O.UI && O.UI.drawPause) { try { return O.UI.drawPause(c, this); } catch (e) { O.logOnce('UI.drawPause', e); } }
    const st = this.st;
    c.fillStyle = 'rgba(0,0,16,0.55)'; c.fillRect(0, VY, W, VIEW_H);
    panel(c, 16, 40, 224, 188);
    meander(c, 24, 50, 208, GOLD[2]);
    shadowText(c, 'STATUS', centerX('STATUS'), 60, GOLD[0]);
    c.fillStyle = INK; c.fillRect(centerX('STATUS') - 4, 58, 56, 12);
    shadowText(c, 'STATUS', centerX('STATUS'), 60, GOLD[0]);
    shadowText(c, 'LIFE', 32, 78); shadowText(c, st.hp + '/' + st.maxHp, 136, 78, '#fc7050');
    shadowText(c, 'OLIVES', 32, 92); shadowText(c, String(st.olives), 136, 92, '#b8d860');
    shadowText(c, 'AMBROSIA', 32, 106); shadowText(c, st.ambrosia + '/3', 136, 106, GOLD[0]);
    shadowText(c, 'TREASURES', 32, 124, '#80c0fc');
    let ix = 32;
    ['club', 'sandals'].forEach((k) => {
      if (!st.items[k]) return;
      O.drawSpr(c, O.ITEMS[k].icon, ix, 136);
      ix += 16;
    });
    if (ix === 32) shadowText(c, 'NONE', 32, 136, '#686888');
    shadowText(c, 'QUEST', 32, 154, '#80c0fc');
    O.wrap(O.questHint(st), 24).forEach((l, i) => shadowText(c, l, 32, 166 + i * 10));
    if (st.ambrosia > 0) shadowText(c, 'B: DRINK AMBROSIA (+8)', 32, 200, st.hp < st.maxHp ? '#fcfcfc' : '#686888');
    shadowText(c, 'START: RESUME', 32, 212, '#8888a8');
  };

  /* ---------------- title ---------------- */
  let titleBg = null, cloudStrip = null;
  function buildTitle() {
    const p = new O.Pix(W, H);
    O.bands(p, 0, 0, W, H, ['#180c38', '#241048', '#34145a', '#4c1c68', '#6c2870', '#943c74', '#bc5470', '#dc7468', '#f09460', '#fcb860', '#fcd878']);
    for (let y = 0; y < 150; y++) for (let x = 120; x < 256; x++) {
      const dd = Math.hypot(x - 188, y - 142);
      if (dd < 20) p.set(x, y, dd < 15 ? '#fcf8d0' : '#fce098');
    }
    const r = O.rng(4);
    for (let i = 0; i < 40; i++) p.set(r() * W, r() * 60, i % 4 ? '#8878c8' : '#fcfcfc');
    const hAt = (x) => 60 + Math.sin(x * 0.021 + 1.2) * 18 + Math.sin(x * 0.07) * 6 + Math.max(0, 40 - Math.abs(x - 170) * 0.6);
    for (let x = 0; x < W; x++) {
      const h = Math.round(hAt(x)), sl = hAt(x + 1) - hAt(x - 1);
      for (let y = 200 - h; y < 200; y++) {
        let col = sl > 0.3 ? '#8c6cb8' : sl < -0.3 ? '#3c2c6c' : (O.bayer(x, y) < 0.5 ? '#6450a0' : '#4c3c84');
        if (y < 200 - h + 10 && h > 78) col = sl > -0.2 ? '#fce0e0' : '#c8a8d8';
        p.set(x, y, col);
      }
    }
    const peakX = 170, peakY = 200 - Math.round(hAt(170));
    p.rect(peakX - 5, peakY - 5, 11, 2, '#fcf088'); p.rect(peakX - 6, peakY - 6, 13, 1, '#f8b800');
    for (let x = peakX - 5; x <= peakX + 5; x += 2) p.rect(x, peakY - 3, 1, 3, '#fcf088');
    for (let x = 0; x < W; x++) {
      const top = 200 - Math.round(24 + Math.sin(x * 0.05) * 5 + Math.sin(x * 0.13) * 3);
      for (let y = top; y < H; y++) p.set(x, y, y < top + 2 ? '#2c1c48' : '#140c28');
    }
    for (let x = 0; x < 110; x++) {
      const top = Math.round(150 + Math.max(0, (x - 62)) * 1.3 + Math.sin(x * 0.3) * 1.5);
      for (let y = top; y < H; y++) p.set(x, y, y < top + 2 && x < 62 ? '#3c2848' : '#0c0818');
    }
    titleBg = p.canvas();
    const cp = new O.Pix(512, 40);
    for (let i = 0; i < 9; i++) {
      const cx = i * 58 + r() * 20, cy = 12 + r() * 16, len = 30 + r() * 30;
      for (let k = 0; k < len; k += 5) cp.ball(cx + k, cy + Math.sin(k) * 1.5, 5, 2.5, ['#fcc8b0', '#e89898', '#a86888']);
    }
    cloudStrip = cp.canvas();
  }

  P.drawTitle = function (c) {
    if (O.UI && O.UI.drawTitle) { try { return O.UI.drawTitle(c, this); } catch (e) { O.logOnce('UI.drawTitle', e); } }
    if (!titleBg) buildTitle();
    c.drawImage(titleBg, 0, 0);
    const off = Math.floor(this.t * 0.15) % 512;
    c.globalAlpha = 0.9;
    c.drawImage(cloudStrip, -off, 88); c.drawImage(cloudStrip, 512 - off, 88);
    c.globalAlpha = 1;
    drawGlow(c, '#fcf088', 170, 124, 16, 0.5 + Math.sin(this.t * 0.05) * 0.1);
    const hero = O.SPR.heroStand;
    c.drawImage(hero.n, 38, 150 - hero.h + 1);
    O.drawSpr(c, 'lyre', 49, 132);
    for (let i = 0; i < 3; i++) {
      const tt = (this.t + i * 50) % 150;
      if (tt < 110) note(c, 60 + tt * 0.35 + Math.sin(tt * 0.1) * 3, 124 - tt * 0.4, ['#fcf088', '#fcfcfc', '#80c0fc'][i]);
    }
    drawLogo(c, 'ORPHEUS', ['#fcfcd0', '#fcf088', '#f8d040', '#f8b800', '#e89800', '#c87800', '#a05800'], '#3c0c00', 18, this.t * 1.5);
    const sub = 'SONG OF OLYMPUS';
    const sx = centerX(sub);
    meander(c, 16, 54, sx - 24, GOLD[1]);
    meander(c, sx + sub.length * 8 + 8, 54, W - 16 - (sx + sub.length * 8 + 8), GOLD[1]);
    shadowText(c, sub, sx, 53, '#fcfcfc', '#3c0c00');

    if (this.state === 'press') {
      if ((this.t >> 5) & 1) shadowText(c, 'PRESS START', centerX('PRESS START'), 168, '#fcfcfc', '#1c0818');
    } else {
      panel(c, 76, 158, 104, 38);
      ['NEW GAME', 'CONTINUE'].forEach((o, i) => {
        const y = 167 + i * 14;
        const enabled = i === 0 || this.hasSave;
        const on = this.sel === i;
        shadowText(c, o, 100, y, !enabled ? '#505070' : on ? GOLD[0] : '#c8c8e0');
        if (on) shadowText(c, '>', 88 + ((this.t >> 3) & 1), y, GOLD[1]);
      });
    }
    shadowText(c, 'Z:ATTACK X:JUMP UP:TALK', centerX('Z:ATTACK X:JUMP UP:TALK'), 208, '#c8b8e0', '#000000');
    shadowText(c, 'ENTER:START  M:MUTE', centerX('ENTER:START  M:MUTE'), 219, '#9080b8', '#000000');
    O.text(c, 'A FAN TRIBUTE - 2026', centerX('A FAN TRIBUTE - 2026'), 231, '#5c4c80');
  };

  /* ---------------- story ---------------- */
  const sceneCache = {};
  function sceneBg(name) {
    if (sceneCache[name]) return sceneCache[name];
    const cv = O.makeCanvas(W, 152), g = cv.getContext('2d');
    const bgOf = (theme, off) => {
      const b = O.Tiles.background(theme);
      g.drawImage(b.sky, 0, -40);
      b.layers.forEach((L) => g.drawImage(L.c, -Math.floor(off * L.f), -40));
    };
    const ground = (theme) => {
      for (let x = 0; x < W; x += 16) {
        g.drawImage(O.Tiles.get(theme, 'G', (x >> 4) % 4), x, 136);
        g.drawImage(O.Tiles.tuft(theme, (x >> 4) % 4), x, 132);
      }
    };
    if (name === 'orpheus' || name === 'lovers' || name === 'oath') {
      bgOf('village', name === 'oath' ? 400 : name === 'lovers' ? 150 : 0);
      if (name === 'orpheus') { const t = O.Tiles.decor('olive', 3); g.drawImage(t.c, 170, 137 - t.h); }
      if (name === 'lovers') { const t = O.Tiles.decor('cypress', 2); g.drawImage(t.c, 30, 137 - t.h); g.drawImage(t.c, 210, 137 - t.h); }
      ground('village');
    } else if (name === 'serpent') {
      bgOf('forest', 100);
      const t = O.Tiles.decor('oak', 2); g.drawImage(t.c, 150, 137 - t.h);
      ground('forest');
    } else if (name === 'hades') {
      const p = new O.Pix(W, 152);
      O.bands(p, 0, 0, W, 152, ['#000000', '#0c0004', '#1c0408', '#30080c', '#480c0c', '#681408', '#8c2008']);
      for (let x = 0; x < W; x += 40) {
        for (let y = 20; y < 140; y++) { const w = 7 + Math.sin(y * 0.1 + x) * 2; for (let k = -w; k <= w; k++) p.set(x + 20 + k, y, k < -w + 2 ? '#401010' : '#200808'); }
        p.rect(x + 11, 18, 18, 4, '#401010');
      }
      const th = [['#583848', '#382030', '#1c0c18']];
      p.rect(106, 64, 44, 70, th[0][2]); p.rect(108, 66, 40, 66, th[0][1]); p.rect(108, 66, 40, 2, th[0][0]);
      p.rect(100, 100, 56, 34, th[0][2]); p.rect(102, 102, 52, 30, th[0][1]); p.rect(102, 102, 52, 2, th[0][0]);
      p.rect(112, 104, 32, 8, '#881000'); p.rect(112, 104, 32, 2, '#d82800');
      [[104, 58], [146, 58]].forEach((q) => { p.rect(q[0], q[1], 6, 8, '#f8b800'); p.rect(q[0] + 1, q[1] - 3, 4, 3, '#fcf088'); });
      p.rect(0, 132, W, 20, '#d82800');
      for (let x = 0; x < W; x++) for (let y = 132; y < 152; y++) if (O.bayer(x, y) < (y - 132) / 30) p.set(x, y, '#881000');
      g.drawImage(p.canvas(), 0, 0);
    }
    sceneCache[name] = cv;
    return cv;
  }

  P.drawStory = function (c) {
    if (O.UI && O.UI.drawStory) { try { return O.UI.drawStory(c, this); } catch (e) { O.logOnce('UI.drawStory', e); } }
    const pg = O.STORY[this.page];
    const t = this.storyT;
    c.drawImage(sceneBg(pg.scene), 0, 0);
    const spr = (name, x, feet, flip, white) => { const s = O.SPR[name]; O.drawSpr(c, name, x, feet - s.h + 1, flip, white); };
    switch (pg.scene) {
      case 'orpheus':
        spr('heroStand', 100, 137);
        O.drawSpr(c, 'lyre', 111, 119);
        for (let i = 0; i < 3; i++) {
          const tt = (t + i * 45) % 135;
          note(c, 118 + tt * 0.4, 112 - tt * 0.5, ['#fcf088', '#fcfcfc', '#80c0fc'][i]);
        }
        break;
      case 'lovers':
        spr('heroStand', 104, 137);
        spr('eurydice', 136, 137, true);
        O.drawSpr(c, 'heart', 125, 90 + Math.round(Math.sin(t * 0.08) * 3));
        for (let i = 0; i < 4; i++) { const f = O.Tiles.decor('flowers', i + 1); c.drawImage(f.c, 40 + i * 50, 130); }
        break;
      case 'serpent': {
        const fallen = t > 170;
        if (!fallen) spr('eurydice', 110, 137);
        else {
          c.globalAlpha = Math.max(0.25, 1 - (t - 170) / 120);
          spr('eurydice', 110, 137, false, (t >> 2) & 1);
          c.globalAlpha = 1;
        }
        spr((t >> 3) & 1 ? 'snake1' : 'snake2', Math.max(128, 230 - t * 0.6), 137, true);
        break;
      }
      case 'hades': {
        const cx = 128, cy = 100;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + t * 0.01;
          c.fillStyle = i % 2 ? '#7050e0' : '#382890';
          for (let k = 16; k < 40; k += 2) c.fillRect(Math.round(cx + Math.cos(a) * k), Math.round(cy + Math.sin(a) * k), 1, 1);
        }
        spr('hades', 120, 132);
        for (let x = 0; x < W; x += 8) O.drawSpr(c, ((t >> 3) + x / 8) & 1 ? 'flame1' : 'flame2', x, 126);
        c.globalAlpha = 0.5 + Math.sin(t * 0.1) * 0.2;
        spr('eurydice', 178, 118 + Math.round(Math.sin(t * 0.05) * 3), true, true);
        c.globalAlpha = 1;
        break;
      }
      case 'oath':
        spr('heroStand', 70, 137);
        drawGlow(c, '#fcf088', 150, 64, 20, 0.35 + Math.sin(t * 0.05) * 0.1);
        break;
    }
    panel(c, 6, 156, 244, 78);
    const lines = O.wrap(pg.text, O.TEXT_W);
    let left = this.chars | 0;
    lines.forEach((l, i) => {
      shadowText(c, l.slice(0, Math.max(0, left)), 18, 168 + i * 13);
      left -= l.length;
    });
    if (this.chars >= pg.text.length && (this.t >> 4) & 1) shadowText(c, '>', 232, 220, GOLD[1]);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(W - 98, 4, 94, 12);
    O.text(c, 'START: SKIP', W - 94, 6, '#c8c8e0');
  };

  /* ---------------- game over / ending ---------------- */
  P.drawGameOver = function (c) {
    if (O.UI && O.UI.drawGameOver) { try { return O.UI.drawGameOver(c, this); } catch (e) { O.logOnce('UI.drawGameOver', e); } }
    for (let y = 0; y < H; y += 4) { c.fillStyle = y < 120 ? '#0c0004' : '#1c0408'; c.fillRect(0, y, W, 4); }
    drawLogo(c, 'GAME OVER', ['#fcd8a8', '#fc7050', '#d82800', '#a81000', '#681000'], '#1c0000', 64);
    shadowText(c, 'EURYDICE STILL WAITS...', centerX('EURYDICE STILL WAITS...'), 104, '#c8a8c8');
    panel(c, 56, 132, 144, 44);
    ['CONTINUE', 'RETURN TO TITLE'].forEach((o, i) => {
      const y = 142 + i * 16, on = this.sel === i;
      shadowText(c, o, 78, y, on ? GOLD[0] : '#c8c8e0');
      if (on) shadowText(c, '>', 66 + ((this.t >> 3) & 1), y, GOLD[1]);
    });
  };

  P.drawEnding = function (c) {
    if (O.UI && O.UI.drawEnding) { try { return O.UI.drawEnding(c, this); } catch (e) { O.logOnce('UI.drawEnding', e); } }
    if (!titleBg) buildTitle();
    c.drawImage(titleBg, 0, 0);
    c.fillStyle = 'rgba(8,4,24,0.5)'; c.fillRect(0, 0, W, H);
    const hero = O.SPR.heroStand;
    drawGlow(c, '#fcf088', 128, 36, 22, 0.4);
    c.drawImage(hero.n, 128 - hero.w / 2, 54 - hero.h + 1);
    O.drawSpr(c, 'iconSandals', 124, 10 + Math.round(Math.sin(this.t * 0.1) * 2));
    panel(c, 12, 62, 232, 132);
    O.ENDING.forEach((l, i) => {
      if (this.endT > i * 40) shadowText(c, l.t, centerX(l.t), 74 + i * 14, l.c);
    });
    if (this.endT > O.ENDING.length * 40 + 60 && (this.t >> 5) & 1) shadowText(c, 'PRESS START', centerX('PRESS START'), 206, '#fcfcfc');
  };
})(window.OLY);
