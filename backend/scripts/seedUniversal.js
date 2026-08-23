require('dotenv').config();
const sequelize = require('../config/database');

async function run() {
  await sequelize.authenticate();

  // Schema ownership belongs to migrate:universal. The legacy seed module still
  // calls sequelize.sync(), so replace that call only for this data-only phase.
  // The public `npm run seed` command always runs the migration pipeline first.
  sequelize.sync = async () => sequelize;
  require('../seed');
}

run().catch(async (error) => {
  console.error('ORCA catalog seed failed:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
