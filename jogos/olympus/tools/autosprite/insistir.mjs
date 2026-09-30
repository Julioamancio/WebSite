// node insistir.mjs <fila.json> — runs gerar.mjs again every 3 minutes until every item is OK (max 30 tries).
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const fila = process.argv[2], EST = process.env.EST;
for (let i = 1; i <= 30; i++) {
  spawnSync('node', ['gerar.mjs', fila, 'go'], { stdio: 'inherit', env: process.env });
  const est = JSON.parse(fs.readFileSync(EST, 'utf8'));
  const names = JSON.parse(fs.readFileSync(fila, 'utf8')).map((a) => a.name);
  const faltam = names.filter((n) => !(est[n] && est[n].ok));
  console.log(new Date().toISOString().slice(11, 19), 'tentativa', i, 'faltam', faltam.join(',') || 'nada');
  if (!faltam.length) break;
  await new Promise((r) => setTimeout(r, 180000));
}
