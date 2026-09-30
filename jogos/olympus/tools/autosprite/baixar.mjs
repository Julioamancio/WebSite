// node baixar.mjs <nomeArquivo> <jobId> <videoId>
// Espera o job, reextrai no máximo (grátis), baixa folha + atlas em raw/.
import fs from 'node:fs';
import { call, sleep } from './lib.mjs';
const [nome, jobId, videoId] = process.argv.slice(2);
fs.mkdirSync('raw', { recursive: true });

async function esperar(id) {
  for (let i = 0; i < 40; i++) {
    await sleep(35000);
    let j;
    try { j = await call('get_job_status', { jobId: id }); } catch (e) { console.error('status falhou:', e.message.slice(0, 150)); continue; }
    const st = j.json?.status || (j.text.match(/"status":\s*"([^"]+)"/) || [])[1];
    console.log(new Date().toISOString().slice(11, 19), id.slice(0, 14), st);
    if (st === 'succeeded') return j;
    if (st === 'failed') throw new Error('job falhou: ' + j.text.slice(0, 800));
  }
  throw new Error('tempo esgotado');
}

const j1 = await esperar(jobId);
fs.writeFileSync(`raw/${nome}_job.json`, j1.text);
// reextrair no máximo
const rg = await call('regenerate_single_spritesheet', { videoId, frameSize: 0, maxFrames: 0, compression: 'none' });
fs.writeFileSync(`raw/${nome}_regen.json`, rg.text);
const rgJob = rg.json?.jobId || (rg.text.match(/"jobId":\s*"([^"]+)"/) || [])[1];
let sheetIds;
if (rgJob) {
  const j2 = await esperar(rgJob);
  sheetIds = j2.json?.spritesheetIds || [...j2.text.matchAll(/"(c[a-z0-9]{24})"/g)].map(m => m[1]);
  fs.writeFileSync(`raw/${nome}_regenjob.json`, j2.text);
} else {
  sheetIds = rg.json?.spritesheetIds || [rg.json?.spritesheetId].filter(Boolean);
}
console.log('spritesheets:', sheetIds);
const ss = await call('get_spritesheet', { spritesheetId: sheetIds[sheetIds.length - 1] });
fs.writeFileSync(`raw/${nome}_sheet.json`, ss.text);
const s = ss.json?.spritesheet || ss.json;
const sheetUrl = s?.sheetUrl || (ss.text.match(/"sheetUrl":\s*"([^"]+)"/) || [])[1];
const atlasUrl = s?.atlasUrl || (ss.text.match(/"atlasUrl":\s*"([^"]+)"/) || [])[1];
for (const [u, ext] of [[sheetUrl, 'png'], [atlasUrl, 'json']]) {
  const r = await fetch(u); if (!r.ok) throw new Error(`download ${ext}: ${r.status}`);
  fs.writeFileSync(`raw/${nome}.${ext}`, Buffer.from(await r.arrayBuffer()));
}
console.log('OK', nome, fs.statSync(`raw/${nome}.png`).size, 'bytes');
