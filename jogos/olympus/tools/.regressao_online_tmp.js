// Deterministic gameplay regression: snake needs a crouch attack, elder gives the club, Zeus blesses and saves,
// the boar dies and opens the door, Hermes gives the sandals and the ending plays, jump heights, continue, frame time.
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
const GAME = "https://orpheus.destruitor.com.br/";
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1152, height: 648 } });
  const errs = []; p.on('pageerror', e => errs.push('ERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CERR ' + m.text()); });
  await p.goto(GAME); await p.waitForFunction(() => window.OLY && OLY.game, null, { timeout: 30000 }); await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const g = OLY.game, I = OLY.Input, out = {}, T = 16;
    out.hd = !!(OLY.HD && OLY.HD.on && OLY.SPR.hero_idle_0.hd);
    const cutAvail = OLY.Cutscene.available; OLY.Cutscene.available = () => false; // gameplay first, cutscenes below
    try { localStorage.clear(); } catch (e) {}
    const step = n => { for (let i = 0; i < n; i++) { I.update(); g.update(); } };
    const talkThrough = (until, max) => { for (let i = 0; i < (max || 80) && !until(); i++) { if (g.dialog) { I.latch.jump = true; } step(4); } };
    g.trans = null; g.state = 'play';
    // snake: standing misses, crouching hits
    g.st.items.club = true; g.loadLevel('forest', { tx: 1, row: 11 });
    const mk = () => { g.enemies = [OLY.makeEnemy({ kind: 'snake', tx: 3 })]; g.enemies[0].update = () => {}; g.player.place(2 * T, 176); g.player.facing = 1; g.player.inv = 999; };
    mk(); step(2); I.latch.attack = true; step(14); out.standKills = g.enemies.length === 0;
    step(20); mk(); I.kb.down = true; step(3); I.latch.attack = true; step(14); I.kb.down = false; step(3); out.crouchKills = g.enemies.length === 0;
    // elder gives the club
    g.st = { hp: 12, maxHp: 12, olives: 0, ambrosia: 0, items: { club: false, sandals: false }, flags: {} };
    g.loadLevel('village', { tx: 8, row: 11 }); step(5); I.latch.up = true; step(2);
    talkThrough(() => g.st.items.club && !g.dialog && g.state === 'play', 120); out.club = g.st.items.club;
    // Zeus blessing + save
    g.loadLevel('zeus', { tx: 10, row: 11 }); step(5); I.latch.up = true; step(2);
    talkThrough(() => g.st.maxHp === 16 && !g.dialog && g.state === 'play', 150);
    out.zeus = { maxHp: g.st.maxHp, saved: !!localStorage.getItem('orpheus_song_of_olympus_v1') };
    // boss
    g.loadLevel('den', { tx: 2, row: 11 }); const bo = g.enemies[0]; bo.setState('idle'); bo.hp = 1;
    g.player.place(bo.x - 14, 176); g.player.facing = 1; g.player.inv = 9999; step(2); I.latch.attack = true; step(160);
    talkThrough(() => !g.dialog, 40); out.boss = { def: !!g.st.flags.boarDefeated, door: g.lvl.tile(21, 9) };
    // Hermes -> sandals -> ending
    g.loadLevel('hermes', { tx: 10, row: 11 }); step(5); I.latch.up = true; step(2);
    for (let i = 0; i < 200 && g.state !== 'ending' && !(g.trans && g.st.flags.part1Done); i++) { if (g.dialog) I.latch.jump = true; step(4); }
    step(40); out.end = { state: g.state, sandals: g.st.items.sandals, part1: !!g.st.flags.part1Done };
    // jump heights
    const jump = (sandals) => { g.st.items.sandals = sandals; g.state = 'play'; g.trans = null; g.loadLevel('forest', { tx: 2, row: 11 }); g.enemies = []; step(3); let min = 1e9; I.latch.jump = true; I.kb.jump = true; for (let i = 0; i < 70; i++) { I.update(); g.update(); min = Math.min(min, g.player.y + g.player.h); } I.kb.jump = false; step(40); return +(176 - min).toFixed(1); };
    out.jump = jump(false); out.jumpSandals = jump(true);
    // continue from save
    g.state = 'gameover'; g.continueAfterDeath(); out.continue = { state: g.state, lvl: g.lvl.id, hp: g.st.hp };
    // weapons: fists before the club (shorter reach), the club after it, C swaps between them
    g.st = { hp: 12, maxHp: 12, olives: 0, ambrosia: 0, items: { club: false, sandals: false }, flags: { nwHint: 1 } };
    g.state = 'play'; g.trans = null; g.dialog = null;
    g.loadLevel('forest', { tx: 1, row: 11 });
    const bat = (dx) => { g.enemies = [OLY.makeEnemy({ kind: 'bat', tx: 3, row: 10 })]; const b = g.enemies[0]; b.state = 'fly'; b.update = () => {}; g.player.place(2 * T, 176); g.player.facing = 1; g.player.inv = 999; b.x = g.player.x + g.player.w + dx; b.y = 176 - 26; return b; };
    bat(4); step(2); I.latch.attack = true; step(16); out.punchNear = g.enemies.length === 0;
    bat(18); step(2); I.latch.attack = true; step(16); out.punchFar = g.enemies.length === 0;
    g.st.items.club = true; g.st.weapon = 'club';
    bat(18); step(2); I.latch.attack = true; step(16); out.clubFar = g.enemies.length === 0;
    step(12); I.latch.swap = true; step(2); out.swapTo = g.st.weapon; I.latch.swap = true; step(2); out.swapBack = g.st.weapon;
    // enemy attacks hurt: satyr club, snake strike, boar tusks
    const hurtBy = (kind, place) => {
      g.dialog = null; g.st.hp = 12; g.player.place(6 * T, 176); g.player.inv = 0; g.player.facing = 1;
      const e = kind === 'boar' ? new OLY.Boar(9 * T, 176) : OLY.makeEnemy({ kind, tx: 8 });
      g.enemies = [e]; place(e); const hp0 = g.st.hp;
      for (let i = 0; i < 160 && g.st.hp === hp0; i++) step(1);
      return hp0 - g.st.hp;
    };
    out.satyrHits = hurtBy('satyr', (e) => { e.x = g.player.x + 24; e.swingCool = 0; e.dmg = 0; });
    out.snakeHits = hurtBy('snake', (e) => { e.x = g.player.x + 40; e.cool = 0; e.facing = -1; e.dmg = 0; });
    g.loadLevel('den', { tx: 2, row: 11 }); g.st.flags.cs_boar = 1;
    out.boarGore = hurtBy('boar', (e) => { e.setState('idle'); e.st = 25; e.x = g.player.x + g.player.w + 4; e.dir = e.facing = -1; e.dmg = 0; });
    g.st = Object.assign(g.st, { items: { club: true, sandals: true } });
    // cutscenes: entering the temple plays the Zeus cutscene, then Zeus talks; the opening runs to the village
    OLY.Cutscene.available = cutAvail; g.st.flags = {}; g.state = 'play'; g.trans = null;
    g.loadLevel('zeus', { tx: 2, row: 11 }); out.cutZeus = g.state === 'cut';
    for (let i = 0; i < 900 && g.state === 'cut'; i++) step(1);
    out.cutZeusThen = { state: g.state, dialog: !!g.dialog, talking: g.talking && g.talking.kind };
    g.dialog = null; g.startNew(true); out.opening = g.state === 'cut';
    for (let i = 0; i < 400 && g.state === 'cut'; i++) { I.latch.jump = true; step(60); if (g.trans) step(40); }
    out.openingEnd = { state: g.state, lvl: g.lvl && g.lvl.id };
    return out;
  });
  console.log(JSON.stringify(r));
  // performance: average draw+update cost per frame in heavy scenes
  for (const [lvl, tx, row] of [['village', 20, 11], ['forest', 55, 11], ['den', 8, 11], ['zeus', 8, 11]]) {
    const ms = await p.evaluate(([lvl, tx, row]) => { const g = OLY.game; g.trans = null; g.state = 'play'; g.loadLevel(lvl, { tx, row }); g.banner = 0; for (let i = 0; i < 20; i++) { g.update(); g.draw(); } const t0 = performance.now(); for (let i = 0; i < 120; i++) { g.update(); g.draw(); } return (performance.now() - t0) / 120; }, [lvl, tx, row]);
    console.log('frame ms', lvl, ms.toFixed(2));
  }
  const tms = await p.evaluate(() => { const g = OLY.game; g.state = 'title'; const t0 = performance.now(); for (let i = 0; i < 60; i++) { g.t++; g.draw(); } return (performance.now() - t0) / 60; });
  console.log('frame ms title', tms.toFixed(2));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
