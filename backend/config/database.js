const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || '45.154.238.111',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'docker_platform',
  user: process.env.DB_USER || 'danny',
  password: process.env.DB_PASSWORD || 'Jjustmee12773',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    logger.info('Database pool has ended');
    process.exit(0);
  });
});

module.exports = { pool }; 