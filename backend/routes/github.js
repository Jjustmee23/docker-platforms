const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get GitHub repositories
router.get('/repos', async (req, res) => {
  try {
    const token = req.headers['github-token'];
    if (!token) {
      return res.status(400).json({ error: 'GitHub token required' });
    }

    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        sort: 'updated',
        per_page: 100
      }
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching GitHub repos:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get repository details
router.get('/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = req.headers['github-token'];

    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching repository details:', error);
    res.status(500).json({ error: 'Failed to fetch repository details' });
  }
});

// Get repository branches
router.get('/repos/:owner/:repo/branches', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = req.headers['github-token'];

    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Deploy from GitHub
router.post('/deploy', [
  body('repository').notEmpty().withMessage('Repository is required'),
  body('branch').notEmpty().withMessage('Branch is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { repository, branch, environment, dockerfile_path } = req.body;
    const token = req.headers['github-token'];

    // Create deployment record
    const deploymentResult = await pool.query(`
      INSERT INTO deployments (name, type, configuration, status, user_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [
      `Deploy ${repository}/${branch}`,
      'github',
      JSON.stringify({ repository, branch, environment, dockerfile_path }),
      'pending',
      req.user.id
    ]);

    // TODO: Implement actual deployment logic
    // This would involve:
    // 1. Cloning the repository
    // 2. Building the Docker image
    // 3. Deploying the container
    // 4. Updating deployment status

    logger.info(`GitHub deployment initiated: ${repository}/${branch}`);

    res.status(201).json({
      message: 'Deployment initiated',
      deployment: deploymentResult.rows[0]
    });

  } catch (error) {
    logger.error('Error initiating GitHub deployment:', error);
    res.status(500).json({ error: 'Failed to initiate deployment' });
  }
});

// Get deployment status
router.get('/deploy/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM deployments WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting deployment status:', error);
    res.status(500).json({ error: 'Failed to get deployment status' });
  }
});

// Webhook handler for GitHub events
router.post('/webhook', async (req, res) => {
  try {
    const { ref, repository, commits } = req.body;
    
    // Handle push events
    if (req.headers['x-github-event'] === 'push') {
      logger.info(`GitHub push event received for ${repository.full_name}:${ref}`);
      
      // TODO: Implement automatic deployment logic
      // This could trigger deployments based on branch or commit messages
    }

    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router; 