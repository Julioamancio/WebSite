// Usage: node cutshot.js <outDir> <cutscene> [shot:time ...]
// Captures frames of an HD cutscene (see js/cutscene.js). Without shot:time pairs it captures the middle of every shot.
const path = require('path');
const { chromium } = require('playwright');
const GAME = require('url').pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
(async () => {
  const [out, name, ...pairs] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(GAME);
  await p.waitForFunction(() => window.OLY && OLY.game, null, { timeout: 30000 });
  const shots = await p.evaluate((name) => {
    const g = OLY.game; g.trans = null; g.st = g.st || {}; g.loadLevel('village', { tx: 5, row: 11 });
    OLY.Cutscene.start(g, [name], null);
    return OLY.Cutscene.data[name].map((s) => s.dur);
  }, name);
  const list = pairs.length ? pairs.map((q) => q.split(':').map(Number)) : shots.map((d, i) => [i, d / 2]);
  for (const [i, t] of list) {
    await p.evaluate(([i, t]) => { OLY.Cutscene.seek(i, t); }, [i, t]);
    await p.waitForTimeout(120);
    const f = path.join(out, `${name}_${i}_${String(t).replace('.', '_')}.png`);
    await p.locator('#screen').screenshot({ path: f });
    console.log(f);
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
