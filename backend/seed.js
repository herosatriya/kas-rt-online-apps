import bcrypt from 'bcryptjs';
import db from './db.js';

async function seed() {
  console.log('🌱 Seeding users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const viewerPassword = await bcrypt.hash('warga123', 10);

  const users = [
    { username: 'admin', password: adminPassword, role: 'admin' },
    { username: 'warga', password: viewerPassword, role: 'viewer' },
  ];

  for (const u of users) {
    const exists = await db('users').where({ username: u.username }).first();
    if (!exists) {
      await db('users').insert(u);
      console.log(`✅ User '${u.username}' ditambahkan`);
    } else {
      console.log(`ℹ️ User '${u.username}' sudah ada`);
    }
  }

  console.log('🎉 Seeding selesai!');
  process.exit(0);
}

seed();
