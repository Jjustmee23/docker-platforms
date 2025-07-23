const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all deployments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.username as deployed_by 
      FROM deployments d 
      LEFT JOIN users u ON d.user_id = u.id 
      ORDER BY d.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting deployments:', error);
    res.status(500).json({ error: 'Failed to get deployments' });
  }
});

// Get deployment by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.username as deployed_by 
      FROM deployments d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE d.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting deployment:', error);
    res.status(500).json({ error: 'Failed to get deployment' });
  }
});

// Create new deployment
router.post('/', [
  body('name').notEmpty().withMessage('Deployment name is required'),
  body('type').isIn(['container', 'stack', 'compose']).withMessage('Invalid deployment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { name, type, configuration, description } = req.body;

    const result = await pool.query(`
      INSERT INTO deployments (name, type, configuration, description, status, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [name, type, JSON.stringify(configuration), description, 'pending', req.user.id]);

    logger.info(`Deployment created: ${name} by user ${req.user.username}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating deployment:', error);
    res.status(500).json({ error: 'Failed to create deployment' });
  }
});

// Update deployment status
router.patch('/:id/status', [
  body('status').isIn(['pending', 'running', 'completed', 'failed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { status, logs } = req.body;

    const result = await pool.query(`
      UPDATE deployments 
      SET status = $1, logs = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING *
    `, [status, logs, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    logger.info(`Deployment ${req.params.id} status updated to ${status}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating deployment status:', error);
    res.status(500).json({ error: 'Failed to update deployment status' });
  }
});

// Delete deployment
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM deployments WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    logger.info(`Deployment deleted: ${req.params.id}`);

    res.json({ message: 'Deployment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting deployment:', error);
    res.status(500).json({ error: 'Failed to delete deployment' });
  }
});

module.exports = router; 