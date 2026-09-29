/* game.js — game states, world, HUD, dialogue, saving, title/story/ending screens */
(function (O) {
  'use strict';
  const T = O.TILE, VY = O.HUD_H, VIEW_H = O.ROWS * T, W = O.W;
  const SOLID = { G: 1, D: 1, B: 1 };
  const SAVE_KEY = 'orpheus_song_of_olympus_v1';
  const TEXT_W = 28;

  /* ---------- Level ---------- */
  class Level {
    constructor(id) {
      const def = O.LEVEL_DEFS[id];
      this.id = id; this.def = def; this.name = def.name; this.theme = def.theme;
      const b = O.levelBuilder(def.w);
      def.build(b);
      this.tiles = b.t; this.w = def.w; this.h = O.ROWS;
      this.pxW = this.w * T; this.pxH = this.h * T;
      this.canvas = null; this.dirty = true;
    }
    tile(tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h ? '.' : this.tiles[ty][tx]; }
    isSolid(tx, ty) {
      if (tx < 0 || tx >= this.w) return ty < this.h;
      if (ty < 0 || ty >= this.h) return false;
      return !!SOLID[this.tiles[ty][tx]];
    }
    isOneWay(tx, ty) { return this.tile(tx, ty) === 'P'; }
    isHazard(tx, ty) { return this.tile(tx, ty) === 'X'; }
    setTile(tx, ty, ch) { if (this.tile(tx, ty) !== ch && tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) { this.tiles[ty][tx] = ch; this.dirty = true; } }
    render() {
      if (!this.dirty) return this.canvas;
      if (!this.canvas) this.canvas = O.makeCanvas(this.pxW, this.pxH);
      const g = this.canvas.getContext('2d');
      g.clearRect(0, 0, this.pxW, this.pxH);
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          const ch = this.tiles[y][x];
          if (ch === '.') continue;
          const img = O.Tiles.get(this.theme, ch);
          if (img) g.drawImage(img, x * T, y * T);
        }
      }
      this.dirty = false;
      return this.canvas;
    }
  }

  function newState() {
    return { hp: 12, maxHp: 12, olives: 0, ambrosia: 0, items: { club: false, sandals: false }, flags: {} };
  }

  /* ---------- Game ---------- */
  class Game {
    constructor(ctx) {
      this.ctx = ctx;
      this.I = O.Input;
      this.t = 0;
      this.state = 'press';
      this.sel = 0;
      this.cam = 0; this.shake = 0;
      this.dialog = null; this.trans = null;
      this.player = new O.Player();
      this.enemies = []; this.npcs = []; this.pickups = []; this.fx = [];
      this.st = newState();
      this.hasSave = !!this.readSave();
      const r = O.rng(5);
      this.stars = Array.from({ length: 60 }, () => [(r() * 256) | 0, (r() * 240) | 0, r() < 0.2]);
    }

    sfx(n) { O.Audio.sfx(n); }
    music(n, next) { O.Audio.play(n, next); }

    /* ----- saving ----- */
    readSave() {
      try {
        const d = JSON.parse(localStorage.getItem(SAVE_KEY));
        return d && d.v === 1 && O.LEVEL_DEFS[d.level] ? d : null;
      } catch (e) { return null; }
    }
    save(spawn) {
      const p = this.player;
      const data = { v: 1, st: this.st, level: this.lvl.id, spawn: spawn || { x: p.x, feet: p.y + p.h } };
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); this.hasSave = true; } catch (e) { /* storage blocked */ }
    }
    loadSave() {
      const d = this.readSave();
      if (!d) { this.startNew(false); return; }
      this.st = Object.assign(newState(), d.st);
      this.st.items = Object.assign({ club: false, sandals: false }, d.st.items);
      this.st.flags = Object.assign({}, d.st.flags);
      this.st.hp = this.st.maxHp;
      this.state = 'play';
      this.loadLevel(d.level, d.spawn);
      this.fadeIn();
    }
    // Continue from the last temple save; without one, restart in the village keeping items.
    continueAfterDeath() {
      if (this.hasSave) { this.loadSave(); return; }
      this.st.hp = this.st.maxHp;
      this.state = 'play';
      this.loadLevel('village', { tx: 5, row: 11 });
    }
    startNew(withStory) {
      this.st = newState();
      if (withStory) {
        this.state = 'story'; this.page = 0; this.chars = 0; this.storyT = 0;
        this.music('title');
        return;
      }
      this.state = 'play';
      this.loadLevel('village', { tx: 5, row: 11 });
      this.fadeIn();
    }

    /* ----- levels ----- */
    loadLevel(id, spawn) {
      const lvl = this.lvl = new Level(id);
      const d = lvl.def;
      this.enemies = []; this.pickups = []; this.fx = []; this.npcs = [];
      this.bossActive = false; this.dialog = null;
      const x = spawn.x !== undefined ? spawn.x : spawn.tx * T + 3;
      const feet = spawn.feet !== undefined ? spawn.feet : spawn.row * T;
      this.player.place(x, feet);
      (d.npcs || []).forEach((n) => this.npcs.push(new O.NPC(n)));
      (d.enemies || []).forEach((e) => { const en = O.makeEnemy(e); if (en) this.enemies.push(en); });
      (d.items || []).forEach((it) => this.pickups.push(new O.Pickup(it.kind, it.tx * T + 4, it.row * T - 8, 0, Infinity)));
      this.music(d.music);
      if (d.onEnter) d.onEnter(this);
      this.updateCamera(true);
      this.banner = 150;
    }
    openDenDoor() {
      for (let y = 8; y <= 10; y++) for (let x = 17; x <= 18; x++) this.lvl.setTile(x, y, 'n');
    }
    goto(id, spawn) {
      this.sfx('door');
      this.trans = { t: 0, dir: 1, cb: () => this.loadLevel(id, spawn) };
    }
    fadeIn() { this.trans = { t: 16, dir: -1, cb: null }; }
    toEnding() {
      this.trans = { t: 0, dir: 1, cb: () => { this.state = 'ending'; this.endT = 0; this.music('temple'); } };
    }

    /* ----- dialogue ----- */
    buildPages(texts, maxLast) {
      const pages = [];
      (Array.isArray(texts) ? texts : [texts]).forEach((txt) => {
        const lines = O.wrap(txt, TEXT_W);
        for (let i = 0; i < lines.length; i += 4) pages.push(lines.slice(i, i + 4));
      });
      if (maxLast && pages.length && pages[pages.length - 1].length > maxLast) {
        const last = pages.pop();
        pages.push(last.slice(0, maxLast), last.slice(maxLast));
      }
      return pages;
    }
    say(speaker, texts, next) {
      this.dialog = { speaker, pages: this.buildPages(texts), page: 0, chars: 0, next: next || null, choice: null };
    }
    ask(speaker, text, options, cb) {
      this.dialog = { speaker, pages: this.buildPages(text, 3), page: 0, chars: 0, next: null, choice: { options, sel: 0, cb } };
    }
    updateDialog() {
      const d = this.dialog, I = this.I;
      const page = d.pages[d.page];
      const total = page.join('').length;
      const confirm = I.pressed.jump || I.pressed.attack;
      if (d.chars < total) {
        const before = d.chars | 0;
        d.chars += 1;
        if ((d.chars | 0) !== before && (d.chars | 0) % 3 === 0) this.sfx('blip');
        if (confirm) d.chars = total;
        return;
      }
      if (d.choice && d.page === d.pages.length - 1) {
        if (I.pressed.left || I.pressed.right || I.pressed.up || I.pressed.down) {
          d.choice.sel = (d.choice.sel + 1) % d.choice.options.length;
          this.sfx('blip');
        }
        if (confirm || I.pressed.start) {
          const cb = d.choice.cb, sel = d.choice.sel;
          this.dialog = null;
          this.sfx('select');
          cb(sel);
        }
        return;
      }
      if (confirm || I.pressed.start) {
        d.page++; d.chars = 0;
        if (d.page >= d.pages.length) {
          const nx = d.next;
          this.dialog = null;
          if (nx) nx();
        }
      }
    }
    giveItem(key, next) {
      const st = this.st;
      if (key === 'club') st.items.club = true;
      if (key === 'sandals') st.items.sandals = true;
      if (key === 'blessing') { st.maxHp += 4; st.hp = st.maxHp; }
      this.state = 'itemget'; this.itemT = 130; this.itemKey = key; this.itemNext = next;
      this.music('fanfare', this.lvl.def.music || O.Audio.songName || null);
    }

    /* ----- effects ----- */
    puff(x, y) { this.fx.push({ type: 'puff', x, y, t: 0 }); }
    spark(x, y) { this.fx.push({ type: 'spark', x, y, t: 0 }); }
    debris(x, y) {
      for (let i = 0; i < 4; i++) this.fx.push({ type: 'bit', x, y, vx: (i - 1.5) * 0.8, vy: -2 - Math.random(), t: 0 });
    }
    popText(x, y, text, color) { this.fx.push({ type: 'text', x, y, text, color, t: 0 }); }
    drop(e) {
      if (Math.random() < e.dropChance) {
        for (let i = 0; i < e.olives; i++) this.pickups.push(new O.Pickup('olive', e.x + e.w / 2 - 4, e.y + e.h / 2 - 4, -2 - Math.random() * 1.5));
      }
      if (Math.random() < 0.08) this.pickups.push(new O.Pickup('pom', e.x + e.w / 2 - 4, e.y, -2.5));
    }
    collect(pk) {
      const st = this.st, p = this.player;
      if (pk.kind === 'olive') { st.olives = Math.min(999, st.olives + 1); this.sfx('olive'); }
      else if (pk.kind === 'pom') { st.hp = Math.min(st.maxHp, st.hp + 4); this.sfx('life'); this.popText(p.x, p.y - 6, '+4', '#d82800'); }
      else if (pk.kind === 'ambrosia') { st.ambrosia = Math.min(3, st.ambrosia + 1); this.sfx('buy'); }
    }

    /* ----- events ----- */
    onPit() {
      const p = this.player;
      this.st.hp = Math.max(0, this.st.hp - 2);
      this.sfx('hurt');
      if (this.st.hp > 0 && p.safe) { p.place(p.safe.x, p.safe.feet); p.inv = 80; }
    }
    onBossDefeated(boss) {
      this.st.flags.boarDefeated = true;
      this.bossActive = false;
      this.openDenDoor();
      this.pickups.push(new O.Pickup('ambrosia', boss.x + boss.w / 2 - 4, boss.y, -3, Infinity));
      this.music('fanfare', 'temple');
      this.say('', ['THE ERYMANTHIAN BOAR HAS FALLEN! A PASSAGE HAS OPENED TO THE EAST.'], () => this.save({ tx: 10, row: 11 }));
    }
    die() {
      this.state = 'dying'; this.dieT = 0;
      this.music(null);
      this.sfx('die');
    }

    /* ---------- UPDATE ---------- */
    update() {
      this.t++;
      if (this.trans) { this.updateTrans(); return; }
      const I = this.I;
      switch (this.state) {
        case 'press':
          if (I.pressed.start || I.pressed.jump || I.pressed.attack) {
            O.Audio.init();
            this.state = 'title'; this.sel = this.hasSave ? 1 : 0;
            this.music('title'); this.sfx('select');
          }
          break;
        case 'title':
          if (this.hasSave && (I.pressed.up || I.pressed.down)) { this.sel = 1 - this.sel; this.sfx('blip'); }
          if (I.pressed.start || I.pressed.jump || I.pressed.attack) {
            this.sfx('select');
            if (this.sel === 1 && this.hasSave) this.trans = { t: 0, dir: 1, cb: () => this.loadSave() };
            else this.trans = { t: 0, dir: 1, cb: () => this.startNew(true) };
          }
          break;
        case 'story': this.updateStory(); break;
        case 'play': this.updatePlay(); break;
        case 'itemget':
          if (--this.itemT <= 0) {
            this.state = 'play';
            const it = O.ITEMS[this.itemKey];
            this.say('', ['YOU RECEIVED ' + it.name + '! ' + it.desc], this.itemNext);
          }
          break;
        case 'pause': this.updatePause(); break;
        case 'dying':
          this.dieT++;
          if (this.dieT > 110) { this.state = 'gameover'; this.sel = 0; this.music('gameover'); }
          break;
        case 'gameover':
          if (I.pressed.up || I.pressed.down) { this.sel = 1 - this.sel; this.sfx('blip'); }
          if (I.pressed.start || I.pressed.jump || I.pressed.attack) {
            this.sfx('select');
            if (this.sel === 0) this.trans = { t: 0, dir: 1, cb: () => this.continueAfterDeath() };
            else this.trans = { t: 0, dir: 1, cb: () => { this.state = 'title'; this.sel = this.hasSave ? 1 : 0; this.music('title'); } };
          }
          break;
        case 'ending':
          this.endT++;
          if (this.endT > O.ENDING.length * 40 + 60 && (I.pressed.start || I.pressed.jump)) {
            this.trans = { t: 0, dir: 1, cb: () => { this.state = 'title'; this.sel = 1; this.music('title'); } };
          }
          break;
      }
    }

    updateTrans() {
      const tr = this.trans;
      tr.t += tr.dir;
      if (tr.dir > 0 && tr.t >= 16) {
        if (tr.cb) tr.cb();
        tr.cb = null; tr.dir = -1; tr.t = 16;
      } else if (tr.dir < 0 && tr.t <= 0) {
        this.trans = null;
      }
    }

    updateStory() {
      const I = this.I;
      const pg = O.STORY[this.page];
      const len = pg.text.length;
      this.storyT++;
      if (I.pressed.start) { this.trans = { t: 0, dir: 1, cb: () => this.startNew(false) }; return; }
      if (this.chars < len) {
        this.chars += 0.7;
        if (I.pressed.jump || I.pressed.attack) this.chars = len;
        return;
      }
      if (I.pressed.jump || I.pressed.attack) {
        this.sfx('select');
        if (this.page < O.STORY.length - 1) {
          this.trans = { t: 0, dir: 1, cb: () => { this.page++; this.chars = 0; this.storyT = 0; } };
        } else {
          this.trans = { t: 0, dir: 1, cb: () => this.startNew(false) };
        }
      }
    }

    updatePause() {
      const I = this.I, st = this.st;
      if (I.pressed.start) { this.state = 'play'; this.sfx('pause'); return; }
      if (I.pressed.attack && st.ambrosia > 0 && st.hp < st.maxHp) {
        st.ambrosia--;
        st.hp = Math.min(st.maxHp, st.hp + 8);
        this.sfx('life');
      }
    }

    updatePlay() {
      if (this.dialog) { this.updateDialog(); return; }
      const I = this.I, p = this.player, lvl = this.lvl, st = this.st;
      if (I.pressed.start) { this.state = 'pause'; this.sfx('pause'); return; }
      if (this.banner > 0) this.banner--;
      if (this.shake > 0) this.shake--;

      p.update(this);
      this.npcs.forEach((n) => n.update(this));

      const ab = p.attackBox();
      for (const e of this.enemies) {
        e.update(this);
        if (e.remove) continue;
        if (ab && O.overlap(ab, e)) e.hit(this, 1, p.facing, p.swingId);
        if (e.harmful() && p.inv === 0 && O.overlap(p, e)) p.hurt(this, e.contactDmg(), e.x + e.w / 2);
      }
      this.enemies = this.enemies.filter((e) => !e.remove);

      for (const pk of this.pickups) {
        pk.update(this);
        if (!pk.remove && O.overlap(p, pk)) { pk.remove = true; this.collect(pk); }
      }
      this.pickups = this.pickups.filter((pk) => !pk.remove);

      this.fx.forEach((f) => {
        f.t++;
        if (f.type === 'bit') { f.x += f.vx; f.y += f.vy; f.vy += 0.2; }
        if (f.type === 'text') f.y -= 0.5;
      });
      this.fx = this.fx.filter((f) => f.t < (f.type === 'puff' ? 20 : f.type === 'spark' ? 8 : 40));

      if (st.hp <= 0) { this.die(); return; }

      // Talk / doors (press UP while standing)
      if (I.pressed.up && p.onGround) {
        const npc = this.npcs.find((n) => n.near(p));
        if (npc && O.TALK[npc.kind]) { O.TALK[npc.kind](this); return; }
        const ex = (lvl.def.exits || []).find((e) => e.type === 'door' && (!e.when || e.when(this)) &&
          O.overlap(p, { x: e.tx * T, y: e.ty * T, w: e.tw * T, h: e.th * T }));
        if (ex) { this.goto(ex.to, ex.spawn); return; }
      }
      // Screen-edge exits
      for (const e of lvl.def.exits || []) {
        if (e.type !== 'edge') continue;
        const atEdge = e.side === 'right' ? p.x + p.w >= lvl.pxW - 0.5 && I.down.right : p.x <= 0.5 && I.down.left;
        if (!atEdge) continue;
        if (e.needs && !st.items[e.needs]) {
          p.x = e.side === 'right' ? lvl.pxW - p.w - 12 : 12;
          this.say('', ['THE FOREST IS TOO DANGEROUS WITHOUT A WEAPON. TALK TO THE ELDER FIRST.']);
          return;
        }
        this.goto(e.to, e.spawn);
        return;
      }
      this.updateCamera(false);
    }

    updateCamera() {
      const p = this.player, lvl = this.lvl;
      this.cam = Math.round(O.clamp(p.x + p.w / 2 - W / 2, 0, Math.max(0, lvl.pxW - W)));
    }

    /* ---------- DRAW ---------- */
    draw() {
      const c = this.ctx;
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, O.H);
      switch (this.state) {
        case 'press': case 'title': this.drawTitle(c); break;
        case 'story': this.drawStory(c); break;
        case 'play': case 'itemget': case 'dying': this.drawWorld(c); this.drawHUD(c); if (this.dialog) this.drawDialog(c); break;
        case 'pause': this.drawWorld(c); this.drawHUD(c); this.drawPause(c); break;
        case 'gameover': this.drawGameOver(c); break;
        case 'ending': this.drawEnding(c); break;
      }
      if (this.trans) {
        const a = Math.min(4, Math.floor(this.trans.t / 4)) / 4;
        if (a > 0) { c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.fillRect(0, 0, W, O.H); }
      }
    }

    drawWorld(c) {
      const lvl = this.lvl;
      c.save();
      c.beginPath(); c.rect(0, VY, W, VIEW_H); c.clip();
      if (this.shake > 0) c.translate(((this.t >> 1) & 1 ? 2 : -2), ((this.t >> 2) & 1 ? 1 : -1));
      const bg = O.Tiles.parallax(lvl.theme);
      const off = Math.floor(this.cam * 0.3) % 512;
      c.drawImage(bg, -off, VY); c.drawImage(bg, 512 - off, VY);
      c.drawImage(lvl.render(), this.cam, 0, W, VIEW_H, 0, VY, W, VIEW_H);
      (lvl.def.decor || []).forEach((d) => {
        const x = d.tx * T + 4 - this.cam, y = d.row * T - 8 + VY;
        O.drawSpr(c, 'brazier', x, y);
        O.drawSpr(c, (this.t >> 3) & 1 ? 'flame1' : 'flame2', x, y - 8);
      });
      this.npcs.forEach((n) => n.draw(c, this));
      this.pickups.forEach((pk) => pk.draw(c, this));
      this.enemies.forEach((e) => e.draw(c, this));
      if (this.state === 'dying') this.drawDeath(c);
      else if (this.state === 'itemget') this.drawItemGet(c);
      else this.player.draw(c, this);
      this.drawFx(c);
      if (this.banner > 0 && this.banner < 140 && !this.dialog) {
        const name = lvl.name, w = name.length * 8 + 16, x = (W - w) / 2;
        c.fillStyle = '#000000'; c.fillRect(x, VY + 12, w, 16);
        O.text(c, name, x + 8, VY + 16, '#f8b800');
      }
      const boss = this.enemies.find((e) => e instanceof O.Boar);
      if (boss && boss.state !== 'wait') {
        O.text(c, 'BOAR', 8, VY + 194, '#fcfcfc');
        for (let i = 0; i < boss.maxHp; i++) {
          c.fillStyle = i < boss.hp ? '#f8b800' : '#503000';
          c.fillRect(48 + i * 4, VY + 194, 3, 7);
        }
      }
      c.restore();
    }

    drawItemGet(c) {
      const p = this.player;
      const sx = Math.round(p.x - 3 - this.cam), sy = Math.round(p.y + p.h - 24) + VY;
      O.drawSpr(c, 'heroStand', sx, sy, p.facing < 0);
      const it = O.ITEMS[this.itemKey];
      const bob = Math.round(Math.sin(this.t * 0.2) * 2);
      O.drawSpr(c, it.icon, sx + 4, sy - 12 + bob);
      if ((this.t >> 2) & 1) {
        c.fillStyle = '#fcfcfc';
        c.fillRect(sx + 2, sy - 14, 1, 1); c.fillRect(sx + 13, sy - 8, 1, 1); c.fillRect(sx + 8, sy - 16, 1, 1);
      }
    }

    drawDeath(c) {
      const p = this.player;
      const sx = Math.round(p.x - 3 - this.cam), sy = Math.round(p.y + p.h - 24) + VY;
      if (this.dieT < 60) {
        const faces = [1, -1];
        O.drawSpr(c, 'heroStand', sx, sy, faces[(this.dieT >> 3) & 1] < 0, (this.dieT >> 1) & 1);
      } else {
        O.drawSpr(c, 'heroCrouch', sx, sy + 8, p.facing < 0, false);
      }
    }

    drawFx(c) {
      this.fx.forEach((f) => {
        const x = Math.round(f.x - this.cam), y = Math.round(f.y) + VY;
        if (f.type === 'puff') {
          const r = 3 + f.t * 0.6;
          c.fillStyle = f.t < 10 ? '#fcfcfc' : '#bcbcbc';
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            c.fillRect(Math.round(x + Math.cos(a) * r) - 1, Math.round(y + Math.sin(a) * r) - 1, 3, 3);
          }
        } else if (f.type === 'spark') {
          c.fillStyle = '#f8b800';
          c.fillRect(x - 4, y, 9, 1); c.fillRect(x, y - 4, 1, 9);
          c.fillStyle = '#fcfcfc'; c.fillRect(x - 1, y - 1, 3, 3);
        } else if (f.type === 'bit') {
          c.fillStyle = '#7c7c7c'; c.fillRect(x, y, 2, 2);
        } else if (f.type === 'text') {
          O.text(c, f.text, x, y, f.color);
        }
      });
    }

    drawHUD(c) {
      const st = this.st;
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, VY);
      O.text(c, 'LIFE', 8, 6, '#fcfcfc');
      for (let i = 0; i < st.maxHp; i++) {
        c.fillStyle = i < st.hp ? '#d82800' : '#503000';
        c.fillRect(44 + i * 4, 6, 3, 7);
      }
      O.drawSpr(c, 'olive', 152, 5);
      O.text(c, 'X' + O.pad(st.olives, 3), 162, 6);
      O.drawSpr(c, 'ambrosia', 152, 17);
      O.text(c, 'X' + st.ambrosia, 162, 18);
      O.text(c, this.lvl.name.slice(0, 17), 8, 18, '#f8b800');
      if (st.items.club) O.drawSpr(c, 'iconClub', 218, 11);
      if (st.items.sandals) O.drawSpr(c, 'iconSandals', 234, 11);
      c.fillStyle = '#7c7c7c';
      c.fillRect(212, 8, 1, 14); c.fillRect(212, 8, 36, 1); c.fillRect(247, 8, 1, 14); c.fillRect(212, 21, 36, 1);
    }

    drawBox(c, x, y, w, h) {
      c.fillStyle = '#000000'; c.fillRect(x, y, w, h);
      c.fillStyle = '#fcfcfc';
      c.fillRect(x + 2, y + 2, w - 4, 1); c.fillRect(x + 2, y + h - 3, w - 4, 1);
      c.fillRect(x + 2, y + 2, 1, h - 4); c.fillRect(x + w - 3, y + 2, 1, h - 4);
      c.fillStyle = '#7c7c7c';
      c.fillRect(x + 4, y + 4, w - 8, 1); c.fillRect(x + 4, y + h - 5, w - 8, 1);
      c.fillRect(x + 4, y + 4, 1, h - 8); c.fillRect(x + w - 5, y + 4, 1, h - 8);
    }

    drawDialog(c) {
      const d = this.dialog;
      const x = 8, y = 162, w = 240, h = 72;
      this.drawBox(c, x, y, w, h);
      if (d.speaker) {
        const sw = d.speaker.length * 8 + 8;
        c.fillStyle = '#000000'; c.fillRect(x + 10, y - 2, sw, 10);
        O.text(c, d.speaker, x + 14, y - 1, '#f8b800');
      }
      const page = d.pages[d.page];
      let left = d.chars | 0;
      page.forEach((line, i) => {
        const shown = line.slice(0, Math.max(0, left));
        left -= line.length;
        O.text(c, shown, x + 12, y + 12 + i * 12, '#fcfcfc');
      });
      const total = page.join('').length;
      if (d.chars >= total) {
        if (d.choice && d.page === d.pages.length - 1) {
          const oy = y + 12 + 3 * 12;
          d.choice.options.forEach((o, i) => {
            const ox = x + 36 + i * 80;
            if (i === d.choice.sel) O.text(c, '>', ox - 10, oy, '#f8b800');
            O.text(c, o, ox, oy, i === d.choice.sel ? '#f8b800' : '#fcfcfc');
          });
        } else if ((this.t >> 4) & 1) {
          c.fillStyle = '#fcfcfc';
          c.fillRect(x + w - 16, y + h - 12, 5, 1); c.fillRect(x + w - 15, y + h - 11, 3, 1); c.fillRect(x + w - 14, y + h - 10, 1, 1);
        }
      }
    }

    drawPause(c) {
      const st = this.st;
      this.drawBox(c, 16, 40, 224, 184);
      O.textCenter(c, '- STATUS -', 52, '#f8b800');
      O.text(c, 'LIFE', 32, 72); O.text(c, st.hp + '/' + st.maxHp, 128, 72, '#d82800');
      O.text(c, 'OLIVES', 32, 86); O.text(c, String(st.olives), 128, 86, '#58d854');
      O.text(c, 'AMBROSIA', 32, 100); O.text(c, st.ambrosia + '/3', 128, 100, '#f8b800');
      O.text(c, 'TREASURES', 32, 118, '#3cbcfc');
      let ix = 32;
      ['club', 'sandals'].forEach((k) => {
        if (!st.items[k]) return;
        O.drawSpr(c, O.ITEMS[k].icon, ix, 132);
        ix += 16;
      });
      if (ix === 32) O.text(c, 'NONE', 32, 132, '#7c7c7c');
      O.text(c, 'QUEST', 32, 150, '#3cbcfc');
      O.wrap(O.questHint(st), 24).forEach((l, i) => O.text(c, l, 32, 162 + i * 10));
      if (st.ambrosia > 0) O.text(c, 'B: DRINK AMBROSIA (+8)', 32, 196, st.hp < st.maxHp ? '#fcfcfc' : '#7c7c7c');
      O.text(c, 'START: RESUME', 32, 208, '#7c7c7c');
    }

    drawStars(c) {
      this.stars.forEach((s) => {
        c.fillStyle = s[2] && ((this.t + s[0]) >> 5) & 1 ? '#fcfcfc' : '#7c7c7c';
        c.fillRect(s[0], s[1], 1, 1);
      });
    }

    drawTitle(c) {
      this.drawStars(c);
      for (let y = 24; y < 208; y += 16) {
        const ch = y === 24 ? 'c' : y === 192 ? 'b' : 'C';
        c.drawImage(O.Tiles.get('temple', ch), 8, y);
        c.drawImage(O.Tiles.get('temple', ch), 232, y);
      }
      O.textCenter(c, 'ORPHEUS', 28 + 2, '#881400', 3);
      O.text(c, 'ORPHEUS', (W - 168) / 2, 28, '#f8b800', 3);
      O.textCenter(c, '- SONG OF OLYMPUS -', 60, '#fcfcfc');
      for (let x = 96; x < 160; x += 16) c.drawImage(O.Tiles.get('temple', 'B'), x, 124);
      O.drawSpr(c, 'heroStand', 112, 76, false, false, 2);
      if (this.state === 'press') {
        if ((this.t >> 5) & 1) O.textCenter(c, 'PRESS START', 152, '#fcfcfc');
      } else {
        const opts = ['NEW GAME', 'CONTINUE'];
        opts.forEach((o, i) => {
          const y = 148 + i * 14;
          const enabled = i === 0 || this.hasSave;
          O.text(c, o, 96, y, !enabled ? '#7c7c7c' : this.sel === i ? '#f8b800' : '#fcfcfc');
          if (this.sel === i) O.text(c, '>', 84, y, '#f8b800');
        });
      }
      O.textCenter(c, 'Z:ATTACK  X:JUMP', 180, '#bcbcbc');
      O.textCenter(c, 'UP:TALK/DOOR', 192, '#bcbcbc');
      O.textCenter(c, 'ENTER:START  M:MUTE', 204, '#7c7c7c');
      O.textCenter(c, 'A FAN TRIBUTE - 2026', 222, '#7c7c7c');
    }

    drawStory(c) {
      const pg = O.STORY[this.page];
      const t = this.storyT;
      const ground = (theme, ch, y) => { for (let x = 0; x < W; x += 16) c.drawImage(O.Tiles.get(theme, ch), x, y); };
      this.drawStars(c);
      switch (pg.scene) {
        case 'orpheus':
          c.drawImage(O.Tiles.parallax('village'), 0, 60, 256, 88, 0, 60, 256, 88);
          ground('village', 'G', 132);
          O.drawSpr(c, 'heroStand', 120, 108);
          break;
        case 'lovers':
          ground('village', 'G', 132);
          O.drawSpr(c, 'heroStand', 104, 108);
          O.drawSpr(c, 'eurydice', 136, 108, true);
          O.drawSpr(c, 'heart', 124, 88 + Math.round(Math.sin(t * 0.08) * 3));
          break;
        case 'serpent': {
          ground('village', 'G', 132);
          const sx = Math.max(150, 230 - t * 0.5);
          O.drawSpr(c, 'eurydice', 124, 108, false, t > 170 && (t >> 2) & 1);
          O.drawSpr(c, (t >> 3) & 1 ? 'snake1' : 'snake2', sx, 124, true);
          break;
        }
        case 'hades':
          c.fillStyle = '#a81000'; c.fillRect(0, 120, W, 28);
          for (let x = 0; x < W; x += 8) O.drawSpr(c, ((t >> 3) + x / 8) & 1 ? 'flame1' : 'flame2', x, 112);
          O.drawSpr(c, 'hades', 112, 64, false, false, 2);
          if ((t >> 1) & 1) O.drawSpr(c, 'eurydice', 170, 84 + Math.round(Math.sin(t * 0.05) * 3), true, true);
          break;
        case 'oath':
          c.drawImage(O.Tiles.parallax('village'), 100, 40, 256, 108, 0, 40, 256, 108);
          ground('village', 'G', 132);
          O.drawSpr(c, 'heroStand', 60, 108);
          break;
      }
      this.drawBox(c, 8, 156, 240, 76);
      const lines = O.wrap(pg.text, TEXT_W);
      let left = this.chars | 0;
      lines.forEach((l, i) => {
        O.text(c, l.slice(0, Math.max(0, left)), 20, 168 + i * 12);
        left -= l.length;
      });
      if (this.chars >= pg.text.length && (this.t >> 4) & 1) O.text(c, '>', 232, 220, '#f8b800');
      O.text(c, 'START: SKIP', 164, 8, '#7c7c7c');
    }

    drawGameOver(c) {
      this.drawStars(c);
      O.textCenter(c, 'GAME OVER', 80, '#d82800', 2);
      O.textCenter(c, 'EURYDICE STILL WAITS...', 110, '#bcbcbc');
      ['CONTINUE', 'RETURN TO TITLE'].forEach((o, i) => {
        const y = 144 + i * 16;
        O.text(c, o, 72, y, this.sel === i ? '#f8b800' : '#fcfcfc');
        if (this.sel === i) O.text(c, '>', 60, y, '#f8b800');
      });
    }

    drawEnding(c) {
      this.drawStars(c);
      O.drawSpr(c, 'heroStand', 112, 20, false, false, 2);
      O.drawSpr(c, 'iconSandals', 124, 8 + Math.round(Math.sin(this.t * 0.1) * 2));
      O.ENDING.forEach((l, i) => {
        if (this.endT > i * 40) O.textCenter(c, l.t, 84 + i * 14, l.c);
      });
      if (this.endT > O.ENDING.length * 40 + 60 && (this.t >> 5) & 1) O.textCenter(c, 'PRESS START', 216, '#7c7c7c');
    }
  }

  O.Game = Game;
})(window.OLY);
