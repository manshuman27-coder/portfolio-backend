// HS256 JWT + scrypt password hashing using only Node's crypto
const c = require('crypto'), { secret } = require('../config/env');
const b = x => Buffer.from(x).toString('base64url');
const mac = s => c.createHmac('sha256', secret).update(s).digest('base64url');
const sign = (p, ttl) => { const s = b('{"alg":"HS256","typ":"JWT"}') + '.' + b(JSON.stringify({ ...p, exp: Math.floor(Date.now() / 1000) + ttl })); return s + '.' + mac(s); };
const verify = t => { try { const [h, p, s] = t.split('.'), e = mac(h + '.' + p);
  if (s.length !== e.length || !c.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null;
  const o = JSON.parse(Buffer.from(p, 'base64url')); return o.exp > Date.now() / 1000 ? o : null; } catch { return null; } };
const hash = pw => { const s = c.randomBytes(16).toString('hex'); return s + ':' + c.scryptSync(pw, s, 64).toString('hex'); };
const check = (pw, h) => { const [s, k] = h.split(':'), n = c.scryptSync(pw, s, 64); return c.timingSafeEqual(n, Buffer.from(k, 'hex')); };
module.exports = { sign, verify, hash, check };
