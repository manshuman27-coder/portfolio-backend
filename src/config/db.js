// JSON-file database: zero dependencies, persists to backend/data/db.json
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const dir = path.join(__dirname, '../../data'), file = path.join(dir, 'db.json');
const TABLES = ['users','about','skills','projects','blogs','experience','testimonials','services','messages','media'];
fs.mkdirSync(dir, { recursive: true });
const d = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
TABLES.forEach(t => d[t] = d[t] || (t === 'about' ? {} : []));
const save = () => { fs.writeFileSync(file + '.tmp', JSON.stringify(d, null, 2)); fs.renameSync(file + '.tmp', file); };
module.exports = { d, save, id: () => crypto.randomUUID(), now: () => new Date().toISOString() };
