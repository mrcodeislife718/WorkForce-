const sequelize = require('../config/database');

module.exports = async function migrateSupport() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SupportTickets" (
      "id" UUID PRIMARY KEY,
      "user_id" UUID NOT NULL,
      "category" VARCHAR(40) NOT NULL,
      "subject" VARCHAR(200) NOT NULL,
      "status" VARCHAR(40) NOT NULL DEFAULT 'open',
      "messages" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL
    )
  `);
  await sequelize.query('CREATE INDEX IF NOT EXISTS "support_ticket_owner" ON "SupportTickets" ("user_id", "createdAt")');
  await sequelize.query('CREATE INDEX IF NOT EXISTS "support_ticket_status" ON "SupportTickets" ("status", "createdAt")');
};
