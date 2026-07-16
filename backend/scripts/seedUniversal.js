require('dotenv').config();
const sequelize = require('../config/database');
const migrateLegacyUniversalSchema = require('../migrations/legacyUniversalMigration');
const migrateCompleteFlowSchema = require('../migrations/completeFlowMigration');

async function run() {
  await sequelize.authenticate();
  await migrateLegacyUniversalSchema();
  await migrateCompleteFlowSchema();
  require('../seed');
}

run().catch(async (error) => {
  console.error('ORCA pre-seed migration failed:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
