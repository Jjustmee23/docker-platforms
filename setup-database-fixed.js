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

    // Read the SQL file
    console.log('📋 Creating database tables...');
    const sqlFile = path.join(__dirname, 'database', 'init.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Execute the entire SQL file as one transaction
    try {
      await client.query('BEGIN');
      await client.query(sqlContent);
      await client.query('COMMIT');
      console.log('✅ All tables created successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating tables:', error.message);
      
      // Try creating tables one by one
      console.log('🔄 Trying to create tables individually...');
      await createTablesIndividually(client);
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
      console.log(`  ✅ ${row.table_name}`);
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

async function createTablesIndividually(client) {
  const tables = [
    {
      name: 'users',
      sql: `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'servers',
      sql: `
        CREATE TABLE servers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER DEFAULT 22,
          username VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255),
          ssh_key_path VARCHAR(500),
          status VARCHAR(50) DEFAULT 'offline',
          docker_version VARCHAR(100),
          os_info JSONB,
          resources JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'containers',
      sql: `
        CREATE TABLE containers (
          id SERIAL PRIMARY KEY,
          docker_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          image VARCHAR(255) NOT NULL,
          repository VARCHAR(255),
          branch VARCHAR(100) DEFAULT 'main',
          status VARCHAR(50) DEFAULT 'stopped',
          port INTEGER,
          domain VARCHAR(255),
          environment JSONB DEFAULT '{}',
          volumes JSONB DEFAULT '[]',
          networks JSONB DEFAULT '[]',
          cpu_usage DECIMAL(5,2) DEFAULT 0,
          memory_usage BIGINT DEFAULT 0,
          memory_limit BIGINT DEFAULT 0,
          network_rx BIGINT DEFAULT 0,
          network_tx BIGINT DEFAULT 0,
          auto_update BOOLEAN DEFAULT false,
          server_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'domains',
      sql: `
        CREATE TABLE domains (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          container_id INTEGER,
          ssl_enabled BOOLEAN DEFAULT false,
          ssl_certificate JSONB,
          proxy_config JSONB,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'github_repositories',
      sql: `
        CREATE TABLE github_repositories (
          id SERIAL PRIMARY KEY,
          github_id INTEGER UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          description TEXT,
          private BOOLEAN DEFAULT false,
          html_url VARCHAR(500),
          clone_url VARCHAR(500),
          ssh_url VARCHAR(500),
          default_branch VARCHAR(100) DEFAULT 'main',
          language VARCHAR(100),
          has_dockerfile BOOLEAN DEFAULT false,
          has_docker_compose BOOLEAN DEFAULT false,
          last_commit_sha VARCHAR(255),
          last_commit_message TEXT,
          last_commit_date TIMESTAMP,
          webhook_id INTEGER,
          webhook_secret VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'deployments',
      sql: `
        CREATE TABLE deployments (
          id SERIAL PRIMARY KEY,
          container_id INTEGER,
          repository_id INTEGER,
          commit_sha VARCHAR(255),
          commit_message TEXT,
          deployment_config JSONB,
          status VARCHAR(50) DEFAULT 'pending',
          logs TEXT,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'monitoring_data',
      sql: `
        CREATE TABLE monitoring_data (
          id SERIAL PRIMARY KEY,
          container_id INTEGER,
          cpu_usage DECIMAL(5,2),
          memory_usage BIGINT,
          memory_limit BIGINT,
          network_rx BIGINT,
          network_tx BIGINT,
          disk_usage BIGINT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    },
    {
      name: 'backups',
      sql: `
        CREATE TABLE backups (
          id SERIAL PRIMARY KEY,
          container_id INTEGER,
          name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500),
          file_size BIGINT,
          backup_type VARCHAR(50) DEFAULT 'manual',
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    }
  ];

  for (const table of tables) {
    try {
      await client.query(table.sql);
      console.log(`  ✅ Created table: ${table.name}`);
    } catch (error) {
      if (error.code === '42P07') {
        console.log(`  ⚠️ Table ${table.name} already exists`);
      } else {
        console.log(`  ❌ Error creating table ${table.name}:`, error.message);
      }
    }
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX idx_containers_server_id ON containers(server_id);',
    'CREATE INDEX idx_containers_status ON containers(status);',
    'CREATE INDEX idx_containers_repository ON containers(repository);',
    'CREATE INDEX idx_domains_container_id ON domains(container_id);',
    'CREATE INDEX idx_monitoring_data_container_id ON monitoring_data(container_id);',
    'CREATE INDEX idx_monitoring_data_timestamp ON monitoring_data(timestamp);',
    'CREATE INDEX idx_deployments_container_id ON deployments(container_id);',
    'CREATE INDEX idx_deployments_status ON deployments(status);'
  ];

  for (const index of indexes) {
    try {
      await client.query(index);
    } catch (error) {
      // Ignore index creation errors
    }
  }

  // Insert admin user
  try {
    await client.query(`
      INSERT INTO users (username, email, password_hash, role) 
      VALUES ('admin', 'admin@docker-platform.com', '$2b$10$rQZ8N3YqX2vB1cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('  ✅ Admin user created');
  } catch (error) {
    console.log('  ⚠️ Error creating admin user:', error.message);
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