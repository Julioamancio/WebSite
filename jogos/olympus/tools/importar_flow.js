// Usage: node importar_flow.js ('<marks json>' | --marks <file.json>) [--dir cenarios|personagens] [--dry] [--downloads <dir>]
// Brings the Flow images the author marked "Pronto" on the prompts page into the project.
// <marks json> = [{"n":"02","file":"vila_longe","marcadoEm":"2026-09-29T22:15:00.000Z"}, ...]
// A mark with "origem" (a file name in Downloads) takes exactly that file — use it when the author
// marked several cards after downloading everything, so the timing rule below cannot tell them apart.
// Timing rule (the author marks Pronto right after downloading): for each mark, oldest first, take the
// newest image in Downloads saved before the mark that no earlier mark or earlier import already took.
// Copies it to assets/<dir>/<file>.<source ext> and records it in assets/<dir>/importados.json.
// Prints one JSON line per mark: {n, file, ok, origem?, destino?, motivo?}.
const fs = require('fs');
const os = require('os');
const path = require('path');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const di = args.indexOf('--downloads');
const DOWNLOADS = di >= 0 ? args[di + 1] : path.join(os.homedir(), 'Downloads');
const dirI = args.indexOf('--dir');
const OUT = path.resolve(__dirname, '..', 'assets', dirI >= 0 ? args[dirI + 1] : 'cenarios');
const LEDGER = path.join(OUT, 'importados.json');
const GRACE_MS = 5000;              // clock slack between the browser and the file system
const WINDOW_MS = 6 * 3600 * 1000;  // ignore images older than this before the mark

const mi = args.indexOf('--marks');
const marks = JSON.parse(mi >= 0 ? fs.readFileSync(args[mi + 1], 'utf8') : (args.find((a) => a.startsWith('[')) || '[]'))
  .filter((m) => m && m.n && m.file && (m.marcadoEm || m.origem))
  .sort((a, b) => (Date.parse(a.marcadoEm) || 0) - (Date.parse(b.marcadoEm) || 0));

const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : {};
const taken = new Set(Object.values(ledger).map((e) => e.origem + '|' + e.mtime));

const images = fs.readdirSync(DOWNLOADS, { withFileTypes: true })
  .filter((d) => d.isFile() && /\.(png|jpe?g|webp)$/i.test(d.name))
  .map((d) => { const full = path.join(DOWNLOADS, d.name); return { name: d.name, full, mtime: fs.statSync(full).mtimeMs }; });

if (!dry) fs.mkdirSync(OUT, { recursive: true });
for (const m of marks) {
  const t = Date.parse(m.marcadoEm);
  const prev = ledger[m.n];
  if (prev && prev.marcadoEm === m.marcadoEm && (!m.origem || prev.origem === m.origem)) { console.log(JSON.stringify({ n: m.n, file: m.file, ok: true, origem: prev.origem, destino: prev.destino, motivo: 'já importado' })); continue; }
  const pick = m.origem
    ? images.find((f) => f.name === m.origem)
    : images
      .filter((f) => f.mtime <= t + GRACE_MS && f.mtime >= t - WINDOW_MS && !taken.has(f.name + '|' + f.mtime))
      .sort((a, b) => b.mtime - a.mtime)[0];
  if (!pick) { console.log(JSON.stringify({ n: m.n, file: m.file, ok: false, motivo: m.origem ? 'arquivo não encontrado em Downloads: ' + m.origem : 'nenhuma imagem nova em Downloads antes da marcação' })); continue; }
  taken.add(pick.name + '|' + pick.mtime);
  const destino = path.join(OUT, m.file + path.extname(pick.name).toLowerCase().replace('.jpeg', '.jpg'));
  if (!dry) {
    fs.copyFileSync(pick.full, destino);
    ledger[m.n] = { file: m.file, origem: pick.name, mtime: pick.mtime, marcadoEm: m.marcadoEm, destino: path.relative(OUT, destino), importadoEm: new Date().toISOString() };
  }
  console.log(JSON.stringify({ n: m.n, file: m.file, ok: true, origem: pick.name, destino: path.relative(OUT, destino) }));
}
if (!dry) fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');
