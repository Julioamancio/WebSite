/* entities.js — physics, hero, enemies, boss, NPCs, pickups */
(function (O) {
  'use strict';
  const T = O.TILE, VY = O.HUD_H;
  const P = O.PHYS = { walk: 1.5, grav: 0.25, jump: 4.8, jumpHigh: 5.8, maxFall: 5 };
  const STAND_H = 28, CROUCH_H = 18;

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

  // Draws a sprite with its bottom row (the outline) resting on `feet`, centred on the body.
  function drawOn(c, g, name, body, flip, white, dy) {
    const s = O.SPR[name];
    const sx = Math.round(body.x + body.w / 2 - s.w / 2 - g.cam);
    const sy = Math.round(body.y + body.h - s.h + 1 + (dy || 0)) + VY;
    O.drawSpr(c, name, sx, sy, flip, white);
    return { sx, sy, s };
  }
  O.drawOn = drawOn;

  /* ---------- ORPHEUS ---------- */
  class Player {
    constructor() {
      this.w = 10; this.h = STAND_H;
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
      this.facing = 1; this.onGround = false; this.crouch = false;
      this.atk = 0; this.atkCrouch = false; this.swingId = 0;
      this.inv = 0; this.hurtT = 0; this.anim = 0; this.safe = null;
    }
    place(x, feet) {
      this.h = STAND_H; this.crouch = false;
      this.x = x; this.y = feet - this.h;
      this.vx = 0; this.vy = 0; this.onGround = true;
      this.atk = 0; this.hurtT = 0;
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
      const ctrl = this.hurtT === 0;
      if (this.hurtT > 0) this.hurtT--;

      let wantCrouch = ctrl && this.onGround && I.down.down;
      if (this.atk > 0) wantCrouch = this.atkCrouch && this.onGround;
      this.setCrouch(wantCrouch, lvl);

      if (ctrl && I.pressed.attack && this.atk === 0 && st.items.club) {
        this.atk = 16; this.atkCrouch = this.crouch; this.swingId++;
        g.sfx('swing');
      }
      if (this.atk > 0) this.atk--;

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
      if (this.onGround && !wasGround && fallSpeed > 2.5) g.dust(this.x + this.w / 2, this.y + this.h, 2);

      if (this.onGround && this.vx !== 0) {
        this.anim++;
        if (this.anim % 16 === 1) g.dust(this.x + this.w / 2 - this.facing * 4, this.y + this.h, 0);
      } else this.anim = 0;

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
    }
    attackBox() {
      if (this.atk < 7) return null;
      const reach = 16;
      return {
        x: this.facing > 0 ? this.x + this.w : this.x - reach,
        y: this.crouch ? this.y + 5 : this.y + 6,
        w: reach,
        h: this.crouch ? 13 : 10
      };
    }
    draw(c, g) {
      if (this.inv > 0 && this.hurtT === 0 && ((this.inv >> 1) & 1)) return;
      const atkVis = this.atk >= 5;
      let name;
      if (this.crouch) name = atkVis ? 'heroCrouchAtk' : 'heroCrouch';
      else if (!this.onGround) name = atkVis ? 'heroJumpAtk' : 'heroJump';
      else if (atkVis) name = 'heroAtk';
      else if (this.vx !== 0) name = Math.floor(this.anim / 7) & 1 ? 'heroWalk2' : 'heroWalk1';
      else name = 'heroStand';
      const flip = this.facing < 0;
      const d = drawOn(c, g, name, this, flip, this.hurtT > 10 && (this.hurtT & 2));
      if (atkVis) {
        const club = O.SPR.club;
        const ox = flip ? d.s.w - 14 - club.w : 14;
        O.drawSpr(c, 'club', d.sx + ox, d.sy + 11, flip);
        if (this.atk >= 10) {
          const sw = O.SPR.swipe;
          O.drawSpr(c, 'swipe', flip ? d.sx - sw.w + 2 : d.sx + d.s.w - 2, d.sy + 3, flip);
        }
      }
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
    drawSpr(c, g, name, dy) {
      drawOn(c, g, name, this, this.facing < 0, this.flash > 0 && (this.flash & 2), dy);
    }
  }
  O.Enemy = Enemy;

  class Snake extends Enemy {
    constructor(x, feet) {
      super(x, feet - 8, 14, 8);
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
        if (this.cool === 0 && Math.abs(dx) < 60 && Math.abs(p.y + p.h - (this.y + this.h)) < 12) {
          this.facing = dx < 0 ? -1 : 1; this.lunge = 22; this.cool = 100;
        }
      }
      this.fall(lvl);
      if (this.hitWall || (this.onGround && this.edgeAhead(lvl))) { this.facing *= -1; this.lunge = 0; }
    }
    draw(c, g) { this.drawSpr(c, g, (this.t >> 3) & 1 ? 'snake2' : 'snake1'); }
  }

  class Bat extends Enemy {
    constructor(x, y) {
      super(x, y, 12, 8);
      this.state = 'hang'; this.baseY = y;
    }
    update(g) {
      this.tick();
      const p = g.player;
      const dx = p.x + p.w / 2 - (this.x + this.w / 2);
      if (this.state === 'hang') {
        if (Math.abs(dx) < 80 && p.y > this.y - 8) { this.state = 'fly'; this.t = 0; g.sfx('bat'); }
        return;
      }
      this.baseY += Math.sign(p.y + 6 - this.baseY) * 0.4;
      this.facing = dx < 0 ? -1 : 1;
      if (this.knock > 0) this.knock--;
      else this.vx = O.clamp(this.vx + this.facing * 0.04, -1.1, 1.1);
      this.x += this.vx;
      this.y = this.baseY + Math.sin(this.t * 0.09) * 14;
    }
    draw(c, g) {
      this.drawSpr(c, g, this.state === 'hang' ? 'batHang' : (this.t >> 2) & 1 ? 'bat1' : 'bat2', 2);
    }
  }

  class Satyr extends Enemy {
    constructor(x, feet) {
      super(x, feet - 26, 10, 26);
      this.hp = 3; this.dmg = 2; this.olives = 3; this.dropChance = 0.85; this.jumpCool = 0;
    }
    update(g) {
      this.tick();
      const p = g.player, lvl = g.lvl;
      const dx = p.x + p.w / 2 - (this.x + this.w / 2);
      if (this.jumpCool > 0) this.jumpCool--;
      if (this.knock > 0) { this.knock--; this.vx *= 0.9; }
      else if (Math.abs(dx) < 150) {
        this.facing = dx < 0 ? -1 : 1;
        this.vx = this.facing * 0.75;
        if (this.onGround && this.edgeAhead(lvl)) this.vx = 0;
        if (this.onGround && this.jumpCool === 0 &&
            (this.blocked || (p.atk > 0 && Math.abs(dx) < 48 && Math.random() < 0.25))) {
          this.vy = -4.2; this.jumpCool = 50;
        }
      } else this.vx = 0;
      this.fall(lvl);
      this.blocked = this.hitWall;
    }
    draw(c, g) { this.drawSpr(c, g, this.vx !== 0 && (this.t >> 3) & 1 ? 'satyr2' : 'satyr1'); }
  }

  /* ---------- BOSS: Erymanthian Boar ---------- */
  class Boar extends Enemy {
    constructor(x, feet) {
      super(x, feet - 24, 36, 24);
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
          if (Math.abs(dx) < 150) { this.setState('roar'); g.sfx('roar'); g.shake = 30; g.music('boss'); }
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
          if (this.st % 10 === 0) g.dust(this.x + this.w / 2 - this.dir * 14, this.y + this.h, 0);
          if (this.st > 30) { this.setState('charge'); g.sfx('roar'); }
          break;
        case 'charge':
          this.vx = this.dir * 3.2;
          if (this.st % 5 === 0) g.dust(this.x + this.w / 2 - this.dir * 16, this.y + this.h, 0);
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
        for (let i = 0; i < 3; i++) g.enemies.push(new Rock((3 + Math.floor(Math.random() * 14)) * T + 4, 20 + i * 18));
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
      let name = 'boar0';
      if (this.state === 'charge') name = (this.t >> 2) & 1 ? 'boar2' : 'boar1';
      else if (this.state === 'stun' || this.state === 'dying') name = 'boarStun';
      if (this.state === 'dying' && (this.st & 2)) return;
      const shakeX = this.state === 'paw' ? ((this.st >> 1) & 1 ? 1 : -1) : 0;
      const d = drawOn(c, g, name, { x: this.x + shakeX, y: this.y, w: this.w, h: this.h }, this.facing < 0, this.flash > 0 && (this.flash & 2));
      if (this.state === 'stun') {
        for (let i = 0; i < 3; i++) {
          const a = this.t * 0.15 + i * 2.1;
          const x = Math.round(d.sx + d.s.w / 2 + (this.facing < 0 ? -10 : 10) + Math.cos(a) * 9), y = Math.round(d.sy + 2 + Math.sin(a) * 3);
          c.fillStyle = '#f8b800'; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3);
          c.fillStyle = '#fcfcfc'; c.fillRect(x, y, 1, 1);
        }
      }
    }
  }
  O.Boar = Boar;

  class Rock extends Enemy {
    constructor(x, delay) {
      super(x, 32, 8, 8);
      this.delay = delay;
    }
    harmful() { return this.delay <= 0; }
    hit() {}
    update(g) {
      this.t++;
      if (this.delay > 0) { this.delay--; return; }
      this.vy = Math.min(5, this.vy + 0.2);
      this.y += this.vy;
      if (g.lvl.isSolid(Math.floor((this.x + 4) / T), Math.floor((this.y + this.h) / T))) {
        this.remove = true;
        g.debris(this.x + 4, this.y + 6);
        g.sfx('rock');
      }
    }
    draw(c, g) {
      const sx = Math.round(this.x - g.cam), sy = Math.round(this.y) + VY;
      if (this.delay > 0) {
        if (this.t & 4) { c.fillStyle = '#b87850'; c.fillRect(sx + 1, sy - 2, 1, 1); c.fillRect(sx + 5, sy - 1, 1, 1); c.fillRect(sx + 3, sy + 1, 1, 1); }
        return;
      }
      O.drawSpr(c, 'rock', sx - 1, sy - 1);
    }
  }

  O.makeEnemy = function (d) {
    const x = d.tx * T, feet = (d.row || 11) * T;
    if (d.kind === 'snake') return new Snake(x + 1, feet);
    if (d.kind === 'bat') return new Bat(x + 2, d.row * T);
    if (d.kind === 'satyr') return new Satyr(x + 3, feet);
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
      const name = this.kind === 'olive' ? 'olive' : this.kind === 'pom' ? 'pom' : 'ambrosia';
      const s = O.SPR[name];
      const bob = this.onGround ? Math.round(Math.sin(this.t * 0.08)) : 0;
      O.drawSpr(c, name, this.x + this.w / 2 - s.w / 2 - g.cam, this.y + this.h - s.h + 1 + VY - 1 + bob);
      if (((this.t >> 3) % 6) === 0) { c.fillStyle = '#fcfcfc'; c.fillRect(Math.round(this.x + 6 - g.cam), Math.round(this.y + VY - 1), 1, 1); }
    }
  }
  O.Pickup = Pickup;

  /* ---------- NPCs ---------- */
  class NPC {
    constructor(def) {
      this.kind = def.kind;
      this.sprite = def.kind;
      this.float = !!def.float;
      this.god = def.kind === 'zeus' || def.kind === 'hermes';
      const s = O.SPR[this.sprite];
      this.w = 12; this.h = s.h - 2;
      this.x = def.tx * T + 2; this.y = (def.row || 11) * T - this.h;
      this.facing = -1; this.t = 0;
    }
    update(g) {
      this.t++;
      const p = g.player;
      this.facing = p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1;
    }
    near(p) {
      return Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) < this.w / 2 + 16 &&
        p.y < this.y + this.h && p.y + p.h > this.y;
    }
    draw(c, g) {
      const bob = this.float ? Math.round(Math.sin(this.t * 0.05) * 2) - 5 : 0;
      const s = O.SPR[this.sprite];
      const sx = Math.round(this.x + this.w / 2 - s.w / 2 - g.cam), sy = Math.round(this.y + this.h - s.h + 1 + bob) + VY;
      if (this.god) {
        const cx = sx + s.w / 2, cy = sy + s.h / 2;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + this.t * 0.01;
          const len = 18 + ((i + (this.t >> 4)) % 3) * 5;
          c.fillStyle = i % 2 ? '#f8b800' : '#fcf088';
          for (let k = 12; k < len; k += 2) c.fillRect(Math.round(cx + Math.cos(a) * k), Math.round(cy + Math.sin(a) * k * 1.1), 1, 1);
        }
        for (let i = 0; i < 5; i++) {
          const a = this.t * 0.04 + i * 1.26;
          c.fillStyle = '#fcfcfc';
          c.fillRect(Math.round(cx + Math.cos(a) * 14), Math.round(cy + Math.sin(a) * 20), 1, 1);
        }
        c.fillStyle = '#fcf088';
        c.fillRect(sx + 3, sy + s.h + 2 - bob, s.w - 6, 1);
      }
      O.drawSpr(c, this.sprite, sx, sy, this.facing < 0);
      if (this.kind === 'zeus' && ((this.t >> 4) & 1)) {
        O.drawSpr(c, 'bolt', this.facing < 0 ? sx - 6 : sx + s.w - 2, sy + 4, this.facing < 0);
      }
      if (this.near(g.player) && !g.dialog && ((this.t >> 4) & 1)) {
        O.drawSpr(c, 'arrowUp', sx + s.w / 2 - 4, sy - 9);
      }
    }
  }
  O.NPC = NPC;
})(window.OLY);
