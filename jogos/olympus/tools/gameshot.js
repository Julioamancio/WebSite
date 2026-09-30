// Usage: node gameshot.js <out.png> <level> <tx> [row] [scale] [extraJS]
// Loads the real game, jumps into a level with the hero at tile tx, and saves a screenshot.
// Special level names: title | story0..story4 | pause | dialog | gameover | ending | itemget
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
const GAME = require('url').pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
(async () => {
  const [out, level = 'village', tx = '6', row = '11', scale = '5', extra = ''] = process.argv.slice(2);
  const S = +scale;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 384 * S, height: 216 * S } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await p.goto(GAME);
  await p.waitForFunction(() => window.OLY && OLY.game, null, { timeout: 30000 });
  await p.waitForTimeout(300);
  await p.evaluate(([level, tx, row, extra]) => {
    const g = OLY.game; g.trans = null; g.st.items.club = true;
    if (level === 'title') { g.state = 'title'; }
    else if (level.startsWith('story')) { g.state = 'story'; g.page = +level.slice(5); g.chars = 999; g.storyT = 200; }
    else if (level === 'gameover') { g.state = 'gameover'; }
    else if (level === 'ending') { g.state = 'ending'; g.endT = 9999; }
    else {
      const L = ['pause', 'dialog', 'itemget'].includes(level) ? 'village' : level;
      g.state = 'play'; g.loadLevel(L, { tx: +tx, row: +row }); g.banner = 0;
      if (level === 'pause') g.state = 'pause';
      if (level === 'dialog') { g.say('ELDER', ['ORPHEUS... I SAW IT ALL. THE SERPENT, AND THEN THE SHADOW OF HADES TAKING EURYDICE AWAY.']); g.dialog.chars = 999; }
      if (level === 'itemget') { g.giveItem('club', null); g.itemT = 80; }
    }
    if (extra) eval(extra);
  }, [level, tx, row, extra]);
  await p.waitForTimeout(700);
  await p.locator('#screen').screenshot({ path: out });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
