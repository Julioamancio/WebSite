// Usage: node prop.js [frame1,frame2,...]   (default: hero_idle_0,hero_run_0,hero_run_3,hero_crouch)
// Measures Orpheus' proportions on registered frames: total height, head block (top of hair to the first
// chiton row), torso (chiton top to hem), legs (hem to sole), head ratio = total/head. Also NPC heights.
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
const GAME = require('url').pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
(async () => {
  const names = (process.argv[2] || 'hero_idle_0,hero_run_0,hero_run_3,hero_crouch').split(',');
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(GAME); await p.waitForTimeout(500);
  const r = await p.evaluate((names) => {
    const isCloth = (r, g, b) => (r > 200 && g > 195 && b > 215 && Math.abs(r - g) < 30) ; // white/lavender chiton
    const meas = (k) => {
      const s = OLY.SPR[k]; if (!s) return k + ': missing';
      const t = document.createElement('canvas'); t.width = s.w; t.height = s.h; const x = t.getContext('2d'); x.drawImage(s.n, 0, 0);
      const d = x.getImageData(0, 0, s.w, s.h).data;
      let top = -1, clothTop = -1, clothBot = -1;
      for (let j = 0; j < s.h; j++) {
        let any = false, cloth = 0;
        for (let i = 0; i < s.w; i++) { const o = (j * s.w + i) * 4; if (d[o + 3] < 128) continue; any = true; if (isCloth(d[o], d[o + 1], d[o + 2])) cloth++; }
        if (any && top < 0) top = j;
        if (cloth >= 2) { if (clothTop < 0) clothTop = j; clothBot = j; }
      }
      const total = s.ay - top, head = clothTop - top, legs = s.ay - clothBot, torso = clothBot - clothTop;
      return { frame: k, total, head, torso, legs, ratio: +(total / Math.max(1, head)).toFixed(2) };
    };
    const npc = ['elder_idle_0', 'merchant_idle_0', 'villager_idle_0', 'eurydice_idle_0', 'zeus_idle_0', 'hermes_idle_0', 'satyr_idle_0'].map(k => { const s = OLY.SPR[k]; if (!s) return k + ' missing'; const t = document.createElement('canvas'); t.width = s.w; t.height = s.h; const x = t.getContext('2d'); x.drawImage(s.n, 0, 0); const d = x.getImageData(0, 0, s.w, s.h).data; let top = -1; for (let j = 0; j < s.h && top < 0; j++) for (let i = 0; i < s.w; i++) if (d[(j * s.w + i) * 4 + 3] > 128) { top = j; break; } return k + ' height ' + (s.ay - top); });
    return { hero: names.map(meas), npc };
  }, names);
  console.log(JSON.stringify(r.hero, null, 0).replace(/\},\{/g, '},\n{'));
  console.log(r.npc.join('\n'));
  console.log('errors:', errs.join(' | ') || 'none');
  await b.close();
})();
