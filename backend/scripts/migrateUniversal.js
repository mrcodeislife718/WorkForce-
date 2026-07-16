require('dotenv').config();
const sequelize = require('../config/database');
const migrateLegacyUniversalSchema = require('../migrations/legacyUniversalMigration');
const migrateCompleteFlowSchema = require('../migrations/completeFlowMigration');

async function run() {
  await sequelize.authenticate();
  await migrateLegacyUniversalSchema();
  await migrateCompleteFlowSchema();
  await sequelize.sync();
  console.log('ORCA complete production-flow schema migration completed without deleting existing data.');
  await sequelize.close();
}

run().catch(async (error) => {
  console.error('ORCA universal schema migration failed:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
