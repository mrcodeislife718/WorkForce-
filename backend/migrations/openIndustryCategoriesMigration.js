'use strict';

const sequelize = require('../config/database');

// Historical Workforce databases used a five-value PostgreSQL ENUM for
// employee.category. That artificial restriction prevents other professions.
// Convert only that one column to VARCHAR without dropping records.
async function migrateOpenIndustryCategories() {
  const [columns] = await sequelize.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Workers'
      AND column_name = 'category'
  `);
  if (!columns.length) return;
  if (columns[0].data_type !== 'USER-DEFINED') return;
  await sequelize.query(`
    ALTER TABLE "Workers"
    ALTER COLUMN "category" TYPE VARCHAR(100)
    USING "category"::text
  `);
}

module.exports = migrateOpenIndustryCategories;
