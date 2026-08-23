require('dotenv').config();
const sequelize = require('../config/database');
const migrateLegacyUniversalSchema = require('../migrations/legacyUniversalMigration');
const migrateCompleteFlowSchema = require('../migrations/completeFlowMigration');
const migrateStoreCatalogSchema = require('../migrations/storeCatalogMigration');
const migrateMarketControlPlaneSchema = require('../migrations/marketControlPlaneMigration');
const migratePremiumCatalogMetadata = require('../migrations/premiumCatalogMetadataMigration');

async function run() {
  await sequelize.authenticate();
  await migrateLegacyUniversalSchema();
  await migrateCompleteFlowSchema();
  await migrateStoreCatalogSchema();
  await migrateMarketControlPlaneSchema();
  await sequelize.sync();
  await migratePremiumCatalogMetadata();

  // The legacy seed module calls sequelize.sync() before its upserts. Schema
  // ownership now belongs to the migration chain above, so suppress only that
  // redundant sync while preserving the existing catalog seed implementation.
  sequelize.sync = async () => sequelize;
  require('../seed');
}

run().catch(async (error) => {
  console.error('ORCA pre-seed migration failed:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
