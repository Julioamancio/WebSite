import fs from 'node:fs';
import { call } from './lib.mjs';
const IDS = 'C:/Users/julio/Documents/website/jogos/olympus/assets/sprites/autosprite_ids.json';
const ids = JSON.parse(fs.readFileSync(IDS, 'utf8'));
ids.enemies ??= {};
const STYLE = 'for a 2.5D side-scrolling game, stylized 3D animated-film look like a premium animated movie, soft warm light, hand-painted textures. ';
const LOCK = ' Strict side view facing RIGHT, whole body visible, one single creature, no other objects.';
const E = {
  snake: { hum: false, desc: 'a long olive-green viper that slithers along the ground and strikes forward',
    p: 'A mythical Greek forest viper enemy ' + STYLE + 'Long olive-green snake with a dark diamond pattern on its back and a pale yellow belly, head raised, glowing amber eyes, small red forked tongue, body lying low along the ground in gentle curves.' + LOCK },
  bat: { hum: false, desc: 'a cave bat that flies by flapping its leathery wings',
    p: 'A cave bat enemy ' + STYLE + 'Purple-brown fur, big pointed ears, glowing red eyes, tiny white fangs, leathery wings spread wide while flying, both wings and the whole body visible.' + LOCK },
  satyr: { hum: true,
    p: 'A satyr enemy from Greek myth ' + STYLE + 'Muscular tan upper body, curled ram horns, wild dark-brown hair and beard, goat legs with shaggy dark-brown fur and black hooves, holding a crude wooden club in his right hand, aggressive grin, standing.' + LOCK.replace('one single creature', 'one single character') },
  boar: { hum: false, desc: 'a giant wild boar that stands, paws the ground, charges and gets stunned',
    p: 'The giant Erymanthian Boar, a mythical wild boar boss ' + STYLE + 'Huge dark reddish-brown body, tall bristly mane along the spine, long curved ivory tusks, one tusk wrapped with a thin glowing golden lyre string, scarred snout, fierce red eye, standing on all four hooves.' + LOCK }
};
for (const [n, e] of Object.entries(E)) {
  if (e.p.length > 600) throw new Error(n + ' prompt ' + e.p.length);
  console.log(n, e.p.length);
}
if (process.argv[2] !== 'go') process.exit(0);
fs.mkdirSync('raw', { recursive: true });
for (const [n, e] of Object.entries(E)) {
  if (ids.enemies[n]) { console.log(n, 'já existe'); continue; }
  const args = { name: 'olympus_' + n, prompt: e.p, quality: 'pro', isHumanoid: e.hum };
  if (e.desc) args.characterDescription = e.desc;
  const r = await call('create_character', args);
  const ch = r.json?.character || r.json;
  const id = ch?.id;
  console.log(n, id, (r.text.match(/"credits\w*":\s*\d+/g) || []).join(' '));
  if (!id) { console.log(r.text.slice(0, 800)); continue; }
  const g = await call('get_character', { characterId: id });
  const c = g.json.character;
  ids.enemies[n] = { character: id, pose: (c.poses.find((p) => p.label === 'Original') || c.poses[0] || {}).id };
  fs.writeFileSync(IDS, JSON.stringify(ids, null, 2));
  fs.writeFileSync('raw/base_' + n + '.png', Buffer.from(await (await fetch(c.baseImageUrl)).arrayBuffer()));
}
