// Tiny .env loader (no dotenv needed). Works with defaults if .env is missing.
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '../../.env');
if (fs.existsSync(f)) for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
  const m = l.match(/^\s*(\w+)\s*=\s*(.*?)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}
module.exports = {
  port: +process.env.PORT || 5000,
  secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};
