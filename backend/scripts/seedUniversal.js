require('dotenv').config();
const sequelize = require('../config/database');
const migrateLegacyUniversalSchema = require('../migrations/legacyUniversalMigration');

async function run() {
  await sequelize.authenticate();
  await migrateLegacyUniversalSchema();
  await sequelize.close();
  require('../seed');
}

run().catch(async (error) => {
  console.error('ORCA pre-seed migration failed:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
