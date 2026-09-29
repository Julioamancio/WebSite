/* entities.js — physics, hero, enemies, boss, NPCs, pickups.
   Drawing uses named animation frames (see ART_SPEC in the art modules): "<base>_<index>". */
(function (O) {
  'use strict';
  const T = O.TILE, VY = O.VIEW_Y;
  const P = O.PHYS = { walk: 1.5, grav: 0.25, jump: 4.8, jumpHigh: 5.8, maxFall: 5 };
  const STAND_H = 34, CROUCH_H = 22;
  O.HERO = { STAND_H, CROUCH_H, W: 12, ATK: 20, REACH: 22 };

  /* ---------- tile collision for any body {x,y,w,h,vx,vy} ---------- */
  O.moveBody = function (b, lvl) {
    b.hitWall = false;
    if (b.vx !== 0) {
      let nx = b.x + b.vx;
      const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 1) / T);
      if (b.vx > 0) {
        const tx = Math.floor((nx + b.w - 1) / T);
        for (let ty = y0; ty <= y1; ty++) if (lvl.isSolid(tx, ty)) { nx = tx * T - b.w; b.hitWall = true; break; }
      } else {
        const tx = Math.floor(nx / T);
        for (let ty = y0; ty <= y1; ty++) if (lvl.isSolid(tx, ty)) { nx = (tx + 1) * T; b.hitWall = true; break; }
      }
      b.x = nx;
    }
    const wasBottom = b.y + b.h;
    let ny = b.y + b.vy;
    b.onGround = false;
    const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 1) / T);
    if (b.vy > 0) {
      const ty = Math.floor((ny + b.h) / T);
      for (let tx = x0; tx <= x1; tx++) {
        if (lvl.isSolid(tx, ty) || (lvl.isOneWay(tx, ty) && wasBottom <= ty * T + 0.01)) {
          ny = ty * T - b.h; b.vy = 0; b.onGround = true; break;
        }
      }
    } else if (b.vy < 0) {
      const ty = Math.floor(ny / T);
      for (let tx = x0; tx <= x1; tx++) if (lvl.isSolid(tx, ty)) { ny = (ty + 1) * T; b.vy = 0; break; }
    }
    b.y = ny;
  };

  // Frame name helper: frame('hero_run', t, 5, 8) -> 'hero_run_<n>'.
  O.frame = (base, t, ticks, count) => base + '_' + (Math.floor(t / ticks) % count);

  // Draws a named frame with its anchor on the body's feet (bottom-centre).
  function drawBody(c, g, name, body, flip, white, dx, dy, alpha) {
    return O.drawA(c, name, Math.round(body.x + body.w / 2 - g.cam + (dx || 0)), Math.round(body.y + body.h + (dy || 0)) + VY, flip, white, alpha);
  }
  O.drawBody = drawBody;

  /* ---------- ORPHEUS ---------- */
  class Player {
    constructor() {
      this.w = O.HERO.W; this.h = STAND_H;
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
      this.facing = 1; this.onGround = false; this.crouch = false;
      this.atk = 0; this.atkCrouch = false; this.atkAir = false; this.swingId = 0;
      this.inv = 0; this.hurtT = 0; this.anim = 0; this.idleT = 0; this.landT = 0; this.safe = null;
    }
    place(x, feet) {
      this.h = STAND_H; this.crouch = false;
      this.x = x; this.y = feet - this.h;
      this.vx = 0; this.vy = 0; this.onGround = true;
      this.atk = 0; this.hurtT = 0; this.landT = 0;
      this.safe = { x, feet };
    }
    setCrouch(want, lvl) {
      const d = STAND_H - CROUCH_H;
      if (want && !this.crouch) {
        this.crouch = true; this.y += d; this.h = CROUCH_H;
      } else if (!want && this.crouch) {
        const ny = this.y - d;
        const ty = Math.floor(ny / T), x0 = Math.floor(this.x / T), x1 = Math.floor((this.x + this.w - 1) / T);
        for (let tx = x0; tx <= x1; tx++) if (lvl.isSolid(tx, ty)) return;
        this.crouch = false; this.y = ny; this.h = STAND_H;
      }
    }
    update(g) {
      const I = g.I, lvl = g.lvl, st = g.st;
      if (this.inv > 0) this.inv--;
      if (this.landT > 0) this.landT--;
      const ctrl = this.hurtT === 0;
      if (this.hurtT > 0) this.hurtT--;

      let wantCrouch = ctrl && this.onGround && I.down.down;
      if (this.atk > 0) wantCrouch = this.atkCrouch && this.onGround;
      this.setCrouch(wantCrouch, lvl);

      if (ctrl && I.pressed.attack && this.atk === 0 && st.items.club) {
        this.atk = O.HERO.ATK; this.atkCrouch = this.crouch; this.atkAir = !this.onGround; this.swingId++;
        g.sfx('swing');
      }
      if (this.atk > 0) this.atk--;
      if (this.atk > 0 && this.onGround) this.atkAir = false;

      if (ctrl) {
        const dir = (I.down.right ? 1 : 0) - (I.down.left ? 1 : 0);
        if ((this.atk > 0 && this.onGround) || this.crouch) this.vx = 0;
        else this.vx = dir * P.walk;
        if (dir !== 0 && this.atk === 0) this.facing = dir;
        if (I.pressed.jump && this.onGround && !this.crouch) {
          this.vy = -(st.items.sandals ? P.jumpHigh : P.jump);
          this.onGround = false;
          g.sfx('jump');
          g.dust(this.x + this.w / 2, this.y + this.h, 1);
        }
        if (!I.down.jump && this.vy < -2) this.vy = -2;
      }
      const fallSpeed = this.vy;
      const wasGround = this.onGround;
      this.vy = Math.min(P.maxFall, this.vy + P.grav);
      O.moveBody(this, lvl);
      if (this.onGround && !wasGround && fallSpeed > 2) { this.landT = 6; g.dust(this.x + this.w / 2, this.y + this.h, fallSpeed > 3.5 ? 2 : 1); }

      if (this.onGround && this.vx !== 0) {
        this.anim++;
        if (this.anim % 20 === 1) g.dust(this.x + this.w / 2 - this.facing * 4, this.y + this.h, 0);
      } else this.anim = 0;
      this.idleT++;

      if (this.onGround) {
        const fy = Math.floor((this.y + this.h) / T);
        const l = Math.floor(this.x / T), r = Math.floor((this.x + this.w - 1) / T);
        const sup = (tx) => lvl.isSolid(tx, fy) || lvl.isOneWay(tx, fy);
        if (sup(l) && sup(r) && !lvl.isHazard(l, fy - 1) && !lvl.isHazard(r, fy - 1)) this.safe = { x: this.x, feet: this.y + this.h };
      }
      if (this.inv === 0 && this.touchesHazard(lvl)) this.hurt(g, 2, this.x + this.w / 2 + this.facing * 8);
      if (this.y > lvl.pxH + 8) g.onPit();
    }
    touchesHazard(lvl) {
      const x0 = Math.floor((this.x + 1) / T), x1 = Math.floor((this.x + this.w - 2) / T);
      const y0 = Math.floor(this.y / T), y1 = Math.floor((this.y + this.h - 1) / T);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (lvl.isHazard(tx, ty) && this.y + this.h > ty * T + 7) return true;
        }
      }
      return false;
    }
    hurt(g, dmg, fromX) {
      if (this.inv > 0 || g.st.hp <= 0) return;
      g.st.hp = Math.max(0, g.st.hp - dmg);
      this.inv = 80; this.hurtT = 18; this.atk = 0;
      const dir = this.x + this.w / 2 < fromX ? -1 : 1;
      this.vx = dir * 1.6; this.vy = -2.6; this.onGround = false;
      this.setCrouch(false, g.lvl);
      g.sfx('hurt');
      g.flash = 3;
      g.shake = Math.max(g.shake, 8);
    }
    // Elapsed attack ticks (0..ATK-1) and the frame index 0..4 of the swing.
    atkElapsed() { return O.HERO.ATK - this.atk; }
    atkFrame() {
      const e = this.atkElapsed();
      return e < 4 ? 0 : e < 7 ? 1 : e < 11 ? 2 : e < 15 ? 3 : 4;
    }
    attackBox() {
      if (this.atk <= 0) return null;
      const e = this.atkElapsed();
      if (e < 7 || e > 13) return null;
      const reach = O.HERO.REACH, feet = this.y + this.h;
      return {
        x: this.facing > 0 ? this.x + this.w : this.x - reach,
        y: this.crouch ? feet - 14 : feet - 28,
        w: reach,
        h: 14
      };
    }
    frameName(g) {
      if (this.hurtT > 0) return 'hero_hurt';
      if (this.atk > 0) {
        const base = this.crouch ? 'hero_catk' : !this.onGround ? 'hero_jatk' : 'hero_atk';
        return base + '_' + this.atkFrame();
      }
      if (this.crouch) return 'hero_crouch';
      if (!this.onGround) return this.vy < -1.2 ? 'hero_jump' : this.vy > 1.2 ? 'hero_fall' : 'hero_peak';
      if (this.landT > 0) return 'hero_land';
      if (this.vx !== 0) return O.frame('hero_run', this.anim, 5, 8);
      return O.frame('hero_idle', this.idleT, 12, 4);
    }
    draw(c, g) {
      if (this.inv > 0 && this.hurtT === 0 && ((this.inv >> 1) & 1)) return;
      drawBody(c, g, this.frameName(g), this, this.facing < 0, this.hurtT > 12 && (this.hurtT & 2));
    }
  }
  O.Player = Player;

  /* ---------- enemy base ---------- */
  class Enemy {
    constructor(x, y, w, h) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.vx = 0; this.vy = 0; this.facing = -1; this.onGround = false;
      this.hp = 1; this.dmg = 1; this.flash = 0; this.inv = 0; this.lastSwing = -1;
      this.remove = false; this.dying = false; this.t = 0; this.knock = 0;
      this.olives = 1; this.dropChance = 0.5;
    }
    harmful() { return !this.dying; }
    contactDmg() { return this.dmg; }
    hit(g, dmg, dir, swing) {
      if (this.inv > 0 || this.lastSwing === swing || this.dying) return;
      this.lastSwing = swing;
      this.hp -= dmg; this.flash = 10; this.inv = 8;
      g.sfx('hit');
      g.hitstop = 4;
      g.spark(this.x + this.w / 2, this.y + this.h / 2);
      if (this.hp <= 0) this.kill(g); else this.onHit(g, dir);
    }
    onHit(g, dir) { this.vx = dir * 2; this.knock = 8; }
    kill(g) {
      this.remove = true;
      g.puff(this.x + this.w / 2, this.y + this.h / 2);
      g.sfx('kill');
      g.drop(this);
    }
    tick() { if (this.flash > 0) this.flash--; if (this.inv > 0) this.inv--; this.t++; }
    edgeAhead(lvl) {
      const fx = this.facing > 0 ? this.x + this.w + 1 : this.x - 1;
      const tx = Math.floor(fx / T), ty = Math.floor((this.y + this.h + 1) / T);
      return !(lvl.isSolid(tx, ty) || lvl.isOneWay(tx, ty));
    }
    fall(lvl) {
      this.vy = Math.min(P.maxFall, this.vy + P.grav);
      O.moveBody(this, lvl);
      if (this.y > lvl.pxH) this.remove = true;
    }
    drawFrame(c, g, name, dx, dy) {
      return drawBody(c, g, name, this, this.facing < 0, this.flash > 0 && (this.flash & 2), dx, dy);
    }
  }
  O.Enemy = Enemy;

  class Snake extends Enemy {
    constructor(x, feet) {
      super(x, feet - 10, 20, 10);
      this.cool = 60; this.lunge = 0;
    }
    update(g) {
      this.tick();
      const p = g.player, lvl = g.lvl;
      if (this.knock > 0) this.knock--;
      else if (this.lunge > 0) { this.lunge--; this.vx = this.facing * 1.5; }
      else {
        this.vx = this.facing * 0.35;
        if (this.cool > 0) this.cool--;
        const dx = p.x + p.w / 2 - (this.x + this.w / 2);
        if (this.cool === 0 && Math.abs(dx) < 64 && Math.abs(p.y + p.h - (this.y + this.h)) < 12) {
          this.facing = dx < 0 ? -1 : 1; this.lunge = 22; this.cool = 100;
        }
      }
      this.fall(lvl);
      if (this.hitWall || (this.onGround && this.edgeAhead(lvl))) { this.facing *= -1; this.lunge = 0; }
    }
    draw(c, g) { this.drawFrame(c, g, this.lunge > 0 ? O.frame('snake_lunge', this.t, 6, 2) : O.frame('snake_move', this.t, 8, 4)); }
  }

  class Bat extends Enemy {
    constructor(x, y) {
      super(x, y, 16, 10);
      this.state = 'hang'; this.baseY = y;
    }
    update(g) {
      this.tick();
      const p = g.player;
      const dx = p.x + p.w / 2 - (this.x + this.w / 2);
      if (this.state === 'hang') {
        if (Math.abs(dx) < 90 && p.y > this.y - 8) { this.state = 'fly'; this.t = 0; g.sfx('bat'); }
        return;
      }
      this.baseY += Math.sign(p.y + 8 - this.baseY) * 0.4;
      this.facing = dx < 0 ? -1 : 1;
      if (this.knock > 0) this.knock--;
      else this.vx = O.clamp(this.vx + this.facing * 0.04, -1.1, 1.1);
      this.x += this.vx;
      this.y = this.baseY + Math.sin(this.t * 0.09) * 14;
    }
    draw(c, g) {
      // Bat frames are anchored on the centre of the body.
      const name = this.state === 'hang' ? 'bat_hang' : O.frame('bat_fly', this.t, 4, 4);
      O.drawA(c, name, Math.round(this.x + this.w / 2 - g.cam), Math.round(this.y + this.h / 2) + VY, this.facing < 0, this.flash > 0 && (this.flash & 2));
    }
  }

  class Satyr extends Enemy {
    constructor(x, feet) {
      super(x, feet - 34, 14, 34);
      this.hp = 3; this.dmg = 2; this.olives = 3; this.dropChance = 0.85; this.jumpCool = 0;
    }
    update(g) {
      this.tick();
      const p = g.player, lvl = g.lvl;
      const dx = p.x + p.w / 2 - (this.x + this.w / 2);
      if (this.jumpCool > 0) this.jumpCool--;
      if (this.knock > 0) { this.knock--; this.vx *= 0.9; }
      else if (Math.abs(dx) < 160) {
        this.facing = dx < 0 ? -1 : 1;
        this.vx = this.facing * 0.75;
        if (this.onGround && this.edgeAhead(lvl)) this.vx = 0;
        if (this.onGround && this.jumpCool === 0 &&
            (this.blocked || (p.atk > 0 && Math.abs(dx) < 52 && Math.random() < 0.25))) {
          this.vy = -4.2; this.jumpCool = 50;
        }
      } else this.vx = 0;
      this.fall(lvl);
      this.blocked = this.hitWall;
    }
    draw(c, g) {
      const name = !this.onGround ? 'satyr_jump' : this.vx !== 0 ? O.frame('satyr_walk', this.t, 6, 6) : O.frame('satyr_idle', this.t, 16, 2);
      this.drawFrame(c, g, name);
    }
  }

  /* ---------- BOSS: Erymanthian Boar ---------- */
  class Boar extends Enemy {
    constructor(x, feet) {
      super(x, feet - 32, 48, 32);
      this.hp = 16; this.maxHp = 16; this.dmg = 2;
      this.state = 'wait'; this.st = 0; this.dir = -1; this.facing = -1;
    }
    contactDmg() { return this.state === 'charge' ? 3 : this.state === 'stun' ? 1 : 2; }
    setState(s) { this.state = s; this.st = 0; }
    update(g) {
      this.tick();
      this.st++;
      const p = g.player, lvl = g.lvl;
      const dx = p.x + p.w / 2 - (this.x + this.w / 2);
      switch (this.state) {
        case 'wait':
          if (Math.abs(dx) < 170) { this.setState('roar'); g.sfx('roar'); g.shake = 30; g.music('boss'); }
          break;
        case 'roar':
          if (this.st > 60) this.setState('idle');
          break;
        case 'idle':
          this.vx = 0;
          this.dir = this.facing = dx < 0 ? -1 : 1;
          if (this.st > 35) this.setState('paw');
          break;
        case 'paw':
          if (this.st % 10 === 0) g.dust(this.x + this.w / 2 - this.dir * 18, this.y + this.h, 0);
          if (this.st > 30) { this.setState('charge'); g.sfx('roar'); }
          break;
        case 'charge':
          this.vx = this.dir * 3.2;
          if (this.st % 5 === 0) g.dust(this.x + this.w / 2 - this.dir * 22, this.y + this.h, 0);
          break;
        case 'stun':
          this.vx *= 0.9;
          if (this.st > 85) this.setState('idle');
          break;
        case 'dying':
          this.vx = 0;
          if (this.st % 6 === 0) {
            g.puff(this.x + Math.random() * this.w, this.y + Math.random() * this.h);
            g.sfx('kill');
          }
          if (this.st > 100) { this.remove = true; g.onBossDefeated(this); }
          break;
      }
      this.vy = Math.min(P.maxFall, this.vy + P.grav);
      O.moveBody(this, lvl);
      if (this.state === 'charge' && this.hitWall) {
        this.setState('stun');
        this.vx = -this.dir * 1.5; this.vy = -2.5;
        g.shake = 20; g.sfx('crash');
        g.dust(this.x + (this.dir > 0 ? this.w : 0), this.y + this.h - 6, 2);
        const cols = Math.max(4, g.lvl.w - 4);
        for (let i = 0; i < 4; i++) g.enemies.push(new Rock((2 + Math.floor(Math.random() * (cols - 2))) * T + 4, 20 + i * 16));
      }
    }
    hit(g, dmg, dir, swing) {
      if (this.state === 'wait' || this.state === 'dying' || this.inv > 0 || this.lastSwing === swing) return;
      this.lastSwing = swing;
      this.hp -= this.state === 'stun' ? dmg * 2 : dmg;
      this.flash = 12; this.inv = 20;
      g.sfx('bosshit');
      g.hitstop = 6;
      g.spark(this.x + this.w / 2, this.y + this.h / 2);
      if (this.hp <= 0) { this.hp = 0; this.dying = true; this.setState('dying'); g.music(null); g.flash = 8; }
    }
    draw(c, g) {
      let name;
      if (this.state === 'charge') name = O.frame('boar_run', this.t, 4, 6);
      else if (this.state === 'stun' || this.state === 'dying') name = O.frame('boar_stun', this.t, 8, 4);
      else if (this.state === 'paw') name = O.frame('boar_paw', this.st, 5, 4);
      else name = O.frame('boar_idle', this.t, 10, 4);
      if (this.state === 'dying' && (this.st & 2)) return;
      this.drawFrame(c, g, name);
    }
  }
  O.Boar = Boar;

  class Rock extends Enemy {
    constructor(x, delay) {
      super(x, 32, 10, 10);
      this.delay = delay;
    }
    harmful() { return this.delay <= 0; }
    hit() {}
    update(g) {
      this.t++;
      if (this.delay > 0) { this.delay--; return; }
      this.vy = Math.min(5, this.vy + 0.2);
      this.y += this.vy;
      if (g.lvl.isSolid(Math.floor((this.x + 5) / T), Math.floor((this.y + this.h) / T))) {
        this.remove = true;
        g.debris(this.x + 5, this.y + 6);
        g.sfx('rock');
      }
    }
    draw(c, g) {
      const sx = Math.round(this.x - g.cam), sy = Math.round(this.y) + VY;
      if (this.delay > 0) {
        if (this.t & 4) { c.fillStyle = '#b8845e'; c.fillRect(sx + 2, sy - 2, 1, 1); c.fillRect(sx + 6, sy - 1, 1, 1); c.fillRect(sx + 4, sy + 1, 1, 1); }
        return;
      }
      O.drawA(c, 'rock', sx + 5, sy + 10);
    }
  }

  O.makeEnemy = function (d) {
    const x = d.tx * T, feet = (d.row || 11) * T;
    if (d.kind === 'snake') return new Snake(x - 2, feet);
    if (d.kind === 'bat') return new Bat(x, d.row * T);
    if (d.kind === 'satyr') return new Satyr(x + 1, feet);
    return null;
  };

  /* ---------- pickups ---------- */
  class Pickup {
    constructor(kind, x, y, vy, life) {
      this.kind = kind; this.x = x; this.y = y; this.w = 8; this.h = 8;
      this.vx = vy !== undefined && vy !== 0 ? (Math.random() - 0.5) * 1.2 : 0;
      this.vy = vy || 0;
      this.life = life || 600; this.remove = false; this.t = (Math.random() * 60) | 0;
    }
    update(g) {
      this.t++;
      this.vy = Math.min(4, this.vy + 0.2);
      O.moveBody(this, g.lvl);
      if (this.onGround) this.vx *= 0.8;
      if (this.life !== Infinity && --this.life <= 0) this.remove = true;
      if (this.y > g.lvl.pxH) this.remove = true;
    }
    draw(c, g) {
      if (this.life < 120 && (this.life & 4)) return;
      const bob = this.onGround ? Math.round(Math.sin(this.t * 0.08) * 1.5) - 1 : 0;
      drawBody(c, g, this.kind, this, false, false, 0, bob);
      if (((this.t >> 3) % 6) === 0) { c.fillStyle = '#ffffff'; c.fillRect(Math.round(this.x + 6 - g.cam), Math.round(this.y + VY - 2 + bob), 1, 1); }
    }
  }
  O.Pickup = Pickup;

  /* ---------- NPCs ---------- */
  class NPC {
    constructor(def) {
      this.kind = def.kind;
      this.float = !!def.float;
      this.god = def.kind === 'zeus' || def.kind === 'hermes';
      const s = O.SPR[this.kind + '_idle_0'];
      this.w = 14; this.h = s ? Math.max(24, s.ay) : 32;
      this.x = def.tx * T + 1; this.y = (def.row || 11) * T - this.h;
      this.facing = -1; this.t = (def.tx * 7) % 40;
    }
    update(g) {
      this.t++;
      const p = g.player;
      this.facing = p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1;
    }
    near(p) {
      return Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) < this.w / 2 + 18 &&
        p.y < this.y + this.h + 4 && p.y + p.h > this.y - 4;
    }
    draw(c, g) {
      const bob = this.float ? Math.round(Math.sin(this.t * 0.05) * 2) - 6 : 0;
      if (O.drawNPCAura && this.god) { try { O.drawNPCAura(c, g, this, bob); } catch (err) { O.logOnce('drawNPCAura', err); } }
      const d = drawBody(c, g, O.frame(this.kind + '_idle', this.t, 12, 4), this, this.facing < 0, false, 0, bob);
      if (d && this.near(g.player) && !g.dialog && ((this.t >> 4) & 1)) {
        O.drawA(c, 'arrow_up', d.sx + d.s.w / 2, d.sy - 4);
      }
    }
  }
  O.NPC = NPC;
})(window.OLY);
