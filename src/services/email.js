// No SMTP library without npm: notifications are logged + appended to data/outbox.log.
// To send real email later, swap this function for Nodemailer/Resend.
const fs = require('fs'), path = require('path');
exports.notify = m => {
  const line = `[${m.createdAt}] New message from ${m.name} <${m.email}>: ${m.subject} | ${m.message}\n`;
  console.log('📧', line.trim());
  fs.appendFileSync(path.join(__dirname, '../../data/outbox.log'), line);
};
