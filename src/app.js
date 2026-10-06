const http = require('http'), fs = require('fs'), path = require('path');
const { fail } = require('./utils/http'), routes = require('./routes');
const root = path.join(__dirname, '../..');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };

function serve(res, base, rel) {
  let f = path.normalize(path.join(base, rel));
  if (!f.startsWith(base)) return fail(res, 403, 'Forbidden');
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) return fail(res, 404, 'Not found');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}
module.exports = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'SAMEORIGIN'); res.setHeader('Referrer-Policy', 'same-origin');
  if (process.env.CORS_ORIGIN) { res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN); res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE'); }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  try {
    const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
    if (p.startsWith('/api/')) return await routes(req, res, u);
    if (p.startsWith('/uploads/')) return serve(res, path.join(root, 'backend/uploads'), p.slice(9));
    if (p === '/admin' || p.startsWith('/admin/')) return serve(res, path.join(root, 'admin'), p.slice(6));
    serve(res, path.join(root, 'frontend'), p);
  } catch (e) { if (!res.headersSent) fail(res, e.code > 0 && e.code < 600 ? e.code : 500, e.code ? e.message : 'Server error'); if (!e.code) console.error(e); }
});
