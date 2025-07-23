const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

client.on('connect', () => {
  logger.info('Redis Client Connected');
});

client.on('ready', () => {
  logger.info('Redis Client Ready');
});

client.on('end', () => {
  logger.info('Redis Client Disconnected');
});

module.exports = client; 