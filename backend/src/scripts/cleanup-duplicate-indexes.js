require('dotenv').config();
const sequelize = require('../src/config/database');

async function cleanupIndexes() {
  try {
    await sequelize.authenticate();

    // Get all indexes from companies table
    const [indexes] = await sequelize.query('SHOW INDEXES FROM companies');

    // Find duplicate indexes (keep only PRIMARY, company_id, email)
    const keepIndexes = ['PRIMARY', 'company_id', 'email'];
    const duplicates = indexes.filter(idx => !keepIndexes.includes(idx.Key_name));

    // Get unique index names
    const uniqueIndexNames = [...new Set(duplicates.map(idx => idx.Key_name))];
    

    // Drop duplicate indexes
    for (const indexName of uniqueIndexNames) {
      try {
        await sequelize.query(`DROP INDEX \`${indexName}\` ON companies`);
      } catch (error) {
      }
    }

    // Verify remaining indexes
    const [remainingIndexes] = await sequelize.query('SHOW INDEXES FROM companies');
    remainingIndexes.forEach(idx => {
      });

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

cleanupIndexes();

