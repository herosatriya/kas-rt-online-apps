import knex from "./db.js";

async function migrate() {
  // Tabel residents
  const hasResidents = await knex.schema.hasTable("residents");
  if (!hasResidents) {
    await knex.schema.createTable("residents", table => {
      table.string("id").primary();
      table.string("name");
      table.string("address");
      table.string("phone");
    });
    console.log("✅ Table residents created");
  }

  // Tabel payments
  const hasPayments = await knex.schema.hasTable("payments");
  if (!hasPayments) {
    await knex.schema.createTable("payments", table => {
      table.string("id").primary();
      table.string("residentId");
      table.string("date");
      table.string("type");
      table.decimal("amount");
      table.string("note");
    });
    console.log("✅ Table payments created");
  }

  // Tabel expenses
  const hasExpenses = await knex.schema.hasTable("expenses");
  if (!hasExpenses) {
    await knex.schema.createTable("expenses", table => {
      table.string("id").primary();
      table.string("date");
      table.decimal("amount");
      table.string("note");
    });
    console.log("✅ Table expenses created");
  }

  // 🆕 Tabel settings
  const hasSettings = await knex.schema.hasTable("settings");
  if (!hasSettings) {
    await knex.schema.createTable("settings", table => {
      table.increments("id").primary();
      table.decimal("initial_cash").defaultTo(0);
      table.decimal("warning_threshold").defaultTo(100000);
    });
    await knex("settings").insert({ id: 1, initial_cash: 0, warning_threshold: 100000 });
    console.log("✅ Table settings created and initialized");
  }

  console.log("🚀 Migration completed");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
