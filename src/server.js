const env = require('./config/env');
require('./config/seed')();
require('./app').listen(env.port, () => console.log(`\n✨ Portfolio:  http://localhost:${env.port}\n🔐 Admin:      http://localhost:${env.port}/admin  (${env.adminEmail} / ${env.adminPassword})\n`));
