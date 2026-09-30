// Usage: node estresse_satiro.js - 15 long random fights next to every pit of the forest; the satyr must never fall in.
const path = require('path'); const { chromium } = require('playwright');
const GAME = require('url').pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(GAME); await p.waitForFunction(() => window.OLY && OLY.game, null, { timeout: 30000 });
  const r = await p.evaluate(() => {
    const g = OLY.game, I = OLY.Input, T = 16, res = [];
    const step = () => { I.update(); g.update(); };
    const spots = [[18, 21], [21, 25], [24, 20], [44, 46], [46, 51], [50, 45], [68, 70], [69, 73], [72, 67], [86, 88], [87, 91], [90, 86], [36, 40], [74, 80], [93, 99]]; let shown = false;
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const E = Object.getPrototypeOf(OLY.makeEnemy({ kind: 'satyr', tx: 3 })); const osj = E.safeJump; let jl = [];
    E.safeJump = function (lvl, vx, vy) { const r = osj.call(this, lvl, vx, vy); jl.push('SJ x=' + this.x.toFixed(1) + ' y=' + this.y.toFixed(1) + ' vx=' + vx + ' g=' + this.onGround + ' -> ' + r); if (jl.length > 6) jl.shift(); return r; };
    spots.forEach(([sx, px]) => {
      g.trans = null; g.state = 'play'; g.dialog = null; g.st.hp = 99; g.st.maxHp = 99; g.st.items.club = true;
      g.loadLevel('forest', { tx: 1, row: 11 });
      g.enemies = [OLY.makeEnemy({ kind: 'satyr', tx: sx })]; const s = g.enemies[0]; s.hp = 999; s.dmg = 0; s.atkDmg = 0;
      g.player.place(px * T, 176); g.player.inv = 1e9;
      let fell = false; const hist = [];
      for (let i = 0; i < 1500; i++) {
        I.kb.left = I.kb.right = false;
        const a = rnd();
        if (a < 0.08) I.latch.attack = true; else if (a < 0.12) I.latch.jump = true;
        else if (a < 0.4) I.kb.left = true; else if (a < 0.68) I.kb.right = true;
        step(); hist.push(i + ' x=' + s.x.toFixed(1) + ' y=' + s.y.toFixed(1) + ' vx=' + s.vx.toFixed(2) + ' vy=' + s.vy.toFixed(2) + ' g=' + (s.onGround?1:0) + ' kn=' + s.knock + ' sw=' + s.swing + ' jc=' + s.jumpCool + ' f=' + s.facing + ' px=' + g.player.x.toFixed(0) + ' py=' + g.player.y.toFixed(0)); if (hist.length > 45) hist.shift();
        g.dialog = null;
        if (g.player.y > g.lvl.pxH - 10) g.player.place(px * T, 176);
        if (s.y > g.lvl.pxH) { fell = true; if (!shown) { shown = true; res.push('\n' + jl.join('\n') + '\n' + hist.slice(-12).join('\n') + '\n'); } break; }
      }
      res.push(sx + '/' + px + (fell ? ' CAIU' : ' ok'));
    });
    return res;
  });
  console.log(r.join('  ')); await b.close();
})();
