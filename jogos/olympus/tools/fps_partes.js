// Usage: node fps_partes.js — FPS of the forest with parts of the drawing switched off, to find what costs.
const path = require('path');
const { chromium } = require('playwright');
const GAME = require('url').pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const CASES = {
  tudo: '',
  semHUD: 'OLY.UI.drawHUD = function () {};',
  semAmbiente: 'OLY.Game.prototype.drawAmbient = function () {};',
  semChao: 'OLY.HD.drawGround = function () {};',
  semInimigos: 'OLY.game.enemies = [];',
  semVinheta: 'OLY.HD.post = function () {};'
};
(async () => {
  const b = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
  for (const [name, js] of Object.entries(CASES)) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.goto(GAME);
    await p.waitForFunction(() => window.OLY && OLY.game, null, { timeout: 30000 });
    const fps = await p.evaluate(async (js) => {
      const g = OLY.game; g.trans = null; g.state = 'play'; g.loadLevel('forest', { tx: 55, row: 11 }); g.banner = 0;
      g.player.inv = 1e9; g.st.hp = 99; g.st.maxHp = 99;
      eval(js);
      await new Promise((r) => setTimeout(r, 600));
      let n = 0; const t0 = performance.now();
      await new Promise((r) => { const f = () => { n++; if (performance.now() - t0 < 2500) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
      return n / ((performance.now() - t0) / 1000);
    }, js);
    console.log(name.padEnd(12), fps.toFixed(1));
    await p.close();
  }
  await b.close();
})();
