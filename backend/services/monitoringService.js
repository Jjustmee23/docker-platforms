const Docker = require('dockerode');
const cron = require('node-cron');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class MonitoringService {
  constructor(io) {
    this.docker = new Docker();
    this.io = io;
    this.monitoringInterval = null;
    this.alertThresholds = {
      cpu: 80, // 80% CPU usage
      memory: 85, // 85% memory usage
      disk: 90 // 90% disk usage
    };
  }

  // Start monitoring
  startMonitoring() {
    logger.info('Starting monitoring service...');
    
    // Schedule monitoring every 30 seconds
    this.monitoringInterval = cron.schedule('*/30 * * * * *', () => {
      this.collectMetrics();
    });

    // Schedule alert checks every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkAlerts();
    });

    logger.info('Monitoring service started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      this.monitoringInterval.stop();
      logger.info('Monitoring service stopped');
    }
  }

  // Collect metrics from all containers
  async collectMetrics() {
    try {
      const containers = await this.docker.listContainers({ all: true });
      
      const metrics = await Promise.all(
        containers.map(async (container) => {
          try {
            const containerObj = this.docker.getContainer(container.Id);
            const stats = await containerObj.stats({ stream: false });
            
            return {
              id: container.Id,
              name: container.Names[0].replace('/', ''),
              status: container.State,
              cpu_usage: stats ? this.calculateCpuUsage(stats) : 0,
              memory_usage: stats ? stats.memory_stats.usage || 0 : 0,
              memory_limit: stats ? stats.memory_stats.limit || 0 : 0,
              memory_percentage: stats ? ((stats.memory_stats.usage / stats.memory_stats.limit) * 100) : 0,
              network_rx: stats ? stats.networks?.eth0?.rx_bytes || 0 : 0,
              network_tx: stats ? stats.networks?.eth0?.tx_bytes || 0 : 0,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            logger.error(`Error collecting metrics for container ${container.Id}:`, error);
            return {
              id: container.Id,
              name: container.Names[0].replace('/', ''),
              status: container.State,
              error: 'Failed to collect metrics'
            };
          }
        })
      );

      // Emit metrics to connected clients
      this.io.to('dashboard').emit('metrics-update', {
        containers: metrics,
        timestamp: new Date().toISOString()
      });

      // Store metrics in database
      await this.storeMetrics(metrics);

    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  // Store metrics in database
  async storeMetrics(metrics) {
    try {
      for (const metric of metrics) {
        if (!metric.error) {
          await pool.query(`
            INSERT INTO container_metrics (
              container_id, cpu_usage, memory_usage, memory_limit, 
              network_rx, network_tx, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            metric.id,
            metric.cpu_usage,
            metric.memory_usage,
            metric.memory_limit,
            metric.network_rx,
            metric.network_tx,
            metric.timestamp
          ]);
        }
      }
    } catch (error) {
      logger.error('Error storing metrics:', error);
    }
  }

  // Check for alerts
  async checkAlerts() {
    try {
      const containers = await this.docker.listContainers({ all: true });
      
      for (const container of containers) {
        if (container.State === 'running') {
          try {
            const containerObj = this.docker.getContainer(container.Id);
            const stats = await containerObj.stats({ stream: false });
            
            const cpuUsage = this.calculateCpuUsage(stats);
            const memoryPercentage = stats ? ((stats.memory_stats.usage / stats.memory_stats.limit) * 100) : 0;

            // Check CPU usage
            if (cpuUsage > this.alertThresholds.cpu) {
              await this.createAlert({
                type: 'high_cpu',
                message: `Container ${container.Names[0]} CPU usage is ${cpuUsage.toFixed(2)}%`,
                severity: 'warning',
                container_id: container.Id
              });
            }

            // Check memory usage
            if (memoryPercentage > this.alertThresholds.memory) {
              await this.createAlert({
                type: 'high_memory',
                message: `Container ${container.Names[0]} memory usage is ${memoryPercentage.toFixed(2)}%`,
                severity: 'warning',
                container_id: container.Id
              });
            }

          } catch (error) {
            logger.error(`Error checking alerts for container ${container.Id}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking alerts:', error);
    }
  }

  // Create alert
  async createAlert(alertData) {
    try {
      // Check if similar alert already exists and is not resolved
      const existingAlert = await pool.query(`
        SELECT id FROM alerts 
        WHERE type = $1 AND container_id = $2 AND resolved = false
        AND created_at > NOW() - INTERVAL '1 hour'
      `, [alertData.type, alertData.container_id]);

      if (existingAlert.rows.length === 0) {
        const result = await pool.query(`
          INSERT INTO alerts (type, message, severity, container_id) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *
        `, [alertData.type, alertData.message, alertData.severity, alertData.container_id]);

        // Emit alert to connected clients
        this.io.to('dashboard').emit('alert-created', result.rows[0]);

        logger.info(`Alert created: ${alertData.type} - ${alertData.message}`);
      }
    } catch (error) {
      logger.error('Error creating alert:', error);
    }
  }

  // Get system overview
  async getSystemOverview() {
    try {
      const info = await this.docker.info();
      const containers = await this.docker.listContainers({ all: true });
      
      const runningContainers = containers.filter(c => c.State === 'running').length;
      const stoppedContainers = containers.filter(c => c.State === 'exited').length;
      
      return {
        containers: {
          total: containers.length,
          running: runningContainers,
          stopped: stoppedContainers
        },
        system: {
          os: info.OperatingSystem,
          kernel: info.KernelVersion,
          docker_version: info.ServerVersion,
          cpus: info.NCPU,
          memory: info.MemTotal,
          storage_driver: info.Driver
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting system overview:', error);
      throw error;
    }
  }

  // Get historical metrics
  async getHistoricalMetrics(containerId, hours = 24) {
    try {
      const result = await pool.query(`
        SELECT cpu_usage, memory_usage, memory_limit, network_rx, network_tx, timestamp
        FROM container_metrics 
        WHERE container_id = $1 
        AND timestamp > NOW() - INTERVAL '${hours} hours'
        ORDER BY timestamp ASC
      `, [containerId]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting historical metrics:', error);
      throw error;
    }
  }

  // Get active alerts
  async getActiveAlerts() {
    try {
      const result = await pool.query(`
        SELECT * FROM alerts 
        WHERE resolved = false 
        ORDER BY created_at DESC
      `);

      return result.rows;
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      throw error;
    }
  }

  // Update alert thresholds
  updateAlertThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info('Alert thresholds updated:', this.alertThresholds);
  }

  // Calculate CPU usage from Docker stats
  calculateCpuUsage(stats) {
    if (!stats.cpu_stats || !stats.precpu_stats) return 0;
    
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    
    if (systemDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
    }
    
    return 0;
  }

  // Clean up old metrics
  async cleanupOldMetrics(days = 7) {
    try {
      const result = await pool.query(`
        DELETE FROM container_metrics 
        WHERE timestamp < NOW() - INTERVAL '${days} days'
      `);

      logger.info(`Cleaned up ${result.rowCount} old metric records`);
    } catch (error) {
      logger.error('Error cleaning up old metrics:', error);
    }
  }
}

module.exports = MonitoringService; 