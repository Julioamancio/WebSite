import fs from 'node:fs';
import { call } from './lib.mjs';
const DIR = 'C:/Users/julio/Documents/website/jogos/olympus/assets/personagens/';
const NAMES = ['orpheus', 'eurydice', 'elder', 'merchant', 'villager', 'zeus', 'hermes', 'hades'];
const OUT = 'C:/Users/julio/Documents/website/jogos/olympus/assets/sprites/autosprite_ids.json';
const ids = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { characters: {}, spritesheets: {} };
for (const n of NAMES) {
  if (ids.characters[n]) { console.log(n, 'já subido', ids.characters[n]); continue; }
  const u = (await call('request_upload_url', { fileName: `olympus_${n}.png`, contentType: 'image/png' })).json;
  const put = await fetch(u.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: fs.readFileSync(DIR + n + '.png') });
  if (!put.ok) throw new Error(`PUT ${n}: ${put.status}`);
  const c = await call('upload_character', { name: `olympus_${n}`, uploadKey: u.uploadKey, isHumanoid: true });
  const id = c.json?.character?.id || c.json?.id || (c.text.match(/"id":\s*"([^"]+)"/) || [])[1];
  if (!id) { console.log(c.text); throw new Error('sem id para ' + n); }
  ids.characters[n] = id;
  fs.mkdirSync(DIR.replace('personagens/', 'sprites/'), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(ids, null, 2));
  console.log(n, '->', id);
}
