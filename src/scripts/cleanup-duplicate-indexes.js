require('dotenv').config();
const sequelize = require('../src/config/database');

async function cleanupIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Get all indexes from companies table
    const [indexes] = await sequelize.query('SHOW INDEXES FROM companies');
    console.log(`Found ${indexes.length} indexes on companies table`);

    // Find duplicate indexes (keep only PRIMARY, company_id, email)
    const keepIndexes = ['PRIMARY', 'company_id', 'email'];
    const duplicates = indexes.filter(idx => !keepIndexes.includes(idx.Key_name));

    // Get unique index names
    const uniqueIndexNames = [...new Set(duplicates.map(idx => idx.Key_name))];
    
    console.log(`Found ${uniqueIndexNames.length} duplicate indexes to remove`);

    // Drop duplicate indexes
    for (const indexName of uniqueIndexNames) {
      try {
        await sequelize.query(`DROP INDEX \`${indexName}\` ON companies`);
        console.log(`✓ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`✗ Failed to drop ${indexName}:`, error.message);
      }
    }

    // Verify remaining indexes
    const [remainingIndexes] = await sequelize.query('SHOW INDEXES FROM companies');
    console.log(`\nRemaining indexes: ${remainingIndexes.length}`);
    remainingIndexes.forEach(idx => {
      console.log(`  - ${idx.Key_name} on ${idx.Column_name}`);
    });

    console.log('\n✅ Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupIndexes();

