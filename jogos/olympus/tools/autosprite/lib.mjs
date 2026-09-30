// Cliente MCP do AutoSprite (chave só de process.env.AUTOSPRITE_API_KEY).
const URL_ = 'https://www.autosprite.io/api/mcp';
const KEY = process.env.AUTOSPRITE_API_KEY;
if (!KEY) throw new Error('sem AUTOSPRITE_API_KEY');
let sid = null, idn = 1, ready = false;

async function rpc(method, params, notify = false) {
  const body = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: idn++, method, params };
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + KEY };
  if (sid) h['Mcp-Session-Id'] = sid;
  const r = await fetch(URL_, { method: 'POST', headers: h, body: JSON.stringify(body), signal: AbortSignal.timeout(600000) });
  const s = r.headers.get('mcp-session-id'); if (s) sid = s;
  if (notify) return null;
  const txt = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 500)}`);
  const ct = r.headers.get('content-type') || '';
  let msgs = [];
  if (ct.includes('text/event-stream')) {
    for (const line of txt.split(/\r?\n/)) if (line.startsWith('data:')) { try { msgs.push(JSON.parse(line.slice(5))); } catch {} }
  } else msgs = [JSON.parse(txt)];
  const m = msgs.find(x => x.id !== undefined && (x.result || x.error)) || msgs[msgs.length - 1];
  if (m?.error) throw new Error(JSON.stringify(m.error));
  return m?.result;
}

export async function call(name, args = {}, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      if (!ready) { await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'orpheus-cli', version: '1' } }); await rpc('notifications/initialized', {}, true); ready = true; }
      const r = await rpc('tools/call', { name, arguments: args });
      const text = (r.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
      if (r.isError) throw new Error(`${name}: ${text}`);
      const first = text.trim().startsWith('{') ? text.slice(0, text.lastIndexOf('}') + 1) : null;
      let json = null; try { json = first ? JSON.parse(first) : null; } catch {}
      return { text, json };
    } catch (e) {
      if (i >= tries || String(e.message).includes(`${name}:`)) throw e;
      console.error(`[tentativa ${i} falhou: ${e.message.slice(0, 200)}]`); ready = false; sid = null;
      await new Promise(r => setTimeout(r, 5000 * i));
    }
  }
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
