/* game.js — game states, levels, dialogue, saving and game logic (drawing lives in render.js) */
(function (O) {
  'use strict';
  const T = O.TILE, W = O.W;
  const SOLID = { G: 1, D: 1, B: 1 };
  const SAVE_KEY = 'orpheus_song_of_olympus_v1';
  O.TEXT_W = 27;

  /* ---------- Level ---------- */
  class Level {
    constructor(id) {
      const def = O.LEVEL_DEFS[id];
      this.id = id; this.def = def; this.name = def.name; this.theme = def.theme;
      const b = O.levelBuilder(def.w);
      def.build(b);
      this.tiles = b.t; this.w = def.w; this.h = O.ROWS;
      this.pxW = this.w * T; this.pxH = this.h * T;
      this.canvas = null; this.front = null; this.dirty = true;
    }
    tile(tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h ? '.' : this.tiles[ty][tx]; }
    isSolid(tx, ty) {
      if (tx < 0 || tx >= this.w) return ty < this.h;
      if (ty < 0 || ty >= this.h) return false;
      return !!SOLID[this.tiles[ty][tx]];
    }
    isOneWay(tx, ty) { return this.tile(tx, ty) === 'P'; }
    isHazard(tx, ty) { return this.tile(tx, ty) === 'X'; }
    setTile(tx, ty, ch) {
      if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h && this.tiles[ty][tx] !== ch) { this.tiles[ty][tx] = ch; this.dirty = true; }
    }
    render() {
      if (!this.dirty) return this.canvas;
      if (!this.canvas) { this.canvas = O.makeCanvas(this.pxW, this.pxH); this.front = O.makeCanvas(this.pxW, this.pxH); }
      O.renderLevel(this);
      this.dirty = false;
      return this.canvas;
    }
  }
  O.Level = Level;

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
      this.cam = 0; this.shake = 0; this.flash = 0; this.hitstop = 0;
      this.dialog = null; this.trans = null;
      this.player = new O.Player();
      this.enemies = []; this.npcs = []; this.pickups = []; this.fx = []; this.amb = [];
      this.st = newState();
      this.hasSave = !!this.readSave();
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
    }
    continueAfterDeath() {
      if (this.hasSave) { this.loadSave(); return; }
      this.st.hp = this.st.maxHp;
      this.state = 'play';
      this.loadLevel('village', { tx: 5, row: 11 });
    }
    startNew(withStory) {
      this.st = newState();
      // HD: the opening is the cinematic cutscene (CS1-CS5); the old story pages stay as fallback.
      // First game on this browser: after the opening, show HOW TO PLAY once.
      const afterOpening = () => {
        this.startNew(false);
        if (O.Settings && !O.Settings.seenHowto) { O.Settings.seenHowto = true; O.Settings.save(); this.openMenu('howto', 'play'); }
      };
      if (withStory && O.Cutscene && O.Cutscene.start(this, ['cs1', 'cs2', 'cs3', 'cs4', 'cs5'], afterOpening)) return;
      if (withStory) {
        this.state = 'story'; this.page = 0; this.chars = 0; this.storyT = 0;
        this.music('title');
        return;
      }
      this.state = 'play';
      this.loadLevel('village', { tx: 5, row: 11 });
    }

    /* ----- levels ----- */
    loadLevel(id, spawn) {
      const lvl = this.lvl = new Level(id);
      const d = lvl.def;
      this.enemies = []; this.pickups = []; this.fx = []; this.npcs = []; this.amb = [];
      this.bossActive = false; this.dialog = null;
      const x = spawn.x !== undefined ? spawn.x : spawn.tx * T + 3;
      const feet = spawn.feet !== undefined ? spawn.feet : spawn.row * T;
      this.player.place(x, feet);
      (d.npcs || []).forEach((n) => this.npcs.push(new O.NPC(n)));
      (d.enemies || []).forEach((e) => { const en = O.makeEnemy(e); if (en) this.enemies.push(en); });
      (d.items || []).forEach((it) => this.pickups.push(new O.Pickup(it.kind, it.tx * T + 4, it.row * T - 8, 0, Infinity)));
      this.music(d.music);
      if (d.onEnter) d.onEnter(this);
      this.look = this.player.facing * 28;
      this.updateCamera(true);
      this.banner = 150;
      if (O.Cutscene && this.state === 'play') O.Cutscene.onLevel(this);
    }
    openDenDoor() {
      for (let y = 8; y <= 10; y++) for (let x = 21; x <= 22; x++) this.lvl.setTile(x, y, 'n');
    }
    goto(id, spawn) {
      this.sfx('door');
      this.trans = { t: 0, dir: 1, cb: () => this.loadLevel(id, spawn) };
    }
    toEnding() {
      const ending = () => { this.state = 'ending'; this.endT = 0; this.music('temple'); };
      this.trans = { t: 0, dir: 1, cb: () => { if (!(O.Cutscene && O.Cutscene.start(this, ['end'], ending))) ending(); } };
    }

    /* ----- dialogue ----- */
    buildPages(texts, maxLast) {
      const pages = [];
      (Array.isArray(texts) ? texts : [texts]).forEach((txt) => {
        const lines = O.wrap(txt, O.TEXT_W);
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
      if (key === 'club') { st.items.club = true; st.weapon = 'club'; }
      if (key === 'sandals') st.items.sandals = true;
      if (key === 'blessing') { st.maxHp += 4; st.hp = st.maxHp; }
      this.state = 'itemget'; this.itemT = 130; this.itemKey = key; this.itemNext = next;
      this.music('fanfare', this.lvl.def.music || O.Audio.songName || null);
    }

    /* ----- effects ----- */
    puff(x, y) {
      this.fx.push({ type: 'puff', x, y, t: 0 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        this.fx.push({ type: 'star', x, y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6 - 0.5, t: 0 });
      }
    }
    spark(x, y) { this.fx.push({ type: 'spark', x, y, t: 0 }); }
    dust(x, y, kind) {
      if (kind === 0) { this.fx.push({ type: 'dust', x, y: y - 2, vx: 0, t: 0 }); return; }
      const n = kind === 2 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        this.fx.push({ type: 'dust', x: x - 4, y: y - 2, vx: -0.6 - i * 0.3, t: 0 });
        this.fx.push({ type: 'dust', x: x + 4, y: y - 2, vx: 0.6 + i * 0.3, t: 0 });
      }
    }
    debris(x, y) {
      for (let i = 0; i < 5; i++) this.fx.push({ type: 'bit', x, y, vx: (i - 2) * 0.8, vy: -2 - Math.random(), t: 0 });
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
      else if (pk.kind === 'pom') { st.hp = Math.min(st.maxHp, st.hp + 4); this.sfx('life'); this.popText(p.x - 2, p.y - 8, '+4', '#fc7050'); }
      else if (pk.kind === 'ambrosia') { st.ambrosia = Math.min(3, st.ambrosia + 1); this.sfx('buy'); }
      this.fx.push({ type: 'spark', x: pk.x + 4, y: pk.y + 4, t: 2 });
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
      const after = () => { this.music('temple'); this.say('', ['THE ERYMANTHIAN BOAR HAS FALLEN! A PASSAGE HAS OPENED TO THE EAST.'], () => this.save({ tx: 10, row: 11 })); };
      if (!(O.Cutscene && O.Cutscene.start(this, ['string1'], after))) after();
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
        case 'title': {
          const m = this.titleMenu();
          if (!m[this.sel] || m[this.sel].off) this.sel = 0;
          if (I.pressed.up) { this.sel = this.moveSel(m, this.sel, -1); this.sfx('blip'); }
          if (I.pressed.down) { this.sel = this.moveSel(m, this.sel, 1); this.sfx('blip'); }
          if (I.pressed.start || I.pressed.jump || I.pressed.attack) {
            this.sfx('select');
            const k = m[this.sel].k;
            if (k === 'continue') this.trans = { t: 0, dir: 1, cb: () => this.loadSave() };
            else if (k === 'new') this.trans = { t: 0, dir: 1, cb: () => this.startNew(true) };
            else this.openMenu(k, 'title');
          }
          break;
        }
        case 'options': this.updateOptions(); break;
        case 'howto': this.updateHowto(); break;
        case 'story': this.updateStory(); break;
        case 'cut': O.Cutscene.update(this); break;
        case 'play': this.updatePlay(); break;
        case 'itemget':
          this.updateAmbient();
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

    /* ----- menus: title list, OPTIONS and HOW TO PLAY (reached from the title or the status screen) ----- */
    titleMenu() {
      return [{ k: 'new', t: 'NEW GAME' }, { k: 'continue', t: 'CONTINUE', off: !this.hasSave }, { k: 'options', t: 'OPTIONS' }, { k: 'howto', t: 'HOW TO PLAY' }];
    }
    pauseMenu() { return [{ k: 'resume', t: 'RESUME' }, { k: 'options', t: 'OPTIONS' }, { k: 'howto', t: 'HOW TO PLAY' }]; }
    moveSel(list, cur, d) {
      let i = cur;
      for (let n = 0; n < list.length; n++) { i = (i + d + list.length) % list.length; if (!list[i].off) return i; }
      return cur;
    }
    openMenu(k, from) { this.menuFrom = from; this.state = k; this.osel = 0; this.menuT = 0; }
    closeMenu() {
      this.sfx('select');
      this.state = this.menuFrom === 'pause' ? 'pause' : this.menuFrom === 'play' ? 'play' : 'title';
    }
    updateOptions() {
      const I = this.I, S = O.Settings, N = 4;
      this.menuT++;
      if (I.pressed.up) { this.osel = (this.osel + N - 1) % N; this.sfx('blip'); }
      if (I.pressed.down) { this.osel = (this.osel + 1) % N; this.sfx('blip'); }
      const d = (I.pressed.right ? 1 : 0) - (I.pressed.left ? 1 : 0), ok = I.pressed.jump || I.pressed.attack;
      if (this.osel === 0 && d) { S.music = O.clamp(S.music + d, 0, 10); S.apply(); S.save(); this.sfx('blip'); }
      if (this.osel === 1 && d) { S.sfx = O.clamp(S.sfx + d, 0, 10); S.apply(); S.save(); this.sfx('olive'); }
      if (this.osel === 2 && (ok || d)) { S.toggleFull(); this.sfx('select'); }
      if (this.menuT > 6 && ((this.osel === 3 && ok) || I.pressed.start)) this.closeMenu();
    }
    updateHowto() {
      const I = this.I;
      this.menuT++;
      if (this.menuT > 20 && (I.pressed.start || I.pressed.jump || I.pressed.attack)) this.closeMenu();
    }
    // Cycle through the weapons Orpheus owns (C / Q, gamepad Y, the sword button on phones).
    swapWeapon() {
      const own = O.ownedWeapons(this.st), p = this.player;
      if (own.length < 2) { this.popText(p.x - 12, p.y - 10, O.WEAPONS[own[0]].name, '#e8e0f4'); return; }
      const i = own.indexOf(this.st.weapon);
      this.st.weapon = own[(i + 1) % own.length];
      p.weapon = O.WEAPONS[this.st.weapon];
      this.sfx('select');
      this.popText(p.x - 14, p.y - 10, p.weapon.name, '#ffe7a0');
    }
    // Pressing attack before the Elder gives the club: say why, once, then a short pop-up.
    noWeapon() {
      if (this.nwT > 0) return;
      this.nwT = 90;
      const p = this.player;
      if (!this.st.flags.nwHint) {
        this.st.flags.nwHint = 1;
        this.say('', ['YOU HAVE NO WEAPON YET. FIND THE ELDER IN THE VILLAGE, STAND NEXT TO HIM AND PRESS UP TO TALK.']);
      } else this.popText(p.x - 14, p.y - 10, 'NO WEAPON!', '#ffd0a0');
    }

    updatePause() {
      const I = this.I, st = this.st;
      const m = this.pauseMenu();
      if (this.psel === undefined) this.psel = 0;
      if (I.pressed.up || I.pressed.left) { this.psel = (this.psel + m.length - 1) % m.length; this.sfx('blip'); }
      if (I.pressed.down || I.pressed.right) { this.psel = (this.psel + 1) % m.length; this.sfx('blip'); }
      if (I.pressed.jump) {
        const k = m[this.psel].k;
        if (k === 'resume') { this.state = 'play'; this.sfx('pause'); return; }
        this.sfx('select'); this.openMenu(k, 'pause'); return;
      }
      if (I.pressed.start) { this.state = 'play'; this.sfx('pause'); return; }
      if (I.pressed.attack && st.ambrosia > 0 && st.hp < st.maxHp) {
        st.ambrosia--;
        st.hp = Math.min(st.maxHp, st.hp + 8);
        this.sfx('life');
      }
    }

    updatePlay() {
      if (this.flash > 0) this.flash--;
      if (this.dialog) { this.updateDialog(); this.updateAmbient(); return; }
      if (this.hitstop > 0) { this.hitstop--; return; }
      const I = this.I, p = this.player, lvl = this.lvl, st = this.st;
      if (I.pressed.start) { this.state = 'pause'; this.psel = 0; this.sfx('pause'); return; }
      if (this.nwT > 0) this.nwT--;
      if (this.banner > 0) this.banner--;
      if (this.shake > 0) this.shake--;

      p.update(this);
      this.npcs.forEach((n) => n.update(this));

      const ab = p.attackBox();
      for (const e of this.enemies) {
        e.update(this);
        if (e.remove) continue;
        if (ab && O.overlap(ab, e)) e.hit(this, (p.weapon || O.WEAPONS.club).dmg, p.facing, p.swingId);
        if (e.harmful() && p.inv === 0 && O.overlap(p, e)) p.hurt(this, e.contactDmg(), e.x + e.w / 2);
        // enemy attacks (satyr's club, snake's strike, boar's tusks) reach beyond the body
        const eb = e.attackBox && e.attackBox();
        if (eb && p.inv === 0 && O.overlap(p, eb)) p.hurt(this, e.atkDmg || 2, e.x + e.w / 2);
      }
      this.enemies = this.enemies.filter((e) => !e.remove);

      for (const pk of this.pickups) {
        pk.update(this);
        if (!pk.remove && O.overlap(p, pk)) { pk.remove = true; this.collect(pk); }
      }
      this.pickups = this.pickups.filter((pk) => !pk.remove);

      this.fx.forEach((f) => {
        f.t++;
        if (f.vx !== undefined) f.x += f.vx;
        if (f.type === 'bit' || f.type === 'star') { f.y += f.vy; f.vy += f.type === 'bit' ? 0.2 : 0.08; }
        if (f.type === 'dust') { f.y -= 0.15; f.vx *= 0.9; }
        if (f.type === 'text') f.y -= 0.5;
      });
      const LIFE = { puff: 22, spark: 10, dust: 16, bit: 40, star: 24, text: 40 };
      this.fx = this.fx.filter((f) => f.t < (LIFE[f.type] || 30));
      this.updateAmbient();

      if (st.hp <= 0) { this.die(); return; }

      if (I.pressed.up && p.onGround) {
        const npc = this.npcs.find((n) => n.near(p));
        if (npc && O.TALK[npc.kind]) { this.talking = npc; O.TALK[npc.kind](this); return; }
        const ex = (lvl.def.exits || []).find((e) => e.type === 'door' && (!e.when || e.when(this)) &&
          O.overlap(p, { x: e.tx * T, y: e.ty * T, w: e.tw * T, h: e.th * T }));
        if (ex) { this.goto(ex.to, ex.spawn); return; }
      }
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
      this.updateCamera();
    }

    // Ambient particles: falling leaves, fireflies, embers, cave drips.
    updateAmbient() {
      const lvl = this.lvl, kind = lvl.def.ambient, a = this.amb, cam = this.cam;
      if (kind === 'leaves' && a.length < 10 && Math.random() < 0.05) {
        a.push({ k: 'leaf', x: cam + Math.random() * 300, y: -4, vx: -0.35 - Math.random() * 0.3, vy: 0.35 + Math.random() * 0.2, t: (Math.random() * 100) | 0 });
      }
      if (kind === 'fireflies' && a.length < 14) {
        a.push({ k: 'fly', x: cam + Math.random() * W, y: 60 + Math.random() * 110, vx: 0, vy: 0, t: (Math.random() * 200) | 0 });
      }
      if (kind === 'embers' && a.length < 16 && Math.random() < 0.15) {
        const L = (lvl.def.lights || []).filter((l) => l.type === 'brazier');
        if (L.length) {
          const l = L[(Math.random() * L.length) | 0];
          a.push({ k: 'ember', x: l.tx * T + 6 + Math.random() * 4, y: l.row * T - 20, vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.4, t: 0 });
        }
      }
      if (kind === 'drips' && a.length < 4 && Math.random() < 0.03) {
        a.push({ k: 'drip', x: (2 + Math.random() * 16) * T, y: 34, vx: 0, vy: 0, t: 0 });
      }
      for (const p of a) {
        p.t++;
        if (p.k === 'leaf') { p.x += p.vx + Math.sin(p.t * 0.06) * 0.4; p.y += p.vy; if (p.y > O.ROWS * T) p.dead = true; }
        else if (p.k === 'fly') {
          p.vx = O.clamp(p.vx + (Math.random() - 0.5) * 0.06, -0.4, 0.4);
          p.vy = O.clamp(p.vy + (Math.random() - 0.5) * 0.06, -0.3, 0.3);
          p.x += p.vx; p.y += p.vy;
          if (p.x < cam - 40 || p.x > cam + W + 40 || p.y < 30 || p.y > 180) p.dead = true;
        } else if (p.k === 'ember') { p.x += p.vx + Math.sin(p.t * 0.1) * 0.2; p.y += p.vy; if (p.t > 70) p.dead = true; }
        else if (p.k === 'drip') { p.vy = Math.min(4, p.vy + 0.15); p.y += p.vy; if (lvl.isSolid(Math.floor(p.x / T), Math.floor(p.y / T))) { p.dead = true; this.fx.push({ type: 'dust', x: p.x, y: p.y - 1, vx: 0, t: 8 }); } }
      }
      this.amb = a.filter((p) => !p.dead);
    }

    // Smooth camera with a little look-ahead in the facing direction.
    updateCamera(snap) {
      const p = this.player, lvl = this.lvl;
      this.look = (this.look || 0) + ((p.facing * 28) - (this.look || 0)) * 0.04;
      const target = O.clamp(p.x + p.w / 2 - W / 2 + this.look, 0, Math.max(0, lvl.pxW - W));
      this.camF = snap || this.camF === undefined ? target : this.camF + (target - this.camF) * 0.12;
      this.cam = O.px ? O.px(this.camF) : Math.round(this.camF); // HD: steps of one device pixel
    }
  }

  O.Game = Game;
})(window.OLY);
