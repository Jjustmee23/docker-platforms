const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const simpleGit = require('simple-git');
const logger = require('../utils/logger');
const Container = require('../models/Container');
const Server = require('../models/Server');

const execAsync = promisify(exec);

class GitHubService {
  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    this.baseUrl = 'https://api.github.com';
    this.reposPath = path.join(__dirname, '../../repos');
    
    // Ensure repos directory exists
    fs.ensureDirSync(this.reposPath);
  }

  // Get user repositories
  async getUserRepositories() {
    try {
      const response = await axios.get(`${this.baseUrl}/user/repos`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          sort: 'updated',
          per_page: 100
        }
      });

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        default_branch: repo.default_branch,
        language: repo.language,
        updated_at: repo.updated_at,
        has_dockerfile: false, // Will be checked separately
        has_docker_compose: false // Will be checked separately
      }));
    } catch (error) {
      logger.error('Error fetching GitHub repositories:', error);
      throw error;
    }
  }

  // Check if repository has Docker files
  async checkDockerFiles(repoName) {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${repoName}/contents`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const files = response.data;
      const hasDockerfile = files.some(file => file.name === 'Dockerfile');
      const hasDockerCompose = files.some(file => file.name === 'docker-compose.yml' || file.name === 'docker-compose.yaml');

      return { hasDockerfile, hasDockerCompose };
    } catch (error) {
      logger.error(`Error checking Docker files for ${repoName}:`, error);
      return { hasDockerfile: false, hasDockerCompose: false };
    }
  }

  // Clone repository
  async cloneRepository(repoName, branch = 'main') {
    try {
      const repoPath = path.join(this.reposPath, repoName);
      
      // Remove existing directory if it exists
      if (await fs.pathExists(repoPath)) {
        await fs.remove(repoPath);
      }

      // Clone repository
      const git = simpleGit();
      await git.clone(`https://github.com/${repoName}.git`, repoPath, ['-b', branch]);
      
      logger.info(`Repository ${repoName} cloned successfully`);
      return repoPath;
    } catch (error) {
      logger.error(`Error cloning repository ${repoName}:`, error);
      throw error;
    }
  }

  // Deploy repository as Docker container
  async deployRepository(repoName, options = {}) {
    try {
      const repoPath = await this.cloneRepository(repoName, options.branch);
      const containerName = options.containerName || repoName.replace('/', '-');
      
      // Check for Docker files
      const dockerfilePath = path.join(repoPath, 'Dockerfile');
      const dockerComposePath = path.join(repoPath, 'docker-compose.yml');
      const dockerComposeYamlPath = path.join(repoPath, 'docker-compose.yaml');

      let containerId;

      if (await fs.pathExists(dockerComposePath) || await fs.pathExists(dockerComposeYamlPath)) {
        // Deploy using Docker Compose
        containerId = await this.deployWithDockerCompose(repoPath, containerName, options);
      } else if (await fs.pathExists(dockerfilePath)) {
        // Deploy using Dockerfile
        containerId = await this.deployWithDockerfile(repoPath, containerName, options);
      } else {
        throw new Error('No Dockerfile or docker-compose.yml found in repository');
      }

      // Save container info to database
      await this.saveContainerInfo(containerId, repoName, options);

      // Set up auto-update webhook
      await this.setupWebhook(repoName);

      logger.info(`Repository ${repoName} deployed successfully as container ${containerId}`);
      return { success: true, containerId, containerName };
    } catch (error) {
      logger.error(`Error deploying repository ${repoName}:`, error);
      throw error;
    }
  }

  // Deploy using Dockerfile
  async deployWithDockerfile(repoPath, containerName, options) {
    try {
      // Build Docker image
      const imageName = `${containerName}:latest`;
      const buildCommand = `docker build -t ${imageName} ${repoPath}`;
      
      logger.info(`Building Docker image: ${buildCommand}`);
      await execAsync(buildCommand);

      // Create and start container
      const portMapping = options.port ? `-p ${options.port}:${options.containerPort || 80}` : '';
      const envVars = options.environment ? Object.entries(options.environment)
        .map(([key, value]) => `-e ${key}=${value}`).join(' ') : '';
      
      const runCommand = `docker run -d --name ${containerName} ${portMapping} ${envVars} ${imageName}`;
      
      logger.info(`Running container: ${runCommand}`);
      const { stdout } = await execAsync(runCommand);
      
      return stdout.trim();
    } catch (error) {
      logger.error('Error deploying with Dockerfile:', error);
      throw error;
    }
  }

  // Deploy using Docker Compose
  async deployWithDockerCompose(repoPath, containerName, options) {
    try {
      // Modify docker-compose.yml if needed
      const composePath = await fs.pathExists(path.join(repoPath, 'docker-compose.yml')) 
        ? path.join(repoPath, 'docker-compose.yml')
        : path.join(repoPath, 'docker-compose.yaml');

      let composeContent = await fs.readFile(composePath, 'utf8');
      
      // Update service names and ports if specified
      if (options.port) {
        composeContent = this.updateComposePorts(composeContent, options.port);
      }

      // Write updated compose file
      await fs.writeFile(composePath, composeContent);

      // Run docker-compose
      const { stdout } = await execAsync(`cd ${repoPath} && docker-compose up -d`);
      
      // Get container ID
      const { stdout: containerId } = await execAsync(`docker ps -q --filter "name=${containerName}"`);
      
      return containerId.trim();
    } catch (error) {
      logger.error('Error deploying with Docker Compose:', error);
      throw error;
    }
  }

  // Update Docker Compose ports
  updateComposePorts(composeContent, port) {
    // Simple regex to update ports in docker-compose.yml
    // This is a basic implementation - you might want to use a YAML parser for more complex cases
    return composeContent.replace(
      /ports:\s*-\s*"(\d+):(\d+)"/g,
      `ports:\n      - "${port}:$2"`
    );
  }

  // Save container information to database
  async saveContainerInfo(containerId, repoName, options) {
    try {
      await Container.create({
        docker_id: containerId,
        name: options.containerName || repoName.replace('/', '-'),
        image: repoName,
        repository: repoName,
        branch: options.branch || 'main',
        port: options.port,
        environment: options.environment || {},
        status: 'running',
        auto_update: options.autoUpdate !== false,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Error saving container info to database:', error);
    }
  }

  // Set up GitHub webhook for auto-updates
  async setupWebhook(repoName) {
    try {
      const webhookUrl = `${process.env.DOMAIN || 'http://localhost:8000'}/webhooks/github`;
      
      const webhookData = {
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: this.webhookSecret
        }
      };

      await axios.post(`${this.baseUrl}/repos/${repoName}/hooks`, webhookData, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      logger.info(`Webhook set up for repository ${repoName}`);
    } catch (error) {
      logger.error(`Error setting up webhook for ${repoName}:`, error);
    }
  }

  // Handle webhook push event
  async handlePushEvent(payload) {
    try {
      const repoName = payload.repository.full_name;
      const branch = payload.ref.replace('refs/heads/', '');
      
      // Check if we have this repository deployed
      const container = await Container.findOne({
        where: { repository: repoName, branch: branch }
      });

      if (!container || !container.auto_update) {
        logger.info(`Repository ${repoName} not deployed or auto-update disabled`);
        return;
      }

      logger.info(`Auto-updating container for repository ${repoName}`);

      // Stop and remove old container
      await execAsync(`docker stop ${container.docker_id}`);
      await execAsync(`docker rm ${container.docker_id}`);

      // Redeploy with new code
      await this.deployRepository(repoName, {
        containerName: container.name,
        branch: branch,
        port: container.port,
        environment: container.environment,
        autoUpdate: true
      });

      logger.info(`Container for ${repoName} updated successfully`);
    } catch (error) {
      logger.error(`Error handling push event for ${payload.repository.full_name}:`, error);
    }
  }

  // Update repository
  async updateRepository(repoName, branch = 'main') {
    try {
      const repoPath = path.join(this.reposPath, repoName);
      
      if (!await fs.pathExists(repoPath)) {
        throw new Error(`Repository ${repoName} not found locally`);
      }

      const git = simpleGit(repoPath);
      await git.pull('origin', branch);
      
      logger.info(`Repository ${repoName} updated successfully`);
      return true;
    } catch (error) {
      logger.error(`Error updating repository ${repoName}:`, error);
      throw error;
    }
  }

  // Get repository branches
  async getRepositoryBranches(repoName) {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${repoName}/branches`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data.map(branch => ({
        name: branch.name,
        commit: branch.commit.sha,
        protected: branch.protected
      }));
    } catch (error) {
      logger.error(`Error fetching branches for ${repoName}:`, error);
      throw error;
    }
  }

  // Get repository commits
  async getRepositoryCommits(repoName, branch = 'main') {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${repoName}/commits`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          sha: branch,
          per_page: 10
        }
      });

      return response.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url
      }));
    } catch (error) {
      logger.error(`Error fetching commits for ${repoName}:`, error);
      throw error;
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }
}

module.exports = GitHubService; 