import db from './db.js';

async function migrate() {
  console.log('🚀 Running migrations...');

  await db.schema.hasTable('users').then(async (exists) => {
    if (!exists) {
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username').unique();
        table.string('password');
        table.string('role'); // admin / viewer
      });
      console.log('✅ users table created');
    }
  });

  await db.schema.hasTable('residents').then(async (exists) => {
    if (!exists) {
      await db.schema.createTable('residents', (table) => {
        table.string('id').primary();
        table.string('name');
        table.string('address');
        table.string('phone');
      });
      console.log('✅ residents table created');
    }
  });

  await db.schema.hasTable('payments').then(async (exists) => {
    if (!exists) {
      await db.schema.createTable('payments', (table) => {
        table.string('id').primary();
        table.string('residentId');
        table.string('type');
        table.date('date');
        table.decimal('amount');
        table.string('note');
      });
      console.log('✅ payments table created');
    }
  });

  await db.schema.hasTable('expenses').then(async (exists) => {
    if (!exists) {
      await db.schema.createTable('expenses', (table) => {
        table.string('id').primary();
        table.date('date');
        table.decimal('amount');
        table.string('note');
      });
      console.log('✅ expenses table created');
    }
  });

  console.log('🎉 All migrations complete!');
  process.exit(0);
}

migrate();
