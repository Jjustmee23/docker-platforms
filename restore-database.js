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

function listBackups() {
  console.log('📋 Available backups:');
  
  if (!fs.existsSync(backupDir)) {
    console.log('❌ No backup directory found');
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('docker-platform-backup-') && file.endsWith('.sql'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('❌ No backup files found');
    return [];
  }

  files.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toLocaleString();
    
    console.log(`${index + 1}. ${file} (${fileSizeInMB} MB) - ${date}`);
  });

  return files;
}

function restoreDatabase(backupFile) {
  if (!backupFile) {
    console.error('❌ No backup file specified');
    return;
  }

  const backupPath = path.join(backupDir, backupFile);
  
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    return;
  }

  console.log(`🔄 Restoring database from: ${backupFile}`);
  console.log('⚠️ This will overwrite the current database!');
  
  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Restore cancelled');
      return;
    }

    // Build psql restore command
    const psqlCommand = `PGPASSWORD=${dbConfig.password} psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${backupPath}`;

    console.log('📡 Executing restore...');
    
    exec(psqlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Restore failed:', error.message);
        return;
      }

      if (stderr) {
        console.log('⚠️ Warnings:', stderr);
      }

      console.log('✅ Database restore completed successfully!');
      console.log('🔍 You can test the database with: npm run test-db');
    });
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  // List available backups
  const backups = listBackups();
  
  if (backups.length > 0) {
    console.log('\n💡 To restore a backup, run:');
    console.log('npm run restore-db <backup-filename>');
    console.log('\nExample:');
    console.log(`npm run restore-db ${backups[0]}`);
  }
} else {
  // Restore specific backup
  restoreDatabase(args[0]);
} 