import fs from 'node:fs';
import { call } from './lib.mjs';
const DIR = 'C:/Users/julio/Documents/website/jogos/olympus/assets/personagens/';
const OUT = 'C:/Users/julio/Documents/website/jogos/olympus/assets/sprites/autosprite_ids.json';
const ids = JSON.parse(fs.readFileSync(OUT, 'utf8'));
ids.sq ??= {};
for (const n of ['orpheus', 'eurydice', 'elder', 'merchant', 'villager', 'zeus', 'hermes', 'hades']) {
  if (ids.sq[n]) { console.log(n, 'já subido'); continue; }
  const u = (await call('request_upload_url', { fileName: `olympus_${n}_sq.png`, contentType: 'image/png' })).json;
  const put = await fetch(u.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: fs.readFileSync(DIR + n + '_sq.png') });
  if (!put.ok) throw new Error(`PUT ${n}: ${put.status}`);
  const c = await call('upload_character', { name: `olympus_${n}_sq`, uploadKey: u.uploadKey, isHumanoid: true });
  const id = c.json?.character?.id || c.json?.id;
  const g = await call('get_character', { characterId: id });
  const pose = g.json.character.poses.find(p => p.label === 'Original')?.id;
  ids.sq[n] = { character: id, pose };
  fs.writeFileSync(OUT, JSON.stringify(ids, null, 2));
  console.log(n, '->', id, 'pose', pose);
}
