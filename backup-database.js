const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: '45.154.238.111',
  port: 5432,
  user: 'danny',
  password: 'Jjustmee12773',
  database: 'docker_platform'
};

const backupDir = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `docker-platform-backup-${timestamp}.sql`);

async function backupDatabase() {
  console.log('💾 Creating database backup...');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Build pg_dump command
  const pgDumpCommand = `PGPASSWORD=${dbConfig.password} pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${backupFile}`;

  console.log('📡 Executing backup...');
  
  exec(pgDumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Backup failed:', error.message);
      console.log('\n💡 Make sure pg_dump is installed:');
      console.log('Ubuntu/Debian: sudo apt install postgresql-client');
      console.log('Windows: choco install postgresql');
      console.log('macOS: brew install postgresql');
      return;
    }

    if (stderr) {
      console.log('⚠️ Warnings:', stderr);
    }

    // Get file size
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ Backup completed successfully!');
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`📊 File size: ${fileSizeInMB} MB`);

    // Clean old backups (keep last 7 days)
    cleanOldBackups();
  });
}

function cleanOldBackups() {
  console.log('🧹 Cleaning old backups...');
  
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      console.error('❌ Error reading backup directory:', err.message);
      return;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    files.forEach(file => {
      if (file.startsWith('docker-platform-backup-') && file.endsWith('.sql')) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }
    });

    console.log('✅ Backup cleanup completed');
  });
}

// Check if pg_dump is available
exec('which pg_dump', (error) => {
  if (error) {
    console.error('❌ pg_dump not found. Please install PostgreSQL client tools.');
    console.log('\nInstallation commands:');
    console.log('Ubuntu/Debian: sudo apt install postgresql-client');
    console.log('Windows: choco install postgresql');
    console.log('macOS: brew install postgresql');
    process.exit(1);
  }

  backupDatabase();
}); 