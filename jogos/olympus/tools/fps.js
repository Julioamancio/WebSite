// Usage: node fps.js — real frames per second of the running game (GPU on) in each level and in a cutscene.
const path = require('path');
const { chromium } = require('playwright');
const GAME = require('url').pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
(async () => {
  const b = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(GAME);
  await p.waitForFunction(() => window.OLY && OLY.game, null, { timeout: 30000 });
  const gpu = await p.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl'); const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'sem webgl'; });
  console.log('GPU:', gpu);
  const cases = [['village', 20], ['forest', 55], ['forest', 30], ['den', 8], ['zeus', 8], ['hermes', 8], ['title'], ['cut']];
  for (const [lvl, tx] of cases) {
    const fps = await p.evaluate(async ([lvl, tx]) => {
      const g = OLY.game; g.trans = null; g.dialog = null;
      if (lvl === 'title') g.state = 'title';
      else if (lvl === 'cut') { g.state = 'play'; OLY.Cutscene.start(g, ['cs4'], null); }
      else { g.state = 'play'; g.loadLevel(lvl, { tx, row: 11 }); g.banner = 0; }
      await new Promise((r) => setTimeout(r, 500));
      let n = 0; const t0 = performance.now();
      await new Promise((r) => { const f = () => { n++; if (performance.now() - t0 < 2500) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
      return n / ((performance.now() - t0) / 1000);
    }, [lvl, tx]);
    console.log('fps', lvl, tx || '', fps.toFixed(1));
  }
  await b.close();
})();
