const express = require('express');
const Docker = require('dockerode');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();
const docker = new Docker();

// Get all containers
router.get('/', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    // Get detailed info for each container
    const detailedContainers = await Promise.all(
      containers.map(async (container) => {
        try {
          const containerObj = docker.getContainer(container.Id);
          const stats = await containerObj.stats({ stream: false });
          const info = await containerObj.inspect();
          
          return {
            id: container.Id,
            name: container.Names[0].replace('/', ''),
            image: container.Image,
            status: container.State,
            created: container.Created,
            ports: container.Ports,
            cpu_usage: stats ? calculateCpuUsage(stats) : 0,
            memory_usage: stats ? stats.memory_stats.usage || 0 : 0,
            memory_limit: stats ? stats.memory_stats.limit || 0 : 0,
            network_rx: stats ? stats.networks?.eth0?.rx_bytes || 0 : 0,
            network_tx: stats ? stats.networks?.eth0?.tx_bytes || 0 : 0,
            labels: info.Config.Labels || {},
            env: info.Config.Env || []
          };
        } catch (error) {
          logger.error(`Error getting container details for ${container.Id}:`, error);
          return {
            id: container.Id,
            name: container.Names[0].replace('/', ''),
            image: container.Image,
            status: container.State,
            created: container.Created,
            ports: container.Ports,
            error: 'Failed to get detailed stats'
          };
        }
      })
    );

    res.json(detailedContainers);
  } catch (error) {
    logger.error('Error getting containers:', error);
    res.status(500).json({ error: 'Failed to get containers' });
  }
});

// Get container by ID
router.get('/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();
    const stats = await container.stats({ stream: false });
    
    res.json({
      id: info.Id,
      name: info.Name.replace('/', ''),
      image: info.Config.Image,
      status: info.State.Status,
      created: info.Created,
      ports: info.NetworkSettings.Ports,
      cpu_usage: stats ? calculateCpuUsage(stats) : 0,
      memory_usage: stats ? stats.memory_stats.usage || 0 : 0,
      memory_limit: stats ? stats.memory_stats.limit || 0 : 0,
      network_rx: stats ? stats.networks?.eth0?.rx_bytes || 0 : 0,
      network_tx: stats ? stats.networks?.eth0?.tx_bytes || 0 : 0,
      labels: info.Config.Labels || {},
      env: info.Config.Env || [],
      mounts: info.Mounts || [],
      networks: info.NetworkSettings.Networks || {}
    });
  } catch (error) {
    logger.error('Error getting container:', error);
    res.status(404).json({ error: 'Container not found' });
  }
});

// Create new container
router.post('/', [
  body('name').notEmpty().withMessage('Container name is required'),
  body('image').notEmpty().withMessage('Image is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { name, image, env = [], ports = {}, volumes = [], command } = req.body;

    // Create container options
    const containerOptions = {
      Image: image,
      name: name,
      Env: env,
      Cmd: command ? command.split(' ') : undefined,
      ExposedPorts: {},
      HostConfig: {
        PortBindings: {},
        Binds: volumes
      }
    };

    // Configure ports
    Object.keys(ports).forEach(containerPort => {
      const hostPort = ports[containerPort];
      containerOptions.ExposedPorts[`${containerPort}/tcp`] = {};
      containerOptions.HostConfig.PortBindings[`${containerPort}/tcp`] = [
        { HostPort: hostPort.toString() }
      ];
    });

    // Create container
    const container = await docker.createContainer(containerOptions);
    
    // Save to database
    await pool.query(
      'INSERT INTO containers (docker_id, name, image, status, environment, volumes, networks) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        container.id,
        name,
        image,
        'created',
        JSON.stringify(env),
        JSON.stringify(volumes),
        JSON.stringify([])
      ]
    );

    logger.info(`Container created: ${name} (${container.id})`);

    res.status(201).json({
      message: 'Container created successfully',
      container: {
        id: container.id,
        name: name,
        image: image
      }
    });

  } catch (error) {
    logger.error('Error creating container:', error);
    res.status(500).json({ error: 'Failed to create container' });
  }
});

// Start container
router.post('/:id/start', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    
    // Update database
    await pool.query(
      'UPDATE containers SET status = $1, updated_at = NOW() WHERE docker_id = $2',
      ['running', req.params.id]
    );

    logger.info(`Container started: ${req.params.id}`);
    res.json({ message: 'Container started successfully' });
  } catch (error) {
    logger.error('Error starting container:', error);
    res.status(500).json({ error: 'Failed to start container' });
  }
});

// Stop container
router.post('/:id/stop', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    
    // Update database
    await pool.query(
      'UPDATE containers SET status = $1, updated_at = NOW() WHERE docker_id = $2',
      ['stopped', req.params.id]
    );

    logger.info(`Container stopped: ${req.params.id}`);
    res.json({ message: 'Container stopped successfully' });
  } catch (error) {
    logger.error('Error stopping container:', error);
    res.status(500).json({ error: 'Failed to stop container' });
  }
});

// Restart container
router.post('/:id/restart', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.restart();
    
    // Update database
    await pool.query(
      'UPDATE containers SET status = $1, updated_at = NOW() WHERE docker_id = $2',
      ['running', req.params.id]
    );

    logger.info(`Container restarted: ${req.params.id}`);
    res.json({ message: 'Container restarted successfully' });
  } catch (error) {
    logger.error('Error restarting container:', error);
    res.status(500).json({ error: 'Failed to restart container' });
  }
});

// Delete container
router.delete('/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.remove({ force: true });
    
    // Remove from database
    await pool.query(
      'DELETE FROM containers WHERE docker_id = $1',
      [req.params.id]
    );

    logger.info(`Container deleted: ${req.params.id}`);
    res.json({ message: 'Container deleted successfully' });
  } catch (error) {
    logger.error('Error deleting container:', error);
    res.status(500).json({ error: 'Failed to delete container' });
  }
});

// Get container logs
router.get('/:id/logs', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: req.query.tail || 100
    });
    
    res.json({ logs: logs.toString() });
  } catch (error) {
    logger.error('Error getting container logs:', error);
    res.status(500).json({ error: 'Failed to get container logs' });
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