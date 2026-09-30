import fs from 'node:fs';
import { call, sleep } from './lib.mjs';
const ids = JSON.parse(fs.readFileSync('C:/Users/julio/Documents/website/jogos/olympus/assets/sprites/autosprite_ids.json', 'utf8'));
const prompt = 'The same young man, one single character alone, strict profile side view facing RIGHT, whole body visible from head to sandals, standing relaxed. He holds NO club and no weapon: both hands hold a small golden Greek lyre with seven thin strings in front of his chest, his left hand holding the lyre frame and his right fingers resting on the strings. Same clothes, same colors, same size. Plain background.';
console.log('len', prompt.length);
if (process.argv[2] !== 'go') process.exit(0);
const r = await call('generate_pose', { character_id: ids.sq.orpheus.character, prompt, name: 'Lyre' });
console.log(r.text);
const jobId = r.json?.jobId;
for (let i = 0; i < 30 && jobId; i++) {
  await sleep(35000);
  const j = await call('get_job_status', { jobId }).catch(e => ({ text: e.message }));
  console.log(j.text.slice(0, 400));
  if (/succeeded|failed/.test(j.text)) break;
}
const c = await call('get_character', { characterId: ids.sq.orpheus.character });
const pose = c.json.character.poses.find(p => p.label === 'Lyre');
console.log(JSON.stringify(pose && { id: pose.id, url: !!pose.imageUrl }));
if (pose?.imageUrl) fs.writeFileSync('raw/pose_lira.png', Buffer.from(await (await fetch(pose.imageUrl)).arrayBuffer()));
