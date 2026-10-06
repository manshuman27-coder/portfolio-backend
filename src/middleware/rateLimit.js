const m = new Map(); // returns true when the limit is exceeded
module.exports = (req, key, max, ms) => { const k = key + req.socket.remoteAddress, n = Date.now(), a = (m.get(k) || []).filter(x => n - x < ms); a.push(n); m.set(k, a); return a.length > max; };
