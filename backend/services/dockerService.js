const Docker = require('dockerode');
const { logger } = require('../utils/logger');

class DockerService {
  constructor() {
    this.docker = new Docker();
  }

  // Get all containers
  async getContainers() {
    try {
      const containers = await this.docker.listContainers({ all: true });
      return containers;
    } catch (error) {
      logger.error('Error getting containers:', error);
      throw error;
    }
  }

  // Get container by ID
  async getContainer(id) {
    try {
      const container = this.docker.getContainer(id);
      const info = await container.inspect();
      return info;
    } catch (error) {
      logger.error(`Error getting container ${id}:`, error);
      throw error;
    }
  }

  // Create container
  async createContainer(options) {
    try {
      const container = await this.docker.createContainer(options);
      logger.info(`Container created: ${container.id}`);
      return container;
    } catch (error) {
      logger.error('Error creating container:', error);
      throw error;
    }
  }

  // Start container
  async startContainer(id) {
    try {
      const container = this.docker.getContainer(id);
      await container.start();
      logger.info(`Container started: ${id}`);
    } catch (error) {
      logger.error(`Error starting container ${id}:`, error);
      throw error;
    }
  }

  // Stop container
  async stopContainer(id) {
    try {
      const container = this.docker.getContainer(id);
      await container.stop();
      logger.info(`Container stopped: ${id}`);
    } catch (error) {
      logger.error(`Error stopping container ${id}:`, error);
      throw error;
    }
  }

  // Restart container
  async restartContainer(id) {
    try {
      const container = this.docker.getContainer(id);
      await container.restart();
      logger.info(`Container restarted: ${id}`);
    } catch (error) {
      logger.error(`Error restarting container ${id}:`, error);
      throw error;
    }
  }

  // Remove container
  async removeContainer(id, force = false) {
    try {
      const container = this.docker.getContainer(id);
      await container.remove({ force });
      logger.info(`Container removed: ${id}`);
    } catch (error) {
      logger.error(`Error removing container ${id}:`, error);
      throw error;
    }
  }

  // Get container logs
  async getContainerLogs(id, options = {}) {
    try {
      const container = this.docker.getContainer(id);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: options.tail || 100,
        ...options
      });
      return logs.toString();
    } catch (error) {
      logger.error(`Error getting logs for container ${id}:`, error);
      throw error;
    }
  }

  // Get container stats
  async getContainerStats(id) {
    try {
      const container = this.docker.getContainer(id);
      const stats = await container.stats({ stream: false });
      return stats;
    } catch (error) {
      logger.error(`Error getting stats for container ${id}:`, error);
      throw error;
    }
  }

  // Get system info
  async getSystemInfo() {
    try {
      const info = await this.docker.info();
      return info;
    } catch (error) {
      logger.error('Error getting system info:', error);
      throw error;
    }
  }

  // Get images
  async getImages() {
    try {
      const images = await this.docker.listImages();
      return images;
    } catch (error) {
      logger.error('Error getting images:', error);
      throw error;
    }
  }

  // Pull image
  async pullImage(imageName) {
    try {
      await this.docker.pull(imageName);
      logger.info(`Image pulled: ${imageName}`);
    } catch (error) {
      logger.error(`Error pulling image ${imageName}:`, error);
      throw error;
    }
  }

  // Remove image
  async removeImage(imageId, force = false) {
    try {
      const image = this.docker.getImage(imageId);
      await image.remove({ force });
      logger.info(`Image removed: ${imageId}`);
    } catch (error) {
      logger.error(`Error removing image ${imageId}:`, error);
      throw error;
    }
  }

  // Get networks
  async getNetworks() {
    try {
      const networks = await this.docker.listNetworks();
      return networks;
    } catch (error) {
      logger.error('Error getting networks:', error);
      throw error;
    }
  }

  // Create network
  async createNetwork(options) {
    try {
      const network = await this.docker.createNetwork(options);
      logger.info(`Network created: ${network.id}`);
      return network;
    } catch (error) {
      logger.error('Error creating network:', error);
      throw error;
    }
  }

  // Remove network
  async removeNetwork(id) {
    try {
      const network = this.docker.getNetwork(id);
      await network.remove();
      logger.info(`Network removed: ${id}`);
    } catch (error) {
      logger.error(`Error removing network ${id}:`, error);
      throw error;
    }
  }

  // Get volumes
  async getVolumes() {
    try {
      const volumes = await this.docker.listVolumes();
      return volumes;
    } catch (error) {
      logger.error('Error getting volumes:', error);
      throw error;
    }
  }

  // Create volume
  async createVolume(options) {
    try {
      const volume = await this.docker.createVolume(options);
      logger.info(`Volume created: ${volume.name}`);
      return volume;
    } catch (error) {
      logger.error('Error creating volume:', error);
      throw error;
    }
  }

  // Remove volume
  async removeVolume(name) {
    try {
      const volume = this.docker.getVolume(name);
      await volume.remove();
      logger.info(`Volume removed: ${name}`);
    } catch (error) {
      logger.error(`Error removing volume ${name}:`, error);
      throw error;
    }
  }

  // Execute command in container
  async execCommand(id, command) {
    try {
      const container = this.docker.getContainer(id);
      const exec = await container.exec({
        Cmd: command.split(' '),
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start();
      return new Promise((resolve, reject) => {
        let output = '';
        stream.on('data', (chunk) => {
          output += chunk.toString();
        });
        stream.on('end', () => {
          resolve(output);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error(`Error executing command in container ${id}:`, error);
      throw error;
    }
  }
}

module.exports = DockerService; 