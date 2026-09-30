// Usage: node regressao_online.js [url] — runs regressao.js against the published site instead of the local files.
const fs = require('fs'), path = require('path');
const url = process.argv[2] || 'https://orpheus.destruitor.com.br/';
const src = fs.readFileSync(path.join(__dirname, 'regressao.js'), 'utf8').replace(/const GAME = [^;]+;/, 'const GAME = ' + JSON.stringify(url) + ';');
const tmp = path.join(__dirname, '.regressao_online_tmp.js');
fs.writeFileSync(tmp, src);
try { require(tmp); } finally { setTimeout(() => { try { fs.unlinkSync(tmp); } catch (e) { /* already gone */ } }, 5000); }
