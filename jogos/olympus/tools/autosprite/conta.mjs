import { call } from './lib.mjs';
const chars = (await call('list_characters', {})).json;
for (const c of chars.items || []) {
  const kinds = (c.spritesheets || []).map(s => s.kind + (s.direction ? '/' + s.direction : ''));
  console.log(`${c.id}  ${c.name.padEnd(22)} ${kinds.length} folhas: ${kinds.join(', ')}`);
}
console.log('--- jobs recentes');
const j = await call('list_jobs', { limit: 50 });
const items = j.json?.items || j.json?.jobs || [];
for (const x of items) console.log(JSON.stringify(x).slice(0, 260));
if (!items.length) console.log(j.text.slice(0, 3000));
