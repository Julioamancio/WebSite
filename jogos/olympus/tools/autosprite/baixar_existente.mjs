// node baixar_existente.mjs <characterId> <kind> <nomeSaida>  — baixa a folha já existente (sem gastar)
import fs from 'node:fs';
import { call } from './lib.mjs';
const [cid, kind, nome] = process.argv.slice(2);
const c = await call('list_spritesheets', { characterId: cid, limit: 50 }).catch(() => null);
const txt = c?.text || '';
let items = c?.json?.items || c?.json?.spritesheets || [];
if (!items.length) { const ch = (await call('list_characters', {})).json.items.find(x => x.id === cid); items = ch.spritesheets; }
const s = items.find(x => x.kind === kind);
if (!s) { console.log('não achei', kind, txt.slice(0, 500)); process.exit(1); }
const full = (await call('get_spritesheet', { spritesheetId: s.id })).json.spritesheet;
console.log(JSON.stringify({ id: full.id, frames: full.frameCount, w: full.frameWidth, video: full.sourceVideoId }));
fs.mkdirSync('raw', { recursive: true });
for (const [u, ext] of [[full.sheetUrl, 'png'], [full.atlasUrl, 'json']]) fs.writeFileSync(`raw/${nome}.${ext}`, Buffer.from(await (await fetch(u)).arrayBuffer()));
fs.writeFileSync(`raw/${nome}_meta.json`, JSON.stringify(full, null, 1));
