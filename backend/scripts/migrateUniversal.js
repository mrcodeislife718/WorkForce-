require('dotenv').config();
const sequelize = require('../config/database');
const migrateLegacyUniversalSchema = require('../migrations/legacyUniversalMigration');
const migrateCompleteFlowSchema = require('../migrations/completeFlowMigration');
const migrateStoreCatalogSchema = require('../migrations/storeCatalogMigration');

async function run() {
  await sequelize.authenticate();
  await migrateLegacyUniversalSchema();
  await migrateCompleteFlowSchema();
  await migrateStoreCatalogSchema();
  await sequelize.sync();
  console.log('ORCA production schema migration completed without deleting existing data.');
  await sequelize.close();
}

run().catch(async (error) => {
  console.error('ORCA universal schema migration failed:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
