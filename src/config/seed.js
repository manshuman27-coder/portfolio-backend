const { d, save, id, now } = require('./db'), env = require('./env'), tok = require('../services/token');
module.exports = () => {
  if (!d.users.length) d.users.push({ id: id(), email: env.adminEmail, passwordHash: tok.hash(env.adminPassword), createdAt: now() });
  if (!d.about.name) {
    d.about = { name: 'Your Name', title: 'Full-Stack Developer', bio: 'Edit this bio from the admin panel at /admin.', photo: '', resumeUrl: '', github: '', linkedin: '' };
    const add = (t, o) => d[t].push({ id: id(), createdAt: now(), order: 0, ...o });
    ['JavaScript:Languages','Node.js:Backend','CSS:Frontend'].forEach(s => add('skills', { name: s.split(':')[0], category: s.split(':')[1], level: 85 }));
    add('projects', { title: 'Sample Project', slug: 'sample-project', description: 'A project added from the CMS.', techStack: ['Node','JS'], image: '', liveUrl: '', repoUrl: '', featured: true });
    add('services', { title: 'Web Development', description: 'Custom websites and APIs.', icon: '✦' });
    add('experience', { role: 'Developer', company: 'Company', startDate: '2022', endDate: 'Present', description: 'What you did here.', type: 'work' });
    add('testimonials', { name: 'Happy Client', role: 'CEO', company: 'Acme', quote: 'Fantastic to work with.' });
    add('blogs', { title: 'Hello World', slug: 'hello-world', content: 'My first post.\n\nWritten in the CMS.', tags: ['intro'], published: true, publishedAt: now() });
  }
  save();
};
