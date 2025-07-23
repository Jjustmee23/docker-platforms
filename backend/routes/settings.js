const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get user settings
router.get('/user', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, role, created_at, 
             theme, language, timezone, notifications_enabled
      FROM users 
      WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting user settings:', error);
    res.status(500).json({ error: 'Failed to get user settings' });
  }
});

// Update user settings
router.put('/user', [
  body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme'),
  body('language').optional().isIn(['en', 'nl', 'de', 'fr']).withMessage('Invalid language'),
  body('timezone').optional().isString().withMessage('Invalid timezone'),
  body('notifications_enabled').optional().isBoolean().withMessage('Notifications must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { theme, language, timezone, notifications_enabled } = req.body;

    const result = await pool.query(`
      UPDATE users 
      SET theme = COALESCE($1, theme),
          language = COALESCE($2, language),
          timezone = COALESCE($3, timezone),
          notifications_enabled = COALESCE($4, notifications_enabled),
          updated_at = NOW()
      WHERE id = $5 
      RETURNING id, username, email, role, theme, language, timezone, notifications_enabled
    `, [theme, language, timezone, notifications_enabled, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User settings updated for user ${req.user.id}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Change password
router.put('/password', [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { current_password, new_password } = req.body;

    // Get current user with password
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    logger.info(`Password changed for user ${req.user.id}`);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get system settings
router.get('/system', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM system_settings 
      ORDER BY key
    `);

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    logger.error('Error getting system settings:', error);
    res.status(500).json({ error: 'Failed to get system settings' });
  }
});

// Update system settings
router.put('/system', async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO system_settings (key, value, updated_by, updated_at) 
        VALUES ($1, $2, $3, NOW()) 
        ON CONFLICT (key) 
        DO UPDATE SET 
          value = EXCLUDED.value,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `, [key, value, req.user.id]);
    }

    logger.info(`System settings updated by user ${req.user.id}`);

    res.json({ message: 'System settings updated successfully' });
  } catch (error) {
    logger.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// Get API keys
router.get('/api-keys', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, key_prefix, created_at, last_used_at, is_active
      FROM api_keys 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting API keys:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Create API key
router.post('/api-keys', [
  body('name').notEmpty().withMessage('API key name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: errors.array() 
      });
    }

    const { name } = req.body;
    const crypto = require('crypto');
    
    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = apiKey.substring(0, 8);

    const result = await pool.query(`
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, key_prefix, created_at
    `, [req.user.id, name, apiKey, keyPrefix]);

    logger.info(`API key created for user ${req.user.id}: ${name}`);

    res.status(201).json({
      ...result.rows[0],
      api_key: apiKey // Only show full key once
    });
  } catch (error) {
    logger.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Delete API key
router.delete('/api-keys/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM api_keys 
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    logger.info(`API key deleted: ${req.params.id}`);

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    logger.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

module.exports = router; 