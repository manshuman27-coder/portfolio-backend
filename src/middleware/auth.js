const t = require('../services/token');
module.exports = req => { const h = req.headers.authorization || '', p = h.startsWith('Bearer ') && t.verify(h.slice(7)); return p && p.type === 'access' ? p : null; };
