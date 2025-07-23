const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all domains
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, c.name as container_name 
      FROM domains d 
      LEFT JOIN containers c ON d.container_id = c.docker_id 
      ORDER BY d.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting domains:', error);
    res.status(500).json({ error: 'Failed to get domains' });
  }
});

// Get domain by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, c.name as container_name 
      FROM domains d 
      LEFT JOIN containers c ON d.container_id = c.docker_id 
      WHERE d.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting domain:', error);
    res.status(500).json({ error: 'Failed to get domain' });
  }
});

// Create new domain
router.post('/', [
  body('name').notEmpty().withMessage('Domain name is required'),
  body('container_id').notEmpty().withMessage('Container ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { name, container_id, ssl_enabled = false, ssl_certificate, ssl_key } = req.body;

    // Check if domain already exists
    const existingDomain = await pool.query(
      'SELECT id FROM domains WHERE name = $1',
      [name]
    );

    if (existingDomain.rows.length > 0) {
      return res.status(409).json({ error: 'Domain already exists' });
    }

    const result = await pool.query(`
      INSERT INTO domains (name, container_id, ssl_enabled, ssl_certificate, ssl_key, status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [name, container_id, ssl_enabled, ssl_certificate, ssl_key, 'pending']);

    logger.info(`Domain created: ${name} for container ${container_id}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating domain:', error);
    res.status(500).json({ error: 'Failed to create domain' });
  }
});

// Update domain
router.put('/:id', [
  body('name').notEmpty().withMessage('Domain name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { name, container_id, ssl_enabled, ssl_certificate, ssl_key } = req.body;

    const result = await pool.query(`
      UPDATE domains 
      SET name = $1, container_id = $2, ssl_enabled = $3, ssl_certificate = $4, ssl_key = $5, updated_at = NOW() 
      WHERE id = $6 
      RETURNING *
    `, [name, container_id, ssl_enabled, ssl_certificate, ssl_key, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    logger.info(`Domain updated: ${req.params.id}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating domain:', error);
    res.status(500).json({ error: 'Failed to update domain' });
  }
});

// Update domain status
router.patch('/:id/status', [
  body('status').isIn(['pending', 'active', 'error']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { status } = req.body;

    const result = await pool.query(`
      UPDATE domains 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `, [status, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    logger.info(`Domain ${req.params.id} status updated to ${status}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating domain status:', error);
    res.status(500).json({ error: 'Failed to update domain status' });
  }
});

// Enable/disable SSL
router.patch('/:id/ssl', [
  body('ssl_enabled').isBoolean().withMessage('SSL enabled must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { ssl_enabled, ssl_certificate, ssl_key } = req.body;

    const result = await pool.query(`
      UPDATE domains 
      SET ssl_enabled = $1, ssl_certificate = $2, ssl_key = $3, updated_at = NOW() 
      WHERE id = $4 
      RETURNING *
    `, [ssl_enabled, ssl_certificate, ssl_key, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    logger.info(`Domain ${req.params.id} SSL ${ssl_enabled ? 'enabled' : 'disabled'}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating domain SSL:', error);
    res.status(500).json({ error: 'Failed to update domain SSL' });
  }
});

// Delete domain
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM domains WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    logger.info(`Domain deleted: ${req.params.id}`);

    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    logger.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

// Get SSL certificate info
router.get('/:id/ssl', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT ssl_enabled, ssl_certificate, ssl_key, ssl_expires_at FROM domains WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting SSL info:', error);
    res.status(500).json({ error: 'Failed to get SSL info' });
  }
});

module.exports = router; 