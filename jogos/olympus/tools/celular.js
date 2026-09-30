// Usage: node celular.js <out.png> [url] — the game on a phone held sideways (touch controls on).
const { chromium, devices } = require('playwright');
(async () => {
  const [out, url = 'https://orpheus.destruitor.com.br/'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13 landscape'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(url);
  await p.waitForFunction(() => window.OLY && OLY.game, null, { timeout: 60000 });
  await p.evaluate(() => { const g = OLY.game; g.trans = null; g.st.items.club = true; g.state = 'play'; g.loadLevel('village', { tx: 8, row: 11 }); g.banner = 0; });
  await p.waitForTimeout(800);
  await p.screenshot({ path: out });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
