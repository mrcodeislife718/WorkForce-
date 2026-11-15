const sequelize = require('../config/database');

// Safe for existing databases: adds a new table, never deletes customer data.
module.exports = async function migratePurchases() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "Purchases" (
      "id" UUID PRIMARY KEY,
      "user_id" UUID NOT NULL,
      "worker_id" UUID NOT NULL,
      "provider" VARCHAR(32) NOT NULL DEFAULT 'stripe',
      "provider_session_id" VARCHAR(255) NOT NULL UNIQUE,
      "provider_payment_intent_id" VARCHAR(255) UNIQUE,
      "provider_customer_id" VARCHAR(255),
      "provider_price_id" VARCHAR(255),
      "amount_cents" INTEGER NOT NULL DEFAULT 0,
      "currency" VARCHAR(8) NOT NULL DEFAULT 'usd',
      "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
      "purchased_at" TIMESTAMPTZ,
      "refunded_at" TIMESTAMPTZ,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL
    );
  `);
  await sequelize.query('CREATE INDEX IF NOT EXISTS "purchases_owner_worker" ON "Purchases" ("user_id", "worker_id")');
  await sequelize.query('CREATE INDEX IF NOT EXISTS "purchases_status" ON "Purchases" ("status")');
  await sequelize.query('CREATE INDEX IF NOT EXISTS "purchases_customer" ON "Purchases" ("provider_customer_id")');
};
