// Usage: node preview.js <out.png> <prefix1,prefix2,...> [zoom] [bg]
// Renders every registered sprite whose name starts with one of the prefixes, zoomed, with names and
// anchor markers (red dot = anchor/feet point). bg: checker | sky | night | cave | marble
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
const GAME = require('url').pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
(async () => {
  const [out, prefixes = 'hero_', zoom = '4', bg = 'checker'] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await p.goto(GAME);
  await p.waitForTimeout(400);
  const h = await p.evaluate(([prefixes, zoom, bg]) => {
    document.body.innerHTML = '';
    const Z = +zoom, list = Object.keys(OLY.SPR).filter(k => prefixes.split(',').some(pr => k.startsWith(pr)));
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 4000;
    document.body.appendChild(cv); document.body.style.margin = 0;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    const BG = { checker: null, sky: '#8fc8f0', night: '#241f4c', cave: '#2a1a14', marble: '#d5d0e2' };
    let x = 10, y = 10, rowH = 0;
    const cells = [];
    list.forEach(k => { const s = OLY.SPR[k]; const w = Math.max(s.w * Z, 90), hh = s.h * Z + 18; if (x + w > 1590) { x = 10; y += rowH + 10; rowH = 0; } cells.push([k, x, y]); x += w + 10; rowH = Math.max(rowH, hh); });
    const total = y + rowH + 10;
    cv.height = total; c.imageSmoothingEnabled = false;
    c.fillStyle = '#202028'; c.fillRect(0, 0, 1600, total);
    cells.forEach(([k, x, y]) => {
      const s = OLY.SPR[k];
      if (BG[bg]) { c.fillStyle = BG[bg]; c.fillRect(x, y, s.w * Z, s.h * Z); }
      else for (let j = 0; j < s.h; j += 4) for (let i = 0; i < s.w; i += 4) { c.fillStyle = ((i + j) / 4) % 2 ? '#3a3a46' : '#2e2e38'; c.fillRect(x + i * Z, y + j * Z, 4 * Z, 4 * Z); }
      c.drawImage(s.n, x, y, s.w * Z, s.h * Z);
      c.fillStyle = '#ff2040'; c.fillRect(x + s.ax * Z + Z / 2 - 2, y + s.ay * Z + Z / 2 - 2, 4, 4);
      c.fillStyle = '#ddd'; c.font = '11px monospace'; c.fillText(k + ' ' + s.w + 'x' + s.h, x, y + s.h * Z + 13);
    });
    return total;
  }, [prefixes, zoom, bg]);
  await p.setViewportSize({ width: 1600, height: Math.min(8000, Math.max(200, h)) });
  await p.screenshot({ path: out, fullPage: true });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
