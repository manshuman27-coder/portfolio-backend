const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { d, save, id, now } = require('../config/db');
const { send, fail, json, body } = require('../utils/http');
const auth = require('../middleware/auth'), limited = require('../middleware/rateLimit'), tok = require('../services/token'), mail = require('../services/email');
const UP = path.join(__dirname, '../../uploads');
const REQ = { skills: ['name'], projects: ['title'], blogs: ['title', 'content'], experience: ['role', 'company'], testimonials: ['name', 'quote'], services: ['title'] };
const clean = o => { const r = {}; for (const [k, v] of Object.entries(o || {})) {
  if (['id', 'createdAt'].includes(k)) continue;
  if (typeof v === 'string') r[k] = v.trim().slice(0, 20000);
  else if (typeof v === 'number' || typeof v === 'boolean') r[k] = v;
  else if (Array.isArray(v)) r[k] = v.filter(x => typeof x === 'string').map(x => x.trim().slice(0, 500)).slice(0, 50); } return r; };
const slug = (s, list, self) => { let b = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item', x = b, i = 2;
  while (list.some(e => e.slug === x && e.id !== self)) x = b + '-' + i++; return x; };
const pair = u => ({ accessToken: tok.sign({ sub: u.id, type: 'access' }, 900), refreshToken: tok.sign({ sub: u.id, type: 'refresh' }, 604800) });

module.exports = async (req, res, u) => {
  const [r, x] = u.pathname.split('/').slice(2), m = req.method, admin = auth(req), ok = (o, c = 200) => send(res, c, { success: true, ...o });
  const need = () => admin ? true : (fail(res, 401, 'Unauthorized'), false);

  if (r === 'auth' && m === 'POST') {
    const b = await json(req);
    if (x === 'login') {
      if (limited(req, 'login', 5, 9e5)) return fail(res, 429, 'Too many attempts, try later');
      const usr = d.users.find(e => e.email === b.email);
      if (!usr || !tok.check(String(b.password || ''), usr.passwordHash)) return fail(res, 401, 'Invalid credentials');
      return ok({ data: pair(usr) });
    }
    if (x === 'refresh') { const p = tok.verify(b.refreshToken || ''), usr = p && p.type === 'refresh' && d.users.find(e => e.id === p.sub);
      return usr ? ok({ data: pair(usr) }) : fail(res, 401, 'Invalid refresh token'); }
  }
  if (r === 'about') {
    if (m === 'GET') return ok({ data: d.about });
    if (m === 'PUT' && need()) { d.about = { ...d.about, ...clean(await json(req)) }; save(); return ok({ data: d.about }); }
    if (m === 'PUT') return;
  }
  if (REQ[r]) {
    const list = d[r], i = x ? list.findIndex(e => e.id === x || e.slug === x) : -1;
    if (m === 'GET' && !x) {
      let a = list.filter(e => admin || r !== 'blogs' || e.published);
      a.sort((p, q) => (p.order || 0) - (q.order || 0) || (q.createdAt > p.createdAt ? 1 : -1));
      const pg = Math.max(+u.searchParams.get('page') || 1, 1), lim = Math.min(+u.searchParams.get('limit') || 50, 100);
      return ok({ data: a.slice((pg - 1) * lim, pg * lim), total: a.length, page: pg });
    }
    if (m === 'GET') return i < 0 || (r === 'blogs' && !admin && !list[i].published) ? fail(res, 404, 'Not found') : ok({ data: list[i] });
    if (!need()) return;
    if (m === 'POST' && !x) {
      const b = clean(await json(req)), miss = REQ[r].filter(k => !b[k]);
      if (miss.length) return fail(res, 400, 'Required: ' + miss.join(', '));
      if (r === 'projects' || r === 'blogs') b.slug = slug(b.title, list);
      if (r === 'blogs' && b.published) b.publishedAt = now();
      const it = { id: id(), ...b, createdAt: now() }; list.push(it); save(); return ok({ data: it }, 201);
    }
    if (i < 0) return fail(res, 404, 'Not found');
    if (m === 'PUT') {
      const b = clean(await json(req)), it = { ...list[i], ...b }, miss = REQ[r].filter(k => !it[k]);
      if (miss.length) return fail(res, 400, 'Required: ' + miss.join(', '));
      if (r === 'blogs' && b.published && !list[i].publishedAt) it.publishedAt = now();
      list[i] = it; save(); return ok({ data: it });
    }
    if (m === 'DELETE') { list.splice(i, 1); save(); return ok({ data: { id: x } }); }
  }
  if (r === 'upload' && x === 'image' && m === 'POST') {
    if (!need()) return;
    const type = req.headers['content-type'], ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[type];
    if (!ext) return fail(res, 400, 'Only png, jpeg, webp or gif images');
    const buf = await body(req, 5e6), name = crypto.randomUUID() + '.' + ext;
    fs.mkdirSync(UP, { recursive: true }); fs.writeFileSync(path.join(UP, name), buf);
    const it = { id: id(), url: '/uploads/' + name, filename: name, mimeType: type, size: buf.length, createdAt: now() };
    d.media.push(it); save(); return ok({ data: it }, 201);
  }
  if (r === 'contact' && m === 'POST') {
    if (limited(req, 'contact', 5, 36e5)) return fail(res, 429, 'Too many messages, try later');
    const b = clean(await json(req));
    if (!b.name || !/^\S+@\S+\.\S+$/.test(b.email || '') || !b.message) return fail(res, 400, 'Name, valid email and message are required');
    const msg = { id: id(), name: b.name, email: b.email, subject: b.subject || '', message: b.message, read: false, createdAt: now() };
    d.messages.push(msg); save(); mail.notify(msg); return ok({ data: { id: msg.id } }, 201);
  }
  if (r === 'messages') {
    if (!need()) return;
    if (m === 'GET' && !x) return ok({ data: [...d.messages].reverse() });
    const i = d.messages.findIndex(e => e.id === x);
    if (i < 0) return fail(res, 404, 'Not found');
    if (m === 'PUT') { d.messages[i].read = true; save(); return ok({ data: d.messages[i] }); }
    if (m === 'DELETE') { d.messages.splice(i, 1); save(); return ok({ data: { id: x } }); }
  }
  if (r === 'stats') {
    if (!need()) return;
    const counts = {}; ['skills','projects','blogs','experience','testimonials','services','messages','media'].forEach(t => counts[t] = d[t].length);
    return ok({ data: { counts, unread: d.messages.filter(e => !e.read).length, recent: [...d.messages].reverse().slice(0, 5) } });
  }
  fail(res, 404, 'Route not found');
};
