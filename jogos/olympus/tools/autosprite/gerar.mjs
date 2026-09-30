// node gerar.mjs <fila.json> [go]   — um pedido por vez; grava progresso em fila_estado.json
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { call } from './lib.mjs';
const IDS = JSON.parse(fs.readFileSync('C:/Users/julio/Documents/website/jogos/olympus/assets/sprites/autosprite_ids.json', 'utf8'));
const [filaPath, go] = process.argv.slice(2);
const fila = JSON.parse(fs.readFileSync(filaPath, 'utf8'));
const EST = 'fila_estado.json';
const est = fs.existsSync(EST) ? JSON.parse(fs.readFileSync(EST, 'utf8')) : {};
const LOCK = 'One single character alone, nobody else. Strict profile side view facing RIGHT in every frame, only one eye visible, chest never turning to the camera. Same size, same head size, same clothes and colors in every frame; feet on one ground line. Whole body in frame, nothing cropped. Flat still camera, no zoom, no background. ';
const LOCK_AIR = LOCK.replace('feet on one ground line', 'feet on one ground line except while airborne');
const CLUB = 'He holds the same wooden club in his right hand in every frame; nothing else held; no trails, no effects. ';
const TALK = ' Mouth moving as if talking, clear lip movement, no speech bubble, no text.';
for (const a of fila) {
  const prompt = (a.air ? LOCK_AIR : LOCK) + (a.club ? CLUB : '') + a.prompt + (a.talk ? TALK : '');
  console.log(a.name, 'len', prompt.length);
  if (prompt.length > 600) throw new Error(a.name + ': prompt passa de 600');
}
if (go !== 'go') process.exit(0);
for (const a of fila) {
  if (est[a.name]?.ok) { console.log(a.name, 'já pronto'); continue; }
  const prompt = (a.air ? LOCK_AIR : LOCK) + (a.club ? CLUB : '') + a.prompt + (a.talk ? TALK : '');
  const sq = IDS.sq[a.char];
  if (!est[a.name]?.jobId) {
    const anim = { kind: a.kind, name: a.name, prompt };
    if (a.start !== false) anim.first_frame_pose_id = sq.pose;
    if (a.end) anim.last_frame_pose_id = sq.pose;
    if (a.loop !== undefined) anim.loop = a.loop;
    const r = await call('generate_spritesheet', { characterId: sq.character, videoTier: 'turbo', animations: [anim], spritesheet: { frameSize: 'native', frameCount: 64 } });
    const w = r.json.workflows[0];
    est[a.name] = { jobId: w.jobId, videoId: w.videoId, credits: r.json.usage };
    fs.writeFileSync(EST, JSON.stringify(est, null, 2));
    console.log(a.name, 'na fila', w.jobId, JSON.stringify(r.json.usage));
  }
  try {
    execFileSync('node', ['baixar.mjs', a.name, est[a.name].jobId, est[a.name].videoId], { stdio: 'inherit' });
    execFileSync('python', ['conferir.py', 'raw/' + a.name], { stdio: ['ignore', 'ignore', 'inherit'] });
    est[a.name].ok = true;
  } catch (e) { est[a.name].erro = String(e.message).slice(0, 300); console.error(a.name, 'FALHOU'); }
  fs.writeFileSync(EST, JSON.stringify(est, null, 2));
}
