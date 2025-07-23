const Docker = require('dockerode');
const { promisify } = require('util');
const logger = require('../utils/logger');
const Container = require('../models/Container');
const Server = require('../models/Server');

class DockerService {
  constructor(io) {
    this.io = io;
    this.docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
    });
    this.monitoringInterval = null;
    this.startMonitoring();
  }

  // Get all containers
  async getContainers() {
    try {
      const containers = await this.docker.listContainers({ all: true });
      const containerDetails = await Promise.all(
        containers.map(async (container) => {
          const containerInfo = await this.getContainerInfo(container.Id);
          const stats = await this.getContainerStats(container.Id);
          return {
            id: container.Id,
            name: container.Names[0].replace('/', ''),
            image: container.Image,
            status: container.State,
            created: container.Created,
            ports: container.Ports,
            labels: container.Labels,
            ...containerInfo,
            ...stats
          };
        })
      );
      return containerDetails;
    } catch (error) {
      logger.error('Error getting containers:', error);
      throw error;
    }
  }

  // Get container information
  async getContainerInfo(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      return {
        name: info.Name.replace('/', ''),
        image: info.Config.Image,
        status: info.State.Status,
        created: info.Created,
        startedAt: info.State.StartedAt,
        finishedAt: info.State.FinishedAt,
        restartCount: info.RestartCount,
        networkSettings: info.NetworkSettings,
        mounts: info.Mounts,
        env: info.Config.Env,
        cmd: info.Config.Cmd,
        entrypoint: info.Config.Entrypoint,
        workingDir: info.Config.WorkingDir,
        user: info.Config.User,
        exposedPorts: info.Config.ExposedPorts,
        volumes: info.Config.Volumes,
        labels: info.Config.Labels
      };
    } catch (error) {
      logger.error(`Error getting container info for ${containerId}:`, error);
      throw error;
    }
  }

  // Get container statistics
  async getContainerStats(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      
      // Calculate CPU usage
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

      // Calculate memory usage
      const memoryUsage = stats.memory_stats.usage - stats.memory_stats.stats.cache;
      const memoryLimit = stats.memory_stats.limit;
      const memoryPercent = (memoryUsage / memoryLimit) * 100;

      // Calculate network stats
      const networkStats = {};
      if (stats.networks) {
        Object.keys(stats.networks).forEach(interface => {
          networkStats[interface] = {
            rx_bytes: stats.networks[interface].rx_bytes,
            tx_bytes: stats.networks[interface].tx_bytes,
            rx_packets: stats.networks[interface].rx_packets,
            tx_packets: stats.networks[interface].tx_packets
          };
        });
      }

      return {
        cpu: {
          usage: cpuPercent,
          system_usage: stats.cpu_stats.system_cpu_usage,
          online_cpus: stats.cpu_stats.online_cpus
        },
        memory: {
          usage: memoryUsage,
          limit: memoryLimit,
          percent: memoryPercent
        },
        network: networkStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error getting container stats for ${containerId}:`, error);
      return {
        cpu: { usage: 0, system_usage: 0, online_cpus: 0 },
        memory: { usage: 0, limit: 0, percent: 0 },
        network: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  // Start container
  async startContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      await container.start();
      logger.info(`Container ${containerId} started`);
      
      // Emit real-time update
      this.io.emit('container-started', { containerId });
      
      return { success: true, message: 'Container started successfully' };
    } catch (error) {
      logger.error(`Error starting container ${containerId}:`, error);
      throw error;
    }
  }

  // Stop container
  async stopContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      logger.info(`Container ${containerId} stopped`);
      
      // Emit real-time update
      this.io.emit('container-stopped', { containerId });
      
      return { success: true, message: 'Container stopped successfully' };
    } catch (error) {
      logger.error(`Error stopping container ${containerId}:`, error);
      throw error;
    }
  }

  // Restart container
  async restartContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      await container.restart();
      logger.info(`Container ${containerId} restarted`);
      
      // Emit real-time update
      this.io.emit('container-restarted', { containerId });
      
      return { success: true, message: 'Container restarted successfully' };
    } catch (error) {
      logger.error(`Error restarting container ${containerId}:`, error);
      throw error;
    }
  }

  // Remove container
  async removeContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force: true });
      logger.info(`Container ${containerId} removed`);
      
      // Emit real-time update
      this.io.emit('container-removed', { containerId });
      
      return { success: true, message: 'Container removed successfully' };
    } catch (error) {
      logger.error(`Error removing container ${containerId}:`, error);
      throw error;
    }
  }

  // Scale container (create multiple instances)
  async scaleContainer(containerName, replicas) {
    try {
      const container = this.docker.getContainer(containerName);
      const containerInfo = await container.inspect();
      
      // Create multiple instances
      const instances = [];
      for (let i = 0; i < replicas; i++) {
        const instanceName = `${containerName}-${i + 1}`;
        const newContainer = await this.docker.createContainer({
          ...containerInfo.Config,
          name: instanceName,
          HostConfig: {
            ...containerInfo.HostConfig,
            PortBindings: this.generatePortBindings(containerInfo.Config.ExposedPorts, i)
          }
        });
        
        await newContainer.start();
        instances.push(newContainer.id);
      }
      
      logger.info(`Scaled container ${containerName} to ${replicas} instances`);
      
      // Emit real-time update
      this.io.emit('container-scaled', { containerName, replicas, instances });
      
      return { success: true, message: `Container scaled to ${replicas} instances`, instances };
    } catch (error) {
      logger.error(`Error scaling container ${containerName}:`, error);
      throw error;
    }
  }

  // Generate port bindings for scaled containers
  generatePortBindings(exposedPorts, instanceIndex) {
    const bindings = {};
    if (exposedPorts) {
      Object.keys(exposedPorts).forEach(port => {
        const hostPort = parseInt(port.split('/')[0]) + instanceIndex;
        bindings[port] = [{ HostPort: hostPort.toString() }];
      });
    }
    return bindings;
  }

  // Create container from image
  async createContainer(config) {
    try {
      const container = await this.docker.createContainer(config);
      await container.start();
      
      logger.info(`Container created and started: ${container.id}`);
      
      // Emit real-time update
      this.io.emit('container-created', { containerId: container.id, config });
      
      return { success: true, containerId: container.id, message: 'Container created successfully' };
    } catch (error) {
      logger.error('Error creating container:', error);
      throw error;
    }
  }

  // Get container logs
  async getContainerLogs(containerId, options = {}) {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: options.tail || 100,
        ...options
      });
      
      return logs.toString('utf8');
    } catch (error) {
      logger.error(`Error getting logs for container ${containerId}:`, error);
      throw error;
    }
  }

  // Execute command in container
  async execCommand(containerId, command) {
    try {
      const container = this.docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: command.split(' '),
        AttachStdout: true,
        AttachStderr: true
      });
      
      const stream = await exec.start();
      let output = '';
      
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
          output += chunk.toString();
        });
        
        stream.on('end', () => {
          resolve(output);
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      logger.error(`Error executing command in container ${containerId}:`, error);
      throw error;
    }
  }

  // Start monitoring containers
  startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        const containers = await this.getContainers();
        
        // Emit monitoring data to connected clients
        this.io.emit('containers-monitoring', {
          containers: containers.map(container => ({
            id: container.id,
            name: container.name,
            status: container.status,
            cpu: container.cpu,
            memory: container.memory,
            network: container.network
          }))
        });
        
        // Store monitoring data in database
        await this.storeMonitoringData(containers);
      } catch (error) {
        logger.error('Error in container monitoring:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  // Store monitoring data in database
  async storeMonitoringData(containers) {
    try {
      for (const container of containers) {
        await Container.update(
          {
            cpu_usage: container.cpu?.usage || 0,
            memory_usage: container.memory?.usage || 0,
            memory_limit: container.memory?.limit || 0,
            network_rx: container.network?.eth0?.rx_bytes || 0,
            network_tx: container.network?.eth0?.tx_bytes || 0,
            last_updated: new Date()
          },
          {
            where: { docker_id: container.id }
          }
        );
      }
    } catch (error) {
      logger.error('Error storing monitoring data:', error);
    }
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Get Docker system info
  async getSystemInfo() {
    try {
      const info = await this.docker.info();
      const version = await this.docker.version();
      
      return {
        info,
        version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting Docker system info:', error);
      throw error;
    }
  }
}

module.exports = DockerService; 