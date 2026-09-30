import fs from 'node:fs';
import { call, sleep } from './lib.mjs';
const ids = JSON.parse(fs.readFileSync('C:/Users/julio/Documents/website/jogos/olympus/assets/sprites/autosprite_ids.json', 'utf8'));
const cid = ids.sq.orpheus.character;
const prompt = 'The same young man, one single character alone, strict profile side view facing RIGHT, whole body visible from head to sandals, standing relaxed and ready. He holds NOTHING: NO club, NO weapon, NO lyre, both hands empty, loosely closed fists at his sides. Same clothes, same colors, same cape, same headband, same size. Plain background.';
console.log('len', prompt.length);
if (process.argv[2] !== 'go') process.exit(0);
const before = (await call('get_character', { characterId: cid })).json.character.poses.map((p) => p.id);
const r = await call('generate_pose', { character_id: cid, prompt, name: 'Unarmed' });
console.log(r.text.slice(0, 300));
for (let i = 0; i < 20; i++) {
  await sleep(20000);
  const c = await call('get_character', { characterId: cid }).catch(() => null);
  const p = c && c.json.character.poses.find((x) => !before.includes(x.id) && x.imageUrl);
  if (p) {
    fs.writeFileSync('raw/pose_maos.png', Buffer.from(await (await fetch(p.imageUrl)).arrayBuffer()));
    ids.poses_extra = Object.assign(ids.poses_extra || {}, { orpheus_unarmed: p.id, orpheus_lyre: 'cmuni42a0000333vpt5jommca' });
    fs.writeFileSync('C:/Users/julio/Documents/website/jogos/olympus/assets/sprites/autosprite_ids.json', JSON.stringify(ids, null, 2));
    console.log('POSE', p.id);
    break;
  }
}
