const E = (msg, code) => Object.assign(new Error(msg), { code });
const send = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
const fail = (res, code, msg) => send(res, code, { success: false, error: msg });
const body = (req, max = 1e6) => new Promise((ok, no) => { const a = []; let n = 0;
  req.on('data', c => { n += c.length; if (n > max) { no(E('Payload too large', 413)); req.destroy(); } else a.push(c); });
  req.on('end', () => ok(Buffer.concat(a))); req.on('error', no); });
const json = async req => { const b = await body(req); if (!b.length) return {}; try { return JSON.parse(b); } catch { throw E('Invalid JSON', 400); } };
module.exports = { send, fail, body, json };
