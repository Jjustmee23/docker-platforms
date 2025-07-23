const express = require('express');
const Docker = require('dockerode');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();
const docker = new Docker();

// Get system metrics
router.get('/system', async (req, res) => {
  try {
    const info = await docker.info();
    const containers = await docker.listContainers({ all: true });
    
    // Calculate system metrics
    const runningContainers = containers.filter(c => c.State === 'running').length;
    const stoppedContainers = containers.filter(c => c.State === 'exited').length;
    
    const systemMetrics = {
      containers: {
        total: containers.length,
        running: runningContainers,
        stopped: stoppedContainers
      },
      system: {
        os: info.OperatingSystem,
        kernel: info.KernelVersion,
        docker_version: info.ServerVersion,
        api_version: info.APIVersion,
        cpus: info.NCPU,
        memory: info.MemTotal,
        storage_driver: info.Driver
      },
      timestamp: new Date().toISOString()
    };

    res.json(systemMetrics);
  } catch (error) {
    logger.error('Error getting system metrics:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

// Get container metrics
router.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    const containerMetrics = await Promise.all(
      containers.map(async (container) => {
        try {
          const containerObj = docker.getContainer(container.Id);
          const stats = await containerObj.stats({ stream: false });
          
          return {
            id: container.Id,
            name: container.Names[0].replace('/', ''),
            status: container.State,
            cpu_usage: stats ? calculateCpuUsage(stats) : 0,
            memory_usage: stats ? stats.memory_stats.usage || 0 : 0,
            memory_limit: stats ? stats.memory_stats.limit || 0 : 0,
            memory_percentage: stats ? ((stats.memory_stats.usage / stats.memory_stats.limit) * 100) : 0,
            network_rx: stats ? stats.networks?.eth0?.rx_bytes || 0 : 0,
            network_tx: stats ? stats.networks?.eth0?.tx_bytes || 0 : 0,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          logger.error(`Error getting metrics for container ${container.Id}:`, error);
          return {
            id: container.Id,
            name: container.Names[0].replace('/', ''),
            status: container.State,
            error: 'Failed to get metrics'
          };
        }
      })
    );

    res.json(containerMetrics);
  } catch (error) {
    logger.error('Error getting container metrics:', error);
    res.status(500).json({ error: 'Failed to get container metrics' });
  }
});

// Get container metrics by ID
router.get('/containers/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const stats = await container.stats({ stream: false });
    const info = await container.inspect();
    
    const metrics = {
      id: info.Id,
      name: info.Name.replace('/', ''),
      status: info.State.Status,
      cpu_usage: stats ? calculateCpuUsage(stats) : 0,
      memory_usage: stats ? stats.memory_stats.usage || 0 : 0,
      memory_limit: stats ? stats.memory_stats.limit || 0 : 0,
      memory_percentage: stats ? ((stats.memory_stats.usage / stats.memory_stats.limit) * 100) : 0,
      network_rx: stats ? stats.networks?.eth0?.rx_bytes || 0 : 0,
      network_tx: stats ? stats.networks?.eth0?.tx_bytes || 0 : 0,
      disk_usage: stats ? stats.storage_stats || {} : {},
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Error getting container metrics:', error);
    res.status(404).json({ error: 'Container not found' });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM alerts 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create alert
router.post('/alerts', async (req, res) => {
  try {
    const { type, message, severity, container_id } = req.body;
    
    const result = await pool.query(`
      INSERT INTO alerts (type, message, severity, container_id, user_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [type, message, severity, container_id, req.user.id]);

    logger.info(`Alert created: ${type} - ${message}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Mark alert as resolved
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE alerts 
      SET resolved = true, resolved_at = NOW(), resolved_by = $1 
      WHERE id = $2 
      RETURNING *
    `, [req.user.id, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    logger.info(`Alert resolved: ${req.params.id}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get monitoring configuration
router.get('/config', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM monitoring_config 
      WHERE user_id = $1
    `, [req.user.id]);

    res.json(result.rows[0] || {});
  } catch (error) {
    logger.error('Error getting monitoring config:', error);
    res.status(500).json({ error: 'Failed to get monitoring config' });
  }
});

// Update monitoring configuration
router.put('/config', async (req, res) => {
  try {
    const { cpu_threshold, memory_threshold, disk_threshold, email_alerts } = req.body;
    
    const result = await pool.query(`
      INSERT INTO monitoring_config (user_id, cpu_threshold, memory_threshold, disk_threshold, email_alerts) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        cpu_threshold = EXCLUDED.cpu_threshold,
        memory_threshold = EXCLUDED.memory_threshold,
        disk_threshold = EXCLUDED.disk_threshold,
        email_alerts = EXCLUDED.email_alerts,
        updated_at = NOW()
      RETURNING *
    `, [req.user.id, cpu_threshold, memory_threshold, disk_threshold, email_alerts]);

    logger.info(`Monitoring config updated for user ${req.user.id}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating monitoring config:', error);
    res.status(500).json({ error: 'Failed to update monitoring config' });
  }
});

// Helper function to calculate CPU usage
function calculateCpuUsage(stats) {
  if (!stats.cpu_stats || !stats.precpu_stats) return 0;
  
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  
  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
  }
  
  return 0;
}

module.exports = router; 