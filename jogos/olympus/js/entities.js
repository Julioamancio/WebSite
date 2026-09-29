/* entities.js — physics, hero, enemies, boss, NPCs, pickups */
(function (O) {
  'use strict';
  const T = O.TILE, VY = O.HUD_H;
  const P = O.PHYS = { walk: 1.5, grav: 0.25, jump: 4.8, jumpHigh: 5.8, maxFall: 5 };

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

  /* ---------- ORPHEUS ---------- */
  class Player {
    constructor() {
      this.w = 10; this.h = 22;
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
      this.facing = 1; this.onGround = false; this.crouch = false;
      this.atk = 0; this.atkCrouch = false; this.swingId = 0;
      this.inv = 0; this.hurtT = 0; this.anim = 0; this.safe = null;
    }
    place(x, feet) {
      this.h = 22; this.crouch = false;
      this.x = x; this.y = feet - this.h;
      this.vx = 0; this.vy = 0; this.onGround = true;
      this.atk = 0; this.hurtT = 0;
      this.safe = { x, feet };
    }
    setCrouch(want, lvl) {
      if (want && !this.crouch) {
        this.crouch = true; this.y += 8; this.h = 14;
      } else if (!want && this.crouch) {
        const ny = this.y - 8;
        const ty = Math.floor(ny / T), x0 = Math.floor(this.x / T), x1 = Math.floor((this.x + this.w - 1) / T);
        for (let tx = x0; tx <= x1; tx++) if (lvl.isSolid(tx, ty)) return;
        this.crouch = false; this.y = ny; this.h = 22;
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
        }
        if (!I.down.jump && this.vy < -2) this.vy = -2;
      }
      this.vy = Math.min(P.maxFall, this.vy + P.grav);
      O.moveBody(this, lvl);

      if (this.onGround && this.vx !== 0) this.anim++; else this.anim = 0;

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
    }
    attackBox() {
      if (this.atk < 7) return null;
      const reach = 16;
      return {
        x: this.facing > 0 ? this.x + this.w : this.x - reach,
        y: this.crouch ? this.y + 3 : this.y + 4,
        w: reach,
        h: this.crouch ? 11 : 9
      };
    }
    draw(c, g) {
      if (this.inv > 0 && this.hurtT === 0 && ((this.inv >> 1) & 1)) return;
      const atkVis = this.atk >= 5;
      let name;
      if (this.crouch) name = atkVis ? 'heroCrouchAtk' : 'heroCrouch';
      else if (!this.onGround) name = atkVis ? 'heroJumpAtk' : 'heroJump';
      else if (atkVis) name = 'heroAtk';
      else if (this.vx !== 0) name = (this.anim >> 3) & 1 ? 'heroWalk2' : 'heroWalk1';
      else name = 'heroStand';
      const s = O.SPR[name], flip = this.facing < 0;
      const sx = Math.round(this.x - 3 - g.cam), sy = Math.round(this.y + this.h - s.h) + VY;
      O.drawSpr(c, name, sx, sy, flip, this.hurtT > 10 && (this.hurtT & 2));
      if (atkVis) {
        const club = O.SPR.club;
        const oy = this.crouch ? 7 : 9;
        const ox = flip ? 16 - 15 - club.w : 15;
        O.drawSpr(c, 'club', sx + ox, sy + oy, flip);
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
    drawSpr(c, g, name) {
      const s = O.SPR[name];
      const sx = Math.round(this.x + this.w / 2 - s.w / 2 - g.cam);
      const sy = Math.round(this.y + this.h - s.h) + VY;
      O.drawSpr(c, name, sx, sy, this.facing < 0, this.flash > 0 && (this.flash & 2));
    }
  }
  O.Enemy = Enemy;

  class Snake extends Enemy {
    constructor(x, feet) {
      super(x, feet - 7, 14, 7);
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
      this.baseY += Math.sign(p.y + 4 - this.baseY) * 0.4;
      this.facing = dx < 0 ? -1 : 1;
      if (this.knock > 0) this.knock--;
      else this.vx = O.clamp(this.vx + this.facing * 0.04, -1.1, 1.1);
      this.x += this.vx;
      this.y = this.baseY + Math.sin(this.t * 0.09) * 14;
    }
    draw(c, g) {
      this.drawSpr(c, g, this.state === 'hang' ? 'batHang' : (this.t >> 2) & 1 ? 'bat1' : 'bat2');
    }
  }

  class Satyr extends Enemy {
    constructor(x, feet) {
      super(x, feet - 22, 10, 22);
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
      super(x, feet - 20, 28, 20);
      this.hp = 16; this.maxHp = 16; this.dmg = 2;
      this.state = 'wait'; this.st = 0; this.dir = -1; this.facing = -1;
    }
    contactDmg() { return this.state === 'charge' ? 3 : this.state === 'stun' ? 1 : 2; }
    harmful() { return !this.dying; }
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
          if (this.st > 30) { this.setState('charge'); g.sfx('roar'); }
          break;
        case 'charge':
          this.vx = this.dir * 3.2;
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
        for (let i = 0; i < 3; i++) g.enemies.push(new Rock((3 + Math.floor(Math.random() * 14)) * T + 4, 20 + i * 18));
      }
    }
    hit(g, dmg, dir, swing) {
      if (this.state === 'wait' || this.state === 'dying' || this.inv > 0 || this.lastSwing === swing) return;
      this.lastSwing = swing;
      this.hp -= this.state === 'stun' ? dmg * 2 : dmg;
      this.flash = 12; this.inv = 20;
      g.sfx('bosshit');
      g.spark(this.x + this.w / 2, this.y + this.h / 2);
      if (this.hp <= 0) { this.hp = 0; this.dying = true; this.setState('dying'); g.music(null); }
    }
    draw(c, g) {
      let name = 'boar1';
      if (this.state === 'charge') name = (this.t >> 2) & 1 ? 'boar2' : 'boar1';
      else if (this.state === 'stun' || this.state === 'dying') name = 'boarStun';
      const s = O.SPR[name];
      let sx = Math.round(this.x - 2 - g.cam);
      const sy = Math.round(this.y + this.h - s.h) + VY;
      if (this.state === 'paw') sx += (this.st >> 1) & 1 ? 1 : -1;
      if (this.state === 'dying' && (this.st & 2)) return;
      O.drawSpr(c, name, sx, sy, this.facing < 0, this.flash > 0 && (this.flash & 2));
      if (this.state === 'stun') {
        for (let i = 0; i < 3; i++) {
          const a = this.t * 0.15 + i * 2.1;
          c.fillStyle = '#f8b800';
          c.fillRect(Math.round(sx + 16 + Math.cos(a) * 10), Math.round(sy - 2 + Math.sin(a) * 3), 2, 2);
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
        if (this.t & 4) { c.fillStyle = '#ac7c00'; c.fillRect(sx + 1, sy - 2, 1, 1); c.fillRect(sx + 5, sy - 1, 1, 1); }
        return;
      }
      O.drawSpr(c, 'rock', sx, sy);
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
      this.vx = vy !== undefined ? (Math.random() - 0.5) * 1.2 : 0;
      this.vy = vy || 0;
      this.life = life || 600; this.remove = false;
    }
    update(g) {
      this.vy = Math.min(4, this.vy + 0.2);
      O.moveBody(this, g.lvl);
      if (this.onGround) this.vx *= 0.8;
      if (this.life !== Infinity && --this.life <= 0) this.remove = true;
      if (this.y > g.lvl.pxH) this.remove = true;
    }
    draw(c, g) {
      if (this.life < 120 && (this.life & 4)) return;
      const name = this.kind === 'olive' ? 'olive' : this.kind === 'pom' ? 'pom' : 'ambrosia';
      O.drawSpr(c, name, this.x - g.cam, this.y + VY);
    }
  }
  O.Pickup = Pickup;

  /* ---------- NPCs ---------- */
  class NPC {
    constructor(def) {
      this.kind = def.kind;
      this.sprite = def.kind;
      this.scale = def.scale || 1;
      this.float = !!def.float;
      const s = O.SPR[this.sprite];
      this.w = s.w * this.scale; this.h = s.h * this.scale;
      this.x = def.tx * T; this.y = (def.row || 11) * T - this.h;
      this.facing = -1; this.t = 0;
    }
    update(g) {
      this.t++;
      const p = g.player;
      this.facing = p.x + p.w / 2 < this.x + this.w / 2 ? -1 : 1;
    }
    near(p) {
      return Math.abs(p.x + p.w / 2 - (this.x + this.w / 2)) < this.w / 2 + 12 * this.scale &&
        p.y < this.y + this.h && p.y + p.h > this.y;
    }
    draw(c, g) {
      const bob = this.float ? Math.round(Math.sin(this.t * 0.05) * 2) - 4 : 0;
      const sx = Math.round(this.x - g.cam), sy = Math.round(this.y) + VY + bob;
      if (this.scale > 1) {
        for (let i = 0; i < 6; i++) {
          const a = this.t * 0.03 + i * 1.05;
          c.fillStyle = i % 2 ? '#f8b800' : '#fcfcfc';
          c.fillRect(Math.round(sx + this.w / 2 + Math.cos(a) * 24), Math.round(sy + this.h / 2 + Math.sin(a) * 30), 1, 1);
        }
      }
      O.drawSpr(c, this.sprite, sx, sy, this.facing < 0, false, this.scale);
      if (this.kind === 'zeus') {
        const bx = this.facing < 0 ? sx - 6 : sx + this.w - 10;
        if ((this.t >> 3) & 1) O.drawSpr(c, 'bolt', bx, sy + 12, this.facing < 0);
      }
      if (this.near(g.player) && !g.dialog && ((this.t >> 4) & 1)) {
        O.drawSpr(c, 'arrowUp', sx + this.w / 2 - 4, sy - 10);
      }
    }
  }
  O.NPC = NPC;
})(window.OLY);
