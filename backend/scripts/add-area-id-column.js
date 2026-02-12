const { sequelize } = require('../src/models');

async function addAreaIdColumn() {
  try {
    console.log('🔍 Checking if area_id column exists in customers table...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'customers' 
      AND COLUMN_NAME = 'area_id'
    `);
    
    if (results.length > 0) {
      console.log('✅ area_id column already exists in customers table');
      return;
    }
    
    console.log('🔧 Adding area_id column to customers table...');
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE customers 
      ADD COLUMN area_id UUID NULL
    `);
    
    console.log('✅ area_id column added successfully to customers table');
    
  } catch (error) {
    console.error('❌ Failed to add area_id column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the function
addAreaIdColumn()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
