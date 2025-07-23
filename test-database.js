const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: '45.154.238.111',
  port: 5432,
  user: 'danny',
  password: 'Jjustmee12773',
  database: 'docker_platform'
};

async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Database connection successful');

    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Available tables:');
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found. Please run the database setup first.');
      console.log('Run: npm run setup-db');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }

    // Test specific tables
    const requiredTables = ['users', 'containers', 'servers', 'domains', 'github_repositories'];
    console.log('\n🔍 Checking required tables:');
    
    for (const table of requiredTables) {
      try {
        const tableResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ✅ ${table}: ${tableResult.rows[0].count} rows`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }

    // Test admin user
    try {
      const adminResult = await client.query("SELECT username, role FROM users WHERE username = 'admin'");
      if (adminResult.rows.length > 0) {
        console.log(`\n👤 Admin user found: ${adminResult.rows[0].username} (${adminResult.rows[0].role})`);
      } else {
        console.log('\n⚠️ Admin user not found. This is normal for a fresh installation.');
      }
    } catch (error) {
      console.log('\n❌ Error checking admin user:', error.message);
    }

    await client.end();
    console.log('\n✅ Database test completed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if the database server is running');
      console.log('2. Verify the host and port are correct');
      console.log('3. Check firewall settings');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check username and password.');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Run: npm run setup-db');
    }
    
    process.exit(1);
  }
}

// Check if pg module is installed
try {
  require('pg');
} catch (error) {
  console.error('❌ PostgreSQL client not found. Installing...');
  console.log('Please run: npm install pg');
  process.exit(1);
}

testDatabase(); 