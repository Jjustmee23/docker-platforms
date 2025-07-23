const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: '45.154.238.111',
  port: 5432,
  user: 'danny',
  password: 'Jjustmee12773',
  database: 'postgres' // We'll connect to postgres first to create our database
};

const targetDatabase = 'docker_platform';

async function setupDatabase() {
  console.log('🚀 Setting up external PostgreSQL database...');
  
  // First, connect to postgres database to create our target database
  const postgresClient = new Client({
    ...dbConfig,
    database: 'postgres'
  });

  try {
    console.log('📡 Testing database connection...');
    await postgresClient.connect();
    console.log('✅ Database connection successful');

    // Create database if it doesn't exist
    console.log('🗄️ Creating database if it doesn\'t exist...');
    try {
      await postgresClient.query(`CREATE DATABASE ${targetDatabase}`);
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('⚠️ Database already exists, continuing...');
      } else {
        throw error;
      }
    }

    await postgresClient.end();

    // Now connect to our target database
    const client = new Client({
      ...dbConfig,
      database: targetDatabase
    });

    await client.connect();
    console.log('✅ Connected to target database');

    // Read and execute the SQL file
    console.log('📋 Creating database tables...');
    const sqlFile = path.join(__dirname, 'database', 'init.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Split the SQL file into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            console.log(`⚠️ Warning executing statement: ${error.message}`);
          }
        }
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    await client.end();

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Database connection details:');
    console.log(`Host: ${dbConfig.host}`);
    console.log(`Port: ${dbConfig.port}`);
    console.log(`Database: ${targetDatabase}`);
    console.log(`User: ${dbConfig.user}`);
    console.log('\n🔗 Connection string:');
    console.log(`postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${targetDatabase}`);

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
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

setupDatabase(); 